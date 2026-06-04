'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '../supabase/client';
import { Product, CartItem } from '../types';
import { trackAddToCart } from '../analytics';

// Define Toast interface
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Interfaces for Context
interface AppContextType {
  // Auth
  user: User | null;
  session: Session | null;
  isAuthLoading: boolean;
  signOut: () => Promise<void>;
  
  // Cart
  cart: CartItem[];
  isCartLoading: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  cartTotal: number;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  // Auth States
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(true);

  // Toast States
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Show Toast function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setCart([]);
      showToast('Logged out successfully', 'info');
    } catch (error) {
      showToast('Error logging out', 'error');
    }
  };

  // Watch Auth changes
  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch cart items
  const fetchCart = async (currentUser: User | null) => {
    setIsCartLoading(true);
    if (!currentUser) {
      // Load from localStorage if guest
      const localCart = localStorage.getItem('demo_cart');
      if (localCart) {
        try {
          setCart(JSON.parse(localCart));
        } catch {
          setCart([]);
        }
      } else {
        setCart([]);
      }
      setIsCartLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          user_id,
          product_id,
          quantity,
          product:products (*)
        `);

      if (error) throw error;

      const formattedData = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: Array.isArray(item.product) ? item.product[0] : item.product,
      }));

      setCart(formattedData as CartItem[]);
    } catch (err: any) {
      console.error('Error fetching cart:', err.message);
      showToast('Failed to fetch cart items', 'error');
    } finally {
      setIsCartLoading(false);
    }
  };

  // Run fetchCart on user change
  useEffect(() => {
    fetchCart(user);
  }, [user]);

  // Sync guest cart to db upon login (if local items exist)
  useEffect(() => {
    if (user && cart.length > 0) {
      const syncCart = async () => {
        // Find if guest cart has items in localStorage
        const localCartStr = localStorage.getItem('demo_cart');
        if (!localCartStr) return;

        try {
          const localCart: CartItem[] = JSON.parse(localCartStr);
          if (localCart.length === 0) return;

          // For each local cart item, insert or upsert into DB
          for (const item of localCart) {
            // Check if product exists in DB cart
            const { data: existing } = await supabase
              .from('cart_items')
              .select('id, quantity')
              .eq('user_id', user.id)
              .eq('product_id', item.product_id)
              .single();

            if (existing) {
              await supabase
                .from('cart_items')
                .update({ quantity: existing.quantity + item.quantity })
                .eq('id', existing.id);
            } else {
              await supabase
                .from('cart_items')
                .insert({
                  user_id: user.id,
                  product_id: item.product_id,
                  quantity: item.quantity,
                });
            }
          }
          // Clear local storage and refetch db cart
          localStorage.removeItem('demo_cart');
          await fetchCart(user);
        } catch (err) {
          console.error('Error syncing guest cart:', err);
        }
      };
      syncCart();
    }
  }, [user]);

  // Add item to cart
  const addToCart = async (product: Product, quantity: number = 1) => {
    // Analytics
    trackAddToCart(product, quantity);

    if (product.stock <= 0) {
      showToast(`${product.name} is out of stock!`, 'error');
      return;
    }

    if (!user) {
      // LocalStorage flow for guests
      const currentCart = [...cart];
      const existingItemIndex = currentCart.findIndex((item) => item.product_id === product.id);

      if (existingItemIndex > -1) {
        const targetQuantity = currentCart[existingItemIndex].quantity + quantity;
        if (targetQuantity > product.stock) {
          showToast(`Cannot add more. Limit of ${product.stock} items reached.`, 'error');
          return;
        }
        currentCart[existingItemIndex].quantity = targetQuantity;
      } else {
        currentCart.push({
          id: Math.random().toString(36).substring(2, 9),
          user_id: 'guest',
          product_id: product.id,
          quantity,
          product,
        });
      }

      setCart(currentCart);
      localStorage.setItem('demo_cart', JSON.stringify(currentCart));
      showToast(`Added ${product.name} to cart!`, 'success');
      return;
    }

    // Database flow for authenticated users
    try {
      const existingItem = cart.find((item) => item.product_id === product.id);

      if (existingItem) {
        const targetQuantity = existingItem.quantity + quantity;
        if (targetQuantity > product.stock) {
          showToast(`Cannot add more. Limit of ${product.stock} items reached.`, 'error');
          return;
        }

        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: targetQuantity })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity,
          });

        if (error) throw error;
      }

      await fetchCart(user);
      showToast(`Added ${product.name} to cart!`, 'success');
    } catch (err: any) {
      console.error('Error adding to cart:', err.message);
      showToast('Could not add item to cart', 'error');
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId: string) => {
    if (!user) {
      const updatedCart = cart.filter((item) => item.product_id !== productId);
      setCart(updatedCart);
      localStorage.setItem('demo_cart', JSON.stringify(updatedCart));
      showToast('Removed item from cart', 'info');
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
      await fetchCart(user);
      showToast('Removed item from cart', 'info');
    } catch (err: any) {
      console.error('Error removing from cart:', err.message);
      showToast('Could not remove item', 'error');
    }
  };

  // Update item quantity
  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    // Check stock limit
    const item = cart.find((i) => i.product_id === productId);
    const stockLimit = item?.product?.stock || 999;
    if (quantity > stockLimit) {
      showToast(`Only ${stockLimit} items available in stock.`, 'error');
      return;
    }

    if (!user) {
      const updatedCart = cart.map((item) => 
        item.product_id === productId ? { ...item, quantity } : item
      );
      setCart(updatedCart);
      localStorage.setItem('demo_cart', JSON.stringify(updatedCart));
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
      await fetchCart(user);
    } catch (err: any) {
      console.error('Error updating quantity:', err.message);
      showToast('Could not update quantity', 'error');
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!user) {
      setCart([]);
      localStorage.removeItem('demo_cart');
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setCart([]);
    } catch (err: any) {
      console.error('Error clearing cart:', err.message);
    }
  };

  // Memoized counters
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        user,
        session,
        isAuthLoading,
        signOut,
        cart,
        isCartLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
