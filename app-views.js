/* 모바일 편성 허브 — 화면 렌더러 (오늘의 허브 · 구좌별 · 영업팀별). 나머지 화면과 초기화는 app-report.js */
'use strict';
const th=(label,key,num,cur)=>`<th class="${num?'num ':''}${key?'sortable':''}"${key?` data-key="${key}"`:''}>${label}${cur&&cur.key===key?(cur.dir>0?' ▲':' ▼'):''}</th>`;
const td=(v,num)=>`<td${num?' class="num"':''}>${v}</td>`;

/* ---------- 오늘의 허브 ---------- */
V.home=function(ctx){
  const {r,p,slots,prevSlots,teams,prevTeams}=ctx;const days=r.b-r.a+1;
  const sumClk=a=>a.rows.reduce((x,y)=>x+(y.clk||0),0),sumBn=a=>a.rows.reduce((x,y)=>x+y.bn,0)/a.days;
  const tr=aggTraffic(r),ptr=p?aggTraffic(p):null;
  const ser=(rng,f)=>{const b=bucketize(rng);return b.groups.map(g=>{let s=0;for(let d=g.a;d<=g.b;d++)s+=f(DAILY[d]);return s;});};
  const sSales=x=>x.slots.reduce((a,y)=>a+y.sales,0),sClk=x=>x.slots.reduce((a,y)=>a+(y.clk||0),0),sTot=x=>x.slots.reduce((a,y)=>a+y.tot,0);
  const tiles=[
    {label:'편성 구좌 발생 매출',v:fmt.money(slots.S),d:deltaHTML(slots.S,prevSlots&&prevSlots.S),cur:ser(r,sSales),prev:p?ser(p,sSales):null,extra:`일평균 ${fmt.money(slots.S/days)}`},
    {label:'전체 실적 (편성 구좌 상품)',v:fmt.money(slots.T),d:deltaHTML(slots.T,prevSlots&&prevSlots.T),cur:ser(r,sTot),prev:p?ser(p,sTot):null,extra:`구좌 매출 비중 ${fmt.pct(slots.S/slots.T)}`},
    {label:'클릭수 (모바일 편성 트래픽)',v:fmt.cnt(sumClk(slots))+'건',d:deltaHTML(sumClk(slots),prevSlots&&sumClk(prevSlots),'cnt'),cur:ser(r,sClk),prev:p?ser(p,sClk):null,extra:'GA4 일 단위 연동 '+statusTag('chk')},
    {label:'편성 사용량 (가중치 반영)',v:fmt.n1(teams.W)+'건',d:deltaHTML(teams.W,prevTeams&&prevTeams.W,'cnt'),cur:null,extra:`실제 운영 ${fmt.cnt(teams.rows.reduce((a,x)=>a+x.cnt,0))}건 · 활동 팀 ${teams.n}개`},
    {label:'운영 배너수 (일평균)',v:fmt.n1(sumBn(slots))+'개',d:deltaHTML(sumBn(slots),prevSlots&&sumBn(prevSlots),'cnt'),cur:null,extra:`기간 내 행사 ${fmt.cnt(bannersIn(r).length)}건`},
    {label:'DAU (일평균)',v:fmt.cnt(tr[0].avg),d:deltaHTML(tr[0].avg,ptr&&ptr[0].avg,'cnt'),cur:ser(r,x=>x.pv[0]),prev:p?ser(p,x=>x.pv[0]):null,extra:`현대홈쇼핑 탭 ${fmt.cnt(tr[3].avg)}`}
  ];
  const box=document.getElementById('kpis');box.innerHTML='';
  tiles.forEach(t=>{const d=document.createElement('div');d.className='tile';d.innerHTML=`<div class="label">${t.label}</div><div class="value">${t.v}</div><div class="delta">${t.d}</div><div class="delta"><span class="amt">${t.extra}</span></div>`;
    if(t.cur&&t.cur.length>1)d.appendChild(sparkline(t.cur,t.prev));box.appendChild(d);});
  /* 3종 정보 카드 */
  const g1=teams.counts;
  document.getElementById('infoCards').innerHTML=[
    ['편성 자원','편성 사용량·운영 배너·그룹 분포','done',`<b>${fmt.n1(teams.W)}</b>건 (가중치 반영) · 실제 ${fmt.cnt(teams.rows.reduce((a,x)=>a+x.cnt,0))}건<br>1그룹 ${g1[1]} · 2그룹 ${g1[2]} · 3그룹 ${g1[3]} · 4그룹 ${g1[4]}팀`,'team'],
    ['실적','구좌 발생 매출·전체 실적·기여도','done',`<b>${fmt.money(slots.S)}</b> 구좌 발생 · 전체 ${fmt.money(slots.T)}<br>상위 구좌 ${esc(slots.rows[0].slot.name)} 가중치 ${fmt.pct(slots.rows[0].w)}`,'slot'],
    ['트래픽','주요 탭 PV·구좌 클릭 (일 단위 확보 확인 필요)','chk',`DAU <b>${fmt.cnt(tr[0].avg)}</b> · 별도탭 PV ${fmt.cnt(tr[4].avg)}<br>편성 구좌 클릭 ${fmt.cnt(sumClk(slots))}건${slots.rows.some(x=>x.clkDays<x.days)?' · 결측 구좌 있음':''}`,'slot']
  ].map(([t,sub,st,body,view])=>`<div class="card info"><div class="ihead"><h3>${t}</h3>${statusTag(st)}</div><div class="desc">${sub}</div><div class="ibody">${body}</div><button type="button" class="btn small" data-go="${view}">자세히</button></div>`).join('');
  /* 구좌별 매출 막대 */
  const prevMap=new Map((prevSlots?prevSlots.rows:[]).map(x=>[x.slot.code,x]));
  hbars(document.getElementById('slotBars'),slots.rows.map(x=>({name:x.slot.name,v:x.sales,p:prevMap.has(x.slot.code)?prevMap.get(x.slot.code).sales:null,sub:`가중치 ${fmt.pct(x.w)}`,
    html:()=>`<b>${esc(x.slot.name)}</b><br>구좌 발생 매출 ${fmt.money(x.sales)} · 일평균 ${fmt.money(x.aSales)}<br>클릭 ${fmt.cnt(x.clk)}건 · 배너 ${fmt.n1(x.aBn)}개/일 · 재구매율 ${fmt.pct(x.rb)}`})),fmt.money,['편성 구좌','','구좌 발생 매출','가중치']);
  /* 팀 TOP */
  const tt=document.getElementById('teamTop');const top=teams.rows.filter(x=>x.wcnt>0).sort((a,b)=>b.sales-a.sales).slice(0,10);
  tt.innerHTML=`<thead><tr><th>팀</th><th>그룹</th><th class="num">사용량</th><th class="num">매출</th><th class="num">1%당 매출</th></tr></thead><tbody>${top.map(x=>`<tr><td>${esc(x.team.name)} <span class="muted">${esc(x.team.bu)}</span></td><td>${groupPill(x.group)}</td>${td(fmt.n1(x.wcnt),1)}${td(fmt.money(x.sales),1)}${td(fmt.money(x.per1),1)}</tr>`).join('')}</tbody>`;
  /* 추이 */
  const tb=document.getElementById('trends');tb.innerHTML='';const bk=bucketize(r);document.getElementById('trendTitle').textContent=(bk.kind==='d'?'일별':bk.kind==='w'?'주별':'월별')+' 추이';
  const al=(f)=>p?ser(p,f):null;const pad=(arr)=>arr?arr.slice(0,bk.groups.length):null;
  columnChart(tb,'편성 구좌 발생 매출','원 · 선 = 비교 기간',bk.labels,ser(r,sSales),pad(al(sSales)),fmt.money);
  columnChart(tb,'클릭수','건 · 선 = 비교 기간',bk.labels,ser(r,sClk),pad(al(sClk)),v=>fmt.cnt(v));
  /* 데일리 리포트 요약 */
  const flags=buildFlags();document.getElementById('flagSummary').innerHTML=`<div class="ihead"><h3>기준일 검증 플래그 ${flags.length}건</h3>${statusTag('goal')}</div><div class="desc">치명 플래그가 있으면 이후 단계를 멈추고 담당자에게 알립니다. 아래는 가상 데이터로 만든 예시입니다.</div><ul class="flaglist">${flags.slice(0,4).map(f=>`<li><span class="sev ${f.sev}">${f.sev}</span><b>${esc(f.rule)}</b> · ${esc(f.target)} <span class="muted">${esc(f.obs)}</span></li>`).join('')}</ul><button type="button" class="btn small" data-go="daily">데일리 리포트 보기</button>`;
  /* 모듈 상태 */
  document.getElementById('modules').innerHTML=[['모듈 1','모바일 편성 효율 관리 체계','월 단위 구축 완료 · 허브용 종합 평가 산식 설계 예정','done'],['모듈 2','모바일 편성 자원·성과 관리','3종 정보 월 단위 관리 · 일 단위 전환','goal'],['모듈 3','편성 데일리 리포트','검증 → 판단 → 승인 → 배포 사이클','goal'],['모듈 4','데이터 기반 예측','예측 대상·로직 미정','plan'],['모듈 5','동업계 편성 비교','데이터 확보 방식 미정','plan']]
    .map(([n,t,d,s])=>`<div class="mod"><div class="mnum">${n}</div><div><b>${t}</b><div class="desc">${d}</div></div>${statusTag(s)}</div>`).join('');
};

/* ---------- 구좌별 현황 ---------- */
V.slot=function(ctx){
  const {r,p,slots,prevSlots}=ctx;const auto=aggAuto(r);
  const cols=['순위','전시 순번','전시영역코드','구좌명','편성 구분','가중치','구좌 발생 매출 (일평균)','구좌 매출 비중','클릭수 (일평균)','클릭 비중','운영 배너수 (일평균)','배너 1개 매출','배너 1개 클릭','재구매율','전체 실적 (일평균)'];
  const row=(x,i,kind)=>`<tr class="${state.slot===x.slot.code?'hl':''}${kind==='auto'?' autorow':''}">${td(kind==='auto'?'#자동':i+1)}${td(x.slot.seq)}${td('<code>'+esc(x.slot.code)+'</code>')}${td(esc(x.slot.name))}${td(kind==='auto'?'자동노출':'모바일전략')}${td(kind==='auto'?'-':fmt.pct(x.w),1)}${td(fmt.money(x.aSales),1)}${td(fmt.pct(x.ratio),1)}${td(x.aClk==null?'<span class="pill none">결측</span>':fmt.cnt(x.aClk),1)}${td(kind==='auto'?'-':fmt.pct(x.cShare),1)}${td(fmt.n1(x.aBn),1)}${td(fmt.money(x.perBn),1)}${td(fmt.cnt(x.clkPerBn),1)}${td(fmt.pct(x.rb),1)}${td(fmt.money(x.aTot),1)}</tr>`;
  const tS=slots.rows.reduce((a,x)=>a+x.aSales,0),tC=slots.rows.reduce((a,x)=>a+(x.aClk||0),0),tB=slots.rows.reduce((a,x)=>a+x.aBn,0),tT=slots.rows.reduce((a,x)=>a+x.aTot,0);
  const totalRow=`<tr class="total">${td('')}${td('')}${td('total_plan')}${td('합계 (모바일전략 편성)')}${td('')}${td('100.0%',1)}${td(fmt.money(tS),1)}${td(fmt.pct(tS/tT),1)}${td(fmt.cnt(tC),1)}${td('100.0%',1)}${td(fmt.n1(tB),1)}${td(fmt.money(tS/tB),1)}${td(fmt.cnt(tC/tB),1)}${td('-',1)}${td(fmt.money(tT),1)}</tr>`;
  document.getElementById('slotTable').innerHTML=`<thead><tr>${cols.map((c,i)=>`<th${i>=5?' class="num"':''}>${c}</th>`).join('')}</tr></thead><tbody>${totalRow}${slots.rows.map((x,i)=>row(x,i,'plan')).join('')}${auto.map((x,i)=>row(x,i,'auto')).join('')}</tbody>`;
  const prevMap=new Map((prevSlots?prevSlots.rows:[]).map(x=>[x.slot.code,x]));
  hbars(document.getElementById('weightBars'),slots.rows.map(x=>({name:x.slot.name,v:x.w,p:prevMap.has(x.slot.code)?prevMap.get(x.slot.code).w:null,sub:`매출 ${fmt.pct(x.sShare)} · 클릭 ${fmt.pct(x.cShare)}`,
    html:()=>`<b>${esc(x.slot.name)}</b><br>가중치 = 매출 비중 ${fmt.pct(x.sShare)} × 50% + 클릭 비중 ${fmt.pct(x.cShare)} × 50%<br>= <b>${fmt.pct(x.w)}</b>`})),v=>fmt.pct(v),['편성 구좌','','가중치','비중 구성']);
  const months=monthlyTraffic(6);
  document.getElementById('pvTable').innerHTML=`<thead><tr><th>월</th>${PV_TABS.map(t=>`<th class="num">${t}</th>`).join('')}</tr></thead><tbody>${months.map(m=>`<tr>${td(m.ym)}${m.rows.map(x=>td(fmt.cnt(x.avg),1)).join('')}</tr>`).join('')}<tr class="total">${td(PERIODS[state.period])}${aggTraffic(r).map(x=>td(fmt.cnt(x.avg),1)).join('')}</tr></tbody>`;
};

/* ---------- 영업팀별 현황 ---------- */
V.team=function(ctx){
  const {r,p,teams,prevTeams}=ctx;
  const pts=teams.rows.filter(x=>x.wcnt>0).map(x=>({name:x.team.name,x:x.sales,y:x.wcnt,g:x.group}));
  scatter(document.getElementById('scatter'),pts,teams.avgX,teams.avgY,fmt.money);
  document.getElementById('scatterMeta').innerHTML=`평균 편성매출 <b>${fmt.money(teams.avgX)}</b> · 평균 편성사용량 <b>${fmt.n1(teams.avgY)}건</b> (활동 팀 ${teams.n}개 기준) · 1그룹 ${teams.counts[1]} · 2그룹 ${teams.counts[2]} · 3그룹 ${teams.counts[3]} · 4그룹 ${teams.counts[4]}팀`;
  document.getElementById('groupCards').innerHTML=[[1,'평균 편성사용 ↓ 매출 ↑','성공 사례 벤치마킹 및 확대 적용'],[2,'평균 편성사용 ↑ 매출 ↑','효율성 개선을 통한 최적화'],[3,'평균 편성사용 ↓ 매출 ↓','MD 참여 유도 및 활성화'],[4,'평균 편성사용 ↑ 매출 ↓','편성 전략 재검토 및 개선']]
    .map(([g,c,a])=>`<div class="gcard g${g}"><div class="gname">${GROUPS[g][0]} · ${GROUPS[g][1]} <b>${teams.counts[g]}팀</b></div><div class="desc">${c}</div><div class="act">${a}</div><div class="names">${teams.rows.filter(x=>x.group===g).map(x=>esc(x.team.name)).join(', ')||'-'}</div></div>`).join('');
  const prevMap=prevTeams?new Map(prevTeams.rows.map(x=>[x.team.id,x])):null;
  const hdr=`<thead><tr><th>구분</th><th>그룹</th><th class="num">편성 운영 비중 (가중치)</th><th class="num">전사 평균 比</th><th class="num">운영 구좌 (실제)</th><th class="num">운영 구좌 (가중치)</th><th class="num">매출</th><th class="num">편성 1%당 매출</th><th class="num">전사 평균 比</th><th class="num">공헌이익</th><th class="num">1%당 공헌이익</th><th class="num">공헌이익률</th><th class="num">비교 기간 매출</th></tr></thead>`;
  let body=`<tr class="total">${td('전사 합계')}${td('')}${td('100.0%',1)}${td('-',1)}${td(fmt.cnt(teams.rows.reduce((a,x)=>a+x.cnt,0)),1)}${td(fmt.n1(teams.W),1)}${td(fmt.money(teams.S),1)}${td(fmt.money(teams.S/100),1)}${td('-',1)}${td(fmt.money(teams.P),1)}${td(fmt.money(teams.P/100),1)}${td(fmt.pct(teams.S?teams.P/teams.S:null),1)}${td(prevTeams?fmt.money(prevTeams.S):'-',1)}</tr>`;
  body+=`<tr class="avg"><td>전사 평균 (팀별)</td><td></td>${td(fmt.pct(teams.avgShare),1)}${td('-',1)}${td(fmt.n1(teams.rows.reduce((a,x)=>a+x.cnt,0)/teams.n),1)}${td(fmt.n1(teams.avgY),1)}${td(fmt.money(teams.avgX),1)}${td(fmt.money(teams.avgPer1),1)}${td('-',1)}${td(fmt.money(teams.P/teams.n),1)}${td('-',1)}${td('-',1)}${td('-',1)}</tr>`;
  ORG.forEach(([bu])=>{const list=teams.rows.filter(x=>x.team.bu===bu);const s=list.reduce((a,x)=>a+x.sales,0),w=list.reduce((a,x)=>a+x.wcnt,0),c=list.reduce((a,x)=>a+x.cnt,0),pr=list.reduce((a,x)=>a+x.profit,0),sh=teams.W?w/teams.W:0;
    body+=`<tr class="lvl0"><td>${esc(bu)}</td><td></td>${td(fmt.pct(sh),1)}${td(fmt.pp(sh-teams.avgShare*list.length),1)}${td(fmt.cnt(c),1)}${td(fmt.n1(w),1)}${td(fmt.money(s),1)}${td(sh?fmt.money(s/(sh*100)):'-',1)}${td('-',1)}${td(fmt.money(pr),1)}${td(sh?fmt.money(pr/(sh*100)):'-',1)}${td(fmt.pct(s?pr/s:null),1)}${td(prevMap?fmt.money(list.reduce((a,x)=>a+(prevMap.get(x.team.id)||{sales:0}).sales,0)):'-',1)}</tr>`;
    list.forEach(x=>{body+=`<tr class="lvl1 teamrow${state.team===x.team.name?' hl':''}" data-team="${esc(x.team.name)}"><td>${esc(x.team.name)}</td><td>${groupPill(x.group)}</td>${td(fmt.pct(x.share),1)}${td(fmt.pp(x.shareDiff),1)}${td(fmt.cnt(x.cnt),1)}${td(fmt.n1(x.wcnt),1)}${td(fmt.money(x.sales),1)}${td(fmt.money(x.per1),1)}${td(x.per1Diff==null?'-':(x.per1Diff>0?'+':'-')+fmt.money(Math.abs(x.per1Diff)),1)}${td(fmt.money(x.profit),1)}${td(fmt.money(x.pPer1),1)}${td(x.sales?fmt.pct(x.rate):'-',1)}${td(prevMap?fmt.money((prevMap.get(x.team.id)||{sales:0}).sales):'-',1)}</tr>`;});});
  document.getElementById('teamTable').innerHTML=hdr+'<tbody>'+body+'</tbody>';
};
