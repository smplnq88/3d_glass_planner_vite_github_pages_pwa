import cubeIconUrl from './assets/images/icon_emerald_cube_1787735861781.jpg';
import originalIconUrl from './assets/images/planner_app_icon_1787464009265.jpg';
import lotusIconUrl from './assets/images/emerald_lotus_1781296475707.jpg';
import nebulaIconUrl from './assets/images/cosmic_nebula_1781296488591.jpg';
import auroraIconUrl from './assets/images/polar_aurora_1781296503161.jpg';

export const CUBE_ICON_DATA = cubeIconUrl;
export const ORIGINAL_ICON_DATA = originalIconUrl;
export const LOTUS_ICON_DATA = lotusIconUrl;
export const NEBULA_ICON_DATA = nebulaIconUrl;
export const AURORA_ICON_DATA = auroraIconUrl;

/**
 * Returns a safely resolved asset URL for both Vite dev, local preview, and GitHub Pages subpaths.
 */
export function getAssetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : './';
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${prefix}${cleanPath}`;
}

