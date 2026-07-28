'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode, supabase } from '@/utils/supabaseClient';
import { mockDb } from '@/utils/mockDb';
import { 
  Shield, LogOut, Plus, Trash, Download, Printer, AlertTriangle, 
  Check, Play, ChefHat, Tag, Sliders, BarChart3, Settings
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Live Orders' },
  { id: 'menu', label: 'Menu Editor' },
  { id: 'tables', label: 'Tables & QR' },
  { id: 'coupons', label: 'Coupons' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' }
];

interface AdminDashboardProps {
  slug?: string;
}

export default function AdminDashboard({ slug }: AdminDashboardProps) {
  const params = useParams() as { restaurantSlug?: string };
  const restaurantSlug = slug || params.restaurantSlug || 'la-piazza';
  const router = useRouter();
  const queryClient = useQueryClient();

  // Authentication states
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('admin@lapiazza.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Layout states
  const [activeTab, setActiveTab] = useState('overview');
  
  // Creators toggles
  const [isCreatingFood, setIsCreatingFood] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [isCreatingStock, setIsCreatingStock] = useState(false);

  // New Category form
  const [newCatName, setNewCatName] = useState('');

  // New Table form
  const [newTableNum, setNewTableNum] = useState('');
  const [editingTableId, setEditingTableId] = useState('');
  const [editingTableNum, setEditingTableNum] = useState('');

  // New Coupon form
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'flat'>('percentage');
  const [newCouponVal, setNewCouponVal] = useState(10);
  const [newCouponMin, setNewCouponMin] = useState(20);
  const [newCouponExpiry, setNewCouponExpiry] = useState('2026-12-31');

  // New Stock form
  const [newStockName, setNewStockName] = useState('');
  const [newStockQty, setNewStockQty] = useState(10);
  const [newStockUnit, setNewStockUnit] = useState('kg');
  const [newStockMin, setNewStockMin] = useState(5);

  // New Food form
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodDesc, setNewFoodDesc] = useState('');
  const [newFoodCat, setNewFoodCat] = useState('');
  const [newFoodPrice, setNewFoodPrice] = useState(10);
  const [newFoodImage, setNewFoodImage] = useState('');
  const [newFoodVeg, setNewFoodVeg] = useState(true);
  const [newFoodBestseller, setNewFoodBestseller] = useState(false);
  const [newFoodPrep, setNewFoodPrep] = useState(15);

  // Settings form states
  const [settingsName, setSettingsName] = useState('');
  const [settingsAddress, setSettingsAddress] = useState('');
  const [settingsLogo, setSettingsLogo] = useState('');
  const [settingsBanner, setSettingsBanner] = useState('');
  const [settingsHours, setSettingsHours] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsTax, setSettingsTax] = useState(5.0);
  const [settingsService, setSettingsService] = useState(2.0);
  const [settingsCurrency, setSettingsCurrency] = useState('₹');
  const [settingsColor, setSettingsColor] = useState('#EA580C');

  // Real-time toast state
  const [toasts, setToasts] = useState<string[]>([]);
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
    if (isDemoMode) {
      setUser({ name: 'Mario Rossi', email: 'admin@lapiazza.com', role: 'admin' });
      return;
    }
    // Live Supabase session
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (supabaseUser) {
      setUser({ name: 'Mario Rossi', email: supabaseUser.email, role: 'admin' });
    } else {
      handleLogout();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      if (isDemoMode) {
        if (loginEmail === 'admin@lapiazza.com' && loginPassword === 'password123') {
          localStorage.setItem('token', 'mock_token_admin');
          setToken('mock_token_admin');
          setUser({ name: 'Mario Rossi', email: loginEmail, role: 'admin' });
        } else {
          setLoginError('Invalid credentials for Demo Mode.');
        }
        return;
      }

      // Supabase live auth signin
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });

      if (error) {
        setLoginError(error.message);
        return;
      }
      localStorage.setItem('token', data.session.access_token);
      setToken(data.session.access_token);
      setUser({ name: 'Mario Rossi', email: loginEmail, role: 'admin' });
    } catch (err: any) {
      setLoginError(err.message || 'Credentials invalid');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Play audio chime
  const playAlertSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  // Real-time synchronization listeners
  useEffect(() => {
    if (!user) return;

    if (isDemoMode) {
      // Offline mode custom update listener
      const handleUpdate = () => {
        playAlertSound();
        setToasts(prev => [...prev, '🔔 New Order placed in queue!']);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
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
        .channel('admin-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
          playAlertSound();
          if (payload.eventType === 'INSERT') {
            setToasts(prev => [...prev, `🔔 Table ${payload.new.table_number || payload.new.tableNumber} placed a new order!`]);
          } else if (payload.eventType === 'UPDATE') {
            setToasts(prev => [...prev, `🔄 Table ${payload.new.table_number || payload.new.tableNumber} order status is now ${payload.new.status}!`]);
          }
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, queryClient]);

  // Dismiss toasts automatically
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.slice(1));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  // 1. Fetch Restaurant Settings
  const { data: resData } = useQuery({
    queryKey: ['restaurant', restaurantSlug],
    queryFn: async () => {
      if (isDemoMode) {
        return mockDb.restaurant;
      }
      let { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', restaurantSlug.toLowerCase())
        .maybeSingle();

      if (error || !data) {
        const { data: list } = await supabase.from('restaurants').select('*').limit(1);
        if (list && list.length > 0) data = list[0];
      }
      return data;
    }
  });

  const restaurantId = resData?.id;

  // Initialize settings states when restaurant loads
  useEffect(() => {
    if (resData) {
      setSettingsName(resData.name || '');
      setSettingsAddress(resData.address || '');
      setSettingsLogo(resData.logo || '');
      setSettingsBanner(resData.banner || '');
      setSettingsHours(resData.opening_hours || resData.openingHours || '11:00 AM - 11:00 PM');
      setSettingsPhone(resData.contact_phone || resData.contactDetails?.phone || '');
      setSettingsEmail(resData.contact_email || resData.contactDetails?.email || '');
      setSettingsTax(Number(resData.tax_percentage) || 5.0);
      setSettingsService(Number(resData.service_charge) || 2.0);
      setSettingsCurrency(resData.currency || '₹');
      setSettingsColor(resData.theme?.primaryColor || '#EA580C');
    }
  }, [resData]);

  // 2. Fetch Live Orders
  const { data: orders = [] } = useQuery({
    queryKey: ['orders', restaurantId],
    queryFn: async () => {
      if (isDemoMode) {
        return mockDb.getOrders().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId
  });

  // 3. Fetch Dashboard Metrics
  const { data: metrics } = useQuery({
    queryKey: ['dashboardStats', restaurantId],
    queryFn: async () => {
      if (isDemoMode) {
        const orderList = mockDb.getOrders();
        const activeCount = orderList.filter(o => ['received', 'accepted', 'preparing', 'ready'].includes(o.status)).length;
        const todayRevenue = orderList
          .filter(o => {
            const date = new Date(o.createdAt);
            const today = new Date();
            return date.getDate() === today.getDate() && 
                   date.getMonth() === today.getMonth() && 
                   date.getFullYear() === today.getFullYear();
          })
          .reduce((acc, o) => acc + o.total, 0)
          .toFixed(2);
        
        const todayOrdersCount = orderList.filter(o => {
          const date = new Date(o.createdAt);
          const today = new Date();
          return date.getDate() === today.getDate() && 
                 date.getMonth() === today.getMonth() && 
                 date.getFullYear() === today.getFullYear();
        }).length;

        // Group weekly chart
        const weeklyRevenueChart = [
          { _id: 'Mon', revenue: 120 },
          { _id: 'Tue', revenue: 150 },
          { _id: 'Wed', revenue: 180 },
          { _id: 'Thu', revenue: 220 },
          { _id: 'Fri', revenue: 310 },
          { _id: 'Sat', revenue: 450 },
          { _id: 'Sun', revenue: todayRevenue ? parseFloat(todayRevenue) : 380 }
        ];

        const popularFoods = [
          { name: 'Margherita DOC Pizza', count: 24 },
          { name: 'Classic Bruschetta', count: 18 },
          { name: 'Diavola Spicy Pizza', count: 15 }
        ];

        return {
          todayRevenue,
          activeOrdersCount: activeCount,
          todayOrdersCount,
          occupiedTables: activeCount > 5 ? 5 : activeCount,
          weeklyRevenueChart,
          popularFoods
        };
      }

      // Live mode dashboard stats from Supabase
      const { data: dbOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId);
      
      if (error || !dbOrders) {
        return { todayRevenue: '0.00', activeOrdersCount: 0, todayOrdersCount: 0, occupiedTables: 0, popularFoods: [], weeklyRevenueChart: [] };
      }

      const active = dbOrders.filter((o: any) => ['received', 'accepted', 'preparing', 'ready'].includes(o.status));
      const today = dbOrders.filter((o: any) => {
        const d = new Date(o.created_at);
        const cur = new Date();
        return d.getDate() === cur.getDate() && d.getMonth() === cur.getMonth() && d.getFullYear() === cur.getFullYear();
      });

      const todayRevenue = today.reduce((acc: number, o: any) => acc + Number(o.total), 0).toFixed(2);
      const activeOrdersCount = active.length;
      const todayOrdersCount = today.length;
      
      const uniqueTables = new Set(active.map((o: any) => o.table_number).filter(Boolean));
      const occupiedTables = uniqueTables.size;

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyRevenueMap: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      dbOrders.forEach((o: any) => {
        const date = new Date(o.created_at);
        if (date >= oneWeekAgo) {
          const dayName = days[date.getDay()];
          weeklyRevenueMap[dayName] = (weeklyRevenueMap[dayName] || 0) + Number(o.total);
        }
      });

      const weeklyRevenueChart = Object.entries(weeklyRevenueMap).map(([day, val]) => ({
        _id: day,
        revenue: parseFloat(val.toFixed(2))
      }));

      const foodCounts: Record<string, number> = {};
      dbOrders.forEach((o: any) => {
        if (Array.isArray(o.items)) {
          o.items.forEach((it: any) => {
            foodCounts[it.name] = (foodCounts[it.name] || 0) + (it.quantity || 1);
          });
        }
      });
      const popularFoods = Object.entries(foodCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        todayRevenue,
        activeOrdersCount,
        todayOrdersCount,
        occupiedTables,
        weeklyRevenueChart,
        popularFoods
      };
    },
    enabled: !!restaurantId
  });

  // 4. Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', restaurantId],
    queryFn: async () => {
      if (isDemoMode) {
        return mockDb.getCategories();
      }
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('order_index');
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId
  });

  // 5. Fetch Tables
  const { data: tables = [] } = useQuery({
    queryKey: ['tables', restaurantId],
    queryFn: async () => {
      if (isDemoMode) {
        return mockDb.getTables();
      }
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('number');
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId
  });

  // 6. Fetch Foods
  const { data: foods = [] } = useQuery({
    queryKey: ['foods', restaurantId],
    queryFn: async () => {
      if (isDemoMode) {
        return mockDb.getFoods();
      }
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId
  });

  // 7. Fetch Coupons
  const { data: coupons = [] } = useQuery({
    queryKey: ['coupons', restaurantId],
    queryFn: async () => {
      if (isDemoMode) {
        return mockDb.getCoupons();
      }
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('code');
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId
  });

  // 8. Fetch Inventory
  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory', restaurantId],
    queryFn: async () => {
      if (isDemoMode) {
        return mockDb.getInventory();
      }
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('item_name');
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId
  });

  // ==========================================
  // MUTATIONS (DB MODIFICATIONS)
  // ==========================================

  // Order status transition updates
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, paymentStatus }: { orderId: string; status?: string; paymentStatus?: string }) => {
      setUpdatingOrderIds(prev => ({ ...prev, [orderId]: true }));
      const updates: any = {};
      if (status) updates.status = status;
      if (paymentStatus) {
        updates.payment_status = paymentStatus;
        updates.paymentStatus = paymentStatus;
      }

      if (isDemoMode) {
        const res = mockDb.updateOrder(orderId, updates);
        return res;
      }
      
      const sbUpdates: any = {};
      if (status) sbUpdates.status = status;
      if (paymentStatus) sbUpdates.payment_status = paymentStatus;

      const { data, error } = await supabase
        .from('orders')
        .update(sbUpdates)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      
      // Instantly update local query cache state for instant updates
      queryClient.setQueryData(['orders', restaurantId], (oldOrders: any) => {
        if (!oldOrders) return [];
        return oldOrders.map((o: any) => {
          if (o.id === variables.orderId) {
            const updated = { ...o };
            if (variables.status) updated.status = variables.status;
            if (variables.paymentStatus) {
              updated.payment_status = variables.paymentStatus;
              updated.paymentStatus = variables.paymentStatus;
            }
            return updated;
          }
          return o;
        });
      });
      setToasts(prev => [...prev, `✅ Order status updated to ${variables.status || 'paid'}!`]);
    },
    onError: (error: any) => {
      setToasts(prev => [...prev, `❌ Error: ${error.message || 'Failed to update order'}`]);
    },
    onSettled: (data, error, variables) => {
      setUpdatingOrderIds(prev => ({ ...prev, [variables.orderId]: false }));
    }
  });

  // Create Category
  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!newCatName) return;
      if (isDemoMode) {
        return mockDb.createCategory(newCatName, categories.length + 1);
      }
      return supabase.from('categories').insert([{ 
        name: newCatName, 
        restaurant_id: restaurantId,
        order_index: categories.length + 1 
      }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setNewCatName('');
      setIsCreatingCategory(false);
    }
  });

  // Delete Category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode) {
        return mockDb.deleteCategory(id);
      }
      return supabase.from('categories').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    }
  });

  // Create Table
  const createTableMutation = useMutation({
    mutationFn: async () => {
      if (!newTableNum) return;
      if (isDemoMode) {
        return mockDb.createTable(newTableNum);
      }
      return supabase.from('tables').insert([{ 
        number: newTableNum, 
        restaurant_id: restaurantId 
      }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setNewTableNum('');
      setIsCreatingTable(false);
    }
  });

  // Delete Table
  const deleteTableMutation = useMutation({
    mutationFn: async (tableId: string) => {
      if (isDemoMode) {
        return mockDb.deleteTable(tableId);
      }
      const { error } = await supabase.from('tables').delete().eq('id', tableId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setToasts(prev => [...prev, '🗑 Dining Table removed successfully!']);
    },
    onError: (err: any) => {
      setToasts(prev => [...prev, `❌ Error deleting table: ${err.message || 'Failed'}`]);
    }
  });

  // Update/Rename Table
  const updateTableMutation = useMutation({
    mutationFn: async ({ tableId, number }: { tableId: string; number: string }) => {
      if (isDemoMode) {
        return mockDb.updateTable(tableId, { number });
      }
      const { error } = await supabase.from('tables').update({ number }).eq('id', tableId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setEditingTableId('');
      setEditingTableNum('');
      setToasts(prev => [...prev, '✏️ Dining Table renamed successfully!']);
    },
    onError: (err: any) => {
      setToasts(prev => [...prev, `❌ Error renaming table: ${err.message || 'Failed'}`]);
    }
  });

  // Create Food item
  const createFoodMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: newFoodName,
        description: newFoodDesc,
        price: newFoodPrice,
        image: newFoodImage,
        is_veg: newFoodVeg,
        isVeg: newFoodVeg,
        is_bestseller: newFoodBestseller,
        isBestseller: newFoodBestseller,
        prep_time: newFoodPrep,
        prepTime: newFoodPrep,
        category_id: newFoodCat,
        categoryId: newFoodCat,
        restaurant_id: restaurantId,
        restaurantId
      };

      if (isDemoMode) {
        return mockDb.createFood(payload as any);
      }
      
      const sbPayload = {
        name: newFoodName,
        description: newFoodDesc,
        price: newFoodPrice,
        image: newFoodImage,
        is_veg: newFoodVeg,
        is_bestseller: newFoodBestseller,
        prep_time: newFoodPrep,
        category_id: newFoodCat,
        restaurant_id: restaurantId
      };
      return supabase.from('foods').insert([sbPayload]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] });
      setNewFoodName('');
      setNewFoodDesc('');
      setNewFoodImage('');
      setIsCreatingFood(false);
    }
  });

  // Toggle food availability
  const toggleFoodMutation = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      if (isDemoMode) {
        return mockDb.updateFood(id, { isAvailable });
      }
      return supabase.from('foods').update({ is_available: isAvailable }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    }
  });

  // Delete Food item
  const deleteFoodMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode) {
        return mockDb.deleteFood(id);
      }
      return supabase.from('foods').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    }
  });

  // Create Coupon Campaign
  const createCouponMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: newCouponCode.toUpperCase(),
        type: newCouponType,
        value: newCouponVal,
        minOrderAmount: newCouponMin,
        min_order_amount: newCouponMin,
        expiryDate: newCouponExpiry,
        expiry_date: newCouponExpiry,
        restaurant_id: restaurantId,
        restaurantId
      };

      if (isDemoMode) {
        return mockDb.createCoupon(payload as any);
      }
      
      const sbPayload = {
        code: newCouponCode.toUpperCase(),
        type: newCouponType,
        value: newCouponVal,
        min_order_amount: newCouponMin,
        expiry_date: newCouponExpiry,
        restaurant_id: restaurantId
      };
      return supabase.from('coupons').insert([sbPayload]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setNewCouponCode('');
      setIsCreatingCoupon(false);
    }
  });

  // Delete Coupon Campaign
  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode) {
        return mockDb.deleteCoupon(id);
      }
      return supabase.from('coupons').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    }
  });

  // Create Inventory Stock Item
  const createStockMutation = useMutation({
    mutationFn: async () => {
      if (!newStockName) return;
      if (isDemoMode) {
        return mockDb.createInventory(newStockName, newStockQty, newStockUnit, newStockMin);
      }
      return supabase.from('inventory').insert([{
        item_name: newStockName,
        quantity: newStockQty,
        unit: newStockUnit,
        min_threshold: newStockMin,
        restaurant_id: restaurantId
      }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setNewStockName('');
      setIsCreatingStock(false);
    }
  });

  // Adjust stock quantity
  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (isDemoMode) {
        return mockDb.adjustInventory(id, quantity);
      }
      return supabase.from('inventory').update({ quantity }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  // Delete Stock item
  const deleteStockMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode) {
        return mockDb.deleteInventory(id);
      }
      return supabase.from('inventory').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  // Update Settings Mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      const updates = {
        name: settingsName,
        address: settingsAddress,
        logo: settingsLogo,
        banner: settingsBanner,
        opening_hours: settingsHours,
        contact_phone: settingsPhone,
        contact_email: settingsEmail,
        tax_percentage: settingsTax,
        service_charge: settingsService,
        currency: settingsCurrency,
        theme: { primaryColor: settingsColor, isDarkDefault: true }
      };

      if (isDemoMode) {
        mockDb.restaurant = { ...mockDb.restaurant, ...updates, contactDetails: { phone: settingsPhone, email: settingsEmail } };
        return mockDb.restaurant;
      }

      const { data, error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', restaurantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantSlug] });
      alert('Settings updated successfully!');
    }
  });

  if (!token || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 p-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass max-w-sm w-full p-8 rounded-3xl relative space-y-6 text-xs">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-black text-white flex items-center justify-center gap-1.5"><Shield className="text-orange-500" /> Admin Access</h1>
            <p className="text-neutral-400">Dine-in menu configuration panel login</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-neutral-500">Email Address</label>
              <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-neutral-500">Password</label>
              <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs" />
            </div>
            {loginError && <p className="text-[10px] text-orange-500 text-center font-bold">{loginError}</p>}
            <button type="submit" disabled={isLoggingIn} className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition" style={{ backgroundColor: settingsColor }}>Sign In</button>
          </form>
        </motion.div>
      </main>
    );
  }

  // Advanced Analytics Calculators
  const totalRevenue = orders.reduce((acc: number, o: any) => acc + Number(o.total), 0);
  const totalOrdersCount = orders.length;
  const averageOrderValue = totalOrdersCount > 0 ? (totalRevenue / totalOrdersCount).toFixed(2) : '0.00';

  // Orders by table graph
  const tableOrderCounts: Record<string, number> = {};
  orders.forEach((o: any) => {
    const tableNumStr = o.table_number || o.tableNumber || 'N/A';
    tableOrderCounts[tableNumStr] = (tableOrderCounts[tableNumStr] || 0) + 1;
  });

  // Orders by time of day
  const ordersByTimeMap = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  orders.forEach((o: any) => {
    const hr = new Date(o.created_at || o.createdAt).getHours();
    if (hr >= 6 && hr < 12) ordersByTimeMap.Morning += 1;
    else if (hr >= 12 && hr < 17) ordersByTimeMap.Afternoon += 1;
    else if (hr >= 17 && hr < 22) ordersByTimeMap.Evening += 1;
    else ordersByTimeMap.Night += 1;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row text-xs">
      
      {/* Realtime Toasts */}
      <div className="fixed top-4 right-4 space-y-2 z-50 max-w-sm w-full pointer-events-none">
        {toasts.map((toastMsg, idx) => (
          <div key={idx} className="glass p-3 rounded-xl bg-neutral-950/95 border-l-4 border-orange-500 text-xs text-white shadow-2xl flex items-center gap-2 pointer-events-auto">
            <Check size={14} className="text-orange-500" /> {toastMsg}
          </div>
        ))}
      </div>

      {/* Sidebar Panel */}
      <aside className="w-full md:w-64 bg-neutral-900/30 border-b md:border-b-0 md:border-r border-neutral-900 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-orange-500" style={{ color: settingsColor }} />
            <div>
              <h1 className="text-sm font-black text-white leading-none">{settingsName || 'Cafe Admin'}</h1>
              <span className="text-[9px] text-neutral-500">Workspace Management</span>
            </div>
          </div>

          <nav className="flex flex-row md:flex-col overflow-x-auto no-scrollbar gap-1 text-[10px] font-bold">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition whitespace-nowrap ${activeTab === tab.id ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
                style={activeTab === tab.id ? { borderLeft: `3px solid ${settingsColor}` } : {}}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          className="mt-6 hidden md:flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 hover:text-orange-500 rounded-lg transition font-bold"
        >
          <LogOut size={13} /> Sign Out
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        
        {/* OVERVIEW PANEL */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass p-4 rounded-xl"><span>Today's Sales</span><p className="text-xl font-black text-orange-500 mt-1" style={{ color: settingsColor }}>{settingsCurrency}{metrics?.todayRevenue}</p></div>
              <div className="glass p-4 rounded-xl"><span>Active Queue</span><p className="text-xl font-black text-white mt-1">{metrics?.activeOrdersCount} orders</p></div>
              <div className="glass p-4 rounded-xl"><span>Orders Today</span><p className="text-xl font-black text-white mt-1">{metrics?.todayOrdersCount}</p></div>
              <div className="glass p-4 rounded-xl"><span>Occupancy</span><p className="text-xl font-black text-white mt-1">{metrics?.occupiedTables} tables</p></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 glass p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center"><h3 className="font-bold">Weekly Timeline</h3></div>
                <div className="h-56">
                  {metrics?.weeklyRevenueChart && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metrics.weeklyRevenueChart}>
                        <CartesianGrid stroke="#222" />
                        <XAxis dataKey="_id" stroke="#555" style={{ fontSize: 9 }} />
                        <YAxis stroke="#555" style={{ fontSize: 9 }} />
                        <Tooltip contentStyle={{ background: '#0a0a0a' }} />
                        <Line type="monotone" dataKey="revenue" stroke={settingsColor} strokeWidth={2} dot={{ fill: settingsColor }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="glass p-5 rounded-2xl space-y-3">
                <h3 className="font-bold">Popular Dishes</h3>
                {metrics?.popularFoods.map((f: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-neutral-900 last:border-0">
                    <span>{f.name}</span>
                    <span className="font-bold text-orange-500" style={{ color: settingsColor }}>{f.count} sold</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Combined sections below for All-in-One Dashboard experience */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Compact Live Orders */}
              <div className="glass p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Live Orders Pipeline</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-[10px] text-neutral-450 hover:underline">Manage Queue</button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {orders.length === 0 ? (
                    <p className="text-neutral-500 text-center py-8">No orders in queue.</p>
                  ) : (
                    orders.slice(0, 5).map((ord: any) => (
                      <div key={ord.id} className="p-3 bg-neutral-950/40 border border-neutral-900 rounded-xl space-y-2 text-[10px]">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-orange-500" style={{ color: settingsColor }}>Table {ord.table_number || ord.tableNumber}</span>
                          <span className="text-[9px] text-neutral-500 uppercase">{ord.status}</span>
                        </div>
                        <div className="text-neutral-300">
                          {ord.items.map((it: any) => `${it.name} x${it.quantity}`).join(', ')}
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-neutral-900/50">
                          <span className="font-bold text-neutral-400">{settingsCurrency}{ord.total.toFixed(2)}</span>
                          <div className="flex gap-1">
                            {(ord.status === 'received' || ord.status === 'accepted') && (
                              <button 
                                disabled={updatingOrderIds[ord.id]} 
                                onClick={() => updateOrderMutation.mutate({ orderId: ord.id, status: 'preparing' })} 
                                className="px-2 py-0.5 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold disabled:opacity-50"
                              >
                                {updatingOrderIds[ord.id] ? 'Updating...' : 'Start Cooking'}
                              </button>
                            )}
                            {ord.status === 'preparing' && (
                              <button 
                                disabled={updatingOrderIds[ord.id]} 
                                onClick={() => updateOrderMutation.mutate({ orderId: ord.id, status: 'ready' })} 
                                className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold disabled:opacity-50"
                              >
                                {updatingOrderIds[ord.id] ? 'Updating...' : 'Mark Ready'}
                              </button>
                            )}
                            {ord.status === 'ready' && (
                              <button 
                                disabled={updatingOrderIds[ord.id]} 
                                onClick={() => updateOrderMutation.mutate({ orderId: ord.id, status: 'served' })} 
                                className="px-2 py-0.5 bg-green-600 hover:bg-green-500 text-white rounded font-bold disabled:opacity-50"
                              >
                                {updatingOrderIds[ord.id] ? 'Updating...' : 'Mark Served'}
                              </button>
                            )}
                            {ord.status === 'served' && (
                              <button 
                                disabled={updatingOrderIds[ord.id]} 
                                onClick={() => updateOrderMutation.mutate({ orderId: ord.id, status: 'completed' })} 
                                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold disabled:opacity-50"
                              >
                                {updatingOrderIds[ord.id] ? 'Updating...' : 'Complete'}
                              </button>
                            )}
                            {ord.status === 'completed' && (
                              <span className="px-2 py-0.5 bg-green-950/30 border border-green-800/30 text-green-400 rounded font-black text-[9px]">
                                ✓ Completed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Compact Tables & QRs */}
              <div className="glass p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Dining Tables & QR Codes</h3>
                  <button onClick={() => setActiveTab('tables')} className="text-[10px] text-neutral-400 hover:underline">Manage Tables</button>
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {tables.map((t: any) => (
                    <div key={t.id} className="p-3 bg-neutral-950/40 border border-neutral-900 rounded-xl flex justify-between items-center text-[10px]">
                      <span className="font-bold">Table {t.number}</span>
                      <div className="flex gap-1.5">
                        <a href={`/api/qr?tableId=${t.id}&format=png`} target="_blank" className="p-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-400 hover:text-white" title="PNG QR"><Download size={10} /></a>
                        <a href={`/api/qr?tableId=${t.id}&format=pdf`} className="p-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-400 hover:text-white" title="PDF Flyer"><Printer size={10} /></a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Compact Inventory Alert */}
              <div className="glass p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Inventory Levels</h3>
                  <button onClick={() => setActiveTab('inventory')} className="text-[10px] text-neutral-400 hover:underline">Restock</button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {inventory.map((item: any) => {
                    const isLow = Number(item.quantity) <= Number(item.min_threshold || item.minThreshold);
                    return (
                      <div key={item.id} className="p-2.5 bg-neutral-950/40 border border-neutral-900 rounded-xl flex justify-between items-center text-[10px]">
                        <span className="font-bold text-neutral-200">{item.item_name || item.itemName}</span>
                        <span className={`font-black ${isLow ? 'text-amber-500 animate-pulse' : 'text-green-400'}`}>{item.quantity} {item.unit}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Compact Active Campaigns */}
              <div className="glass p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Active Coupons</h3>
                  <button onClick={() => setActiveTab('coupons')} className="text-[10px] text-neutral-400 hover:underline">Add Coupon</button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {coupons.map((c: any) => (
                    <div key={c.id} className="p-2.5 bg-neutral-950/40 border border-neutral-900 rounded-xl flex justify-between items-center text-[10px]">
                      <span className="font-black bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded text-[8px] text-orange-500" style={{ color: settingsColor, borderColor: settingsColor }}>{c.code}</span>
                      <span className="text-neutral-400">Get {c.value}{c.type === 'percentage' ? '%' : settingsCurrency} off</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* LIVE QUEUE PANEL */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider">Dining Orders Queue</h2>
            {orders.length === 0 ? (
              <p className="text-neutral-500 text-center py-12">No orders in queue.</p>
            ) : (
              orders.map((ord: any) => (
                <div key={ord.id} className="glass p-5 rounded-xl border border-neutral-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-1 rounded bg-orange-600/90 text-white font-black" style={{ backgroundColor: settingsColor }}>Table {ord.table_number || ord.tableNumber}</span>
                    <span className="text-[10px] text-neutral-550">{new Date(ord.created_at || ord.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="space-y-1.5">
                    {ord.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.name} <span className="text-orange-500 font-bold" style={{ color: settingsColor }}>x{it.quantity}</span></span>
                        <span>{settingsCurrency}{(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-neutral-900 flex-wrap gap-2">
                    <span className="font-bold text-orange-500 text-sm" style={{ color: settingsColor }}>{settingsCurrency}{ord.total.toFixed(2)} • {ord.payment_status || ord.paymentStatus}</span>
                    
                    <div className="flex gap-2">
                      {(ord.status === 'received' || ord.status === 'accepted') && (
                        <button 
                          disabled={updatingOrderIds[ord.id]} 
                          onClick={() => updateOrderMutation.mutate({ orderId: ord.id, status: 'preparing' })} 
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded font-bold text-white disabled:opacity-50"
                        >
                          {updatingOrderIds[ord.id] ? 'Updating...' : 'Start Cooking'}
                        </button>
                      )}
                      {ord.status === 'preparing' && (
                        <button 
                          disabled={updatingOrderIds[ord.id]} 
                          onClick={() => updateOrderMutation.mutate({ orderId: ord.id, status: 'ready' })} 
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded font-bold text-white disabled:opacity-50"
                        >
                          {updatingOrderIds[ord.id] ? 'Updating...' : 'Mark Ready'}
                        </button>
                      )}
                      {ord.status === 'ready' && (
                        <button 
                          disabled={updatingOrderIds[ord.id]} 
                          onClick={() => updateOrderMutation.mutate({ orderId: ord.id, status: 'served' })} 
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded font-bold text-white disabled:opacity-50"
                        >
                          {updatingOrderIds[ord.id] ? 'Updating...' : 'Mark Served'}
                        </button>
                      )}
                      {ord.status === 'served' && (
                        <button 
                          disabled={updatingOrderIds[ord.id]} 
                          onClick={() => updateOrderMutation.mutate({ orderId: ord.id, status: 'completed' })} 
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded font-bold text-white disabled:opacity-50"
                        >
                          {updatingOrderIds[ord.id] ? 'Updating...' : 'Complete Order'}
                        </button>
                      )}
                      {ord.status === 'completed' && (
                        <span className="px-3 py-1.5 bg-green-950/30 border border-green-800/30 text-green-400 rounded font-bold flex items-center justify-center gap-1">
                          ✓ Completed
                        </span>
                      )}
                      {(ord.payment_status || ord.paymentStatus) !== 'paid' && (
                        <button 
                          disabled={updatingOrderIds[ord.id]} 
                          onClick={() => updateOrderMutation.mutate({ orderId: ord.id, paymentStatus: 'paid' })} 
                          className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded font-bold disabled:opacity-50"
                        >
                          {updatingOrderIds[ord.id] ? '...' : 'Paid'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MENU EDITOR PANEL */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            
            {/* Categories */}
            <div className="glass p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center"><h3 className="font-bold">Menu Sections</h3><button onClick={() => setIsCreatingCategory(!isCreatingCategory)} className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-orange-500 font-bold" style={{ color: settingsColor }}>+ Category</button></div>
              
              {isCreatingCategory && (
                <div className="flex gap-3 items-end p-3 bg-neutral-900/50 rounded border border-neutral-800">
                  <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Category Name" className="bg-neutral-950 px-2 py-1 border border-neutral-800 rounded flex-1" />
                  <button onClick={() => createCategoryMutation.mutate()} className="px-3 py-1 bg-orange-600 font-bold rounded" style={{ backgroundColor: settingsColor }}>Save</button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {categories.map((c: any) => (
                  <div key={c.id} className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center gap-2">
                    <span>{c.name}</span>
                    <button onClick={() => { if(confirm('Remove category?')) deleteCategoryMutation.mutate(c.id); }} className="text-neutral-500 hover:text-orange-500">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Foods */}
            <div className="glass p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center"><h3 className="font-bold">Catalog Entries</h3><button onClick={() => setIsCreatingFood(!isCreatingFood)} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded font-bold text-white" style={{ backgroundColor: settingsColor }}>+ Food Entry</button></div>
              
              {isCreatingFood && (
                <form onSubmit={(e) => { e.preventDefault(); createFoodMutation.mutate(); }} className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" required placeholder="Food Name" value={newFoodName} onChange={(e) => setNewFoodName(e.target.value)} className="bg-neutral-950 border border-neutral-800 px-2 py-1 rounded" />
                    <input type="number" step="0.01" required placeholder="Price" value={newFoodPrice} onChange={(e) => setNewFoodPrice(parseFloat(e.target.value))} className="bg-neutral-950 border border-neutral-800 px-2 py-1 rounded" />
                    <select required value={newFoodCat} onChange={(e) => setNewFoodCat(e.target.value)} className="bg-neutral-950 border border-neutral-800 px-2 py-1 rounded text-neutral-400">
                      <option value="">-- Choose Category --</option>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="number" placeholder="Prep Time (mins)" value={newFoodPrep} onChange={(e) => setNewFoodPrep(parseInt(e.target.value))} className="bg-neutral-950 border border-neutral-800 px-2 py-1 rounded" />
                  </div>
                  <input type="text" placeholder="Image URL" value={newFoodImage} onChange={(e) => setNewFoodImage(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 px-2 py-1 rounded" />
                  <textarea required placeholder="Description" value={newFoodDesc} onChange={(e) => setNewFoodDesc(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 px-2 py-1 rounded" />
                  <button type="submit" className="px-4 py-2 bg-orange-600 font-bold rounded text-white" style={{ backgroundColor: settingsColor }}>Save</button>
                </form>
              )}

              {foods.map((f: any) => (
                <div key={f.id} className="p-3 bg-neutral-900/25 border border-neutral-900 rounded-xl flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    {f.image && <img src={f.image} alt="" className="h-8 w-8 rounded object-cover" />}
                    <div>
                      <h4 className="font-bold">{f.name}</h4>
                      <span className="text-[10px] text-neutral-400">{settingsCurrency}{Number(f.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleFoodMutation.mutate({ id: f.id, isAvailable: !(f.is_available ?? f.isAvailable) })} className={`px-2.5 py-1 rounded border text-[10px] font-bold ${(f.is_available ?? f.isAvailable) ? 'text-green-400 border-green-500/20' : 'text-neutral-500'}`}>
                      {(f.is_available ?? f.isAvailable) ? 'Available' : 'Sold Out'}
                    </button>
                    <button onClick={() => deleteFoodMutation.mutate(f.id)} className="text-neutral-500 hover:text-orange-500">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TABLES & QR PANEL */}
        {activeTab === 'tables' && (
          <div className="glass p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Dining Locations</h3>
              <button 
                onClick={() => setIsCreatingTable(!isCreatingTable)} 
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded font-bold text-white transition duration-200" 
                style={{ backgroundColor: settingsColor }}
              >
                {isCreatingTable ? 'Cancel' : '+ Add Table'}
              </button>
            </div>
            
            {isCreatingTable && (
              <div className="flex gap-3 items-end p-3 bg-neutral-900/50 rounded border border-neutral-800 animate-fade-in">
                <input 
                  type="text" 
                  value={newTableNum} 
                  onChange={(e) => setNewTableNum(e.target.value)} 
                  placeholder="Table Number (e.g. 5)" 
                  className="bg-neutral-950 px-3 py-1.5 border border-neutral-800 rounded flex-1 text-sm text-neutral-100 animate-pulse" 
                />
                <button 
                  onClick={() => createTableMutation.mutate()} 
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 font-bold rounded text-sm text-white" 
                  style={{ backgroundColor: settingsColor }}
                >
                  Save
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tables.map((t: any) => {
                const isEditing = editingTableId === t.id;
                
                return (
                  <div key={t.id} className="p-3.5 bg-neutral-900/20 border border-neutral-900 rounded-xl flex justify-between items-center">
                    {isEditing ? (
                      <div className="flex gap-2 items-center flex-1 mr-4">
                        <input 
                          type="text" 
                          value={editingTableNum} 
                          onChange={(e) => setEditingTableNum(e.target.value)} 
                          className="bg-neutral-950 px-2 py-1 border border-neutral-800 rounded text-sm text-neutral-100 w-24" 
                        />
                        <button 
                          onClick={() => updateTableMutation.mutate({ tableId: t.id, number: editingTableNum })}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 font-bold rounded text-xs text-white"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => { setEditingTableId(''); setEditingTableNum(''); }}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 font-bold rounded text-xs text-neutral-450"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold">Table {t.number}</span>
                        <button 
                          onClick={() => { setEditingTableId(t.id); setEditingTableNum(t.number); }}
                          className="text-[10px] text-neutral-500 hover:text-neutral-350 font-bold uppercase tracking-wider pl-1.5"
                        >
                          Rename
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <a href={`/api/qr?tableId=${t.id}&format=png`} target="_blank" className="h-8 w-8 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded flex items-center justify-center text-neutral-400 hover:text-white" title="Download QR PNG"><Download size={12} /></a>
                      <a href={`/api/qr?tableId=${t.id}&format=pdf`} className="h-8 w-8 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded flex items-center justify-center text-neutral-400 hover:text-white" title="Print QR PDF"><Printer size={12} /></a>
                      <button 
                        onClick={() => { if(confirm(`Delete Table ${t.number}?`)) deleteTableMutation.mutate(t.id); }} 
                        className="h-8 w-8 bg-neutral-900 hover:bg-red-950/20 hover:border-red-900/30 border border-neutral-850 rounded flex items-center justify-center text-neutral-500 hover:text-red-500 transition" 
                        title="Remove Table"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* COUPONS PANEL */}
        {activeTab === 'coupons' && (
          <div className="glass p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold">Active Campaigns</h3><button onClick={() => setIsCreatingCoupon(!isCreatingCoupon)} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded font-bold text-white" style={{ backgroundColor: settingsColor }}>+ Coupon</button></div>
            
            {isCreatingCoupon && (
              <form onSubmit={(e) => { e.preventDefault(); createCouponMutation.mutate(); }} className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" required placeholder="CODE" value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())} className="bg-neutral-950 border border-neutral-800 px-2 py-1 rounded" />
                  <input type="number" required placeholder="Value" value={newCouponVal} onChange={(e) => setNewCouponVal(parseFloat(e.target.value))} className="bg-neutral-950 border border-neutral-800 px-2 py-1 rounded" />
                  <select value={newCouponType} onChange={(e) => setNewCouponType(e.target.value as any)} className="bg-neutral-950 border border-neutral-800 px-2 py-1 rounded text-neutral-400">
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat ({settingsCurrency})</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Min spend" value={newCouponMin} onChange={(e) => setNewCouponMin(parseFloat(e.target.value))} className="bg-neutral-950 border border-neutral-800 px-2 py-1 rounded" />
                  <input type="date" required value={newCouponExpiry} onChange={(e) => setNewCouponExpiry(e.target.value)} className="bg-neutral-950 border border-neutral-800 px-2 py-1 rounded text-neutral-400" />
                </div>
                <button type="submit" className="px-4 py-2 bg-orange-600 font-bold rounded text-white" style={{ backgroundColor: settingsColor }}>Save</button>
              </form>
            )}

            {coupons.map((c: any) => (
              <div key={c.id} className="p-3 bg-neutral-900/25 border border-neutral-900 rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-black bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded text-[9px] text-orange-500" style={{ color: settingsColor, borderColor: settingsColor }}>{c.code}</span>
                  <p className="text-[10px] text-neutral-400 mt-1">Get {c.value}{c.type === 'percentage' ? '%' : settingsCurrency} off • Min Spend: {settingsCurrency}{c.minOrderAmount || c.min_order_amount} • Expire: {new Date(c.expiryDate || c.expiry_date).toLocaleDateString()}</p>
                </div>
                <button onClick={() => deleteCouponMutation.mutate(c.id)} className="text-neutral-500 hover:text-orange-500">✕</button>
              </div>
            ))}
          </div>
        )}

        {/* INVENTORY PANEL */}
        {activeTab === 'inventory' && (
          <div className="glass p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Stock Inventory</h3>
              <button onClick={() => setIsCreatingStock(!isCreatingStock)} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded font-bold text-white" style={{ backgroundColor: settingsColor }}>+ Add Ingredient</button>
            </div>
            
            {isCreatingStock && (
              <form onSubmit={(e) => { e.preventDefault(); createStockMutation.mutate(); }} className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" required placeholder="Ingredient Name" value={newStockName} onChange={(e) => setNewStockName(e.target.value)} className="bg-neutral-950 border border-neutral-800 px-2 py-1 rounded" />
                  <input type="number" step="0.1" required placeholder="Initial Qty" value={newStockQty} onChange={(e) => setNewStockQty(parseFloat(e.target.value))} className="bg-neutral-950 border border-neutral-800 px-2 py-1 rounded" />
                  <input type="text" placeholder="Unit (e.g. kg, liters)" value={newStockUnit} onChange={(e) => setNewStockUnit(e.target.value)} className="bg-neutral-950 border border-neutral-800 px-2 py-1 rounded" />
                  <input type="number" placeholder="Alert threshold" value={newStockMin} onChange={(e) => setNewStockMin(parseFloat(e.target.value))} className="bg-neutral-950 border border-neutral-800 px-2 py-1 rounded" />
                </div>
                <button type="submit" className="px-4 py-2 bg-orange-600 font-bold rounded text-white" style={{ backgroundColor: settingsColor }}>Save</button>
              </form>
            )}

            <div className="space-y-2">
              {inventory.map((item: any) => {
                const isLow = Number(item.quantity) <= Number(item.min_threshold || item.minThreshold);
                return (
                  <div key={item.id} className="p-3 bg-neutral-900/20 border border-neutral-900 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {isLow && <AlertTriangle className="text-amber-500 shrink-0" size={14} />}
                      <div>
                        <h4 className="font-bold text-neutral-200">{item.item_name || item.itemName}</h4>
                        <span className="text-[10px] text-neutral-500">Threshold: {item.min_threshold || item.minThreshold} {item.unit}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-black ${isLow ? 'text-amber-500' : 'text-green-400'}`}>{item.quantity} {item.unit}</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => adjustStockMutation.mutate({ id: item.id, quantity: Number(item.quantity) + 1 })} className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-bold text-white hover:bg-neutral-800">+</button>
                        <button onClick={() => adjustStockMutation.mutate({ id: item.id, quantity: Math.max(0, Number(item.quantity) - 1) })} className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-bold text-white hover:bg-neutral-800">-</button>
                        <button onClick={() => deleteStockMutation.mutate(item.id)} className="text-neutral-500 hover:text-orange-500 ml-2">✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ANALYTICS PANEL */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="font-bold text-sm uppercase tracking-wider">Advanced Cafe Analytics</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="glass p-5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-neutral-500">Total Lifetime Sales</span>
                <p className="text-2xl font-black text-orange-500 mt-2" style={{ color: settingsColor }}>{settingsCurrency}{totalRevenue.toFixed(2)}</p>
              </div>
              <div className="glass p-5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-neutral-500">Average Order Value (AOV)</span>
                <p className="text-2xl font-black text-white mt-2">{settingsCurrency}{averageOrderValue}</p>
              </div>
              <div className="glass p-5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-neutral-500">Total Orders Placed</span>
                <p className="text-2xl font-black text-white mt-2">{totalOrdersCount} orders</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Orders by table chart */}
              <div className="glass p-5 rounded-2xl space-y-4">
                <h4 className="font-bold">Total Orders By Table</h4>
                <div className="space-y-2">
                  {Object.entries(tableOrderCounts).map(([tableNum, count]) => (
                    <div key={tableNum} className="flex justify-between items-center py-1.5 border-b border-neutral-900 last:border-0">
                      <span className="font-bold">Table {tableNum}</span>
                      <span className="px-2.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-white font-bold">{count} orders</span>
                    </div>
                  ))}
                  {Object.keys(tableOrderCounts).length === 0 && (
                    <p className="text-neutral-500 py-4 text-center">No table orders recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Orders by time period */}
              <div className="glass p-5 rounded-2xl space-y-4">
                <h4 className="font-bold">Busy Dine-In Hours</h4>
                <div className="space-y-2">
                  {Object.entries(ordersByTimeMap).map(([period, count]) => (
                    <div key={period} className="flex justify-between items-center py-1.5 border-b border-neutral-900 last:border-0">
                      <span>{period} (6AM-12PM / 12-5PM / 5-10PM / 10PM+)</span>
                      <span className="font-bold text-orange-500" style={{ color: settingsColor }}>{count} orders</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SETTINGS PANEL */}
        {activeTab === 'settings' && (
          <div className="glass p-6 rounded-2xl space-y-5">
            <h3 className="font-bold text-sm uppercase tracking-wider border-b border-neutral-900 pb-3">Cafe Profile Settings</h3>
            
            <form onSubmit={(e) => { e.preventDefault(); updateSettingsMutation.mutate(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500">Cafe Name</label>
                  <input type="text" required value={settingsName} onChange={(e) => setSettingsName(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500">Opening Hours</label>
                  <input type="text" required value={settingsHours} onChange={(e) => setSettingsHours(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500">Street Address</label>
                <input type="text" required value={settingsAddress} onChange={(e) => setSettingsAddress(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500">Contact Phone</label>
                  <input type="text" value={settingsPhone} onChange={(e) => setSettingsPhone(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500">Contact Email</label>
                  <input type="email" value={settingsEmail} onChange={(e) => setSettingsEmail(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500">Logo Image URL</label>
                  <input type="text" value={settingsLogo} onChange={(e) => setSettingsLogo(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500">Banner Background URL</label>
                  <input type="text" value={settingsBanner} onChange={(e) => setSettingsBanner(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500">Tax Percentage (%)</label>
                  <input type="number" step="0.1" value={settingsTax} onChange={(e) => setSettingsTax(parseFloat(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500">Service Charge (%)</label>
                  <input type="number" step="0.1" value={settingsService} onChange={(e) => setSettingsService(parseFloat(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500">Currency Symbol</label>
                  <input type="text" value={settingsCurrency} onChange={(e) => setSettingsCurrency(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-center" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-neutral-500 block">Theme Accent Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={settingsColor} onChange={(e) => setSettingsColor(e.target.value)} className="h-8 w-16 bg-neutral-950 border border-neutral-800 rounded cursor-pointer" />
                  <span className="font-bold">{settingsColor}</span>
                </div>
              </div>

              <button type="submit" disabled={updateSettingsMutation.isPending} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition shadow" style={{ backgroundColor: settingsColor }}>
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings Changes'}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
