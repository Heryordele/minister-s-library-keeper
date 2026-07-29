
-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.app_role AS ENUM ('minister', 'student', 'institution_admin');
CREATE TYPE public.plan_type AS ENUM ('free', 'premium', 'institutional');
CREATE TYPE public.reading_status AS ENUM ('unread', 'reading', 'completed');
CREATE TYPE public.lending_status AS ENUM ('available', 'borrowed', 'overdue', 'returned', 'lost');
CREATE TYPE public.goal_period AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'annual');
CREATE TYPE public.goal_unit AS ENUM ('pages', 'books');
CREATE TYPE public.borrow_status AS ENUM ('borrowed', 'returned', 'overdue', 'lost');
CREATE TYPE public.notification_type AS ENUM ('lending_reminder', 'overdue', 'habit_nudge');
CREATE TYPE public.notification_channel AS ENUM ('email', 'sms', 'whatsapp', 'push');

-- =========================
-- Utility: updated_at trigger
-- =========================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  plan public.plan_type NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- USER ROLES (separate table — security)
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- =========================
-- CATEGORIES (global, public read)
-- =========================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_group TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_group, name)
);

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

-- Seed categories
INSERT INTO public.categories (parent_group, name, sort_order) VALUES
  ('Theology', 'Systematic Theology', 1),
  ('Theology', 'Practical Theology', 2),
  ('Theology', 'Biblical Theology', 3),
  ('Christian Ministry', 'Pastoral', 1),
  ('Christian Ministry', 'Church Administration', 2),
  ('Christian Ministry', 'Leadership Development', 3),
  ('Christian Ministry', 'Discipleship', 4),
  ('Spiritual Growth', 'Prayer', 1),
  ('Spiritual Growth', 'Revival', 2),
  ('Spiritual Growth', 'Faith', 3),
  ('Spiritual Growth', 'Worship', 4),
  ('Missions & Evangelism', 'Evangelism', 1),
  ('Missions & Evangelism', 'Church Planting', 2),
  ('Missions & Evangelism', 'Cross-Cultural Missions', 3),
  ('Personal Development', 'Leadership', 1),
  ('Personal Development', 'Finance', 2),
  ('Personal Development', 'Communication', 3),
  ('Personal Development', 'Productivity', 4),
  ('Biography & History', 'Church History', 1),
  ('Biography & History', 'Missionary Biographies', 2),
  ('Biography & History', 'Revival Accounts', 3);

-- =========================
-- BOOKS
-- =========================
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  publisher TEXT,
  publication_year INT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  edition TEXT,
  cover_image_url TEXT,
  purchase_date DATE,
  purchase_value NUMERIC(12,2),
  reading_status public.reading_status NOT NULL DEFAULT 'unread',
  lending_status public.lending_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_books_owner ON public.books(owner_id);
CREATE INDEX idx_books_category ON public.books(category_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own books" ON public.books
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert own books" ON public.books
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own books" ON public.books
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete own books" ON public.books
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TRIGGER trg_books_updated_at BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- BORROW RECORDS
-- =========================
CREATE TABLE public.borrow_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  borrower_name TEXT NOT NULL,
  borrower_phone TEXT,
  borrower_email TEXT,
  borrower_organization TEXT,
  date_borrowed DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date DATE,
  actual_return_date DATE,
  status public.borrow_status NOT NULL DEFAULT 'borrowed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_borrow_owner ON public.borrow_records(owner_id);
CREATE INDEX idx_borrow_book ON public.borrow_records(book_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.borrow_records TO authenticated;
GRANT ALL ON public.borrow_records TO service_role;
ALTER TABLE public.borrow_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own borrow records" ON public.borrow_records
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert own borrow records" ON public.borrow_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own borrow records" ON public.borrow_records
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete own borrow records" ON public.borrow_records
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TRIGGER trg_borrow_updated_at BEFORE UPDATE ON public.borrow_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- READING GOALS
-- =========================
CREATE TABLE public.reading_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period public.goal_period NOT NULL,
  target_value INT NOT NULL CHECK (target_value > 0),
  target_unit public.goal_unit NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_goals_user ON public.reading_goals(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_goals TO authenticated;
GRANT ALL ON public.reading_goals TO service_role;
ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goals" ON public.reading_goals
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_goals_updated_at BEFORE UPDATE ON public.reading_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- READING PROGRESS
-- =========================
CREATE TABLE public.reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  start_page INT,
  current_page INT,
  total_pages INT,
  reading_time_minutes INT DEFAULT 0,
  notes TEXT,
  key_lessons TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_progress_user ON public.reading_progress(user_id);
CREATE INDEX idx_progress_book ON public.reading_progress(book_id);
CREATE INDEX idx_progress_logged ON public.reading_progress(user_id, logged_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_progress TO authenticated;
GRANT ALL ON public.reading_progress TO service_role;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own progress" ON public.reading_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================
-- READING STREAKS
-- =========================
CREATE TABLE public.reading_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak_days INT NOT NULL DEFAULT 0,
  longest_streak_days INT NOT NULL DEFAULT 0,
  last_logged_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_streaks TO authenticated;
GRANT ALL ON public.reading_streaks TO service_role;
ALTER TABLE public.reading_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own streaks" ON public.reading_streaks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_streaks_updated_at BEFORE UPDATE ON public.reading_streaks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  channel public.notification_channel NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
