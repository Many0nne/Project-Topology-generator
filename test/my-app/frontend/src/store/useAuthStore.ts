import { create } from 'zustand';

type User = { id: string; email: string } | null;

type State = {
  accessToken: string | null;
  user: User;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<State>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (token, user) => set(() => ({ accessToken: token, user })),
  clearAuth: () => set(() => ({ accessToken: null, user: null }))
}));

export function getAccessToken() {
  return useAuthStore.getState().accessToken;
}

export function setAccessToken(token: string) {
  useAuthStore.getState().setAuth(token, useAuthStore.getState().user);
}

export function clearAuth() {
  useAuthStore.getState().clearAuth();
}

export default useAuthStore;
