import { ReactNode, createContext, useContext, useMemo, useState } from "react";
import { PublicMenuItem } from "../api/publicOrder.api";

export interface CartEntry {
  item: PublicMenuItem;
  quantity: number;
}

interface CartContextValue {
  items: CartEntry[];
  totalItems: number;
  total: number;
  getQuantity: (menuItemId: string) => number;
  addItem: (item: PublicMenuItem) => void;
  setQuantity: (item: PublicMenuItem, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartEntry[]>([]);

  const value = useMemo<CartContextValue>(() => {
    const getQuantity = (menuItemId: string) =>
      items.find((entry) => entry.item.id === menuItemId)?.quantity ?? 0;

    return {
      items,
      totalItems: items.reduce((sum, entry) => sum + entry.quantity, 0),
      total: items.reduce((sum, entry) => sum + entry.quantity * entry.item.price, 0),
      getQuantity,
      addItem: (item) =>
        setItems((current) => {
          const existing = current.find((entry) => entry.item.id === item.id);
          if (existing) {
            return current.map((entry) =>
              entry.item.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
            );
          }
          return [...current, { item, quantity: 1 }];
        }),
      setQuantity: (item, quantity) =>
        setItems((current) => {
          if (quantity <= 0) return current.filter((entry) => entry.item.id !== item.id);

          const existing = current.find((entry) => entry.item.id === item.id);
          if (!existing) return [...current, { item, quantity }];

          return current.map((entry) =>
            entry.item.id === item.id ? { ...entry, quantity } : entry,
          );
        }),
      removeItem: (menuItemId) =>
        setItems((current) => current.filter((entry) => entry.item.id !== menuItemId)),
      clearCart: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
