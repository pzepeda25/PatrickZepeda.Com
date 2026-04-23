'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

// --- Helper function to generate ASCII-like code ---
const ASCII_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789(){}[]<>;:,._-+=!@#$%^&*|\\/\"'`~?";
/** Horizontal position of the scan line (0–1). Left of center reveals the title card longer as cards scroll. */
const SCANNER_X_RATIO = 0.30;

/** Matches the stream section height (`h-[400px]`). Particles use full vertical band. */
const STREAM_SECTION_HEIGHT = 400;

const generateCode = (width: number, height: number): string => {
  let text = "";
  for (let i = 0; i < width * height; i++) {
    text += ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
  }
  let out = "";
  for (let i = 0; i < height; i++) {
    out += text.substring(i * width, (i + 1) * width) + "\n";
  }
  return out;
};

export type CardData = {
  title: string;
  link: string;
  image: string;
  date: string;
};

type ScannerCardStreamProps = {
  initialSpeed?: number;
  direction?: -1 | 1;
  cardsData: CardData[];
  repeat?: number;
  cardGap?: number;
  friction?: number;
  scanEffect?: 'clip' | 'scramble';
};

export const ScannerCardStream = ({
  initialSpeed = 100,
  direction = -1,
  cardsData,
  repeat = 6,
  cardGap = 60,
  friction = 0.95,
  scanEffect = 'scramble',
}: ScannerCardStreamProps) => {

  // ⚡ Bolt: Removed unused `speed` state to prevent 60 unnecessary re-renders per second
  const [isPaused, setIsPaused] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cardWidth, setCardWidth] = useState(400);

  useEffect(() => {
    const updateWidth = () => {
      setCardWidth(window.innerWidth < 768 ? 280 : 400);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  const cards = useMemo(() => {
    const totalCards = Math.max(cardsData.length * repeat, 10); // ensure enough cards to scroll
    return Array.from({ length: totalCards }, (_, i) => ({
      id: i,
      ...cardsData[i % cardsData.length],
      ascii: generateCode(Math.floor(cardWidth / 6.5), Math.floor(288 / 13)),
    }))
  }, [cardsData, repeat, cardWidth]);

  const cardLineRef = useRef<HTMLDivElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const scannerCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalAscii = useRef(new Map<number, string>());

  const cardStreamState = useRef({
    position: 0, 
    currentVelocity: initialSpeed * direction, 
    isDragging: false,
    lastMouseX: 0, 
    lastTime: performance.now(), 
    cardLineWidth: (cardWidth + cardGap) * cards.length,
    dragVelocity: 0,
    totalDragDistance: 0,
  });

  useEffect(() => {
    cardStreamState.current.cardLineWidth = (cardWidth + cardGap) * cards.length;
  }, [cardWidth, cardGap, cards.length]);

  const scannerState = useRef({ isScanning: false });

  useEffect(() => {
    const cardLine = cardLineRef.current;
    const particleCanvas = particleCanvasRef.current;
    const scannerCanvas = scannerCanvasRef.current;

    if (!cardLine || !particleCanvas || !scannerCanvas) return;
    
    cards.forEach(card => originalAscii.current.set(card.id, card.ascii));
    let animationFrameId: number;

    const scene = new THREE.Scene();
    const halfH = STREAM_SECTION_HEIGHT / 2;
    const camera = new THREE.OrthographicCamera(-window.innerWidth / 2, window.innerWidth / 2, halfH, -halfH, 1, 1000);
    camera.position.z = 100;
    const renderer = new THREE.WebGLRenderer({ canvas: particleCanvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, STREAM_SECTION_HEIGHT);
    renderer.setClearColor(0x000000, 0);
    const particleCount = 400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);
    const alphas = new Float32Array(particleCount);
    const texCanvas = document.createElement("canvas");
    texCanvas.width = 100; texCanvas.height = 100;
    const texCtx = texCanvas.getContext("2d")!;
    const half = 50;
    const gradient = texCtx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0.025, "#fff");
    gradient.addColorStop(0.1, `hsl(217, 61%, 33%)`);
    gradient.addColorStop(0.25, `hsl(217, 64%, 6%)`);
    gradient.addColorStop(1, "transparent");
    texCtx.fillStyle = gradient;
    texCtx.arc(half, half, half, 0, Math.PI * 2);
    texCtx.fill();
    const texture = new THREE.CanvasTexture(texCanvas);
    // Keep WebGL pixel-store flags compatible with any internal 3D texture uploads.
    // three.js leaves UNPACK_FLIP_Y / UNPACK_PREMULTIPLY_ALPHA as last-set, and WebGL forbids these for texImage3D.
    texture.flipY = false;
    texture.premultiplyAlpha = false;
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * window.innerWidth * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * STREAM_SECTION_HEIGHT;
        velocities[i] = Math.random() * 60 + 30;
        alphas[i] = (Math.random() * 8 + 2) / 10;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: { pointTexture: { value: texture } },
      vertexShader: `attribute float alpha; varying float vAlpha; void main() { vAlpha = alpha; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_PointSize = 15.0; gl_Position = projectionMatrix * mvPosition; }`,
      fragmentShader: `uniform sampler2D pointTexture; varying float vAlpha; void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha) * texture2D(pointTexture, gl_PointCoord); }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, vertexColors: false,
    });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    const ctx = scannerCanvas.getContext('2d')!;
    
    const resizeCanvas = () => {
      scannerCanvas.width = window.innerWidth;
      scannerCanvas.height = STREAM_SECTION_HEIGHT;
      renderer.setSize(window.innerWidth, STREAM_SECTION_HEIGHT);
      camera.left = -window.innerWidth / 2;
      camera.right = window.innerWidth / 2;
      camera.top = STREAM_SECTION_HEIGHT / 2;
      camera.bottom = -STREAM_SECTION_HEIGHT / 2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let scannerParticles: any[] = [];
    const baseMaxParticles = 800;
    let currentMaxParticles = baseMaxParticles;
    const scanTargetMaxParticles = 2500;
    /** Full-height sparkle band (still drawn below cards via z-index). */
    const createScannerParticle = () => ({
      x: window.innerWidth * SCANNER_X_RATIO + (Math.random() - 0.5) * 3,
      y: Math.random() * STREAM_SECTION_HEIGHT,
      vx: Math.random() * 0.8 + 0.2,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 0.6 + 0.4,
      alpha: Math.random() * 0.4 + 0.6,
      life: 1.0,
      decay: Math.random() * 0.02 + 0.005,
    });
    for (let i = 0; i < baseMaxParticles; i++) scannerParticles.push(createScannerParticle());
    
    const runScrambleEffect = (element: HTMLElement, cardId: number) => {
        if (element.dataset.scrambling === 'true') return;
        element.dataset.scrambling = 'true';
        const originalText = originalAscii.current.get(cardId) || '';
        let scrambleCount = 0;
        const maxScrambles = 10;
        const interval = setInterval(() => {
            element.textContent = generateCode(Math.floor(cardWidth / 6.5), Math.floor(288 / 13));
            scrambleCount++;
            if (scrambleCount >= maxScrambles) {
                clearInterval(interval);
                element.textContent = originalText;
                delete element.dataset.scrambling;
            }
        }, 30);
    };

    const updateCardEffects = () => {
      const scannerX = window.innerWidth * SCANNER_X_RATIO;
      const scannerWidth = 8;
      const scannerLeft = scannerX - scannerWidth / 2;
      const scannerRight = scannerX + scannerWidth / 2;
      let anyCardIsScanning = false;
      cardLine.querySelectorAll(".card-wrapper").forEach((wrapper, index) => {
        const wrapperEl = wrapper as HTMLElement;
        const rect = wrapperEl.getBoundingClientRect();
        const asciiCard = wrapperEl.querySelector(".card-ascii") as HTMLElement;
        const asciiContent = asciiCard.querySelector('pre') as HTMLElement;
        
        if (rect.left < scannerRight && rect.right > scannerLeft) {
          anyCardIsScanning = true;
          if (scanEffect === 'scramble' && wrapper.dataset.scanned !== 'true') {
              runScrambleEffect(asciiContent, index);
          }
          wrapper.dataset.scanned = 'true';
          const clipRightPx = Math.max(rect.right - scannerX, 0);
          asciiCard.style.setProperty("--clip-right", `${(clipRightPx / rect.width) * 100}%`);
        } else {
          delete wrapper.dataset.scanned;
          if (rect.right < scannerLeft) {
            asciiCard.style.setProperty("--clip-right", "0%");
          } else {
            asciiCard.style.setProperty("--clip-right", "100%");
          }
        }
      });
      setIsScanning(anyCardIsScanning);
      scannerState.current.isScanning = anyCardIsScanning;
    };
    
    const handleMouseDown = (e: MouseEvent | TouchEvent) => { 
      cardStreamState.current.isDragging = true;
      cardStreamState.current.lastMouseX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      cardStreamState.current.dragVelocity = 0;
      cardStreamState.current.currentVelocity = 0;
      cardStreamState.current.totalDragDistance = 0;
    };
    const handleMouseMove = (e: MouseEvent | TouchEvent) => { 
      if (!cardStreamState.current.isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - cardStreamState.current.lastMouseX;
      cardStreamState.current.position += deltaX;
      cardStreamState.current.lastMouseX = clientX;
      cardStreamState.current.dragVelocity = deltaX;
      cardStreamState.current.totalDragDistance += Math.abs(deltaX);
    };
    const handleMouseUp = () => { 
      cardStreamState.current.isDragging = false; 
      if (Math.abs(cardStreamState.current.dragVelocity) > 0) {
        cardStreamState.current.currentVelocity = cardStreamState.current.dragVelocity * 60;
      }
    };
    const handleWheel = (e: WheelEvent) => { 
      cardStreamState.current.position -= e.deltaY * 0.5;
    };
    
    cardLine.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    cardLine.addEventListener("touchstart", handleMouseDown, { passive: true });
    window.addEventListener("touchmove", handleMouseMove, { passive: true });
    window.addEventListener("touchend", handleMouseUp);
    cardLine.addEventListener("wheel", handleWheel, { passive: true });

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - cardStreamState.current.lastTime) / 1000;
      cardStreamState.current.lastTime = currentTime;
      
      const targetVelocity = initialSpeed * direction;

      if (!isPaused && !cardStreamState.current.isDragging) {
        // Smoothly interpolate currentVelocity towards targetVelocity
        cardStreamState.current.currentVelocity += (targetVelocity - cardStreamState.current.currentVelocity) * (1 - friction);
        
        cardStreamState.current.position += cardStreamState.current.currentVelocity * deltaTime;
        // ⚡ Bolt: Removed setSpeed call from animation loop to eliminate React render thrashing
      }
      
      const { position, cardLineWidth } = cardStreamState.current;
      
      // Infinite scroll logic
      if (position < -cardLineWidth / 2) {
         cardStreamState.current.position += cardLineWidth / 2;
      } else if (position > 0) {
         cardStreamState.current.position -= cardLineWidth / 2;
      }
      
      cardLine.style.transform = `translateX(${cardStreamState.current.position}px)`;
      updateCardEffects();
      
      const time = currentTime * 0.001;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i] * 0.016;
        if (positions[i * 3] > window.innerWidth / 2 + 100) positions[i * 3] = -window.innerWidth / 2 - 100;
        positions[i * 3 + 1] += Math.sin(time + i * 0.1) * 0.5;
        alphas[i] = Math.max(0.1, Math.min(1, alphas[i] + (Math.random() - 0.5) * 0.05));
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.alpha.needsUpdate = true;
      renderer.render(scene, camera);
      
      ctx.clearRect(0, 0, window.innerWidth, STREAM_SECTION_HEIGHT);
      const targetCount = scannerState.current.isScanning ? scanTargetMaxParticles : baseMaxParticles;
      currentMaxParticles += (targetCount - currentMaxParticles) * 0.05;
      while (scannerParticles.length < currentMaxParticles) scannerParticles.push(createScannerParticle());
      while (scannerParticles.length > currentMaxParticles) scannerParticles.pop();
      scannerParticles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        if (p.life <= 0 || p.x > window.innerWidth || p.y > STREAM_SECTION_HEIGHT + 15 || p.y < -15) {
          Object.assign(p, createScannerParticle());
        }
        ctx.globalAlpha = p.alpha * p.life; ctx.fillStyle = "white";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    cardStreamState.current.lastTime = performance.now();
    animationFrameId = requestAnimationFrame(animate);
    
    return () => { 
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      cardLine.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      cardLine.removeEventListener("touchstart", handleMouseDown);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
      cardLine.removeEventListener("wheel", handleWheel);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };
  }, [isPaused, cards, cardGap, friction, scanEffect]);

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center overflow-hidden"
         onMouseEnter={() => setIsPaused(true)}
         onMouseLeave={() => setIsPaused(false)}>
      <style>{`
        @keyframes glitch { 0%, 16%, 50%, 100% { opacity: 1; } 15%, 99% { opacity: 0.9; } 49% { opacity: 0.8; } }
        .animate-glitch { animation: glitch 0.1s infinite linear alternate-reverse; }
        @keyframes scanPulse {
          0% { opacity: 0.85; transform: translate(-50%, -50%) scaleY(1); }
          100% { opacity: 1; transform: translate(-50%, -50%) scaleY(1.02); }
        }
        .animate-scan-pulse {
          animation: scanPulse 1.5s infinite alternate ease-in-out;
        }
      `}</style>
      
      <canvas ref={particleCanvasRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none" />
      {/* Below cards (z-15) so white scan sparkles are not painted over the Medium card UI */}
      <canvas ref={scannerCanvasRef} className="absolute inset-0 w-full h-full z-[5] pointer-events-none" />
      
      <div
        className={`
          scanner-line absolute top-1/2 h-[288px] w-px 
          bg-gradient-to-b from-transparent via-synth-cyan/85 to-transparent rounded-full
          transition-opacity duration-300 z-20 pointer-events-none animate-scan-pulse
          ${isScanning ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          left: `${SCANNER_X_RATIO * 100}%`,
          // Glow only to the left of the beam — avoids blowing out the decrypted image/title on the right
          boxShadow: '-6px 0 14px rgba(0,255,255,0.45), -14px 0 28px rgba(0,255,255,0.18)',
        }}
      />

      <div className="absolute inset-x-0 h-[288px] flex items-center justify-center z-[15] min-w-0">
        <div ref={cardLineRef} className="flex items-center whitespace-nowrap select-none will-change-transform" style={{ gap: `${cardGap}px`, width: 'max-content', touchAction: 'pan-y' }}>
          {cards.map((card, idx) => (
            <div key={`${card.id}-${idx}`} className="card-wrapper relative h-[288px] shrink-0" style={{ width: `${cardWidth}px` }}>
              {/* Normal Card (Bottom Layer) */}
              <a 
                href={card.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (cardStreamState.current.totalDragDistance > 5) {
                    e.preventDefault();
                  }
                }}
                className="card-normal card absolute top-0 left-0 w-full h-full rounded-[15px] overflow-hidden bg-synth-dark border border-synth-cyan/30 shadow-[0_15px_40px_rgba(0,0,0,0.4)] z-[1] flex flex-col hover:border-synth-cyan transition-colors group block"
              >
                <div className="h-[200px] w-full overflow-hidden relative border-b border-synth-cyan/30">
                  <div className="absolute inset-0 bg-synth-purple/40 mix-blend-overlay z-10 group-hover:bg-transparent transition-colors duration-500"></div>
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                </div>
                <div className="p-4 flex flex-col flex-1 justify-between bg-black/50 whitespace-normal">
                  <h3 className="text-white font-bold text-sm line-clamp-2 font-sans group-hover:text-synth-cyan transition-colors leading-snug">{card.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400 text-xs font-mono">{card.date}</span>
                    <span className="text-synth-magenta text-xs font-mono group-hover:text-white transition-colors">READ &gt;</span>
                  </div>
                </div>
              </a>
              
              {/* ASCII Card (Top Layer, gets clipped away) */}
              <div className="card-ascii card absolute top-0 left-0 w-full h-full rounded-[15px] overflow-hidden bg-black z-[2] [clip-path:inset(0_var(--clip-right,0%)_0_0)] pointer-events-none border border-synth-magenta/30">
                <pre className="ascii-content absolute top-0 left-0 w-full h-full text-synth-magenta font-mono text-[11px] leading-[13px] overflow-hidden whitespace-pre m-0 p-4 text-left align-top box-border animate-glitch">
                  {card.ascii}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
