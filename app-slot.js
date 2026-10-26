/* 모바일 편성 허브 v3 — 구좌별 현황 (Hmall 광고 구좌 안내 양식: 왼쪽 앱 화면 캡처 + 오른쪽 화면·구좌 선택과 결과 · 리포트 1번 시트 표 · 가중치 · 주요 탭 PV) */
'use strict';
const SCREEN_SUB={all:'편성 구좌 전체',home:'띠배너 ~ MD 제안',tab:'브랜드 단독 탭',outlet:'현대아울렛 탭',today:'하단 메뉴 오늘혜택',popup:'앱 진입 팝업'};
/* 구좌 글자표: 화면 순서(홈 → 별도탭 → 아울렛탭 → 오늘혜택 → 팝업) 안에서 전시 순번 순으로 A, B, C … 고정 */
const SLOT_ORDER=[];SCREENS.forEach(([c])=>slotsOf(c).forEach(x=>{if(!x.auto)SLOT_ORDER.push(x.s.code);}));
const SLOT_LETTER=new Map(SLOT_ORDER.map((c,i)=>[c,String.fromCharCode(65+i)]));
const letterOf=code=>SLOT_LETTER.get(code)||'·';
const RANKED=Object.keys(METRICS);
function dimOn(){try{return localStorage.getItem('hubDim')!=='0';}catch(e){return true;}}
V.slot=function(ctx){
  const {r,p,slots,prev,teams}=ctx;const auto=aggAuto(r);const k=state.metric;const vals=slotValues(slots,k);
  const scrOf=c=>(LAYOUT[c]||{}).scr;const inScr=c=>state.scr==='all'||scrOf(c)===state.scr;
  const list=SLOT_ORDER.filter(inScr).map(c=>slots.byCode.get(c)).filter(Boolean);
  if(!list.length){state.scr='all';return V.slot(ctx);}
  const rankOf=c=>{const v=vals.get(c);return v?v.rank:999;};
  if(!state.pick||!list.some(x=>x.slot.code===state.pick))state.pick=list.slice().sort((a,b)=>rankOf(a.slot.code)-rankOf(b.slot.code))[0].slot.code;
  const x=slots.byCode.get(state.pick);const m=LAYOUT[x.slot.code]||{};const v=vals.get(x.slot.code);const px=prev?prev.byCode.get(x.slot.code):null;
  const rankText=v?METRICS[k][0]+' '+(v.rank+1)+'위':'';
  /* 왼쪽: 앱 화면 캡처 + 구좌 테두리·이름표 + 구좌 밖 흐리게(4면) */
  const [bx,by,bw,bh]=m.box||[0,0,100,100];const shot=document.getElementById('phoneShot');
  shot.className='am-screen'+(dimOn()?'':' nodim')+(m.img?'':' none');
  const na=(l,t,w,h)=>`<i class="na" style="left:${l}%;top:${t}%;width:${w}%;height:${h}%"></i>`;
  shot.innerHTML=(m.img?`<img src="img/${m.img}" alt="${esc(x.slot.name)} 구좌가 표시된 앱 화면">`:'')+na(0,0,100,by)+na(0,by+bh,100,100-by-bh)+na(0,by,bx,bh)+na(bx+bw,by,100-bx-bw,bh)+
    `<span class="zone sel${bw<60?(by<6?' below':' above'):''}" style="left:${bx}%;top:${by}%;width:${bw}%;height:${bh}%"><span class="ztag"><em>${letterOf(x.slot.code)}</em>${esc(x.slot.name)}<span>· ${v?esc(v.text):'-'}</span></span></span>`;
  document.getElementById('phoneCap').textContent=`${screenName(x.slot.code)} 화면${x.slot.seq!=='-'?' · 전시 순번 '+x.slot.seq:''} · 빨간 점선이 이 구좌 · 캡처는 25.09 리포트 1번 시트 셀 메모`;
  /* 오른쪽 위: 화면 그룹 · 구좌 칩 */
  const cnt=c=>c==='all'?SLOT_ORDER.length:SLOT_ORDER.filter(q=>scrOf(q)===c).length;
  document.getElementById('screens').innerHTML=[['all','전체 화면']].concat(SCREENS).map(([c,n])=>`<button type="button" data-scr="${c}" class="${c===state.scr?'on':''}">${n}<small>${SCREEN_SUB[c]||''} · ${cnt(c)}</small></button>`).join('');
  const autos=state.scr==='all'||state.scr==='home'?slotsOf('home').filter(q=>q.auto):[];
  document.getElementById('slotChips').innerHTML=list.map(y=>{const q=vals.get(y.slot.code);return `<button type="button" class="am-chip${y.slot.code===state.pick?' sel':''}" data-pick="${esc(y.slot.code)}" title="${esc(y.slot.name)} · ${screenName(y.slot.code)} 화면"><em>${letterOf(y.slot.code)}</em>${esc(y.slot.name)}<span class="n">${q?q.rank+1+'위':'-'}</span></button>`;}).join('')+
    autos.map(q=>`<span class="am-chip na" title="${esc(q.s.name)} · 시스템 자동 노출 영역(편성 구좌 아님)"><em>·</em>${esc(q.s.name)}<span class="n">자동</span></span>`).join('');
  /* 오른쪽 아래: 선택 구좌 결과 (지표 카드를 누르면 순위 기준이 바뀜) */
  const evs=bannersIn(r).filter(bn=>bn.slot.code===x.slot.code).sort((a,c)=>c.sales-a.sales);
  const tu=teams.rows.map(t=>({name:t.team.name,c:t.bySlot[x.i]})).filter(t=>t.c>0).sort((a,c)=>c.c-a.c);const tc=tu.reduce((a,t)=>a+t.c,0);
  const src={sales:[x.sales,px&&px.sales,''],clk:[x.clk,px&&px.clk,'cnt'],w:[x.w,px&&px.w,'pct'],perBn:[x.perBn,px&&px.perBn,''],ratio:[x.ratio,px&&px.ratio,'pct'],rb:[x.rb,null,'']};
  const card=q=>{const [c,pv,kind]=src[q];const vv=slotValues(slots,q).get(x.slot.code);
    return `<button type="button" class="var${q===k?' on':''}" data-metric="${q}"><span class="vl">${METRICS[q][0]}</span><span class="vp">${METRICS[q][1](c)}${q==='clk'&&c!=null?'건':''}</span><span class="vs">${pv!=null?deltaHTML(c,pv,kind):'비교값 없음'}</span><span class="vpos">${vv?`${vals.size}개 중 ${vv.rank+1}위`:'순위 없음'}</span></button>`;};
  const solo=(l,c,pv,kind,f)=>`<div class="var solo"><span class="vl">${l}</span><span class="vp">${f(c)}</span><span class="vs">${pv!=null?deltaHTML(c,pv,kind):'비교값 없음'}</span><span class="vpos">순위 기준 아님</span></div>`;
  document.getElementById('slotDetail').innerHTML=`<div class="d-head"><div class="d-code">${letterOf(x.slot.code)}</div><div class="d-text">
      <div class="d-grp">${screenName(x.slot.code)} 화면${x.slot.seq!=='-'?' · 전시 순번 '+x.slot.seq:''} · <code>${esc(x.slot.code)}</code> · 모바일전략 편성</div>
      <div class="d-name">${esc(x.slot.name)}${v?`<span class="vtag">${rankText} / ${vals.size}개</span>`:''}</div><p class="d-desc">${esc(m.desc||'')}</p></div></div>
    <div class="vars"><div class="vars-h">지표별 결과 <span class="cnt">8</span><small>${esc(periodWord())}${px?' · 증감은 '+esc(prevWord(p))+' 대비':''} · 지표를 누르면 순위 기준이 바뀝니다</small></div>
      <div class="vgrid">${RANKED.map(card).join('')}${solo('운영 배너수 (일평균)',x.aBn,px&&px.aBn,'cnt',q=>fmt.n1(q)+'개')}${solo('전체 실적 (일평균)',x.aTot,px&&px.aTot,'',fmt.money)}</div></div>
    <dl class="facts"><div><dt>화면</dt><dd>${screenName(x.slot.code)}</dd></div><div><dt>전시 순번</dt><dd>${x.slot.seq}</dd></div><div><dt>편성 구분</dt><dd>모바일전략</dd></div><div><dt>${esc(periodWord())} 행사</dt><dd>${fmt.cnt(evs.length)}건 · 배너 ${fmt.cnt(tc)}개</dd></div></dl>
    <div class="sec-t">구좌 발생 매출 추이 <small>점선 = 비교 기간</small></div><div class="chart" id="slotTrend"></div>
    <div class="dsubs"><div><div class="sec-t">이 구좌의 행사 TOP 5 <small>(${fmt.cnt(evs.length)}건 중)</small></div><div class="best" id="slotEv"></div></div>
      <div><div class="sec-t">팀별 사용 비중 <small>(배너 ${fmt.cnt(tc)}개)</small></div><div class="best" id="slotTeam"></div></div></div>`;
  const bs=bucketSeries(r,day=>day.slots[x.i].sales),pb=p?bucketSeries(p,day=>day.slots[x.i].sales).vals.slice(0,bs.vals.length):null;
  columnChart(document.getElementById('slotTrend'),bs.labels,bs.vals,pb,q=>fmt.money(q),{h:180,label:x.slot.name+' 매출 추이'});
  bestList(document.getElementById('slotEv'),evs.slice(0,5).map(bn=>({name:bn.title,sub:bn.team+' · MD '+bn.md+' · '+fmt.date(DATES[bn.start]),v:bn.sales,sub2:bn.tot>0?'기여도 '+fmt.pct(bn.sales/bn.tot,0):'-',act:'q:'+bn.title})),fmt.money);
  bestList(document.getElementById('slotTeam'),tu.slice(0,5).map(t=>({name:t.name,v:t.c,sub2:fmt.pct(t.c/tc,0),act:'t:'+t.name})),q=>fmt.cnt(q)+'개');
  /* 리포트 1번 시트 표 */
  const cols=['순위','구좌','전시 순번','전시영역코드','구좌명','화면','편성 구분','가중치','구좌 발생 매출 (일평균)','구좌 매출 비중','클릭수 (일평균)','클릭 비중','운영 배너수 (일평균)','배너 1개 매출','배너 1개 클릭','재구매율','전체 실적 (일평균)'];
  const wMax=Math.max(...slots.rows.map(y=>y.w)),sMax=Math.max(...slots.rows.map(y=>y.aSales));
  const row=(y,i,kind)=>`<tr class="${kind==='auto'?'autorow':'clickable'}${state.pick===y.slot.code&&kind!=='auto'?' hl':''}"${kind==='auto'?'':` data-pick="${esc(y.slot.code)}"`}>${td(kind==='auto'?'#자동':i+1)}${td(kind==='auto'?'-':'<span class="lt">'+letterOf(y.slot.code)+'</span>')}${td(y.slot.seq)}${td('<code>'+esc(y.slot.code)+'</code>')}${td(esc(y.slot.name))}${td(screenName(y.slot.code))}${td(kind==='auto'?'자동노출':'모바일전략')}${kind==='auto'?td('-',1):heatCell(y.w,0,wMax,fmt.pct(y.w))}${kind==='auto'?td(fmt.money(y.aSales),1):heatCell(y.aSales,0,sMax,fmt.money(y.aSales))}${td(fmt.pct(y.ratio),1)}${td(y.aClk==null?'<span class="pill none">결측</span>':fmt.cnt(y.aClk),1)}${td(kind==='auto'?'-':fmt.pct(y.cShare),1)}${td(fmt.n1(y.aBn),1)}${td(fmt.money(y.perBn),1)}${td(fmt.cnt(y.clkPerBn),1)}${td(fmt.pct(y.rb),1)}${td(fmt.money(y.aTot),1)}</tr>`;
  const tS=slots.rows.reduce((a,y)=>a+y.aSales,0),tC=slots.rows.reduce((a,y)=>a+(y.aClk||0),0),tB=slots.rows.reduce((a,y)=>a+y.aBn,0),tT=slots.rows.reduce((a,y)=>a+y.aTot,0);
  document.getElementById('slotTable').innerHTML=`<thead><tr>${cols.map((c,i)=>`<th${i>=7?' class="num"':''}>${c}</th>`).join('')}</tr></thead><tbody><tr class="total">${td('')}${td('')}${td('')}${td('total_plan')}${td('합계 (모바일전략 편성)')}${td('')}${td('')}${td('100.0%',1)}${td(fmt.money(tS),1)}${td(fmt.pct(tS/tT),1)}${td(fmt.cnt(tC),1)}${td('100.0%',1)}${td(fmt.n1(tB),1)}${td(fmt.money(tS/tB),1)}${td(fmt.cnt(tC/tB),1)}${td('-',1)}${td(fmt.money(tT),1)}</tr>${slots.rows.map((y,i)=>row(y,i,'plan')).join('')}${auto.map((y,i)=>row(y,i,'auto')).join('')}</tbody>`;
  /* 가중치 막대 + 주요 탭 PV */
  const prevMap=new Map((prev?prev.rows:[]).map(y=>[y.slot.code,y]));
  hbars(document.getElementById('weightBars'),slots.rows.map(y=>({name:letterOf(y.slot.code)+' '+y.slot.name,v:y.w,p:prevMap.has(y.slot.code)?prevMap.get(y.slot.code).w:null,sub:`매출 ${fmt.pct(y.sShare)} · 클릭 ${fmt.pct(y.cShare)}`,act:'k:'+y.slot.code,
    html:()=>`<b>${esc(y.slot.name)}</b><br>가중치 = 매출 비중 ${fmt.pct(y.sShare)} × 50% + 클릭 비중 ${fmt.pct(y.cShare)} × 50% = <b>${fmt.pct(y.w)}</b>`})),q=>fmt.pct(q),['편성 구좌','','가중치','비중 구성']);
  const months=monthlyTraffic(6);
  document.getElementById('pvTable').innerHTML=`<thead><tr><th>월</th>${PV_TABS.map(t=>`<th class="num">${t}</th>`).join('')}</tr></thead><tbody>${months.map(mo=>`<tr>${td(mo.ym)}${mo.rows.map(y=>td(fmt.cnt(y.avg),1)).join('')}</tr>`).join('')}<tr class="total">${td(esc(periodWord()))}${aggTraffic(r).map(y=>td(fmt.cnt(y.avg),1)).join('')}</tr></tbody>`;
};
