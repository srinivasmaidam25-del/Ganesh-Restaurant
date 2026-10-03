'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  foodId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  isVeg: boolean;
  notes: string;
}

export interface CouponData {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  discountAmount: number;
  minOrderAmount?: number;
}

interface CartContextProps {
  cartItems: CartItem[];
  tableId: string;
  tableNumber: string;
  coupon: CouponData | null;
  notes: string;
  setNotes: (notes: string) => void;
  setTableDetails: (tableId: string, number: string) => void;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  updateItemNotes: (foodId: string, notes: string) => void;
  clearCart: () => void;
  applyCoupon: (coupon: CouponData | null) => void;
  getCartTotals: (taxPercentage: number, serviceChargePercentage: number) => {
    subTotal: number;
    discount: number;
    tax: number;
    serviceCharge: number;
    total: number;
  };
}

const CartContext = createContext<CartContextProps>({
  cartItems: [],
  tableId: '',
  tableNumber: '',
  coupon: null,
  notes: '',
  setNotes: () => {},
  setTableDetails: () => {},
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  updateItemNotes: () => {},
  clearCart: () => {},
  applyCoupon: () => {},
  getCartTotals: () => ({ subTotal: 0, discount: 0, tax: 0, serviceCharge: 0, total: 0 })
});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [tableId, setTableId] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [coupon, setCoupon] = useState<CouponData | null>(null);
  const [notes, setNotes] = useState('');

  // Hydrate cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    const storedTableId = localStorage.getItem('tableId');
    const storedTableNum = localStorage.getItem('tableNumber');
    
    if (storedCart) setCartItems(JSON.parse(storedCart));
    if (storedTableId) setTableId(storedTableId);
    if (storedTableNum) setTableNumber(storedTableNum);
  }, []);

  const saveCartToStorage = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('cart', JSON.stringify(items));
  };

  const setTableDetails = (id: string, num: string) => {
    setTableId(id);
    setTableNumber(num);
    localStorage.setItem('tableId', id);
    localStorage.setItem('tableNumber', num);
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    const existingIndex = cartItems.findIndex(i => i.foodId === item.foodId);
    let newItems = [...cartItems];

    if (existingIndex > -1) {
      newItems[existingIndex].quantity += quantity;
    } else {
      newItems.push({ ...item, quantity, notes: '' });
    }
    saveCartToStorage(newItems);
  };

  const removeFromCart = (foodId: string) => {
    const newItems = cartItems.filter(i => i.foodId !== foodId);
    saveCartToStorage(newItems);
  };

  const updateQuantity = (foodId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(foodId);
      return;
    }
    const newItems = cartItems.map(item =>
      item.foodId === foodId ? { ...item, quantity } : item
    );
    saveCartToStorage(newItems);
  };

  const updateItemNotes = (foodId: string, itemNotes: string) => {
    const newItems = cartItems.map(item =>
      item.foodId === foodId ? { ...item, notes: itemNotes } : item
    );
    saveCartToStorage(newItems);
  };

  const clearCart = () => {
    saveCartToStorage([]);
    setCoupon(null);
    setNotes('');
  };

  const applyCoupon = (couponData: CouponData | null) => {
    setCoupon(couponData);
  };

  const getCartTotals = (taxPercentage = 5, serviceChargePercentage = 2) => {
    const subTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    
    let discount = 0;
    if (coupon) {
      const minSpend = coupon.minOrderAmount || 0;
      if (subTotal >= minSpend) {
        if (coupon.type === 'percentage') {
          discount = (subTotal * coupon.value) / 100;
        } else {
          discount = coupon.value;
        }
        // Make sure discount doesn't exceed subtotal
        if (discount > subTotal) {
          discount = subTotal;
        }
      } else {
        discount = 0;
      }
    }

    const netAmount = Math.max(0, subTotal - discount);
    const tax = parseFloat((netAmount * (taxPercentage / 100)).toFixed(2));
    const serviceCharge = parseFloat((netAmount * (serviceChargePercentage / 100)).toFixed(2));
    const total = parseFloat((netAmount + tax + serviceCharge).toFixed(2));

    return {
      subTotal: parseFloat(subTotal.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      tax,
      serviceCharge,
      total
    };
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        tableId,
        tableNumber,
        coupon,
        notes,
        setNotes,
        setTableDetails,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemNotes,
        clearCart,
        applyCoupon,
        getCartTotals
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
