/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { ConfettiParticle } from '../types';

interface ConfettiEffectProps {
  particles: ConfettiParticle[];
  onComplete: () => void;
}

export default function ConfettiEffect({ particles, onComplete }: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);

  // Sync props to ref to avoid restarting animation loop unnecessarily
  useEffect(() => {
    if (particles.length > 0) {
      // Append new particles to the existing animation pool
      particlesRef.current = [...particlesRef.current, ...particles];
    }
  }, [particles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to cover window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const updateAndDraw = () => {
      if (particlesRef.current.length === 0) {
        onComplete();
        animationRef.current = requestAnimationFrame(updateAndDraw);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Mutate and filter out dead particles
      particlesRef.current = particlesRef.current.filter((p) => {
        // Apply physics
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed + 0.3; // gravity
        p.speed *= 0.95; // friction
        p.spin += 0.15; // rotation speed
        p.size *= 0.98; // fade out scale

        // Color and drawing
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.fillStyle = p.color;
        
        // Render 3D ribbon by altering drawing aspect ratio on spin
        const spinScaleX = Math.cos(p.spin);
        const width = p.size * 2 * spinScaleX;
        const height = p.size * 0.8;

        ctx.beginPath();
        // 3D Shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 4;

        if (p.id.charCodeAt(0) % 3 === 0) {
          // Circular sparkles
          ctx.arc(0, 0, Math.max(0, p.size / 2), 0, Math.PI * 2);
        } else if (p.id.charCodeAt(0) % 3 === 1) {
          // Sharp stars / diamonds
          ctx.moveTo(0, -p.size);
          ctx.lineTo(width / 2, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-width / 2, 0);
          ctx.closePath();
        } else {
          // Rectangle ribbons
          ctx.rect(-width / 2, -height / 2, Math.max(0.1, width), height);
        }
        
        ctx.fill();
        ctx.restore();

        // Keep inside bounds & check size limit
        return p.y < canvas.height && p.size > 0.6;
      });

      animationRef.current = requestAnimationFrame(updateAndDraw);
    };

    animationRef.current = requestAnimationFrame(updateAndDraw);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      id="confetti-canvas"
    />
  );
}
