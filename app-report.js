/* 모바일 편성 허브 — 화면 렌더러 (전시 행사별 · 편성 데일리 리포트 · 기준 안내) + 초기화. app-views.js의 th/td 헬퍼와 V를 공유한다. */
'use strict';

const SORTS={sales:(a,b)=>a.sales-b.sales,tot:(a,b)=>a.tot-b.tot,ratio:(a,b)=>(a.tot?a.sales/a.tot:0)-(b.tot?b.sales/b.tot:0),start:(a,b)=>a.start-b.start,team:(a,b)=>a.team.localeCompare(b.team),slot:(a,b)=>a.slot.name.localeCompare(b.slot.name)};
V.event=function(ctx){
  const {r}=ctx;const all=bannersIn(r).filter(matchesFilters);const sorter=SORTS[state.sort.key]||SORTS.sales;
  const list=all.slice().sort((a,b)=>sorter(a,b)*state.sort.dir);const shown=list.slice(0,state.limit);
  document.getElementById('eCount').textContent=`${fmt.cnt(all.length)}건 중 ${fmt.cnt(shown.length)}건 표시 · 구좌 유입 실적 합계 ${fmt.money(all.reduce((a,x)=>a+x.sales,0))}`;
  const S=state.sort;const t=document.getElementById('eventTable');
  t.innerHTML=`<thead><tr>${th('영역 구분')}${th('구좌명','slot',0,S)}${th('전시 기간','start',0,S)}<th>전시명</th>${th('팀명','team',0,S)}<th>MD코드</th>${th('구좌 유입 실적','sales',1,S)}${th('전체 실적','tot',1,S)}${th('구좌 매출 비중','ratio',1,S)}</tr></thead><tbody>${shown.map(b=>`<tr${b.tot<0?' class="neg"':''}>${td(esc(b.slot.tab))}${td(esc(b.slot.name))}${td(fmt.date(DATES[b.start])+(b.end>b.start?' ~ '+fmt.date(DATES[b.end]).slice(5):''))}${td(esc(b.title)+(b.note?` <span class="pill warn">${esc(b.note)}</span>`:''))}${td(esc(b.team))}${td(`<button type="button" class="link" data-md="${esc(b.md)}" title="이 MD의 행사만 보기">${esc(b.md)}</button>`)}${td(fmt.money(b.sales),1)}${td(fmt.money(b.tot),1)}${td(b.tot>0?fmt.pct(b.sales/b.tot):'-',1)}</tr>`).join('')}</tbody>`;
  document.getElementById('eMore').hidden=shown.length>=list.length;
  document.getElementById('eEmpty').hidden=all.length>0;
  /* TOP 3 행사 · MD */
  const top3=all.slice().sort((a,b)=>b.sales-a.sales).slice(0,3);
  const byMd=new Map();all.forEach(b=>{const o=byMd.get(b.md)||{md:b.md,team:b.team,cat:(MDS.find(m=>m.code===b.md)||{}).cat||'',n:0,sales:0,tot:0};o.n++;o.sales+=b.sales;o.tot+=b.tot;byMd.set(b.md,o);});
  const mdTop=[...byMd.values()].sort((a,b)=>b.sales-a.sales).slice(0,3);
  document.getElementById('eventTop').innerHTML=`<div class="card"><h3>행사 TOP 3</h3><div class="desc">구좌 유입 실적 기준</div>${top3.map((b,i)=>`<div class="toprow"><span class="rank">${i+1}</span><div><b>${esc(b.title)}</b><div class="muted">${esc(b.team)} · ${esc(b.slot.name)} 구좌</div></div><div class="num"><b>${fmt.money(b.sales)}</b><div class="muted">기여도 ${b.tot>0?fmt.pct(b.sales/b.tot,0):'-'}</div></div></div>`).join('')||'<div class="muted">해당 없음</div>'}</div>
  <div class="card"><h3>MD TOP 3</h3><div class="desc">MD코드 기준 · 이름은 표시하지 않습니다</div>${mdTop.map((m,i)=>`<div class="toprow"><span class="rank">${i+1}</span><div><b><button type="button" class="link" data-md="${esc(m.md)}">${esc(m.md)}</button></b> <span class="muted">${esc(m.cat)}</span><div class="muted">${esc(m.team)} · 행사 ${m.n}건</div></div><div class="num"><b>${fmt.money(m.sales)}</b><div class="muted">기여도 ${m.tot>0?fmt.pct(m.sales/m.tot,0):'-'}</div></div></div>`).join('')||'<div class="muted">해당 없음</div>'}</div>`;
};

/* ---------- 편성 데일리 리포트 ---------- */
V.daily=function(ctx){
  const L=LAST,d1={a:L,b:L},d0={a:L-1,b:L-1},w={a:L-7,b:L-7};const s1=aggSlots(d1),s0=aggSlots(d0),sw=aggSlots(w);const t1=aggTeams(d1,s1.weights),t0=aggTeams(d0,s1.weights);
  const tr1=aggTraffic(d1),tr0=aggTraffic(d0);const clk=a=>a.rows.reduce((x,y)=>x+(y.clk||0),0);
  const flags=buildFlags();const fatal=flags.filter(f=>f.sev==='높음').length;
  document.getElementById('dailyHead').innerHTML=`<div class="ihead"><h3>${fmt.date(META.baseDate)} (${['일','월','화','수','목','금','토'][fromISO(META.baseDate).getUTCDay()]}) 편성 데일리 리포트 초안</h3>${statusTag('goal')}</div><div class="desc">산출 ${fmt.date(META.baseDate)} 익일 06:30 (예정) · 입력 ${fmt.cnt(DAILY[L].slots.reduce((a,x)=>a+x.bn,0))}개 배너 · 플래그 ${flags.length}건 (치명 ${fatal}건) · 승인 상태 <span class="pill">승인 대기</span> · 배포 채널 미정</div>`;
  const rows=[['편성 자원','편성 사용량 (가중치 반영)',t1.W,t0.W,'cnt'],['편성 자원','운영 배너수',s1.rows.reduce((a,x)=>a+x.bn,0),s0.rows.reduce((a,x)=>a+x.bn,0),'cnt'],['실적','편성 구좌 발생 매출',s1.S,s0.S,'money'],['실적','전체 실적 (편성 구좌 상품)',s1.T,s0.T,'money'],['실적','구좌 매출 비중',s1.S/s1.T,s0.S/s0.T,'pct'],['트래픽','편성 구좌 클릭수',clk(s1),clk(s0),'cnt'],['트래픽','DAU',tr1[0].avg,tr0[0].avg,'cnt'],['트래픽','별도탭 PV',tr1[4].avg,tr0[4].avg,'cnt']];
  const f=(v,k)=>k==='money'?fmt.money(v):k==='pct'?fmt.pct(v):fmt.cnt(v);
  const wk=(k,i)=>{const m={0:()=>t1.W,2:()=>sw.S,3:()=>sw.T,5:()=>clk(sw)};return null;};
  document.getElementById('dailyTable').innerHTML=`<thead><tr><th>정보</th><th>지표</th><th class="num">기준일</th><th class="num">전일</th><th class="num">전일 대비</th><th class="num">전주 동요일</th></tr></thead><tbody>${rows.map(([g,n,c,p,k],i)=>{const ww=[t1.W,null,sw.S,sw.T,sw.S/sw.T,clk(sw),aggTraffic(w)[0].avg,aggTraffic(w)[4].avg][i];return `<tr>${td(g)}${td(n)}${td(f(c,k),1)}${td(f(p,k),1)}${td(deltaHTML(c,p,k==='money'?'money':k==='pct'?'pct':'cnt'),1)}${td(ww==null?'-':f(ww,k),1)}</tr>`;}).join('')}</tbody>`;
  document.getElementById('flagTable').innerHTML=`<thead><tr><th>ID</th><th>규칙</th><th>대상</th><th>심각도</th><th>관측값</th><th>기준값</th><th>에이전트 판단 (원인 분류)</th><th>근거</th><th>신뢰도</th><th>사람 확인</th></tr></thead><tbody>${flags.map(x=>`<tr>${td(x.id)}${td(esc(x.rule))}${td(esc(x.target))}${td(`<span class="sev ${x.sev}">${x.sev}</span>`)}${td(esc(x.obs))}${td(esc(x.ref))}${td('<b>'+esc(x.cause)+'</b>')}${td('<span class="wrap">'+esc(x.basis)+'</span>')}${td(`<span class="conf ${x.conf}">${x.conf}</span>`)}${td(x.human?'<b>필요</b>':'-')}</tr>`).join('')}</tbody>`;
  const top=s1.rows.slice().sort((a,b)=>b.sales-a.sales)[0];const drop=flags.find(x=>x.rule.startsWith('규모'));
  document.getElementById('draft').innerHTML=`<h3>리포트 초안 (에이전트 작성 예시)</h3><ol>
  <li>기준일 편성 구좌 발생 매출은 <b>${fmt.money(s1.S)}</b>으로 전일 대비 ${deltaHTML(s1.S,s0.S)} 입니다. 전체 실적 대비 구좌 매출 비중은 ${fmt.pct(s1.S/s1.T)}입니다.</li>
  <li>가중치 상위 구좌는 ${esc(top.slot.name)}(${fmt.money(top.sales)})이며, 상위 3개 구좌가 전체 가중치의 ${fmt.pct(s1.rows.slice(0,3).reduce((a,x)=>a+x.w,0))}를 차지합니다.</li>
  <li>${drop?`${esc(drop.target)} 구좌 매출이 직전 7일 평균 대비 급감했습니다(${esc(drop.obs)}). 원인 후보는 ${esc(drop.cause)}이며 신뢰도 ${drop.conf}, 편성표 변경 여부를 확인해 주세요.`:'규모 급변 플래그는 없습니다.'}</li>
  <li>트래픽: 클릭수 ${fmt.cnt(clk(s1))}건, DAU ${fmt.cnt(tr1[0].avg)}. ${flags.some(x=>x.rule.startsWith('트래픽'))?'일부 구좌의 클릭 값이 비어 있어 재수신 후 재계산합니다.':'결측 없음.'}</li>
  <li>확인 요청: 신규 전시영역코드 ${esc(NEW_CODE.code)}의 분류·광고여부, 음수 전체 실적 배너의 취소 소급 반영 확인. 승인 후 배포합니다.</li></ol>
  <div class="note">이 초안의 모든 수치는 L1 코드가 산출한 값만 인용합니다(에이전트는 새 수치를 만들지 않습니다). 날짜 기준: 추출은 접수일자, 배너 귀속은 주문일자 ≥ 전시시작일 하한 가드.</div>`;
  document.getElementById('cycle').innerHTML=[['1','전일 raw 추출','SQL (실적) + 트래픽 추출','done'],['2','정제·매칭·결합','Python Stage1~3 (F44) + 트래픽 결합','done'],['3','규칙 검증','검증 플래그 파일 생성','goal'],['4','효율 평가 갱신','산식 확정 전 3종 정보 병기','plan'],['5','에이전트 해석','원인 분류·근거·신뢰도','goal'],['6','리포트 초안','편성 데일리 리포트','goal'],['7','승인·배포','Power Automate 승인 후 공유','goal'],['8','실행 로그','시각·건수·플래그·승인 결과','goal']]
    .map(([n,t,d,s])=>`<div class="step"><div class="snum">${n}</div><div><b>${t}</b><div class="desc">${d}</div></div>${statusTag(s)}</div>`).join('');
};

/* ---------- 기준 안내 ---------- */
V.guide=function(){const v=document.getElementById('verInfo');if(v)v.innerHTML=`${APP.name} ${APP.version} (${APP.build} 빌드) · 데이터 기준일 ${fmt.date(META.baseDate)} · ${META.dataKind} (시드 ${META.seed}, ${fmt.date(META.dataMin)} ~ ${fmt.date(META.dataMax)}) · ${META.pipeline}`;};

/* ---------- 초기화 ---------- */
function init(){
  applyTheme();fillFilterOptions();applyHash();
  const on=(id,ev,fn)=>{const e=document.getElementById(id);if(e)e.addEventListener(ev,fn);};
  document.querySelectorAll('.nav button[data-view]').forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;state.limit=50;render(true);window.scrollTo(0,0);}));
  on('fPeriod','change',e=>{state.period=e.target.value;render();});
  on('fTeam','change',e=>{const v=e.target.value.trim();state.team=TEAMS.some(t=>t.name===v)?v:'';render();});
  on('fSlot','change',e=>{state.slot=e.target.value;render();});
  on('fQ','input',e=>{state.q=e.target.value.slice(0,40);state.limit=50;render();});
  on('fReset','click',resetFilters);on('eReset','click',resetFilters);
  on('btnCopy','click',copyLink);on('btnTheme','click',toggleTheme);
  on('eMore','click',()=>{state.limit+=50;render();});
  document.addEventListener('click',e=>{const t=e.target;if(!(t instanceof Element))return;
    const go=t.closest('[data-go]');if(go){state.view=go.dataset.go;render(true);window.scrollTo(0,0);return;}
    const md=t.closest('[data-md]');if(md){state.q=md.dataset.md;state.view='event';state.limit=50;render(true);return;}
    const th=t.closest('th.sortable');if(th){const k=th.dataset.key;if(state.sort.key===k)state.sort.dir=-state.sort.dir;else state.sort={key:k,dir:k==='team'||k==='slot'?1:-1};render();return;}
    const tr=t.closest('tr.teamrow');if(tr){state.team=state.team===tr.dataset.team?'':tr.dataset.team;render();}});
  window.addEventListener('hashchange',()=>{applyHash();render();});
  render();
}
if(typeof document!=='undefined'&&document.getElementById('kpis'))init();
