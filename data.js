/* 모바일 편성 허브 — 가상 데이터 (시드 고정)
   기준선 v1.0: 시드 20261024, 2025-11-01 ~ 2026-10-23. 시드·호출 순서를 바꾸면 모든 수치가 달라진다.
   의도한 변경 외에는 이 파일의 생성부를 수정하지 말 것. 구좌명·팀명·브랜드명·코드는 실제 명칭, 수치는 전부 가상. */
'use strict';
const APP={name:'모바일 편성 허브',tag:'편성 자원·실적·트래픽 일 단위 조회',version:'v3.4',build:'2026-10-30'};
const META={baseDate:'2026-10-23',dataMin:'2025-11-01',dataMax:'2026-10-23',seed:20261024,dataKind:'가상 데이터',
  pipeline:'파이프라인 F44',redefine:'구좌명 재정의 260730',report:'25.09 리포트(8월 마감) 1~4번 시트 구성'};

function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const R=rng(META.seed);
const between=(a,b)=>a+R()*(b-a);
const pick=a=>a[Math.floor(R()*a.length)];

/* 모바일전략 편성 구좌 17개 (리포트 1번 시트 '편성 구좌별 효율' 행 구성, 명칭은 구좌명 재정의_260730 기준)
   sales 일 구좌 발생 매출(원), clk 일 클릭수, bn 일 운영 배너수, rb 재구매율, tot 전체 실적 배수, dur 배너 노출일수 범위 */
const SLOTS=[
 {code:'I_tab',name:'별도탭',tab:'별도탭',seq:'-',sales:22e6,clk:15000,bn:2.5,rb:.31,tot:9,dur:[1,2]},
 {code:'home_mditem_not_auto',name:'믿고 보는 혜택 상품',tab:'홈',seq:9,sales:6.5e6,clk:10500,bn:11,rb:.20,tot:3.2,dur:[2,5]},
 {code:'home_banner',name:'탑배너',tab:'홈',seq:2,sales:4.8e6,clk:9800,bn:18,rb:.40,tot:8.5,dur:[2,4]},
 {code:'ad_mbl_main_pop',name:'팝업',tab:'팝업',seq:46,sales:26e4,clk:11200,bn:3,rb:.21,tot:35,dur:[1,1]},
 {code:'30_현대아울렛',name:'아울렛탭',tab:'아울렛탭',seq:'-',sales:62e4,clk:4200,bn:1,rb:.30,tot:2.4,dur:[3,7]},
 {code:'today_benefit',name:'오늘 혜택',tab:'오늘특가',seq:'-',sales:48e4,clk:4300,bn:1,rb:.38,tot:5,dur:[1,1]},
 {code:'home_eventicon_2',name:'이벤트아이콘 (2번줄)',tab:'홈',seq:6,sales:1.4e6,clk:2100,bn:5,rb:.28,tot:120,dur:[3,7]},
 {code:'home_eventicon',name:'이벤트아이콘 (1번줄)',tab:'홈',seq:5,sales:1.1e6,clk:2100,bn:5,rb:.19,tot:38,dur:[3,7]},
 {code:'home_banner_2',name:'띠배너',tab:'홈',seq:1,sales:5e5,clk:2700,bn:1,rb:.24,tot:36,dur:[1,3]},
 {code:'home_shorts',name:'30초 쇼핑, 숏폼',tab:'홈',seq:15,sales:42e4,clk:2600,bn:20,rb:.05,tot:7.5,dur:[5,7]},
 {code:'home_themeSpex',name:'단독 브랜드',tab:'홈',seq:21,sales:65e4,clk:1750,bn:10,rb:.19,tot:14,dur:[3,7]},
 {code:'home_spex_2',name:'MD 제안',tab:'홈',seq:22,sales:7e5,clk:1400,bn:5.5,rb:.35,tot:1.4,dur:[3,7]},
 {code:'home_spex_3',name:'지금 주목할 기획전',tab:'홈',seq:18,sales:56e4,clk:1200,bn:8,rb:.26,tot:3.2,dur:[2,5]},
 {code:'home_spex',name:'오늘의 메인 행사',tab:'홈',seq:14,sales:49e4,clk:1100,bn:1.1,rb:.24,tot:6.5,dur:[1,3]},
 {code:'home_timespecial_2',name:'타임딜 (상품 1개)',tab:'홈',seq:10,sales:34e4,clk:450,bn:1,rb:.12,tot:1.9,dur:[1,1]},
 {code:'home_ad',name:'오늘의 추천 상품',tab:'홈',seq:20,sales:38e4,clk:480,bn:1,rb:.35,tot:1.5,dur:[2,5]},
 {code:'home_brand',name:'월간 신상',tab:'홈',seq:19,sales:13e4,clk:470,bn:3.2,rb:.41,tot:6,dur:[5,7]}
];
/* 자동노출 영역 6개 (가중치 산정 제외, 참고 표시) */
const AUTO_SLOTS=[
 {code:'home_onair',name:'지금 방송 중',tab:'홈',seq:3,sales:9.5e8,clk:88000,bn:1,rb:.48,tot:1.55},
 {code:'home_tvplus',name:'온에어_TV+',tab:'홈',seq:4,sales:1.7e8,clk:16500,bn:1,rb:.19,tot:1.65},
 {code:'home_mditem_auto',name:'인기 급상승 상품',tab:'홈',seq:23,sales:3.6e6,clk:5400,bn:30,rb:.15,tot:28},
 {code:'home_show',name:'온에어_쇼핑라이브',tab:'홈',seq:7,sales:82e4,clk:6400,bn:1,rb:.15,tot:12},
 {code:'home_cateBest',name:'주문집중 TV상품',tab:'홈',seq:24,sales:1.25e6,clk:4450,bn:150,rb:.09,tot:11},
 {code:'home_pgm_new',name:'대표 프로그램 커뮤니티',tab:'홈',seq:16,sales:1.7e6,clk:2500,bn:7,rb:.08,tot:230}
];

/* 조직 (리포트 2번 시트 구성): u 일 편성 운영 건수, s 매출 배수, m 공헌이익률, cat 상품 대분류, brands 브랜드 풀 */
const ORG=[
 ['식품담당',[['일반식품1팀',2.2,1.3,.19,'가공식품'],['일반식품2팀',1.1,1.5,.09,'축산/수산/양곡'],['건강식품1팀',6,1.2,.06,'건강기능식품'],['건강식품2팀',.15,.1,.22,'건강기능식품']]],
 ['뷰티담당',[['뷰티1팀',1.7,.9,.09,'스킨케어'],['뷰티2팀',6.5,1.4,.06,'메이크업/바디'],['뷰티브랜드팀',.9,.4,.16,'뷰티 브랜드']]],
 ['패션담당',[['패션1Lab',1.3,.8,.35,'패션의류'],['패션2Lab',.05,.15,.33,'패션의류'],['패션3Lab',.4,.2,.3,'패션의류'],['패션4Lab',1.3,.15,.07,'이너웨어'],['패션5Lab',14.5,1.6,.03,'패션의류/잡화']]],
 ['트렌드사업부',[['노블레스팀',.9,.8,.12,'명품'],['패션잡화팀',4.2,3.2,.04,'패션제화/잡화']]],
 ['리빙사업부',[['가전팀',1.5,.25,.07,'생활가전'],['리빙팀',6.3,1.5,.04,'생활용품/침구'],['주방팀',1.5,.7,.15,'주방용품']]],
 ['라이프사업부',[['액티브라이프팀',2.2,.6,.02,'스포츠/레저'],['여행팀',.8,.15,.24,'여행'],['렌탈팀',1.9,.5,.01,'렌탈']]],
 ['기타',[['E.MLab',0,0,0,'-'],['P.DLab',.05,.02,.1,'기획상품'],['O2O팀',1.1,.5,.33,'O2O'],['쇼핑라이브팀',.1,.05,.19,'라이브']]]
];
const BRANDS={
 '식품담당':['풀무원','오뚜기','비비고','하림','우아한소','완도활전복','산과들에','던킨','동원','농심','정관장','종근당건강','뉴트리원','에버콜라겐','고려은단'],
 '뷰티담당':['설화수','라네즈','헤라','AHC','메디힐','닥터지','바닐라코','에스티로더','랑콤','키엘'],
 '패션담당':['TOMMY JEANS','폴로 랄프로렌','라코스테','지오다노','뱅뱅','올리비아로렌','닥스','헤지스','빈폴','캘빈클라인'],
 '트렌드사업부':['마이클코어스','코치','구찌','프라다','버버리','페라가모','롱샴','투미','쌤소나이트'],
 '리빙사업부':['홈앤시스','이브맘하우스','쿠쿠','테팔','휘슬러','락앤락','삼성전자','LG전자','다이슨','필립스','생활공작소'],
 '라이프사업부':['나이키','아디다스','뉴발란스','노스페이스','K2','블랙야크','하나투어','모두투어','코웨이','SK매직','청호나이스'],
 '기타':['현대백화점','현대아울렛','쇼핑라이브','H몰 기획']
};
const TITLE_TPL=['{b} 가을 신상 특가','{b} 베스트 모음전','[단독] {b} 시즌오프','{b} 1+1 기획','{b} 주말 특가','{b} 신상품 런칭','{b} 브랜드위크','{b} 베스트셀러 초특가','물가안정 99딜','팍팍다드림','더드림 위크','{b} 단 하루 특가'];

/* 팀 목록 평탄화 + MD코드 (4자리 코드만 사용, 이름은 쓰지 않음) */
const TEAMS=[];const MDS=[];
(function(){const used=new Set();ORG.forEach(([bu,list],bi)=>list.forEach(([name,u,s,m,cat],ti)=>{
  const t={id:TEAMS.length,name,bu,u,s,m,cat,mds:[]};TEAMS.push(t);
  const n=u>0?2+Math.floor(R()*4):1;
  for(let k=0;k<n;k++){let c;do{c=String(7000+Math.floor(R()*2000));}while(used.has(c));used.add(c);const md={code:c,team:name,bu,cat};MDS.push(md);t.mds.push(md);}
}));})();

/* 날짜 유틸 */
const DAY=86400000;
const toISO=d=>d.toISOString().slice(0,10);
const fromISO=s=>new Date(s+'T00:00:00Z');
const NDAYS=Math.round((fromISO(META.dataMax)-fromISO(META.dataMin))/DAY)+1;
const DATES=Array.from({length:NDAYS},(_,i)=>toISO(new Date(fromISO(META.dataMin).getTime()+i*DAY)));
const dayIdx=iso=>Math.round((fromISO(iso)-fromISO(META.dataMin))/DAY);
const LAST=NDAYS-1;

/* 팀×구좌 친화도 (어떤 팀이 어떤 구좌를 자주 쓰는지) */
const AFF=TEAMS.map(()=>SLOTS.map(()=>Math.pow(R(),2)+0.02));

/* 일별 데이터 생성: 구좌별(매출·클릭·배너수·전체실적), 팀별(편성 건수·매출), 주요탭 PV */
const DOW=[0.95,0.92,1.04,1.06,1.03,1.0,0.98]; /* 일,월,화,수,목,금,토 */
const PV_TABS=['DAU','편성표','모바일라이브','현대홈쇼핑','별도탭','현대백화점','현대아울렛','VIP','지금특가','혜택'];
const PV_BASE=[640000,41000,33500,585000,17800,5100,5200,4100,7400,34800];
const DAILY=[];
(function(){
  const phase=SLOTS.map(()=>R()*6.28),aphase=AUTO_SLOTS.map(()=>R()*6.28);
  for(let d=0;d<NDAYS;d++){
    const dt=fromISO(DATES[d]);const dow=DOW[dt.getUTCDay()];
    const row={date:DATES[d],slots:[],auto:[],team:TEAMS.map(()=>({cnt:SLOTS.map(()=>0),sales:0}))};
    SLOTS.forEach((s,i)=>{
      const tr=1+0.12*Math.sin(6.283*d/365+phase[i])+0.0003*d;
      const noise=()=>1+(R()-0.5)*0.5;
      let sales=s.sales*dow*tr*noise(),clk=s.clk*dow*tr*noise();
      let bn=Math.max(1,Math.round(s.bn*(0.8+0.4*R())));
      const tot=sales*s.tot*(0.9+0.2*R());
      /* 데일리 리포트 시연용 이상치 (기준일): MD 제안 매출 급감, 월간 신상 클릭 결측 */
      if(d===LAST&&s.code==='home_spex_2')sales*=0.45;
      if(d===LAST&&s.code==='home_brand')clk=null;
      row.slots.push({sales,clk,bn,tot});
      /* 배너를 팀에 배분 (팀 활동량 × 친화도) */
      const w=TEAMS.map((t,ti)=>t.u*AFF[ti][i]);const W=w.reduce((a,b)=>a+b,0);
      for(let k=0;k<bn;k++){let r=R()*W,ti=0;while(ti<w.length-1&&(r-=w[ti])>0)ti++;row.team[ti].cnt[i]++;}
      const sh=TEAMS.map((t,ti)=>row.team[ti].cnt[i]*t.s+0.001*w[ti]);const SH=sh.reduce((a,b)=>a+b,0);
      TEAMS.forEach((t,ti)=>{row.team[ti].sales+=sales*sh[ti]/SH;});
    });
    AUTO_SLOTS.forEach((s,i)=>{const tr=1+0.08*Math.sin(6.283*d/365+aphase[i]);const n=()=>1+(R()-0.5)*0.3;
      const sales=s.sales*dow*tr*n();row.auto.push({sales,clk:s.clk*dow*tr*n(),bn:s.bn,tot:sales*s.tot*(0.95+0.1*R())});});
    row.pv=PV_BASE.map((b,i)=>b*(i===0||i===3?dow:1)*(1+0.06*Math.sin(6.283*d/365+i))*(1+(R()-0.5)*0.12));
    DAILY.push(row);
  }
})();

/* 전시 행사(배너) 목록: 구좌·팀·MD코드·전시명·기간·구좌 유입 실적·전체 실적 */
const BANNERS=[];
(function(){
  let id=1;
  SLOTS.forEach((s,i)=>{
    const avgDur=(s.dur[0]+s.dur[1])/2;const n=Math.min(170,Math.round(s.bn*NDAYS/avgDur));
    const w=TEAMS.map((t,ti)=>t.u*AFF[ti][i]+0.001);const W=w.reduce((a,b)=>a+b,0);
    for(let k=0;k<n;k++){
      const dur=s.dur[0]+Math.floor(R()*(s.dur[1]-s.dur[0]+1));const st=Math.floor(R()*(NDAYS-dur+1));
      let r=R()*W,ti=0;while(ti<w.length-1&&(r-=w[ti])>0)ti++;const t=TEAMS[ti];const md=pick(t.mds);
      const b=pick(BRANDS[t.bu]);const title=pick(TITLE_TPL).replace('{b}',b);
      let sum=0;for(let d=st;d<st+dur;d++)sum+=DAILY[d].slots[i].sales/Math.max(1,DAILY[d].slots[i].bn);
      const sales=Math.round(sum*between(0.55,1.6));const tot=Math.round(sales*s.tot*between(0.7,1.3));
      BANNERS.push({id:id++,slot:s,team:t.name,bu:t.bu,md:md.code,brand:b,title,start:st,end:st+dur-1,sales,tot});
    }
  });
  /* 데일리 리포트 시연용: 기준일에 취소 소급으로 전체 실적이 음수가 된 배너 1건 */
  const x=BANNERS.filter(b=>b.end===LAST&&b.slot.code==='home_banner')[0]||BANNERS.filter(b=>b.end===LAST)[0];
  if(x){x.tot=-Math.round(Math.abs(x.tot)*0.12);x.note='취소 소급(접수일자 기준) 반영';}
  BANNERS.sort((a,b)=>b.start-a.start||b.sales-a.sales);
})();

/* 기준일 검증 플래그 (v3.1 §11 규칙 후보 중 5종) + 원인 분류 샘플 */
const NEW_CODE={code:'home_newzone_x',name:'(raw 전시영역명) 홈_신규영역_테스트',rows:184,first:META.baseDate};

/* ---------- 구좌 지도 메타 (v2) ----------
   scr: 화면(home 홈 / tab 별도탭 / outlet 아울렛탭 / today 오늘혜택 / popup 팝업), h: 화면 안 세로 비중, img: img/ 폴더의 구좌 캡처(리포트 1번 시트 셀 메모 이미지, 2026-10-26 Master 재업로드 고화질 PNG).
   box: 캡처 안 구좌 영역 [왼쪽, 위, 너비, 높이] (%). 캡처에 그려진 빨간 점선을 픽셀 분석으로 측정한 값. desc: 구좌 설명. 순서는 SLOTS/AUTO_SLOTS의 seq(전시 순번)를 따른다. */
const SCREENS=[['home','홈'],['tab','별도탭'],['outlet','아울렛탭'],['today','오늘혜택'],['popup','팝업']];
const LAYOUT={
 home_banner_2:{scr:'home',h:1.3,img:'home_banner_2.png',box:[1.6,8.9,96.7,11.8],desc:'홈 최상단, 메뉴 바로 아래 가로 띠 형태. 하루 1~3개 배너가 교대로 노출'},
 home_banner:{scr:'home',h:4,img:'home_banner.png',box:[1.7,15.2,96.6,49.4],desc:'홈 상단 대형 롤링 배너. 편성 구좌 중 노출량이 가장 크고 배너 수가 많음'},
 home_onair:{scr:'home',h:2.4,desc:'현재 방송 중인 TV 상품. 시스템 자동 노출'},
 home_tvplus:{scr:'home',h:1.4,desc:'TV+ 방송 상품. 시스템 자동 노출'},
 home_eventicon:{scr:'home',h:1.5,img:'home_eventicon.png',box:[1.6,26.0,96.7,15.0],desc:'원형 아이콘 메뉴 1번째 줄. 기획전·이벤트 진입 아이콘'},
 home_eventicon_2:{scr:'home',h:1.5,img:'home_eventicon.png',box:[1.6,41.0,96.7,15.0],desc:'원형 아이콘 메뉴 2번째 줄'},
 home_show:{scr:'home',h:2,desc:'쇼핑라이브 방송 상품. 시스템 자동 노출'},
 home_mditem_not_auto:{scr:'home',h:2.6,img:'home_mditem_not_auto.png',box:[1.8,14.9,96.5,73.2],desc:'MD가 직접 고른 혜택 상품 묶음. 상품 단위 편성'},
 home_timespecial_2:{scr:'home',h:1.8,img:'home_timespecial_2.png',box:[1.8,21.5,96.5,45.9],desc:'하루 1개 상품 타임딜'},
 home_spex:{scr:'home',h:2,img:'home_spex.png',box:[1.7,10.1,96.5,55.1],desc:'오늘의 대표 기획전 1건'},
 home_shorts:{scr:'home',h:2.4,img:'home_shorts.png',box:[1.6,11.5,96.7,78.6],desc:'30초 숏폼 영상 묶음. 영상 단위 편성'},
 home_pgm_new:{scr:'home',h:1.6,desc:'대표 프로그램 커뮤니티. 시스템 자동 노출'},
 home_spex_3:{scr:'home',h:2,img:'home_spex_3.png',box:[1.8,18.5,96.5,77.8],desc:'주목 기획전 묶음(가로 스크롤)'},
 home_brand:{scr:'home',h:2,img:'home_brand.png',box:[1.7,10.1,96.6,44.5],desc:'월간 신상품 브랜드 묶음'},
 home_ad:{scr:'home',h:2,img:'home_ad.png',box:[1.8,57.8,96.5,34.5],desc:'추천 상품 1건'},
 home_themeSpex:{scr:'home',h:2,img:'home_themeSpex.png',box:[1.6,11.4,96.7,51.3],desc:'단독 브랜드 기획전 묶음'},
 home_spex_2:{scr:'home',h:2,img:'home_spex_2.png',box:[1.7,14.9,96.6,71.4],desc:'MD 제안 기획전 묶음'},
 home_mditem_auto:{scr:'home',h:2.4,desc:'인기 급상승 상품. 시스템 자동 노출'},
 home_cateBest:{scr:'home',h:2.4,desc:'주문 집중 TV 상품. 시스템 자동 노출'},
 ad_mbl_main_pop:{scr:'popup',h:6,img:'ad_mbl_main_pop.png',box:[17.2,48.3,66.7,44.9],desc:'앱 진입 시 홈 위에 뜨는 팝업. 하루 1~3건'},
 I_tab:{scr:'tab',h:9,img:'I_tab.png',box:[26.1,9.8,18.8,8.2],desc:'홈 상단 메뉴에 붙는 브랜드 단독 탭. 탭 전체가 한 브랜드 행사'},
 '30_현대아울렛':{scr:'outlet',h:9,img:'outlet_tab.png',box:[37.1,11.4,27.8,6.4],desc:'현대아울렛 탭. 탭 전체가 아울렛 행사'},
 today_benefit:{scr:'today',h:9,img:'today_benefit.png',box:[36.6,84.6,26.4,9.0],desc:'하단 메뉴 오늘혜택. 하루 1건 혜택 행사'}
};
const BRAND_LIST=[...new Set(BANNERS.map(b=>b.brand))].sort((a,b)=>a.localeCompare(b,'ko'));
