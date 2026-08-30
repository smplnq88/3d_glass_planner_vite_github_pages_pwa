# 🚀 3D Glassmorphic Planner - GitHub Pages PWA 배포 가이드

이 문서는 본 프로젝트를 **GitHub Pages**에 **PWA(Progressive Web App)**로 배포하고, 모바일 및 PC 바탕화면에 단독 앱으로 설치하여 사용하는 방법을 안내합니다.

- **GitHub ID**: `smplnq88`
- **저장소 이름**: `3d_glass_planner_vite_github_pages_pwa`
- **배포될 URL**: `https://smplnq88.github.io/3d_glass_planner_vite_github_pages_pwa/`

---

## ⚡ 1. GitHub에 프로젝트 업로드 및 배포 (복사해서 바로 실행)

### Step 1: GitHub에서 새 저장소 생성
1. [GitHub](https://github.com/new)에 로그인하여 저장소를 생성합니다.
2. **Repository name**에 `3d_glass_planner_vite_github_pages_pwa`를 입력합니다.
3. **Public**으로 설정 후 **Create repository** 버튼을 클릭합니다.

### Step 2: 로컬 코드 푸시 (터미널 명령어)
다운로드받은 압축 파일을 푼 폴더(또는 프로젝트 루트)에서 터미널을 열고 아래 명령어를 순서대로 복사/붙여넣기하여 실행합니다.

```bash
git init
git add .
git commit -m "feat: Deploy 3D Glassmorphic Planner PWA to GitHub Pages"
git branch -M main
git remote add origin https://github.com/smplnq88/3d_glass_planner_vite_github_pages_pwa.git
git push -u origin main
```

---

## ⚙️ 2. GitHub Pages 활성화 (Settings 설정)

1. GitHub 저장소(`https://github.com/smplnq88/3d_glass_planner_vite_github_pages_pwa`) 상단 메뉴의 **Settings** 탭을 클릭합니다.
2. 좌측 사이드바에서 **Pages** 메뉴를 선택합니다.
3. **Build and deployment > Source** 옵션에서 **`GitHub Actions`**를 선택합니다.
4. 상단 **Actions** 탭으로 이동하면 `.github/workflows/deploy.yml`에 의해 빌드 및 배포가 자동으로 실행됩니다.
5. 배포 완료 후 **`https://smplnq88.github.io/3d_glass_planner_vite_github_pages_pwa/`** 로 접속하면 바로 사용 가능합니다! 🎉

---

## 📱 3. 모바일 & PC에서 PWA 앱으로 설치하기

### 💻 PC (Chrome / Edge / Whale)
1. `https://smplnq88.github.io/3d_glass_planner_vite_github_pages_pwa/`에 접속합니다.
2. 브라우저 주소창 우측의 **[설치(Install)] 아이콘** 또는 상단의 **`📲 바탕화면 앱 다운로드`** 버튼을 누릅니다.
3. 독립된 데스크톱 앱 창으로 실행되며, 작업표시줄 및 시작 메뉴에 고정할 수 있습니다.

### 📱 스마트폰 / 태블릿 (iOS Safari & Android Chrome)
- **iPhone / iPad (Safari)**:
  - Safari 하단의 **[공유 버튼]** ➡️ **[홈 화면에 추가]** 탭 ➡️ 3D 글래스 아이콘의 단독 앱으로 즉시 설치됩니다.
- **Android (Chrome / Samsung Internet)**:
  - 브라우저 상단 알림창의 **[앱 설치]** 또는 메뉴의 **[홈 화면에 앱 추가]**를 클릭합니다.

---

## 💡 오프라인 동작 및 데이터 안전성
- **100% 오프라인 작동**: 서비스 워커가 핵심 에셋을 캐싱하므로 인터넷이 끊겨도 앱이 정상 실행됩니다.
- **로컬 스토리지 영구 보존**: 등록한 일정, 하위 체크리스트, 마음 힐링 저널은 브라우저에 안전하게 보관되며 언제든 **JSON 백업 파일**로 내보내고 복원할 수 있습니다.
