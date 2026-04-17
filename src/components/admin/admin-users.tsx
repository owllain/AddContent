'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, UserCog, User } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminUsersPanel() {
  const queryClient = useQueryClient();
  const currentUser = useAppStore((s) => s.user);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '', email: '', cedula: '', role: 'VIEWER', password: ''
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Error al cargar usuarios');
      return (await res.json()).users;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const isUpdating = !!editingUser;
      const res = await fetch('/api/users', {
        method: isUpdating ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: editingUser?.id })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(editingUser ? 'Usuario actualizado' : 'Usuario creado exitosamente');
      setIsModalOpen(false);
    },
    onError: (err: any) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado');
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-[var(--mc-slate)]">Acceso denegado. Se requieren permisos de administrador.</p>
      </div>
    );
  }

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', cedula: '', role: 'VIEWER', password: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setFormData({ name: u.name, email: u.email, cedula: u.cedula, role: u.role, password: '' });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.cedula || (!editingUser && !formData.password)) {
      toast.error('Nombre, email, cédula y contraseña (si es nuevo) son requeridos');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12 md:px-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="mc-h1 mb-2 text-[32px] md:text-[40px]">Gestión de Usuarios</h1>
          <p className="mc-body text-[16px] text-[var(--mc-slate)]">
            Crea cuentas y asigna niveles de acceso en AddContent.
          </p>
        </div>
        <button onClick={openCreateModal} className="mc-btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[var(--mc-dust-taupe)] bg-white shadow-sm">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-[var(--mc-canvas-lifted)] text-[12px] uppercase text-[var(--mc-slate)]">
            <tr>
              <th className="px-6 py-4 font-semibold">Nombre</th>
              <th className="px-6 py-4 font-semibold">Cédula</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Rol</th>
              <th className="px-6 py-4 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--mc-dust-taupe)]">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Cargando...</td></tr>
            ) : (
              users.map((u: any) => (
                <tr key={u.id} className="transition-colors hover:bg-[var(--mc-canvas)]">
                  <td className="px-6 py-4 font-medium text-[var(--mc-ink)]">{u.name}</td>
                  <td className="px-6 py-4 text-[var(--mc-slate)]">{u.cedula}</td>
                  <td className="px-6 py-4 text-[var(--mc-slate)]">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      u.role === 'ADMIN' ? 'bg-orange-100 text-orange-700' :
                      u.role === 'EDITOR' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {u.role === 'ADMIN' ? <UserCog size={12} /> : <User size={12} />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEditModal(u)} className="mr-3 text-blue-600 hover:opacity-70"><Edit2 size={16} /></button>
                    {u.id !== currentUser.id && (
                      <button onClick={() => confirm('¿Eliminar?') && deleteMutation.mutate(u.id)} className="text-red-500 hover:opacity-70"><Trash2 size={16} /></button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-[24px]">
          <DialogHeader><DialogTitle>{editingUser ? 'Editar Usuario' : 'Crear Usuario'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
            <input type="text" placeholder="Nombre completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-[12px] border px-4 py-2 outline-none" required />
            <input type="text" placeholder="Cédula" value={formData.cedula} onChange={e => setFormData({...formData, cedula: e.target.value})} className="w-full rounded-[12px] border px-4 py-2 outline-none" required />
            <input type="email" placeholder="Correo electrónico" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full rounded-[12px] border px-4 py-2 outline-none" required />
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full rounded-[12px] border px-4 py-2 outline-none bg-white">
              <option value="VIEWER">VIEWER (Solo lectura)</option>
              <option value="EDITOR">EDITOR (Gestiona contenido)</option>
              <option value="ADMIN">ADMIN (Acceso total)</option>
            </select>
            <input type="password" placeholder={editingUser ? "Nueva contraseña (opcional)" : "Contraseña *"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full rounded-[12px] border px-4 py-2 outline-none" {...(!editingUser ? {required: true} : {})} />
            <button type="submit" disabled={saveMutation.isPending} className="mc-btn-primary py-3">{saveMutation.isPending ? 'Guardando...' : 'Guardar'}</button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
