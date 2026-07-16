import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { selectCurrentUser, selectIsAuthenticated } from '../store/authSlice';
import { addNotification } from '../store/notificationSlice';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const socketRef = useRef(null);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Retrieve active access token
    const token = localStorage.getItem('accessToken');

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('📡 Connected to Campus Connect WebSocket');
    });

    // Listen for new notifications
    socket.on('notification:new', (data) => {
      console.log('🔔 WebSocket: New notification received:', data);
      if (data.notification) {
        dispatch(addNotification(data.notification));
      }
    });

    // Listen for application status updates
    socket.on('application:status', (data) => {
      console.log('💼 WebSocket: Application status update:', data);
      // Dispatch notification or display a toast
      dispatch(
        addNotification({
          _id: Date.now().toString(), // local mock id for transient notifications
          title: 'Application Update',
          message: data.message,
          type: 'application_status',
          isRead: false,
          createdAt: new Date().toISOString(),
        })
      );
    });

    socket.on('disconnect', () => {
      console.log('📡 Disconnected from Campus Connect WebSocket');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user, dispatch]);

  return socketRef.current;
};

export default useSocket;
