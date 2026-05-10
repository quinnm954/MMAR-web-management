import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, HardHat } from 'lucide-react';
import mmarLogo from '@/assets/mmar-logo.jpeg';

const STAFF_ROLES = ['owner', 'technician', 'service_advisor', 'manager', 'parts', 'admin'];

const StaffLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signOut, user, isStaff, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && user && isStaff) {
      navigate(isAdmin ? '/admin/dashboard' : '/tech');
    }
  }, [user, isStaff, isAdmin, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
        return;
      }
      const { data: { user: authedUser } } = await supabase.auth.getUser();
      if (!authedUser) return;
      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authedUser.id);
      const userRoles = (roleRows ?? []).map((r: any) => r.role);
      if (!userRoles.some((r: string) => STAFF_ROLES.includes(r))) {
        await signOut();
        toast({
          title: 'Access denied',
          description: 'This account is not a staff account. Use the customer portal login instead.',
          variant: 'destructive',
        });
        return;
      }
      navigate(userRoles.includes('admin') ? '/admin/dashboard' : '/tech');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link
        to="/"
        className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img
            src={mmarLogo}
            alt="MMAR Logo"
            className="h-20 w-20 rounded-full object-cover border-2 border-primary"
          />
        </div>

        <Card className="glass-card border-border">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <HardHat className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display text-foreground">Staff Login</CardTitle>
            <CardDescription>
              Technicians, service advisors, managers, and parts staff.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@shop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                ) : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border/50 text-center text-xs text-muted-foreground space-x-3">
              <Link to="/portal/login" className="hover:text-primary hover:underline">Customer login</Link>
              <span>·</span>
              <Link to="/admin/login" className="hover:text-primary hover:underline">Admin login</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffLogin;
