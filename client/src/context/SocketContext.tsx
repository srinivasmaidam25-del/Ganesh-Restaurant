'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
  joinRestaurantRoom: (restaurantId: string, role: 'admin' | 'kitchen') => void;
  joinOrderRoom: (orderId: string) => void;
  leaveOrderRoom: (orderId: string) => void;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
  joinRestaurantRoom: () => {},
  joinOrderRoom: () => {},
  leaveOrderRoom: () => {}
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const socketInstance = io(socketUrl, {
      withCredentials: true,
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Socket.IO Connected:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket.IO Disconnected');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinRestaurantRoom = (restaurantId: string, role: 'admin' | 'kitchen') => {
    if (socket && isConnected) {
      socket.emit('join_restaurant_room', { restaurantId, role });
    }
  };

  const joinOrderRoom = (orderId: string) => {
    if (socket && isConnected) {
      socket.emit('join_order_room', { orderId });
    }
  };

  const leaveOrderRoom = (orderId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_order_room', { orderId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinRestaurantRoom, joinOrderRoom, leaveOrderRoom }}>
      {children}
    </SocketContext.Provider>
  );
};
