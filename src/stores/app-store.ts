import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'home' | 'content' | 'favorites' | 'admin' | 'admin-edit' | 'admin-users' | 'profile' | 'settings';

interface AppState {
  // Navigation / view
  view: ViewMode;
  setView: (view: ViewMode) => void;

  // Selected node for content viewing
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  favoriteNodeIdsByUser: Record<string, string[]>;
  toggleFavoriteNode: (nodeId: string) => void;
  isFavoriteNode: (nodeId: string) => boolean;
  getFavoriteNodeIds: () => string[];

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
    (set, get) => ({
      view: 'home',
      setView: (view) => set({ view }),

      selectedNodeId: null,
      setSelectedNodeId: (id) => set({ selectedNodeId: id, view: id ? 'content' : 'home' }),
      favoriteNodeIdsByUser: {},
      toggleFavoriteNode: (nodeId) =>
        set((state) => {
          const userId = state.user?.id;
          if (!userId) return state;

          const current = state.favoriteNodeIdsByUser[userId] || [];
          const next = current.includes(nodeId)
            ? current.filter((id) => id !== nodeId)
            : [...current, nodeId];

          return {
            favoriteNodeIdsByUser: {
              ...state.favoriteNodeIdsByUser,
              [userId]: next,
            },
          };
        }),
      isFavoriteNode: (nodeId) => {
        const userId = get().user?.id;
        if (!userId) return false;
        return (get().favoriteNodeIdsByUser[userId] || []).includes(nodeId);
      },
      getFavoriteNodeIds: () => {
        const userId = get().user?.id;
        if (!userId) return [];
        return get().favoriteNodeIdsByUser[userId] || [];
      },

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
      name: 'addcontent-storage',
      partialize: (state) => ({
        user: state.user,
        favoriteNodeIdsByUser: state.favoriteNodeIdsByUser,
      }),
    }
  )
);
