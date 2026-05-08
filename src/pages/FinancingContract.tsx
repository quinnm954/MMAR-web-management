import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer, Save, Download, Trash2, Send, Loader2 } from "lucide-react";
import mmarLogo from "@/assets/mmar-logo.jpeg";
import SignaturePad from "@/components/financing/SignaturePad";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EstimateSummaryCard from "@/components/EstimateSummaryCard";

interface EditableContractData {
  clientName: string;
  clientAddress: string;
  clientContact: string;
  agreementDate: string;
  serviceDescription: string;
  totalServicePrice: string;
  partsPrice: string;
  firstPaymentDate: string;
  vehicleInfo: string;
}

interface SignatureData {
  clientSignature: string | null;
  clientSignedAt: string | null;
  providerSignature: string | null;
  providerSignedAt: string | null;
  initials: {
    terms: string | null;
    securityInterest: string | null;
    defaultConsequences: string | null;
    infoAccuracy: string | null;
    receivedCopy: string | null;
  };
}

const PROVIDER = {
  name: "Mike's Mobile Auto Repair (MMAR)",
  address: "Fort Myers, FL",
  contact: "(813) 501-7572 | mikesmarllc@gmail.com",
} as const;

const TERMS = {
  laborDownPaymentRate: 0.5,
  annualInterestRate: 0.25,
  termMonths: 12,
  // Fixed business terms (not editable)
  lateFee: 25,
  gracePeriodDays: 5,
  returnedPaymentFee: 35,
  governingLaw: "Florida",
  venue: "Lee County, Florida",
} as const;

const defaultEditableData: EditableContractData = {
  clientName: "",
  clientAddress: "",
  clientContact: "",
  agreementDate: new Date().toISOString().split("T")[0],
  serviceDescription: "",
  totalServicePrice: "",
  partsPrice: "",
  firstPaymentDate: "",
  vehicleInfo: "",
};

const defaultSignatureData: SignatureData = {
  clientSignature: null,
  clientSignedAt: null,
  providerSignature: null,
  providerSignedAt: null,
  initials: {
    terms: null,
    securityInterest: null,
    defaultConsequences: null,
    infoAccuracy: null,
    receivedCopy: null,
  },
};

const STORAGE_KEY = "mmar-financing-contract";
const SIGNATURE_STORAGE_KEY = "mmar-financing-signatures";

// Sanitize numeric input - removes $ and commas
const sanitizeNumber = (value: string): number => {
  const cleaned = value.replace(/[$,\s]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Format as USD currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Format date for display
const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Format date and time for signature timestamp
const formatDateTime = (isoString: string | null): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }) + " at " + date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Calculate payment due dates handling end-of-month properly
const calculatePaymentDates = (startDate: string, months: number): Date[] => {
  const dates: Date[] = [];
  if (!startDate) return dates;

  const start = new Date(startDate + "T00:00:00");
  const originalDay = start.getDate();

  for (let i = 0; i < months; i++) {
    const paymentDate = new Date(start);
    paymentDate.setMonth(start.getMonth() + i);

    // Handle end-of-month edge cases (e.g., Jan 31 -> Feb 28)
    if (paymentDate.getDate() !== originalDay) {
      // Month rolled over due to fewer days, set to last day of previous month
      paymentDate.setDate(0);
    }

    dates.push(paymentDate);
  }

  return dates;
};

const FinancingContract = () => {
  const [searchParams] = useSearchParams();
  const estimateId = searchParams.get("estimate");
  const [linkedCustomerId, setLinkedCustomerId] = useState<string | null>(null);
  const [linkedEstimateId, setLinkedEstimateId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditableContractData>(defaultEditableData);
  const [signatures, setSignatures] = useState<SignatureData>(defaultSignatureData);
  const [hasSaved, setHasSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedSignatures = localStorage.getItem(SIGNATURE_STORAGE_KEY);
    if (saved) {
      setHasSaved(true);
    }
    if (savedSignatures) {
      try {
        const parsed = JSON.parse(savedSignatures) as SignatureData;
        setSignatures({ ...defaultSignatureData, ...parsed });
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  // Prefill from estimate (if linked via ?estimate= URL param)
  useEffect(() => {
    if (!estimateId) return;
    (async () => {
      const { data: est } = await supabase
        .from("estimates")
        .select("id, customer_id, vehicle_id, total, line_items, notes")
        .eq("id", estimateId)
        .maybeSingle();
      if (!est) {
        toast.error("Couldn't load that estimate — fill in the form manually.");
        return;
      }
      setLinkedEstimateId(est.id);
      setLinkedCustomerId(est.customer_id);

      const [{ data: profile }, { data: vehicle }] = await Promise.all([
        supabase.from("profiles").select("full_name, email").eq("id", est.customer_id).maybeSingle(),
        est.vehicle_id
          ? supabase.from("vehicles").select("year, make, model, license_plate, vin").eq("id", est.vehicle_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const approvedTotal = Array.isArray(est.line_items)
        ? (est.line_items as any[]).reduce(
            (s, l) => (l.status !== "declined" ? s + Number(l.amount || 0) : s),
            0,
          )
        : Number(est.total || 0);

      const serviceDescription = Array.isArray(est.line_items)
        ? (est.line_items as any[])
            .filter((l) => l.status !== "declined")
            .map((l) => `${l.quantity ?? 1} × ${l.description}`)
            .join("\n")
        : "";

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 14);

      setFormData((prev) => ({
        ...prev,
        clientName: profile?.full_name || prev.clientName,
        clientContact: profile?.email || prev.clientContact,
        vehicleInfo: vehicle ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") : prev.vehicleInfo,
        serviceDescription: serviceDescription || prev.serviceDescription,
        totalServicePrice: approvedTotal ? approvedTotal.toFixed(2) : prev.totalServicePrice,
        firstPaymentDate: prev.firstPaymentDate || tomorrow.toISOString().split("T")[0],
      }));
      toast.success("Estimate details loaded — terms calculated automatically.");
    })();
  }, [estimateId]);

  // Auto-calculations
  const calculations = useMemo(() => {
    const totalPrice = sanitizeNumber(formData.totalServicePrice);
    const partsPrice = Math.min(sanitizeNumber(formData.partsPrice), totalPrice);
    const laborPrice = Math.max(totalPrice - partsPrice, 0);
    const laborDown = laborPrice * TERMS.laborDownPaymentRate;
    const downPayment = partsPrice + laborDown;
    const principal = Math.max(totalPrice - downPayment, 0);
    const interest = principal * TERMS.annualInterestRate * 1; // simple interest for 1 year
    const totalFinanced = principal + interest;

    // Ensure the final payment adjusts for rounding so the sum equals totalFinanced
    const baseMonthlyPayment = Math.floor((totalFinanced / TERMS.termMonths) * 100) / 100;
    const sumOfFirst11 = baseMonthlyPayment * (TERMS.termMonths - 1);
    const finalPayment = Math.round((totalFinanced - sumOfFirst11) * 100) / 100;

    return {
      totalPrice,
      partsPrice,
      laborPrice,
      laborDown,
      downPayment,
      principal,
      interest,
      totalFinanced,
      baseMonthlyPayment,
      finalPayment,
    };
  }, [formData.totalServicePrice, formData.partsPrice]);

  // Payment schedule
  const paymentSchedule = useMemo(() => {
    const dates = calculatePaymentDates(formData.firstPaymentDate, TERMS.termMonths);
    return dates.map((date, index) => ({
      number: index + 1,
      dueDate: date,
      amount: index === TERMS.termMonths - 1 ? calculations.finalPayment : calculations.baseMonthlyPayment,
    }));
  }, [formData.firstPaymentDate, calculations]);

  const handleInputChange = (field: keyof EditableContractData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify(signatures));
    setHasSaved(true);
  };

  const handleLoad = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedSignatures = localStorage.getItem(SIGNATURE_STORAGE_KEY);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<EditableContractData>;
        setFormData({ ...defaultEditableData, ...parsed });
        setHasSaved(true);
      } catch {
        setFormData(defaultEditableData);
        setHasSaved(false);
      }
    }
    
    if (savedSignatures) {
      try {
        const parsed = JSON.parse(savedSignatures) as SignatureData;
        setSignatures({ ...defaultSignatureData, ...parsed });
      } catch {
        setSignatures(defaultSignatureData);
      }
    }
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SIGNATURE_STORAGE_KEY);
    setFormData(defaultEditableData);
    setSignatures(defaultSignatureData);
    setHasSaved(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmitToDatabase = async () => {
    // Validate required fields
    if (!formData.clientName || !formData.clientAddress || !formData.clientContact) {
      toast.error('Please fill in all client information fields');
      return;
    }
    if (!formData.totalServicePrice || !formData.firstPaymentDate) {
      toast.error('Please fill in total service price and first payment date');
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine status based on signatures
      let status: 'draft' | 'pending' | 'signed' = 'draft';
      if (signatures.clientSignature && signatures.providerSignature) {
        status = 'signed';
      } else if (signatures.clientSignature || signatures.providerSignature) {
        status = 'pending';
      }

      const { error } = await supabase.functions.invoke('submit-financing-contract', {
        body: {
          customer_id: linkedCustomerId,
          estimate_id: linkedEstimateId,
          client_name: formData.clientName,
          client_address: formData.clientAddress,
          client_contact: formData.clientContact,
          agreement_date: formData.agreementDate,
          vehicle_info: formData.vehicleInfo || null,
          service_description: formData.serviceDescription || null,
          total_service_price: calculations.totalPrice,
          first_payment_date: formData.firstPaymentDate,
          down_payment: calculations.downPayment,
          principal: calculations.principal,
          interest: calculations.interest,
          total_financed: calculations.totalFinanced,
          monthly_payment: calculations.baseMonthlyPayment,
          client_signature: signatures.clientSignature,
          client_signed_at: signatures.clientSignedAt,
          provider_signature: signatures.providerSignature,
          provider_signed_at: signatures.providerSignedAt,
          initial_terms: signatures.initials.terms,
          initial_security_interest: signatures.initials.securityInterest,
          initial_default_consequences: signatures.initials.defaultConsequences,
          initial_info_accuracy: signatures.initials.infoAccuracy,
          initial_received_copy: signatures.initials.receivedCopy,
          status,
        },
      });

      if (error) throw error;

      toast.success('Contract saved to database successfully!');
      handleClear();
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('Failed to save contract to database');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Signature handlers
  const handleClientSignature = (signature: string) => {
    setSignatures((prev) => ({
      ...prev,
      clientSignature: signature,
      clientSignedAt: new Date().toISOString(),
    }));
  };

  const handleProviderSignature = (signature: string) => {
    setSignatures((prev) => ({
      ...prev,
      providerSignature: signature,
      providerSignedAt: new Date().toISOString(),
    }));
  };

  const handleInitial = (field: keyof SignatureData["initials"], initial: string) => {
    setSignatures((prev) => ({
      ...prev,
      initials: {
        ...prev.initials,
        [field]: initial,
      },
    }));
  };

  const clearClientSignature = () => {
    setSignatures((prev) => ({
      ...prev,
      clientSignature: null,
      clientSignedAt: null,
    }));
  };

  const clearProviderSignature = () => {
    setSignatures((prev) => ({
      ...prev,
      providerSignature: null,
      providerSignedAt: null,
    }));
  };

  const clearInitial = (field: keyof SignatureData["initials"]) => {
    setSignatures((prev) => ({
      ...prev,
      initials: {
        ...prev.initials,
        [field]: null,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Hidden in print */}
      <header className="print:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center gap-3">
              <img src={mmarLogo} alt="MMAR Logo" className="h-10 sm:h-12 w-auto rounded" />
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              {hasSaved && (
                <Button variant="outline" size="sm" onClick={handleLoad}>
                  <Download className="w-4 h-4 mr-2" />
                  Load
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button variant="hero" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print / PDF
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSubmitToDatabase}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit Contract
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-12 print:pt-0 print:pb-0">
        {/* Back Link - Hidden in print */}
        <Link
          to="/"
          className="print:hidden inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Linked estimate summary (when ?estimate= or ?token= present) */}
        <div className="print:hidden mb-6">
          <EstimateSummaryCard />
        </div>

        {/* Form Inputs - Hidden in print */}
        <div className="print:hidden space-y-6 mb-8">
          <h1 className="text-3xl font-bold text-foreground">Financing Contract Generator</h1>
          <p className="text-muted-foreground">
            Fill in the details below to generate a financing contract. All calculations are automatic.
          </p>

          {/* Fixed Business Terms Notice */}
          <Card className="bg-muted/50 border-muted">
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Provider</p>
                  <p className="font-medium">{PROVIDER.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Down Payment</p>
                  <p className="font-medium">100% Parts + 50% Labor</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Finance Charge</p>
                  <p className="font-medium">25% Annual Simple Interest</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Term</p>
                  <p className="font-medium">12 Monthly Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clientName">Client Full Name *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange("clientName", e.target.value)}
                    placeholder="Enter client's full legal name"
                  />
                </div>
                <div>
                  <Label htmlFor="clientAddress">Client Address *</Label>
                  <Input
                    id="clientAddress"
                    value={formData.clientAddress}
                    onChange={(e) => handleInputChange("clientAddress", e.target.value)}
                    placeholder="Street, City, State, ZIP"
                  />
                </div>
                <div>
                  <Label htmlFor="clientContact">Client Phone / Email *</Label>
                  <Input
                    id="clientContact"
                    value={formData.clientContact}
                    onChange={(e) => handleInputChange("clientContact", e.target.value)}
                    placeholder="Phone and/or email"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Service & Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service & Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="agreementDate">Agreement Date</Label>
                  <Input
                    id="agreementDate"
                    type="date"
                    value={formData.agreementDate}
                    onChange={(e) => handleInputChange("agreementDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleInfo">Vehicle Information (Year/Make/Model/VIN)</Label>
                  <Input
                    id="vehicleInfo"
                    value={formData.vehicleInfo}
                    onChange={(e) => handleInputChange("vehicleInfo", e.target.value)}
                    placeholder="e.g., 2020 Toyota Camry, VIN: 1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="serviceDescription">Service Description / Work Order Reference</Label>
                  <Textarea
                    id="serviceDescription"
                    value={formData.serviceDescription}
                    onChange={(e) => handleInputChange("serviceDescription", e.target.value)}
                    placeholder="Describe services provided or reference invoice/work order number"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="totalServicePrice">Total Service Price ($) *</Label>
                  <Input
                    id="totalServicePrice"
                    value={formData.totalServicePrice}
                    onChange={(e) => handleInputChange("totalServicePrice", e.target.value)}
                    placeholder="e.g., 1000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="partsPrice">Parts Cost ($) *</Label>
                  <Input
                    id="partsPrice"
                    value={formData.partsPrice}
                    onChange={(e) => handleInputChange("partsPrice", e.target.value)}
                    placeholder="e.g., 400.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Parts are paid 100% upfront; labor down is 50%.
                  </p>
                </div>
                <div>
                  <Label htmlFor="firstPaymentDate">First Payment Due Date *</Label>
                  <Input
                    id="firstPaymentDate"
                    type="date"
                    value={formData.firstPaymentDate}
                    onChange={(e) => handleInputChange("firstPaymentDate", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calculations Summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Auto-Calculated Values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center p-3 bg-background rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Down Payment (Parts + 50% Labor)</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(calculations.downPayment)}</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Financed (50% Labor)</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(calculations.principal)}</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Interest (25%)</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(calculations.interest)}</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Financed</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(calculations.totalFinanced)}</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Payment</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(calculations.baseMonthlyPayment)}</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Final Payment</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(calculations.finalPayment)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Printable Contract Document */}
        <div className="contract-document bg-white text-black p-8 md:p-12 rounded-lg border border-border print:border-0 print:p-0 print:rounded-none">
          {/* Contract Header */}
          <div className="text-center mb-8 print:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2">
              Financing Agreement
            </h1>
            <p className="text-muted-foreground print:text-gray-600">
              Payment Plan Contract
            </p>
          </div>

          {/* IMPORTANT NOTICE BOX */}
          <section className="mb-6 print:mb-4 p-4 border-2 border-black bg-gray-100 print:bg-gray-100">
            <h2 className="text-lg font-bold text-center mb-3">⚠️ IMPORTANT NOTICE TO CLIENT</h2>
            <p className="text-sm mb-2">
              <strong>READ BEFORE SIGNING:</strong> This is a legally binding financing agreement. By signing below, you agree to:
            </p>
            <ul className="text-sm list-disc ml-6 space-y-1">
              <li>Pay all amounts due according to the schedule, including interest and fees</li>
              <li>Grant Provider a security interest (lien) on the serviced vehicle until paid in full</li>
              <li>Pay late fees of ${TERMS.lateFee} for payments more than {TERMS.gracePeriodDays} days late</li>
              <li>Pay ${TERMS.returnedPaymentFee} for any returned check or failed electronic payment</li>
              <li>Pay all collection costs, attorney's fees, and court costs if you default</li>
              <li>Have your account reported to credit bureaus if delinquent</li>
            </ul>
          </section>

          {/* Parties Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">1. PARTIES</h2>
            <p className="mb-2">
              This Financing Agreement ("Agreement") is entered into as of{" "}
              <strong>{formatDate(formData.agreementDate) || "_______________"}</strong> by and between:
            </p>
            <div className="ml-4 mb-3">
              <p>
                <strong>PROVIDER:</strong> {PROVIDER.name}
              </p>
              <p>Address: {PROVIDER.address}</p>
              <p>Contact: {PROVIDER.contact}</p>
            </div>
            <div className="ml-4">
              <p>
                <strong>CLIENT:</strong> {formData.clientName || "_______________"}
              </p>
              <p>Address: {formData.clientAddress || "_______________"}</p>
              <p>Contact: {formData.clientContact || "_______________"}</p>
            </div>
          </section>

          {/* Services Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">2. SERVICES & VEHICLE</h2>
            <p className="mb-2">
              Provider has performed or will perform automotive repair services for Client on the following vehicle:
            </p>
            <div className="ml-4 mb-3">
              <p><strong>Vehicle:</strong> {formData.vehicleInfo || "_______________________________________________"}</p>
            </div>
            <p className="mb-2"><strong>Services Performed:</strong></p>
            <div className="mt-2 p-3 bg-gray-50 print:bg-transparent print:border print:border-gray-300 rounded min-h-[60px]">
              {formData.serviceDescription || "_______________________________________________"}
            </div>
          </section>

          {/* Price Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">3. TOTAL SERVICE PRICE</h2>
            <p>
              The total price for the services described above is{" "}
              <strong>{calculations.totalPrice > 0 ? formatCurrency(calculations.totalPrice) : "$_______________"}</strong>.
            </p>
          </section>

          {/* Payment Structure Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">4. PAYMENT STRUCTURE</h2>
            <p className="mb-3">Client agrees to pay the Total Service Price as follows:</p>
            <div className="ml-4 space-y-2">
              <p>
                <strong>a) Down Payment:</strong> {formatCurrency(calculations.downPayment)} — equal to 100% of Parts ({formatCurrency(calculations.partsPrice)}) plus 50% of Labor ({formatCurrency(calculations.laborDown)} of {formatCurrency(calculations.laborPrice)} labor),
                due upon execution of this Agreement.
              </p>
              <p>
                <strong>b) Financed Amount:</strong> {formatCurrency(calculations.principal)} (remaining 50% of Labor),
                to be financed under the terms described in Section 5.
              </p>
            </div>
          </section>

          {/* Simple Interest Terms Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">5. SIMPLE INTEREST TERMS</h2>
            <div className="ml-4 space-y-2">
              <p>
                <strong>a) Principal:</strong> {formatCurrency(calculations.principal)}
              </p>
              <p>
                <strong>b) Annual Interest Rate:</strong> 25% (simple interest)
              </p>
              <p>
                <strong>c) Term:</strong> 12 months
              </p>
              <p>
                <strong>d) Interest Calculation:</strong> Interest = Principal × Rate × Time = {formatCurrency(calculations.principal)} × 0.25 × 1 = {formatCurrency(calculations.interest)}
              </p>
              <p>
                <strong>e) Total Amount Financed:</strong> Principal + Interest = {formatCurrency(calculations.principal)} + {formatCurrency(calculations.interest)} = {formatCurrency(calculations.totalFinanced)}
              </p>
              <p>
                <strong>f) Monthly Payment:</strong> {formatCurrency(calculations.baseMonthlyPayment)} for the first 11 months,
                and {formatCurrency(calculations.finalPayment)} for the final month (adjusted for rounding).
              </p>
            </div>
          </section>

          {/* Payment Schedule Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">6. PAYMENT SCHEDULE</h2>
            <p className="mb-3">
              Payments shall be made according to the following schedule, beginning on{" "}
              <strong>{formatDate(formData.firstPaymentDate) || "_______________"}</strong>:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 print:bg-gray-200">
                    <th className="border border-gray-300 px-3 py-2 text-left">Payment #</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Due Date</th>
                    <th className="border border-gray-300 px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentSchedule.length > 0 ? (
                    paymentSchedule.map((payment) => (
                      <tr key={payment.number}>
                        <td className="border border-gray-300 px-3 py-2">{payment.number}</td>
                        <td className="border border-gray-300 px-3 py-2">
                          {payment.dueDate.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-right">
                          {formatCurrency(payment.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    Array.from({ length: 12 }).map((_, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 px-3 py-2">{i + 1}</td>
                        <td className="border border-gray-300 px-3 py-2">_______________</td>
                        <td className="border border-gray-300 px-3 py-2 text-right">$___________</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 print:bg-gray-200 font-bold">
                    <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right">
                      Total:
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {formatCurrency(calculations.totalFinanced)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Late Fees Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">7. LATE FEES</h2>
            <p>
              If any payment is not received within <strong>{TERMS.gracePeriodDays}</strong> days of its due date
              ("Grace Period"), Client agrees to pay a late fee of <strong>{formatCurrency(TERMS.lateFee)}</strong> for
              each late payment. Late fees are cumulative and do not excuse Client from making the regularly scheduled payment.
            </p>
          </section>

          {/* Returned Payment Fees Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">8. RETURNED PAYMENT FEES</h2>
            <p>
              Client agrees to pay a fee of <strong>{formatCurrency(TERMS.returnedPaymentFee)}</strong> for any check 
              returned unpaid or any electronic payment that fails due to insufficient funds, closed account, or any 
              other reason attributable to Client. Client is also responsible for any bank fees incurred by Provider 
              as a result of such returned or failed payment.
            </p>
          </section>

          {/* Security Interest & Lien Rights Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">9. SECURITY INTEREST & LIEN RIGHTS</h2>
            <p className="mb-2">
              To secure payment of all amounts due under this Agreement, Client hereby grants Provider a security 
              interest in the vehicle described in Section 2, including all accessories, additions, and replacements 
              thereto ("Collateral"). Client acknowledges and agrees that:
            </p>
            <div className="ml-4 space-y-2">
              <p>
                <strong>a)</strong> Provider may file a mechanic's lien or possessory lien on the Collateral in accordance 
                with applicable {TERMS.governingLaw} law if any amount under this Agreement remains unpaid.
              </p>
              <p>
                <strong>b)</strong> Provider has the right to retain possession of the Collateral until all amounts due 
                under this Agreement have been paid in full.
              </p>
              <p>
                <strong>c)</strong> Client shall not sell, transfer, encumber, or otherwise dispose of the Collateral 
                until all obligations under this Agreement are satisfied.
              </p>
              <p>
                <strong>d)</strong> Upon default, Provider may exercise all rights available under the Uniform Commercial 
                Code and applicable state law, including the right to repossess and sell the Collateral.
              </p>
            </div>
          </section>

          {/* Default & Acceleration Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">10. DEFAULT & ACCELERATION</h2>
            <p className="mb-2">
              Client shall be in default under this Agreement if any of the following occurs:
            </p>
            <div className="ml-4 space-y-1 mb-3">
              <p><strong>a)</strong> Failure to make any payment within 30 days of its due date;</p>
              <p><strong>b)</strong> Breach of any other term or condition of this Agreement;</p>
              <p><strong>c)</strong> Death or incapacity of Client;</p>
              <p><strong>d)</strong> Filing of bankruptcy or insolvency proceedings by or against Client;</p>
              <p><strong>e)</strong> Any representation made by Client proves to be false or misleading.</p>
            </div>
            <p>
              Upon default, Provider may, at its sole discretion, declare the entire remaining balance (including 
              principal, accrued interest, late fees, and all other charges) immediately due and payable without 
              further notice or demand. This right of acceleration is in addition to, and not in lieu of, any other 
              remedies available to Provider.
            </p>
          </section>

          {/* Collection Costs & Remedies Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">11. COLLECTION COSTS & REMEDIES</h2>
            <p className="mb-2">
              In the event of default, Client agrees to pay all costs and expenses incurred by Provider in collecting 
              amounts due under this Agreement, including but not limited to:
            </p>
            <div className="ml-4 space-y-1 mb-3">
              <p><strong>a)</strong> Reasonable attorney's fees and legal costs;</p>
              <p><strong>b)</strong> Collection agency fees and commissions;</p>
              <p><strong>c)</strong> Skip tracing and investigation costs;</p>
              <p><strong>d)</strong> Court costs and filing fees;</p>
              <p><strong>e)</strong> Costs of repossession, storage, and sale of Collateral.</p>
            </div>
            <p>
              <strong>CREDIT REPORTING:</strong> Provider may report Client's payment history and any delinquency to 
              consumer credit reporting agencies. Negative information may affect Client's credit score and ability 
              to obtain credit in the future.
            </p>
          </section>

          {/* Acknowledgment of Debt Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">12. ACKNOWLEDGMENT OF DEBT</h2>
            <p>
              Client acknowledges and agrees that: (a) the debt evidenced by this Agreement is valid, binding, and 
              enforceable; (b) Client has received all services described herein or authorizes Provider to perform 
              such services; (c) Client has no defenses, counterclaims, or setoffs against the amounts due; and 
              (d) all information provided by Client to Provider is true, accurate, and complete. Client agrees 
              not to dispute the validity or amount of this debt after execution of this Agreement except for 
              claims of actual fraud.
            </p>
          </section>

          {/* Client Representations Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">13. CLIENT REPRESENTATIONS & WARRANTIES</h2>
            <p className="mb-2">Client represents and warrants that:</p>
            <div className="ml-4 space-y-1">
              <p><strong>a)</strong> Client is at least 18 years of age and has full legal capacity to enter into this Agreement;</p>
              <p><strong>b)</strong> Client is the legal owner of the vehicle described herein or has authority to authorize repairs;</p>
              <p><strong>c)</strong> All information provided by Client is true, accurate, and complete;</p>
              <p><strong>d)</strong> Client has the financial ability to make all payments required under this Agreement;</p>
              <p><strong>e)</strong> No bankruptcy, insolvency, or similar proceedings are pending or contemplated by Client;</p>
              <p><strong>f)</strong> Client has read this entire Agreement and understands all terms and conditions.</p>
            </div>
          </section>

          {/* Waiver of Defenses Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">14. WAIVER OF DEFENSES</h2>
            <p>
              Client agrees that Client's obligation to make all payments under this Agreement is absolute and 
              unconditional and shall not be subject to any defense, setoff, counterclaim, or recoupment. Any 
              disputes regarding the quality, completeness, or satisfaction with services shall be resolved 
              separately and shall not excuse, delay, or reduce Client's payment obligations. Client waives 
              any right to withhold payment based on alleged defects in workmanship or materials.
            </p>
          </section>

          {/* Communication Consent Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">15. COMMUNICATION CONSENT</h2>
            <p>
              Client expressly consents to receive communications from Provider and its agents, representatives, 
              or assigns regarding this account by any means, including but not limited to: telephone calls 
              (including calls using automated dialing systems or prerecorded messages), text messages, emails, 
              and written correspondence sent to any address, phone number, or email address provided by Client. 
              Client agrees to notify Provider in writing within 10 days of any change to Client's contact information.
            </p>
          </section>

          {/* Assignment Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">16. ASSIGNMENT</h2>
            <p>
              Provider may assign, sell, or transfer this Agreement and all rights hereunder to any third party, 
              including but not limited to collection agencies, financial institutions, or other assignees, without 
              notice to or consent from Client. Any such assignee shall have all rights and remedies available to 
              Provider under this Agreement. Client may not assign this Agreement or any obligations hereunder 
              without the prior written consent of Provider.
            </p>
          </section>

          {/* Dispute Resolution Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">17. DISPUTE RESOLUTION & VENUE</h2>
            <p className="mb-2">
              <strong>a) Mandatory Mediation:</strong> Before initiating any legal action, the parties agree to 
              attempt in good faith to resolve any dispute through non-binding mediation administered by a mutually 
              agreed upon mediator in {TERMS.venue}.
            </p>
            <p className="mb-2">
              <strong>b) Exclusive Venue:</strong> Any legal action arising out of or relating to this Agreement 
              shall be brought exclusively in the courts of {TERMS.venue}, and both parties hereby consent to the 
              personal jurisdiction of such courts.
            </p>
            <p>
              <strong>c) Attorney's Fees:</strong> In any legal action to enforce this Agreement, the prevailing 
              party shall be entitled to recover reasonable attorney's fees and costs from the non-prevailing party.
            </p>
          </section>

          {/* No Prepayment Penalty Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">18. NO PREPAYMENT PENALTY</h2>
            <p>
              Client may prepay any or all of the remaining financed balance at any time without penalty. If Client 
              prepays in full, interest will not be reduced; the full interest amount as calculated herein remains due.
            </p>
          </section>

          {/* Governing Law Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">19. GOVERNING LAW</h2>
            <p>
              This Agreement shall be governed by and construed in accordance with the laws of the State of{" "}
              <strong>{TERMS.governingLaw}</strong>, without regard to its conflict of laws principles.
            </p>
          </section>

          {/* Severability Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">20. SEVERABILITY</h2>
            <p>
              If any provision of this Agreement is held to be invalid, illegal, or unenforceable, such provision 
              shall be modified to the minimum extent necessary to make it valid and enforceable, or if modification 
              is not possible, such provision shall be severed from this Agreement. The invalidity, illegality, or 
              unenforceability of any provision shall not affect the validity or enforceability of any other 
              provision of this Agreement, and all remaining provisions shall continue in full force and effect.
            </p>
          </section>

          {/* Waiver Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">21. WAIVER</h2>
            <p>
              No waiver by Provider of any breach or default of this Agreement shall constitute a waiver of any 
              subsequent breach or default. Provider's failure or delay in exercising any right or remedy under 
              this Agreement shall not constitute a waiver of such right or remedy. All waivers must be in writing 
              and signed by Provider to be effective.
            </p>
          </section>

          {/* Entire Agreement Section */}
          <section className="mb-8 print:mb-6">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">22. ENTIRE AGREEMENT</h2>
            <p>
              This Agreement constitutes the entire agreement between the parties with respect to the subject matter 
              hereof and supersedes all prior and contemporaneous agreements, representations, and understandings, 
              whether written or oral. This Agreement may not be amended or modified except by a written instrument 
              signed by both parties. Client acknowledges that Client has not relied on any representations or 
              promises not expressly set forth in this Agreement.
            </p>
          </section>

          {/* Client Acknowledgments Section */}
          <section className="mb-8 print:mb-6 p-4 border-2 border-black">
            <h2 className="text-lg font-bold mb-4">CLIENT ACKNOWLEDGMENTS (Initial Each)</h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-24 flex-shrink-0">
                  {signatures.initials.terms ? (
                    <div className="flex items-center gap-1">
                      <img
                        src={signatures.initials.terms}
                        alt="Initials"
                        className="border border-gray-300 h-10 w-20 object-contain bg-white"
                      />
                      <button
                        onClick={() => clearInitial("terms")}
                        className="text-red-500 text-xs print:hidden hover:underline"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <SignaturePad
                      compact
                      label="Initial"
                      onSignatureComplete={(sig) => handleInitial("terms", sig)}
                      onClear={() => clearInitial("terms")}
                    />
                  )}
                </div>
                <p className="flex-1 text-sm">I have read and understand all terms of this Financing Agreement.</p>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-24 flex-shrink-0">
                  {signatures.initials.securityInterest ? (
                    <div className="flex items-center gap-1">
                      <img
                        src={signatures.initials.securityInterest}
                        alt="Initials"
                        className="border border-gray-300 h-10 w-20 object-contain bg-white"
                      />
                      <button
                        onClick={() => clearInitial("securityInterest")}
                        className="text-red-500 text-xs print:hidden hover:underline"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <SignaturePad
                      compact
                      label="Initial"
                      onSignatureComplete={(sig) => handleInitial("securityInterest", sig)}
                      onClear={() => clearInitial("securityInterest")}
                    />
                  )}
                </div>
                <p className="flex-1 text-sm">I understand I am granting a security interest (lien) on my vehicle until the balance is paid in full.</p>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-24 flex-shrink-0">
                  {signatures.initials.defaultConsequences ? (
                    <div className="flex items-center gap-1">
                      <img
                        src={signatures.initials.defaultConsequences}
                        alt="Initials"
                        className="border border-gray-300 h-10 w-20 object-contain bg-white"
                      />
                      <button
                        onClick={() => clearInitial("defaultConsequences")}
                        className="text-red-500 text-xs print:hidden hover:underline"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <SignaturePad
                      compact
                      label="Initial"
                      onSignatureComplete={(sig) => handleInitial("defaultConsequences", sig)}
                      onClear={() => clearInitial("defaultConsequences")}
                    />
                  )}
                </div>
                <p className="flex-1 text-sm">I understand the consequences of default, including acceleration, collection actions, and credit reporting.</p>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-24 flex-shrink-0">
                  {signatures.initials.infoAccuracy ? (
                    <div className="flex items-center gap-1">
                      <img
                        src={signatures.initials.infoAccuracy}
                        alt="Initials"
                        className="border border-gray-300 h-10 w-20 object-contain bg-white"
                      />
                      <button
                        onClick={() => clearInitial("infoAccuracy")}
                        className="text-red-500 text-xs print:hidden hover:underline"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <SignaturePad
                      compact
                      label="Initial"
                      onSignatureComplete={(sig) => handleInitial("infoAccuracy", sig)}
                      onClear={() => clearInitial("infoAccuracy")}
                    />
                  )}
                </div>
                <p className="flex-1 text-sm">I confirm all information I have provided is true and accurate.</p>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-24 flex-shrink-0">
                  {signatures.initials.receivedCopy ? (
                    <div className="flex items-center gap-1">
                      <img
                        src={signatures.initials.receivedCopy}
                        alt="Initials"
                        className="border border-gray-300 h-10 w-20 object-contain bg-white"
                      />
                      <button
                        onClick={() => clearInitial("receivedCopy")}
                        className="text-red-500 text-xs print:hidden hover:underline"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <SignaturePad
                      compact
                      label="Initial"
                      onSignatureComplete={(sig) => handleInitial("receivedCopy", sig)}
                      onClear={() => clearInitial("receivedCopy")}
                    />
                  )}
                </div>
                <p className="flex-1 text-sm">I have received a copy of this Agreement.</p>
              </div>
            </div>
          </section>

          {/* Signatures Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">23. SIGNATURES</h2>
            <p className="mb-6">
              IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="font-bold mb-4">PROVIDER:</p>
                {signatures.providerSignature ? (
                  <div className="mb-2">
                    <img
                      src={signatures.providerSignature}
                      alt="Provider Signature"
                      className="border border-gray-300 h-20 w-full max-w-[300px] object-contain bg-white"
                    />
                    <button
                      onClick={clearProviderSignature}
                      className="text-red-500 text-xs mt-1 print:hidden hover:underline"
                    >
                      Clear signature
                    </button>
                  </div>
                ) : (
                  <div className="mb-2">
                    <SignaturePad
                      width={300}
                      height={80}
                      label="Sign here"
                      onSignatureComplete={handleProviderSignature}
                      onClear={clearProviderSignature}
                    />
                    {/* Print fallback */}
                    <div className="hidden print:block border-b border-black h-12"></div>
                  </div>
                )}
                <p>{PROVIDER.name}</p>
                <div className="mt-2">
                  {signatures.providerSignedAt ? (
                    <p className="text-sm">
                      <strong>Signed:</strong> {formatDateTime(signatures.providerSignedAt)}
                    </p>
                  ) : (
                    <p>Date: _______________________</p>
                  )}
                </div>
              </div>
              <div>
                <p className="font-bold mb-4">CLIENT:</p>
                {signatures.clientSignature ? (
                  <div className="mb-2">
                    <img
                      src={signatures.clientSignature}
                      alt="Client Signature"
                      className="border border-gray-300 h-20 w-full max-w-[300px] object-contain bg-white"
                    />
                    <button
                      onClick={clearClientSignature}
                      className="text-red-500 text-xs mt-1 print:hidden hover:underline"
                    >
                      Clear signature
                    </button>
                  </div>
                ) : (
                  <div className="mb-2">
                    <SignaturePad
                      width={300}
                      height={80}
                      label="Sign here"
                      onSignatureComplete={handleClientSignature}
                      onClear={clearClientSignature}
                    />
                    {/* Print fallback */}
                    <div className="hidden print:block border-b border-black h-12"></div>
                  </div>
                )}
                <p>{formData.clientName || "_______________"}</p>
                <div className="mt-2">
                  {signatures.clientSignedAt ? (
                    <p className="text-sm">
                      <strong>Signed:</strong> {formatDateTime(signatures.clientSignedAt)}
                    </p>
                  ) : (
                    <p>Date: _______________________</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default FinancingContract;
