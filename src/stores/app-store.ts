import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'home' | 'content' | 'admin' | 'admin-edit' | 'admin-users' | 'profile' | 'settings';

interface AppState {
  // Navigation / view
  view: ViewMode;
  setView: (view: ViewMode) => void;

  // Selected node for content viewing
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // Auth state
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    cedula?: string | null;
  } | null;
  setUser: (user: AppState['user']) => void;

  // Auth modals
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showRegisterModal: boolean;
  setShowRegisterModal: (show: boolean) => void;

  // Mobile nav
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Admin edit node
  editingNodeId: string | null;
  setEditingNodeId: (id: string | null) => void;
  editingParentId: string | null;
  setEditingParentId: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      view: 'home',
      setView: (view) => set({ view }),

      selectedNodeId: null,
      setSelectedNodeId: (id) => set({ selectedNodeId: id, view: id ? 'content' : 'home' }),

      user: null,
      setUser: (user) => set({ user }),

      showLoginModal: false,
      setShowLoginModal: (show) => set({ showLoginModal: show, showRegisterModal: false }),
      showRegisterModal: false,
      setShowRegisterModal: (show) => set({ showRegisterModal: show, showLoginModal: false }),

      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

      editingNodeId: null,
      setEditingNodeId: (id) => set({ editingNodeId: id }),
      editingParentId: null,
      setEditingParentId: (id) => set({ editingParentId: id }),
    }),
    {
      name: 'intranet-cms-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
