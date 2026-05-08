import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Eye, Trash2, Search, Link as LinkIcon, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface FinancingContractsTableProps {
  data: FinancingContract[];
  onRefresh: () => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'secondary',
    pending: 'outline',
    signed: 'default',
    completed: 'default',
    cancelled: 'destructive',
  };
  return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
};

const FinancingContractsTable = ({ data, onRefresh }: FinancingContractsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContract, setSelectedContract] = useState<FinancingContract | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [signatureUrls, setSignatureUrls] = useState<{ client: string | null; provider: string | null }>({ client: null, provider: null });
  const [linkBusy, setLinkBusy] = useState<string | null>(null);
  const itemsPerPage = 10;

  const generateLink = async (
    contract: FinancingContract,
    kind: 'financing_down_payment' | 'financing_monthly',
    sendSms: boolean,
  ) => {
    const key = `${contract.id}:${kind}:${sendSms}`;
    setLinkBusy(key);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: { kind, reference_id: contract.id, send_sms: sendSms },
      });
      if (error || (data as any)?.error) throw new Error(error?.message || (data as any)?.error);
      const url = (data as any).url as string;
      if (sendSms) {
        toast.success('Payment link texted to customer');
      } else {
        await navigator.clipboard.writeText(url).catch(() => {});
        window.prompt('Copy payment link:', url);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate link');
    } finally {
      setLinkBusy(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!selectedContract) {
        setSignatureUrls({ client: null, provider: null });
        return;
      }
      const sign = async (path: string | null) => {
        if (!path) return null;
        const { data } = await supabase.storage.from('signatures').createSignedUrl(path, 300);
        return data?.signedUrl ?? null;
      };
      const [client, provider] = await Promise.all([
        sign(selectedContract.client_signature_url),
        sign(selectedContract.provider_signature_url),
      ]);
      if (!cancelled) setSignatureUrls({ client, provider });
    };
    load();
    return () => { cancelled = true; };
  }, [selectedContract]);

  const filteredData = data.filter((contract) => {
    const search = searchTerm.toLowerCase();
    return (
      contract.client_name.toLowerCase().includes(search) ||
      contract.vehicle_info?.toLowerCase().includes(search) ||
      contract.client_contact.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('financing_contracts')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      
      toast.success('Contract deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error('Failed to delete contract');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by client name, vehicle, or contact..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Total Price</TableHead>
              <TableHead>Down Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agreement Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No financing contracts found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.client_name}</TableCell>
                  <TableCell>{contract.vehicle_info || '-'}</TableCell>
                  <TableCell>{formatCurrency(contract.total_service_price)}</TableCell>
                  <TableCell>{formatCurrency(contract.down_payment)}</TableCell>
                  <TableCell>{getStatusBadge(contract.status)}</TableCell>
                  <TableCell>
                    {format(new Date(contract.agreement_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        title="Copy down-payment link"
                        disabled={linkBusy?.startsWith(contract.id)}
                        onClick={() => generateLink(contract, 'financing_down_payment', false)}
                      >
                        <LinkIcon className="h-3.5 w-3.5 mr-1" />Down
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Copy monthly payment link"
                        disabled={linkBusy?.startsWith(contract.id)}
                        onClick={() => generateLink(contract, 'financing_monthly', false)}
                      >
                        <LinkIcon className="h-3.5 w-3.5 mr-1" />Monthly
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Text monthly payment link to customer"
                        disabled={linkBusy?.startsWith(contract.id)}
                        onClick={() => generateLink(contract, 'financing_monthly', true)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedContract(contract)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(contract.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client Name</p>
                  <p className="font-medium">{selectedContract.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedContract.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedContract.client_address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium">{selectedContract.client_contact}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{selectedContract.vehicle_info || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Service Description</p>
                  <p className="font-medium">{selectedContract.service_description || '-'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Financial Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Service Price</p>
                    <p className="font-medium">{formatCurrency(selectedContract.total_service_price)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Down Payment (75%)</p>
                    <p className="font-medium">{formatCurrency(selectedContract.down_payment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Principal (25%)</p>
                    <p className="font-medium">{formatCurrency(selectedContract.principal)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interest</p>
                    <p className="font-medium">{formatCurrency(selectedContract.interest)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Financed</p>
                    <p className="font-medium text-primary">{formatCurrency(selectedContract.total_financed)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="font-medium">{formatCurrency(selectedContract.monthly_payment)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Dates</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Agreement Date</p>
                    <p className="font-medium">{format(new Date(selectedContract.agreement_date), 'MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">First Payment Date</p>
                    <p className="font-medium">{format(new Date(selectedContract.first_payment_date), 'MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{format(new Date(selectedContract.created_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                  {selectedContract.client_signed_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Client Signed</p>
                      <p className="font-medium">{format(new Date(selectedContract.client_signed_at), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures */}
              {(signatureUrls.client || signatureUrls.provider) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Signatures</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {signatureUrls.client && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Client Signature</p>
                        <img
                          src={signatureUrls.client}
                          alt="Client signature"
                          className="border rounded p-2 bg-white max-h-24"
                        />
                      </div>
                    )}
                    {signatureUrls.provider && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Provider Signature</p>
                        <img
                          src={signatureUrls.provider}
                          alt="Provider signature"
                          className="border rounded p-2 bg-white max-h-24"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this financing contract? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FinancingContractsTable;
