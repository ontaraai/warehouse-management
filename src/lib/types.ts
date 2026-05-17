export interface Warehouse {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface Category {
  id: string;
  warehouse_id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  warehouse_id: string;
  category_id: string | null;
  name: string;
  sku: string | null;
  unit: string;
  price: number | null;
  current_stock: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
}

export interface Transaction {
  id: string;
  warehouse_id: string;
  created_by: string;
  type: 'inward' | 'outward';
  transaction_date: string;
  remark: string | null;
  created_at: string;
  transaction_items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  products?: Product;
}

export const UNITS = ['Pc', 'Kg', 'Box', 'Meter', 'Ltr', 'Set', 'Pair', 'Bundle'] as const;
