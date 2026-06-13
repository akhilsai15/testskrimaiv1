import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  setAuthenticated: (val: boolean) => void;
  setOnboarded: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isOnboarded: false, 
  setAuthenticated: (val) => set({ isAuthenticated: val }),
  setOnboarded: (val) => set({ isOnboarded: val }),
}));
