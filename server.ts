import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import AdmZip from "adm-zip";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const SETTINGS_FILE_PATH = path.join(process.cwd(), "icon-settings.json");

function getActiveIconKey(): string {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      return fs.readFileSync(SETTINGS_FILE_PATH, "utf8").trim();
    }
  } catch (e) {
    console.error("Error reading icon settings:", e);
  }
  return "original";
}

function setActiveIconKey(key: string) {
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, key, "utf8");
  } catch (e) {
    console.error("Error saving icon settings:", e);
  }
}

// Intercept icon and manifest requests to disable aggressive browser cache
app.get("/icon.png", (req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

app.get("/manifest.json", (req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Copy generated candidates to /public for frontend serving
function setupPublicIcons() {
  try {
    const srcDir = path.join(process.cwd(), "src/assets/images");
    const publicDir = path.join(process.cwd(), "public");
    
    if (!fs.existsSync(srcDir)) {
      console.log("Source images directory does not exist yet.");
      return;
    }
    
    const files = fs.readdirSync(srcDir);
    const candidates = ["emerald_lotus", "cosmic_nebula", "polar_aurora"];
    
    candidates.forEach(prefix => {
      const match = files.find(f => f.startsWith(prefix));
      if (match) {
        const srcPath = path.join(srcDir, match);
        const destPath = path.join(publicDir, `icon_${prefix}.jpg`);
        fs.copyFileSync(srcPath, destPath);
        console.log(`Successfully prepared candidates: Copied ${match} -> public/icon_${prefix}.jpg`);
      } else {
        console.log(`No match found for candidate prefix: ${prefix}`);
      }
    });

    // Make sure we have a reference copy of the current icon.png in the public folder too
    const currentIconPath = path.join(publicDir, "icon.png");
    if (fs.existsSync(currentIconPath) && !fs.existsSync(path.join(publicDir, "icon_original.png"))) {
      fs.copyFileSync(currentIconPath, path.join(publicDir, "icon_original.png"));
    }

    // Sync any saved active icon key on server boot to make sure public/icon.png is updated
    const savedKey = getActiveIconKey();
    if (savedKey === "cube") {
      const cubePath = path.join(publicDir, "icon_cube.png");
      if (fs.existsSync(cubePath)) {
        fs.copyFileSync(cubePath, currentIconPath);
        fs.copyFileSync(cubePath, path.join(publicDir, "icon-192x192.png"));
        fs.copyFileSync(cubePath, path.join(publicDir, "icon-512x512.png"));
        console.log("Restored active 3D cube icon on boot");
      }
    } else if (savedKey !== "original") {
      const candidatePath = path.join(publicDir, `icon_${savedKey}.jpg`);
      if (fs.existsSync(candidatePath)) {
        fs.copyFileSync(candidatePath, currentIconPath);
        console.log(`Restored persistent active icon: public/icon.png set to ${savedKey} on boot`);
      }
    } else {
      const originalPath = path.join(publicDir, "icon_original.png");
      if (fs.existsSync(originalPath)) {
        fs.copyFileSync(originalPath, currentIconPath);
        console.log("Restored original app icon on boot");
      }
    }
  } catch (e) {
    console.error("Error setting up public icons:", e);
  }
}

// Prepare icons immediately on import/boot
setupPublicIcons();

// Expose available app icon configurations
app.get("/api/icons", (req, res) => {
  res.json({
    current: "/icon.png",
    candidates: [
      {
        key: "cube",
        name: "3D 에메랄드 글래스 큐브 (Emerald Glass Cube)",
        description: "골드 네온 체크마크와 투명 에메랄드 큐브가 돋보이는 마스터 플래너 공식 3D 아이콘",
        url: "/icon_cube.png"
      },
      {
        key: "emerald_lotus",
        name: "에메랄드 로터스 플로우 (Emerald Lotus Flow)",
        description: "마음 챙김과 쉼을 유도하는 차분하고 감각적인 네온 에메랄드 & 티알 로터스 형상",
        url: "/icon_emerald_lotus.jpg"
      },
      {
        key: "cosmic_nebula",
        name: "로얄 코스믹 네뷸라 (Royal Cosmic Nebula)",
        description: "창의성을 자극하는 그윽한 인디고, 바이올렛 및 마젠타 우주의 오로라 기하학",
        url: "/icon_cosmic_nebula.jpg"
      },
      {
        key: "polar_aurora",
        name: "슬릭 폴라 오로라 스톤 (Sleek Polar Aurorastone)",
        description: "세련되고 강렬한 직관성을 부여하는 청량한 크리스탈 아이스 블루 & 민트 키",
        url: "/icon_polar_aurora.jpg"
      }
    ]
  });
});

// Post endpoint to commit active icon swap
app.post("/api/set-icon", (req, res) => {
  try {
    const { key } = req.body;
    const publicDir = path.join(process.cwd(), "public");
    let candidatePath = "";
    
    if (key === "cube") {
      candidatePath = path.join(publicDir, "icon_cube.png");
    } else if (key === "original") {
      candidatePath = path.join(publicDir, "icon_original.png");
    } else {
      candidatePath = path.join(publicDir, `icon_${key}.jpg`);
    }
    
    if (!fs.existsSync(candidatePath)) {
      res.status(400).json({ error: "선택한 커스텀 아이콘을 서버에서 찾을 수 없습니다." });
      return;
    }
    
    const targetIconPath = path.join(publicDir, "icon.png");
    fs.copyFileSync(candidatePath, targetIconPath);
    
    // Also update build/dist assets to ensure immediate rendering in production builds
    const distDir = path.join(process.cwd(), "dist");
    if (fs.existsSync(distDir)) {
      fs.copyFileSync(candidatePath, path.join(distDir, "icon.png"));
    }
    
    // Write choice persistently to settings file
    setActiveIconKey(key);
    
    console.log(`Active App Icon swapped successfully to: ${key}`);
    res.json({ success: true, key });
  } catch (err: any) {
    console.error("Error setting custom icon:", err);
    res.status(500).json({ error: "서버 내부 파일 스왑 연산 중 장애가 발생했습니다.", message: err.message });
  }
});

// Endpoint to directly download icons (individual or zip)
app.get("/api/download-icons-zip", (req, res) => {
  try {
    const publicDir = path.join(process.cwd(), "public");
    const zip = new AdmZip();

    const icon192 = path.join(publicDir, "icon-192x192.png");
    const icon512 = path.join(publicDir, "icon-512x512.png");
    const iconDefault = path.join(publicDir, "icon.png");

    if (fs.existsSync(icon192)) zip.addLocalFile(icon192);
    if (fs.existsSync(icon512)) zip.addLocalFile(icon512);
    if (fs.existsSync(iconDefault)) zip.addLocalFile(iconDefault);

    const zipBuffer = zip.toBuffer();
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="3D_Planner_Icons_Pack.zip"',
      "Content-Length": zipBuffer.length,
    });
    res.send(zipBuffer);
  } catch (err: any) {
    console.error("Error creating icon zip:", err);
    res.status(500).json({ error: "아이콘 압축 파일 생성 중 오류가 발생했습니다." });
  }
});

// Direct file download endpoints with attachment header
app.get("/api/download/icon-192", (req, res) => {
  const filePath = path.join(process.cwd(), "public", "icon-192x192.png");
  res.download(filePath, "icon-192x192.png");
});

app.get("/api/download/icon-512", (req, res) => {
  const filePath = path.join(process.cwd(), "public", "icon-512x512.png");
  res.download(filePath, "icon-512x512.png");
});

app.get("/api/download/icon-png", (req, res) => {
  const filePath = path.join(process.cwd(), "public", "icon.png");
  res.download(filePath, "icon.png");
});

app.get("/api/download/latest-manifest", (req, res) => {
  const filePath = path.join(process.cwd(), "public", "manifest.json");
  res.download(filePath, "manifest.json");
});

app.get("/api/download/latest-sw", (req, res) => {
  const filePath = path.join(process.cwd(), "public", "sw.js");
  res.download(filePath, "sw.js");
});

app.get("/api/download/latest-index", (req, res) => {
  const standalonePath = path.join(process.cwd(), "public", "index_standalone.html");
  if (fs.existsSync(standalonePath)) {
    res.download(standalonePath, "index.html");
  } else {
    res.download(path.join(process.cwd(), "dist", "index.html"), "index.html");
  }
});

// Alias for package zip
app.get("/api/download/latest-package-zip", (req, res, next) => {
  req.url = "/api/download-app";
  app._router.handle(req, res, next);
});

// Download standalone single HTML file directly
app.get("/api/download/standalone-html", (req, res) => {
  const standalonePath = path.join(process.cwd(), "public", "index_standalone.html");
  if (fs.existsSync(standalonePath)) {
    res.download(standalonePath, "3D_Glass_Planner_Standalone.html");
  } else {
    res.download(path.join(process.cwd(), "template_standalone.html"), "3D_Glass_Planner_Standalone.html");
  }
});

// Download GitHub Pages Vite PWA Deployment Package ZIP
app.get("/api/download/github-pwa-zip", (req, res) => {
  try {
    const publicZipPath = path.join(process.cwd(), "public", "3D_Glass_Planner_Vite_GitHub_Pages_PWA.zip");
    if (fs.existsSync(publicZipPath)) {
      res.download(publicZipPath, "3D_Glass_Planner_Vite_GitHub_Pages_PWA.zip");
      return;
    }

    const zip = new AdmZip();
    const rootDir = process.cwd();

    // 1. Add .github
    const githubDir = path.join(rootDir, ".github");
    if (fs.existsSync(githubDir)) {
      zip.addLocalFolder(githubDir, ".github");
    }

    // 2. Add src
    const srcDir = path.join(rootDir, "src");
    if (fs.existsSync(srcDir)) {
      zip.addLocalFolder(srcDir, "src");
    }

    // 3. Add public
    const publicDir = path.join(rootDir, "public");
    if (fs.existsSync(publicDir)) {
      const publicFiles = fs.readdirSync(publicDir);
      publicFiles.forEach(file => {
        if (!file.endsWith('.zip')) {
          const fullPath = path.join(publicDir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            zip.addLocalFolder(fullPath, path.join("public", file));
          } else {
            zip.addLocalFile(fullPath, "public");
          }
        }
      });
    }

    // 4. Add config files
    const rootFiles = [
      "package.json",
      "tsconfig.json",
      "tsconfig.node.json",
      "vite.config.ts",
      "server.ts",
      "index.html",
      "template_standalone.html",
      "GITHUB_PAGES_PWA_GUIDE.md",
      ".env.example",
      ".gitignore",
      "metadata.json"
    ];

    rootFiles.forEach(file => {
      const fullPath = path.join(rootDir, file);
      if (fs.existsSync(fullPath)) {
        zip.addLocalFile(fullPath);
      }
    });

    const zipBuffer = zip.toBuffer();
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="3D_Glass_Planner_Vite_GitHub_Pages_PWA.zip"',
      "Content-Length": zipBuffer.length,
    });
    res.send(zipBuffer);
  } catch (err: any) {
    console.error("Error creating github pwa zip:", err);
    res.status(500).json({ error: "GitHub Pages PWA 압축 파일 생성 중 오류가 발생했습니다." });
  }
});

// Download full project source code ZIP (for GitHub repository clone or local npm development)
app.get("/api/download/source-code-zip", (req, res) => {
  try {
    const zip = new AdmZip();
    const rootDir = process.cwd();

    // 1. Add .github
    const githubDir = path.join(rootDir, ".github");
    if (fs.existsSync(githubDir)) {
      zip.addLocalFolder(githubDir, ".github");
    }

    // 2. Add src folder recursively
    const srcDir = path.join(rootDir, "src");
    if (fs.existsSync(srcDir)) {
      zip.addLocalFolder(srcDir, "src");
    }

    // 3. Add public folder recursively
    const publicDir = path.join(rootDir, "public");
    if (fs.existsSync(publicDir)) {
      const publicFiles = fs.readdirSync(publicDir);
      publicFiles.forEach(file => {
        if (!file.endsWith('.zip')) {
          const fullPath = path.join(publicDir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            zip.addLocalFolder(fullPath, path.join("public", file));
          } else {
            zip.addLocalFile(fullPath, "public");
          }
        }
      });
    }

    // 4. Add root config files
    const rootFiles = [
      "package.json",
      "tsconfig.json",
      "tsconfig.node.json",
      "vite.config.ts",
      "server.ts",
      "index.html",
      "template_standalone.html",
      "GITHUB_PAGES_PWA_GUIDE.md",
      "build_standalone.py",
      ".env.example",
      ".gitignore",
      "metadata.json"
    ];

    rootFiles.forEach(file => {
      const fullPath = path.join(rootDir, file);
      if (fs.existsSync(fullPath)) {
        zip.addLocalFile(fullPath);
      }
    });

    // 4. Add comprehensive README.md
    const readmeContent = `# 3D Glassmorphic Planner (전체 소스코드 패키지)

오프라인 동작 및 GitHub 배포를 완벽 지원하는 3D 글래스모피즘 일정 & 목표 플래너 소스코드입니다.

---

## 🛠️ 로컬 개발 환경 실행 방법

\`\`\`bash
# 1. 패키지 설치
npm install

# 2. 로컬 개발 서버 실행 (포트 3000)
npm run dev

# 3. 배포용 빌드
npm run build
\`\`\`

---

## 🚀 GitHub Pages 초간단 배포 방법

1. GitHub.com에 새 Public Repository를 생성합니다 (예: \`my-planner\`).
2. \`public/\` 폴더 안의 파일들(\`index_standalone.html\`을 \`index.html\`로 변경하여) 또는 \`dist/\` 빌드 결과물을 저장소에 업로드합니다.
3. 저장소의 **Settings -> Pages**에서 Branch를 \`main\`으로 지정하고 Save를 누르면 끝!

---

## ✨ 포함된 핵심 기능
- **3가지 대시보드 뷰**: 데일리 목록 뷰, 월/주별 캘린더 매트릭스 뷰, 카테고리별 보드 뷰
- **정밀 알람 반복 주기**: 분/시간/매일/요일별/매월 말일/매월 지정일 맞춤 반복 설정
- **Web Audio API 오디오 엔진**: 고음질 젠 벨, 차임벨, 전자 비프음 사운드
- **100% 로컬 데이터 보존**: localStorage 기반 안전 영구 저장 및 JSON 백업/복원
`;
    zip.addFile("README.md", Buffer.from(readmeContent, "utf-8"));

    const zipBuffer = zip.toBuffer();
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="3D_Planner_Source_Code.zip"',
      "Content-Length": zipBuffer.length,
    });
    res.send(zipBuffer);
  } catch (err: any) {
    console.error("Error creating source code zip:", err);
    res.status(500).json({ error: "소스코드 압축 파일 생성 중 오류가 발생했습니다." });
  }
});

// Download modified files only ZIP
app.get("/api/download/modified-files-zip", (req, res) => {
  try {
    const zip = new AdmZip();
    const rootDir = process.cwd();

    const modifiedFileList = [
      { path: "src/App.tsx", zipPath: "src/App.tsx" },
      { path: "src/types.ts", zipPath: "src/types.ts" },
      { path: "src/components/CalendarView.tsx", zipPath: "src/components/CalendarView.tsx" },
      { path: "src/components/CategoryView.tsx", zipPath: "src/components/CategoryView.tsx" },
      { path: "src/components/AddTodoForm.tsx", zipPath: "src/components/AddTodoForm.tsx" },
      { path: "src/components/EditTodoModal.tsx", zipPath: "src/components/EditTodoModal.tsx" },
      { path: "src/components/TodoCard.tsx", zipPath: "src/components/TodoCard.tsx" },
      { path: "src/lib/alarmUtils.ts", zipPath: "src/lib/alarmUtils.ts" },
      { path: "src/lib/alarmAudio.ts", zipPath: "src/lib/alarmAudio.ts" },
      { path: "src/lib/exportUtils.ts", zipPath: "src/lib/exportUtils.ts" },
      { path: "server.ts", zipPath: "server.ts" },
      { path: "package.json", zipPath: "package.json" },
      { path: "metadata.json", zipPath: "metadata.json" },
      { path: "public/manifest.json", zipPath: "public/manifest.json" },
      { path: "public/sw.js", zipPath: "public/sw.js" },
      { path: "template_standalone.html", zipPath: "template_standalone.html" },
      { path: "build_standalone.py", zipPath: "build_standalone.py" }
    ];

    modifiedFileList.forEach(item => {
      const fullPath = path.join(rootDir, item.path);
      if (fs.existsSync(fullPath)) {
        const dir = path.dirname(item.zipPath);
        zip.addLocalFile(fullPath, dir === "." ? "" : dir);
      }
    });

    const zipBuffer = zip.toBuffer();
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="3D_Planner_Modified_Files.zip"',
      "Content-Length": zipBuffer.length,
    });
    res.send(zipBuffer);
  } catch (err: any) {
    console.error("Error creating modified files zip:", err);
    res.status(500).json({ error: "변경된 파일 압축 중 오류가 발생했습니다." });
  }
});

// GET endpoint to create and download the customized client app zip with selected icon embedded
app.get("/api/download-app", (req, res) => {
  try {
    const distDir = path.join(process.cwd(), "dist");
    const publicDir = path.join(process.cwd(), "public");
    
    // Check if dist folder exists, if not fallback to public
    if (!fs.existsSync(distDir)) {
      res.status(404).json({ error: "애플리케이션 빌드 결과물이 없습니다. 먼저 빌드를 완료해 주세요." });
      return;
    }
    
    // Proactively verify and synchronize active icon file into dist/icon.png before zipping
    const currentActiveKey = getActiveIconKey();
    let sourceCandidate = "";
    if (currentActiveKey === "original") {
      sourceCandidate = path.join(publicDir, "icon_original.png");
    } else {
      sourceCandidate = path.join(publicDir, `icon_${currentActiveKey}.jpg`);
    }
    
    if (fs.existsSync(sourceCandidate)) {
      fs.copyFileSync(sourceCandidate, path.join(distDir, "icon.png"));
      console.log(`Proactively sync custom icon (${currentActiveKey}) to dist/icon.png before client download.`);
    }
    
    // Create new zip using AdmZip
    const zip = new AdmZip();
    
    // Read files of distDir and add to zip, excluding node_modules, server.cjs, etc.
    const files = fs.readdirSync(distDir);
    for (const file of files) {
      const fullPath = path.join(distDir, file);
      const isDirectory = fs.statSync(fullPath).isDirectory();
      
      if (isDirectory) {
        if (file !== "node_modules") {
          zip.addLocalFolder(fullPath, file);
        }
      } else {
        // Exclude server-side build artifacts and replace index.html with standalone index
        if (file !== "server.cjs" && file !== "server.cjs.map" && file !== "index.html") {
          zip.addLocalFile(fullPath);
        }
      }
    }

    // Add standalone index.html which runs DIRECTLY on file:// without CORS or server requirements!
    const standaloneFile = path.join(publicDir, "index_standalone.html");
    if (fs.existsSync(standaloneFile)) {
      zip.addLocalFile(standaloneFile, "", "index.html");
    } else {
      zip.addLocalFile(path.join(distDir, "index.html"));
    }

    // Inject gorgeous, helpful Korean installation README and scripts directly inside the zip archive!
    const readmeContent = `======================================================================
 입체 글래스모피즘 플래너 (3D Glassmorphic Planner) PC/모바일 설치 안내
======================================================================

본 압축 파일(.ZIP)은 직접 선택하신 최고 화질의 3D 입체 테마 아이콘(icon.png)이
완벽히 포함되어 빌드 및 완성이 완료된 단독 작동용 무설치 완성형 패키지입니다.

----------------------------------------------------------------------
[단 1초!] PC 바탕화면 단독 앱으로 설치하여 평생 소장/실행하는 방법
----------------------------------------------------------------------
브라우저 보안 규칙상, index.html 파일을 그냥 마우스로 직접 더블클릭하면
보안 경고(CORS)로 인해 아이콘 갱신이나 전용 데이터 보존(PWA) 기능이 작동하지 않습니다.
반드시 아래의 "원클릭 자동 실행 스크립트"를 이용해서 실행해 주세요:

1. 윈도우(Windows) 컴퓨터 사용자:
   - 압축을 푼 폴더 안에 있는 [실행하기_윈도우.bat] 파일을 마우스로 더블클릭합니다.
   - 단 1초 만에 최적화된 로컬 웹 서버가 켜지며 플래너 브라우저 화면이 열립니다.

2. 맥/리눅스(macOS/Linux) 컴퓨터 사용자:
   - 압축을 푼 폴더 안에 있는 [실행하기_맥.command] 파일을 마우스로 더블클릭합니다.
   - 자동으로 로컬 서버가 실행되며 플래너 화면이 열립니다.

3. "진짜 앱처럼" 바탕화면이나 작업 표시줄에 추가하는 방법:
   - 위의 1번 또는 2번 방법으로 주소(http://localhost:8080) 창이 열렸다면,
     브라우저 주소창 우측 끝부분의 [앱 설치] 버튼(모니터 모양 또는 다운로드 아이콘)을 누릅니다.
   - 그럼 컴퓨터 바탕화면에 선택하셨던 고화질 3D 글래스 아이콘 전용 앱이 바로 설치되어 평생 소장 및 오프라인 전용 앱으로 사용할 수 있습니다!

======================================================================
[업그레이드 및 폰으로 가져오기] 모바일 앱 동기화 및 실시간 업데이트 안내
======================================================================
- 스마트폰(모바일)에서도 사용하시려면 플래너 내의 '바탕화면 & 앱 다운로드' 메뉴에 있는 QR코드를 스마트폰 기본 카메라로 찍어 보세요. 
- 그 자리에서 주소가 스마트폰에 열리며, 브라우저 메뉴의 '홈 화면에 추가'를 누르면 스마트폰 앱 서랍 속에 3D 아이콘 전용 모바일 앱으로 완벽히 내려받을 수 있습니다!
- 개발 단계에서 수정한 최신 버그 픽스나 기호 설정들은, 앱 화면에 업그레이드 배너가 떴을 때 [즉시 설치 및 업데이트 적용] 단추만 1회 눌러주시면 캐시를 자동 청소하고 우주에서 가장 매끄러운 버전으로 실시간 갱신됩니다!

플래너와 함께 더욱 윤택하고 성취감 가득한 하루를 가꾸어 가세요! 🚀`;

    const batContent = `@echo off
title 3D Glassmorphic Planner Local Server
echo ==========================================================
echo  [3D 입체 글래스모피즘 플래너] 전용 초간편 로컬 실행 서버
echo ==========================================================
echo.
echo 브라우저 보안 환경(PWA/Local Storage) 지원을 위한 
echo 1회성 정밀 로컬 웹 서버를 실행하고 브라우저를 엽니다...
echo.

python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [시스템 확인] Python이 정상 설치되어 있습니다. Python 웹서버로 고속 구동합니다...
    start http://localhost:8080
    python -m http.server 8080
    goto end
)

node -v >nul 2>&1
if %errorlevel% equ 0 (
    echo [시스템 확인] Node.js가 감지되었습니다. npx serve 환경으로 구동합니다...
    npx -y serve -l 8080 .
    goto end
)

echo.
echo [경고] 컴퓨터에 Python 이나 Node.js가 설치되어 있지 않습니다.
echo 이 스크립트 실행 없이 index.html을 더블클릭하여 임시 실행할 수도 있으나,
echo 브라우저 보안 정책상 아이콘 업데이트나 오프라인 PWA 구동에 제약이 있을 수 있습니다.
echo.
echo 엔터키를 누르면 기본 웹 브라우저를 통해 오프라인으로 엽니다.
pause
start index.html

:end`;

    const shContent = `#!/bin/bash
cd "$(dirname "$0")"
echo "=========================================================="
echo " [3D 입체 글래스모피즘 플래너] macOS 전용 초간편 로컬 실행 서버"
echo "=========================================================="
echo ""
echo "로컬 웹 서버를 켜고 플래너 앱을 브라우저에 바로 띄웁니다..."
echo ""

if command -v python3 &>/dev/null; then
    echo "[안내] Python 3이 정상 감지되었습니다."
    open http://localhost:8080
    python3 -m http.server 8080
elif command -v python &>/dev/null; then
    echo "[안내] Python이 정상 감지되었습니다."
    open http://localhost:8080
    python -m SimpleHTTPServer 8080
elif command -v node &>/dev/null; then
    echo "[안내] Node.js 환경이 감지되었습니다."
    npx -y serve -l 8080 .
else
    echo "[경고] 로컬 실행용 웹 서버 도구가 없습니다. 웹 브라우저로 직접 엽니다."
    open index.html
fi`;

    zip.addFile("Readme_설치_및_실행방법.txt", Buffer.from(readmeContent, 'utf-8'));
    zip.addFile("실행하기_윈도우.bat", Buffer.from(batContent, 'utf-8'));
    zip.addFile("실행하기_맥.command", Buffer.from(shContent, 'utf-8'));

    // Convert zip file to buffer
    const zipBuffer = zip.toBuffer();
    
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=3D_Glassmorphic_Planner_CustomApp.zip");
    res.send(zipBuffer);
  } catch (err: any) {
    console.error("Error zipping app package:", err);
    res.status(500).json({ error: "애플리케이션 ZIP 패키지 생성에 실패했습니다.", message: err.message });
  }
});

// Lazy-initialized Gemini client to prevent crashing on boot if the key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 🤖 API endpoint to generate structured planning items
app.post("/api/planner/generate", async (req, res) => {
  try {
    const { goal } = req.body;
    if (!goal || typeof goal !== "string" || goal.trim().length === 0) {
      res.status(400).json({ error: "올바른 목표를 입력해 주세요." });
      return;
    }

    const ai = getGeminiClient();
    
    // Using gemini-3.5-flash for fast and robust structured text generation
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `내가 수립하려는 목표 또는 프로젝트 상황은 다음과 같습니다: "${goal}"
이 목표를 달성하기 위해 실천해야 할 3~5개의 구체적인 투두리스트 할 일들을 체계적으로 세분화해서 작성해 주세요. 
반드시 다음 JSON 스키마 규격에 맞춰 한국어로 답변해 주세요.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "목표를 이루기 위해 단계적으로 세우는 3~5개의 할 일(Todo) 계획 목록",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "간결하고 핵심적인 투두 제목 (예: 사전 항공권 특가 예약)" },
              description: { type: Type.STRING, description: "할 일에 대한 구체적인 팁, 설명 혹은 가이드라인 (예: 출발 3개월 전에 알림 설정을 켜고 비교 사이트 확인하기)" },
              category: { 
                type: Type.STRING, 
                description: "분류 카테고리 종류",
                enum: ["Work", "Personal", "Shopping", "Creative", "Health"] 
              },
              priority: { 
                type: Type.STRING, 
                description: "우선순위 중요도",
                enum: ["low", "medium", "high"] 
              },
              dueDateOffset: { 
                type: Type.INTEGER, 
                description: "오늘을 기준(0)으로 며칠 뒤까지 마쳐야 하는지 상대적 오프셋값 (단기 일정은 0~7 사이, 장기 일정은 필요에 따라 설정)" 
              },
              subtasks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "이 일정을 더 조각조각 달성할 수 있는 세부 체크리스트 하위 과제들 (최대 4개 추천, 예: ['여러 가격비교 사이트 북마크', '할인 뉴스레터 구독'])"
              }
            },
            required: ["title", "category", "priority", "dueDateOffset", "subtasks"]
          }
        }
      }
    });

    const jsonText = response.text ? response.text.trim() : "[]";
    const planItems = JSON.parse(jsonText);
    res.json({ plan: planItems });
  } catch (err: any) {
    console.error("Gemini AI planner generation error:", err);
    res.status(500).json({ 
      error: "Gemini AI를 연결할 수 없거나 분석 과정에서 에러가 발생했습니다.", 
      message: err?.message || String(err) 
    });
  }
});

// 🧠 API endpoint to analyze current actual todos & provide feedback with actionable tips and expansion tasks
app.post("/api/planner/analyze", async (req, res) => {
  try {
    const { todos } = req.body;
    if (!Array.isArray(todos)) {
      res.status(400).json({ error: "올바른 투두 데이터가 전송되지 않았습니다." });
      return;
    }

    const ai = getGeminiClient();

    const activeTodosBrief = todos
      .filter(t => !t.completed)
      .map(t => ({
        title: t.title,
        description: t.description || "",
        category: t.category,
        priority: t.priority,
        dueDate: t.dueDate || "없음",
        subtasks: Array.isArray(t.subtasks) ? t.subtasks.map((s: any) => s.text) : []
      }));

    const systemPrompt = `당신은 사용자의 일정 계획과 라이프스타일을 전문적으로 지도하는 초지능형 플래너 컨설턴트(AI Planner Assistant)입니다.
사용자가 현재 진행하고 있는 다음 할 일(Todo) 목록 데이터를 정독하십시오:
${JSON.stringify(activeTodosBrief, null, 2)}

이 정보를 기반으로 다음 요소들을 면밀히 분석해 주세요:
1. 사용자의 워크로드 균형 상태, 우선순위 조율, 기한에 관한 종합적인 피드백 및 격려의 말 (feedback, 한국어로 친절하고 전문적인 문체)
2. 일정을 관리하는 2가지 최적화 실천 가이드 및 팁 (tips)
3. 현재 목록을 보며 누락되었을 가능성이 높은, 혹은 연계하여 실천하기 좋은 매력적이고 유용한 새로운 투두 가이드 추천 1~2가지 (suggestions)

반드시 아래 지정된 JSON Schema 모델에 맞춰 한국어로 조목조목 분석보고서를 보내주십시오.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { 
              type: Type.STRING, 
              description: "사용자의 현재 할 일 목록에 대한 따뜻한 독려, 일정 분산 피드백, 균형 개선 조언 (최소 3개 문장)" 
            },
            tips: {
              type: Type.ARRAY,
              description: "투두 관리를 훨씬 고도화할 수 있는 커스텀 팁 요약본 (정확히 2개 추천)",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "팁의 대제목 (예: '점진적인 업무 부하 감소 전략')" },
                  description: { type: Type.STRING, description: "설명 및 실천 방안 (한국어)" }
                },
                required: ["title", "description"]
              }
            },
            suggestions: {
              type: Type.ARRAY,
              description: "사용자의 현재 투두 내용과 밀접히 연계된 스마트 추천 일정 (1~2개 추천)",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "추천 투두의 영양가 높은 대제목" },
                  description: { type: Type.STRING, description: "이 일정을 추천하는 배경과 미니 팁" },
                  category: { 
                    type: Type.STRING, 
                    enum: ["Work", "Personal", "Shopping", "Creative", "Health"] 
                  },
                  priority: { 
                    type: Type.STRING, 
                    enum: ["low", "medium", "high"] 
                  },
                  dueDateOffset: { 
                    type: Type.INTEGER, 
                    description: "이 추천 계획을 며칠 내로 시작하기 좋은지 오프셋 (정수)" 
                  },
                  subtasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "추천 일정의 구체적인 하위 체크 과제들 (최대 3개)"
                  }
                },
                required: ["title", "description", "category", "priority", "dueDateOffset", "subtasks"]
              }
            }
          },
          required: ["feedback", "tips", "suggestions"]
        }
      }
    });

    const jsonText = response.text ? response.text.trim() : "{}";
    const analysis = JSON.parse(jsonText);
    res.json({ analysis });
  } catch (err: any) {
    console.error("Gemini AI planner analysis error:", err);
    res.status(500).json({ 
      error: "Gemini AI 투두 분석에 실패했습니다.", 
      message: err?.message || String(err) 
    });
  }
});

// Configure Vite integration inside express.
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

initServer().catch((error) => {
  console.error("Failed to start full-stack server:", error);
});
