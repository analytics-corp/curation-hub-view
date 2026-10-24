# curation-hub-view

모바일 편성 허브 컨셉 화면(정적 사이트)의 배포용 저장소입니다. 원본과 설계 문서는 `analytics-corp/curation_hub` 저장소의 `site/` 폴더에 있고, 이 저장소는 GitHub Pages로 공개하기 위한 사본입니다.

- 공개 주소: https://analytics-corp.github.io/curation-hub-view/
- 데이터: 시드 고정 가상 데이터. 구좌명·팀명·브랜드명·코드는 실제 명칭, 실적·트래픽 등 수치는 모두 가상.
- 구성: `index.html` + `styles.css` + `data.js` + `app-core.js` + `app-charts.js` + `app-views.js` + `app-report.js`. 외부 라이브러리·외부 요청 없음.
- 갱신: `curation_hub`의 `site/` 변경이 검토(PR)를 거친 뒤 같은 내용을 이 저장소 `main`에 반영합니다. 각 파일은 20KB 이하로 유지합니다.

## 로컬 확인

```
cd site && node tests/harness.js
```

브라우저에서 `index.html`을 직접 열어도 동작합니다(파일 프로토콜 가능).
