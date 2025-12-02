-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'nanny', 'client');

-- Create education level enum
CREATE TYPE public.education_level AS ENUM ('matric', 'certificate', 'diploma', 'degree');

-- Create experience type enum
CREATE TYPE public.experience_type AS ENUM ('nanny', 'cleaning', 'both');

-- Create employment type enum
CREATE TYPE public.employment_type AS ENUM ('full_time', 'part_time');

-- Create accommodation type enum
CREATE TYPE public.accommodation_type AS ENUM ('live_in', 'stay_out');

-- Create document status enum
CREATE TYPE public.document_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  city TEXT,
  suburb TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create nannies table
CREATE TABLE public.nannies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  languages TEXT[] DEFAULT '{}',
  experience_type experience_type NOT NULL,
  experience_duration INTEGER, -- in months
  education_level education_level,
  training_first_aid BOOLEAN DEFAULT false,
  training_nanny BOOLEAN DEFAULT false,
  training_cpr BOOLEAN DEFAULT false,
  training_child_development BOOLEAN DEFAULT false,
  criminal_check_url TEXT,
  criminal_check_status document_status DEFAULT 'pending',
  credit_check_url TEXT,
  credit_check_status document_status DEFAULT 'pending',
  interview_video_url TEXT,
  academy_completed BOOLEAN DEFAULT false,
  profile_approved BOOLEAN DEFAULT false,
  hourly_rate DECIMAL(10,2),
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  description TEXT,
  preferred_experience_type experience_type,
  preferred_employment_type employment_type,
  preferred_accommodation_type accommodation_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create academy_videos table
CREATE TABLE public.academy_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create nanny_academy_progress table
CREATE TABLE public.nanny_academy_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nanny_id UUID REFERENCES public.nannies(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.academy_videos(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(nanny_id, video_id)
);

-- Create interests table (when clients express interest in nannies)
CREATE TABLE public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  nanny_id UUID REFERENCES public.nannies(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, paid, contacted
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  nanny_id UUID REFERENCES public.nannies(id) ON DELETE CASCADE NOT NULL,
  interest_id UUID REFERENCES public.interests(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 500.00,
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nannies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nanny_academy_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Nannies policies
CREATE POLICY "Nannies can view and edit their own profile" ON public.nannies
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Clients can view approved nanny profiles" ON public.nannies
  FOR SELECT USING (
    profile_approved = true AND 
    (public.has_role(auth.uid(), 'client') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Admins can manage all nanny profiles" ON public.nannies
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Clients policies
CREATE POLICY "Clients can manage their own profile" ON public.clients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all client profiles" ON public.clients
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Academy videos policies
CREATE POLICY "Authenticated users can view active videos" ON public.academy_videos
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage academy videos" ON public.academy_videos
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Academy progress policies
CREATE POLICY "Nannies can view and manage their own progress" ON public.nanny_academy_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.nannies n 
      WHERE n.id = nanny_id AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all progress" ON public.nanny_academy_progress
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Interests policies
CREATE POLICY "Clients can manage their own interests" ON public.interests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = client_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Nannies can view interests in them" ON public.interests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.nannies n 
      WHERE n.id = nanny_id AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all interests" ON public.interests
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Payments policies
CREATE POLICY "Clients can view their own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = client_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create payments" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = client_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('profile-pictures', 'profile-pictures', true),
  ('criminal-checks', 'criminal-checks', false),
  ('credit-checks', 'credit-checks', false),
  ('interview-videos', 'interview-videos', false),
  ('academy-videos', 'academy-videos', false);

-- Storage policies for profile pictures
CREATE POLICY "Users can upload their own profile picture" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own profile picture" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can update their own profile picture" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-pictures' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile picture" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-pictures' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for documents (criminal/credit checks)
CREATE POLICY "Nannies can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    (bucket_id = 'criminal-checks' OR bucket_id = 'credit-checks') AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Document owners and admins can view documents" ON storage.objects
  FOR SELECT USING (
    (bucket_id = 'criminal-checks' OR bucket_id = 'credit-checks') AND
    (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
  );

-- Storage policies for interview videos
CREATE POLICY "Nannies can upload their own interview videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'interview-videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Interview video access for relevant users" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'interview-videos' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR 
     public.has_role(auth.uid(), 'admin') OR
     public.has_role(auth.uid(), 'client'))
  );

-- Storage policies for academy videos
CREATE POLICY "Admins can upload academy videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'academy-videos' AND 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Authenticated users can view academy videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'academy-videos');

CREATE POLICY "Admins can manage academy videos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'academy-videos' AND 
    public.has_role(auth.uid(), 'admin')
  );

-- Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nannies_updated_at
    BEFORE UPDATE ON public.nannies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academy_videos_updated_at
    BEFORE UPDATE ON public.academy_videos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert admin user role (this will need to be done after the admin user signs up)
-- The admin email is admin@nannyplacementssouthafrica.co.za

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into profiles
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name'
    );

    -- Assign admin role to admin email
    IF NEW.email = 'admin@nannyplacementssouthafrica.co.za' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update nanny academy completion status
CREATE OR REPLACE FUNCTION public.update_nanny_academy_completion()
RETURNS TRIGGER AS $$
DECLARE
    total_videos INTEGER;
    completed_videos INTEGER;
    nanny_user_id UUID;
BEGIN
    -- Get the nanny's user_id
    SELECT user_id INTO nanny_user_id
    FROM public.nannies
    WHERE id = NEW.nanny_id;

    -- Count total active videos
    SELECT COUNT(*) INTO total_videos
    FROM public.academy_videos
    WHERE is_active = true;

    -- Count completed videos for this nanny
    SELECT COUNT(*) INTO completed_videos
    FROM public.nanny_academy_progress nap
    JOIN public.academy_videos av ON nap.video_id = av.id
    WHERE nap.nanny_id = NEW.nanny_id AND av.is_active = true;

    -- Update academy_completed status
    UPDATE public.nannies
    SET academy_completed = (completed_videos >= total_videos AND total_videos > 0)
    WHERE id = NEW.nanny_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for academy completion tracking
CREATE TRIGGER update_academy_completion
    AFTER INSERT ON public.nanny_academy_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_nanny_academy_completion();