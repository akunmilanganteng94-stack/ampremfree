import React, { useEffect, useRef } from 'react';

export const CyberBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Decorative floating terminal phrases
    const phrases = [
      'AZRYL',
      'AZRYL',
      'AZRYL',
      'SYSTEM ONLINE',
      'INITIALIZING...',
      'ACCESS GRANTED',
      'AZRYLPREM_CORE',
      'ENCRYPTED_PROXY',
      'STREAM_SYNC_OK'
    ];

    interface Particle {
      x: number;
      y: number;
      speedY: number;
      text: string;
      opacity: number;
      fontSize: number;
    }

    const particles: Particle[] = [];
    const count = Math.min(22, Math.floor(width / 60));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speedY: 0.25 + Math.random() * 0.45,
        text: phrases[Math.floor(Math.random() * phrases.length)],
        opacity: 0.04 + Math.random() * 0.08,
        fontSize: Math.floor(10 + Math.random() * 6)
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw floating decorative code particles
      for (const p of particles) {
        ctx.font = `${p.fontSize}px 'Fira Code', monospace`;
        ctx.fillStyle = `rgba(6, 182, 212, ${p.opacity})`;
        ctx.fillText(p.text, p.x, p.y);

        p.y += p.speedY;
        if (p.y > height + 30) {
          p.y = -20;
          p.x = Math.random() * width;
          p.text = phrases[Math.floor(Math.random() * phrases.length)];
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/10 blur-[130px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[140px]" />
      <div className="absolute top-[40%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-blue-600/5 blur-[120px]" />
      
      {/* Canvas for decorative text & grid */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />

      {/* Subtle scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none" />
    </div>
  );
};
