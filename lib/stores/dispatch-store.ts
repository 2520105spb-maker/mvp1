import { create } from "zustand";

export type DispatchViewState = {
  selectedQueueId?: string;
  showOnlyBreaches: boolean;
  setSelectedQueueId: (id?: string) => void;
  setShowOnlyBreaches: (showOnlyBreaches: boolean) => void;
};

export const useDispatchStore = create<DispatchViewState>((set) => ({
  selectedQueueId: undefined,
  showOnlyBreaches: false,
  setSelectedQueueId: (selectedQueueId) => set({ selectedQueueId }),
  setShowOnlyBreaches: (showOnlyBreaches) => set({ showOnlyBreaches }),
}));
