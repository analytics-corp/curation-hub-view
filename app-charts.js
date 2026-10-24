/* 모바일 편성 허브 v3 — SVG 차트·가로 막대·BEST 목록·덤벨·구좌 위치 (외부 라이브러리 없음) */
'use strict';
const SVGNS='http://www.w3.org/2000/svg';
function svg(tag,attrs,text){const e=document.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(text!=null)e.textContent=text;return e;}
function niceMax(v){if(!(v>0))return 1;const p=Math.pow(10,Math.floor(Math.log10(v)));const m=v/p;const n=m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10;return n*p;}
/* 위만 둥근 막대: 데이터 끝은 4px 라운드, 기준선 쪽은 직각 */
function capPath(x,y,w,h,r){r=Math.min(r,w/2,h);const y0=y+h;return `M${x},${y0}V${y+r}Q${x},${y} ${x+r},${y}H${x+w-r}Q${x+w},${y} ${x+w},${y+r}V${y0}Z`;}
/* 한 색 계열 농도 (크기 표현 전용) */
const HEAT=['#ecE9fb','#ddd8f7','#cbc3f2','#b7acee','#a295e9','#8d7ee3','#785fde','#6350d2','#5041bb','#3f329c'];
function heat(t){t=Math.max(0,Math.min(1,t||0));const i=Math.round(t*(HEAT.length-1));return {bg:HEAT[i],ink:i>=5};}

/* 가로 막대: rows=[{name,v,p,sub,html}] 굵은 막대 = 선택 기간, 가는 막대 = 비교 기간 */
function hbars(box,rows,fmtV,head){
  box.innerHTML='';const max=Math.max(1e-9,...rows.map(r=>Math.max(r.v||0,r.p||0)));
  if(head){const h=document.createElement('div');h.className='hrow hhead';h.innerHTML=head.map((t,i)=>`<span${i>1?' style="text-align:right"':''}>${t}</span>`).join('');box.appendChild(h);}
  rows.forEach(r=>{const d=document.createElement('div');d.className='hrow'+(r.act?' clickable':'');if(r.act)d.setAttribute('data-act',r.act);d.tabIndex=0;
    d.innerHTML=`<span class="nm" title="${esc(r.name)}">${esc(r.name)}</span><span class="track"><span class="bar" style="width:${((r.v||0)/max*100).toFixed(1)}%"></span>${r.p!=null?`<span class="bar prev" style="width:${((r.p||0)/max*100).toFixed(1)}%"></span>`:''}</span><span class="val">${fmtV(r.v)}</span><span class="sub">${r.sub||''}</span>`;
    if(r.html)bindTip(d,r.html);box.appendChild(d);});
}

/* 세로 막대 + 비교 기간 점선 */
function columnChart(box,labels,cur,prev,fmtV,opt){
  opt=opt||{};box.innerHTML='';
  const W=opt.w||640,H=opt.h||220,L=56,R=12,T=18,B=30;const n=Math.max(1,labels.length);
  const v=cur.map(x=>x==null?0:x),pv=(prev||[]).map(x=>x==null?0:x);const max=niceMax(Math.max(...v,...pv,1)*1.05);const y=q=>T+(H-T-B)*(1-q/max);
  const s=svg('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':opt.label||'막대 차트'});
  for(let i=0;i<=4;i++){const q=max*i/4;s.appendChild(svg('line',{x1:L,x2:W-R,y1:y(q),y2:y(q),class:'grid'}));s.appendChild(svg('text',{x:L-6,y:y(q)+4,class:'ax','text-anchor':'end'},fmtV(q)));}
  const slot=(W-L-R)/n,bw=Math.min(24,Math.max(2,slot-4));let maxI=0;v.forEach((q,i)=>{if(q>v[maxI])maxI=i;});
  v.forEach((q,i)=>{const x=L+i*slot+(slot-bw)/2;const h=Math.max(0,y(0)-y(q));const p=svg('path',{d:capPath(x,y(q),bw,h,4),class:'bar'+(cur[i]==null?' miss':'')});
    p.appendChild(svg('title',{},`${labels[i]} · ${cur[i]==null?'값 없음':fmtV(q)}${prev&&prev[i]!=null?' · 비교 '+fmtV(prev[i]):''}`));s.appendChild(p);
    if(i===maxI||i===n-1)s.appendChild(svg('text',{x:x+bw/2,y:y(q)-5,class:'lbl2','text-anchor':'middle'},fmtV(q)));});
  if(prev&&prev.length>1){s.appendChild(svg('polyline',{points:pv.slice(0,n).map((q,i)=>`${L+i*slot+slot/2},${y(q)}`).join(' '),class:'prevline'}));}
  const step=Math.ceil(n/8);labels.forEach((l,i)=>{if(i%step===0||i===n-1)s.appendChild(svg('text',{x:L+i*slot+slot/2,y:H-10,class:'ax','text-anchor':'middle'},l));});
  box.appendChild(s);
}

/* 요약 타일 스파크라인: 실선 = 선택 기간, 점선 = 비교 기간 */
function sparkline(cur,prev){
  const W=160,H=44,n=Math.max(cur.length,(prev||[]).length,2);const v=cur.map(x=>x==null?0:x),pv=(prev||[]).map(x=>x==null?0:x);const max=Math.max(...v,...pv,1);
  const x=i=>i*(W-4)/(n-1)+2,y=q=>H-3-(H-8)*q/max;const s=svg('svg',{viewBox:`0 0 ${W} ${H}`,'aria-hidden':'true'});
  if(pv.length>1)s.appendChild(svg('polyline',{points:pv.map((q,i)=>`${x(i)},${y(q)}`).join(' '),class:'sp prev'}));
  if(v.length>1){const pts=v.map((q,i)=>`${x(i)},${y(q)}`).join(' ');s.appendChild(svg('polygon',{points:`${x(0)},${H-3} ${pts} ${x(v.length-1)},${H-3}`,class:'sp area'}));s.appendChild(svg('polyline',{points:pts,class:'sp cur'}));
    s.appendChild(svg('circle',{cx:x(v.length-1),cy:y(v[v.length-1]),r:3.5,class:'dot-b'}));}
  return s;
}

/* BEST 목록: rows=[{name,sub,v,sub2,act}] */
function bestList(box,rows,fmtV){
  const max=Math.max(1e-9,...rows.map(r=>r.v||0));
  box.innerHTML=rows.length?rows.map((r,i)=>`<div class="row${r.act?' clickable':''}"${r.act?` data-act="${esc(r.act)}"`:''}><span class="rk">${i+1}</span><span class="nm" title="${esc(r.name)}">${esc(r.name)}${r.sub?`<small>${esc(r.sub)}</small>`:''}</span><span class="vl">${fmtV(r.v)}${r.sub2?`<small>${esc(r.sub2)}</small>`:''}</span><span class="bar"><i style="width:${((r.v||0)/max*100).toFixed(1)}%"></i></span></div>`).join(''):'<div class="muted" style="padding:8px 0">해당 없음</div>';
}

/* 덤벨: rows=[{name,a,b,g}] a=편성 사용량 비중, b=매출 비중 */
function dumbbell(box,rows,fmtV){
  box.innerHTML='';const W=640,RH=24,L=118,R=86,T=22;const H=T+rows.length*RH+8;
  const max=Math.max(0.01,...rows.map(r=>Math.max(r.a,r.b)))*1.08;const X=v=>L+(W-L-R)*v/max;
  const s=svg('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'팀별 편성 사용량 비중과 매출 비중'});
  for(let i=0;i<=4;i++){const q=max*i/4;s.appendChild(svg('line',{x1:X(q),x2:X(q),y1:T-6,y2:H-6,class:'grid'}));s.appendChild(svg('text',{x:X(q),y:T-10,class:'ax','text-anchor':'middle'},fmtV(q)));}
  rows.forEach((r,i)=>{const y=T+i*RH+RH/2;const g=svg('g',{class:'drow'});
    g.appendChild(svg('text',{x:L-8,y:y+4,class:'lbl','text-anchor':'end'},r.name));
    g.appendChild(svg('line',{x1:X(Math.min(r.a,r.b)),x2:X(Math.max(r.a,r.b)),y1:y,y2:y,class:'link'}));
    g.appendChild(svg('circle',{cx:X(r.a),cy:y,r:5,class:'dot-a'}));g.appendChild(svg('circle',{cx:X(r.b),cy:y,r:5,class:'dot-b'}));
    const d=r.b-r.a;const t=svg('text',{x:W-R+10,y:y+4,class:'lbl2 '+(d>=0?'up':'down')},(d>=0?'▲ ':'▼ ')+(Math.abs(d)*100).toFixed(1)+'%p');g.appendChild(t);
    g.appendChild(svg('title',{},`${r.name} · 편성 사용량 비중 ${fmtV(r.a)} · 매출 비중 ${fmtV(r.b)} · ${GROUPS[r.g]?GROUPS[r.g].join(' '):''}`));s.appendChild(g);});
  box.appendChild(s);
}

/* 화면(scr)에 속한 구좌를 전시 순번대로 나열한다 (구좌 글자표·화면별 구좌 수에 사용) */
function slotsOf(scr){const all=SLOTS.map(s=>({s,auto:false})).concat(AUTO_SLOTS.map(s=>({s,auto:true})));
  return all.filter(x=>(LAYOUT[x.s.code]||{}).scr===scr).sort((a,b)=>(+a.s.seq||0)-(+b.s.seq||0));}
