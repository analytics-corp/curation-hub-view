/* 모바일 편성 허브 v3 — 편성 요약 화면 */
'use strict';
V.home=function(ctx){
  const {r,p,slots,prev,teams,prevTeams}=ctx;const days=r.b-r.a+1;
  const sumClk=a=>a.rows.reduce((x,y)=>x+(y.clk||0),0),sumBn=a=>a.rows.reduce((x,y)=>x+y.bn,0)/a.days;
  const tr=aggTraffic(r),ptr=p?aggTraffic(p):null;const W=slots.weights;
  const ser=(rng,f)=>rng?bucketSeries(rng,f).vals:null;const trim=(a,n)=>a?a.slice(0,n):null;
  const cur=[ser(r,sSales),ser(r,sClk),ser(r,x=>sUsage(x,W)),ser(r,x=>x.pv[0])],prv=[ser(p,sSales),ser(p,sClk),ser(p,x=>sUsage(x,W)),ser(p,x=>x.pv[0])].map((a,i)=>trim(a,cur[i].length));
  const tiles=[
    {label:'편성 구좌 발생 매출',v:fmt.money(slots.S),d:deltaHTML(slots.S,prev&&prev.S),cur:cur[0],prev:prv[0],extra:`일평균 ${fmt.money(slots.S/days)}`},
    {label:'전체 실적 (편성 구좌 상품)',v:fmt.money(slots.T),d:deltaHTML(slots.T,prev&&prev.T),cur:null,extra:`구좌 매출 비중 ${fmt.pct(slots.S/slots.T)}`},
    {label:'클릭수 (모바일 편성 트래픽)',v:fmt.cnt(sumClk(slots))+'건',d:deltaHTML(sumClk(slots),prev&&sumClk(prev),'cnt'),cur:cur[1],prev:prv[1],extra:`일평균 ${fmt.cnt(sumClk(slots)/days)}건`},
    {label:'편성 사용량 (가중치 반영)',v:fmt.n1(teams.W)+'건',d:deltaHTML(teams.W,prevTeams&&prevTeams.W,'cnt'),cur:cur[2],prev:prv[2],extra:`실제 운영 ${fmt.cnt(teams.rows.reduce((a,x)=>a+x.cnt,0))}건 · 활동 팀 ${teams.n}개`},
    {label:'운영 배너수 (일평균)',v:fmt.n1(sumBn(slots))+'개',d:deltaHTML(sumBn(slots),prev&&sumBn(prev),'cnt'),cur:null,extra:`기간 내 행사 ${fmt.cnt(bannersIn(r).length)}건`},
    {label:'DAU (일평균)',v:fmt.cnt(tr[0].avg),d:deltaHTML(tr[0].avg,ptr&&ptr[0].avg,'cnt'),cur:cur[3],prev:prv[3],extra:`현대홈쇼핑 탭 ${fmt.cnt(tr[3].avg)} · 별도탭 PV ${fmt.cnt(tr[4].avg)}`}];
  const box=document.getElementById('kpis');box.innerHTML='';
  tiles.forEach(t=>{const d=document.createElement('div');d.className='tile';d.innerHTML=`<div class="label">${t.label}</div><div class="value">${t.v}</div><div class="delta">${t.d}</div><div class="delta"><span class="amt">${t.extra}</span></div>`;if(t.cur&&t.cur.length>1)d.appendChild(sparkline(t.cur,t.prev));box.appendChild(d);});
  /* 3종 정보 */
  const g=teams.counts,topS=slots.rows.slice().sort((a,b)=>b.sales-a.sales)[0],topT=teams.rows.filter(x=>x.wcnt>0).sort((a,b)=>b.sales-a.sales)[0];
  document.getElementById('infoCards').innerHTML=[
    ['편성 자원','편성 사용량 · 운영 배너 · 효율 그룹 분포',`<b>${fmt.n1(teams.W)}</b>건 (가중치 반영) · 실제 ${fmt.cnt(teams.rows.reduce((a,x)=>a+x.cnt,0))}건<br>1그룹 ${g[1]} · 2그룹 ${g[2]} · 3그룹 ${g[3]} · 4그룹 ${g[4]}팀 · 사용량 1위 ${esc(teams.rows.slice().sort((a,b)=>b.wcnt-a.wcnt)[0].team.name)}`,'team'],
    ['실적','구좌 발생 매출 · 전체 실적 · 기여도',`<b>${fmt.money(slots.S)}</b> 구좌 발생 · 전체 ${fmt.money(slots.T)} (비중 ${fmt.pct(slots.S/slots.T)})<br>매출 1위 구좌 ${esc(topS.slot.name)} ${fmt.money(topS.sales)} · 매출 1위 팀 ${topT?esc(topT.team.name)+' '+fmt.money(topT.sales):'-'}`,'slot'],
    ['트래픽','주요 탭 PV · 편성 구좌 클릭 (일평균)',`DAU <b>${fmt.cnt(tr[0].avg)}</b> · 현대홈쇼핑 탭 ${fmt.cnt(tr[3].avg)} · 별도탭 ${fmt.cnt(tr[4].avg)}<br>편성 구좌 클릭 ${fmt.cnt(sumClk(slots)/days)}건/일 · 클릭 1위 구좌 ${esc(slots.rows.slice().sort((a,b)=>(b.clk||0)-(a.clk||0))[0].slot.name)}`,'slot']
  ].map(([t,sub,body,view])=>`<div class="card info"><h3>${t}</h3><div class="desc">${sub}</div><div class="ibody">${body}</div><button type="button" class="btn small" data-go="${view}">자세히</button></div>`).join('');
  /* 구좌별 매출 막대 + 팀 TOP 10 */
  const prevMap=new Map((prev?prev.rows:[]).map(x=>[x.slot.code,x]));
  hbars(document.getElementById('slotBars'),slots.rows.map(x=>({name:x.slot.name,v:x.sales,p:prevMap.has(x.slot.code)?prevMap.get(x.slot.code).sales:null,sub:`가중치 ${fmt.pct(x.w)}`,act:'k:'+x.slot.code,
    html:()=>`<b>${esc(x.slot.name)}</b> · ${screenName(x.slot.code)} 화면<br>구좌 발생 매출 ${fmt.money(x.sales)} · 일평균 ${fmt.money(x.aSales)}<br>클릭 ${fmt.cnt(x.clk)}건 · 배너 ${fmt.n1(x.aBn)}개/일 · 재구매율 ${fmt.pct(x.rb)}`})),fmt.money,['편성 구좌','','구좌 발생 매출','가중치']);
  const top=teams.rows.filter(x=>x.wcnt>0).sort((a,b)=>b.sales-a.sales).slice(0,10);const per1Max=Math.max(...top.map(x=>x.per1||0));
  document.getElementById('teamTop').innerHTML=`<thead><tr><th>팀</th><th>그룹</th><th class="num">사용량</th><th class="num">매출</th><th class="num">1%당 매출</th></tr></thead><tbody>${top.map(x=>`<tr class="clickable" data-act="t:${esc(x.team.name)}"><td>${esc(x.team.name)} <span class="muted">${esc(x.team.bu)}</span></td><td>${groupPill(x.group)}</td>${td(fmt.n1(x.wcnt),1)}${td(fmt.money(x.sales),1)}${heatCell(x.per1||0,0,per1Max,fmt.money(x.per1))}</tr>`).join('')}</tbody>`;
  /* 추이 */
  const bs=bucketize(r);document.getElementById('trendTitle').textContent=(bs.kind==='d'?'일별':bs.kind==='w'?'주별':'월별')+' 추이';
  const tb=document.getElementById('trends');tb.innerHTML=[['편성 구좌 발생 매출','원 · 점선 = 비교 기간'],['클릭수','건 · 점선 = 비교 기간'],['편성 사용량 (가중치 반영)','건 · 점선 = 비교 기간']].map(([t,u],i)=>`<div class="card chart"><div class="ttl"><b>${t}</b><span>${u}</span></div><div id="trend${i}"></div></div>`).join('');
  columnChart(document.getElementById('trend0'),bs.labels,cur[0],prv[0],v=>fmt.money(v),{label:'편성 구좌 발생 매출 추이'});
  columnChart(document.getElementById('trend1'),bs.labels,cur[1],prv[1],v=>fmt.cnt(v),{label:'클릭수 추이'});
  columnChart(document.getElementById('trend2'),bs.labels,cur[2],prv[2],v=>fmt.n1(v),{label:'편성 사용량 추이'});
  /* 사업부별 현황 */
  const pmap=prevTeams?new Map(prevTeams.rows.map(x=>[x.team.id,x])):null;
  document.getElementById('buTable').innerHTML=`<thead><tr><th>사업부</th><th class="num">활동 팀</th><th class="num">편성 사용량 (가중치)</th><th class="num">사용량 비중</th><th class="num">매출</th><th class="num">매출 비중</th><th class="num">편성 1%당 매출</th><th class="num">비교 기간 대비</th><th>그룹 분포 (1·2·3·4)</th></tr></thead><tbody>${ORG.map(([bu])=>{const list=teams.rows.filter(x=>x.team.bu===bu);const s=list.reduce((a,x)=>a+x.sales,0),w=list.reduce((a,x)=>a+x.wcnt,0),sh=teams.W?w/teams.W:0,ps=pmap?list.reduce((a,x)=>a+(pmap.get(x.team.id)||{sales:0}).sales,0):null;const c=[1,2,3,4].map(k=>list.filter(x=>x.group===k).length);
    return `<tr>${td(esc(bu))}${td(list.filter(x=>x.wcnt>0).length,1)}${td(fmt.n1(w),1)}${td(fmt.pct(sh),1)}${td(fmt.money(s),1)}${td(fmt.pct(teams.S?s/teams.S:null),1)}${td(sh?fmt.money(s/(sh*100)):'-',1)}${td(ps!=null?deltaHTML(s,ps):'-',1)}${td(c.join(' · '))}</tr>`;}).join('')}</tbody>`;
  /* BEST 5 */
  const list=filtered(r);const byTeam=groupTop(list,b=>b.team),byMd=groupTop(list,b=>b.md),byBrand=groupTop(list,b=>b.brand),byEv=list.slice().sort((a,b)=>b.sales-a.sales);
  document.getElementById('best').innerHTML=['팀 BEST 5','MD BEST 5','브랜드 BEST 5','행사 BEST 5'].map((t,i)=>`<div class="card"><h3>${t}</h3><div class="desc">구좌 유입 실적 · 누르면 해당 조건의 행사 목록</div><div class="best" id="best${i}"></div></div>`).join('');
  bestList(document.getElementById('best0'),byTeam.slice(0,5).map(x=>({name:x.key,sub:(TEAMS.find(t=>t.name===x.key)||{}).bu,v:x.sales,sub2:x.n+'건',act:'t:'+x.key})),fmt.money);
  bestList(document.getElementById('best1'),byMd.slice(0,5).map(x=>({name:x.key,sub:x.first.team+' · '+((MDS.find(m=>m.code===x.key)||{}).cat||''),v:x.sales,sub2:x.n+'건',act:'m:'+x.key})),fmt.money);
  bestList(document.getElementById('best2'),byBrand.slice(0,5).map(x=>({name:x.key,sub:x.first.team,v:x.sales,sub2:x.n+'건',act:'b:'+x.key})),fmt.money);
  bestList(document.getElementById('best3'),byEv.slice(0,5).map(x=>({name:x.title,sub:x.team+' · '+x.slot.name+' · '+fmt.date(DATES[x.start]),v:x.sales,sub2:x.tot>0?'기여도 '+fmt.pct(x.sales/x.tot,0):'-',act:'q:'+x.title})),fmt.money);
};
