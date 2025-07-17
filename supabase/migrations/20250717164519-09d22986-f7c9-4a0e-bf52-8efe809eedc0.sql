
-- Create enum for recall sources
CREATE TYPE recall_source AS ENUM ('FDA', 'CPSC', 'NHTSA', 'OTHER');

-- Create enum for risk levels
CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- Create recalls table
CREATE TABLE public.recalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  product_name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  barcode TEXT,
  recall_number TEXT UNIQUE,
  recall_date DATE NOT NULL,
  risk_level risk_level NOT NULL DEFAULT 'MEDIUM',
  source recall_source NOT NULL,
  affected_lots TEXT[],
  remedy_instructions TEXT,
  product_image_url TEXT,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better search performance
CREATE INDEX idx_recalls_search ON public.recalls USING gin(to_tsvector('english', title || ' ' || product_name || ' ' || brand || ' ' || category));
CREATE INDEX idx_recalls_date ON public.recalls (recall_date DESC);
CREATE INDEX idx_recalls_category ON public.recalls (category);
CREATE INDEX idx_recalls_risk_level ON public.recalls (risk_level);

-- Create user alert preferences table
CREATE TABLE public.alert_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  categories TEXT[],
  brands TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint on email
CREATE UNIQUE INDEX idx_alert_preferences_email ON public.alert_preferences (email);

-- Create user saved products table (for logged-in users)
CREATE TABLE public.user_saved_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  barcode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_saved_products
ALTER TABLE public.user_saved_products ENABLE ROW LEVEL SECURITY;

-- Create policy for user_saved_products
CREATE POLICY "Users can manage their own saved products" 
ON public.user_saved_products 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Make recalls and alert_preferences publicly readable
ALTER TABLE public.recalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_preferences ENABLE ROW LEVEL SECURITY;

-- Public read access to recalls
CREATE POLICY "Anyone can read recalls" 
ON public.recalls 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Only service role can insert/update recalls (for data scraping)
CREATE POLICY "Service role can manage recalls" 
ON public.recalls 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- Anyone can insert alert preferences (for newsletter signup)
CREATE POLICY "Anyone can create alert preferences" 
ON public.alert_preferences 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Only owners can read their alert preferences
CREATE POLICY "Users can read their own alert preferences" 
ON public.alert_preferences 
FOR SELECT 
TO authenticated 
USING (auth.jwt() ->> 'email' = email);

-- Insert some sample recall data
INSERT INTO public.recalls (title, description, product_name, brand, category, recall_number, recall_date, risk_level, source, remedy_instructions, product_image_url) VALUES
('Children''s Toy Recall - Choking Hazard', 'Small parts may detach and pose choking hazard to children under 3 years', 'Building Blocks Set', 'ToyMax', 'Toys & Children''s Products', 'CPSC-2024-001', '2024-01-15', 'HIGH', 'CPSC', 'Stop using immediately. Contact retailer for full refund.', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
('Frozen Pizza Recall - Undeclared Allergens', 'Product may contain undeclared milk allergens', 'Supreme Pizza', 'FreshFrozen', 'Food & Beverages', 'FDA-2024-002', '2024-01-10', 'MEDIUM', 'FDA', 'Check freezer and discard product. Contact manufacturer for refund.', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'),
('Car Airbag Recall', 'Airbag inflators may rupture causing metal fragments to fly', 'Sedan Model X', 'AutoCorp', 'Vehicles', 'NHTSA-2024-003', '2024-01-05', 'CRITICAL', 'NHTSA', 'Schedule immediate repair at authorized dealer.', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400'),
('Coffee Maker Recall - Fire Hazard', 'Heating element may overheat causing fire risk', 'Brew Master 3000', 'KitchenPro', 'Home Appliances', 'CPSC-2024-004', '2023-12-20', 'HIGH', 'CPSC', 'Unplug immediately. Contact manufacturer for replacement.', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'),
('Baby Formula Recall - Contamination', 'Possible bacterial contamination in certain lot numbers', 'Infant Formula Stage 1', 'BabyNutrition', 'Food & Beverages', 'FDA-2024-005', '2023-12-15', 'CRITICAL', 'FDA', 'Stop feeding immediately. Consult pediatrician if child consumed product.', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400');
