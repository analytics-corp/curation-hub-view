# site — 모바일 편성 허브 컨셉 화면 (v2.0)

정적 파일만으로 동작하는 화면입니다. 외부 라이브러리와 외부 요청이 없고, 브라우저에서 `index.html`을 바로 열어도 동작합니다.

- 공개 주소: https://analytics-corp.github.io/curation-hub-view/ (공개 저장소 `analytics-corp/curation-hub-view`의 `main`에 이 폴더의 내용을 그대로 복사)
- 데이터: 시드 고정 가상 데이터(`data.js`). 구좌명·팀명·브랜드명·코드는 실제 명칭, 실적·트래픽 수치는 모두 가상.
- 화면: 브리핑 / 구좌 지도 / 영업팀 / 전시 행사 / 데일리 리포트 / 기준

## 파일

| 파일 | 역할 |
|---|---|
| `index.html` | 화면 뼈대, 조회 조건, 기준 안내 본문, 변경 이력(하단 주석) |
| `styles.css` | 스타일. 색 토큰은 `:root`에 모음 |
| `data.js` | 가상 데이터 생성 + 구좌 지도 메타(`LAYOUT`, `SCREENS`) |
| `app-core.js` | 상태, 조회 기간, 집계, 검증 플래그, 링크 상태, 조회 조건 UI |
| `app-charts.js` | SVG 차트(막대·스파크라인·덤벨), BEST 목록, 구좌 지도 렌더러 |
| `app-views.js` | 브리핑, 구좌 지도 화면 |
| `app-report.js` | 영업팀, 전시 행사, 데일리 리포트, 기준 화면, 초기화 |
| `img/` | 구좌 캡처 18장(월간 리포트 1번 시트 셀 메모 이미지를 640px 폭 JPEG로 변환) |
| `tests/harness.js` | Node 검사 하네스 |

## 검사

```
cd site && node tests/harness.js
```

집계 불변식, 화면×기간×조건 스모크, 링크 상태 왕복, NaN/undefined 검출, 파일 크기 상한(파일당 20KB), 구좌 지도·TOP 5·더 보기 동작을 검사합니다.

## 갱신 규칙

- 코드 파일은 파일당 20KB 이하를 유지합니다(세션이 API로 직접 올릴 수 있는 크기).
- 이미지 등 바이너리는 git 푸시로만 반영합니다.
- 공개 저장소 반영: 워크플로 `.github/workflows/sync-site.yml`(내용은 PR #4 본문. 세션은 이 경로에 쓸 수 없어 Master가 웹에서 만듭니다)과 저장소 비밀 `VIEW_REPO_TOKEN`이 있으면 `main`의 `site/` 변경이 자동 복사됩니다. 그 전에는 세션이 API로 코드 파일만 올리고, `img/`는 Master가 공개 저장소에 직접 올립니다.
