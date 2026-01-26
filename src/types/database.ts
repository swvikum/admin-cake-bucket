export type Role = "admin" | "manager" | "employee";

export type OrderStatus =
  | "draft"
  | "pending_confirm"
  | "confirmed"
  | "in_progress"
  | "ready"
  | "delivered"
  | "completed"
  | "cancelled";

export type MovementType = "purchase" | "usage" | "adjustment";

export interface Profile {
  id: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  stock_on_hand: number;
  reorder_point: number;
  cost_per_unit: number;
  supplier_name: string | null;
  note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  due_at: string;
  status: OrderStatus;
  assigned_user_id: string | null;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  deposit_paid: number;
  balance_due: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  item_id: string;
  movement_type: MovementType;
  quantity: number;
  reason: string | null;
  ref_order_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_date: string;
  supplier_name: string | null;
  category: string;
  description: string | null;
  amount: number;
  tax: number;
  receipt_url: string | null;
  created_by: string | null;
  created_at: string;
}
