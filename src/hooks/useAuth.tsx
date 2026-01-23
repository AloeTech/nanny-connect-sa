// hooks/useAuth.ts
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata?: {
      first_name?: string;
      last_name?: string;
      phone?: string;
      city?: string;
      suburb?: string;
      user_type?: string;
      bank_name?: string;           // NEW
      account_number?: string;      // NEW
      account_holder_name?: string; // NEW
    }
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            try {
              const { data: roles } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .single();
              setUserRole(roles?.role || null);
            } catch (error) {
              console.error('Error fetching user role:', error);
            }
          }, 0);
        } else {
          setUserRole(null);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          setUserRole(roles?.role || null);
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      } else {
        setUserRole(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  // ───────────────────────────────────────────────
  // SIGNUP – now accepts and forwards bank details
  // ───────────────────────────────────────────────
  const signUp = async (
    email: string,
    password: string,
    metadata?: {
      first_name?: string;
      last_name?: string;
      phone?: string;
      city?: string;
      suburb?: string;
      user_type?: string;
      bank_name?: string;
      account_number?: string;
      account_holder_name?: string;
    }
  ) => {
    try {
      cleanupAuthState();

      // Prepare payload for Edge Function
      const payload: any = {
        email,
        password,
        first_name: metadata?.first_name,
        last_name: metadata?.last_name,
        phone: metadata?.phone,
        city: metadata?.city,
        suburb: metadata?.suburb,
        user_type: metadata?.user_type,
        send_confirmation: true,
        redirect_to: `${window.location.origin}/`
      };

      // Only include bank details if user is a nanny
      if (metadata?.user_type === 'nanny') {
        payload.bank_name = metadata.bank_name?.trim();
        payload.account_number = metadata.account_number?.trim();
        payload.account_holder_name = metadata.account_holder_name?.trim();
      }

      const { data, error } = await supabase.functions.invoke('signup-with-role', {
        body: payload
      });

      if (error || !data?.success) {
        const message = error?.message || data?.error || 'Failed to create account';
        toast({
          title: "Sign Up Error",
          description: message,
          variant: "destructive"
        });
        return { error: new Error(message) };
      }

      // Success toast
      toast({
        title: "Check Your Email",
        description: "Please confirm your email to complete your profile.",
        variant: "default"
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      cleanupAuthState();

      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {}

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive"
        });
      } else if (data.user) {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        window.location.href = '/';
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      cleanupAuthState();

      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {}

      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });

      window.location.href = '/auth';
    } catch (error: any) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};