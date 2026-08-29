# 🚀 3D Glassmorphic Planner - GitHub Pages PWA 배포 가이드

이 문서는 본 프로젝트를 **GitHub Pages**에 **PWA(Progressive Web App)**로 배포하고, 모바일 및 PC 바탕화면에 단독 앱으로 설치하여 사용하는 방법을 안내합니다.

---

## 📁 생성 및 구성된 PWA & 배포 필수 파일 목록

1. **`.github/workflows/deploy.yml`**:
   - 코드를 GitHub 저장소에 `git push`하면 자동으로 Vite 빌드를 수행하고 GitHub Pages로 배포해 주는 **GitHub Actions 자동 배포 파이프라인**.
2. **`public/manifest.json`**:
   - PWA 웹앱 매니페스트 (앱 이름, 3D 글래스 아이콘 해상도별 등록, 테마 컬러, `display: standalone` 설정).
3. **`public/sw.js`**:
   - GitHub Pages 서브폴더(`https://username.github.io/repo-name/`)와 루트 도메인을 모두 동적으로 지원하는 **서비스 워커(Service Worker)** 및 오프라인 캐싱 엔진.
4. **`public/404.html`**:
   - GitHub Pages 정적 호스팅에서 새로고침 또는 서브 경로 접근 시 404 오류를 방지하는 SPA 리다이렉트 파일.
5. **`vite.config.ts`**:
   - `base: './'` 상대 경로 설정으로 어떤 GitHub 레포지토리 이름에서도 에셋이 깨지지 않고 정상 로드되도록 구성.
6. **`src/main.tsx`**:
   - `import.meta.env.BASE_URL`을 통해 서비스 워커를 동적 스코프로 등록.

---

## ⚡ 1. GitHub에 프로젝트 업로드 및 배포 (3분 완성)

### Step 1: GitHub에서 새 저장소 생성
1. [GitHub](https://github.com/)에 로그인 후 **New Repository**를 클릭합니다.
2. 저장소 이름(예: `3d-glass-planner`)을 입력하고 **Public**으로 생성합니다.

### Step 2: 로컬 코드 푸시
터미널에서 아래 명령어를 실행하여 코드를 GitHub에 업로드합니다.

```bash
git init
git add .
git commit -m "feat: 3D Glassmorphic Planner Vite PWA setup"
git branch -M main
git remote add origin https://github.com/<당신의-아이디>/<저장소-이름>.git
git push -u origin main
```

---

## ⚙️ 2. GitHub Pages 활성화 (Settings 설정)

1. GitHub 저장소 상단 메뉴의 **Settings** 탭을 클릭합니다.
2. 좌측 사이드바에서 **Pages** 메뉴를 선택합니다.
3. **Build and deployment > Source** 옵션에서 **`GitHub Actions`**를 선택합니다.
4. 상단 **Actions** 탭으로 이동하면 `.github/workflows/deploy.yml`에 의해 빌드 및 배포가 자동으로 실행되는 것을 확인할 수 있습니다.
5. 완료 후 제공되는 주소(`https://<username>.github.io/<repo-name>/`)로 접속하면 배포가 완료됩니다! 🎉

---

## 📱 3. 모바일 & PC에서 PWA 앱으로 설치하기

### 💻 PC (Chrome / Edge / Whale)
1. 배포된 GitHub Pages 주소에 접속합니다.
2. 브라우저 주소창 우측의 **[설치(Install)] 아이콘** 또는 상단의 **`📲 바탕화면 앱 다운로드`** 버튼을 누릅니다.
3. 이제 독립된 데스크톱 앱 창으로 실행되며, 작업표시줄 및 시작 메뉴에 고정할 수 있습니다.

### 📱 스마트폰 / 태블릿 (iOS Safari & Android Chrome)
- **iPhone / iPad (Safari)**:
  - Safari 하단의 **[공유 버튼]** ➡️ **[홈 화면에 추가]** 탭 ➡️ 3D 글래스 아이콘의 단독 앱으로 즉시 설치됩니다.
- **Android (Chrome / Samsung Internet)**:
  - 브라우저 상단 알림창의 **[앱 설치]** 또는 메뉴의 **[홈 화면에 앱 추가]**를 클릭합니다.

---

## 💡 오프라인 동작 및 데이터 안전성
- **100% 오프라인 작동**: 서비스 워커가 핵심 에셋을 캐싱하므로 인터넷이 끊겨도 앱이 정상 실행됩니다.
- **로컬 스토리지 영구 보존**: 등록한 일정, 하위 체크리스트, 마음 힐링 저널은 브라우저에 안전하게 보관되며 언제든 **JSON 백업 파일**로 내보내고 복원할 수 있습니다.
