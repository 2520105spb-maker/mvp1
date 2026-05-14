import { create } from "zustand";

export type InventoryViewState = {
  selectedWarehouseId?: string;
  search: string;
  setSelectedWarehouseId: (id?: string) => void;
  setSearch: (search: string) => void;
};

export const useInventoryStore = create<InventoryViewState>((set) => ({
  selectedWarehouseId: undefined,
  search: "",
  setSelectedWarehouseId: (selectedWarehouseId) => set({ selectedWarehouseId }),
  setSearch: (search) => set({ search }),
}));
