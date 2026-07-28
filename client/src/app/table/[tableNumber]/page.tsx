'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isDemoMode, supabase } from '@/utils/supabaseClient';
import { mockDb } from '@/utils/mockDb';
import { useCart } from '@/context/CartContext';
import { Loader2 } from 'lucide-react';

export default function TableLandingPage() {
  const router = useRouter();
  const { tableNumber } = useParams() as { tableNumber: string };
  const { setTableDetails } = useCart();
  const [error, setError] = useState('');

  useEffect(() => {
    const identifyTable = async () => {
      try {
        let restaurant: any = null;
        let tables: any[] = [];

        if (isDemoMode) {
          restaurant = mockDb.restaurant;
          tables = mockDb.getTables();
        } else {
          // Fetch the first restaurant to resolve our ID context
          const { data: list, error: listErr } = await supabase
            .from('restaurants')
            .select('*')
            .limit(1);

          if (listErr || !list || list.length === 0) {
            setError('Restaurant settings not initialized');
            return;
          }
          restaurant = list[0];

          // Fetch tables for this restaurant
          const { data: tablesData, error: tablesErr } = await supabase
            .from('tables')
            .select('*')
            .eq('restaurant_id', restaurant.id);

          if (tablesErr) {
            setError('Error loading restaurant tables');
            return;
          }
          tables = tablesData || [];
        }

        // Find matching Table number
        console.log(`[QR-Landing] QR code scanned. Detecting location: Table ${tableNumber}`);
        const currentTable = tables.find(
          (t: { number: string; status: string }) => 
            t.number.toLowerCase() === tableNumber.toLowerCase() && t.status === 'active'
        );

        if (!currentTable) {
          console.error(`[QR-Landing] Invalid QR scanned: Table number '${tableNumber}' does not exist or is inactive.`);
          setError('Invalid Table QR Code. The scanned dining table location does not exist or is inactive.');
          return;
        }

        // Store details in context / localStorage
        setTableDetails(currentTable.id, currentTable.number);
        console.log(`[QR-Landing] Table verified successfully: Table ${currentTable.number} (ID: ${currentTable.id})`);

        // Redirect to main restaurant menu
        router.replace(`/?tableSelected=true`);
      } catch (err: any) {
        console.error('[QR-Landing] Error mapping table:', err);
        setError('Invalid Table QR. Error mapping table location. Please contact staff.');
      }
    };

    if (tableNumber) {
      identifyTable();
    }
  }, [tableNumber, router, setTableDetails]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 p-4">
      <div className="glass max-w-sm w-full p-8 rounded-2xl text-center space-y-6">
        {error ? (
          <>
            <div className="h-12 w-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h1 className="text-xl font-bold text-neutral-100">Scanning Error</h1>
            <p className="text-sm text-neutral-400 leading-relaxed">{error}</p>
            <button
              onClick={() => router.push(`/`)}
              className="w-full py-2.5 rounded-xl bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition duration-200 text-sm font-semibold"
            >
              Browse Menu Anyway
            </button>
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto" />
            <h1 className="text-lg font-semibold text-neutral-100">Identifying Table Location...</h1>
            <p className="text-xs text-neutral-400">
              Table {tableNumber} detected
            </p>
          </>
        )}
      </div>
    </main>
  );
}
