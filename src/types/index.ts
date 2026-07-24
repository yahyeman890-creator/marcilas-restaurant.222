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
  business_date: string;
  z_report_id: string | null;
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

export interface ZReport {
  id: string;
  report_number: number;
  business_date: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  total_discounts: number;
  order_snapshot: Order[];
  generated_at: string;
  generated_by: string | null;
  generated_by_name: string;
  notes: string | null;
}
