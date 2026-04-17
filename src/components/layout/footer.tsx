'use client';

import React from 'react';

const footerColumns = [
  {
    header: 'EXPLORAR',
    links: [
      { label: 'Inicio' },
      { label: 'Contenido' },
      { label: 'Categorías' },
      { label: 'Recientes' },
    ],
  },
  {
    header: 'SOPORTE',
    links: [
      { label: 'Centro de ayuda' },
      { label: 'Guías' },
      { label: 'FAQ' },
      { label: 'Contacto' },
    ],
  },
  {
    header: 'LEGAL',
    links: [
      { label: 'Privacidad' },
      { label: 'Términos de uso' },
      { label: 'Cookies' },
      { label: 'Accesibilidad' },
    ],
  },
  {
    header: 'CONTACTO',
    links: [
      { label: 'acascantem@netcom.com.pa' },
      { label: 'San José, Costa Rica' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto w-full bg-[#141413] text-white">
      <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-16">
        {/* Top Section */}
        <h2 className="mc-h2 mb-12 text-white max-w-[600px]">
          Siempre aquí cuando nos necesitas
        </h2>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">
          {footerColumns.map((col) => (
            <div key={col.header} className="flex flex-col gap-4">
              <h3 className="mc-footer-header text-[#696969]">
                {col.header}
              </h3>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href="#"
                      className="mc-footer-link text-white transition-opacity hover:opacity-75"
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
      <div className="border-t border-white/20">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-4 px-6 py-6 md:flex-row md:items-center md:px-16">
          <p className="mc-footer-link text-[var(--mc-slate)]">
            © {new Date().getFullYear()} Plataforma AddContent. Todos los derechos reservados.
          </p>

          {/* Country Selector Pill */}
          <div className="flex items-center gap-3 rounded-[999px] border border-white/40 bg-white/5 px-5 py-2">
            <span className="text-[14px] leading-none">🇨🇷</span>
            <span className="mc-footer-link text-white">Costa Rica</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
