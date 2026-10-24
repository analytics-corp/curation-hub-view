/* 모바일 편성 허브 v2 — SVG 차트·구좌 지도 렌더러 (외부 라이브러리 없음) */
'use strict';
const SVGNS='http://www.w3.org/2000/svg';
function svg(tag,attrs,text){const e=document.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(text!=null)e.textContent=text;return e;}
function niceMax(v){if(!(v>0))return 1;const p=Math.pow(10,Math.floor(Math.log10(v)));const m=v/p;const n=m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10;return n*p;}
/* 위만 둥근 막대: 데이터 끝은 4px 라운드, 기준선 쪽은 직각 */
function capPath(x,y,w,h,r){r=Math.min(r,w/2,h);const y0=y+h;return `M${x},${y0}V${y+r}Q${x},${y} ${x+r},${y}H${x+w-r}Q${x+w},${y} ${x+w},${y+r}V${y0}Z`;}
const HEAT=['#cde2fb','#b7d3f6','#9ec5f4','#86b6ef','#6da7ec','#5598e7','#3987e5','#2a78d6','#256abf','#1c5cab'];
function heat(t){t=Math.max(0,Math.min(1,t||0));const i=Math.round(t*(HEAT.length-1));return {bg:HEAT[i],ink:i>=5};}

/* 세로 막대 (단일 계열) */
function columnChart(box,labels,vals,fmtV,opt){
  opt=opt||{};box.innerHTML='';
  const W=opt.w||640,H=opt.h||220,L=54,R=12,T=16,B=30;const n=Math.max(1,labels.length);
  const v=vals.map(x=>x==null?0:x);const max=niceMax(Math.max(...v,1)*1.05);const y=q=>T+(H-T-B)*(1-q/max);
  const s=svg('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':opt.label||'막대 차트'});
  for(let i=0;i<=4;i++){const q=max*i/4;s.appendChild(svg('line',{x1:L,x2:W-R,y1:y(q),y2:y(q),class:'grid'}));s.appendChild(svg('text',{x:L-6,y:y(q)+4,class:'ax','text-anchor':'end'},fmtV(q)));}
  const slot=(W-L-R)/n,bw=Math.min(24,Math.max(2,slot-4));
  let maxI=0;v.forEach((q,i)=>{if(q>v[maxI])maxI=i;});
  v.forEach((q,i)=>{const x=L+i*slot+(slot-bw)/2;const h=Math.max(0,y(0)-y(q));const p=svg('path',{d:capPath(x,y(q),bw,h,4),class:'bar'+(vals[i]==null?' miss':'')});
    p.appendChild(svg('title',{},`${labels[i]} · ${vals[i]==null?'값 없음':fmtV(q)}`));s.appendChild(p);
    if(i===maxI||i===n-1)s.appendChild(svg('text',{x:x+bw/2,y:y(q)-5,class:'lbl2','text-anchor':'middle'},fmtV(q)));});
  const step=Math.ceil(n/8);labels.forEach((l,i)=>{if(i%step===0||i===n-1)s.appendChild(svg('text',{x:L+i*slot+slot/2,y:H-10,class:'ax','text-anchor':'middle'},l));});
  box.appendChild(s);
}

/* 요약 타일 스파크라인 */
function sparkline(vals){
  const W=160,H=40,n=Math.max(vals.length,2);const v=vals.map(x=>x==null?0:x);const max=Math.max(...v,1);
  const x=i=>i*(W-4)/(n-1)+2,y=q=>H-3-(H-8)*q/max;const s=svg('svg',{viewBox:`0 0 ${W} ${H}`,'aria-hidden':'true'});
  if(v.length>1){const pts=v.map((q,i)=>`${x(i)},${y(q)}`).join(' ');s.appendChild(svg('polygon',{points:`${x(0)},${H-3} ${pts} ${x(v.length-1)},${H-3}`,class:'sp area'}));s.appendChild(svg('polyline',{points:pts,class:'sp cur'}));
    s.appendChild(svg('circle',{cx:x(v.length-1),cy:y(v[v.length-1]),r:3.5,class:'dot-b'}));}
  return s;
}

/* BEST 목록: rows=[{name,sub,v,sub2,act}] */
function bestList(box,rows,fmtV,opt){
  opt=opt||{};const max=Math.max(1,...rows.map(r=>r.v||0));
  box.innerHTML=rows.length?rows.map((r,i)=>`<div class="row${r.act?' clickable':''}"${r.act?` data-act="${esc(r.act)}"`:''}><span class="rk">${i+1}</span><span class="nm" title="${esc(r.name)}">${esc(r.name)}${r.sub?`<small>${esc(r.sub)}</small>`:''}</span><span class="vl">${fmtV(r.v)}${r.sub2?`<small>${esc(r.sub2)}</small>`:''}</span><span class="bar"><i style="width:${(r.v/max*100).toFixed(1)}%"></i></span></div>`).join(''):'<div class="muted" style="padding:8px 0">해당 없음</div>';
}

/* 덤벨: rows=[{name,a,b,g}] a=사용량 비중, b=매출 비중 */
function dumbbell(box,rows,fmtV){
  box.innerHTML='';const W=640,RH=24,L=118,R=86,T=22;const H=T+rows.length*RH+8;
  const max=Math.max(0.01,...rows.map(r=>Math.max(r.a,r.b)))*1.08;const X=v=>L+(W-L-R)*v/max;
  const s=svg('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'팀별 편성 사용량 비중과 매출 비중'});
  for(let i=0;i<=4;i++){const q=max*i/4;s.appendChild(svg('line',{x1:X(q),x2:X(q),y1:T-6,y2:H-6,class:'grid'}));s.appendChild(svg('text',{x:X(q),y:T-10,class:'ax','text-anchor':'middle'},fmtV(q)));}
  rows.forEach((r,i)=>{const y=T+i*RH+RH/2;const g=svg('g',{class:'drow'});
    g.appendChild(svg('text',{x:L-8,y:y+4,class:'lbl','text-anchor':'end'},r.name));
    g.appendChild(svg('line',{x1:X(Math.min(r.a,r.b)),x2:X(Math.max(r.a,r.b)),y1:y,y2:y,class:'link'}));
    g.appendChild(svg('circle',{cx:X(r.a),cy:y,r:5,class:'dot-a'}));g.appendChild(svg('circle',{cx:X(r.b),cy:y,r:5,class:'dot-b'}));
    const d=r.b-r.a;const t=svg('text',{x:W-R+10,y:y+4,class:'lbl2'},(d>=0?'▲ ':'▼ ')+(Math.abs(d)*100).toFixed(1)+'%p');t.setAttribute('fill',d>=0?'#006300':'#d03b3b');g.appendChild(t);
    g.appendChild(svg('title',{},`${r.name} · 편성 사용량 비중 ${fmtV(r.a)} · 매출 비중 ${fmtV(r.b)} · ${GROUPS[r.g]?GROUPS[r.g].join(' '):''}`));s.appendChild(g);});
  box.appendChild(s);
}

/* 구좌 지도: 화면(scr)에 속한 구좌를 전시 순번대로 블록으로 그린다. values: Map(code -> {v,text,rank}) */
function slotsOf(scr){const all=SLOTS.map(s=>({s,auto:false})).concat(AUTO_SLOTS.map(s=>({s,auto:true})));
  return all.filter(x=>(LAYOUT[x.s.code]||{}).scr===scr).sort((a,b)=>(+a.s.seq||0)-(+b.s.seq||0));}
function renderPhone(box,scr,values,pick,mini){
  const nav=SCREENS.map(([k,n])=>`<span class="${k===scr?'on':''}">${n}</span>`).join('');
  const ranked=[...values.values()].filter(x=>x.rank!=null);const n=ranked.length||1;
  const blocks=slotsOf(scr).map(({s,auto})=>{const m=LAYOUT[s.code]||{h:2};const val=values.get(s.code);
    if(auto)return `<div class="blk auto" style="--h:${m.h}" title="${esc(s.name)} · 자동노출"><span class="n">${esc(s.name)}</span><span class="v">자동노출</span></div>`;
    const t=val&&val.rank!=null?1-val.rank/Math.max(1,n-1):0;const c=heat(t);
    return `<div class="blk${c.ink?' ink':''}${s.code===pick?' sel':''}${scr==='popup'?' pop':''}" style="--h:${m.h};background:${c.bg}" data-pick="${esc(s.code)}" tabindex="0" role="button" title="${esc(s.name)}"><span class="q">${val&&val.rank!=null?val.rank+1+'위':''}</span><span class="n">${esc(s.name)}</span><span class="v">${val?esc(val.text):''}</span></div>`;}).join('');
  box.innerHTML=(mini?'':`<div class="pbar"><span>9:41</span><span>LTE 100%</span></div>`)+`<div class="pnav">${nav}</div><div class="pbody">${blocks||'<div class="muted" style="padding:20px;font-size:12px">이 화면에는 편성 구좌가 없습니다</div>'}</div>`;
}
function heatLegend(box,label){box.innerHTML=`<span>낮음</span><span class="ramp"></span><span>높음</span><span class="muted">· ${esc(label)} 순위 기준 · 빗금은 자동노출 영역</span>`;}
