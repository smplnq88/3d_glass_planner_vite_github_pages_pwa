# 🚀 3D Glassmorphic Planner - Vite PWA (GitHub Pages Ready)

이 패키지는 **Vite + React + TypeScript**로 구성된 3D 글래스모피즘 일정 플래너 웹 애플리케이션의 **GitHub Pages PWA 완제품 배포 패키지**입니다.

GitHub Actions 자동 배포 파이프라인(`.github/workflows/deploy.yml`), PWA 웹앱 매니페스트(`public/manifest.json`), 동적 스코프 서비스 워커(`public/sw.js`), SPA 404 리다이렉트(`public/404.html`), 고화질 3D 글래스 아이콘 등이 모두 사전 구성되어 있어, GitHub 저장소에 그대로 업로드만 하면 즉시 배포됩니다.

- **GitHub ID**: `smplnq88`
- **저장소 이름**: `3d_glass_planner_vite_github_pages_pwa`
- **배포 주소**: `https://smplnq88.github.io/3d_glass_planner_vite_github_pages_pwa/`

---

## ⚡ GitHub Pages에 바로 올리는 명령어 (3단계)

1. **GitHub에서 새 저장소 생성:**
   - [GitHub.com/new](https://github.com/new)에 접속합니다.
   - **Repository name**에 `3d_glass_planner_vite_github_pages_pwa`를 입력하고 **Public**으로 생성합니다.

2. **파일 업로드 (Git Push):**
   - 이 압축 파일(.zip)을 해제한 폴더에서 터미널을 열고 다음 명령어를 그대로 실행합니다:
   ```bash
   git init
   git add .
   git commit -m "feat: Deploy 3D Glassmorphic Planner PWA to GitHub Pages"
   git branch -M main
   git remote add origin https://github.com/smplnq88/3d_glass_planner_vite_github_pages_pwa.git
   git push -u origin main
   ```

3. **GitHub Pages 활성화 (Settings 설정):**
   - 저장소 상단의 **Settings** 탭 ➡️ 좌측 **Pages** 메뉴를 클릭합니다.
   - **Build and deployment > Source** 항목을 **`GitHub Actions`**로 선택합니다.
   - 상단 **Actions** 탭에서 1~2분 후 빌드가 완료되면 `https://smplnq88.github.io/3d_glass_planner_vite_github_pages_pwa/` 주소로 즉시 접속할 수 있습니다!

---

## 💻 로컬 개발 환경에서 실행하는 방법

```bash
# 1. 의존성 패키지 설치
npm install

# 2. 로컬 개발 서버 실행 (포트 3000)
npm run dev

# 3. GitHub Pages용 정적 빌드 테스트
npm run build:gh-pages
```

---

## 📱 PWA 앱 설치 방법 (PC & 모바일)

- **PC (Chrome, Edge, Whale 등):** 브라우저 주소창 우측의 **[설치]** 아이콘 클릭
- **스마트폰 (iOS Safari):** 브라우저 하단 **[공유]** ➡️ **[홈 화면에 추가]** 클릭
- **스마트폰 (Android Chrome):** 브라우저 상단 메뉴 ➡️ **[앱 설치]** 또는 **[홈 화면에 추가]** 클릭

---

## ✨ 핵심 기능
- **3대 대시보드 뷰**: 데일리 리스트 뷰, 월간/주간 캘린더 매트릭스 뷰, 카테고리별 칸반 보드 뷰
- **스마트 알람 시스템**: 분/시간/매일/요일별/말일/지정일 반복 알람 & Web Audio 고음질 사운드
- **AI 정밀 진단 & 마음 힐링 저널**: 일정 분산 피드백, 뽀모도로 추천, 감사 일기 영구 보관
- **100% 로컬 영구 보존**: 브라우저 로컬 스토리지 안전 저장 & JSON 백업/복원
