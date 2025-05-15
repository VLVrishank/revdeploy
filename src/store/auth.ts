import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },
  signUp: async (email, password, username) => {
    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) throw signUpError;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, username }]);
      if (profileError) throw profileError;
    }
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, profile: null });
  },
  loadUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      set({ user, loading: false });

      if (user) {
        // Fix: Use maybeSingle() instead of single() to handle no results gracefully
        const { data: profile } = await supabase
          .from('profiles')
          .select()
          .eq('id', user.id)
          .maybeSingle();
        
        // If no profile exists, create one with a default username
        if (!profile) {
          const { data: newProfile, error: profileError } = await supabase
            .from('profiles')
            .insert([{ 
              id: user.id, 
              username: `user_${user.id.slice(0, 8)}` 
            }])
            .select()
            .single();
            
          if (profileError) throw profileError;
          set({ profile: newProfile });
        } else {
          set({ profile });
        }
      }
    } catch (error) {
      set({ loading: false });
      console.error('Error loading user:', error);
    }
  },
}));