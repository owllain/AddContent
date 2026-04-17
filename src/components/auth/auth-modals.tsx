'use client';

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAppStore } from '@/stores/app-store';

interface AuthResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token?: string;
}

const inputClassName =
  'w-full rounded-[999px] border border-black/50 bg-transparent px-6 py-3 text-[16px] font-[450] text-[var(--mc-ink)] outline-none placeholder:text-[var(--mc-slate)] focus:border-[var(--mc-ink)] transition-colors';

export default function AuthModals() {
  const {
    showLoginModal,
    setShowLoginModal,
    showRegisterModal,
    setShowRegisterModal,
    setUser,
  } = useAppStore();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regCedula, setRegCedula] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: loginEmail.trim(), password: loginPassword }),
      });

      const data: AuthResponse = await res.json();

      if (!data.success || !data.user || !data.token) {
        toast.error(data.error || 'Error al iniciar sesión');
        return;
      }

      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      toast.success(`¡Bienvenido, ${data.user.name}!`);
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoginLoading(false);
    }
  }, [loginEmail, loginPassword, setUser, setShowLoginModal]);

  const handleRegister = useCallback(async () => {
    if (!regName.trim() || !regCedula.trim() || !regEmail.trim() || !regPassword.trim()) {
      toast.error('Por favor, completa todos los campos (incluyendo la cédula)');
      return;
    }

    if (regPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: regName.trim(),
          cedula: regCedula.trim() || undefined,
          email: regEmail.trim(),
          password: regPassword,
        }),
      });

      const data: AuthResponse = await res.json();

      if (!data.success || !data.user || !data.token) {
        toast.error(data.error || 'Error al crear cuenta');
        return;
      }

      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      setShowRegisterModal(false);
      setRegName('');
      setRegCedula('');
      setRegEmail('');
      setRegPassword('');
      toast.success(`¡Cuenta creada! Bienvenido, ${data.user.name}`);
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.');
    } finally {
      setRegLoading(false);
    }
  }, [regName, regEmail, regPassword, setUser, setShowRegisterModal]);

  const switchToRegister = () => {
    setShowLoginModal(false);
    setTimeout(() => setShowRegisterModal(true), 150);
  };

  const switchToLogin = () => {
    setShowRegisterModal(false);
    setTimeout(() => setShowLoginModal(true), 150);
  };

  return (
    <>
      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={(open) => setShowLoginModal(open)}>
        <DialogContent
          className="w-full max-w-[440px] rounded-[40px] border-0 bg-white p-8 shadow-[var(--shadow-elevated)] sm:p-10"
          showCloseButton
        >
          <DialogHeader className="mb-2 text-center sm:text-center">
            <DialogTitle className="mc-h3 text-center">Iniciar sesión</DialogTitle>
            <DialogDescription className="mc-body mt-2 text-center text-[var(--mc-slate)]">
              Accede a tu cuenta para gestionar contenido
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex flex-col gap-4">
            <input
              type="text"
              placeholder="Correo electrónico o cédula"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className={inputClassName}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className={inputClassName}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />

            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="mc-btn-primary mt-2 w-full justify-center py-4 text-[16px] disabled:opacity-50"
            >
              {loginLoading ? (
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--mc-canvas)] border-t-transparent" />
              ) : (
                'Iniciar sesión'
              )}
            </button>

            <p className="mt-2 text-center text-[14px] font-[450] text-[var(--mc-slate)]">
              ¿No tienes cuenta?{' '}
              <button
                onClick={switchToRegister}
                className="font-medium text-[var(--mc-ink)] underline-offset-2 hover:underline"
              >
                Regístrate
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={showRegisterModal} onOpenChange={(open) => setShowRegisterModal(open)}>
        <DialogContent
          className="w-full max-w-[440px] rounded-[40px] border-0 bg-white p-8 shadow-[var(--shadow-elevated)] sm:p-10"
          showCloseButton
        >
          <DialogHeader className="mb-2 text-center sm:text-center">
            <DialogTitle className="mc-h3 text-center">Crear cuenta</DialogTitle>
            <DialogDescription className="mc-body mt-2 text-center text-[var(--mc-slate)]">
              Regístrate para acceder a la plataforma
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex flex-col gap-4">
            <input
              type="text"
              placeholder="Nombre completo"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              className={inputClassName}
            />
            <input
              type="text"
              placeholder="Cédula de Identidad *"
              value={regCedula}
              onChange={(e) => setRegCedula(e.target.value)}
              className={inputClassName}
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              className={inputClassName}
            />
            <input
              type="password"
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              className={inputClassName}
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
            />

            <button
              onClick={handleRegister}
              disabled={regLoading}
              className="mc-btn-primary mt-2 w-full justify-center py-4 text-[16px] disabled:opacity-50"
            >
              {regLoading ? (
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--mc-canvas)] border-t-transparent" />
              ) : (
                'Crear cuenta'
              )}
            </button>

            <p className="mt-2 text-center text-[14px] font-[450] text-[var(--mc-slate)]">
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={switchToLogin}
                className="font-medium text-[var(--mc-ink)] underline-offset-2 hover:underline"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
