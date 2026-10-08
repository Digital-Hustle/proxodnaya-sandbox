import { create } from "zustand";

/** Состояние демо-пульта киоска (только песочница). */
export const useKioskDemo = create<{ photoAttack: boolean; lastQr: string | null; setPhotoAttack: (v: boolean) => void; setLastQr: (v: string) => void }>((set) => ({
  photoAttack: false,
  lastQr: null,
  setPhotoAttack: (photoAttack) => set({ photoAttack }),
  setLastQr: (lastQr) => set({ lastQr }),
}));
