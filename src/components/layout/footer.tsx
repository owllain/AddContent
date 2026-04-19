'use client';

import React from 'react';

const footerColumns = [
  {
    header: 'EXPLORAR',
    links: [
      { label: 'Inicio' },
      { label: 'Favoritos' },
    ],
  },
  {
    header: 'SOPORTE',
    links: [
      { label: 'Guías' },
      { label: 'FAQ' },
    ],
  },
  {
    header: 'LEGAL',
    links: [
      { label: 'Términos de Servicio' },
      { label: 'Accesibilidad' },
    ],
  },
  {
    header: 'CONTACTO',
    links: [
      { label: 'acascantem@netcom.com.pa' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto w-full bg-[#141413] text-white">
      <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-16">
        {/* Simplified Grid */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-8">
          {footerColumns.map((col) => (
            <div key={col.header} className="flex flex-col gap-3">
              <h3 className="mc-footer-header text-[#696969] text-[11px] tracking-widest">
                {col.header}
              </h3>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href="#"
                      className="mc-footer-link text-[13px] text-white/80 transition-opacity hover:opacity-100"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-4 px-6 py-6 md:flex-row md:items-center md:px-16">
          <p className="mc-footer-link text-[12px] text-[#696969]">
            © {new Date().getFullYear()} AddContent.
          </p>

          {/* Country Selector Pill */}
          <div className="flex items-center gap-3 rounded-[999px] border border-white/10 bg-white/5 px-4 py-1.5 opacity-60">
            <span className="text-[14px] leading-none">🇨🇷</span>
            <span className="text-[12px] text-white">Costa Rica</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
