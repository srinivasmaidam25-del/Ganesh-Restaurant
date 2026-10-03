'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isDemoMode, supabase } from '@/utils/supabaseClient';
import { mockDb } from '@/utils/mockDb';
import { useCart } from '@/context/CartContext';
import { 
  Search, Clock, MapPin, Phone, Mail, 
  ShoppingBag, Loader2, Compass, 
  MessageSquare, Info, Tag, Shield, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

type TabType = 'menu' | 'cart' | 'offers' | 'reviews' | 'info' | 'orders';

interface CustomerMenuProps {
  slug?: string;
}

export default function CustomerMenu({ slug }: CustomerMenuProps) {
  const params = useParams() as { restaurantSlug?: string };
  const restaurantSlug = slug || params.restaurantSlug || 'la-piazza';
  const router = useRouter();
  const queryClient = useQueryClient();
  const { 
    cartItems, tableId, tableNumber, notes, addToCart, 
    updateQuantity, removeFromCart, getCartTotals, coupon, applyCoupon, clearCart, updateItemNotes, setTableDetails
  } = useCart();

  // Active Bottom Navigation Tab
  const [activeTab, setActiveTab] = useState<TabType>('menu');

  // Dynamic query parameter detection for ?table=3 as a backup redirect path
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get('table') || params.get('tableNumber');
      if (tableParam) {
        const autoResolveTable = async () => {
          try {
            console.log(`[QR-Scan] QR scanned detected with table number: ${tableParam}`);
            let list: any[] = [];
            if (isDemoMode) {
              list = mockDb.getTables();
            } else {
              const { data } = await supabase.from('tables').select('*');
              list = data || [];
            }
            const match = list.find(t => t.number.toLowerCase() === tableParam.toLowerCase());
            if (match) {
              setTableDetails(match.id, match.number);
              console.log(`[QR-Scan] Table detected and validated: Table ${match.number}`);
            } else {
              console.error(`[QR-Scan] Invalid QR code scanned. Table number ${tableParam} does not exist.`);
            }
          } catch (e) {
            console.error('[QR-Scan] Error mapping table:', e);
          }
        };
        autoResolveTable();
      }
    }
  }, [setTableDetails]);

  // Validate that tableId is a valid UUID in live mode to avoid PostgreSQL type casting crashes
  useEffect(() => {
    if (!isDemoMode && tableId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(tableId)) {
        console.warn(`[QR-Validation] Stale non-UUID table ID detected: "${tableId}". Resetting table context.`);
        setTableDetails('', '');
      }
    }
  }, [tableId, isDemoMode, setTableDetails]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [bestsellerFilter, setBestsellerFilter] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  
  // Promotion Coupon validation state
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  
  // Checkout form
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'stripe' | 'razorpay'>('cash');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentSimulating, setPaymentSimulating] = useState(false);

  // Customer Login & Order History states
  const [loggedInPhone, setLoggedInPhone] = useState<string | null>(null);
  const [loginInputPhone, setLoginInputPhone] = useState('');
  const [loginError, setLoginError] = useState('');

  // Hydrate loggedInPhone from localStorage safely on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('customerPhone');
      if (stored) {
        setLoggedInPhone(stored);
      }
    }
  }, []);

  // Pre-fill checkout phone if logged in
  useEffect(() => {
    if (loggedInPhone) {
      setCheckoutPhone(loggedInPhone);
    }
  }, [loggedInPhone]);

  // Review states
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Helper to auto-seed the database if tables are created but empty
  const seedSupabaseFromMockDb = async () => {
    try {
      console.log('[Auto-Seed] Empty database detected. Seeding default data...');
      
      const defaultRestaurant = {
        id: 'e29d7fa1-3211-477b-8919-450f63d274ff',
        name: 'La Piazza Restaurant',
        slug: 'la-piazza',
        address: '12, Connaught Place, New Delhi, India',
        banner: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
        logo: 'https://i.postimg.cc/4mVbnxjj/Chat-GPT-Image-Jul-29-2026-12-22-54-PM.png',
        contact_phone: '+91 98765 43210',
        contact_email: 'info@lapiazza.com',
        tax_percentage: 5.0,
        service_charge: 2.0,
        currency: '₹',
        theme: { primaryColor: '#EA580C', isDarkDefault: true }
      };
      
      await supabase.from('restaurants').insert([defaultRestaurant]);
      
      const defaultTables = [
        { restaurant_id: defaultRestaurant.id, number: '1', status: 'active' },
        { restaurant_id: defaultRestaurant.id, number: '2', status: 'active' },
        { restaurant_id: defaultRestaurant.id, number: '3', status: 'active' },
        { restaurant_id: defaultRestaurant.id, number: '4', status: 'active' },
        { restaurant_id: defaultRestaurant.id, number: '5', status: 'active' }
      ];
      await supabase.from('tables').insert(defaultTables);
      
      const defaultCategories = [
        { id: 'a123f1a1-cf0b-411a-85d0-998fde03a8d1', restaurant_id: defaultRestaurant.id, name: 'Starters', order_index: 1 },
        { id: 'a123f2b2-df1c-422b-96e1-998fde03a8d2', restaurant_id: defaultRestaurant.id, name: 'Curry Mains', order_index: 2 },
        { id: 'a123f3c3-ef2d-433c-97f2-998fde03a8d3', restaurant_id: defaultRestaurant.id, name: 'Breads & Rice', order_index: 3 },
        { id: 'a123f4d4-ff3e-444d-9803-998fde03a8d4', restaurant_id: defaultRestaurant.id, name: 'Desserts & Drinks', order_index: 4 }
      ];
      await supabase.from('categories').insert(defaultCategories);
      
      const defaultFoods = [
        {
          restaurant_id: defaultRestaurant.id,
          category_id: 'a123f1a1-cf0b-411a-85d0-998fde03a8d1',
          name: 'Samosa Chaat',
          description: 'Crispy vegetable samosas crushed and topped with warm spiced chickpeas, yogurt, sweet and tangy tamarind-mint chutneys.',
          price: 120.00,
          is_veg: true,
          is_non_veg: false,
          rating: 4.8,
          prep_time: 10,
          image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600',
          ingredients: ['Flour', 'Potatoes', 'Chickpeas', 'Yogurt', 'Chutney'],
          spicy_level: 'medium'
        },
        {
          restaurant_id: defaultRestaurant.id,
          category_id: 'a123f2b2-df1c-422b-96e1-998fde03a8d2',
          name: 'Butter Chicken',
          description: 'Tender chicken tikka cooked in a rich, creamy, buttery tomato-based sauce, seasoned with traditional spices and fenugreek leaves.',
          price: 320.00,
          is_veg: false,
          is_non_veg: true,
          rating: 4.9,
          prep_time: 15,
          image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=600',
          ingredients: ['Chicken', 'Butter', 'Cream', 'Tomato', 'Spices'],
          spicy_level: 'low'
        },
        {
          restaurant_id: defaultRestaurant.id,
          category_id: 'a123f3c3-ef2d-433c-97f2-998fde03a8d3',
          name: 'Garlic Butter Naan',
          description: 'Fresh leavened wheat bread baked in tandoor, brushed with warm butter and loaded with minced garlic and herbs.',
          price: 80.00,
          is_veg: true,
          is_non_veg: false,
          rating: 4.9,
          prep_time: 5,
          image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600',
          ingredients: ['Flour', 'Butter', 'Garlic', 'Coriander'],
          spicy_level: 'none'
        },
        {
          restaurant_id: defaultRestaurant.id,
          category_id: 'a123f4d4-ff3e-444d-9803-998fde03a8d4',
          name: 'Sweet Mango Lassi',
          description: 'Traditional sweet yogurt drink blended with fresh Alphonso mango pulp and cardamom.',
          price: 120.00,
          is_veg: true,
          is_non_veg: false,
          rating: 4.8,
          prep_time: 4,
          image: 'https://images.unsplash.com/photo-1571006682864-7407852ee318?auto=format&fit=crop&q=80&w=600',
          ingredients: ['Yogurt', 'Mango', 'Sugar', 'Cardamom'],
          spicy_level: 'none'
        }
      ];
      await supabase.from('foods').insert(defaultFoods);
      
      const defaultCoupons = [
        { restaurant_id: defaultRestaurant.id, code: 'WELCOME50', type: 'flat', value: 50.00, min_order_amount: 300.00, expiry_date: '2026-12-31' },
        { restaurant_id: defaultRestaurant.id, code: 'FESTIVE15', type: 'percentage', value: 15.00, min_order_amount: 500.00, expiry_date: '2026-12-31' }
      ];
      await supabase.from('coupons').insert(defaultCoupons);
      
      const defaultInventory = [
        { restaurant_id: defaultRestaurant.id, item_name: 'Paneer Cottage Cheese', quantity: 25.5, unit: 'kg', min_threshold: 10.0 },
        { restaurant_id: defaultRestaurant.id, item_name: 'Chicken Breast halves', quantity: 15.0, unit: 'kg', min_threshold: 5.0 },
        { restaurant_id: defaultRestaurant.id, item_name: 'Basmati Rice grains', quantity: 4.5, unit: 'kg', min_threshold: 8.0 }
      ];
      await supabase.from('inventory').insert(defaultInventory);
      console.log('[Auto-Seed] Database auto-seeded successfully!');
    } catch (e) {
      console.error('[Auto-Seed] Error seeding database:', e);
    }
  };

  // 1. Fetch Restaurant Settings
  const { data: resData, isLoading: isRestaurantLoading } = useQuery({
    queryKey: ['restaurant', restaurantSlug],
    queryFn: async () => {
      if (isDemoMode) {
        return mockDb.restaurant;
      }
      try {
        // Query by slug
        let { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', restaurantSlug.toLowerCase())
          .maybeSingle();

        if (error || !data) {
          // Fallback: pick first restaurant in database
          const { data: list, error: listErr } = await supabase
            .from('restaurants')
            .select('*')
            .limit(1);
          
          if (list && list.length > 0) {
            data = list[0];
          } else {
            // DATABASE IS EMPTY! Trigger auto-seed!
            await seedSupabaseFromMockDb();
            const { data: retryList } = await supabase
              .from('restaurants')
              .select('*')
              .limit(1);
            if (retryList && retryList.length > 0) {
              data = retryList[0];
            } else {
              return mockDb.restaurant;
            }
          }
        }
        return data || mockDb.restaurant;
      } catch (err) {
        console.error('Error fetching restaurant menu settings:', err);
        return mockDb.restaurant;
      }
    }
  });

  const restaurantId = resData?.id;

  // 2. Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', restaurantId],
    queryFn: async () => {
      if (isDemoMode || !restaurantId || restaurantId.startsWith('rest-')) {
        return mockDb.getCategories();
      }
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true)
          .order('order_index');
        if (error || !data) throw error || new Error('No categories data returned');
        return data;
      } catch (err) {
        console.error('Error fetching categories, falling back to mock:', err);
        return mockDb.getCategories();
      }
    },
    enabled: !!restaurantId
  });

  // 3. Fetch Foods
  const { data: foods = [], isLoading: isFoodsLoading } = useQuery({
    queryKey: ['foods', restaurantId, selectedCategory, searchTerm, vegFilter, bestsellerFilter, sortBy],
    queryFn: async () => {
      if (isDemoMode || !restaurantId || restaurantId.startsWith('rest-')) {
        let list = mockDb.getFoods();
        if (selectedCategory) list = list.filter(f => f.categoryId === selectedCategory);
        if (searchTerm) list = list.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (vegFilter === 'veg') list = list.filter(f => f.isVeg);
        if (vegFilter === 'non-veg') list = list.filter(f => !f.isVeg);
        if (bestsellerFilter) list = list.filter(f => f.isBestseller);

        if (sortBy === 'priceLowHigh') list.sort((a, b) => a.price - b.price);
        else if (sortBy === 'priceHighLow') list.sort((a, b) => b.price - a.price);
        else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
        else if (sortBy === 'prepTime') list.sort((a, b) => a.prepTime - b.prepTime);
        return list;
      }

      try {
        let query = supabase.from('foods').select('*, categories(name)').eq('restaurant_id', restaurantId);
        if (selectedCategory) query = query.eq('category_id', selectedCategory);
        if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
        if (vegFilter === 'veg') query = query.eq('is_veg', true);
        if (vegFilter === 'non-veg') query = query.eq('is_veg', false);
        if (bestsellerFilter) query = query.eq('is_bestseller', true);

        if (sortBy === 'priceLowHigh') query = query.order('price', { ascending: true });
        else if (sortBy === 'priceHighLow') query = query.order('price', { ascending: false });
        else if (sortBy === 'rating') query = query.order('rating', { ascending: false });
        else if (sortBy === 'prepTime') query = query.order('prep_time', { ascending: true });

        const { data, error } = await query;
        if (error || !data) throw error || new Error('No foods data returned');
        return data;
      } catch (err) {
        console.error('Error fetching foods, falling back to mock:', err);
        let list = mockDb.getFoods();
        if (selectedCategory) list = list.filter(f => f.categoryId === selectedCategory);
        if (searchTerm) list = list.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (vegFilter === 'veg') list = list.filter(f => f.isVeg);
        if (vegFilter === 'non-veg') list = list.filter(f => !f.isVeg);
        if (bestsellerFilter) list = list.filter(f => f.isBestseller);

        if (sortBy === 'priceLowHigh') list.sort((a, b) => a.price - b.price);
        else if (sortBy === 'priceHighLow') list.sort((a, b) => b.price - a.price);
        else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
        else if (sortBy === 'prepTime') list.sort((a, b) => a.prepTime - b.prepTime);
        return list;
      }
    },
    enabled: !!restaurantId
  });

  // 4. Fetch Coupons
  const { data: coupons = [] } = useQuery({
    queryKey: ['coupons', restaurantId],
    queryFn: async () => {
      if (isDemoMode || !restaurantId || restaurantId.startsWith('rest-')) {
        return mockDb.getCoupons();
      }
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true);
        if (error || !data) throw error || new Error('No coupons data returned');
        return data;
      } catch (err) {
        console.error('Error fetching coupons, falling back to mock:', err);
        return mockDb.getCoupons();
      }
    },
    enabled: !!restaurantId
  });

  // 5. Fetch Reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', restaurantId],
    queryFn: async () => {
      if (isDemoMode || !restaurantId || restaurantId.startsWith('rest-')) {
        return mockDb.getReviews();
      }
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false });
        if (error || !data) throw error || new Error('No reviews data returned');
        return data;
      } catch (err) {
        console.error('Error fetching reviews, falling back to mock:', err);
        return mockDb.getReviews();
      }
    },
    enabled: !!restaurantId
  });

  // 6. Fetch Customer Order History
  const { data: customerOrders = [], isLoading: isLoadingCustomerOrders } = useQuery({
    queryKey: ['customerOrders', restaurantId, loggedInPhone],
    queryFn: async () => {
      if (!loggedInPhone || !restaurantId) return [];
      if (isDemoMode || restaurantId.startsWith('rest-')) {
        return mockDb.getOrders()
          .filter(o => o.customerPhone === loggedInPhone)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('customer_phone', loggedInPhone)
          .order('created_at', { ascending: false });
        if (error || !data) throw error || new Error('No orders data returned');
        return data || [];
      } catch (err) {
        console.error('Error fetching customer orders, falling back to mock:', err);
        return mockDb.getOrders()
          .filter(o => o.customerPhone === loggedInPhone)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    },
    enabled: !!restaurantId && !!loggedInPhone
  });

  // Basket totals
  const { subTotal, discount, tax, serviceCharge, total } = getCartTotals(
    resData?.tax_percentage || 5,
    resData?.service_charge || 2
  );

  const handleApplyCoupon = async (code: string) => {
    try {
      setCouponError('');
      if (isDemoMode) {
        const c = mockDb.getCoupons().find(x => x.code === code.toUpperCase());
        if (!c) {
          setCouponError('Invalid coupon code');
          return;
        }
        if (subTotal < c.minOrderAmount) {
          setCouponError(`Min order size of ₹${c.minOrderAmount} is required.`);
          return;
        }
        const val = c.type === 'percentage' ? (subTotal * c.value) / 100 : c.value;
        applyCoupon({ code: c.code, type: c.type, value: c.value, discountAmount: val, minOrderAmount: c.minOrderAmount });
        setCouponInput('');
        return;
      }

      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setCouponError('Coupon not found or inactive');
        return;
      }
      if (subTotal < data.min_order_amount) {
        setCouponError(`Min spend of ₹${data.min_order_amount} required.`);
        return;
      }
      const discAmt = data.type === 'percentage' ? (subTotal * data.value) / 100 : data.value;
      applyCoupon({ code: data.code, type: data.type, value: data.value, discountAmount: discAmt, minOrderAmount: data.min_order_amount });
      setCouponInput('');
    } catch {
      setCouponError('Error applying promo code');
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;
    setIsSubmittingReview(true);
    try {
      if (isDemoMode || !restaurantId || restaurantId.startsWith('rest-')) {
        mockDb.createReview(reviewName, reviewRating, reviewComment);
      } else {
        try {
          await supabase.from('reviews').insert([{
            restaurant_id: restaurantId,
            customer_name: reviewName,
            rating: reviewRating,
            comment: reviewComment
          }]);
        } catch (err) {
          console.error('Error posting review to Supabase, falling back to mock:', err);
          mockDb.createReview(reviewName, reviewRating, reviewComment);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['reviews', restaurantId] });
      setReviewName('');
      setReviewComment('');
      setIsReviewOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName) return;

    const cleanPhone = checkoutPhone.replace(/\D/g, '');
    if (!checkoutPhone) {
      alert('Please enter your phone number.');
      return;
    }
    if (cleanPhone.length !== 10) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      let order: any = null;

      if (isDemoMode || !restaurantId || restaurantId.startsWith('rest-')) {
        order = mockDb.createOrder({
          tableNumber,
          customerName: checkoutName,
          customerPhone: checkoutPhone,
          items: cartItems.map(i => ({ foodId: i.foodId, name: i.name, price: i.price, quantity: i.quantity, notes: i.notes })),
          subTotal,
          tax,
          serviceCharge,
          discount,
          total,
          paymentMethod,
          notes,
          loyaltyPointsEarned: Math.floor(total / 10)
        });

        if (paymentMethod !== 'cash') {
          setPaymentSimulating(true);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } else {
        try {
          const { data, error } = await supabase
            .from('orders')
            .insert([{
              restaurant_id: restaurantId,
              table_id: tableId || null,
              table_number: tableNumber,
              customer_name: checkoutName,
              customer_phone: checkoutPhone,
              customer_email: checkoutEmail,
              items: cartItems,
              sub_total: subTotal,
              tax,
              service_charge: serviceCharge,
              discount,
              total,
              payment_method: paymentMethod,
              payment_status: 'pending',
              status: 'received',
              notes,
              loyalty_points_earned: Math.floor(total / 10)
            }])
            .select()
            .single();

          if (error) throw error;
          order = data;

          if (paymentMethod !== 'cash') {
            setPaymentSimulating(true);
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } catch (err) {
          console.error('Error placing order in Supabase, falling back to mock:', err);
          order = mockDb.createOrder({
            tableNumber,
            customerName: checkoutName,
            customerPhone: checkoutPhone,
            items: cartItems.map(i => ({ foodId: i.foodId, name: i.name, price: i.price, quantity: i.quantity, notes: i.notes })),
            subTotal,
            tax,
            serviceCharge,
            discount,
            total,
            paymentMethod,
            notes,
            loyaltyPointsEarned: Math.floor(total / 10)
          });

          if (paymentMethod !== 'cash') {
            setPaymentSimulating(true);
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Auto-login if not logged in
      if (!loggedInPhone && checkoutPhone) {
        localStorage.setItem('customerPhone', checkoutPhone);
        setLoggedInPhone(checkoutPhone);
      }
      // Invalidate customer orders query to fetch the new order in history
      const activePhone = loggedInPhone || checkoutPhone;
      if (activePhone) {
        queryClient.invalidateQueries({ queryKey: ['customerOrders', restaurantId, activePhone] });
      }

      clearCart();
      setActiveTab('menu');

      // Routing logic: dynamic route or root route depending on slug parameter
      const trackPath = slug ? `/track/${order.id}` : `/r/${restaurantSlug}/track/${order.id}`;
      router.push(trackPath);
    } catch (err: any) {
      console.error(err);
      alert(`Order placement failed: ${err.message || err}`);
    } finally {
      setIsPlacingOrder(false);
      setPaymentSimulating(false);
    }
  };

  if (isRestaurantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </div>
    );
  }

  // Fail-safe helper if database is completely empty (no seeded restaurant yet)
  if (!resData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 p-4 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="glass max-w-md w-full p-8 rounded-3xl relative space-y-6">
          <div className="h-16 w-16 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto text-3xl font-extrabold animate-pulse">
            ⚠️
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">Database Setup Required</h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              We connected to Supabase successfully, but no restaurant profile was found. Please seed the database schema to initialize default configurations and dining tables.
            </p>
          </div>
          <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-850 text-left space-y-2">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider block">Quick Setup Guide</span>
            <p className="text-[10px] text-neutral-450 leading-relaxed">
              1. Copy the contents of <code className="text-neutral-300 bg-neutral-950 px-1 py-0.5 rounded font-mono">supabase-schema.sql</code>.
            </p>
            <p className="text-[10px] text-neutral-450 leading-relaxed">
              2. Run the script in the **SQL Editor** of your Supabase Dashboard to populate default dining tables, foods, and categories.
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition text-xs"
          >
            I have run the SQL, Reload Website
          </button>
        </div>
      </div>
    );
  }

  const primaryColor = resData?.theme?.primaryColor || '#EA580C';
  const currencySymbol = resData?.currency || '₹';

  const rawBanner = resData?.banner || 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=1200';
  const bannerUrl = (rawBanner.includes('photo-1555396273-367ea4eb4db5') || rawBanner.includes('photo-1563379091339-03b21ab4a4f8') || rawBanner.includes('photo-1633945274405-b6c8069047b0'))
    ? 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=1200'
    : rawBanner;

  return (
    <div className="relative min-h-screen text-neutral-100">
      {/* Background Image Container */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ 
          backgroundImage: `url('https://img.magnific.com/premium-photo/poster-restaurant-called-food_862462-21500.jpg')`,
        }}
      />
      {/* Dark tint overlay */}
      <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-[3px] z-0" />

      {/* Main Content (Scrollable) */}
      <div className="flex flex-col min-h-screen pb-20 relative z-10">
        
        {/* 1. APP COMPACT HEADER */}
        <div 
          className="h-32 w-full relative bg-cover bg-center border-b border-neutral-900" 
          style={{ backgroundImage: `url('${bannerUrl}')` }}
        >
          <div className="absolute inset-0 bg-neutral-950/70" />
          
          <div className="absolute inset-0 flex items-center justify-between px-4 pt-2">
          <div className="flex items-center gap-3">
            {resData?.logo ? (
              <img 
                src={resData.logo} 
                alt="logo" 
                className="h-14 w-14 rounded-2xl object-contain p-1.5 bg-white border border-neutral-850 shadow-md shrink-0 animate-fade-in"
              />
            ) : (
              <div className="h-14 w-14 rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-500 flex items-center justify-center font-black text-xl shadow-md shrink-0">
                {(resData?.name || 'R')[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-sm font-black text-white leading-tight">{resData?.name}</h1>
              <p className="text-[9px] text-neutral-400 mt-0.5 flex items-center gap-1">
                <MapPin size={9} className="text-orange-500" /> {(resData?.address || '').substring(0, 30)}...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tableNumber && (
              <span className="px-2.5 py-1 bg-orange-600/90 text-white rounded-full font-black text-[9px] uppercase tracking-wider animate-pulse" style={{ backgroundColor: primaryColor }}>
                Table {tableNumber}
              </span>
            )}
            <button
              onClick={() => setActiveTab('orders')}
              className="px-2.5 py-1 rounded-full bg-neutral-900/95 border border-neutral-800 text-white font-black text-[9px] uppercase tracking-wider flex items-center gap-1 hover:bg-neutral-800 transition shadow-lg"
            >
              <span>👤</span>
              <span>{loggedInPhone ? 'My Orders' : 'Log In'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. BODY COMPONENT AREA - SWITCH TAB RENDER */}
      <div className="flex-1 max-w-lg w-full mx-auto px-4 py-5 mb-6">
        <AnimatePresence mode="wait">
          
          {/* ========================================================
              TAB A: MENU CATALOG
              ======================================================== */}
          {activeTab === 'menu' && (
            <motion.div
              key="menu-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Search Bar */}
              <div className="glass p-3 rounded-2xl flex items-center gap-2">
                <Search size={16} className="text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Search delicious dishes..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent flex-1 focus:outline-none text-xs text-neutral-100 placeholder-neutral-500"
                />
              </div>

              {/* Instant Filters */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[10px] font-bold">
                <button 
                  onClick={() => setVegFilter(vegFilter === 'veg' ? 'all' : 'veg')}
                  className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${vegFilter === 'veg' ? 'bg-green-600/20 border-green-500 text-green-400' : 'bg-neutral-900 border-neutral-850 text-neutral-400'}`}
                >
                  🟢 Veg
                </button>
                <button 
                  onClick={() => setVegFilter(vegFilter === 'non-veg' ? 'all' : 'non-veg')}
                  className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${vegFilter === 'non-veg' ? 'bg-red-600/20 border-red-500 text-red-400' : 'bg-neutral-900 border-neutral-850 text-neutral-400'}`}
                >
                  🔴 Non-Veg
                </button>
                <button 
                  onClick={() => setBestsellerFilter(!bestsellerFilter)}
                  className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${bestsellerFilter ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-neutral-900 border-neutral-850 text-neutral-400'}`}
                >
                  ⭐ Bestsellers
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="ml-auto bg-neutral-900 border border-neutral-850 rounded-lg px-2 text-[10px] text-neutral-400 focus:outline-none"
                >
                  <option value="name">Sort: A-Z</option>
                  <option value="priceLowHigh">Price: Low-High</option>
                  <option value="priceHighLow">Price: High-Low</option>
                  <option value="rating">Rating</option>
                  <option value="prepTime">Prep Time</option>
                </select>
              </div>

              {/* Sticky Categories Bar */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 border-b border-neutral-900">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 rounded-xl text-[13px] font-black transition whitespace-nowrap ${!selectedCategory ? 'bg-orange-600 text-white' : 'bg-neutral-900 text-neutral-400'}`}
                >
                  All Items
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-[13px] font-black transition whitespace-nowrap ${selectedCategory === cat.id ? 'bg-orange-600 text-white' : 'bg-neutral-900 text-neutral-400'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Food cards vertical stream */}
              {isFoodsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-32 w-full rounded-2xl bg-neutral-900/50 animate-pulse border border-neutral-850" />
                  ))}
                </div>
              ) : foods.length === 0 ? (
                <div className="text-center py-12 glass rounded-2xl">
                  <p className="text-xs text-neutral-500">No dishes match your preferences.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {foods.map((food: any) => {
                    const cartItem = cartItems.find(i => i.foodId === food.id);
                    return (
                      <div key={food.id} className="glass p-4 rounded-3xl flex gap-4 relative overflow-hidden">
                        
                        {/* Food Image */}
                        <div className={`h-32 w-32 rounded-2xl bg-neutral-900 overflow-hidden flex-shrink-0 relative ${!(food.is_available ?? food.isAvailable) ? 'opacity-40' : ''}`}>
                          {food.image ? (
                            <img src={food.image} alt={food.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-orange-950/10 flex items-center justify-center text-xs font-black text-orange-500">
                              YUMMY
                            </div>
                          )}
                          {food.is_bestseller && (
                            <span className="absolute top-1.5 left-1.5 bg-amber-500 text-neutral-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Popular
                            </span>
                          )}
                          {!(food.is_available ?? food.isAvailable) && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-wider">
                              Sold Out
                            </div>
                          )}
                        </div>

                        {/* Food Info */}
                        <div className="flex flex-col flex-1 min-w-0 justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-neutral-450">
                              <span>{food.is_veg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                                ★ {food.rating}
                              </span>
                              {(food.spicy_level || food.spicyLevel) && (food.spicy_level || food.spicyLevel) !== 'none' && (
                                <>
                                  <span>•</span>
                                  <span className="text-red-500 font-bold">
                                    🌶️ {(food.spicy_level || food.spicyLevel).toUpperCase()}
                                  </span>
                                </>
                              )}
                            </div>
                            <h3 className="font-extrabold text-neutral-100 text-base leading-snug">{food.name}</h3>
                            <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">{food.description}</p>
                          </div>

                          <div className="flex items-end justify-between mt-3.5">
                            <div className="text-xs text-neutral-400 space-y-1">
                              <span className="flex items-center gap-1"><Clock size={12} /> {food.prep_time} mins</span>
                              <span className="text-base font-extrabold text-orange-500 block">{currencySymbol}{Number(food.price).toFixed(2)}</span>
                            </div>

                            {cartItem ? (
                              <div className="flex items-center bg-neutral-900 border border-neutral-850 rounded-xl px-2 py-1 gap-3">
                                <button 
                                  onClick={() => updateQuantity(food.id, cartItem.quantity - 1)}
                                  className="h-6 w-6 rounded bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-300 hover:bg-neutral-700"
                                >
                                  -
                                </button>
                                <span className="text-sm font-bold w-5 text-center">{cartItem.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(food.id, cartItem.quantity + 1)}
                                  className="h-6 w-6 rounded bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-300 hover:bg-neutral-700"
                                >
                                  +
                                </button>
                              </div>
                            ) : (food.is_available ?? food.isAvailable) !== false ? (
                              <button
                                onClick={() => addToCart({
                                  foodId: food.id,
                                  name: food.name,
                                  price: Number(food.price),
                                  image: food.image,
                                  isVeg: food.is_veg,
                                  notes: ''
                                })}
                                className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl transition"
                                style={{ backgroundColor: primaryColor }}
                              >
                                Add
                              </button>
                            ) : (
                              <span className="px-4 py-2 bg-neutral-900 border border-neutral-850 text-neutral-500 font-bold text-xs rounded-xl cursor-not-allowed">
                                Sold Out
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ========================================================
              TAB B: CART & CHECKOUT
              ======================================================== */}
          {activeTab === 'cart' && (
            <motion.div
              key="cart-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {cartItems.length === 0 ? (
                <div className="text-center py-20 glass rounded-3xl space-y-4">
                  <ShoppingBag className="mx-auto text-neutral-600 animate-pulse" size={32} />
                  <p className="text-xs text-neutral-400">Your basket is currently empty.</p>
                  <button 
                    onClick={() => setActiveTab('menu')}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl font-bold text-xs text-white"
                  >
                    Browse Pizzeria Menu
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart Items list */}
                  <div className="space-y-3">
                    <h3 className="font-black text-xs text-neutral-455 uppercase tracking-widest">Basket Items</h3>
                    {cartItems.map((item) => (
                      <div key={item.foodId} className="glass p-3.5 rounded-xl flex gap-3 relative border border-neutral-900">
                        <button 
                          onClick={() => removeFromCart(item.foodId)}
                          className="absolute top-2 right-2 text-neutral-500 hover:text-orange-500 text-xs"
                        >
                          ✕
                        </button>
                        <div className="h-14 w-14 rounded-lg bg-neutral-900 overflow-hidden flex-shrink-0">
                          {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-xs truncate pr-4 text-neutral-200">{item.name}</h4>
                            <span className="text-xs font-black text-orange-500">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1.5">
                            <input
                              type="text"
                              placeholder="Instructions (e.g. less spice)"
                              value={item.notes}
                              onChange={(e) => updateItemNotes(item.foodId, e.target.value)}
                              className="bg-neutral-950 border border-neutral-850 rounded px-1.5 py-0.5 text-[9px] w-2/3 text-neutral-300 placeholder-neutral-600 focus:outline-none"
                            />
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => updateQuantity(item.foodId, item.quantity - 1)} className="h-4.5 w-4.5 rounded bg-neutral-850 flex items-center justify-center text-[10px]">-</button>
                              <span className="text-xs font-bold">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.foodId, item.quantity + 1)} className="h-4.5 w-4.5 rounded bg-neutral-850 flex items-center justify-center text-[10px]">+</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Promo Coupons */}
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-2">Have a Promo Coupon?</span>
                    {coupon ? (
                      subTotal < (coupon.minOrderAmount || 0) ? (
                        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-red-400">{coupon.code} INACTIVE</span>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Add {currencySymbol}{((coupon.minOrderAmount || 0) - subTotal).toFixed(2)} more to activate.</p>
                          </div>
                          <button onClick={() => applyCoupon(null)} className="text-[10px] text-neutral-500 font-bold underline">Remove</button>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-green-400">{coupon.code} APPLIED</span>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Discount: -{currencySymbol}{discount.toFixed(2)}</p>
                          </div>
                          <button onClick={() => applyCoupon(null)} className="text-[10px] text-orange-500 font-bold underline">Remove</button>
                        </div>
                      )
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="ENTER CODE" 
                          value={couponInput} 
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())} 
                          className="flex-1 bg-neutral-900 border border-neutral-850 rounded-xl px-3 py-2 text-xs uppercase"
                        />
                        <button onClick={() => handleApplyCoupon(couponInput)} className="px-4 bg-neutral-850 hover:bg-neutral-800 text-xs font-bold rounded-xl transition">Apply</button>
                      </div>
                    )}
                    {couponError && <p className="text-[9px] text-orange-500 mt-1">{couponError}</p>}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="p-4.5 rounded-2xl bg-neutral-900/40 border border-neutral-900 text-xs space-y-1.5 text-neutral-400">
                    <div className="flex justify-between"><span>Subtotal:</span><span className="text-neutral-200">{currencySymbol}{subTotal.toFixed(2)}</span></div>
                    {discount > 0 && <div className="flex justify-between text-green-400"><span>Discount:</span><span>-{currencySymbol}{discount.toFixed(2)}</span></div>}
                    <div className="flex justify-between"><span>GST ({resData?.tax_percentage || 5}%):</span><span className="text-neutral-200">{currencySymbol}{tax.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Service Charge ({resData?.service_charge || 2}%):</span><span className="text-neutral-200">{currencySymbol}{serviceCharge.toFixed(2)}</span></div>
                    <div className="flex justify-between font-black text-white text-sm border-t border-neutral-900 pt-2.5">
                      <span>Total Invoice:</span>
                      <span className="text-orange-500">{currencySymbol}{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout parameters */}
                  {tableId ? (
                    <div className="glass p-5 rounded-2xl space-y-4">
                      <h4 className="font-extrabold text-neutral-100 text-sm">Customer checkout details</h4>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-neutral-500">Your Name *</label>
                          <input type="text" required value={checkoutName} onChange={(e) => setCheckoutName(e.target.value)} placeholder="Mario Rossi" className="w-full bg-neutral-900 border border-neutral-850 rounded-xl px-3 py-2.5 text-xs focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-neutral-500">Phone Number * (10 digits)</label>
                          <input 
                            type="tel" 
                            required 
                            value={checkoutPhone} 
                            onChange={(e) => setCheckoutPhone(e.target.value)} 
                            placeholder="e.g. 9876543210" 
                            className="w-full bg-neutral-900 border border-neutral-850 rounded-xl px-3 py-2.5 text-xs focus:outline-none" 
                          />
                        </div>

                        {/* Payment modes */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold text-neutral-500 block">Select Payment Mode</label>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <button type="button" onClick={() => setPaymentMethod('cash')} className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-500/10' : 'border-neutral-850'}`}>
                              <span className="font-bold text-neutral-200">💵 Cash</span><span className="text-[8px] text-neutral-500">Pay at counter later</span>
                            </button>
                            <button type="button" onClick={() => setPaymentMethod('upi')} className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 ${paymentMethod === 'upi' ? 'border-orange-500 bg-orange-500/10' : 'border-neutral-850'}`}>
                              <span className="font-bold text-neutral-200">📱 UPI Pay</span><span className="text-[8px] text-neutral-500">GPay, PhonePe, Paytm</span>
                            </button>
                          </div>
                        </div>

                        <button 
                          onClick={handleCheckout}
                          disabled={isPlacingOrder || !checkoutName}
                          className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold transition flex items-center justify-center gap-1.5 shadow"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {paymentSimulating ? <Loader2 className="h-4 w-4 animate-spin" /> : isPlacingOrder ? 'Submitting Order...' : 'Confirm Dine-In Order'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 text-center bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl font-bold leading-relaxed">
                      ⚠️ No dining table scanned! Please scan the QR code located on your table to place kitchen orders.
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ========================================================
              TAB C: OFFERS & DISCOUNTS
              ======================================================== */}
          {activeTab === 'offers' && (
            <motion.div
              key="offers-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <h3 className="font-black text-xs text-neutral-455 uppercase tracking-widest">Active Promotions</h3>
              {coupons.length === 0 ? (
                <p className="text-center text-xs text-neutral-500 py-10">No promotional coupons available right now.</p>
              ) : (
                <div className="space-y-3">
                  {coupons.map((c: any) => (
                    <div key={c.id} className="glass p-5 rounded-3xl relative overflow-hidden border border-neutral-900">
                      <div className="absolute -top-12 -right-12 h-24 w-24 bg-orange-600/10 rounded-full blur-2xl" />
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-black bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded text-xs text-orange-500">{c.code}</span>
                          <h4 className="font-extrabold text-sm text-neutral-200 mt-2">Get {c.value}{c.type === 'percentage' ? '%' : currencySymbol} off</h4>
                          <p className="text-[10px] text-neutral-400 leading-relaxed mt-0.5">Min spend: {currencySymbol}{c.minOrderAmount || c.min_order_amount} • Expiring: {new Date(c.expiryDate || c.expiry_date).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => {
                            const minSpend = c.minOrderAmount || c.min_order_amount || 0;
                            if (subTotal < minSpend) {
                              alert(`Min spend of ${currencySymbol}${minSpend} required to apply this coupon.`);
                              return;
                            }
                            applyCoupon({ 
                              code: c.code, 
                              type: c.type, 
                              value: c.value, 
                              discountAmount: c.type === 'percentage' ? (subTotal * c.value)/100 : c.value,
                              minOrderAmount: minSpend
                            });
                            setActiveTab('cart');
                          }}
                          className="px-3.5 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-orange-500 rounded-xl font-bold text-[10px] text-neutral-200 transition"
                        >
                          Apply Code
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ========================================================
              TAB D: REVIEWS TAB
              ======================================================== */}
          {activeTab === 'reviews' && (
            <motion.div
              key="reviews-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-black text-xs text-neutral-455 uppercase tracking-widest">Customer Reviews</h3>
                <button 
                  onClick={() => setIsReviewOpen(!isReviewOpen)}
                  className="px-3.5 py-1.5 bg-orange-600 font-bold rounded-xl text-[10px] text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Write Review
                </button>
              </div>

              {isReviewOpen && (
                <form onSubmit={handlePostReview} className="p-4 bg-neutral-900/50 border border-neutral-855 rounded-2xl space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-500">Your Name</label>
                    <input type="text" required value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="Mario Rossi" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-500 block">Rating</label>
                    <div className="flex gap-1.5 text-amber-400">
                      {[1,2,3,4,5].map(star => (
                        <button type="button" key={star} onClick={() => setReviewRating(star)} className="focus:outline-none text-xl">
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-500">Review Commentary</label>
                    <textarea required rows={2} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Tiramisu was amazing!" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none" />
                  </div>
                  <button type="submit" disabled={isSubmittingReview} className="w-full py-2 bg-orange-600 text-white font-bold rounded-xl transition" style={{ backgroundColor: primaryColor }}>
                    {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>
              )}

              <div className="space-y-3.5">
                {reviews.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-10">No reviews written yet.</p>
                ) : (
                  reviews.map((r: any) => (
                    <div key={r.id} className="glass p-4 rounded-2xl border border-neutral-900 space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-neutral-200">{r.customer_name || r.customerName}</span>
                        <span className="text-amber-400 font-bold">★ {r.rating}</span>
                      </div>
                      <p className="text-xs text-neutral-455 italic leading-relaxed">"{r.comment}"</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ========================================================
              TAB E: INFO TAB
              ======================================================== */}
          {activeTab === 'info' && (
            <motion.div
              key="info-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <h3 className="font-black text-xs text-neutral-455 uppercase tracking-widest">Restaurant Information</h3>
              
              <div className="glass p-5 rounded-3xl space-y-4 border border-neutral-900">
                <div className="flex items-start gap-3 text-xs leading-relaxed">
                  <MapPin size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-200 block">Address Location</span>
                    <span className="text-neutral-400 mt-1 block">{resData?.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs leading-relaxed">
                  <Clock size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-200 block">Opening Hours</span>
                    <span className="text-neutral-400 mt-1 block">{resData?.opening_hours || resData?.openingHours}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs leading-relaxed">
                  <Phone size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-200 block">Phone Support</span>
                    <span className="text-neutral-400 mt-1 block">{resData?.contact_phone || resData?.contactDetails?.phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs leading-relaxed">
                  <Mail size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-200 block">Email Assistance</span>
                    <span className="text-neutral-400 mt-1 block">{resData?.contact_email || resData?.contactDetails?.email}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================
              TAB F: ORDER HISTORY / CUSTOMER DASHBOARD
              ======================================================== */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders-history-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5 animate-fade-in"
            >
              <h3 className="font-black text-xs text-neutral-450 uppercase tracking-widest">My Order History</h3>

              {!loggedInPhone ? (
                // Customer Login Screen
                <div className="glass p-6 rounded-3xl space-y-5 border border-neutral-900 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto text-2xl font-bold" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                    🔑
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-white">Log in to view history</h4>
                    <p className="text-[10px] text-neutral-450 leading-relaxed">
                      Enter the 10-digit mobile number you used to place orders. We will instantly retrieve your dining logs.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input 
                        type="text" 
                        maxLength={10}
                        placeholder="10-digit Mobile Number"
                        value={loginInputPhone}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '');
                          setLoginInputPhone(clean);
                          setLoginError('');
                        }}
                        className="w-full bg-neutral-950/80 border border-neutral-850 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition"
                      />
                    </div>
                    {loginError && (
                      <p className="text-[10px] text-red-500 font-bold">{loginError}</p>
                    )}
                    <button
                      onClick={() => {
                        if (loginInputPhone.length !== 10) {
                          setLoginError('Please enter a valid 10-digit phone number.');
                          return;
                        }
                        localStorage.setItem('customerPhone', loginInputPhone);
                        setLoggedInPhone(loginInputPhone);
                        setLoginInputPhone('');
                      }}
                      className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition text-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Retrieve My Orders
                    </button>
                  </div>
                </div>
              ) : (
                // Customer Dashboard Screen (Logged In)
                <div className="space-y-4">
                  {/* Customer Info Header */}
                  <div className="glass px-4 py-3 rounded-2xl border border-neutral-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-bold text-neutral-300 flex items-center justify-center">
                        👤
                      </div>
                      <div className="text-[11px]">
                        <span className="text-neutral-550 block text-[9px] uppercase font-bold tracking-wider">Logged in as</span>
                        <span className="font-bold text-white block">{loggedInPhone}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem('customerPhone');
                        setLoggedInPhone(null);
                      }}
                      className="text-[10px] text-red-500 hover:text-red-400 font-bold transition"
                    >
                      Log Out
                    </button>
                  </div>

                  {/* Orders Listing */}
                  {isLoadingCustomerOrders ? (
                    <div className="flex flex-col items-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-orange-500" style={{ color: primaryColor }} />
                      <span className="text-[10px] text-neutral-500 mt-2">Retrieving orders...</span>
                    </div>
                  ) : customerOrders.length === 0 ? (
                    <div className="glass p-8 rounded-3xl border border-neutral-900 text-center">
                      <p className="text-[11px] text-neutral-500">No orders found matching this number.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerOrders.map((ord: any) => (
                        <div key={ord.id} className="glass p-4 rounded-2xl border border-neutral-900 space-y-3">
                          <div className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-850 text-neutral-300 font-bold">
                                Table {ord.table_number || ord.tableNumber || 'Takeaway'}
                              </span>
                              <span className="text-neutral-500">
                                #{ord.id.substring(0, 8).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-neutral-550">
                              {new Date(ord.created_at || ord.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            </span>
                          </div>

                          {/* Items ordered */}
                          <div className="space-y-1 text-[11px] text-neutral-400">
                            {ord.items.map((it: any, idx: number) => (
                              <div key={idx} className="flex justify-between">
                                <span>{it.name} <span className="text-orange-500 font-black" style={{ color: primaryColor }}>x{it.quantity}</span></span>
                                <span>{currencySymbol}{(it.price * it.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Total and actions */}
                          <div className="flex justify-between items-center pt-2.5 border-t border-neutral-900 text-[11px] flex-wrap gap-2">
                            <span className="font-bold text-neutral-300">
                              Total: {currencySymbol}{ord.total.toFixed(2)}
                            </span>
                            
                            <div className="flex gap-2 items-center">
                              {/* Status Badge */}
                              {ord.status === 'received' && (
                                <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-850 text-neutral-400 rounded text-[9px] font-bold">
                                  Received
                                </span>
                              )}
                              {ord.status === 'accepted' && (
                                <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-850 text-neutral-350 rounded text-[9px] font-bold">
                                  Accepted
                                </span>
                              )}
                              {ord.status === 'preparing' && (
                                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded text-[9px] font-bold animate-pulse">
                                  Cooking 🍳
                                </span>
                              )}
                              {ord.status === 'ready' && (
                                <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded text-[9px] font-bold">
                                  Ready 🛎
                                </span>
                              )}
                              {ord.status === 'served' && (
                                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded text-[9px] font-bold">
                                  Served 🍽
                                </span>
                              )}
                              {ord.status === 'completed' && (
                                <span className="px-2 py-0.5 bg-green-950/20 border border-green-900/30 text-green-400 rounded text-[9px] font-bold">
                                  ✓ Completed
                                </span>
                              )}
                              {ord.status === 'cancelled' && (
                                <span className="px-2 py-0.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded text-[9px] font-bold">
                                  Cancelled
                                </span>
                              )}

                              {/* Paid Invoice PDF link */}
                              {(ord.payment_status || ord.paymentStatus) === 'paid' && (
                                <a 
                                  href={`/api/invoice?orderId=${ord.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 rounded font-black text-white text-[9px] uppercase tracking-wider transition"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  Receipt PDF
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* 3. STICKY APP BOTTOM NAVIGATION BAR (PWA LOOK) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-neutral-950/90 backdrop-blur-md border-t border-neutral-900 flex items-center justify-around z-40 max-w-lg mx-auto rounded-t-2xl shadow-2xl">
        <button 
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center gap-1 text-[9px] font-bold ${activeTab === 'menu' ? 'text-orange-500' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          <Compass size={18} />
          <span>Menu</span>
        </button>

        <button 
          onClick={() => setActiveTab('cart')}
          className={`flex flex-col items-center gap-1 text-[9px] font-bold relative ${activeTab === 'cart' ? 'text-orange-500' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          <ShoppingBag size={18} />
          <span>Cart</span>
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-2 h-4 w-4 bg-orange-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold border border-neutral-950">
              {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
            </span>
          )}
        </button>

        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-1 text-[9px] font-bold relative ${activeTab === 'orders' ? 'text-orange-500' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          <Clock size={18} />
          <span>My Orders</span>
        </button>

        <button 
          onClick={() => setActiveTab('offers')}
          className={`flex flex-col items-center gap-1 text-[9px] font-bold ${activeTab === 'offers' ? 'text-orange-500' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          <Tag size={18} />
          <span>Offers</span>
        </button>

        <button 
          onClick={() => setActiveTab('reviews')}
          className={`flex flex-col items-center gap-1 text-[9px] font-bold ${activeTab === 'reviews' ? 'text-orange-500' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          <MessageSquare size={18} />
          <span>Reviews</span>
        </button>

        <button 
          onClick={() => setActiveTab('info')}
          className={`flex flex-col items-center gap-1 text-[9px] font-bold ${activeTab === 'info' ? 'text-orange-500' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          <Info size={18} />
          <span>Info</span>
        </button>
      </nav>

      {/* 4. Secure Payment Gateway Overlay */}
      {paymentSimulating && (
        <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-md w-full space-y-8 animate-fade-in">
            {/* Pulsing Secure Shield */}
            <div className="relative mx-auto h-20 w-20 flex items-center justify-center bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-3xl animate-bounce">
              <Shield className="h-10 w-10 animate-pulse text-orange-500" />
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-black text-white">
                {paymentMethod === 'upi' ? 'Initializing BHIM UPI Intent' : 'Processing Cash Order'}
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Please do not close this window or press back. We are processing your transaction securely.
              </p>
            </div>

            {/* Simulated Receipt details */}
            <div className="bg-neutral-900/50 border border-neutral-850 rounded-2xl p-4 text-left space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500">Merchant:</span>
                <span className="font-bold text-neutral-200">{resData?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500">Payment Type:</span>
                <span className="font-bold text-neutral-200 uppercase tracking-wider">{paymentMethod} Payment</span>
              </div>
              <div className="border-t border-neutral-850 pt-2 flex justify-between text-sm">
                <span className="font-bold text-neutral-300">Total Payable:</span>
                <span className="font-black text-orange-500">{currencySymbol}{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Provider Badges */}
            <div className="flex items-center justify-center gap-3 opacity-60">
              {paymentMethod === 'upi' ? (
                <>
                  <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-bold text-[9px] text-neutral-400">BHIM UPI</span>
                  <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-bold text-[9px] text-neutral-400">G-PAY</span>
                  <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-bold text-[9px] text-neutral-400">PHONEPE</span>
                </>
              ) : (
                <>
                  <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-bold text-[9px] text-neutral-400">VISA</span>
                  <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-bold text-[9px] text-neutral-400">MASTERCARD</span>
                  <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-bold text-[9px] text-neutral-400">PCI-DSS</span>
                </>
              )}
            </div>

            {/* Loading text spinner */}
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
              <span>Simulating successful authentication...</span>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
