import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'owner' | 'admin' | 'manager' | 'service_advisor' | 'technician' | 'parts' | 'customer';

const STAFF_ROLES: AppRole[] = ['owner', 'admin', 'manager', 'service_advisor', 'technician', 'parts'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  clearPasswordRecovery: () => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const RECOVERY_KEY = 'sb-password-recovery';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(RECOVERY_KEY) === '1';
    } catch {
      return false;
    }
  });

  const clearPasswordRecovery = () => {
    setIsPasswordRecovery(false);
    try { sessionStorage.removeItem(RECOVERY_KEY); } catch {}
  };

  const loadRoles = async (userId: string): Promise<AppRole[]> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      if (error) {
        console.error('Error loading roles:', error);
        return [];
      }
      return (data ?? []).map((r: any) => r.role as AppRole);
    } catch (err) {
      console.error('Error loading roles:', err);
      return [];
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
          try { sessionStorage.setItem(RECOVERY_KEY, '1'); } catch {}
        }
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            const r = await loadRoles(session.user.id);
            setRoles(r);
            setIsLoading(false);
          }, 0);
        } else {
          setRoles([]);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const r = await loadRoles(session.user.id);
        setRoles(r);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.error('signOut error', err);
    }
    setUser(null);
    setSession(null);
    setRoles([]);
    setIsPasswordRecovery(false);
    try {
      sessionStorage.removeItem(RECOVERY_KEY);
      // Best-effort: purge any stale Supabase auth keys
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
  };

  const hasRole = (role: AppRole) => roles.includes(role) || (role === 'admin' && roles.includes('owner'));
  const hasAnyRole = (rs: AppRole[]) => rs.some(r => hasRole(r));
  const isAdmin = roles.includes('admin') || roles.includes('owner');
  const isManager = roles.includes('manager');
  const isStaff = STAFF_ROLES.some(r => roles.includes(r));

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        isAdmin,
        isManager,
        isStaff,
        hasRole,
        hasAnyRole,
        isLoading,
        isPasswordRecovery,
        clearPasswordRecovery,
        signIn,
        signUp,
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
