import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AdType = 'image' | 'video';

export interface Ad {
  id: string;
  title: string;
  description: string;
  type: AdType;
  url: string;
  duration: number;
  is_active: boolean;
  created_at: string;
  external_link: string;
}

export interface News {
  id: string;
  title: string;
  description: string;
  url: string;
  image_url: string;
  published_at: string;
  source: string;
  created_at: string;
}