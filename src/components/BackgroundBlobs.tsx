/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

interface BackgroundBlobsProps {
  theme?: 'light' | 'dark';
  isAbsolute?: boolean;
}

export default function BackgroundBlobs({ theme = 'light', isAbsolute = false }: BackgroundBlobsProps) {
  const isDark = theme === 'dark';

  return (
    <div className={`${isAbsolute ? 'absolute' : 'fixed'} inset-0 -z-10 overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#18100b]' : 'bg-[#f4f7fb]'}`}>
      {/* Dynamic colorful space-mesh background */}
      <div 
        className={`absolute inset-0 transition-all duration-500 ${
          isDark 
            ? 'bg-[radial-gradient(ellipse_at_top_left,_#2c1f17,_#1a110a,_#100a06)]' 
            : 'bg-[radial-gradient(ellipse_at_top_left,_#eef2ff,_#fcf5f9,_#ecfdf5)]'
        }`} 
        id="bg-gradient"
      />
      
      {/* Secondary vibrant gradient overlay for warm color fusion */}
      <div 
        className={`absolute inset-0 transition-all duration-500 ${
          isDark
            ? 'bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.05),transparent_50%),radial-gradient(circle_at_20%_80%,rgba(251,146,60,0.05),transparent_50%)]'
            : 'bg-[radial-gradient(circle_at_80%_20%,rgba(244,63,94,0.04),transparent_50%),radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.04),transparent_50%)]'
        }`}
        id="bg-secondary-overlay"
      />

      {/* Grid Overlay with perspective */}
      <div 
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: isDark
            ? `
              linear-gradient(to right, rgba(255,255,255,0.015) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.015) 1px, transparent 1px)
            `
            : `
              linear-gradient(to right, rgba(15,23,42,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(15,23,42,0.03) 1px, transparent 1px)
            `,
          backgroundSize: '50px 50px',
        }}
        id="bg-grid"
      />

      {/* Soft neon vibrant ambient lights with glassmorphic float */}
      {/* Sphere 1: Dreamy Rose/Violet Pastel */}
      <motion.div
        className={`absolute h-[420px] w-[420px] rounded-full blur-[60px] sm:blur-[80px] transition-all duration-500 pointer-events-none ${
          isDark 
            ? 'bg-gradient-to-tr from-amber-900/20 to-amber-950/15' 
            : 'bg-gradient-to-tr from-violet-350/45 via-purple-300/40 to-indigo-300/35'
        }`}
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -80, 60, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ top: '2%', left: '8%' }}
        id="ambient-blob-1"
      />

      {/* Sphere 2: Soft mint / turquoise pastel */}
      <motion.div
        className={`absolute h-[380px] w-[380px] rounded-full blur-[70px] sm:blur-[90px] transition-all duration-500 pointer-events-none ${
          isDark 
            ? 'bg-gradient-to-br from-orange-950/20 to-amber-950/15' 
            : 'bg-gradient-to-br from-teal-300/45 via-cyan-300/40 to-sky-300/35'
        }`}
        animate={{
          x: [0, -100, 50, 0],
          y: [0, 60, -70, 0],
          scale: [1, 0.88, 1.15, 1],
        }}
        transition={{
          duration: 27,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ bottom: '8%', right: '3%' }}
        id="ambient-blob-2"
      />

      {/* Sphere 3: Soft cherry blossom/Fuchsia pastel */}
      <motion.div
        className={`absolute h-[340px] w-[340px] rounded-full blur-[55px] sm:blur-[75px] transition-all duration-500 pointer-events-none ${
          isDark 
            ? 'bg-gradient-to-tr from-rose-950/20 via-amber-950/10 to-transparent' 
            : 'bg-gradient-to-tr from-rose-300/50 via-pink-300/45 to-fuchsia-300/40'
        }`}
        animate={{
          x: [0, 60, -80, 0],
          y: [0, 100, -100, 0],
          scale: [1, 1.12, 0.88, 1],
        }}
        transition={{
          duration: 19,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ top: '30%', right: '15%' }}
        id="ambient-blob-3"
      />

      {/* Sphere 4: Soft warm peach / sunburst yellow */}
      <motion.div
        className={`absolute h-[360px] w-[360px] rounded-full blur-[65px] sm:blur-[85px] transition-all duration-500 pointer-events-none ${
          isDark 
            ? 'bg-gradient-to-br from-amber-950/25 to-orange-950/15' 
            : 'bg-gradient-to-br from-amber-300/45 via-orange-300/40 to-rose-300/35'
        }`}
        animate={{
          x: [0, -120, 70, 0],
          y: [0, -70, 120, 0],
          scale: [0.95, 1.15, 0.95, 0.95],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ bottom: '15%', left: '5%' }}
        id="ambient-blob-4"
      />
    </div>
  );
}
