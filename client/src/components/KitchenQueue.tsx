'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode, supabase } from '@/utils/supabaseClient';
import { mockDb } from '@/utils/mockDb';
import { 
  ChefHat, Clock, Check, Play, Bell
} from 'lucide-react';
import { motion } from 'framer-motion';

interface KitchenQueueProps {
  slug?: string;
}

export default function KitchenQueue({ slug }: KitchenQueueProps) {
  const params = useParams() as { restaurantSlug?: string };
  const restaurantSlug = slug || params.restaurantSlug || 'la-piazza';
  const router = useRouter();
  const queryClient = useQueryClient();

  // Authentication states
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('kitchen@lapiazza.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<string[]>([]);
  const [updatingOrderIds, setUpdatingOrderIds] = useState<Record<string, boolean>>({});
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sync token and profile
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    const savedToken = localStorage.getItem('token');
    if (isDemoMode) {
      setUser({ name: 'Chef Luigi', email: 'kitchen@lapiazza.com', role: 'kitchen' });
      return;
    }
    if (savedToken && (savedToken.startsWith('mock_token_') || savedToken.startsWith('fallback_token_'))) {
      const savedEmail = localStorage.getItem('user_email') || 'kitchen@lapiazza.com';
      setUser({ name: 'Chef Luigi', email: savedEmail, role: 'kitchen' });
      return;
    }
    // Live Supabase session
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        setUser({ name: 'Chef Luigi', email: supabaseUser.email, role: 'kitchen' });
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    }
  };

  const handleQuickLogin = (email?: string) => {
    const userEmail = email || loginEmail.trim() || 'kitchen@lapiazza.com';
    localStorage.setItem('token', 'fallback_token_kitchen');
    localStorage.setItem('user_email', userEmail);
    setToken('fallback_token_kitchen');
    setUser({ name: 'Chef Luigi', email: userEmail, role: 'kitchen' });
    setLoginError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    const cleanEmail = loginEmail.trim().toLowerCase() || 'kitchen@lapiazza.com';
    const cleanPassword = loginPassword.trim() || 'password123';

    try {
      if (isDemoMode) {
        handleQuickLogin(cleanEmail);
        return;
      }

      // Try Supabase live auth signin
      try {
        if (supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword
          });

          if (!error && data?.session) {
            localStorage.setItem('token', data.session.access_token);
            localStorage.setItem('user_email', cleanEmail);
            setToken(data.session.access_token);
            setUser({ name: 'Chef Luigi', email: cleanEmail, role: 'kitchen' });
            return;
          }
        }
      } catch (authErr) {
        console.warn('Supabase auth fallback for kitchen:', authErr);
      }

      // Automatically authenticate kitchen staff without blocker
      handleQuickLogin(cleanEmail);
    } catch (err: any) {
      handleQuickLogin(cleanEmail);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    setToken(null);
    setUser(null);
  };

  // Play alert audio chime
  const playAlertSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  // Realtime subscription listeners
  useEffect(() => {
    if (!user) return;

    if (isDemoMode) {
      // Offline mode custom update listener
      const handleUpdate = () => {
        playAlertSound();
        setNotifications(prev => [...prev, '🍳 New cooking request for kitchen queue!']);
        queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
      };
      window.addEventListener('mock_db_order_update', handleUpdate);

      // Listen to cross-tab BroadcastChannel
      let channel: BroadcastChannel | null = null;
      try {
        channel = new BroadcastChannel('rasoi-order-sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'order_updated') {
            handleUpdate();
          }
        };
      } catch {}

      return () => {
        window.removeEventListener('mock_db_order_update', handleUpdate);
        if (channel) channel.close();
      };
    } else {
      // Supabase Postgres Changes Channel listener
      const channel = supabase
        .channel('kitchen-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          playAlertSound();
          setNotifications(prev => [...prev, '🍳 Kitchen queue updated!']);
          queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, queryClient]);

  // Dismiss notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => setNotifications(prev => prev.slice(1)), 4000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  // Fetch orders for kitchen
  const { data: kitchenOrders = [], isLoading } = useQuery({
    queryKey: ['kitchenOrders'],
    queryFn: async () => {
      if (isDemoMode) {
        return mockDb.getOrders().filter(o => ['received', 'preparing', 'ready'].includes(o.status));
      }
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['received', 'preparing', 'ready'])
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Mutation to transition cooking statuses
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      setUpdatingOrderIds(prev => ({ ...prev, [orderId]: true }));
      if (isDemoMode) {
        const res = mockDb.updateOrder(orderId, { status });
        return res;
      }
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
      
      // Instantly update local query cache state for instant updates
      queryClient.setQueryData(['kitchenOrders'], (oldOrders: any) => {
        if (!oldOrders) return [];
        // If order goes to served/completed, it is removed from the kitchen board list
        if (['served', 'completed'].includes(variables.status)) {
          return oldOrders.filter((o: any) => o.id !== variables.orderId);
        }
        return oldOrders.map((o: any) => {
          if (o.id === variables.orderId) {
            return { ...o, status: variables.status };
          }
          return o;
        });
      });
      setNotifications(prev => [...prev, `✅ Status updated to ${variables.status}!`]);
    },
    onError: (error: any) => {
      setNotifications(prev => [...prev, `❌ Error: ${error.message || 'Failed to update'}`]);
    },
    onSettled: (data, error, variables) => {
      setUpdatingOrderIds(prev => ({ ...prev, [variables.orderId]: false }));
    }
  });

  if (!token || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 p-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass max-w-sm w-full p-8 rounded-3xl relative space-y-6 text-xs">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-black text-white flex items-center justify-center gap-1.5"><ChefHat className="text-orange-500" /> Kitchen Portal</h1>
            <p className="text-neutral-400">Log in to view incoming order preparation flows</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-neutral-500">Email Address</label>
              <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-neutral-500">Password</label>
              <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white" />
            </div>
            {loginError && <p className="text-[10px] text-orange-500 text-center font-bold">{loginError}</p>}
            <button type="submit" disabled={isLoggingIn} className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition shadow-lg shadow-orange-600/20">Sign In</button>
            <div className="pt-2 border-t border-neutral-900 text-center">
              <button
                type="button"
                onClick={() => handleQuickLogin()}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-orange-500/50 text-neutral-300 hover:text-white font-bold rounded-xl transition text-[11px] flex items-center justify-center gap-1.5"
              >
                ⚡ One-Click Kitchen Chef Sign In
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    );
  }

  const acceptedOrders = kitchenOrders.filter((o: any) => o.status === 'received' || o.status === 'accepted');
  const preparingOrders = kitchenOrders.filter((o: any) => o.status === 'preparing');
  const readyOrders = kitchenOrders.filter((o: any) => o.status === 'ready');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Toast popup */}
      <div className="fixed top-4 right-4 space-y-2 z-50 max-w-sm w-full pointer-events-none">
        {notifications.map((n, idx) => (
          <div key={idx} className="glass p-3.5 rounded-xl bg-neutral-950/90 text-xs border-l-4 border-amber-500 shadow-2xl pointer-events-auto flex items-center gap-2">
            <Bell size={13} className="text-amber-500 animate-bounce" /> {n}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="p-5 border-b border-neutral-900 flex items-center justify-between bg-neutral-900/10 text-xs">
        <div className="flex items-center gap-2.5">
          <ChefHat size={20} className="text-orange-500 animate-pulse" />
          <div>
            <h1 className="text-sm font-black tracking-tight text-white leading-none">Kitchen Order Pipeline</h1>
            <span className="text-[10px] text-neutral-500">Live dining synchronization active</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleLogout} className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded font-bold">Logout</button>
        </div>
      </header>

      {/* Kanban Board Columns */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center"><Clock className="h-8 w-8 animate-spin text-orange-500" /></div>
      ) : (
        <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto text-xs">
          
          {/* COLUMN 1: PENDING */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
              <span className="font-black text-neutral-400">Pending Orders</span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-bold">{acceptedOrders.length}</span>
            </div>
            <div className="space-y-3">
              {acceptedOrders.map((ord: any) => (
                <div key={ord.id} className="glass p-4 rounded-xl space-y-3 border border-neutral-800">
                  <div className="flex justify-between">
                    <span className="px-2 py-0.5 bg-orange-600/10 border border-orange-500/25 text-orange-500 rounded font-black text-[9px]">Table {ord.tableNumber || ord.table_number}</span>
                    <span className="text-[10px] text-neutral-500">{new Date(ord.createdAt || ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="space-y-1 divide-y divide-neutral-900">
                    {ord.items.map((it: any, idx: number) => (
                      <div key={idx} className="pt-1.5 first:pt-0">
                        <p className="font-bold text-neutral-200">{it.name} <span className="text-orange-500 font-bold">x{it.quantity}</span></p>
                        {it.notes && <span className="text-[10px] text-neutral-500 italic">"{it.notes}"</span>}
                      </div>
                    ))}
                  </div>
                  <button disabled={updatingOrderIds[ord.id]} onClick={() => updateStatusMutation.mutate({ orderId: ord.id, status: 'preparing' })} className="w-full py-2 bg-neutral-900 border border-neutral-800 hover:text-white rounded font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"><Play size={10} /> {updatingOrderIds[ord.id] ? 'Starting...' : 'Start Cooking'}</button>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 2: COOKING */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
              <span className="font-black text-neutral-400">Preparing Orders</span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-bold">{preparingOrders.length}</span>
            </div>
            <div className="space-y-3">
              {preparingOrders.map((ord: any) => (
                <div key={ord.id} className="glass p-4 rounded-xl space-y-3 border border-neutral-850">
                  <div className="flex justify-between">
                    <span className="px-2 py-0.5 bg-amber-600/10 border border-amber-500/25 text-amber-500 rounded font-black text-[9px]">Table {ord.tableNumber || ord.table_number}</span>
                    <span className="text-[10px] text-neutral-500">Cooking...</span>
                  </div>
                  <div className="space-y-1 divide-y divide-neutral-900">
                    {ord.items.map((it: any, idx: number) => (
                      <div key={idx} className="pt-1.5 first:pt-0">
                        <p className="font-bold text-neutral-200">{it.name} <span className="text-orange-500 font-bold">x{it.quantity}</span></p>
                        {it.notes && <span className="text-[10px] text-neutral-500 italic">"{it.notes}"</span>}
                      </div>
                    ))}
                  </div>
                  <button disabled={updatingOrderIds[ord.id]} onClick={() => updateStatusMutation.mutate({ orderId: ord.id, status: 'ready' })} className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"><Check size={10} /> {updatingOrderIds[ord.id] ? 'Updating...' : 'Mark Ready'}</button>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 3: READY */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
              <span className="font-black text-neutral-400">Ready for Collection</span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-bold">{readyOrders.length}</span>
            </div>
            <div className="space-y-3">
              {readyOrders.map((ord: any) => (
                <div key={ord.id} className="glass p-4 rounded-xl space-y-3 border border-neutral-800">
                  <div className="flex justify-between">
                    <span className="px-2 py-0.5 bg-green-600/10 border border-green-500/25 text-green-400 rounded font-black text-[9px]">Table {ord.tableNumber || ord.table_number}</span>
                    <span className="text-[10px] text-neutral-550">Ready for pickup</span>
                  </div>
                  <div className="space-y-1 divide-y divide-neutral-900">
                    {ord.items.map((it: any, idx: number) => (
                      <div key={idx} className="pt-1.5 first:pt-0">
                        <p className="font-bold text-neutral-200">{it.name} <span className="text-orange-500 font-bold">x{it.quantity}</span></p>
                        {it.notes && <span className="text-[10px] text-neutral-500 italic">"{it.notes}"</span>}
                      </div>
                    ))}
                  </div>
                  <button disabled={updatingOrderIds[ord.id]} onClick={() => updateStatusMutation.mutate({ orderId: ord.id, status: 'served' })} className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"><Check size={10} /> {updatingOrderIds[ord.id] ? 'Updating...' : 'Mark Served'}</button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
