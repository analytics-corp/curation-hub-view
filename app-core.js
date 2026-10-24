/* 모바일 편성 허브 — 상태·기간·집계·플래그 (화면 렌더는 app-views.js, 차트는 app-charts.js) */
'use strict';
const PERIODS={d1:'전일',d7:'최근 7일',d30:'최근 30일',m0:'이번 달',m1:'전월',ytd:'연초 누계'};
const VIEWS=['home','slot','team','event','daily','guide'];
const TITLES={home:['오늘의 허브','기준일 전일 마감 기준으로 편성 자원·실적·트래픽 3종 정보를 한 화면에 모았습니다.'],
 slot:['구좌별 현황','편성 구좌별 가중치·구좌 발생 매출·클릭·재구매율. 리포트 1번 시트의 표 구성을 일 단위로 옮겼습니다.'],
 team:['영업팀별 현황','편성 사용량 대비 매출을 4개 효율 그룹으로 분류합니다. 리포트 2번 시트와 시각화 차트(Ver.12) 기준.'],
 event:['전시 행사별 현황','행사(배너) 단위 구좌 유입 실적과 기여도. MD코드를 누르면 해당 MD의 행사만 모아 봅니다.'],
 daily:['편성 데일리 리포트','매일 1회 산출되는 리포트 초안. 검증 플래그와 에이전트 판단은 구현 목표 단계의 예시입니다.'],
 guide:['기준 안내','지표 정의, 상태 라벨, 데이터 기준, 모듈 구성, 링크 공유와 갱신 방식.']};
const DEFAULTS={view:'home',period:'d7',team:'',slot:'',q:'',sortKey:'sales',sortDir:-1};
const state={view:'home',period:'d7',team:'',slot:'',q:'',sort:{key:'sales',dir:-1},limit:50};
const GROUPS={1:['1그룹','고효율'],2:['2그룹','준효율'],3:['3그룹','비활성'],4:['4그룹','저효율']};

/* ---------- 표기 ---------- */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt={
  money:v=>{if(v==null||!isFinite(v))return '-';const a=Math.abs(v),s=v<0?'-':'';
    if(a>=1e8)return s+(a/1e8).toFixed(1)+'억원';if(a>=1e6)return s+(a/1e6).toFixed(1)+'백만원';if(a>=1e4)return s+Math.round(a/1e4).toLocaleString('ko-KR')+'만원';return s+Math.round(a).toLocaleString('ko-KR')+'원';},
  cnt:v=>v==null||!isFinite(v)?'-':Math.round(v).toLocaleString('ko-KR'),
  n1:v=>v==null||!isFinite(v)?'-':(Math.round(v*10)/10).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1}),
  pct:(v,d=1)=>v==null||!isFinite(v)?'-':(v*100).toFixed(d)+'%',
  pp:v=>v==null||!isFinite(v)?'-':(v>0?'+':'')+(v*100).toFixed(1)+'%p',
  date:iso=>iso.replace(/-/g,'.'),
};
function deltaHTML(c,p,kind){
  if(p==null||!isFinite(p)||p===0||c==null||!isFinite(c))return '<span class="flat">비교값 없음</span>';
  const g=(c-p)/Math.abs(p);const cls=Math.abs(g)<0.005?'flat':g>0?'up':'down';const arrow=cls==='up'?'▲':cls==='down'?'▼':'·';
  const amt=kind==='pct'?fmt.pp(c-p):kind==='cnt'?fmt.cnt(c-p):fmt.money(c-p);
  return `<span class="${cls}">${arrow} ${(Math.abs(g)*100).toFixed(1)}%</span><span class="amt">${amt}</span>`;
}

/* ---------- 기간 ---------- */
const monthStart=i=>dayIdx(DATES[i].slice(0,8)+'01');
function periodRange(p){
  const L=LAST;let a,b=L;
  if(p==='d1')a=L;else if(p==='d7')a=L-6;else if(p==='d30')a=L-29;
  else if(p==='m0')a=monthStart(L);
  else if(p==='m1'){b=monthStart(L)-1;a=monthStart(b);}
  else if(p==='ytd')a=dayIdx(DATES[L].slice(0,4)+'-01-01');
  else a=L-6;
  a=Math.max(0,a);return {a,b};
}
function prevRange(r){const len=r.b-r.a+1;const b=r.a-1,a=Math.max(0,b-len+1);return b<0?null:{a,b,partial:b-a+1<len};}
function rangeLabel(r){return r.a===r.b?fmt.date(DATES[r.a]):fmt.date(DATES[r.a])+' ~ '+fmt.date(DATES[r.b]);}

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
  return {rows:rows.slice().sort((x,y)=>y.w-x.w),S,C,T:tot,days,weights:rows.map(x=>x.w)};
}
function aggAuto(r){const days=r.b-r.a+1;return AUTO_SLOTS.map((s,i)=>{let sales=0,clk=0,tot=0;for(let d=r.a;d<=r.b;d++){const x=DAILY[d].auto[i];sales+=x.sales;clk+=x.clk;tot+=x.tot;}
  return {slot:s,sales,clk,tot,aSales:sales/days,aClk:clk/days,aBn:s.bn,aTot:tot/days,ratio:tot?sales/tot:null,perBn:sales/days/s.bn,clkPerBn:clk/days/s.bn,rb:s.rb};});}
function aggTeams(r,weights){
  const rows=TEAMS.map((t,ti)=>{let cnt=0,w=0,sales=0;const bySlot=SLOTS.map(()=>0);
    for(let d=r.a;d<=r.b;d++){const x=DAILY[d].team[ti];sales+=x.sales;x.cnt.forEach((c,i)=>{cnt+=c;w+=c*(1+weights[i]);bySlot[i]+=c;});}
    return {team:t,cnt,wcnt:w,sales,profit:sales*t.m,rate:t.m,bySlot};});
  const W=rows.reduce((x,y)=>x+y.wcnt,0),S=rows.reduce((x,y)=>x+y.sales,0);
  const act=rows.filter(x=>x.wcnt>0);const n=act.length||1;
  rows.forEach(x=>{x.share=W?x.wcnt/W:0;x.per1=x.share>0?x.sales/(x.share*100):null;x.pPer1=x.share>0?x.profit/(x.share*100):null;});
  const avgShare=1/n,avgPer1=act.reduce((a,x)=>a+(x.per1||0),0)/n,avgX=act.reduce((a,x)=>a+x.sales,0)/n,avgY=act.reduce((a,x)=>a+x.wcnt,0)/n;
  rows.forEach(x=>{x.shareDiff=x.share-avgShare;x.per1Diff=x.per1!=null?x.per1-avgPer1:null;
    x.group=x.wcnt>0?(x.sales>=avgX?(x.wcnt<=avgY?1:2):(x.wcnt<=avgY?3:4)):null;});
  const counts={1:0,2:0,3:0,4:0};rows.forEach(x=>{if(x.group)counts[x.group]++;});
  return {rows,W,S,P:rows.reduce((x,y)=>x+y.profit,0),avgShare,avgPer1,avgX,avgY,counts,n};
}
function aggTraffic(r){const days=r.b-r.a+1;return PV_TABS.map((t,i)=>({tab:t,avg:sumBy(r.a,r.b,x=>x.pv[i])/days}));}
function monthlyTraffic(k){ /* 최근 k개월 월별 일평균 PV */
  const out=[];let e=LAST;for(let m=0;m<k&&e>=0;m++){const s=monthStart(e);out.unshift({ym:DATES[e].slice(0,7),rows:aggTraffic({a:s,b:e})});e=s-1;}return out;}
function bannersIn(r){return BANNERS.filter(b=>b.start<=r.b&&b.end>=r.a);}
function matchesFilters(b){
  if(state.team&&b.team!==state.team)return false;
  if(state.slot&&b.slot.code!==state.slot)return false;
  if(state.q){const q=state.q.trim().toLowerCase();if(q&&!(b.title.toLowerCase().includes(q)||b.brand.toLowerCase().includes(q)||b.md===q||b.team.includes(q)||b.slot.name.toLowerCase().includes(q)))return false;}
  return true;
}
function seriesFor(r,f){const out=[];for(let d=r.a;d<=r.b;d++)out.push(f(DAILY[d],d));return out;}
function bucketize(r){ /* 기간 길이에 따라 일·주·월 묶음 */
  const len=r.b-r.a+1;const kind=len<=45?'d':len<=200?'w':'m';const groups=[];
  for(let d=r.a;d<=r.b;d++){const key=kind==='d'?DATES[d]:kind==='w'?Math.floor((d-r.a)/7):DATES[d].slice(0,7);
    if(!groups.length||groups[groups.length-1].key!==key)groups.push({key,a:d,b:d});else groups[groups.length-1].b=d;}
  return {kind,groups,labels:groups.map(g=>kind==='d'?DATES[g.a].slice(5):kind==='w'?DATES[g.a].slice(5)+'~':g.key.slice(2))};
}

/* ---------- 기준일 검증 플래그 + 에이전트 판단(예시) ---------- */
const CAUSES={scale:['실제 성과 변동 또는 편성 변경','전일 대비 급감. 같은 날 다른 구좌는 정상 범위. 편성표 변경(배너 교체) 여부 확인 필요','중간'],
 sign:['취소 소급(접수일자 기준)','노출 기간 이전 주문의 취소가 기준일에 접수되어 전체 실적이 음수. 데이터 규칙상 알려진 패턴','높음'],
 newcode:['신규 코드 미등록','마스터(구좌명 재정의)에 없는 전시영역코드가 raw에 출현. 분류·광고여부 후보는 사람 승인 필요','낮음'],
 traffic:['트래픽 데이터 지연·결측','클릭 원천(GA4)에서 해당 구좌 값이 비어 있음. 실적은 정상 수신. 재수신 대기 후 재계산','중간'],
 group:['편성 사용량 변동','가중치 반영 사용량이 평균선을 넘나들어 그룹이 바뀜. 월 마감 수치와 대조 필요','중간']};
function buildFlags(){
  const L=LAST,flags=[];let n=1;const add=(rule,target,sev,obs,ref,k)=>{const c=CAUSES[k];flags.push({id:'F'+String(n++).padStart(3,'0'),rule,target,sev,obs,ref,cause:c[0],basis:c[1],conf:c[2],human:c[2]==='낮음'||sev==='높음'});};
  SLOTS.forEach((s,i)=>{let base=0,c=0;for(let d=L-7;d<L;d++){base+=DAILY[d].slots[i].sales;c++;}base/=c;const v=DAILY[L].slots[i].sales;const g=v/base;
    if(g<0.6||g>1.6)add('규모 검사 (구좌 발생 매출 급변)',s.name,g<0.5||g>2?'높음':'중간',fmt.money(v)+' ('+(g>1?'+':'')+((g-1)*100).toFixed(0)+'%)','직전 7일 평균 '+fmt.money(base),'scale');
    if(DAILY[L].slots[i].clk==null)add('트래픽 결측 검사',s.name,'중간','기준일 클릭수 없음','직전일 '+fmt.cnt(DAILY[L-1].slots[i].clk)+'건','traffic');});
  BANNERS.filter(b=>b.end===L&&b.tot<0).forEach(b=>add('부호 검사 (음수 전체 실적)',b.title+' · '+b.slot.name,'높음',fmt.money(b.tot),'0원 이상','sign'));
  add('신규 코드 검사',NEW_CODE.code,'중간',NEW_CODE.rows+'행 출현 ('+NEW_CODE.name+')','마스터 등록 코드 99종','newcode');
  const w=aggSlots(periodRange('m0')).weights;const cur=aggTeams(periodRange('m0'),w),prv=aggTeams(periodRange('m1'),w);
  cur.rows.forEach((x,i)=>{const p=prv.rows[i];if(x.group&&p.group&&x.group!==p.group&&flags.length<9)add('그룹 변동 검사',x.team.name,'낮음',GROUPS[x.group][0]+' '+GROUPS[x.group][1],'전월 '+GROUPS[p.group][0]+' '+GROUPS[p.group][1],'group');});
  return flags;
}

/* ---------- 링크 상태 ---------- */
function parseHash(){const o={...DEFAULTS};const h=(location.hash||'').replace(/^#/,'');if(!h)return o;
  h.split('&').forEach(kv=>{const i=kv.indexOf('=');if(i<0)return;const k=kv.slice(0,i),v=decodeURIComponent(kv.slice(i+1));
    if(k==='v'&&VIEWS.includes(v))o.view=v;else if(k==='p'&&PERIODS[v])o.period=v;else if(k==='t'&&TEAMS.some(t=>t.name===v))o.team=v;
    else if(k==='s'&&SLOTS.some(s=>s.code===v))o.slot=v;else if(k==='q')o.q=v.slice(0,40);
    else if(k==='o'){const m=/^([a-z]+):(a|d)$/.exec(v);if(m){o.sortKey=m[1];o.sortDir=m[2]==='a'?1:-1;}}});
  return o;}
function applyHash(){const s=parseHash();state.view=s.view;state.period=s.period;state.team=s.team;state.slot=s.slot;state.q=s.q;state.sort={key:s.sortKey,dir:s.sortDir};state.limit=50;}
function serialize(){const a=[];const add=(k,v)=>a.push(k+'='+encodeURIComponent(v));
  if(state.view!==DEFAULTS.view)add('v',state.view);if(state.period!==DEFAULTS.period)add('p',state.period);
  if(state.team)add('t',state.team);if(state.slot)add('s',state.slot);if(state.q.trim())add('q',state.q.trim().slice(0,40));
  if(state.sort.key!==DEFAULTS.sortKey||state.sort.dir!==DEFAULTS.sortDir)add('o',state.sort.key+':'+(state.sort.dir>0?'a':'d'));
  return a.join('&');}
function writeHash(push){const h=serialize();if(h===(location.hash||'').replace(/^#/,''))return;
  try{const base=location.href.split('#')[0];const u=h?base+'#'+h:base;if(push)history.pushState(null,'',u);else history.replaceState(null,'',u);}catch(e){}}
function currentURL(){const h=serialize();return location.href.split('#')[0]+(h?'#'+h:'');}

/* ---------- 알림·툴팁·테마 ---------- */
let toastT=0;
function toast(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true;},2600);}
async function copyLink(){const url=currentURL();let ok=false;
  try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url);ok=true;}}catch(e){ok=false;}
  if(!ok){try{const ta=document.createElement('textarea');ta.value=url;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(ta);ta.select();ok=document.execCommand('copy');ta.remove();}catch(e){ok=false;}}
  toast(ok?'현재 화면의 링크를 복사했습니다':'복사하지 못했습니다. 주소창의 링크를 직접 복사해 주세요');}
function showTip(html,x,y){const t=document.getElementById('tip');if(!t)return;t.innerHTML=html;t.style.display='block';
  const w=t.offsetWidth||200,h=t.offsetHeight||60,W=window.innerWidth||1200,H=window.innerHeight||800;
  t.style.left=Math.min(W-w-8,x+14)+'px';t.style.top=(y+18+h>H?y-h-10:y+18)+'px';}
function hideTip(){const t=document.getElementById('tip');if(t)t.style.display='none';}
function bindTip(el,html){el.addEventListener('pointermove',e=>showTip(typeof html==='function'?html():html,e.clientX,e.clientY));el.addEventListener('pointerleave',hideTip);}
function applyTheme(){let th='light';try{th=localStorage.getItem('hub-theme')||'light';}catch(e){}document.documentElement.setAttribute('data-theme',th);}
function toggleTheme(){const cur=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',cur);try{localStorage.setItem('hub-theme',cur);}catch(e){}}

/* ---------- 화면 공통 ---------- */
function statusTag(k){const m={done:['구축 완료','done'],goal:['구현 목표','goal'],plan:['계획','plan'],chk:['확인 필요','chk']}[k];return `<span class="tag ${m[1]}">${m[0]}</span>`;}
function groupPill(g){return g?`<span class="gpill g${g}">${GROUPS[g][0]} ${GROUPS[g][1]}</span>`:'<span class="pill none">편성 없음</span>';}
function renderChips(r,p){const c=document.getElementById('chips');if(!c)return;
  const parts=[`<span class="chip base">기준일 ${fmt.date(META.baseDate)} 마감</span>`,`<span class="chip">${PERIODS[state.period]} · ${rangeLabel(r)}</span>`];
  if(p)parts.push(`<span class="chip">비교 ${rangeLabel(p)}${p.partial?' (일부)':''}</span>`);
  if(state.team)parts.push(`<span class="chip">팀 ${esc(state.team)}</span>`);if(state.slot){const s=SLOTS.find(x=>x.code===state.slot);if(s)parts.push(`<span class="chip">구좌 ${esc(s.name)}</span>`);}
  if(state.q.trim())parts.push(`<span class="chip">검색 ${esc(state.q.trim())}</span>`);parts.push(`<span class="chip mock">${META.dataKind}</span>`);c.innerHTML=parts.join('');}
function renderFilters(){const g=id=>document.getElementById(id);
  if(g('fPeriod'))g('fPeriod').value=state.period;if(g('fTeam'))g('fTeam').value=state.team;if(g('fSlot'))g('fSlot').value=state.slot;if(g('fQ'))g('fQ').value=state.q;}
function fillFilterOptions(){const fs=document.getElementById('fSlot');if(fs)fs.innerHTML='<option value="">전체</option>'+SLOTS.map(s=>`<option value="${esc(s.code)}">${esc(s.name)}</option>`).join('');
  const dl=document.getElementById('dlTeam');if(dl)dl.innerHTML=TEAMS.map(t=>`<option value="${esc(t.name)}">${esc(t.bu)}</option>`).join('');
  const fp=document.getElementById('fPeriod');if(fp)fp.innerHTML=Object.keys(PERIODS).map(k=>`<option value="${k}">${PERIODS[k]}</option>`).join('');}

function render(push){
  const r=periodRange(state.period),p=prevRange(r);
  renderFilters();renderChips(r,p);
  document.querySelectorAll('.view').forEach(v=>{v.hidden=v.id!=='view-'+state.view;});
  document.querySelectorAll('.nav button[data-view]').forEach(b=>{if(b.dataset.view===state.view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  const t=document.getElementById('pageTitle'),s=document.getElementById('pageSub');if(t)t.textContent=TITLES[state.view][0];if(s)s.textContent=TITLES[state.view][1];
  document.title=TITLES[state.view][0]+' · '+APP.name;
  const f=document.getElementById('filters');if(f)f.hidden=state.view==='guide'||state.view==='daily';
  const ctx={r,p,slots:aggSlots(r),prevSlots:p?aggSlots(p):null};ctx.teams=aggTeams(r,ctx.slots.weights);ctx.prevTeams=p?aggTeams(p,ctx.slots.weights):null;
  if(V[state.view])V[state.view](ctx);
  writeHash(!!push);
}
function resetFilters(){state.team='';state.slot='';state.q='';state.period=DEFAULTS.period;state.limit=50;render();}
const V={}; /* 화면 렌더러는 app-views.js에서 채운다 */
