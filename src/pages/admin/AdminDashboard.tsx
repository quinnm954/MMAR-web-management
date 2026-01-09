import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, FileText, RefreshCw, Loader2 } from 'lucide-react';
import FinancingContractsTable from '@/components/admin/FinancingContractsTable';
import { supabase } from '@/integrations/supabase/client';
import mmarLogo from '@/assets/mmar-logo.jpeg';

interface FinancingContract {
  id: string;
  client_name: string;
  client_address: string;
  client_contact: string;
  agreement_date: string;
  vehicle_info: string | null;
  service_description: string | null;
  total_service_price: number;
  first_payment_date: string;
  down_payment: number;
  principal: number;
  interest: number;
  total_financed: number;
  monthly_payment: number;
  client_signature_url: string | null;
  client_signed_at: string | null;
  provider_signature_url: string | null;
  provider_signed_at: string | null;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { signOut, user } = useAuth();
  const [contracts, setContracts] = useState<FinancingContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchContracts = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase
        .from('financing_contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <img
                src={mmarLogo}
                alt="MMAR Logo"
                className="h-12 w-12 rounded-full object-cover border border-primary"
              />
            </Link>
            <div>
              <h1 className="text-xl font-display text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="glass-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Financing Contracts
              </CardTitle>
              <CardDescription>
                View and manage all financing contracts. Total: {contracts.length} records
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchContracts(true)}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <FinancingContractsTable data={contracts} onRefresh={() => fetchContracts(true)} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
