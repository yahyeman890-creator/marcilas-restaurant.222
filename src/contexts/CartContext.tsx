import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Food, CartItem } from '@/types';

interface CartContextValue {
  items: CartItem[];
  addToCart: (food: Food, quantity?: number) => void;
  removeFromCart: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'marcilas_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  function persist(newItems: CartItem[]) {
    setItems(newItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  }

  function addToCart(food: Food, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.food.id === food.id);
      let newItems: CartItem[];
      if (existing) {
        newItems = prev.map((i) =>
          i.food.id === food.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      } else {
        newItems = [...prev, { food, quantity }];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      return newItems;
    });
  }

  function removeFromCart(foodId: string) {
    setItems((prev) => {
      const newItems = prev.filter((i) => i.food.id !== foodId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      return newItems;
    });
  }

  function updateQuantity(foodId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(foodId);
      return;
    }
    setItems((prev) => {
      const newItems = prev.map((i) =>
        i.food.id === foodId ? { ...i, quantity } : i
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      return newItems;
    });
  }

  function clearCart() {
    persist([]);
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.food.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
