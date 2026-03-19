import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { CartItem, Product } from "../types";
import { useAuth } from "./AuthContext";

interface CartCtx {
  items: CartItem[];
  addItem: (product: Product, qty?: number, finish?: string) => boolean; // returns false if not logged in
  removeItem: (productId: number) => void;
  updateQty: (productId: number, qty: number) => void;
  clearCart: () => void;
  subtotal: number;
  total: number;
  tax: number;
}

const CartContext = createContext<CartCtx | null>(null);

// Per-user cart keyed by user ID — never shared between accounts
type CartStore = Record<string, CartItem[]>;

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  // Allow guest cart with fixed key
  const cartKey = user ? `user_${user.id}` : "guest";
  const [store, setStore] = useState<CartStore>(() => {
    // Initialize with saved cart on mount
    const savedCart = localStorage.getItem("luxemarket_cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        return parsedCart;
      } catch (error) {
        console.error("Failed to parse saved cart:", error);
        return {};
      }
    }
    return {};
  });

  const items = store[cartKey] ?? [];

  // Migrate guest cart to user cart when user authenticates
  useEffect(() => {
    if (user && store["guest"] && store["guest"].length > 0) {
      setStore((s) => {
        const userKey = `user_${user.id}`;
        // Move guest items to user cart (user cart takes precedence if both exist)
        return {
          ...s,
          [userKey]: s[userKey] ?? s["guest"],
          guest: [], // Clear guest cart after migration
        };
      });
    }
  }, [user?.id]); // Only run when user ID changes

  // Save cart to localStorage whenever store changes
  useEffect(() => {
    localStorage.setItem("luxemarket_cart", JSON.stringify(store));
  }, [store]);

  const setItems = (updater: (prev: CartItem[]) => CartItem[]) => {
    setStore((s) => ({ ...s, [cartKey]: updater(s[cartKey] ?? []) }));
  };

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  /**
   * Add item to cart.
   * Returns true on success.
   */
  const addItem = (product: Product, qty = 1, finish?: string): boolean => {
    if (!cartKey) return false;
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing)
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + qty }
            : i,
        );
      return [...prev, { product, quantity: qty, selectedFinish: finish }];
    });
    return true;
  };

  const removeItem = (productId: number) =>
    setItems((prev) => prev.filter((i) => i.product.id !== productId));

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) return removeItem(productId);
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: qty } : i,
      ),
    );
  };

  const clearCart = () => setItems(() => []);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        subtotal,
        total,
        tax,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
};
