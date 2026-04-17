'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/app-store';

export default function ProfilePanel() {
  const currentUser = useAppStore((s) => s.user);
  const [password, setPassword] = useState('');

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al actualizar');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Perfil actualizado. La nueva contraseña está activa.');
      setPassword('');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim().length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    updateMutation.mutate({
      id: currentUser?.id,
      name: currentUser?.name,
      email: currentUser?.email,
      cedula: currentUser?.cedula,
      role: currentUser?.role,
      password: password
    });
  };

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-[800px] px-6 py-12 md:px-10">
      <h1 className="mc-h1 mb-8 text-[32px] md:text-[40px]">Mi Perfil</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <div className="rounded-[24px] border border-[var(--mc-dust-taupe)] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--mc-ink)] text-[24px] font-medium text-white">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-[20px] font-semibold text-[var(--mc-ink)]">{currentUser.name}</h2>
              <p className="text-[14px] text-[var(--mc-slate)]">{currentUser.role} de la plataforma</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-[14px]">
            <div className="flex justify-between border-b pb-2">
              <span className="text-[var(--mc-slate)]">Correo Electrónico:</span>
              <span className="font-medium text-[var(--mc-ink)]">{currentUser.email}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-[var(--mc-slate)]">Cédula de Identidad:</span>
              <span className="font-medium text-[var(--mc-ink)]">{currentUser.cedula || 'No registrada'}</span>
            </div>
            <div className="mt-4 rounded-xl bg-orange-50 p-4 text-[12px] text-orange-800">
              <p>Tu nombre y cédula están administrados por el equipo de Desarrollo. Si necesitas modificar estos datos centrales, contacta a <b>TI</b>.</p>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-[24px] border border-[var(--mc-dust-taupe)] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-[18px] font-semibold text-[var(--mc-ink)]">Ajustes de Seguridad</h3>
          <p className="mb-6 text-[13px] text-[var(--mc-slate)]">Protege tu acceso cambiando tu contraseña periódicamente.</p>

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-[13px] font-medium text-[var(--mc-slate)]">Nueva Contraseña</label>
              <input 
                type="password" 
                placeholder="Mínimo 6 caracteres" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-[12px] border border-[var(--mc-dust-taupe)] bg-[var(--mc-canvas-lifted)] px-4 py-2 text-[14px] outline-none"
              />
            </div>
            <button 
              type="submit" 
              disabled={updateMutation.isPending || password.length < 6}
              className="mt-2 w-full rounded-[12px] bg-[var(--mc-ink)] py-3 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
