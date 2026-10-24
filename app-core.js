/* 모바일 편성 허브 v2 — 상태·조회 기간·집계·플래그·링크 상태 (화면 렌더는 app-views.js, app-report.js) */
'use strict';
const VIEWS=['brief','map','team','event','report','guide'];
const PRESETS={d1:'전일',d7:'7일',d30:'30일',m0:'이번 달',m1:'전월'};
const TITLES={brief:['브리핑','조회 기간의 편성 자원·실적·트래픽을 한 장으로 봅니다. 증감은 직전 같은 길이 기간과 비교합니다.'],
 map:['구좌 지도','앱 화면 순서대로 놓인 편성 구좌와 각 구좌의 성과를 함께 봅니다. 구좌를 누르면 캡처·설명·행사가 오른쪽에 나옵니다.'],
 team:['영업팀','팀이 쓴 편성 자원과 거둔 매출을 나란히 놓고 4개 효율 그룹으로 나눕니다.'],
 event:['전시 행사','행사(배너) 단위 구좌 유입 실적. 행사·MD TOP 5를 먼저 보고, 더 보기로 전체 목록을 폅니다.'],
 report:['데일리 리포트','기준일 전일 마감 기준의 변동, 검증 플래그, 리포트 초안.'],
 guide:['기준','지표 정의, 화면 구성 근거, 링크 규칙.']};
const METRICS={sales:['구좌 발생 매출',v=>fmt.money(v)],clk:['클릭수',v=>fmt.cnt(v)],w:['가중치',v=>fmt.pct(v)],perBn:['배너 1개당 매출',v=>fmt.money(v)],ratio:['구좌 매출 비중',v=>fmt.pct(v)],rb:['재구매율',v=>fmt.pct(v)]};
const GROUPS={1:['1그룹','고효율'],2:['2그룹','준효율'],3:['3그룹','비활성'],4:['4그룹','저효율']};
const DEF={view:'brief',preset:'d7',sortKey:'sales',sortDir:-1,metric:'sales',scr:'home'};
const state={view:'brief',preset:'d7',from:0,to:0,team:'',md:'',brand:'',slot:'',sort:{key:'sales',dir:-1},metric:'sales',pick:'',scr:'home',moreE:false,moreM:false,limit:50};

/* ---------- 표기 ---------- */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt={
  money:v=>{if(v==null||!isFinite(v))return '-';const a=Math.abs(v),s=v<0?'-':'';if(a>=1e8)return s+(a/1e8).toFixed(1)+'억원';if(a>=1e6)return s+(a/1e6).toFixed(1)+'백만원';if(a>=1e4)return s+Math.round(a/1e4).toLocaleString('ko-KR')+'만원';return s+Math.round(a).toLocaleString('ko-KR')+'원';},
  cnt:v=>v==null||!isFinite(v)?'-':Math.round(v).toLocaleString('ko-KR'),
  n1:v=>v==null||!isFinite(v)?'-':(Math.round(v*10)/10).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1}),
  pct:(v,d=1)=>v==null||!isFinite(v)?'-':(v*100).toFixed(d)+'%',
  pp:v=>v==null||!isFinite(v)?'-':(v>0?'+':'')+(v*100).toFixed(1)+'%p',
  date:iso=>iso.replace(/-/g,'.'),mmdd:iso=>iso.slice(5).replace('-','.')};
function deltaHTML(c,p,kind){
  if(p==null||!isFinite(p)||p===0||c==null||!isFinite(c))return '<span class="flat">비교값 없음</span>';
  const g=(c-p)/Math.abs(p);const cls=Math.abs(g)<0.005?'flat':g>0?'up':'down';const arrow=cls==='up'?'▲':cls==='down'?'▼':'·';
  const amt=kind==='pct'?fmt.pp(c-p):kind==='cnt'?(c-p>0?'+':'')+fmt.cnt(c-p):(c-p>0?'+':'')+fmt.money(c-p);
  return `<span class="${cls}">${arrow} ${(Math.abs(g)*100).toFixed(1)}%</span> <span class="amt">${amt}</span>`;}

/* ---------- 조회 기간 ---------- */
const monthStart=i=>dayIdx(DATES[i].slice(0,8)+'01');
function presetRange(k){const L=LAST;let a,b=L;
  if(k==='d1')a=L;else if(k==='d7')a=L-6;else if(k==='d30')a=L-29;else if(k==='m0')a=monthStart(L);else if(k==='m1'){b=monthStart(L)-1;a=monthStart(b);}else a=L-6;
  return {a:Math.max(0,a),b};}
function matchPreset(a,b){for(const k in PRESETS){const r=presetRange(k);if(r.a===a&&r.b===b)return k;}return '';}
function applyPreset(k){if(!PRESETS[k])k='d7';const r=presetRange(k);state.preset=k;state.from=r.a;state.to=r.b;}
function applyCustom(f,t){let a=dayIdx(f),b=dayIdx(t);if(!isFinite(a)||!isFinite(b))return false;
  a=Math.min(Math.max(0,a),LAST);b=Math.min(Math.max(0,b),LAST);if(a>b){const x=a;a=b;b=x;}state.from=a;state.to=b;state.preset=matchPreset(a,b);return true;}
function periodRange(){return {a:state.from,b:state.to};}
function prevRange(r){const len=r.b-r.a+1;const b=r.a-1,a=Math.max(0,b-len+1);return b<0?null:{a,b,partial:b-a+1<len};}
function rangeLabel(r){return r.a===r.b?fmt.date(DATES[r.a]):fmt.date(DATES[r.a])+' ~ '+fmt.date(DATES[r.b]);}
function periodWord(){return state.preset?PRESETS[state.preset]+(state.preset==='d1'?'':' 합계'):'선택 기간';}

/* ---------- 집계 ---------- */
const sumBy=(a,b,f)=>{let s=0;for(let d=a;d<=b;d++)s+=f(DAILY[d],d);return s;};
function aggSlots(r){
  const days=r.b-r.a+1;
  const rows=SLOTS.map((s,i)=>{let sales=0,clk=0,clkDays=0,bn=0,tot=0;
    for(let d=r.a;d<=r.b;d++){const x=DAILY[d].slots[i];sales+=x.sales;tot+=x.tot;bn+=x.bn;if(x.clk!=null){clk+=x.clk;clkDays++;}}
    return {slot:s,i,sales,clk,clkDays,bn,tot,days,aSales:sales/days,aClk:clkDays?clk/clkDays:null,aBn:bn/days,aTot:tot/days,ratio:tot?sales/tot:null,rb:s.rb};});
  const S=rows.reduce((x,y)=>x+y.sales,0),C=rows.reduce((x,y)=>x+(y.clk||0),0);
  rows.forEach(x=>{x.sShare=S?x.sales/S:0;x.cShare=C?(x.clk||0)/C:0;x.w=0.5*x.sShare+0.5*x.cShare;x.perBn=x.aBn?x.aSales/x.aBn:null;x.clkPerBn=x.aBn&&x.aClk!=null?x.aClk/x.aBn:null;});
  const tot=rows.reduce((x,y)=>x+y.tot,0);
  return {rows:rows.slice().sort((x,y)=>y.w-x.w),S,C,T:tot,days,weights:rows.map(x=>x.w),byCode:new Map(rows.map(x=>[x.slot.code,x]))};}
function aggAuto(r){const days=r.b-r.a+1;return AUTO_SLOTS.map((s,i)=>{let sales=0,clk=0,tot=0;for(let d=r.a;d<=r.b;d++){const x=DAILY[d].auto[i];sales+=x.sales;clk+=x.clk;tot+=x.tot;}
  return {slot:s,sales,clk,tot,aSales:sales/days,aClk:clk/days,aBn:s.bn,aTot:tot/days,ratio:tot?sales/tot:null,perBn:sales/days/s.bn,clkPerBn:clk/days/s.bn,rb:s.rb};});}
function aggTeams(r,weights){
  const rows=TEAMS.map((t,ti)=>{let cnt=0,w=0,sales=0;const bySlot=SLOTS.map(()=>0);
    for(let d=r.a;d<=r.b;d++){const x=DAILY[d].team[ti];sales+=x.sales;x.cnt.forEach((c,i)=>{cnt+=c;w+=c*(1+weights[i]);bySlot[i]+=c;});}
    return {team:t,cnt,wcnt:w,sales,profit:sales*t.m,rate:t.m,bySlot};});
  const W=rows.reduce((x,y)=>x+y.wcnt,0),S=rows.reduce((x,y)=>x+y.sales,0);const act=rows.filter(x=>x.wcnt>0);const n=act.length||1;
  rows.forEach(x=>{x.share=W?x.wcnt/W:0;x.sShare=S?x.sales/S:0;x.per1=x.share>0?x.sales/(x.share*100):null;x.pPer1=x.share>0?x.profit/(x.share*100):null;});
  const avgShare=1/n,avgPer1=act.reduce((a,x)=>a+(x.per1||0),0)/n,avgX=act.reduce((a,x)=>a+x.sales,0)/n,avgY=act.reduce((a,x)=>a+x.wcnt,0)/n;
  rows.forEach(x=>{x.shareDiff=x.share-avgShare;x.per1Diff=x.per1!=null?x.per1-avgPer1:null;x.group=x.wcnt>0?(x.sales>=avgX?(x.wcnt<=avgY?1:2):(x.wcnt<=avgY?3:4)):null;});
  const counts={1:0,2:0,3:0,4:0};rows.forEach(x=>{if(x.group)counts[x.group]++;});
  return {rows,W,S,P:rows.reduce((x,y)=>x+y.profit,0),avgShare,avgPer1,avgX,avgY,counts,n};}
function aggTraffic(r){const days=r.b-r.a+1;return PV_TABS.map((t,i)=>({tab:t,avg:sumBy(r.a,r.b,x=>x.pv[i])/days}));}
function bannersIn(r){return BANNERS.filter(b=>b.start<=r.b&&b.end>=r.a);}
function matchesFilters(b){return (!state.team||b.team===state.team)&&(!state.md||b.md===state.md)&&(!state.brand||b.brand===state.brand)&&(!state.slot||b.slot.code===state.slot);}
function filtered(r){return bannersIn(r).filter(matchesFilters);}
function groupTop(list,keyFn){const m=new Map();list.forEach(b=>{const k=keyFn(b);const o=m.get(k)||{key:k,n:0,sales:0,tot:0,first:b};o.n++;o.sales+=b.sales;o.tot+=b.tot;m.set(k,o);});return [...m.values()].sort((a,b)=>b.sales-a.sales);}
function seriesFor(r,f){const out=[];for(let d=r.a;d<=r.b;d++)out.push(f(DAILY[d],d));return out;}
function bucketize(r){const len=r.b-r.a+1;const kind=len<=45?'d':len<=200?'w':'m';const groups=[];
  for(let d=r.a;d<=r.b;d++){const key=kind==='d'?DATES[d]:kind==='w'?Math.floor((d-r.a)/7):DATES[d].slice(0,7);
    if(!groups.length||groups[groups.length-1].key!==key)groups.push({key,a:d,b:d});else groups[groups.length-1].b=d;}
  return {kind,groups,labels:groups.map(g=>kind==='d'?fmt.mmdd(DATES[g.a]):kind==='w'?fmt.mmdd(DATES[g.a])+'~':g.key.slice(2))};}
function bucketSeries(r,f){const b=bucketize(r);return {labels:b.labels,kind:b.kind,vals:b.groups.map(g=>{let s=0;for(let d=g.a;d<=g.b;d++)s+=f(DAILY[d]);return s;})};}
const sSales=x=>x.slots.reduce((a,y)=>a+y.sales,0),sClk=x=>x.slots.reduce((a,y)=>a+(y.clk||0),0),sTot=x=>x.slots.reduce((a,y)=>a+y.tot,0);
function slotMetric(row,k){return k==='sales'?row.sales:k==='clk'?row.clk:k==='w'?row.w:k==='perBn'?row.perBn:k==='ratio'?row.ratio:row.rb;}
function slotValues(slots,k){const rows=slots.rows.map(x=>({code:x.slot.code,v:slotMetric(x,k)})).filter(x=>x.v!=null&&isFinite(x.v)).sort((a,b)=>b.v-a.v);
  const m=new Map();rows.forEach((x,i)=>m.set(x.code,{v:x.v,rank:i,text:METRICS[k][1](x.v)}));return m;}

/* ---------- 기준일 검증 플래그 + 원인 분류 ---------- */
const CAUSES={scale:['실제 성과 변동 또는 편성 변경','전일 대비 급감. 같은 날 다른 구좌는 정상 범위. 편성표 변경(배너 교체) 여부 확인','중간'],
 sign:['취소 소급(접수일자 기준)','노출 기간 이전 주문의 취소가 기준일에 접수되어 전체 실적이 음수. 데이터 규칙상 알려진 패턴','높음'],
 newcode:['신규 코드 미등록','마스터(구좌명 재정의)에 없는 전시영역코드가 raw에 출현. 분류·광고여부는 사람 승인 필요','낮음'],
 traffic:['트래픽 데이터 지연·결측','클릭 원천에서 해당 구좌 값이 비어 있음. 실적은 정상 수신. 재수신 대기 후 재계산','중간'],
 group:['편성 사용량 변동','가중치 반영 사용량이 평균선을 넘나들어 그룹이 바뀜. 월 마감 수치와 대조','중간']};
function buildFlags(){
  const L=LAST,flags=[];let n=1;const add=(rule,target,sev,obs,ref,k)=>{const c=CAUSES[k];flags.push({id:'F'+String(n++).padStart(3,'0'),rule,target,sev,obs,ref,cause:c[0],basis:c[1],conf:c[2],human:c[2]==='낮음'||sev==='높음'});};
  SLOTS.forEach((s,i)=>{let base=0,c=0;for(let d=L-7;d<L;d++){base+=DAILY[d].slots[i].sales;c++;}base/=c;const v=DAILY[L].slots[i].sales;const g=v/base;
    if(g<0.6||g>1.6)add('규모 검사 (구좌 발생 매출 급변)',s.name,g<0.5||g>2?'높음':'중간',fmt.money(v)+' ('+(g>1?'+':'')+((g-1)*100).toFixed(0)+'%)','직전 7일 평균 '+fmt.money(base),'scale');
    if(DAILY[L].slots[i].clk==null)add('트래픽 결측 검사',s.name,'중간','기준일 클릭수 없음','직전일 '+fmt.cnt(DAILY[L-1].slots[i].clk)+'건','traffic');});
  BANNERS.filter(b=>b.end===L&&b.tot<0).forEach(b=>add('부호 검사 (음수 전체 실적)',b.title+' · '+b.slot.name,'높음',fmt.money(b.tot),'0원 이상','sign'));
  add('신규 코드 검사',NEW_CODE.code,'중간',NEW_CODE.rows+'행 출현 ('+NEW_CODE.name+')','마스터 등록 코드 99종','newcode');
  const w=aggSlots(presetRange('m0')).weights;const cur=aggTeams(presetRange('m0'),w),prv=aggTeams(presetRange('m1'),w);
  cur.rows.forEach((x,i)=>{const p=prv.rows[i];if(x.group&&p.group&&x.group!==p.group&&flags.length<9)add('그룹 변동 검사',x.team.name,'낮음',GROUPS[x.group][0]+' '+GROUPS[x.group][1],'전월 '+GROUPS[p.group][0]+' '+GROUPS[p.group][1],'group');});
  return flags;}

/* ---------- 링크 상태 ---------- */
function parseHash(){const h=(location.hash||'').replace(/^#/,'');const o={view:'brief',team:'',md:'',brand:'',slot:'',sortKey:'sales',sortDir:-1,metric:'sales',pick:'',scr:'home',preset:'d7',range:null};if(!h)return o;
  h.split('&').forEach(kv=>{const i=kv.indexOf('=');if(i<0)return;const k=kv.slice(0,i),v=decodeURIComponent(kv.slice(i+1));
    if(k==='v'&&VIEWS.includes(v))o.view=v;else if(k==='p'){if(PRESETS[v])o.preset=v;else{const m=/^(\d{4}-\d{2}-\d{2})~(\d{4}-\d{2}-\d{2})$/.exec(v);if(m)o.range=[m[1],m[2]];}}
    else if(k==='t'&&TEAMS.some(t=>t.name===v))o.team=v;else if(k==='m'&&MDS.some(x=>x.code===v))o.md=v;else if(k==='b'&&BRAND_LIST.includes(v))o.brand=v;
    else if(k==='s'&&SLOTS.some(s=>s.code===v))o.slot=v;else if(k==='x'&&METRICS[v])o.metric=v;else if(k==='k'&&SLOTS.some(s=>s.code===v))o.pick=v;else if(k==='c'&&SCREENS.some(s=>s[0]===v))o.scr=v;
    else if(k==='o'){const m=/^([a-z]+):(a|d)$/.exec(v);if(m){o.sortKey=m[1];o.sortDir=m[2]==='a'?1:-1;}}});
  return o;}
function applyHash(){const s=parseHash();state.view=s.view;state.team=s.team;state.md=s.md;state.brand=s.brand;state.slot=s.slot;state.sort={key:s.sortKey,dir:s.sortDir};state.metric=s.metric;state.pick=s.pick;state.scr=s.scr;state.limit=50;state.moreE=false;state.moreM=false;
  if(s.range&&applyCustom(s.range[0],s.range[1]))return;applyPreset(s.preset);}
function serialize(){const a=[];const add=(k,v)=>a.push(k+'='+encodeURIComponent(v));
  if(state.view!==DEF.view)add('v',state.view);if(state.preset!==DEF.preset)add('p',state.preset||(DATES[state.from]+'~'+DATES[state.to]));
  if(state.team)add('t',state.team);if(state.md)add('m',state.md);if(state.brand)add('b',state.brand);if(state.slot)add('s',state.slot);
  if(state.metric!==DEF.metric)add('x',state.metric);if(state.pick)add('k',state.pick);if(state.scr!==DEF.scr)add('c',state.scr);
  if(state.sort.key!==DEF.sortKey||state.sort.dir!==DEF.sortDir)add('o',state.sort.key+':'+(state.sort.dir>0?'a':'d'));return a.join('&');}
function writeHash(push){const h=serialize();if(h===(location.hash||'').replace(/^#/,''))return;try{const base=location.href.split('#')[0];const u=h?base+'#'+h:base;if(push)history.pushState(null,'',u);else history.replaceState(null,'',u);}catch(e){}}
function currentURL(){const h=serialize();return location.href.split('#')[0]+(h?'#'+h:'');}

/* ---------- 알림·툴팁·공통 ---------- */
let toastT=0;function toast(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true;},2600);}
async function copyLink(){const url=currentURL();let ok=false;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url);ok=true;}}catch(e){ok=false;}
  if(!ok){try{const ta=document.createElement('textarea');ta.value=url;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(ta);ta.select();ok=document.execCommand('copy');ta.remove();}catch(e){ok=false;}}
  toast(ok?'현재 화면의 링크를 복사했습니다':'복사하지 못했습니다. 주소창의 링크를 직접 복사해 주세요');}
function showTip(html,x,y){const t=document.getElementById('tip');if(!t)return;t.innerHTML=html;t.style.display='block';const w=t.offsetWidth||200,h=t.offsetHeight||60,W=window.innerWidth||1200,H=window.innerHeight||800;t.style.left=Math.min(W-w-8,x+14)+'px';t.style.top=(y+18+h>H?y-h-10:y+18)+'px';}
function hideTip(){const t=document.getElementById('tip');if(t)t.style.display='none';}
function groupPill(g){return g?`<span class="gpill g${g}">${GROUPS[g][0]} ${GROUPS[g][1]}</span>`:'<span class="pill">편성 없음</span>';}
function heatCell(v,min,max,text){const t=max>min?(v-min)/(max-min):0;const c=heat(t*0.75);return `<td class="num heat"><i style="background:${c.bg};opacity:.55"></i><span>${text}</span></td>`;}
const td=(v,num)=>`<td${num?' class="num"':''}>${v}</td>`;
const th=(label,key,num,cur)=>`<th class="${num?'num ':''}${key?'sortable':''}"${key?` data-key="${key}"`:''}>${label}${cur&&cur.key===key?(cur.dir>0?' ▲':' ▼'):''}</th>`;

/* ---------- 조회 조건 UI ---------- */
function fillFilterOptions(){const g=id=>document.getElementById(id);
  g('fSlot').innerHTML='<option value="">전체</option>'+SLOTS.map(s=>`<option value="${esc(s.code)}">${esc(s.name)}</option>`).join('');
  g('dlTeam').innerHTML=TEAMS.map(t=>`<option value="${esc(t.name)}">${esc(t.bu)}</option>`).join('');
  g('dlMD').innerHTML=MDS.map(m=>`<option value="${esc(m.code)}">${esc(m.team)} · ${esc(m.cat)}</option>`).join('');
  g('dlBrand').innerHTML=BRAND_LIST.map(b=>`<option value="${esc(b)}"></option>`).join('');
  g('presets').innerHTML=Object.keys(PRESETS).map(k=>`<button type="button" data-preset="${k}">${PRESETS[k]}</button>`).join('');
  g('fFrom').min=META.dataMin;g('fFrom').max=META.dataMax;g('fTo').min=META.dataMin;g('fTo').max=META.dataMax;}
function syncFilterInputs(){const g=id=>document.getElementById(id);g('fFrom').value=DATES[state.from];g('fTo').value=DATES[state.to];g('fTeam').value=state.team;g('fMD').value=state.md;g('fBrand').value=state.brand;g('fSlot').value=state.slot;
  document.querySelectorAll('#presets button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.preset===state.preset?'true':'false'));}
function renderChips(r){const c=document.getElementById('chips');const parts=[`<span class="chip base">기준일 ${fmt.date(META.baseDate)} 마감 · ${state.preset?PRESETS[state.preset]+' · ':''}${rangeLabel(r)}</span>`];
  const chip=(k,label)=>parts.push(`<span class="chip">${esc(label)} <button type="button" data-clear="${k}" title="조건 지우기">×</button></span>`);
  if(state.team)chip('team','팀 '+state.team);if(state.md){const m=MDS.find(x=>x.code===state.md);chip('md','MD '+state.md+(m?' ('+m.team+')':''));}
  if(state.brand)chip('brand','브랜드 '+state.brand);if(state.slot){const s=SLOTS.find(x=>x.code===state.slot);if(s)chip('slot','구좌 '+s.name);}
  c.innerHTML=parts.join('');}
function resetFilters(){state.team='';state.md='';state.brand='';state.slot='';applyPreset('d7');state.limit=50;state.moreE=false;state.moreM=false;render();}

function render(push){
  const r=periodRange(),p=prevRange(r);syncFilterInputs();renderChips(r);
  document.querySelectorAll('.view').forEach(v=>{v.hidden=v.id!=='view-'+state.view;});
  document.querySelectorAll('.tabs button').forEach(b=>{if(b.dataset.view===state.view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  document.getElementById('pageTitle').textContent=TITLES[state.view][0];document.getElementById('pageSub').textContent=TITLES[state.view][1];document.title=TITLES[state.view][0]+' · '+APP.name;
  document.getElementById('cond').hidden=state.view==='guide'||state.view==='report';
  const ctx={r,p,slots:aggSlots(r),prev:p?aggSlots(p):null};ctx.teams=aggTeams(r,ctx.slots.weights);ctx.prevTeams=p?aggTeams(p,ctx.slots.weights):null;
  if(V[state.view])V[state.view](ctx);writeHash(!!push);}
const V={};
