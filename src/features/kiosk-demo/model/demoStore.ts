import { create } from "zustand";

/** Состояние демо-пульта киоска (только песочница). */
export const useKioskDemo = create<{
  photoAttack: boolean; lastQr: string | null;
  /** Режим «Сначала лицо»: кто стоит перед камерой (биометрии в песочнице нет). null — незнакомый человек. */
  faceWorkerId: string | null;
  setPhotoAttack: (v: boolean) => void; setLastQr: (v: string) => void; setFaceWorker: (v: string | null) => void;
}>((set) => ({
  photoAttack: false,
  lastQr: null,
  faceWorkerId: "w_01",
  setPhotoAttack: (photoAttack) => set({ photoAttack }),
  setLastQr: (lastQr) => set({ lastQr }),
  setFaceWorker: (faceWorkerId) => set({ faceWorkerId }),
}));
