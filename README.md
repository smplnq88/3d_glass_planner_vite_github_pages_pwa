# 🚀 3D Glassmorphic Planner - Vite PWA (GitHub Pages Ready)

이 패키지는 **Vite + React + TypeScript**로 구성된 3D 글래스모피즘 일정 플래너 웹 애플리케이션의 **GitHub Pages PWA 완제품 배포 패키지**입니다.

GitHub Actions 자동 배포 파이프라인(`.github/workflows/deploy.yml`), PWA 웹앱 매니페스트(`public/manifest.json`), 동적 스코프 서비스 워커(`public/sw.js`), SPA 404 리다이렉트(`public/404.html`) 등이 모두 완벽하게 사전 구성되어 있어, GitHub 저장소에 그대로 업로드만 하면 몇 분 내에 나만의 PWA 플래너가 온라인에 배포됩니다.

---

## ⚡ GitHub Pages에 3분 만에 자동 배포하기

1. **GitHub에서 새 저장소 생성:**
   - [GitHub.com](https://github.com/)에 로그인 후 **New Repository**를 생성합니다 (예: `3d-planner`).
   - 공개(Public) 저장소로 설정합니다.

2. **파일 업로드 (Git Push):**
   - 이 압축 파일(.zip)을 해제한 후, 해당 폴더에서 터미널을 열고 다음 명령어를 실행합니다:
   ```bash
   git init
   git add .
   git commit -m "feat: Initial commit for 3D Glassmorphic Planner Vite PWA"
   git branch -M main
   git remote add origin https://github.com/<당신의_GitHub_ID>/<저장소_이름>.git
   git push -u origin main
   ```

3. **GitHub Pages 활성화 (Settings 설정):**
   - GitHub 저장소 상단의 **Settings** 메뉴로 이동합니다.
   - 좌측 메뉴에서 **Pages**를 클릭합니다.
   - **Build and deployment > Source** 항목을 **`GitHub Actions`**로 선택합니다.
   - 상단 **Actions** 탭에서 빌드 파이프라인이 자동 실행되며, 1~2분 후 배포된 전용 URL(`https://<당신의_GitHub_ID>.github.io/<저장소_이름>/`)이 생성됩니다!

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
