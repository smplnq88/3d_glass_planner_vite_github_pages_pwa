/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { CUBE_ICON_DATA, getAssetUrl } from '../iconData';

/**
 * Trigger browser file download from Blob
 */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Fetch an asset as binary Blob or fallback
 */
async function fetchAssetBlob(url: string): Promise<Blob | null> {
  try {
    const resolvedUrl = getAssetUrl(url);
    const response = await fetch(resolvedUrl);
    if (!response.ok) return null;
    return await response.blob();
  } catch (err) {
    console.warn(`Failed to fetch asset from ${url}:`, err);
    return null;
  }
}

/**
 * Convert base64 data URI to Blob
 */
export function base64ToBlob(base64DataUri: string): Blob {
  const parts = base64DataUri.split(',');
  const byteString = atob(parts[1] || parts[0]);
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

/**
 * 1. Download Single Standalone HTML File
 * Runs 100% offline in any browser with zero dependencies!
 */
export async function downloadStandaloneHtmlFile(): Promise<void> {
  let htmlContent = '';
  try {
    const res = await fetch('/template_standalone.html');
    if (res.ok) {
      htmlContent = await res.text();
    }
  } catch (e) {
    console.warn('Could not fetch template_standalone.html, using fallback', e);
  }

  if (!htmlContent) {
    throw new Error('템플릿 파일을 불러올 수 없습니다.');
  }

  // Inject current theme icon base64 data
  const finalHtml = htmlContent.replace(/__CUBE_BASE64_PLACEHOLDER__/g, CUBE_ICON_DATA);
  const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
  triggerBlobDownload(blob, '3D_Glass_Planner_Standalone.html');
}

/**
 * 2. Download Complete GitHub Pages & Offline App Package (.ZIP)
 * Includes index.html, manifest.json, sw.js, icons, and deployment guide
 */
export async function downloadOfflineAppPackageZip(): Promise<void> {
  const zip = new JSZip();

  // 1. Fetch standalone HTML and prepare as index.html
  let htmlContent = '';
  try {
    const res = await fetch('/template_standalone.html');
    if (res.ok) {
      htmlContent = await res.text();
    }
  } catch (e) {}

  if (htmlContent) {
    const finalHtml = htmlContent.replace(/__CUBE_BASE64_PLACEHOLDER__/g, CUBE_ICON_DATA);
    zip.file('index.html', finalHtml);
  }

  // 2. Add manifest.json
  const manifest = {
    id: "./?source=pwa",
    name: "3D Glassmorphic Planner",
    short_name: "3D Planner",
    description: "3D 입체 글래스모피즘 스타일의 일정 및 하루 목표 플래너",
    start_url: "./index.html",
    scope: "./",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#090d16",
    theme_color: "#047857",
    lang: "ko-KR",
    categories: ["productivity", "utilities", "lifestyle"],
    icons: [
      {
        src: "./icon-192x192.png",
        type: "image/png",
        sizes: "192x192",
        purpose: "any"
      },
      {
        src: "./icon-512x512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "any"
      },
      {
        src: "./icon-512x512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable"
      },
      {
        src: "./icon.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "any maskable"
      }
    ]
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 3. Add sw.js (Service Worker)
  const swCode = `const CACHE_NAME = '3d-glass-planner-offline-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './icon.png',
  './icon-192x192.png',
  './icon-512x512.png',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME ? caches.delete(k) : null))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => caches.match('./index.html')))
  );
});
`;
  zip.file('sw.js', swCode);

  // 4. Add Icons to zip
  try {
    const icon192Blob = await fetchAssetBlob('/icon-192x192.png');
    if (icon192Blob) zip.file('icon-192x192.png', icon192Blob);

    const icon512Blob = await fetchAssetBlob('/icon-512x512.png');
    if (icon512Blob) zip.file('icon-512x512.png', icon512Blob);

    const iconPngBlob = await fetchAssetBlob('/icon.png');
    if (iconPngBlob) zip.file('icon.png', iconPngBlob);
  } catch (e) {
    console.warn('Icons bundle warning:', e);
  }

  // Fallback: write base64 cube icon if icon.png not fetched
  if (CUBE_ICON_DATA && CUBE_ICON_DATA.startsWith('data:image/')) {
    const cubeBlob = base64ToBlob(CUBE_ICON_DATA);
    zip.file('icon.png', cubeBlob);
  }

  // 5. Add GitHub Pages Deploy Guide README.md
  const readmeMd = `# 3D Glassmorphic Planner (오프라인 & GitHub Pages 배포 패키지)

이 패키지는 100% 브라우저 독립 및 오프라인에서 동작하는 **3D Glassmorphic Planner** 완제품 패키지입니다.
인터넷 연결이 없어도 동작하며, GitHub Pages에 바로 업로드하여 무료 호스팅할 수 있습니다.

---

## 🚀 GitHub Pages 배포 방법 (초간단 3단계)

1. **GitHub 저장소(Repository) 생성:**
   - GitHub.com에 로그인 후 **New Repository**를 생성합니다 (예: \`my-planner\`).
   - Public(공개)으로 설정합니다.

2. **파일 업로드:**
   - 이 압축 파일(.zip)을 푼 후, 안의 모든 파일(\`index.html\`, \`manifest.json\`, \`sw.js\`, \`icon-*.png\` 등)을 저장소 루트에 업로드(Commit)합니다.

3. **GitHub Pages 활성화:**
   - 저장소의 **Settings** -> **Pages** 메뉴로 이동합니다.
   - **Branch**를 \`main\`(또는 \`master\`)으로 선택하고 **Save**를 누릅니다.
   - 1~2분 후 생성되는 전용 주소(예: \`https://<username>.github.io/my-planner/\`)로 접속하면 나만의 무료 영구 플래너 웹앱이 완성됩니다!

---

## 💻 내 컴퓨터에서 바로 실행하기 (무설치)
- \`index.html\` 파일을 더블 클릭하면 인터넷 연결 없이도 즉시 실행됩니다.
- 브라우저 주소창 우측의 **'앱 설치'** 버튼을 누르면 데스크톱 전용 앱(PWA)으로도 설치할 수 있습니다.

---

## ✨ 포함된 주요 기능
- **3가지 뷰 시스템**: 데일리 목록 뷰, 월/주별 캘린더 매트릭스 뷰, 카테고리별 보드 뷰
- **정밀 알람 반복 주기**: 분/시간/매일/요일별/매월 말일/매월 지정일 맞춤 반복 설정
- **Web Audio 알람 사운드 엔진**: 고음질 젠 벨, 차임벨, 전자 비프 사운드
- **100% 로컬 데이터 보존**: \`localStorage\` 기반 안전 영구 저장 및 JSON 백업/복원 지원
`;
  zip.file('README.md', readmeMd);

  // Generate zip file and download
  const content = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(content, '3D_Glass_Planner_GitHub_Bundle.zip');
}

/**
 * 3. Download All Icons Bundle (.ZIP)
 */
export async function downloadIconsBundleZip(): Promise<void> {
  const zip = new JSZip();

  const iconUrls = [
    { name: 'icon-192x192.png', url: '/icon-192x192.png' },
    { name: 'icon-512x512.png', url: '/icon-512x512.png' },
    { name: 'icon.png', url: '/icon.png' },
    { name: 'icon_original.png', url: '/icon_original.png' },
    { name: 'icon_cube.png', url: '/icon_cube.png' },
    { name: 'icon_emerald_lotus.jpg', url: '/icon_emerald_lotus.jpg' },
    { name: 'icon_cosmic_nebula.jpg', url: '/icon_cosmic_nebula.jpg' },
    { name: 'icon_polar_aurora.jpg', url: '/icon_polar_aurora.jpg' }
  ];

  for (const item of iconUrls) {
    try {
      const blob = await fetchAssetBlob(item.url);
      if (blob) {
        zip.file(item.name, blob);
      }
    } catch (e) {}
  }

  // Also include the embedded base64 cube icon
  if (CUBE_ICON_DATA && CUBE_ICON_DATA.startsWith('data:image/')) {
    zip.file('icon_cube_embedded.png', base64ToBlob(CUBE_ICON_DATA));
  }

  const content = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(content, '3D_Planner_Icons_Pack.zip');
}

/**
 * 4. Download Vite GitHub Pages PWA Full Deployment Package (.ZIP)
 * Includes .github/workflows/deploy.yml, src/, public/, manifest.json, sw.js, 404.html, vite.config.ts, and deploy guide
 */
export async function downloadViteGitHubPagesPwaZip(): Promise<void> {
  try {
    const response = await fetch('/api/download/github-pwa-zip');
    if (response.ok) {
      const blob = await response.blob();
      triggerBlobDownload(blob, '3D_Glass_Planner_Vite_GitHub_Pages_PWA.zip');
      return;
    }
  } catch (e) {
    console.warn('API zip download failed, trying static / fallback...', e);
  }

  // Static pre-built zip fallback
  try {
    const staticRes = await fetch('/3D_Glass_Planner_Vite_GitHub_Pages_PWA.zip');
    if (staticRes.ok) {
      const blob = await staticRes.blob();
      triggerBlobDownload(blob, '3D_Glass_Planner_Vite_GitHub_Pages_PWA.zip');
      return;
    }
  } catch (e) {}

  // Offline client-side JSZip fallback
  await downloadOfflineAppPackageZip();
}

/**
 * 5. Download Full Project Source Code (.ZIP)
 * Includes entire TypeScript codebase, components, configs, and server.ts
 */
export async function downloadSourceCodeZip(): Promise<void> {
  try {
    const response = await fetch('/api/download/source-code-zip');
    if (!response.ok) throw new Error('소스코드 압축 다운로드에 실패했습니다.');
    const blob = await response.blob();
    triggerBlobDownload(blob, '3D_Planner_Source_Code.zip');
  } catch (err) {
    console.error('Source code zip error:', err);
    throw err;
  }
}

/**
 * 6. Download Only Modified Files (.ZIP)
 * Contains the files modified in this iteration
 */
export async function downloadModifiedFilesZip(): Promise<void> {
  try {
    const response = await fetch('/api/download/modified-files-zip');
    if (!response.ok) throw new Error('변경된 파일 압축 다운로드에 실패했습니다.');
    const blob = await response.blob();
    triggerBlobDownload(blob, '3D_Planner_Modified_Files.zip');
  } catch (err) {
    console.error('Modified files zip error:', err);
    throw err;
  }
}

