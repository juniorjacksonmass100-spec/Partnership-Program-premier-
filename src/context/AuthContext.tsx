import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, formatSupabaseError } from '../lib/supabase';
import { Profile, UserRole, PartnerCategory } from '../types/database.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isConfigured: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    fellowshipCenter?: string;
    partnerCategory?: PartnerCategory | string;
  }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchProfile = async (userId: string, userEmail?: string, userMeta?: any) => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Hitilafu wakati wa kupata wasifu:', error.message);
      }

      if (data) {
        const fullProfile: Profile = {
          ...data,
          email: userEmail,
        };
        setProfile(fullProfile);
        return fullProfile;
      } else {
        // If profile row doesn't exist yet (e.g. trigger failed or not run), create it
        const newProfile: Partial<Profile> = {
          id: userId,
          full_name: userMeta?.full_name || userEmail?.split('@')[0] || 'Mshirika',
          phone_number: userMeta?.phone_number || '',
          fellowship_center: userMeta?.fellowship_center || 'Makao Makuu',
          partner_category: userMeta?.partner_category || 'Mshirika wa Kawaida',
          role: 'partner',
        };

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .maybeSingle();

        if (inserted && !insertError) {
          const finalProf: Profile = { ...inserted, email: userEmail };
          setProfile(finalProf);
          return finalProf;
        } else {
          // In-memory fallback representation
          const fallbackProf: Profile = {
            id: userId,
            full_name: (newProfile.full_name as string) || 'Mshirika',
            phone_number: newProfile.phone_number,
            fellowship_center: newProfile.fellowship_center,
            partner_category: newProfile.partner_category,
            role: 'partner',
            created_at: new Date().toISOString(),
            email: userEmail,
          };
          setProfile(fallbackProf);
          return fallbackProf;
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email, session.user.user_metadata).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Hitilafu ya kupata kikao:', err);
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchProfile(newSession.user.id, newSession.user.email, newSession.user.user_metadata);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real-time listener for current user's profile changes (e.g. role upgraded to admin)
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            setProfile((prev) => ({
              ...(prev || {}),
              ...(payload.new as Profile),
              email: user.email,
            } as Profile));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      const err = 'Supabase haijaunganishwa bado. Tafadhali sanidi VITE_SUPABASE_URL na VITE_SUPABASE_ANON_KEY.';
      setAuthError(err);
      return { success: false, error: err };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const swahiliMsg = formatSupabaseError(error);
        setAuthError(swahiliMsg);
        return { success: false, error: swahiliMsg };
      }

      if (data.user) {
        await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);
      }

      return { success: true };
    } catch (err: any) {
      const msg = formatSupabaseError(err);
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const signUp = async ({
    email,
    password,
    fullName,
    phoneNumber,
    fellowshipCenter,
    partnerCategory,
  }: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    fellowshipCenter?: string;
    partnerCategory?: PartnerCategory | string;
  }) => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      const err = 'Supabase haijaunganishwa bado. Tafadhali sanidi VITE_SUPABASE_URL na VITE_SUPABASE_ANON_KEY.';
      setAuthError(err);
      return { success: false, error: err };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone_number: phoneNumber?.trim() || '',
            fellowship_center: fellowshipCenter?.trim() || 'Makao Makuu',
            partner_category: partnerCategory || 'Mshirika wa Kawaida',
          },
        },
      });

      if (error) {
        const swahiliMsg = formatSupabaseError(error);
        setAuthError(swahiliMsg);
        return { success: false, error: swahiliMsg };
      }

      if (data.user) {
        // Also ensure profile exists directly in case database trigger hasn't fired yet
        await fetchProfile(data.user.id, data.user.email, {
          full_name: fullName.trim(),
          phone_number: phoneNumber?.trim() || '',
          fellowship_center: fellowshipCenter?.trim() || 'Makao Makuu',
          partner_category: partnerCategory || 'Mshirika wa Kawaida',
        });
      }

      return { success: true };
    } catch (err: any) {
      const msg = formatSupabaseError(err);
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (err) {
      console.error('Hitilafu wakati wa kutoka:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata);
    }
  };

  const isAdmin = useMemo(() => {
    return profile?.role === 'admin';
  }, [profile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAdmin,
        isConfigured: isSupabaseConfigured,
        authError,
        clearAuthError: () => setAuthError(null),
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth lazima itumike ndani ya AuthProvider');
  }
  return context;
};
