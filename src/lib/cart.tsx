import { createContext, useContext, useState, ReactNode } from "react";

export type CartItem = {
  name: string;
  price: string;
  priceNum: number;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: { name: string; price: string }) => void;
  removeItem: (name: string) => void;
  updateQuantity: (name: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const parsePrice = (priceStr: string) => {
  return parseFloat(priceStr.replace('€', '').replace(',', '.').trim());
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = (newItem: { name: string; price: string }) => {
    setItems((current) => {
      const existing = current.find((i) => i.name === newItem.name);
      if (existing) {
        return current.map((i) =>
          i.name === newItem.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...current, { ...newItem, priceNum: parsePrice(newItem.price), quantity: 1 }];
    });
    setIsOpen(true);
  };

  const removeItem = (name: string) => {
    setItems((current) => current.filter((i) => i.name !== name));
  };

  const updateQuantity = (name: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(name);
      return;
    }
    setItems((current) =>
      current.map((i) => (i.name === name ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + item.priceNum * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, isOpen, setIsOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
