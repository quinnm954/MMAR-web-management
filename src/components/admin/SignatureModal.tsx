import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  signatureImage: string;
  customerName: string;
}

const SignatureModal = ({ isOpen, onClose, signatureImage, customerName }: SignatureModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Signature - {customerName}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center p-4 bg-card rounded-lg border border-border">
          <img
            src={signatureImage}
            alt={`Signature of ${customerName}`}
            className="max-w-full h-auto"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureModal;
