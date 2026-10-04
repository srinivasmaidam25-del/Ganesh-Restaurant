-- =====================================================================
-- SUPABASE POSTGRESQL SCHEMA INITIALIZATION
-- Copy and paste this script directly in the Supabase SQL Editor console.
-- =====================================================================

-- DROP TABLE SCRIPTS (For reset runs)
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS inventory CASCADE;
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS coupons CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS foods CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS tables CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TABLE IF EXISTS restaurants CASCADE;

-- 1. Restaurants Table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo TEXT DEFAULT '',
  banner TEXT DEFAULT '',
  address TEXT NOT NULL,
  gst_number TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  opening_hours TEXT DEFAULT '11:00 AM - 11:00 PM',
  tax_percentage NUMERIC DEFAULT 5.0,
  service_charge NUMERIC DEFAULT 2.0,
  currency TEXT DEFAULT '$',
  theme JSONB DEFAULT '{"primaryColor": "#EA580C", "isDarkDefault": true}'::jsonb,
  social_links JSONB DEFAULT '{"facebook": "https://facebook.com", "instagram": "https://instagram.com", "twitter": ""}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles Table (Map user roles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('superadmin', 'admin', 'kitchen', 'customer')) DEFAULT 'customer',
  phone TEXT DEFAULT '',
  loyalty_points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tables Table
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  number TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'disabled')) DEFAULT 'active',
  qr_code_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (restaurant_id, number)
);

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (restaurant_id, name)
);

-- 5. Foods Table
CREATE TABLE IF NOT EXISTS foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  ingredients TEXT[] DEFAULT '{}',
  price NUMERIC NOT NULL,
  image TEXT DEFAULT '',
  is_veg BOOLEAN DEFAULT true,
  is_non_veg BOOLEAN DEFAULT false,
  spicy_level TEXT CHECK (spicy_level IN ('none', 'low', 'medium', 'high')) DEFAULT 'none',
  is_available BOOLEAN DEFAULT true,
  is_bestseller BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 5.0,
  prep_time INT DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  table_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT DEFAULT '',
  customer_phone TEXT DEFAULT '',
  items JSONB NOT NULL, -- Array of { foodId, name, price, quantity, notes }
  sub_total NUMERIC NOT NULL,
  tax NUMERIC DEFAULT 0,
  service_charge NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('received', 'accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled')) DEFAULT 'received',
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  payment_method TEXT CHECK (payment_method IN ('cash', 'upi', 'stripe', 'razorpay')) DEFAULT 'cash',
  notes TEXT DEFAULT '',
  loyalty_points_earned INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  type TEXT CHECK (type IN ('percentage', 'flat')) NOT NULL,
  value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount NUMERIC DEFAULT 0,
  expiry_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (restaurant_id, code)
);

-- 9. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'units',
  min_threshold NUMERIC NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (restaurant_id, item_name)
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('new_order', 'payment', 'kitchen_alert', 'low_stock')) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- SEED DEFAULT DEMO DATA
-- =====================================================================

-- Insert Pizzeria
INSERT INTO restaurants (id, name, slug, address, tax_percentage, service_charge, currency, banner, logo) 
VALUES (
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'Rasoi - Indian Fine Dine', 
  'la-piazza', 
  '123 Curry Road, Connaught Place, New Delhi 110001', 
  5.0, 
  2.0, 
  '₹',
  'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=1200',
  'https://i.postimg.cc/4mVbnxjj/Chat-GPT-Image-Jul-29-2026-12-22-54-PM.png'
) ON CONFLICT (slug) DO NOTHING;

-- Insert Tables
INSERT INTO tables (restaurant_id, number, status) VALUES 
('e29d7fa1-3211-477b-8919-450f63d274ff', '1', 'active'),
('e29d7fa1-3211-477b-8919-450f63d274ff', '2', 'active'),
('e29d7fa1-3211-477b-8919-450f63d274ff', '3', 'active'),
('e29d7fa1-3211-477b-8919-450f63d274ff', '4', 'active'),
('e29d7fa1-3211-477b-8919-450f63d274ff', '5', 'active')
ON CONFLICT DO NOTHING;

-- Insert Categories
INSERT INTO categories (id, restaurant_id, name, order_index) VALUES 
('a123f1a1-cf0b-411a-85d0-998fde03a8d1', 'e29d7fa1-3211-477b-8919-450f63d274ff', 'Starters', 1),
('a123f2b2-df1c-422b-96e1-998fde03a8d2', 'e29d7fa1-3211-477b-8919-450f63d274ff', 'Curry Mains', 2),
('a123f3c3-ef2d-433c-97f2-998fde03a8d3', 'e29d7fa1-3211-477b-8919-450f63d274ff', 'Breads & Rice', 3),
('a123f4d4-ff3e-444d-9803-998fde03a8d4', 'e29d7fa1-3211-477b-8919-450f63d274ff', 'Desserts & Drinks', 4),
('a123f5e5-aa5f-555e-9905-998fde03a8d5', 'e29d7fa1-3211-477b-8919-450f63d274ff', 'Biryani', 5)
ON CONFLICT DO NOTHING;

-- Insert Foods
INSERT INTO foods (restaurant_id, category_id, name, description, price, is_veg, is_non_veg, rating, prep_time, image, ingredients, spicy_level) VALUES
(
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'a123f1a1-cf0b-411a-85d0-998fde03a8d1', 
  'Samosa Chaat', 
  'Crispy vegetable samosas crushed and topped with warm spiced chickpeas, yogurt, sweet and tangy tamarind-mint chutneys.', 
  120.00, 
  true, 
  false, 
  4.8, 
  8,
  'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=600',
  ARRAY['Samosa', 'Chickpeas', 'Yogurt', 'Chutney'],
  'medium'
),
(
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'a123f1a1-cf0b-411a-85d0-998fde03a8d1', 
  'Tandoori Paneer Tikka', 
  'Fresh cottage cheese cubes marinated in yogurt and hot Indian spices, skewered and grilled to perfection in clay oven.', 
  240.00, 
  true, 
  false, 
  4.6, 
  12,
  'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=600',
  ARRAY['Paneer', 'Yogurt', 'Bell Peppers', 'Onion'],
  'medium'
),
(
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'a123f2b2-df1c-422b-96e1-998fde03a8d2', 
  'Shahi Paneer Butter Masala', 
  'Soft paneer cubes simmered in a mildly spiced, sweet and creamy tomato-cashew nut gravy finished with fresh cream.', 
  320.00, 
  true, 
  false, 
  4.9, 
  15,
  'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=600',
  ARRAY['Paneer', 'Tomato', 'Cashews', 'Cream'],
  'low'
),
(
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'a123f2b2-df1c-422b-96e1-998fde03a8d2', 
  'Butter Chicken Murgh Makhani', 
  'Tender pulled chicken cooked in a rich, buttery, velvety tomato gravy with mild spices and crushed fenugreek leaves.', 
  380.00, 
  false, 
  true, 
  4.9, 
  18,
  'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=600',
  ARRAY['Chicken', 'Butter', 'Tomato', 'Cream'],
  'medium'
),
(
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'a123f3c3-ef2d-433c-97f2-998fde03a8d3', 
  'Garlic Butter Naan', 
  'Fresh leavened wheat bread baked in tandoor, brushed with warm butter and loaded with minced garlic and herbs.', 
  80.00, 
  true, 
  false, 
  4.9, 
  5,
  'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=600',
  ARRAY['Flour', 'Butter', 'Garlic', 'Coriander'],
  'none'
),
(
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'a123f4d4-ff3e-444d-9803-998fde03a8d4', 
  'Sweet Mango Lassi', 
  'Traditional sweet yogurt drink blended with fresh Alphonso mango pulp and cardamom.', 
  120.00, 
  true, 
  false, 
  4.8, 
  4,
  'https://images.unsplash.com/photo-1571006682864-7407852ee318?auto=format&fit=crop&q=80&w=600',
  ARRAY['Yogurt', 'Mango', 'Sugar', 'Cardamom'],
  'none'
),
(
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'a123f5e5-aa5f-555e-9905-998fde03a8d5', 
  'Veg Dum Biryani', 
  'Fragrant basmati rice layered with spiced garden vegetables, saffron, and aromatic herbs cooked in traditional dum style. Served with Raita & Salan.', 
  180.00, 
  true, 
  false, 
  4.8, 
  15,
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600',
  ARRAY['Basmati Rice', 'Carrots', 'Beans', 'Green Peas', 'Saffron', 'Dum Spices', 'Raita', 'Salan'],
  'medium'
),
(
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'a123f5e5-aa5f-555e-9905-998fde03a8d5', 
  'Paneer Biryani', 
  'Succulent cubes of marinated cottage cheese layered with spiced basmati rice and slow-cooked in dum sealed pot. Served with Raita & Salan.', 
  220.00, 
  true, 
  false, 
  4.7, 
  15,
  'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=600',
  ARRAY['Paneer', 'Basmati Rice', 'Fried Onion', 'Mint', 'Ghee', 'Biryani Spices', 'Raita', 'Salan'],
  'medium'
),
(
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'a123f5e5-aa5f-555e-9905-998fde03a8d5', 
  'Mushroom Biryani', 
  'Juicy button mushrooms sauteed in rich Hyderabadi masala, infused with aged fragrant basmati rice and fresh herbs. Served with Raita & Salan.', 
  210.00, 
  true, 
  false, 
  4.6, 
  15,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=600',
  ARRAY['Button Mushrooms', 'Basmati Rice', 'Brown Onion', 'Coriander', 'Shahi Masala', 'Raita', 'Salan'],
  'medium'
),
(
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'a123f5e5-aa5f-555e-9905-998fde03a8d5', 
  'Chicken Dum Biryani', 
  'Our signature Hyderabadi dum biryani featuring tender chicken marinated in spiced yogurt and slow-cooked with long grain saffron basmati rice. Served with Raita & Salan.', 
  240.00, 
  false, 
  true, 
  4.9, 
  18,
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600',
  ARRAY['Tender Chicken', 'Basmati Rice', 'Saffron', 'Brown Onion', 'Mint', 'Desi Ghee', 'Raita', 'Salan'],
  'spicy'
),
(
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'a123f5e5-aa5f-555e-9905-998fde03a8d5', 
  'Chicken Fry Piece Biryani', 
  'Crispy, spicy pan-roasted chicken fry pieces served generously over fragrant, hot spiced biryani rice. Served with Raita & Salan.', 
  280.00, 
  false, 
  true, 
  4.8, 
  16,
  'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=600',
  ARRAY['Spiced Fried Chicken', 'Biryani Rice', 'Curry Leaves', 'Green Chillies', 'Cashews', 'Raita', 'Salan'],
  'spicy'
),
(
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'a123f5e5-aa5f-555e-9905-998fde03a8d5', 
  'Chicken 65 Biryani', 
  'Delectable combination of fiery boneless Chicken 65 tossed with curry leaves and layered atop aromatic dum biryani rice. Served with Raita & Salan.', 
  300.00, 
  false, 
  true, 
  4.9, 
  16,
  'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=600',
  ARRAY['Chicken 65 Boneless', 'Aromatic Rice', 'Red Chillies', 'Curry Leaves', 'Garlic', 'Raita', 'Salan'],
  'spicy'
),
(
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'a123f5e5-aa5f-555e-9905-998fde03a8d5', 
  'Egg Biryani', 
  'Golden shallow-fried boiled eggs infused with rich biryani masala and layered with fluffy basmati rice. Served with Raita & Salan.', 
  190.00, 
  false, 
  true, 
  4.6, 
  12,
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=600',
  ARRAY['Boiled Eggs', 'Basmati Rice', 'Caramelized Onion', 'Mint', 'Biryani Masala', 'Raita', 'Salan'],
  'medium'
),
(
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'a123f5e5-aa5f-555e-9905-998fde03a8d5', 
  'Hyderabadi Mutton Biryani', 
  'Royal traditional recipe with melt-in-the-mouth tender mutton chunks slow-cooked with aromatic basmati rice, saffron, and royal spices. Served with Raita & Salan.', 
  320.00, 
  false, 
  true, 
  4.9, 
  20,
  'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=600',
  ARRAY['Tender Mutton', 'Aged Basmati Rice', 'Kewra Water', 'Saffron', 'Cardamom', 'Shahi Jeera', 'Raita', 'Salan'],
  'spicy'
),
(
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  'a123f5e5-aa5f-555e-9905-998fde03a8d5', 
  'Prawns Biryani', 
  'Fresh coastal prawns cooked in a rich, tangy spiced masala and gently folded with fragrant saffron dum rice. Served with Raita & Salan.', 
  330.00, 
  false, 
  true, 
  4.8, 
  15,
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600',
  ARRAY['Fresh Prawns', 'Basmati Rice', 'Coconut & Spices', 'Mint', 'Lemon Juice', 'Raita', 'Salan'],
  'medium'
)
ON CONFLICT DO NOTHING;

-- Insert Coupons
INSERT INTO coupons (restaurant_id, code, type, value, min_order_amount, expiry_date) VALUES
('e29d7fa1-3211-477b-8919-450f63d274ff', 'WELCOME10', 'percentage', 10, 200, '2026-12-31 23:59:59+00'),
('e29d7fa1-3211-477b-8919-450f63d274ff', 'CURRY100', 'flat', 100, 500, '2026-12-31 23:59:59+00')
ON CONFLICT DO NOTHING;

-- Insert Raw Stocks
INSERT INTO inventory (restaurant_id, item_name, quantity, unit, min_threshold) VALUES
('e29d7fa1-3211-477b-8919-450f63d274ff', 'Paneer Cottage Cheese', 25.5, 'kg', 10),
('e29d7fa1-3211-477b-8919-450f63d274ff', 'Chicken Breast halves', 15.0, 'kg', 5),
('e29d7fa1-3211-477b-8919-450f63d274ff', 'Basmati Rice grains', 4.5, 'kg', 8)
ON CONFLICT DO NOTHING;

-- Enable Realtime Replication trigger for notifications, inventory, and orders tables:
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- 1. Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Restaurants Policies
CREATE POLICY "Allow public read restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Allow admin CRUD restaurants" ON restaurants FOR ALL TO authenticated USING (is_admin());

-- 3. Profiles Policies
CREATE POLICY "Allow read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow admin CRUD profiles" ON profiles FOR ALL TO authenticated USING (is_admin());

-- 4. Tables Policies
CREATE POLICY "Allow public read tables" ON tables FOR SELECT USING (true);
CREATE POLICY "Allow admin CRUD tables" ON tables FOR ALL TO authenticated USING (is_admin());

-- 5. Categories Policies
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow admin CRUD categories" ON categories FOR ALL TO authenticated USING (is_admin());

-- 6. Foods (Menu Items) Policies
CREATE POLICY "Allow public read foods" ON foods FOR SELECT USING (true);
CREATE POLICY "Allow admin CRUD foods" ON foods FOR ALL TO authenticated USING (is_admin());

-- 7. Orders Policies
CREATE POLICY "Allow public select orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update orders" ON orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin CRUD orders" ON orders FOR ALL TO authenticated USING (is_admin());

-- 8. Payments Policies
CREATE POLICY "Allow public select payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin CRUD payments" ON payments FOR ALL TO authenticated USING (is_admin());

-- 9. Coupons Policies
CREATE POLICY "Allow public read coupons" ON coupons FOR SELECT USING (true);
CREATE POLICY "Allow admin CRUD coupons" ON coupons FOR ALL TO authenticated USING (is_admin());

-- 10. Reviews Policies
CREATE POLICY "Allow public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin CRUD reviews" ON reviews FOR ALL TO authenticated USING (is_admin());

-- 11. Inventory Policies
CREATE POLICY "Allow admin CRUD inventory" ON inventory FOR ALL TO authenticated USING (is_admin());

-- 12. Notifications Policies
CREATE POLICY "Allow public insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin CRUD notifications" ON notifications FOR ALL TO authenticated USING (is_admin());

-- 13. Order Table Fraud Prevention Trigger
CREATE OR REPLACE FUNCTION validate_order_table()
RETURNS TRIGGER AS $$
DECLARE
  actual_table_number TEXT;
  table_exists BOOLEAN;
BEGIN
  -- Ensure table_id is provided
  IF NEW.table_id IS NULL THEN
    RAISE EXCEPTION 'Order must be linked to a valid table (table_id cannot be null)';
  END IF;

  -- Verify that the table exists and get its actual number
  SELECT TRUE, number INTO table_exists, actual_table_number
  FROM tables
  WHERE id = NEW.table_id;

  IF NOT FOUND OR NOT table_exists THEN
    RAISE EXCEPTION 'Invalid Table QR Code. The scanned table does not exist.';
  END IF;

  -- Force table_number to match the actual database table number to prevent fraud
  NEW.table_number := actual_table_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_order_table
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION validate_order_table();

-- 14. Automatically Sync Registered Users to Public Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, restaurant_id, name, email, role, phone)
  VALUES (
    NEW.id,
    'e29d7fa1-3211-477b-8919-450f63d274ff', -- Default Restaurant ID
    COALESCE(NEW.raw_user_meta_data->>'name', 'Staff Member'),
    NEW.email,
    'admin', -- Automatically assign admin role for full database privileges
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger to fire whenever a new user registers in Supabase Auth
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync any existing users in auth.users to public.profiles table
INSERT INTO public.profiles (id, restaurant_id, name, email, role)
SELECT 
  id, 
  'e29d7fa1-3211-477b-8919-450f63d274ff', 
  COALESCE(raw_user_meta_data->>'name', 'Staff Member'), 
  email, 
  'admin'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET role = 'admin';
