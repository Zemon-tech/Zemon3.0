"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch user data from the database
  const fetchUserData = async (userId) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user data:', error.message);
      return null;
    }
  };

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        // Fetch additional user data including role
        const data = await fetchUserData(session.user.id);
        setUserData(data);
      } else {
        setUser(null);
        setUserData(null);
      }
      
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          
          // Fetch additional user data including role
          const data = await fetchUserData(session.user.id);
          setUserData(data);
        } else {
          setUser(null);
          setUserData(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Set user to null immediately to update isAuthenticated
    setUser(null);
    setUserData(null);
    // Then call the actual sign out
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Check if the user is an admin
  const isAdmin = userData?.role === 'admin';
  
  // Check if the user is a team leader
  const isTeamLeader = userData?.role === 'team_leader';

  const value = {
    user,
    userData,
    loading,
    signOut,
    isAuthenticated: !!user,
    isAdmin,
    isTeamLeader,
    role: userData?.role || 'member'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 