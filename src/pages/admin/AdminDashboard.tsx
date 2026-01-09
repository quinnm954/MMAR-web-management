import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, FileText, RefreshCw, Loader2 } from 'lucide-react';
import WarrantyTable from '@/components/admin/WarrantyTable';
import { supabase } from '@/integrations/supabase/client';
import mmarLogo from '@/assets/mmar-logo.jpeg';

interface WarrantyAcknowledgment {
  id: string;
  customer_name: string;
  vehicle_info: string;
  vin_last6: string | null;
  work_order_number: string | null;
  signature_image: string;
  signed_at: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { signOut, user } = useAuth();
  const [warranties, setWarranties] = useState<WarrantyAcknowledgment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWarranties = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase
        .from('warranty_acknowledgments')
        .select('*')
        .order('signed_at', { ascending: false });

      if (error) throw error;
      setWarranties(data || []);
    } catch (error) {
      console.error('Error fetching warranties:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
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
        <Tabs defaultValue="warranties" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="warranties" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Warranty Acknowledgments
              </TabsTrigger>
              <TabsTrigger value="financing" className="flex items-center gap-2" disabled>
                <FileText className="h-4 w-4" />
                Financing Contracts
              </TabsTrigger>
            </TabsList>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchWarranties(true)}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>

          <TabsContent value="warranties">
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle>Warranty Acknowledgments</CardTitle>
                <CardDescription>
                  View and manage all signed warranty policy acknowledgments.
                  Total: {warranties.length} records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <WarrantyTable data={warranties} onRefresh={() => fetchWarranties(true)} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financing">
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle>Financing Contracts</CardTitle>
                <CardDescription>
                  Financing contracts are currently stored locally. 
                  This feature will be available in a future update.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Coming soon - Financing contract management
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
