/* 모바일 편성 허브 v2 — 브리핑, 구좌 지도 */
'use strict';

/* ---------- 브리핑 ---------- */
V.brief=function(ctx){
  const {r,p,slots,prev,teams,prevTeams}=ctx;const days=r.b-r.a+1;
  const sumClk=a=>a.rows.reduce((x,y)=>x+(y.clk||0),0),sumBn=a=>a.rows.reduce((x,y)=>x+y.bn,0)/a.days;
  const tr=aggTraffic(r),ptr=p?aggTraffic(p):null;const top=slots.rows.slice().sort((a,b)=>b.sales-a.sales)[0];
  const topTeam=teams.rows.filter(x=>x.wcnt>0).sort((a,b)=>b.sales-a.sales)[0];const flags=buildFlags();
  const prevWord=p?'직전 '+(state.preset&&state.preset!=='m0'&&state.preset!=='m1'?PRESETS[state.preset]:'같은 기간')+(p.partial?'(일부)':''):'';
  document.getElementById('hero').innerHTML=`<div class="hl">${esc(periodWord())} · ${rangeLabel(r)}</div><div class="hn">${fmt.money(slots.S)}</div><div class="hs">편성 구좌 발생 매출${p?` · ${prevWord} 대비 ${deltaHTML(slots.S,prev.S)}`:''} · 일평균 <b>${fmt.money(slots.S/days)}</b></div>`;
  document.getElementById('notes').innerHTML=`<h2>한 줄 요약</h2><ul>
    <li>매출 상위 구좌는 <b>${esc(top.slot.name)}</b> ${fmt.money(top.sales)}, 가중치 ${fmt.pct(top.w)}로 ${slots.rows[0].slot.code===top.slot.code?'가중치도 1위':'가중치 1위는 '+esc(slots.rows[0].slot.name)}입니다.</li>
    <li>편성 사용량 ${fmt.n1(teams.W)}건(가중치 반영) 중 1그룹 고효율 ${teams.counts[1]}팀, 4그룹 저효율 ${teams.counts[4]}팀. 매출 1위 팀은 <b>${topTeam?esc(topTeam.team.name):'-'}</b> ${topTeam?fmt.money(topTeam.sales):''}.</li>
    <li>기준일 검증 플래그 ${flags.length}건, 치명 ${flags.filter(f=>f.sev==='높음').length}건. <button type="button" class="link" data-go="report">데일리 리포트</button>에서 원인 분류를 봅니다.</li></ul>`;
  const kp=[
    {label:'전체 실적 (편성 구좌 상품)',v:fmt.money(slots.T),d:p?deltaHTML(slots.T,prev.T):'',ser:bucketSeries(r,sTot).vals,extra:`구좌 매출 비중 ${fmt.pct(slots.S/slots.T)}`},
    {label:'클릭수',v:fmt.cnt(sumClk(slots))+'건',d:p?deltaHTML(sumClk(slots),sumClk(prev),'cnt'):'',ser:bucketSeries(r,sClk).vals,extra:`일평균 ${fmt.cnt(sumClk(slots)/days)}건`},
    {label:'편성 사용량 (가중치 반영)',v:fmt.n1(teams.W)+'건',d:p?deltaHTML(teams.W,prevTeams.W,'cnt'):'',ser:null,extra:`실제 ${fmt.cnt(teams.rows.reduce((a,x)=>a+x.cnt,0))}건 · 활동 팀 ${teams.n}개`},
    {label:'운영 배너수 (일평균)',v:fmt.n1(sumBn(slots))+'개',d:p?deltaHTML(sumBn(slots),sumBn(prev),'cnt'):'',ser:null,extra:`기간 내 행사 ${fmt.cnt(bannersIn(r).length)}건`},
    {label:'DAU (일평균)',v:fmt.cnt(tr[0].avg),d:p?deltaHTML(tr[0].avg,ptr[0].avg,'cnt'):'',ser:bucketSeries(r,x=>x.pv[0]).vals,extra:`현대홈쇼핑 탭 ${fmt.cnt(tr[3].avg)}`},
    {label:'별도탭 PV (일평균)',v:fmt.cnt(tr[4].avg),d:p?deltaHTML(tr[4].avg,ptr[4].avg,'cnt'):'',ser:bucketSeries(r,x=>x.pv[4]).vals,extra:`편성표 ${fmt.cnt(tr[1].avg)} · 지금특가 ${fmt.cnt(tr[8].avg)}`}];
  const box=document.getElementById('kpis');box.innerHTML='';
  kp.forEach(t=>{const d=document.createElement('div');d.className='tile';d.innerHTML=`<div class="label">${t.label}</div><div class="value">${t.v}</div><div class="delta">${t.d}</div><div class="delta"><span class="amt">${t.extra}</span></div>`;if(t.ser&&t.ser.length>1)d.appendChild(sparkline(t.ser));box.appendChild(d);});
  /* 구좌 지도 요약 */
  const mm=document.getElementById('minimap');const vals=slotValues(slots,'sales');
  mm.innerHTML=`<div class="phone" data-go="map" title="구좌 지도로 이동"><div class="pscreen" id="miniPhone"></div></div><div class="side" id="miniSide"></div>`;
  renderPhone(document.getElementById('miniPhone'),'home',vals,'',true);
  const ranked=slots.rows.slice().sort((a,b)=>b.sales-a.sales);
  document.getElementById('miniSide').innerHTML=`<b>홈 화면 편성 구좌 ${slots.rows.filter(x=>(LAYOUT[x.slot.code]||{}).scr==='home').length}개</b> · 자동노출 ${AUTO_SLOTS.length}개<br>매출 상위 3: ${ranked.slice(0,3).map(x=>esc(x.slot.name)+' '+fmt.money(x.sales)).join(' · ')}<br>별도 화면: 별도탭 ${fmt.money(slots.byCode.get('I_tab').sales)} · 아울렛탭 ${fmt.money(slots.byCode.get('30_현대아울렛').sales)} · 오늘혜택 ${fmt.money(slots.byCode.get('today_benefit').sales)} · 팝업 ${fmt.money(slots.byCode.get('ad_mbl_main_pop').sales)}<br><button type="button" class="btn small" data-go="map">구좌 지도 열기</button>`;
  /* 추이 */
  const bs=bucketSeries(r,sSales);document.getElementById('trendTitle').textContent=(bs.kind==='d'?'일별':bs.kind==='w'?'주별':'월별')+' 추이';
  columnChart(document.getElementById('trend'),bs.labels,bs.vals,v=>fmt.money(v),{label:'편성 구좌 발생 매출 추이'});
  /* BEST 5 */
  const list=filtered(r);const byTeam=groupTop(list,b=>b.team),byMd=groupTop(list,b=>b.md),byBrand=groupTop(list,b=>b.brand),byEv=list.slice().sort((a,b)=>b.sales-a.sales);
  const b=document.getElementById('best');
  b.innerHTML=['팀 BEST 5','MD BEST 5','브랜드 BEST 5','행사 BEST 5'].map((t,i)=>`<div class="card"><div class="ch"><h2>${t}</h2><span class="hint">구좌 유입 실적</span></div><div class="best" id="best${i}"></div></div>`).join('');
  bestList(document.getElementById('best0'),byTeam.slice(0,5).map(x=>({name:x.key,sub:(TEAMS.find(t=>t.name===x.key)||{}).bu,v:x.sales,sub2:x.n+'건',act:'t:'+x.key})),fmt.money);
  bestList(document.getElementById('best1'),byMd.slice(0,5).map(x=>({name:x.key,sub:x.first.team+' · '+((MDS.find(m=>m.code===x.key)||{}).cat||''),v:x.sales,sub2:x.n+'건',act:'m:'+x.key})),fmt.money);
  bestList(document.getElementById('best2'),byBrand.slice(0,5).map(x=>({name:x.key,sub:x.first.team,v:x.sales,sub2:x.n+'건',act:'b:'+x.key})),fmt.money);
  bestList(document.getElementById('best3'),byEv.slice(0,5).map(x=>({name:x.title,sub:x.team+' · '+x.slot.name,v:x.sales,sub2:x.tot>0?'기여도 '+fmt.pct(x.sales/x.tot,0):'-'})),fmt.money);
  document.getElementById('flagBrief').innerHTML=`<div class="ch"><h2>기준일 ${fmt.date(META.baseDate)} 검증 플래그 ${flags.length}건</h2><span class="hint">치명 플래그가 있으면 리포트 배포를 멈추고 담당자에게 알립니다</span></div><ul class="flaglist">${flags.slice(0,5).map(f=>`<li><span class="sev ${f.sev}">${f.sev}</span><b>${esc(f.rule)}</b><span>${esc(f.target)}</span><span class="muted">${esc(f.obs)}</span></li>`).join('')}</ul><button type="button" class="btn small" data-go="report" style="margin-top:8px">데일리 리포트 보기</button>`;
};

/* ---------- 구좌 지도 ---------- */
V.map=function(ctx){
  const {r,slots}=ctx;const auto=aggAuto(r);const k=state.metric;const vals=slotValues(slots,k);
  if(!state.pick||!slots.byCode.has(state.pick)){const cand=slots.rows.filter(y=>(LAYOUT[y.slot.code]||{}).scr===state.scr).sort((a,b)=>b.sales-a.sales)[0]||slots.rows[0];state.pick=cand.slot.code;}
  const pickScr=(LAYOUT[state.pick]||{}).scr;if(pickScr&&pickScr!==state.scr&&!slotsOf(state.scr).some(x=>x.s.code===state.pick))state.scr=pickScr;
  document.getElementById('metricSeg').innerHTML=Object.keys(METRICS).map(m=>`<button type="button" data-metric="${m}" aria-pressed="${m===k}">${METRICS[m][0]}</button>`).join('');
  document.getElementById('screens').innerHTML=SCREENS.map(([c,n])=>`<button type="button" data-scr="${c}" aria-pressed="${c===state.scr}">${n}</button>`).join('');
  renderPhone(document.getElementById('phone'),state.scr,vals,state.pick,false);heatLegend(document.getElementById('heatLegend'),METRICS[k][0]);
  /* 상세 */
  const x=slots.byCode.get(state.pick);const m=LAYOUT[x.slot.code]||{};const scrName=(SCREENS.find(s=>s[0]===m.scr)||[])[1]||'';
  const evs=bannersIn(r).filter(b=>b.slot.code===x.slot.code).sort((a,b)=>b.sales-a.sales);
  const tu=ctx.teams.rows.map(t=>({name:t.team.name,c:t.bySlot[x.i]})).filter(t=>t.c>0).sort((a,b)=>b.c-a.c);const tc=tu.reduce((a,t)=>a+t.c,0);
  const d=document.getElementById('slotDetail');
  d.innerHTML=`<div class="dh"><div class="shot">${m.img?`<img src="img/${m.img}" alt="${esc(x.slot.name)} 구좌 캡처" onerror="this.parentNode.textContent='구좌 캡처 준비 중'">`:'캡처 없음'}</div>
    <div><h3>${esc(x.slot.name)}</h3><div class="meta"><code>${esc(x.slot.code)}</code> · ${scrName} 화면${x.slot.seq!=='-'?' · 전시 순번 '+x.slot.seq:''} · 모바일전략 편성</div><p>${esc(m.desc||'')}</p><span class="pos">${METRICS[k][0]} ${vals.get(x.slot.code)?vals.get(x.slot.code).rank+1+'위 / '+vals.size+'개':'-'}</span></div></div>
    <div class="dk"><div><div class="l">구좌 발생 매출</div><div class="v">${fmt.money(x.sales)}</div></div><div><div class="l">클릭수</div><div class="v">${x.clk?fmt.cnt(x.clk):'-'}</div></div><div><div class="l">가중치</div><div class="v">${fmt.pct(x.w)}</div></div>
      <div><div class="l">운영 배너수 (일평균)</div><div class="v">${fmt.n1(x.aBn)}개</div></div><div><div class="l">배너 1개당 매출 (일)</div><div class="v">${fmt.money(x.perBn)}</div></div><div><div class="l">구좌 매출 비중</div><div class="v">${fmt.pct(x.ratio)}</div></div></div>
    <div class="dsub chart"><h4>기간 내 일별 구좌 발생 매출</h4><div id="slotTrend"></div></div>
    <div class="g2" style="margin-top:12px"><div class="dsub"><h4>이 구좌의 행사 TOP 5 <span class="muted">(${fmt.cnt(evs.length)}건 중)</span></h4><div class="best" id="slotEv"></div></div>
      <div class="dsub"><h4>팀별 사용 비중 <span class="muted">(배너 ${fmt.cnt(tc)}개)</span></h4><div class="best" id="slotTeam"></div></div></div>`;
  const bs=bucketSeries(r,day=>day.slots[x.i].sales);columnChart(document.getElementById('slotTrend'),bs.labels,bs.vals,v=>fmt.money(v),{h:170,label:x.slot.name+' 일별 매출'});
  bestList(document.getElementById('slotEv'),evs.slice(0,5).map(b=>({name:b.title,sub:b.team+' · MD '+b.md+' · '+fmt.date(DATES[b.start]),v:b.sales,sub2:b.tot>0?'기여도 '+fmt.pct(b.sales/b.tot,0):'-'})),fmt.money);
  bestList(document.getElementById('slotTeam'),tu.slice(0,5).map(t=>({name:t.name,v:t.c,sub2:fmt.pct(t.c/tc,0),act:'t:'+t.name})),v=>fmt.cnt(v)+'개');
  /* 표 */
  const cols=['순위','전시 순번','전시영역코드','구좌명','화면','편성 구분','가중치','구좌 발생 매출 (일평균)','구좌 매출 비중','클릭수 (일평균)','클릭 비중','운영 배너수 (일평균)','배너 1개 매출','배너 1개 클릭','재구매율','전체 실적 (일평균)'];
  const wMax=Math.max(...slots.rows.map(y=>y.w)),sMax=Math.max(...slots.rows.map(y=>y.aSales));
  const row=(y,i,kind)=>{const sc=(SCREENS.find(s=>s[0]===(LAYOUT[y.slot.code]||{}).scr)||['','-'])[1];
    return `<tr class="${kind==='auto'?'autorow':'clickable'}${state.pick===y.slot.code?' hl':''}"${kind==='auto'?'':` data-pick="${esc(y.slot.code)}"`}>${td(kind==='auto'?'#자동':i+1)}${td(y.slot.seq)}${td('<code>'+esc(y.slot.code)+'</code>')}${td(esc(y.slot.name))}${td(sc)}${td(kind==='auto'?'자동노출':'모바일전략')}${kind==='auto'?td('-',1):heatCell(y.w,0,wMax,fmt.pct(y.w))}${kind==='auto'?td(fmt.money(y.aSales),1):heatCell(y.aSales,0,sMax,fmt.money(y.aSales))}${td(fmt.pct(y.ratio),1)}${td(y.aClk==null?'<span class="pill">결측</span>':fmt.cnt(y.aClk),1)}${td(kind==='auto'?'-':fmt.pct(y.cShare),1)}${td(fmt.n1(y.aBn),1)}${td(fmt.money(y.perBn),1)}${td(fmt.cnt(y.clkPerBn),1)}${td(fmt.pct(y.rb),1)}${td(fmt.money(y.aTot),1)}</tr>`;};
  const tS=slots.rows.reduce((a,y)=>a+y.aSales,0),tC=slots.rows.reduce((a,y)=>a+(y.aClk||0),0),tB=slots.rows.reduce((a,y)=>a+y.aBn,0),tT=slots.rows.reduce((a,y)=>a+y.aTot,0);
  document.getElementById('slotTable').innerHTML=`<thead><tr>${cols.map((c,i)=>`<th${i>=6?' class="num"':''}>${c}</th>`).join('')}</tr></thead><tbody><tr class="total">${td('')}${td('')}${td('total_plan')}${td('합계 (모바일전략 편성)')}${td('')}${td('')}${td('100.0%',1)}${td(fmt.money(tS),1)}${td(fmt.pct(tS/tT),1)}${td(fmt.cnt(tC),1)}${td('100.0%',1)}${td(fmt.n1(tB),1)}${td(fmt.money(tS/tB),1)}${td(fmt.cnt(tC/tB),1)}${td('-',1)}${td(fmt.money(tT),1)}</tr>${slots.rows.map((y,i)=>row(y,i,'plan')).join('')}${auto.map((y,i)=>row(y,i,'auto')).join('')}</tbody>`;
};
