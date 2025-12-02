-- Fix security warnings by setting search_path for functions

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
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
$$;

-- Fix update_nanny_academy_completion function
CREATE OR REPLACE FUNCTION public.update_nanny_academy_completion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;