/* 모바일 편성 허브 v3 — 편성 데일리 리포트, 기준 안내, 공통 동작(act), 초기화 */
'use strict';
V.daily=function(){
  const L=LAST,d1={a:L,b:L},d0={a:L-1,b:L-1},w={a:L-7,b:L-7};const s1=aggSlots(d1),s0=aggSlots(d0),sw=aggSlots(w);const t1=aggTeams(d1,s1.weights),t0=aggTeams(d0,s1.weights),tw=aggTeams(w,s1.weights);
  const tr1=aggTraffic(d1),tr0=aggTraffic(d0),trw=aggTraffic(w);const clk=a=>a.rows.reduce((x,y)=>x+(y.clk||0),0);const bn=a=>a.rows.reduce((x,y)=>x+y.bn,0);
  const ended=BANNERS.filter(b=>b.end===L).length,started=BANNERS.filter(b=>b.start===L).length;
  document.getElementById('dailyHead').innerHTML=`<h3>${fmt.date(META.baseDate)} (${['일','월','화','수','목','금','토'][fromISO(META.baseDate).getUTCDay()]}) 편성 데일리 리포트</h3><div class="desc">산출 익일 06:30 · 입력 배너 ${fmt.cnt(bn(s1))}개 · 기준일 시작 행사 ${fmt.cnt(started)}건 · 종료 행사 ${fmt.cnt(ended)}건 · 활동 팀 ${t1.n}개</div>`;
  const rows=[['편성 자원','편성 사용량 (가중치 반영)',t1.W,t0.W,tw.W,'cnt'],['편성 자원','운영 배너수',bn(s1),bn(s0),bn(sw),'cnt'],['편성 자원','활동 팀 수',t1.n,t0.n,tw.n,'cnt'],['실적','편성 구좌 발생 매출',s1.S,s0.S,sw.S,'money'],['실적','전체 실적 (편성 구좌 상품)',s1.T,s0.T,sw.T,'money'],['실적','구좌 매출 비중',s1.S/s1.T,s0.S/s0.T,sw.S/sw.T,'pct'],['트래픽','편성 구좌 클릭수',clk(s1),clk(s0),clk(sw),'cnt'],['트래픽','DAU',tr1[0].avg,tr0[0].avg,trw[0].avg,'cnt'],['트래픽','현대홈쇼핑 탭 PV',tr1[3].avg,tr0[3].avg,trw[3].avg,'cnt'],['트래픽','별도탭 PV',tr1[4].avg,tr0[4].avg,trw[4].avg,'cnt']];
  const f=(v,k)=>k==='money'?fmt.money(v):k==='pct'?fmt.pct(v):fmt.cnt(v);
  document.getElementById('dailyTable').innerHTML=`<thead><tr><th>정보</th><th>지표</th><th class="num">기준일</th><th class="num">전일</th><th class="num">전일 대비</th><th class="num">전주 동요일</th><th class="num">전주 대비</th></tr></thead><tbody>${rows.map(([g,n,c,p,q,k])=>`<tr>${td(g)}${td(n)}${td(f(c,k),1)}${td(f(p,k),1)}${td(deltaHTML(c,p,k==='money'?'money':k==='pct'?'pct':'cnt'),1)}${td(f(q,k),1)}${td(deltaHTML(c,q,k==='money'?'money':k==='pct'?'pct':'cnt'),1)}</tr>`).join('')}</tbody>`;
  /* 구좌별 전일 대비 */
  const sd=s1.rows.map(x=>{const y=s0.byCode.get(x.slot.code);return {x,y,g:y.sales?(x.sales-y.sales)/y.sales:0};}).sort((a,b)=>Math.abs(b.g)-Math.abs(a.g));
  document.getElementById('slotDelta').innerHTML=`<thead><tr><th>편성 구좌</th><th>화면</th><th class="num">기준일 매출</th><th class="num">전일 매출</th><th class="num">전일 대비</th><th class="num">기준일 클릭</th><th class="num">전일 대비</th><th class="num">운영 배너</th><th class="num">배너 1개 매출</th></tr></thead><tbody>${sd.map(({x,y})=>`<tr class="clickable" data-act="k:${esc(x.slot.code)}">${td(esc(x.slot.name))}${td(screenName(x.slot.code))}${td(fmt.money(x.sales),1)}${td(fmt.money(y.sales),1)}${td(deltaHTML(x.sales,y.sales),1)}${td(x.clk==null?'<span class="pill none">결측</span>':fmt.cnt(x.clk),1)}${td(x.clk==null?'-':deltaHTML(x.clk,y.clk,'cnt'),1)}${td(fmt.n1(x.bn)+'개',1)}${td(fmt.money(x.perBn),1)}</tr>`).join('')}</tbody>`;
  /* 초안 */
  const top=s1.rows.slice().sort((a,b)=>b.sales-a.sales)[0],up=sd.filter(z=>z.g>0)[0],dn=sd.filter(z=>z.g<0)[0];const topT=t1.rows.filter(x=>x.wcnt>0).sort((a,b)=>b.sales-a.sales)[0];
  const evs=BANNERS.filter(b=>b.start<=L&&b.end>=L).sort((a,b)=>b.sales-a.sales);const miss=s1.rows.filter(x=>x.clk==null);
  document.getElementById('draft').innerHTML=`<h3>리포트 초안</h3><div class="desc">코드가 산출한 값만 인용합니다</div><ol>
    <li>기준일 편성 구좌 발생 매출은 <b>${fmt.money(s1.S)}</b>으로 전일 대비 ${deltaHTML(s1.S,s0.S)}, 전주 동요일 대비 ${deltaHTML(s1.S,sw.S)}입니다. 전체 실적 대비 구좌 매출 비중은 <span class="nw">${fmt.pct(s1.S/s1.T)}입니다</span>.</li>
    <li>매출 상위 구좌는 ${esc(top.slot.name)}(${fmt.money(top.sales)})이며, 가중치 상위 3개 구좌(${s1.rows.slice(0,3).map(x=>esc(x.slot.name)).join(', ')})가 가중치의 <span class="nw">${fmt.pct(s1.rows.slice(0,3).reduce((a,x)=>a+x.w,0))}를 차지</span>합니다.</li>
    <li>전일 대비 ${up?`가장 늘어난 구좌는 ${esc(up.x.slot.name)}(${deltaHTML(up.x.sales,up.y.sales)})`:'늘어난 구좌가 없고'}, ${dn?`가장 줄어든 구좌는 ${esc(dn.x.slot.name)}(${deltaHTML(dn.x.sales,dn.y.sales)})입니다.`:'줄어든 구좌는 없습니다.'}</li>
    <li>편성 사용량은 ${fmt.n1(t1.W)}건(가중치 반영)으로 활동 팀 ${t1.n}개, 매출 1위 팀은 ${topT?esc(topT.team.name)+' '+fmt.money(topT.sales):'-'}입니다. 기준일 노출 행사 ${fmt.cnt(evs.length)}건 중 1위는 ${evs[0]?esc(evs[0].title)+' ('+esc(evs[0].team)+', '+fmt.money(evs[0].sales)+')':'-'}입니다.</li>
    <li>트래픽: 편성 구좌 클릭 ${fmt.cnt(clk(s1))}건(전일 대비 ${deltaHTML(clk(s1),clk(s0),'cnt')}), DAU ${fmt.cnt(tr1[0].avg)}, 별도탭 PV ${fmt.cnt(tr1[4].avg)}. ${miss.length?miss.map(x=>esc(x.slot.name)).join(', ')+' 구좌는 기준일 클릭 값이 비어 있어 재수신 후 다시 계산합니다.':'클릭 결측 없음.'}</li></ol>
    <div class="note">날짜 기준: 추출은 접수일자, 배너 귀속은 주문일자 ≥ 전시시작일 하한 가드. 취소가 접수일자 기준으로 뒤늦게 반영되므로 직전 N일을 매일 다시 계산하고, 바뀐 구간은 "수정 반영"으로 표시합니다.</div>`;
  document.getElementById('cycle').innerHTML=[['1','전일 raw 추출','SQL 실적 + 트래픽 추출'],['2','정제·매칭·결합','Stage1~3 (F44) + 트래픽 결합'],['3','규칙 검증','규모·부호·코드·결측 검사'],['4','효율 평가 갱신','가중치·사용량·그룹 재계산'],['5','변동 요약','3종 정보·구좌별 증감 정리'],['6','리포트 초안','편성 데일리 리포트'],['7','승인·배포','승인 후 공유 채널로 발송'],['8','실행 로그','시각·건수·승인 결과']]
    .map(([n,t,d])=>`<div class="step"><div class="snum">${n}</div><div><b>${t}</b><div class="desc">${d}</div></div></div>`).join('');
};
V.guide=function(){document.getElementById('verInfo').textContent=`${APP.name} ${APP.version} (${APP.build} 빌드) · 데이터 기준일 ${fmt.date(META.baseDate)} · ${META.dataKind} (시드 ${META.seed}, ${fmt.date(META.dataMin)} ~ ${fmt.date(META.dataMax)}) · ${META.pipeline}`;};

/* ---------- 공통 동작: t 팀, m MD, b 브랜드, q 검색, k 구좌 선택 ---------- */
function act(code){const i=code.indexOf(':');const k=code.slice(0,i),v=code.slice(i+1);
  if(k==='k'){state.pick=v;state.view='slot';render(true);window.scrollTo(0,0);return;}
  if(k==='t')state.team=state.team===v?'':v;else if(k==='m')state.md=state.md===v?'':v;else if(k==='b')state.brand=state.brand===v?'':v;else if(k==='q')state.q=state.q===v?'':v.slice(0,40);
  if(state.view!=='event'){state.view='event';state.moreE=true;}state.limit=50;render(true);window.scrollTo(0,0);}

function init(){
  applyTheme();applyNav();fillFilterOptions();applyHash();
  document.getElementById('appFoot').textContent=`${META.dataKind} · ${META.baseDate} · ${APP.version}`;
  const on=(id,ev,fn)=>{const e=document.getElementById(id);if(e)e.addEventListener(ev,fn);};
  document.querySelectorAll('.nav button[data-view]').forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;state.limit=50;render(true);window.scrollTo(0,0);}));
  const onDate=()=>{const f=document.getElementById('fFrom').value,t=document.getElementById('fTo').value;if(f&&t&&applyCustom(f,t))render();};
  on('fFrom','change',onDate);on('fTo','change',onDate);
  on('fTeam','change',e=>{const v=e.target.value.trim();state.team=TEAMS.some(t=>t.name===v)?v:'';render();});
  on('fMD','change',e=>{const v=e.target.value.trim();state.md=MDS.some(m=>m.code===v)?v:'';render();});
  on('fBrand','change',e=>{const v=e.target.value.trim();state.brand=BRAND_LIST.includes(v)?v:'';render();});
  on('fSlot','change',e=>{state.slot=e.target.value;render();});
  on('fQ','input',e=>{state.q=e.target.value.slice(0,40);state.limit=50;render();});
  on('fReset','click',resetFilters);on('eReset','click',resetFilters);on('btnCopy','click',copyLink);on('btnTheme','click',toggleTheme);on('btnNav','click',toggleNav);
  on('eMore','click',()=>{state.limit+=50;render();});
  const dt=document.getElementById('dimToggle');if(dt){dt.checked=dimOn();dt.addEventListener('change',()=>{try{localStorage.setItem('hubDim',dt.checked?'1':'0');}catch(e){}const ps=document.getElementById('phoneShot');if(ps)ps.classList.toggle('nodim',!dt.checked);});}
  document.addEventListener('click',e=>{const t=e.target;if(!(t instanceof Element))return;
    const pr=t.closest('[data-preset]');if(pr){applyPreset(pr.dataset.preset);render();return;}
    const cl=t.closest('[data-clear]');if(cl){state[cl.dataset.clear]='';render();return;}
    const go=t.closest('[data-go]');if(go){state.view=go.dataset.go;render(true);window.scrollTo(0,0);return;}
    const a=t.closest('[data-act]');if(a){act(a.dataset.act);return;}
    const mt=t.closest('[data-metric]');if(mt){state.metric=mt.dataset.metric;render();return;}
    const sc=t.closest('[data-scr]');if(sc){state.scr=sc.dataset.scr;state.pick='';render();return;}
    const pk=t.closest('[data-pick]');if(pk){state.pick=pk.dataset.pick;if(state.view!=='slot')state.view='slot';render(true);return;}
    const tg=t.closest('[data-toggle]');if(tg){if(tg.dataset.toggle==='E')state.moreE=!state.moreE;else state.moreM=!state.moreM;render();return;}
    const h=t.closest('th.sortable');if(h){const k=h.dataset.key;if(state.sort.key===k)state.sort.dir=-state.sort.dir;else state.sort={key:k,dir:k==='team'||k==='slot'?1:-1};render();return;}});
  document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const el=e.target&&e.target.closest?e.target.closest('[data-pick],[data-act]'):null;if(el){e.preventDefault();if(el.dataset.pick){state.pick=el.dataset.pick;if(state.view!=='slot')state.view='slot';render(true);}else act(el.dataset.act);}}});
  window.addEventListener('hashchange',()=>{applyHash();render();});
  render();
}
if(typeof document!=='undefined'&&document.getElementById('kpis'))init();
