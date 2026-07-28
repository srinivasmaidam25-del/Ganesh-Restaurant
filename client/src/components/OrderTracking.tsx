'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { isDemoMode, supabase } from '@/utils/supabaseClient';
import { mockDb } from '@/utils/mockDb';
import { 
  Clock, ArrowLeft, Download, ChefHat, Sparkles, Flame, Bell, Utensils, Award, Check
} from 'lucide-react';

const STATUS_STEPS = [
  { id: 'received', label: 'Pending', desc: 'Awaiting kitchen confirmation', icon: Sparkles },
  { id: 'preparing', label: 'Preparing', desc: 'Chef is cooking your meal', icon: Flame },
  { id: 'ready', label: 'Ready', desc: 'Order is hot and ready', icon: Bell },
  { id: 'served', label: 'Served', desc: 'Dishes are delivered to your table', icon: Utensils },
  { id: 'completed', label: 'Completed', desc: 'Order is closed and paid', icon: Award }
];

interface OrderTrackingProps {
  slug?: string;
}

export default function OrderTracking({ slug }: OrderTrackingProps) {
  const params = useParams() as { restaurantSlug?: string; orderId: string };
  const orderId = params.orderId;
  const router = useRouter();
  const [liveOrder, setLiveOrder] = useState<any>(null);

  const restaurantSlug = slug || params.restaurantSlug || 'la-piazza';

  // Fetch Order
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (isDemoMode) {
        return mockDb.getOrderById(orderId);
      }
      const { data, error } = await supabase
        .from('orders')
        .select('*, restaurants(name, currency)')
        .eq('id', orderId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (order) {
      setLiveOrder(order);
    }
  }, [order]);

  // Connect to live changes
  useEffect(() => {
    if (!orderId) return;

    if (isDemoMode) {
      // Offline mode: listen to custom database events
      const handleUpdate = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail && detail.id === orderId) {
          setLiveOrder(detail);
        }
      };
      window.addEventListener('mock_db_order_update', handleUpdate);

      // Listen to cross-tab BroadcastChannel
      let channel: BroadcastChannel | null = null;
      try {
        channel = new BroadcastChannel('rasoi-order-sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'order_updated' && event.data.detail?.id === orderId) {
            setLiveOrder(event.data.detail);
          }
        };
      } catch {}

      return () => {
        window.removeEventListener('mock_db_order_update', handleUpdate);
        if (channel) channel.close();
      };
    } else {
      // Supabase Postgres Changes Realtime subscription
      const channel = supabase
        .channel(`order-track-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`
          },
          (payload: any) => {
            setLiveOrder(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [orderId]);

  if (isLoading || !liveOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Clock className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const getActiveIndex = (status: string) => {
    let checkStatus = status;
    if (checkStatus === 'accepted') checkStatus = 'received';
    return STATUS_STEPS.findIndex(step => step.id === checkStatus);
  };
  const activeIndex = getActiveIndex(liveOrder.status);
  const basePrep = 15;
  const currencySymbol = liveOrder.restaurants?.currency || '₹';
  const backPath = slug ? '/' : `/r/${restaurantSlug}`;

  const currentStep = STATUS_STEPS[activeIndex] || STATUS_STEPS[0];
  const StepIcon = currentStep.icon || Sparkles;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:py-12">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push(backPath)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft size={14} /> Back to Menu
          </button>
          
          <span className="text-[10px] uppercase font-black text-orange-500 tracking-widest bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/15">
            Live tracking
          </span>
        </div>

        {/* ORDER HEADER */}
        <div className="glass p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-600/10 border border-orange-500/25 flex items-center justify-center text-orange-500">
              <ChefHat size={22} className="animate-bounce" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Order Reference</p>
              <h2 className="text-lg font-black text-white">INV-{liveOrder.id.substring(0, 8).toUpperCase()}</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-neutral-900 text-xs text-neutral-300">
            <div>
              <span className="text-neutral-500">Table Number</span>
              <p className="font-bold text-sm text-neutral-200 mt-0.5">Table {liveOrder.table_number || liveOrder.tableNumber}</p>
            </div>
            <div>
              <span className="text-neutral-500">Estimated Delivery</span>
              <p className="font-bold text-sm text-neutral-200 mt-0.5 flex items-center gap-1">
                <Clock size={12} className="text-orange-500" /> {basePrep} mins
              </p>
            </div>
          </div>
        </div>

        {/* CURRENT ACTIVE STATUS SHIELD */}
        <div className={`glass p-8 rounded-3xl relative overflow-hidden flex flex-col items-center text-center space-y-4 border transition-all duration-500 ${
          liveOrder.status === 'completed' && (liveOrder.payment_status === 'paid' || liveOrder.paymentStatus === 'paid')
            ? 'border-emerald-500/30 bg-emerald-950/15 shadow-[0_0_50px_-12px_rgba(16,185,129,0.25)]' 
            : 'border-orange-500/10 shadow-[0_0_50px_-12px_rgba(234,88,12,0.15)]'
        }`}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* PAID & COMPLETED DIAGONAL STAMP */}
          {liveOrder.status === 'completed' && (liveOrder.payment_status === 'paid' || liveOrder.paymentStatus === 'paid') && (
            <div className="absolute right-6 top-6 -rotate-12 border-4 border-double border-emerald-500 text-emerald-500 font-extrabold text-[10px] px-3 py-1 rounded-md uppercase tracking-widest pointer-events-none select-none animate-bounce shadow-[0_0_15px_rgba(16,185,129,0.2)] bg-neutral-950/65 backdrop-blur-sm z-10">
              PAID &amp; COMPLETED
            </div>
          )}

          <div className={`h-24 w-24 rounded-full flex items-center justify-center transition-all duration-500 ${
            liveOrder.status === 'completed' && (liveOrder.payment_status === 'paid' || liveOrder.paymentStatus === 'paid')
              ? 'bg-emerald-600/10 border-2 border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] animate-pulse'
              : 'bg-orange-600/10 border-2 border-orange-500/30 text-orange-500 shadow-[0_0_30px_-5px_rgba(234,88,12,0.35)] animate-pulse'
          }`}>
            <StepIcon size={40} className="animate-bounce" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-orange-500">Current Phase</span>
            <h2 className="text-2xl font-black text-white">{currentStep.label}</h2>
            <p className="text-xs text-neutral-400 max-w-xs">{currentStep.desc}</p>
          </div>

          {/* Micro-Animation/Status Bar */}
          <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${
                liveOrder.status === 'completed' && (liveOrder.payment_status === 'paid' || liveOrder.paymentStatus === 'paid')
                  ? 'bg-gradient-to-r from-emerald-600 to-green-400' 
                  : 'bg-gradient-to-r from-orange-600 to-amber-500'
              }`}
              style={{ width: `${((activeIndex + 1) / STATUS_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* TIMELINE PROGRESS STEPS */}
        <div className="space-y-3">
          <h3 className="font-black text-xs text-neutral-450 uppercase tracking-widest pl-1">Milestones</h3>
          
          <div className="space-y-2.5">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < activeIndex;
              const isCurrent = idx === activeIndex;
              const isFuture = idx > activeIndex;
              const StepCardIcon = step.icon;

              return (
                <div 
                  key={step.id} 
                  className={`glass p-4 rounded-2xl flex items-center justify-between border transition duration-300 ${
                    isCurrent ? 'border-orange-500/30 bg-orange-950/5 shadow-[0_0_15px_-3px_rgba(234,88,12,0.1)]' : 
                    isPast ? 'border-neutral-850/60 bg-neutral-900/10' : 
                    'border-neutral-900/30 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Status Circle / Icon */}
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition ${
                      isPast ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                      isCurrent ? 'bg-orange-600 border-orange-500 text-white shadow-[0_0_10px_rgba(234,88,12,0.3)] animate-pulse' :
                      'bg-neutral-950 border-neutral-900 text-neutral-500'
                    }`}>
                      <StepCardIcon size={18} />
                    </div>

                    <div className="min-w-0">
                      <h4 className={`font-extrabold text-sm transition ${isFuture ? 'text-neutral-550' : 'text-neutral-100'}`}>
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-neutral-400 truncate">{step.desc}</p>
                    </div>
                  </div>

                  {/* Right Status Indicator */}
                  <div>
                    {(isPast || (isCurrent && step.id === 'completed')) ? (
                      <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                        <Check size={11} strokeWidth={3} />
                      </div>
                    ) : isCurrent ? (
                      <span className="text-[9px] uppercase font-black text-orange-500 tracking-wider animate-pulse">
                        Active
                      </span>
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-neutral-850" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BILL DETAILS */}
        <div className="glass p-4 rounded-2xl flex items-center justify-between text-xs">
          <div>
            <span className="text-[9px] text-neutral-500 uppercase font-black block">Bill Details</span>
            <span className="font-bold">Status: {liveOrder.payment_status || liveOrder.paymentStatus} ({liveOrder.payment_method?.toUpperCase() || liveOrder.paymentMethod?.toUpperCase()})</span>
          </div>

          <a 
            href={`/api/invoice?orderId=${liveOrder.id}`}
            className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 font-bold hover:text-white transition flex items-center gap-1.5"
          >
            <Download size={13} /> Invoice PDF
          </a>
        </div>

        {/* ITEMS LIST */}
        <div className="glass p-6 rounded-3xl space-y-4">
          <h3 className="font-black text-xs text-neutral-450 uppercase tracking-widest">Items Ordered</h3>
          <div className="space-y-3 divide-y divide-neutral-900">
            {liveOrder.items.map((item: any, idx: number) => (
              <div key={idx} className="pt-3.5 first:pt-0 flex justify-between text-xs">
                <div>
                  <span className="font-bold text-neutral-200">{item.name} <span className="text-orange-500">x{item.quantity}</span></span>
                  {item.notes && <p className="text-[10px] text-neutral-500 italic mt-0.5">"{item.notes}"</p>}
                </div>
                <span>{currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-900 text-xs space-y-1.5 text-neutral-400">
            <div className="flex justify-between"><span>Subtotal:</span><span>{currencySymbol}{liveOrder.sub_total?.toFixed(2) || liveOrder.subTotal?.toFixed(2)}</span></div>
            {(liveOrder.discount > 0) && <div className="flex justify-between text-green-400"><span>Discount:</span><span>-{currencySymbol}{liveOrder.discount.toFixed(2)}</span></div>}
            <div className="flex justify-between"><span>GST:</span><span>{currencySymbol}{liveOrder.tax?.toFixed(2)}</span></div>
            <div className="flex justify-between font-black text-white text-sm border-t border-neutral-900 pt-2"><span>Grand Total:</span><span className="text-orange-500">{currencySymbol}{liveOrder.total?.toFixed(2)}</span></div>
          </div>
        </div>

        {/* LOYALTY */}
        <div className="p-5 rounded-3xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-between text-xs">
          <div>
            <h4 className="font-black text-white flex items-center gap-1.5"><Sparkles size={13} className="text-amber-400" /> Dining Loyalty Points</h4>
            <p className="text-[9px] text-neutral-400">Points earned on checkout</p>
          </div>
          <span className="px-3.5 py-1.5 bg-orange-600 text-white font-black rounded-xl">+{liveOrder.loyalty_points_earned || liveOrder.loyaltyPointsEarned || 0} pts</span>
        </div>
      </div>
    </main>
  );
}
