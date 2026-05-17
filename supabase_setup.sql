-- 1. CREATE TABLES

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Main Warehouse',
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE warehouse_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_email TEXT,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(warehouse_id, user_id)
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(warehouse_id, name)
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    sku TEXT,
    unit TEXT NOT NULL DEFAULT 'Pc',
    price NUMERIC,
    current_stock NUMERIC NOT NULL DEFAULT 0,
    low_stock_threshold NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    type TEXT NOT NULL CHECK (type IN ('inward', 'outward')),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    stock_before NUMERIC NOT NULL,
    stock_after NUMERIC NOT NULL
);

-- 2. ROW LEVEL SECURITY (RLS) SETUP

-- Helper Function to get all warehouse IDs the user belongs to
CREATE OR REPLACE FUNCTION get_user_warehouses()
RETURNS SETOF UUID AS $$
  SELECT warehouse_id FROM warehouse_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Policies for warehouses
CREATE POLICY "Users access their warehouses" ON warehouses 
FOR ALL USING (id IN (SELECT get_user_warehouses())) 
WITH CHECK (id IN (SELECT get_user_warehouses()));

-- Policies for warehouse_members
CREATE POLICY "Users access their warehouse members" ON warehouse_members 
FOR ALL USING (warehouse_id IN (SELECT get_user_warehouses())) 
WITH CHECK (warehouse_id IN (SELECT get_user_warehouses()));

-- Policies for categories
CREATE POLICY "Users access their categories" ON categories 
FOR ALL USING (warehouse_id IN (SELECT get_user_warehouses())) 
WITH CHECK (warehouse_id IN (SELECT get_user_warehouses()));

-- Policies for products
CREATE POLICY "Users access their products" ON products 
FOR ALL USING (warehouse_id IN (SELECT get_user_warehouses())) 
WITH CHECK (warehouse_id IN (SELECT get_user_warehouses()));

-- Policies for transactions
CREATE POLICY "Users access their transactions" ON transactions 
FOR ALL USING (warehouse_id IN (SELECT get_user_warehouses())) 
WITH CHECK (warehouse_id IN (SELECT get_user_warehouses()));

-- Policies for transaction_items
CREATE POLICY "Users access their transaction items" ON transaction_items 
FOR ALL USING (
    transaction_id IN (SELECT id FROM transactions WHERE warehouse_id IN (SELECT get_user_warehouses()))
) WITH CHECK (
    transaction_id IN (SELECT id FROM transactions WHERE warehouse_id IN (SELECT get_user_warehouses()))
);


-- 3. DATABASE FUNCTIONS & TRIGGERS

-- A) Function: process_transaction
CREATE OR REPLACE FUNCTION process_transaction(
  p_warehouse_id UUID,
  p_type TEXT,
  p_items JSONB,  -- [{product_id, quantity}]
  p_remark TEXT DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS UUID AS $$
DECLARE
  v_txn_id UUID;
  v_item JSONB;
  v_product RECORD;
  v_new_stock NUMERIC;
BEGIN
  -- Verify user has access to this warehouse
  IF NOT EXISTS (SELECT 1 FROM warehouse_members WHERE warehouse_id = p_warehouse_id AND user_id = auth.uid()) THEN
      RAISE EXCEPTION 'Not authorized for this warehouse';
  END IF;

  -- Create transaction header
  INSERT INTO transactions (warehouse_id, created_by, type, transaction_date, remark)
  VALUES (p_warehouse_id, auth.uid(), p_type, p_date, p_remark)
  RETURNING id INTO v_txn_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Lock the product row for update (prevents race conditions)
    SELECT * INTO v_product FROM products
    WHERE id = (v_item->>'product_id')::UUID AND warehouse_id = p_warehouse_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found or not in warehouse: %', v_item->>'product_id';
    END IF;

    -- Calculate new stock
    IF p_type = 'inward' THEN
      v_new_stock := v_product.current_stock + (v_item->>'quantity')::NUMERIC;
    ELSIF p_type = 'outward' THEN
      v_new_stock := v_product.current_stock - (v_item->>'quantity')::NUMERIC;
      IF v_new_stock < 0 THEN
        RAISE EXCEPTION 'Insufficient stock for product: %', v_product.name;
      END IF;
    ELSE
        RAISE EXCEPTION 'Invalid transaction type';
    END IF;

    -- Insert line item with audit snapshot
    INSERT INTO transaction_items (transaction_id, product_id, quantity, stock_before, stock_after)
    VALUES (v_txn_id, v_product.id, (v_item->>'quantity')::NUMERIC, v_product.current_stock, v_new_stock);

    -- Update product stock
    UPDATE products SET current_stock = v_new_stock, updated_at = now()
    WHERE id = v_product.id;
  END LOOP;

  RETURN v_txn_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- B) Function: delete_transaction
CREATE OR REPLACE FUNCTION delete_transaction(
  p_transaction_id UUID
) RETURNS VOID AS $$
DECLARE
  v_txn RECORD;
  v_item RECORD;
  v_product RECORD;
  v_new_stock NUMERIC;
BEGIN
  -- Get transaction details and lock it
  SELECT * INTO v_txn FROM transactions
  WHERE id = p_transaction_id FOR UPDATE;

  IF NOT FOUND THEN
      RAISE EXCEPTION 'Transaction not found';
  END IF;

  -- Verify user has access to this warehouse
  IF NOT EXISTS (SELECT 1 FROM warehouse_members WHERE warehouse_id = v_txn.warehouse_id AND user_id = auth.uid()) THEN
      RAISE EXCEPTION 'Not authorized for this warehouse';
  END IF;

  -- Loop through transaction items to reverse stock
  FOR v_item IN SELECT * FROM transaction_items WHERE transaction_id = p_transaction_id
  LOOP
      -- Lock the product row for update
      SELECT * INTO v_product FROM products
      WHERE id = v_item.product_id FOR UPDATE;

      -- Reverse the stock
      IF v_txn.type = 'inward' THEN
          v_new_stock := v_product.current_stock - v_item.quantity;
      ELSIF v_txn.type = 'outward' THEN
          v_new_stock := v_product.current_stock + v_item.quantity;
      END IF;

      -- Update product stock
      UPDATE products SET current_stock = v_new_stock, updated_at = now()
      WHERE id = v_product.id;
  END LOOP;

  -- Delete transaction (cascades to items due to ON DELETE CASCADE)
  DELETE FROM transactions WHERE id = p_transaction_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- C) Trigger to automatically create a default warehouse on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_warehouse_id UUID;
BEGIN
  -- Create a default warehouse for the new user
  INSERT INTO public.warehouses (name, owner_id)
  VALUES ('Main Warehouse', NEW.id)
  RETURNING id INTO new_warehouse_id;

  -- Add the user as a member of their new warehouse
  INSERT INTO public.warehouse_members (warehouse_id, user_id, invited_email)
  VALUES (new_warehouse_id, NEW.id, NEW.email);

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
