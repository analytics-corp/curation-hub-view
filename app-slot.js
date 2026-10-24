/* 모바일 편성 허브 v3 — 구좌별 현황 (구좌 카드 갤러리 · 상세 · 리포트 1번 시트 표 · 가중치 · 주요 탭 PV) */
'use strict';
V.slot=function(ctx){
  const {r,p,slots,prev,teams}=ctx;const auto=aggAuto(r);const k=state.metric;const vals=slotValues(slots,k);
  const inScr=x=>state.scr==='all'||(LAYOUT[x.slot.code]||{}).scr===state.scr;
  const rank=x=>{const v=vals.get(x.slot.code);return v?v.rank:999;};
  const list=slots.rows.filter(inScr).sort((a,b)=>rank(a)-rank(b));
  if(!list.length){state.scr='all';return V.slot(ctx);}
  if(!state.pick||!list.some(x=>x.slot.code===state.pick))state.pick=list[0].slot.code;
  document.getElementById('metricSeg').innerHTML=Object.keys(METRICS).map(m=>`<button type="button" data-metric="${m}" aria-pressed="${m===k}">${METRICS[m][0]}</button>`).join('');
  document.getElementById('screens').innerHTML=[['all','전체 화면']].concat(SCREENS).map(([c,n])=>`<button type="button" data-scr="${c}" aria-pressed="${c===state.scr}">${n} <small>${c==='all'?slots.rows.length:slots.rows.filter(x=>(LAYOUT[x.slot.code]||{}).scr===c).length}</small></button>`).join('');
  /* 구좌 카드 갤러리 */
  document.getElementById('gallery').innerHTML=list.map(x=>{const m=LAYOUT[x.slot.code]||{};const v=vals.get(x.slot.code);
    const sub=k==='sales'?`클릭 ${fmt.cnt(x.clk)} · 가중치 ${fmt.pct(x.w)}`:k==='clk'?`매출 ${fmt.money(x.sales)} · 가중치 ${fmt.pct(x.w)}`:`매출 ${fmt.money(x.sales)} · 클릭 ${fmt.cnt(x.clk)}`;
    return `<div class="scard${x.slot.code===state.pick?' sel':''}" data-pick="${esc(x.slot.code)}" tabindex="0" role="button" aria-pressed="${x.slot.code===state.pick}">
      <div class="simg">${m.img?`<img src="img/${m.img}" alt="${esc(x.slot.name)} 구좌 캡처" onerror="this.parentNode.classList.add('none');this.remove()">`:''}<span class="srank">${v?v.rank+1+'위':'-'}</span></div>
      <div class="sbody"><b>${esc(x.slot.name)}</b><small>${screenName(x.slot.code)} 화면${x.slot.seq!=='-'?' · 전시 순번 '+x.slot.seq:''}</small><div class="sval">${v?esc(v.text):'-'} <span class="muted">${METRICS[k][0]}</span></div><div class="ssub">${sub}</div></div></div>`;}).join('');
  /* 상세 */
  const x=slots.byCode.get(state.pick);const m=LAYOUT[x.slot.code]||{};const scr=m.scr||'home';const px=prev?prev.byCode.get(x.slot.code):null;
  const evs=bannersIn(r).filter(b=>b.slot.code===x.slot.code).sort((a,b)=>b.sales-a.sales);
  const tu=teams.rows.map(t=>({name:t.team.name,c:t.bySlot[x.i]})).filter(t=>t.c>0).sort((a,b)=>b.c-a.c);const tc=tu.reduce((a,t)=>a+t.c,0);
  const kpi=(l,v,d)=>`<div><div class="l">${l}</div><div class="v">${v}</div>${d!=null?`<div class="d">${d}</div>`:''}</div>`;
  document.getElementById('slotDetail').innerHTML=`<div class="dh">
    <div class="shot big">${m.img?`<img src="img/${m.img}" alt="${esc(x.slot.name)} 구좌 캡처" onerror="this.parentNode.textContent='구좌 캡처 준비 중'">`:'캡처 없음'}</div>
    <div class="dtext"><h3>${esc(x.slot.name)}</h3><div class="meta"><code>${esc(x.slot.code)}</code> · ${screenName(x.slot.code)} 화면${x.slot.seq!=='-'?' · 전시 순번 '+x.slot.seq:''} · 모바일전략 편성 · ${METRICS[k][0]} ${vals.get(x.slot.code)?vals.get(x.slot.code).rank+1+'위 / '+vals.size+'개':'-'}</div><p>${esc(m.desc||'')}</p>
      <div class="dk">${kpi('구좌 발생 매출',fmt.money(x.sales),px?deltaHTML(x.sales,px.sales):null)}${kpi('클릭수',x.clk?fmt.cnt(x.clk)+'건':'-',px&&x.clk&&px.clk?deltaHTML(x.clk,px.clk,'cnt'):null)}${kpi('가중치',fmt.pct(x.w),px?deltaHTML(x.w,px.w,'pct'):null)}${kpi('운영 배너수 (일평균)',fmt.n1(x.aBn)+'개',px?deltaHTML(x.aBn,px.aBn,'cnt'):null)}${kpi('배너 1개당 매출 (일)',fmt.money(x.perBn),px?deltaHTML(x.perBn,px.perBn):null)}${kpi('구좌 매출 비중',fmt.pct(x.ratio),px?deltaHTML(x.ratio,px.ratio,'pct'):null)}${kpi('재구매율',fmt.pct(x.rb))}${kpi('전체 실적 (일평균)',fmt.money(x.aTot),px?deltaHTML(x.aTot,px.aTot):null)}</div></div>
    <div class="dpos"><div class="desc">앱 화면 위치 · ${METRICS[k][0]} 순위 농도</div><div class="phone mini"><div class="pscreen" id="posPhone"></div></div></div></div>
    <div class="grid3 dsubs"><div class="dsub chart"><h4>구좌 발생 매출 추이 <span class="muted">점선 = 비교 기간</span></h4><div id="slotTrend"></div></div>
      <div class="dsub"><h4>이 구좌의 행사 TOP 5 <span class="muted">(${fmt.cnt(evs.length)}건 중)</span></h4><div class="best" id="slotEv"></div></div>
      <div class="dsub"><h4>팀별 사용 비중 <span class="muted">(배너 ${fmt.cnt(tc)}개)</span></h4><div class="best" id="slotTeam"></div></div></div>`;
  renderPhone(document.getElementById('posPhone'),scr,vals,x.slot.code,true);
  const bs=bucketSeries(r,day=>day.slots[x.i].sales),pb=p?bucketSeries(p,day=>day.slots[x.i].sales).vals.slice(0,bs.vals.length):null;
  columnChart(document.getElementById('slotTrend'),bs.labels,bs.vals,pb,v=>fmt.money(v),{h:180,label:x.slot.name+' 매출 추이'});
  bestList(document.getElementById('slotEv'),evs.slice(0,5).map(b=>({name:b.title,sub:b.team+' · MD '+b.md+' · '+fmt.date(DATES[b.start]),v:b.sales,sub2:b.tot>0?'기여도 '+fmt.pct(b.sales/b.tot,0):'-',act:'q:'+b.title})),fmt.money);
  bestList(document.getElementById('slotTeam'),tu.slice(0,5).map(t=>({name:t.name,v:t.c,sub2:fmt.pct(t.c/tc,0),act:'t:'+t.name})),v=>fmt.cnt(v)+'개');
  /* 리포트 1번 시트 표 */
  const cols=['순위','전시 순번','전시영역코드','구좌명','화면','편성 구분','가중치','구좌 발생 매출 (일평균)','구좌 매출 비중','클릭수 (일평균)','클릭 비중','운영 배너수 (일평균)','배너 1개 매출','배너 1개 클릭','재구매율','전체 실적 (일평균)'];
  const wMax=Math.max(...slots.rows.map(y=>y.w)),sMax=Math.max(...slots.rows.map(y=>y.aSales));
  const row=(y,i,kind)=>`<tr class="${kind==='auto'?'autorow':'clickable'}${state.pick===y.slot.code&&kind!=='auto'?' hl':''}"${kind==='auto'?'':` data-pick="${esc(y.slot.code)}"`}>${td(kind==='auto'?'#자동':i+1)}${td(y.slot.seq)}${td('<code>'+esc(y.slot.code)+'</code>')}${td(esc(y.slot.name))}${td(screenName(y.slot.code))}${td(kind==='auto'?'자동노출':'모바일전략')}${kind==='auto'?td('-',1):heatCell(y.w,0,wMax,fmt.pct(y.w))}${kind==='auto'?td(fmt.money(y.aSales),1):heatCell(y.aSales,0,sMax,fmt.money(y.aSales))}${td(fmt.pct(y.ratio),1)}${td(y.aClk==null?'<span class="pill none">결측</span>':fmt.cnt(y.aClk),1)}${td(kind==='auto'?'-':fmt.pct(y.cShare),1)}${td(fmt.n1(y.aBn),1)}${td(fmt.money(y.perBn),1)}${td(fmt.cnt(y.clkPerBn),1)}${td(fmt.pct(y.rb),1)}${td(fmt.money(y.aTot),1)}</tr>`;
  const tS=slots.rows.reduce((a,y)=>a+y.aSales,0),tC=slots.rows.reduce((a,y)=>a+(y.aClk||0),0),tB=slots.rows.reduce((a,y)=>a+y.aBn,0),tT=slots.rows.reduce((a,y)=>a+y.aTot,0);
  document.getElementById('slotTable').innerHTML=`<thead><tr>${cols.map((c,i)=>`<th${i>=6?' class="num"':''}>${c}</th>`).join('')}</tr></thead><tbody><tr class="total">${td('')}${td('')}${td('total_plan')}${td('합계 (모바일전략 편성)')}${td('')}${td('')}${td('100.0%',1)}${td(fmt.money(tS),1)}${td(fmt.pct(tS/tT),1)}${td(fmt.cnt(tC),1)}${td('100.0%',1)}${td(fmt.n1(tB),1)}${td(fmt.money(tS/tB),1)}${td(fmt.cnt(tC/tB),1)}${td('-',1)}${td(fmt.money(tT),1)}</tr>${slots.rows.map((y,i)=>row(y,i,'plan')).join('')}${auto.map((y,i)=>row(y,i,'auto')).join('')}</tbody>`;
  /* 가중치 막대 + 주요 탭 PV */
  const prevMap=new Map((prev?prev.rows:[]).map(y=>[y.slot.code,y]));
  hbars(document.getElementById('weightBars'),slots.rows.map(y=>({name:y.slot.name,v:y.w,p:prevMap.has(y.slot.code)?prevMap.get(y.slot.code).w:null,sub:`매출 ${fmt.pct(y.sShare)} · 클릭 ${fmt.pct(y.cShare)}`,act:'k:'+y.slot.code,
    html:()=>`<b>${esc(y.slot.name)}</b><br>가중치 = 매출 비중 ${fmt.pct(y.sShare)} × 50% + 클릭 비중 ${fmt.pct(y.cShare)} × 50% = <b>${fmt.pct(y.w)}</b>`})),v=>fmt.pct(v),['편성 구좌','','가중치','비중 구성']);
  const months=monthlyTraffic(6);
  document.getElementById('pvTable').innerHTML=`<thead><tr><th>월</th>${PV_TABS.map(t=>`<th class="num">${t}</th>`).join('')}</tr></thead><tbody>${months.map(mo=>`<tr>${td(mo.ym)}${mo.rows.map(y=>td(fmt.cnt(y.avg),1)).join('')}</tr>`).join('')}<tr class="total">${td(esc(periodWord()))}${aggTraffic(r).map(y=>td(fmt.cnt(y.avg),1)).join('')}</tr></tbody>`;
};
