'use client';

import React from 'react';
import { useAppStore } from '@/stores/app-store';

export default function HeroSection() {
  const { setView, setShowLoginModal } = useAppStore();

  const handleExplore = () => {
    setView('content');
  };

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  return (
    <section className="relative w-full overflow-hidden px-6 py-16 md:px-12 md:py-24 lg:py-32">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-12 md:flex-row md:items-center md:gap-8">
        {/* Left Side */}
        <div className="relative z-10 flex max-w-[580px] flex-col gap-6">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full bg-[var(--mc-signal-orange)]"
              aria-hidden="true"
            />
            <span className="mc-eyebrow">Centro de Conocimiento</span>
          </div>

          {/* H1 */}
          <h1 className="mc-h1">
            Información al alcance de todos
          </h1>

          {/* Body */}
          <div className="flex flex-col gap-4">
            <p className="mc-body text-[var(--mc-granite)]">
              Tu plataforma centralizada para acceder, gestionar y compartir el conocimiento
              de la organización. Todo en un solo lugar, diseñado para equipos modernos.
            </p>
            <p className="mc-body text-[var(--mc-granite)]">
              Explora documentos, artículos y recursos que mantienen a tu equipo informado
              y alineado con los objetivos del negocio.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button onClick={handleExplore} className="mc-btn-primary px-8 py-4 text-[16px]">
              Explorar contenido
            </button>
            <button onClick={handleLogin} className="mc-btn-secondary px-8 py-4 text-[16px]">
              Iniciar sesión
            </button>
          </div>
        </div>

        {/* Right Side — Decorative Elements */}
        <div className="relative flex flex-1 items-center justify-center py-12 md:py-0">
          {/* Ghost Watermark */}
          <div
            className="mc-ghost-watermark pointer-events-none absolute select-none md:top-[-10%] md:right-[-5%] lg:right-[-10%]"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            aria-hidden="true"
          >
            KNOWLEDGE
          </div>

          {/* Decorative Circles */}
          <div className="relative flex items-center justify-center">
            {/* Large circle - warm orange gradient */}
            <div
              className="absolute h-[180px] w-[180px] rounded-full md:h-[220px] md:w-[220px] lg:h-[260px] lg:w-[260px]"
              style={{
                background: 'linear-gradient(135deg, #F37338 0%, #CF4500 100%)',
                top: '-20px',
                right: '-30px',
                opacity: 0.85,
                boxShadow: '0px 16px 40px 0px rgba(207, 69, 0, 0.2)',
              }}
              aria-hidden="true"
            />

            {/* Medium circle - cream/peach */}
            <div
              className="absolute h-[140px] w-[140px] rounded-full md:h-[170px] md:w-[170px] lg:h-[200px] lg:w-[200px]"
              style={{
                background: 'linear-gradient(135deg, #F3F0EE 0%, #E8E2DA 100%)',
                bottom: '-10px',
                left: '-20px',
                opacity: 0.9,
                boxShadow: '0px 12px 32px 0px rgba(0, 0, 0, 0.06)',
              }}
              aria-hidden="true"
            />

            {/* Small circle - light signal orange */}
            <div
              className="absolute h-[90px] w-[90px] rounded-full md:h-[110px] md:w-[110px] lg:h-[130px] lg:w-[130px]"
              style={{
                background: 'linear-gradient(135deg, #F9C49C 0%, #F37338 100%)',
                top: '40%',
                left: '30%',
                opacity: 0.7,
                boxShadow: '0px 8px 24px 0px rgba(243, 115, 56, 0.15)',
              }}
              aria-hidden="true"
            />
          </div>

          {/* Bottom Arc Line */}
          <svg
            className="absolute bottom-0 left-0 w-full"
            viewBox="0 0 400 60"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M 0 60 Q 200 -20 400 60"
              stroke="var(--mc-light-signal-orange)"
              strokeWidth="2"
              fill="none"
              opacity="0.5"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
