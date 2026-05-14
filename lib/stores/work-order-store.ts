import { create } from "zustand";

export type WorkOrderViewState = {
  selectedWorkOrderId?: string;
  statusFilter?: string;
  setSelectedWorkOrderId: (id?: string) => void;
  setStatusFilter: (status?: string) => void;
};

export const useWorkOrderStore = create<WorkOrderViewState>((set) => ({
  selectedWorkOrderId: undefined,
  statusFilter: undefined,
  setSelectedWorkOrderId: (selectedWorkOrderId) => set({ selectedWorkOrderId }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
}));
