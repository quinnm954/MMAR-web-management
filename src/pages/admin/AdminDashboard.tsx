import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, FileText } from 'lucide-react';
import mmarLogo from '@/assets/mmar-logo.jpeg';

const AdminDashboard = () => {
  const { signOut, user } = useAuth();

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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Financing Contracts
            </CardTitle>
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
      </main>
    </div>
  );
};

export default AdminDashboard;
