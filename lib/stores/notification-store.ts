import { create } from "zustand";

export type NotificationViewState = {
  unreadOnly: boolean;
  selectedNotificationId?: string;
  setUnreadOnly: (unreadOnly: boolean) => void;
  setSelectedNotificationId: (id?: string) => void;
};

export const useNotificationStore = create<NotificationViewState>((set) => ({
  unreadOnly: false,
  selectedNotificationId: undefined,
  setUnreadOnly: (unreadOnly) => set({ unreadOnly }),
  setSelectedNotificationId: (selectedNotificationId) =>
    set({ selectedNotificationId }),
}));
