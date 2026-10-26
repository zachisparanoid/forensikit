import { create } from 'zustand';
import {
  MAX_HISTORY_PER_TOOL,
  MAX_RECENTS,
  STORAGE_KEYS,
  readJSON,
  writeJSON,
} from './storage';

export type Theme = 'dark' | 'light';

interface AppState {
  favorites: string[];
  recents: { id: string; at: number }[];
  theme: Theme;
  toolHistory: Record<string, string[]>;
  historyEnabled: boolean;
  hydrated: boolean;

  hydrate: () => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  addRecent: (id: string) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  pushHistory: (toolId: string, input: string) => void;
  clearHistory: (toolId?: string) => void;
  setHistoryEnabled: (enabled: boolean) => void;
}

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  favorites: [],
  recents: [],
  theme: 'dark',
  toolHistory: {},
  historyEnabled: true,
  hydrated: false,

  hydrate: () => {
    const theme = readJSON<Theme>(STORAGE_KEYS.theme, 'dark');
    const favorites = readJSON<string[]>(STORAGE_KEYS.favorites, []);
    const recents = readJSON<{ id: string; at: number }[]>(
      STORAGE_KEYS.recents,
      [],
    );
    const toolHistory = readJSON<Record<string, string[]>>(
      STORAGE_KEYS.toolHistory,
      {},
    );
    const historyEnabled = readJSON<boolean>(STORAGE_KEYS.historyEnabled, true);
    applyTheme(theme);
    set({
      theme,
      favorites,
      recents,
      toolHistory,
      historyEnabled,
      hydrated: true,
    });
  },

  toggleFavorite: (id) => {
    const favorites = get().favorites.includes(id)
      ? get().favorites.filter((f) => f !== id)
      : [...get().favorites, id];
    writeJSON(STORAGE_KEYS.favorites, favorites);
    set({ favorites });
  },

  isFavorite: (id) => get().favorites.includes(id),

  addRecent: (id) => {
    const at = Date.now();
    const recents = [
      { id, at },
      ...get().recents.filter((r) => r.id !== id),
    ].slice(0, MAX_RECENTS);
    writeJSON(STORAGE_KEYS.recents, recents);
    set({ recents });
  },

  setTheme: (theme) => {
    applyTheme(theme);
    writeJSON(STORAGE_KEYS.theme, theme);
    set({ theme });
  },

  toggleTheme: () => {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark');
  },

  pushHistory: (toolId, input) => {
    if (!get().historyEnabled) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    const prev = get().toolHistory[toolId] ?? [];
    const next = [trimmed, ...prev.filter((x) => x !== trimmed)].slice(
      0,
      MAX_HISTORY_PER_TOOL,
    );
    const toolHistory = { ...get().toolHistory, [toolId]: next };
    writeJSON(STORAGE_KEYS.toolHistory, toolHistory);
    set({ toolHistory });
  },

  clearHistory: (toolId) => {
    if (toolId) {
      const toolHistory = { ...get().toolHistory };
      delete toolHistory[toolId];
      writeJSON(STORAGE_KEYS.toolHistory, toolHistory);
      set({ toolHistory });
    } else {
      writeJSON(STORAGE_KEYS.toolHistory, {});
      set({ toolHistory: {} });
    }
  },

  setHistoryEnabled: (enabled) => {
    writeJSON(STORAGE_KEYS.historyEnabled, enabled);
    if (!enabled) {
      writeJSON(STORAGE_KEYS.toolHistory, {});
      set({ historyEnabled: enabled, toolHistory: {} });
    } else {
      set({ historyEnabled: enabled });
    }
  },
}));
