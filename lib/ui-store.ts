import { create } from 'zustand';

interface UiState {
  paletteOpen: boolean;
  sidebarOpen: boolean; // mobile drawer
  shortcutsOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  paletteOpen: false,
  sidebarOpen: false,
  shortcutsOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
}));
