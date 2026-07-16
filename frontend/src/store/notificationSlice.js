import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications = [action.payload, ...state.notifications];
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    markRead: (state, action) => {
      const notifId = action.payload;
      const notif = state.notifications.find((n) => n._id === notifId);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.notifications = state.notifications.map((n) => ({
        ...n,
        isRead: true,
      }));
      state.unreadCount = 0;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markRead,
  markAllRead,
  setUnreadCount,
} = notificationSlice.actions;

export default notificationSlice.reducer;
export const selectNotifications = (state) => state.notifications.notifications;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
