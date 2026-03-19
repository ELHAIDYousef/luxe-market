// frontend/src/types/index.ts

// ─── User & Auth ────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: 'customer' | 'admin' | 'super_admin' | 'editor' | 'viewer';
  status: 'active' | 'inactive';
  lastLogin?: string;
  memberSince?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ─── Product ────────────────────────────────────────────────────────────────
export interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  finish?: string[];
  specifications?: Record<string, string>;
  rating?: number;
  reviews?: number;
}

// ─── Cart ────────────────────────────────────────────────────────────────────
export interface CartItem {
  product: Product;
  quantity: number;
  selectedFinish?: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────
export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderItem {
  id: number;
  order_id: string;
  product_id: number;
  quantity: number;
  unit_price: number; // Matches backend unit_price field
  selected_finish?: string;
  product?: Product;
}

export interface Order {
  id: string;
  customer_id: number;
  status: OrderStatus;
  total: number;
  created_at: string;
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_zip?: string;
  carrier?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  delivery_method: string;
  items: OrderItem[]; // Now correctly using OrderItem
}