-- First, let's add sample academy videos for training
INSERT INTO public.academy_videos (title, description, video_url, duration_minutes, order_index, is_active) VALUES
('Introduction to Professional Nanny Care', 'Welcome to the Nanny Academy. Learn the fundamentals of professional childcare and your role as a trusted caregiver.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 15, 1, true),
('Child Development Basics', 'Understanding child development stages from infancy to school age. Learn age-appropriate activities and milestones.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 25, 2, true),
('Safety and First Aid Essentials', 'Critical safety protocols and basic first aid for common childhood emergencies.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 30, 3, true),
('Nutrition and Meal Planning', 'Creating healthy, balanced meals for children. Understanding dietary restrictions and nutritional needs.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 20, 4, true),
('Effective Communication with Parents', 'Building trust and maintaining professional relationships with families. Daily communication best practices.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 18, 5, true),
('Managing Behavioral Challenges', 'Positive discipline techniques and strategies for managing difficult behaviors in children.', 'https://www.youtube.com/Watch?v=dQw4w9WgXcQ', 22, 6, true),
('Educational Activities and Play', 'Age-appropriate educational activities, creative play, and supporting learning at home.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 28, 7, true),
('Professional Boundaries and Ethics', 'Understanding your role, maintaining professional boundaries, and ethical considerations in childcare.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 16, 8, true);

-- Create a function to assign user roles based on email patterns or manual assignment
CREATE OR REPLACE FUNCTION public.assign_user_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Check if role already exists
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) THEN
        RETURN true;
    END IF;
    
    -- Insert the new role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, _role);
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- Update the handle_new_user function to better handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
    user_type text;
BEGIN
    -- Insert into profiles
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name'
    );

    -- Get user type from metadata
    user_type := NEW.raw_user_meta_data ->> 'user_type';

    -- Assign admin role to admin email
    IF NEW.email = 'admin@nannyplacementssouthafrica.co.za' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin');
    -- Assign role based on user type selection
    ELSIF user_type = 'nanny' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'nanny');
        -- Create empty nanny profile
        INSERT INTO public.nannies (user_id, experience_type)
        VALUES (NEW.id, 'nanny');
    ELSIF user_type = 'client' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'client');
        -- Create empty client profile
        INSERT INTO public.clients (user_id)
        VALUES (NEW.id);
    END IF;

    RETURN NEW;
END;
$$;