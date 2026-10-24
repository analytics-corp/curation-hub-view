/* 모바일 편성 허브 v2 — 영업팀, 전시 행사, 데일리 리포트, 기준, 초기화 */
'use strict';

/* ---------- 영업팀 ---------- */
V.team=function(ctx){
  const {teams}=ctx;const act=teams.rows.filter(x=>x.wcnt>0).sort((a,b)=>b.sShare-a.sShare);
  dumbbell(document.getElementById('dumbbell'),act.map(x=>({name:x.team.name,a:x.share,b:x.sShare,g:x.group})),v=>fmt.pct(v,0));
  document.getElementById('groupMeta').textContent=`활동 팀 ${teams.n}개 · 평균 편성매출 ${fmt.money(teams.avgX)} · 평균 편성사용량 ${fmt.n1(teams.avgY)}건`;
  document.getElementById('groupCards').innerHTML=[[1,'사용량 ↓ 매출 ↑','성공 사례 벤치마킹, 확대 적용'],[2,'사용량 ↑ 매출 ↑','효율 개선으로 최적화'],[3,'사용량 ↓ 매출 ↓','MD 참여 유도, 활성화'],[4,'사용량 ↑ 매출 ↓','편성 전략 재검토']]
    .map(([g,c,a])=>`<div class="gcard g${g}"><div class="gn">${GROUPS[g][0]} · ${GROUPS[g][1]} <b>${teams.counts[g]}팀</b></div><div class="gd">${c}</div><div class="ga">${a}</div><div class="gt">${teams.rows.filter(x=>x.group===g).map(x=>`<button type="button" class="link" data-act="t:${esc(x.team.name)}">${esc(x.team.name)}</button>`).join(', ')||'-'}</div></div>`).join('');
  const hdr=`<thead><tr><th>구분</th><th>그룹</th><th class="num">편성 운영 비중 (가중치)</th><th class="num">전사 평균 比</th><th class="num">운영 구좌 (실제)</th><th class="num">운영 구좌 (가중치)</th><th class="num">매출</th><th class="num">매출 비중</th><th class="num">편성 1%당 매출</th><th class="num">전사 평균 比</th><th class="num">공헌이익</th><th class="num">공헌이익률</th></tr></thead>`;
  const per1Max=Math.max(...teams.rows.map(x=>x.per1||0));
  let body=`<tr class="total">${td('전사 합계')}${td('')}${td('100.0%',1)}${td('-',1)}${td(fmt.cnt(teams.rows.reduce((a,x)=>a+x.cnt,0)),1)}${td(fmt.n1(teams.W),1)}${td(fmt.money(teams.S),1)}${td('100.0%',1)}${td(fmt.money(teams.S/100),1)}${td('-',1)}${td(fmt.money(teams.P),1)}${td(fmt.pct(teams.S?teams.P/teams.S:null),1)}</tr>`;
  body+=`<tr class="avg"><td>전사 평균 (팀별)</td><td></td>${td(fmt.pct(teams.avgShare),1)}${td('-',1)}${td(fmt.n1(teams.rows.reduce((a,x)=>a+x.cnt,0)/teams.n),1)}${td(fmt.n1(teams.avgY),1)}${td(fmt.money(teams.avgX),1)}${td(fmt.pct(1/teams.n),1)}${td(fmt.money(teams.avgPer1),1)}${td('-',1)}${td(fmt.money(teams.P/teams.n),1)}${td('-',1)}</tr>`;
  ORG.forEach(([bu])=>{const list=teams.rows.filter(x=>x.team.bu===bu);const s=list.reduce((a,x)=>a+x.sales,0),w=list.reduce((a,x)=>a+x.wcnt,0),c=list.reduce((a,x)=>a+x.cnt,0),pr=list.reduce((a,x)=>a+x.profit,0),sh=teams.W?w/teams.W:0;
    body+=`<tr class="lvl0"><td>${esc(bu)}</td><td></td>${td(fmt.pct(sh),1)}${td(fmt.pp(sh-teams.avgShare*list.length),1)}${td(fmt.cnt(c),1)}${td(fmt.n1(w),1)}${td(fmt.money(s),1)}${td(fmt.pct(teams.S?s/teams.S:null),1)}${td(sh?fmt.money(s/(sh*100)):'-',1)}${td('-',1)}${td(fmt.money(pr),1)}${td(fmt.pct(s?pr/s:null),1)}</tr>`;
    list.forEach(x=>{body+=`<tr class="lvl1 clickable${state.team===x.team.name?' hl':''}" data-act="t:${esc(x.team.name)}"><td>${esc(x.team.name)}</td><td>${groupPill(x.group)}</td>${td(fmt.pct(x.share),1)}${td(fmt.pp(x.shareDiff),1)}${td(fmt.cnt(x.cnt),1)}${td(fmt.n1(x.wcnt),1)}${td(fmt.money(x.sales),1)}${td(fmt.pct(x.sShare),1)}${x.per1==null?td('-',1):heatCell(x.per1,0,per1Max,fmt.money(x.per1))}${td(x.per1Diff==null?'-':(x.per1Diff>0?'+':'-')+fmt.money(Math.abs(x.per1Diff)),1)}${td(fmt.money(x.profit),1)}${td(x.sales?fmt.pct(x.rate):'-',1)}</tr>`;});});
  document.getElementById('teamTable').innerHTML=hdr+'<tbody>'+body+'</tbody>';
};

/* ---------- 전시 행사 ---------- */
const SORTS={sales:(a,b)=>a.sales-b.sales,tot:(a,b)=>a.tot-b.tot,ratio:(a,b)=>(a.tot?a.sales/a.tot:0)-(b.tot?b.sales/b.tot:0),start:(a,b)=>a.start-b.start,team:(a,b)=>a.team.localeCompare(b.team),slot:(a,b)=>a.slot.name.localeCompare(b.slot.name)};
V.event=function(ctx){
  const {r}=ctx;const all=filtered(r);const byMd=groupTop(all,b=>b.md);
  document.getElementById('eEmpty').hidden=all.length>0;
  const top5=all.slice().sort((a,b)=>b.sales-a.sales).slice(0,5);
  document.getElementById('eventTop').innerHTML=`<div class="card"><div class="ch"><h2>행사 TOP 5</h2><span class="hint">구좌 유입 실적 · 전체 ${fmt.cnt(all.length)}건 · 합계 ${fmt.money(all.reduce((a,x)=>a+x.sales,0))}</span></div><div class="best" id="evTop"></div><button type="button" class="btn small more" data-toggle="E">${state.moreE?'행사 전체 목록 접기':'더 보기 · 행사 전체 목록'}</button></div>
    <div class="card"><div class="ch"><h2>MD TOP 5</h2><span class="hint">MD코드 기준 · 이름은 표시하지 않습니다 · ${fmt.cnt(byMd.length)}명</span></div><div class="best" id="mdTop"></div><button type="button" class="btn small more" data-toggle="M">${state.moreM?'MD 전체 목록 접기':'더 보기 · MD 전체 목록'}</button></div>`;
  bestList(document.getElementById('evTop'),top5.map(b=>({name:b.title,sub:b.team+' · '+b.slot.name+' · MD '+b.md+' · '+fmt.date(DATES[b.start]),v:b.sales,sub2:b.tot>0?'기여도 '+fmt.pct(b.sales/b.tot,0):'-'})),fmt.money);
  bestList(document.getElementById('mdTop'),byMd.slice(0,5).map(x=>({name:x.key,sub:x.first.team+' · '+((MDS.find(m=>m.code===x.key)||{}).cat||'')+' · 행사 '+x.n+'건',v:x.sales,sub2:x.tot>0?'기여도 '+fmt.pct(x.sales/x.tot,0):'-',act:'m:'+x.key})),fmt.money);
  /* 행사 전체 목록 */
  const ec=document.getElementById('eventListCard');ec.hidden=!state.moreE;
  if(state.moreE){const sorter=SORTS[state.sort.key]||SORTS.sales;const list=all.slice().sort((a,b)=>sorter(a,b)*state.sort.dir);const shown=list.slice(0,state.limit);const S=state.sort;
    document.getElementById('eCount').textContent=`${fmt.cnt(all.length)}건 중 ${fmt.cnt(shown.length)}건 표시`;
    document.getElementById('eventTable').innerHTML=`<thead><tr>${th('영역 구분')}${th('구좌명','slot',0,S)}${th('전시 기간','start',0,S)}<th>전시명</th>${th('팀명','team',0,S)}<th>MD코드</th>${th('구좌 유입 실적','sales',1,S)}${th('전체 실적','tot',1,S)}${th('구좌 매출 비중','ratio',1,S)}</tr></thead><tbody>${shown.map(b=>`<tr${b.tot<0?' class="neg"':''}>${td(esc(b.slot.tab))}${td(esc(b.slot.name))}${td(fmt.date(DATES[b.start])+(b.end>b.start?' ~ '+fmt.mmdd(DATES[b.end]):''))}${td(esc(b.title)+(b.note?` <span class="pill warn">${esc(b.note)}</span>`:''))}${td(esc(b.team))}${td(`<button type="button" class="link" data-act="m:${esc(b.md)}">${esc(b.md)}</button>`)}${td(fmt.money(b.sales),1)}${td(fmt.money(b.tot),1)}${td(b.tot>0?fmt.pct(b.sales/b.tot):'-',1)}</tr>`).join('')}</tbody>`;
    document.getElementById('eMore').hidden=shown.length>=list.length;}
  const mc=document.getElementById('mdListCard');mc.hidden=!state.moreM;
  if(state.moreM){document.getElementById('mdTable').innerHTML=`<thead><tr><th>순위</th><th>MD코드</th><th>팀</th><th>상품 대분류</th><th class="num">행사 수</th><th class="num">구좌 유입 실적</th><th class="num">전체 실적</th><th class="num">구좌 매출 비중</th><th class="num">행사당 실적</th></tr></thead><tbody>${byMd.map((x,i)=>{const m=MDS.find(z=>z.code===x.key)||{};return `<tr>${td(i+1)}${td(`<button type="button" class="link" data-act="m:${esc(x.key)}">${esc(x.key)}</button>`)}${td(esc(x.first.team))}${td(esc(m.cat||''))}${td(fmt.cnt(x.n),1)}${td(fmt.money(x.sales),1)}${td(fmt.money(x.tot),1)}${td(x.tot>0?fmt.pct(x.sales/x.tot):'-',1)}${td(fmt.money(x.sales/x.n),1)}</tr>`;}).join('')}</tbody>`;}
};

/* ---------- 데일리 리포트 ---------- */
V.report=function(){
  const L=LAST,d1={a:L,b:L},d0={a:L-1,b:L-1},w={a:L-7,b:L-7};const s1=aggSlots(d1),s0=aggSlots(d0),sw=aggSlots(w);const t1=aggTeams(d1,s1.weights),t0=aggTeams(d0,s1.weights),tw=aggTeams(w,s1.weights);
  const tr1=aggTraffic(d1),tr0=aggTraffic(d0),trw=aggTraffic(w);const clk=a=>a.rows.reduce((x,y)=>x+(y.clk||0),0);const bn=a=>a.rows.reduce((x,y)=>x+y.bn,0);
  const flags=buildFlags();const fatal=flags.filter(f=>f.sev==='높음').length;
  document.getElementById('dailyHead').innerHTML=`<div class="ch"><h2>${fmt.date(META.baseDate)} (${['일','월','화','수','목','금','토'][fromISO(META.baseDate).getUTCDay()]}) 편성 데일리 리포트</h2><span class="hint">산출 익일 06:30 · 입력 배너 ${fmt.cnt(bn(s1))}개 · 플래그 ${flags.length}건 (치명 ${fatal}건) · 승인 상태 <span class="pill">승인 대기</span></span></div>`;
  const rows=[['편성 자원','편성 사용량 (가중치 반영)',t1.W,t0.W,tw.W,'cnt'],['편성 자원','운영 배너수',bn(s1),bn(s0),bn(sw),'cnt'],['실적','편성 구좌 발생 매출',s1.S,s0.S,sw.S,'money'],['실적','전체 실적 (편성 구좌 상품)',s1.T,s0.T,sw.T,'money'],['실적','구좌 매출 비중',s1.S/s1.T,s0.S/s0.T,sw.S/sw.T,'pct'],['트래픽','편성 구좌 클릭수',clk(s1),clk(s0),clk(sw),'cnt'],['트래픽','DAU',tr1[0].avg,tr0[0].avg,trw[0].avg,'cnt'],['트래픽','별도탭 PV',tr1[4].avg,tr0[4].avg,trw[4].avg,'cnt']];
  const f=(v,k)=>k==='money'?fmt.money(v):k==='pct'?fmt.pct(v):fmt.cnt(v);
  document.getElementById('dailyTable').innerHTML=`<thead><tr><th>정보</th><th>지표</th><th class="num">기준일</th><th class="num">전일</th><th class="num">전일 대비</th><th class="num">전주 동요일</th><th class="num">전주 대비</th></tr></thead><tbody>${rows.map(([g,n,c,p,q,k])=>`<tr>${td(g)}${td(n)}${td(f(c,k),1)}${td(f(p,k),1)}${td(deltaHTML(c,p,k==='money'?'money':k==='pct'?'pct':'cnt'),1)}${td(f(q,k),1)}${td(deltaHTML(c,q,k==='money'?'money':k==='pct'?'pct':'cnt'),1)}</tr>`).join('')}</tbody>`;
  document.getElementById('flagTable').innerHTML=`<thead><tr><th>ID</th><th>규칙</th><th>대상</th><th>심각도</th><th>관측값</th><th>기준값</th><th>원인 분류</th><th>근거</th><th>신뢰도</th><th>담당자 확인</th></tr></thead><tbody>${flags.map(x=>`<tr>${td(x.id)}${td(esc(x.rule))}${td(esc(x.target))}${td(`<span class="sev ${x.sev}">${x.sev}</span>`)}${td(esc(x.obs))}${td(esc(x.ref))}${td('<b>'+esc(x.cause)+'</b>')}${td('<span class="wrapcell">'+esc(x.basis)+'</span>')}${td(x.conf)}${td(x.human?'<b>필요</b>':'-')}</tr>`).join('')}</tbody>`;
  const top=s1.rows.slice().sort((a,b)=>b.sales-a.sales)[0];const drop=flags.find(x=>x.rule.startsWith('규모'));
  document.getElementById('draft').innerHTML=`<div class="ch"><h2>리포트 초안</h2><span class="hint">코드가 산출한 값만 인용</span></div><ol>
    <li>기준일 편성 구좌 발생 매출은 <b>${fmt.money(s1.S)}</b>으로 전일 대비 ${deltaHTML(s1.S,s0.S)}, 전주 동요일 대비 ${deltaHTML(s1.S,sw.S)}입니다. 구좌 매출 비중은 ${fmt.pct(s1.S/s1.T)}입니다.</li>
    <li>가중치 상위 구좌는 ${esc(top.slot.name)}(${fmt.money(top.sales)})이며, 상위 3개 구좌가 가중치의 ${fmt.pct(s1.rows.slice(0,3).reduce((a,x)=>a+x.w,0))}를 차지합니다.</li>
    <li>${drop?`${esc(drop.target)} 구좌 매출이 직전 7일 평균 대비 급감했습니다(${esc(drop.obs)}). 원인 후보는 ${esc(drop.cause)}이며 신뢰도 ${drop.conf}, 편성표 변경 여부 확인이 필요합니다.`:'규모 급변 플래그는 없습니다.'}</li>
    <li>트래픽: 클릭수 ${fmt.cnt(clk(s1))}건, DAU ${fmt.cnt(tr1[0].avg)}. ${flags.some(x=>x.rule.startsWith('트래픽'))?'일부 구좌의 클릭 값이 비어 있어 재수신 후 재계산합니다.':'결측 없음.'}</li>
    <li>담당자 확인 요청: 신규 전시영역코드 ${esc(NEW_CODE.code)}의 분류·광고여부, 음수 전체 실적 배너의 취소 소급 반영. 승인 후 배포합니다.</li></ol>
    <div class="note">날짜 기준: 추출은 접수일자, 배너 귀속은 주문일자 ≥ 전시시작일 하한 가드. 취소 소급으로 직전 N일을 매일 다시 계산합니다.</div>`;
  document.getElementById('cycle').innerHTML=[['1','전일 raw 추출','SQL 실적 + 트래픽'],['2','정제·매칭·결합','Stage1~3 (F44) + 트래픽 결합'],['3','규칙 검증','검증 플래그 파일 생성'],['4','효율 평가 갱신','가중치·사용량·그룹 재계산'],['5','원인 분류','플래그별 원인·근거·신뢰도'],['6','리포트 초안','편성 데일리 리포트'],['7','승인·배포','승인 후 공유 채널로 발송'],['8','실행 로그','시각·건수·플래그·승인 결과']]
    .map(([n,t,d])=>`<div class="step"><div class="sn">${n}</div><div><b>${t}</b><div class="sd">${d}</div></div></div>`).join('');
};

/* ---------- 기준 ---------- */
V.guide=function(){document.getElementById('verInfo').textContent=`${APP.name} ${APP.version} (${APP.build} 빌드) · 데이터 기준일 ${fmt.date(META.baseDate)} · ${META.dataKind} (시드 ${META.seed}, ${fmt.date(META.dataMin)} ~ ${fmt.date(META.dataMax)}) · ${META.pipeline}`;};

/* ---------- 초기화 ---------- */
function act(code){const i=code.indexOf(':');const k=code.slice(0,i),v=code.slice(i+1);
  if(k==='t'){state.team=state.team===v?'':v;}else if(k==='m'){state.md=state.md===v?'':v;}else if(k==='b'){state.brand=state.brand===v?'':v;}
  if(state.view==='brief'||state.view==='map'||state.view==='team'){state.view='event';state.moreE=true;}state.limit=50;render(true);window.scrollTo(0,0);}
function init(){
  fillFilterOptions();applyHash();
  document.getElementById('hdrBase').textContent=`기준일 ${fmt.date(META.baseDate)} 마감 · 매일 갱신`;
  document.getElementById('foot').textContent=`${APP.name} ${APP.version} · 데이터 기준일 ${fmt.date(META.baseDate)} · 표시된 수치는 시드 고정 ${META.dataKind}입니다. 구좌명·팀명·브랜드명·코드는 실제 명칭입니다.`;
  const on=(id,ev,fn)=>{const e=document.getElementById(id);if(e)e.addEventListener(ev,fn);};
  document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;state.limit=50;render(true);window.scrollTo(0,0);}));
  const onDate=()=>{const f=document.getElementById('fFrom').value,t=document.getElementById('fTo').value;if(f&&t&&applyCustom(f,t))render();};
  on('fFrom','change',onDate);on('fTo','change',onDate);
  on('fTeam','change',e=>{const v=e.target.value.trim();state.team=TEAMS.some(t=>t.name===v)?v:'';render();});
  on('fMD','change',e=>{const v=e.target.value.trim();state.md=MDS.some(m=>m.code===v)?v:'';render();});
  on('fBrand','change',e=>{const v=e.target.value.trim();state.brand=BRAND_LIST.includes(v)?v:'';render();});
  on('fSlot','change',e=>{state.slot=e.target.value;render();});
  on('fReset','click',resetFilters);on('eReset','click',resetFilters);on('btnCopy','click',copyLink);
  on('eMore','click',()=>{state.limit+=50;render();});
  document.addEventListener('click',e=>{const t=e.target;if(!(t instanceof Element))return;
    const pr=t.closest('[data-preset]');if(pr){applyPreset(pr.dataset.preset);render();return;}
    const cl=t.closest('[data-clear]');if(cl){state[cl.dataset.clear]='';render();return;}
    const go=t.closest('[data-go]');if(go){state.view=go.dataset.go;render(true);window.scrollTo(0,0);return;}
    const a=t.closest('[data-act]');if(a){act(a.dataset.act);return;}
    const mt=t.closest('[data-metric]');if(mt){state.metric=mt.dataset.metric;render();return;}
    const sc=t.closest('[data-scr]');if(sc){state.scr=sc.dataset.scr;const first=slotsOf(state.scr).find(x=>!x.auto);if(first)state.pick=first.s.code;render();return;}
    const pk=t.closest('[data-pick]');if(pk){state.pick=pk.dataset.pick;if(state.view!=='map')state.view='map';render(true);return;}
    const tg=t.closest('[data-toggle]');if(tg){if(tg.dataset.toggle==='E')state.moreE=!state.moreE;else state.moreM=!state.moreM;render();return;}
    const h=t.closest('th.sortable');if(h){const k=h.dataset.key;if(state.sort.key===k)state.sort.dir=-state.sort.dir;else state.sort={key:k,dir:k==='team'||k==='slot'?1:-1};render();return;}});
  document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const pk=e.target&&e.target.closest?e.target.closest('[data-pick]'):null;if(pk){e.preventDefault();state.pick=pk.dataset.pick;render(true);}}});
  window.addEventListener('hashchange',()=>{applyHash();render();});
  render();
}
if(typeof document!=='undefined'&&document.getElementById('kpis'))init();
