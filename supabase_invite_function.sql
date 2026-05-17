-- Run this in Supabase SQL Editor to enable the invite feature

-- Function to invite a user to a warehouse by email
-- Looks up the user by email and adds them as a member
CREATE OR REPLACE FUNCTION invite_user_to_warehouse(
  p_warehouse_id UUID,
  p_email TEXT
) RETURNS VOID AS $$
DECLARE
  v_target_user_id UUID;
BEGIN
  -- Verify the caller is a member of this warehouse
  IF NOT EXISTS (
    SELECT 1 FROM warehouse_members
    WHERE warehouse_id = p_warehouse_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for this warehouse';
  END IF;

  -- Look up the target user by email
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE email = lower(p_email);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No account found with email: %. They must sign up first.', p_email;
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM warehouse_members
    WHERE warehouse_id = p_warehouse_id AND user_id = v_target_user_id
  ) THEN
    RAISE EXCEPTION 'This user is already a member of this warehouse.';
  END IF;

  -- Add them as a member
  INSERT INTO warehouse_members (warehouse_id, user_id, invited_email)
  VALUES (p_warehouse_id, v_target_user_id, p_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
