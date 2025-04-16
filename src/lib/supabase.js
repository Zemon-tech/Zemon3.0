import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Export a safe version of the Supabase client
export let supabase = null;

try {
  // Check if the environment variables are available
  if (!supabaseUrl || !supabaseAnonKey) {
    // Only throw error in production, use a mock in development
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing Supabase environment variables');
    } else {
      console.warn('Supabase environment variables are missing. Using mock data mode.');
    }
  } else {
    // Initialize the Supabase client if environment variables are available
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Add a safety check method for components to verify the client
    supabase.isInitialized = function() {
      return supabase !== null && typeof supabase.from === 'function';
    };
  }
} catch (error) {
  // Log the error but don't crash the app
  console.error('Error initializing Supabase client:', error);
  
  // In development, we'll continue with a null client and use mock data
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Application will run with mock data');
  }
} 