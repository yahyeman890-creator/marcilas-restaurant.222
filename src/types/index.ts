export type UserRole = 'customer' | 'admin' | 'cashier' | 'driver';

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface Food {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  image_url: string;
  rating: number;
  is_available: boolean;
  created_at: string;
  category?: Category | null;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid';

export interface Order {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total: number;
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  food_id: string | null;
  food_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CartItem {
  food: Food;
  quantity: number;
}
