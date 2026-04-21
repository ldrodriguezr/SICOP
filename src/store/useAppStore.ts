import { create } from "zustand";
import type { UserProfile, Notificacion } from "@/types";

interface AppState {
  user: UserProfile | null;
  notificaciones: Notificacion[];
  notificacionesNoLeidas: number;
  sidebarOpen: boolean;

  setUser: (user: UserProfile | null) => void;
  setNotificaciones: (notifs: Notificacion[]) => void;
  marcarNotificacionLeida: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  notificaciones: [],
  notificacionesNoLeidas: 0,
  sidebarOpen: true,

  setUser: (user) => set({ user }),

  setNotificaciones: (notificaciones) =>
    set({
      notificaciones,
      notificacionesNoLeidas: notificaciones.filter((n) => !n.leida).length,
    }),

  marcarNotificacionLeida: (id) =>
    set((state) => ({
      notificaciones: state.notificaciones.map((n) =>
        n.id === id ? { ...n, leida: true } : n
      ),
      notificacionesNoLeidas: Math.max(0, state.notificacionesNoLeidas - 1),
    })),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
