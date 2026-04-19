'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

export default function FloatingNav() {
  const {
    view,
    setView,
    user,
    setUser,
    setShowLoginModal,
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useAppStore();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isEditor = user && (user.role === 'ADMIN' || user.role === 'EDITOR');
  const isAdmin = user && user.role === 'ADMIN';

  const handleNavClick = (
    targetView:
      | 'home'
      | 'content'
      | 'favorites'
      | 'admin'
      | 'admin-users'
      | 'profile'
      | 'settings'
      | 'nodes-management' // NUEVA VISTA
  ) => {
    setView(targetView);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setMobileMenuOpen(false);
  };

  type NavLinkType = {
    label: string;
    target:
      | 'home'
      | 'content'
      | 'favorites'
      | 'admin'
      | 'admin-users'
      | 'profile'
      | 'settings'
      | 'nodes-management';
    active: boolean;
    disabled?: boolean;
  };

  const navLinks: NavLinkType[] = [
    { label: 'Inicio', target: 'home', active: view === 'home' },
    { label: 'Contenido', target: 'content', active: view === 'content' },
    ...(user ? [{ label: 'Favoritos', target: 'favorites' as const, active: view === 'favorites' }] : []),
    ...(isEditor ? [{ label: 'Administrar', target: 'admin' as const, active: view === 'admin' || view === 'admin-edit' }] : []),
    // Nueva opción para gestión de nuevos nodos (Maquetador)
    ...(isEditor ? [{ label: 'Maquetador', target: 'nodes-management' as const, active: view === 'nodes-management' }] : []),
    ...(isAdmin ? [{ label: 'Usuarios', target: 'admin-users' as const, active: view === 'admin-users' }] : []),
  ];

  return (
    <>
      <nav
        className={`sticky top-6 z-50 mx-auto w-full max-w-[1100px] px-4 transition-all duration-300 md:px-6 ${
          scrolled ? 'translate-y-0' : ''
        }`}
      >
        <div className="flex items-center justify-between rounded-[999px] bg-white px-5 py-3 shadow-[0px_4px_24px_0px_rgba(0,0,0,0.04)] md:px-10 md:py-4">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
            aria-label="Inicio"
          >
            <span className="text-[18px] font-bold tracking-tight text-[var(--mc-ink)]">
              AddContent
            </span>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => !link.disabled && handleNavClick(link.target)}
                disabled={link.disabled}
                className={`mc-nav-link transition-opacity ${
                  link.active
                    ? 'text-decoration-underline underline-offset-4 opacity-100'
                    : link.disabled
                      ? 'cursor-not-allowed opacity-35'
                      : 'hover:opacity-70'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop User Area */}
          <div className="hidden items-center gap-4 md:flex">
            {!user ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center gap-2 rounded-[999px] bg-[var(--mc-ink)] px-5 py-2 text-[14px] font-medium tracking-[-0.48px] text-[var(--mc-canvas)] transition-transform active:scale-97"
              >
                Iniciar sesión
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNavClick('profile')}
                  className="flex items-center gap-3 w-full text-left transition-opacity hover:opacity-75"
                  title="Mi Perfil"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--mc-ink)] text-[14px] font-medium text-[var(--mc-canvas)]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="mc-body hidden max-w-[140px] truncate text-[14px] lg:block">
                    {user.name}
                  </span>
                </button>
                <div className="h-4 w-px bg-[var(--mc-dust-taupe)] mx-2 hidden md:block" />
                <button
                  onClick={handleLogout}
                  className="text-[14px] font-medium tracking-[-0.48px] text-[var(--mc-slate)] transition-opacity hover:opacity-70"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>

          {/* Mobile: Hamburger + Avatar */}
          <div className="flex items-center gap-3 md:hidden">
            {user && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mc-ink)] text-[12px] font-medium text-[var(--mc-canvas)]">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Full-screen Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-white pt-24 md:hidden">
          <div className="flex flex-col gap-6 px-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => !link.disabled && handleNavClick(link.target)}
                disabled={link.disabled}
                className={`mc-nav-link text-left text-[22px] tracking-[-0.48px] transition-opacity ${
                  link.active
                    ? 'text-decoration-underline underline-offset-4 opacity-100'
                    : link.disabled
                      ? 'cursor-not-allowed opacity-35'
                      : 'hover:opacity-70'
                }`}
              >
                {link.label}
              </button>
            ))}

            <div className="mt-6 border-t border-black/10 pt-6">
              {!user ? (
                <button
                  onClick={() => {
                    setShowLoginModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-[999px] bg-[var(--mc-ink)] px-8 py-3 text-[16px] font-medium tracking-[-0.48px] text-[var(--mc-canvas)]"
                >
                  Iniciar sesión
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mc-ink)] text-[14px] font-medium text-[var(--mc-canvas)]">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="mc-body">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-[16px] font-medium tracking-[-0.48px] text-[var(--mc-slate)] transition-opacity hover:opacity-70"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
