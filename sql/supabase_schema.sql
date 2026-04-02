-- 1. Profiles Table (links to Auth users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Dogs table
CREATE TABLE dogs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  age TEXT NOT NULL,
  breed TEXT NOT NULL,
  location TEXT NOT NULL,
  image TEXT NOT NULL,
  gender TEXT DEFAULT '公',
  description TEXT,
  traits JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table
CREATE TABLE favorites (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID DEFAULT auth.uid(), -- If using Supabase Auth
  dog_id BIGINT REFERENCES dogs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, dog_id)
);

-- Applications table
CREATE TABLE applications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID DEFAULT auth.uid(),
  dog_id BIGINT REFERENCES dogs(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  has_pets BOOLEAN DEFAULT FALSE,
  housing_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table (Simplified for demo)
CREATE TABLE messages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID DEFAULT auth.uid(),
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_unread BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================

-- 4. Dogs table RLS policies
-- Dogs are public data, everyone can read
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists, then create
DROP POLICY IF EXISTS "Anyone can view dogs" ON dogs;
CREATE POLICY "Anyone can view dogs" ON dogs
  FOR SELECT USING (true);

-- 5. Favorites table RLS policies
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist, then create
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
CREATE POLICY "Users can insert their own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;
CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Applications table RLS policies
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist, then create
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
CREATE POLICY "Users can view their own applications" ON applications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own applications" ON applications;
CREATE POLICY "Users can insert their own applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own applications (e.g., cancel pending applications)
-- For admin operations (view all, update status), backend uses service role key (bypasses RLS)
-- If using anon key, admin would need a separate policy based on user role
DROP POLICY IF EXISTS "Users can update their own applications" ON applications;
CREATE POLICY "Users can update their own applications" ON applications
  FOR UPDATE USING (auth.uid() = user_id);

-- Note: For admin operations (view all, update any application status), we can either:
-- 1. Use service role key in backend (bypasses RLS) - CURRENT APPROACH
-- 2. Create a separate admin policy (requires role management in profiles table)
-- Currently, backend uses service role key for admin operations

-- 7. Messages table RLS policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists, then create
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT strategy for messages:
-- 1. Backend uses service role key (bypasses RLS) - CURRENT APPROACH
-- 2. Use SECURITY DEFINER function insert_message() below (runs with function creator's privileges)
-- The function allows system/backend to insert messages for any user
CREATE OR REPLACE FUNCTION public.insert_message(
  p_user_id UUID,
  p_sender_name TEXT,
  p_content TEXT,
  p_image_url TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_message_id BIGINT;
BEGIN
  INSERT INTO public.messages (user_id, sender_name, content, image_url)
  VALUES (p_user_id, p_sender_name, p_content, p_image_url)
  RETURNING id INTO v_message_id;
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Dog Submissions table (for user-submitted dogs pending review)
CREATE TABLE dog_submissions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  age TEXT NOT NULL,
  breed TEXT NOT NULL,
  location TEXT NOT NULL,
  image TEXT NOT NULL,
  gender TEXT DEFAULT '公',
  description TEXT,
  traits JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_id UUID -- 审核人ID（可选）
);

-- Dog Submissions table RLS policies
ALTER TABLE dog_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist, then create
DROP POLICY IF EXISTS "Users can view their own submissions" ON dog_submissions;
CREATE POLICY "Users can view their own submissions" ON dog_submissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own submissions" ON dog_submissions;
CREATE POLICY "Users can insert their own submissions" ON dog_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Note: Admin operations (view all, approve/reject) use service role key (bypasses RLS)

-- ============================================
-- Storage Bucket for Dog Images
-- ============================================
-- Note: Storage buckets need to be created in Supabase Dashboard
-- Go to Storage > Create Bucket
-- Bucket name: dog-images
-- Public: Yes (to allow public access)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/jpg, image/png, image/gif, image/webp
--
-- Or use SQL (if you have access):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('dog-images', 'dog-images', true);
--
-- Storage policies (RLS for storage):
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'dog-images');
-- CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'dog-images' AND auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE USING (bucket_id = 'dog-images' AND auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE USING (bucket_id = 'dog-images' AND auth.role() = 'authenticated');

-- ============================================
-- Seed Data (Optional, but helpful for testing)
-- ============================================
INSERT INTO dogs (name, age, breed, location, image, description) 
VALUES 
('小胖', '2岁', '金毛寻回犬', '1.2 公里 · 加急领养', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAat6eHf0O9Q-EIrHFetiTKLTPqFj-M-S6OPARY-nov-wQ_nMyrV1kYkWY5zjIv85DYWZ8GphK-8QsADwRqL2uhDft16vUwCmZuF9-ulk4gi255N9aM630C3mAqeU3VuPGs0IWDwToGREyB2icoC-v9hGi8Of2hgQ1gP9fSkxHFDWk7iaLUcJVmNMJ5MbtJtZpR0_cQf1PAuW8POV-Gjeo7JxlaGuD-LB1iTzM2rP98F-k7kCgbv0nIGT_8GzHD9QvDSwAPSWxMe7M', '性格温柔，喜欢散步。'),
('贝贝', '1岁', '萨摩耶', '3.5 公里 · 待领养', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvCJaiyM1Z1vj0FG3-nMzhMomqUQa44qpCY723Rp7ElD29c5GyieaoS82dNoGqG5hiWbrDFCm22g9MUx_3z5ipkLqRcZTY2xETXtTmB39uXWPUHCJFwpkwkV-5ZmoD4tOAD-zbkg4vevPqH-rm1a1JRl_qUF2vUmRPTazDSsoAzBC246iEcsPRZ04wMSQ0j-ZBLjVRbi7M-jsc0OK-tkV8RhnVUe04_Hht0o-d94IZ9w8AP_F27yL8I2jztp1NKI42PXMjweOHEF8', '活泼可爱。'),
('团团', '3岁', '柯基', '2.1 公里 · 待领养', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGVwNnkz0SSJ5LrzWcxFKF63xqVwFLqxkqbiN8YHtE7U52D7eC5eQNuudSwCkzvbc3s924SxR-gsttUdQ8lPAXbT4CTa52X4r0LvmMUnsXRm_lvOh34B0qScCuNdsBsf8g8Al7e2A1rqm6z_3YbpUNkWAM39BXxERLMWhHXn8yyGU_Y17rbzQttqR50PhrSvaBcDzIXQ2KDXNNr9qn88QeovRFdZvd79WhzUbdlH_1-ytwj3uP8JaET5a_WIlSVANkm2TvfJdCcUc', '聪明伶俐。');
