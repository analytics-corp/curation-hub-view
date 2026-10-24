/* 모바일 편성 허브 — SVG 차트 (외부 라이브러리 없음) */
'use strict';
const SVGNS='http://www.w3.org/2000/svg';
function svg(tag,attrs,text){const e=document.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(text!=null)e.textContent=text;return e;}
function niceMax(v){if(!(v>0))return 1;const p=Math.pow(10,Math.floor(Math.log10(v)));const m=v/p;const n=m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10;return n*p;}

/* 가로 막대: rows=[{name,v,p,sub,html}] */
function hbars(box,rows,fmtV,head){
  box.innerHTML='';const max=Math.max(1,...rows.map(r=>Math.max(r.v||0,r.p||0)));
  if(head){const h=document.createElement('div');h.className='hrow hhead';h.innerHTML=head.map((t,i)=>`<span${i>1?' style="text-align:right"':''}>${t}</span>`).join('');box.appendChild(h);}
  rows.forEach(r=>{const d=document.createElement('div');d.className='hrow';d.tabIndex=0;
    d.innerHTML=`<span class="nm" title="${esc(r.name)}">${esc(r.name)}</span><span class="track"><span class="bar" style="width:${((r.v||0)/max*100).toFixed(1)}%"></span>${r.p!=null?`<span class="bar prev" style="width:${((r.p||0)/max*100).toFixed(1)}%"></span>`:''}</span><span class="val">${fmtV(r.v)}</span><span class="sub">${r.sub||''}</span>`;
    if(r.html)bindTip(d,r.html);box.appendChild(d);});
}

/* 세로 막대 + 비교 선 */
function columnChart(box,title,unit,labels,cur,prev,fmtV){
  const card=document.createElement('div');card.className='card chart';
  card.innerHTML=`<div class="ttl"><b>${esc(title)}</b><span>${esc(unit)}</span></div>`;
  const W=640,H=220,L=56,Rr=12,T=14,B=34;const n=Math.max(1,labels.length);
  const vals=cur.map(v=>v==null?0:v),pv=(prev||[]).map(v=>v==null?0:v);
  const max=niceMax(Math.max(...vals,...pv,1)*1.05);const y=v=>T+(H-T-B)*(1-v/max);
  const s=svg('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':title});
  for(let i=0;i<=4;i++){const v=max*i/4;s.appendChild(svg('line',{x1:L,x2:W-Rr,y1:y(v),y2:y(v),class:'grid'}));s.appendChild(svg('text',{x:L-6,y:y(v)+4,class:'ax','text-anchor':'end'},fmtV(v)));}
  const bw=(W-L-Rr)/n,gap=Math.min(6,bw*0.25);
  vals.forEach((v,i)=>{const x=L+i*bw+gap/2;const r=svg('rect',{x,y:y(v),width:Math.max(1,bw-gap),height:Math.max(0,y(0)-y(v)),class:'bar'+(cur[i]==null?' miss':'')});
    r.appendChild(svg('title',{},`${labels[i]} · ${cur[i]==null?'값 없음':fmtV(v)}${prev&&prev[i]!=null?' · 비교 '+fmtV(prev[i]):''}`));s.appendChild(r);});
  if(prev&&prev.length){const pts=pv.map((v,i)=>`${L+i*bw+bw/2},${y(v)}`).join(' ');s.appendChild(svg('polyline',{points:pts,class:'prevline'}));}
  const step=Math.ceil(n/8);labels.forEach((l,i)=>{if(i%step===0||i===n-1)s.appendChild(svg('text',{x:L+i*bw+bw/2,y:H-10,class:'ax','text-anchor':'middle'},l));});
  card.appendChild(s);box.appendChild(card);return card;
}

/* 편성 사용량 대비 매출 산점도 (Ver.12 차트 구성): x 매출, y 가중치 사용량, 평균선으로 4분면 */
function scatter(box,pts,avgX,avgY,fmtX){
  box.innerHTML='';const W=720,H=440,L=70,Rr=24,T=24,B=50;
  const mx=niceMax(Math.max(avgX*1.6,...pts.map(p=>p.x))*1.08),my=niceMax(Math.max(avgY*1.6,...pts.map(p=>p.y))*1.1);
  const X=v=>L+(W-L-Rr)*v/mx,Y=v=>T+(H-T-B)*(1-v/my);
  const s=svg('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'편성 사용량 대비 매출 산점도'});
  const q=(x1,x2,y1,y2,g)=>s.appendChild(svg('rect',{x:X(x1),y:Y(y2),width:X(x2)-X(x1),height:Y(y1)-Y(y2),class:'quad q'+g}));
  q(avgX,mx,0,avgY,1);q(avgX,mx,avgY,my,2);q(0,avgX,0,avgY,3);q(0,avgX,avgY,my,4);
  [[1,'1',X(avgX+(mx-avgX)/2),Y(avgY/2)],[2,'2',X(avgX+(mx-avgX)/2),Y(avgY+(my-avgY)/2)],[3,'3',X(avgX/2),Y(avgY/2)],[4,'4',X(avgX/2),Y(avgY+(my-avgY)/2)]].forEach(([g,t,x,y])=>s.appendChild(svg('text',{x,y:y+18,class:'qnum q'+g,'text-anchor':'middle'},t)));
  for(let i=0;i<=5;i++){const v=mx*i/5;s.appendChild(svg('text',{x:X(v),y:H-28,class:'ax','text-anchor':'middle'},fmtX(v)));}
  for(let i=0;i<=5;i++){const v=my*i/5;s.appendChild(svg('text',{x:L-8,y:Y(v)+4,class:'ax','text-anchor':'end'},Math.round(v).toLocaleString('ko-KR')));}
  s.appendChild(svg('line',{x1:X(avgX),x2:X(avgX),y1:T,y2:H-B,class:'avg avgx'}));s.appendChild(svg('line',{x1:L,x2:W-Rr,y1:Y(avgY),y2:Y(avgY),class:'avg avgy'}));
  s.appendChild(svg('text',{x:W/2,y:H-6,class:'axl','text-anchor':'middle'},'편성 구좌 발생 매출 (기간 합계)'));
  s.appendChild(svg('text',{x:14,y:H/2,class:'axl','text-anchor':'middle',transform:`rotate(-90 14 ${H/2})`},'편성 사용량 (가중치 반영 건수)'));
  pts.forEach(p=>{const g=svg('g',{class:'pt g'+p.g});const c=svg('circle',{cx:X(p.x),cy:Y(p.y),r:6});c.appendChild(svg('title',{},`${p.name} · ${GROUPS[p.g][0]} ${GROUPS[p.g][1]}\n매출 ${fmtX(p.x)} · 사용량 ${p.y.toFixed(1)}`));
    g.appendChild(c);g.appendChild(svg('text',{x:X(p.x)+8,y:Y(p.y)-7,class:'lbl'},p.name.replace(/(팀|Lab)$/,'')));s.appendChild(g);});
  box.appendChild(s);
}

/* 요약 타일용 스파크라인 */
function sparkline(cur,prev){
  const W=160,H=46,n=Math.max(cur.length,(prev||[]).length,2);const vals=cur.map(v=>v==null?0:v),pv=(prev||[]).map(v=>v==null?0:v);
  const max=Math.max(...vals,...pv,1);const x=i=>i*(W-2)/(n-1)+1,y=v=>H-2-(H-6)*v/max;
  const s=svg('svg',{viewBox:`0 0 ${W} ${H}`,'aria-hidden':'true'});
  if(pv.length>1)s.appendChild(svg('polyline',{points:pv.map((v,i)=>`${x(i)},${y(v)}`).join(' '),class:'sp prev'}));
  if(vals.length>1)s.appendChild(svg('polyline',{points:vals.map((v,i)=>`${x(i)},${y(v)}`).join(' '),class:'sp cur'}));
  else if(vals.length===1)s.appendChild(svg('circle',{cx:W/2,cy:y(vals[0]),r:3,class:'sp cur'}));
  return s;
}
