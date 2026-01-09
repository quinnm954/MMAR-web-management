import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer, Save, Download, Trash2 } from "lucide-react";
import mmarLogo from "@/assets/mmar-logo.jpeg";

interface ContractData {
  providerName: string;
  providerAddress: string;
  providerContact: string;
  clientName: string;
  clientAddress: string;
  clientContact: string;
  agreementDate: string;
  serviceDescription: string;
  totalServicePrice: string;
  firstPaymentDate: string;
  lateFee: string;
  gracePeriodDays: string;
  paymentMethod: string;
  governingLaw: string;
}

const defaultData: ContractData = {
  providerName: "Mike's Mobile Auto Repair (MMAR)",
  providerAddress: "Greenville County, SC",
  providerContact: "(864) 365-6444 | mikesmarllc@gmail.com",
  clientName: "",
  clientAddress: "",
  clientContact: "",
  agreementDate: new Date().toISOString().split("T")[0],
  serviceDescription: "",
  totalServicePrice: "",
  firstPaymentDate: "",
  lateFee: "25.00",
  gracePeriodDays: "5",
  paymentMethod: "",
  governingLaw: "South Carolina",
};

const STORAGE_KEY = "mmar-financing-contract";

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
  const [formData, setFormData] = useState<ContractData>(defaultData);
  const [hasSaved, setHasSaved] = useState(false);

  // Check for saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setHasSaved(true);
    }
  }, []);

  // Auto-calculations
  const calculations = useMemo(() => {
    const totalPrice = sanitizeNumber(formData.totalServicePrice);
    const downPayment = totalPrice * 0.75;
    const principal = totalPrice * 0.25;
    const interest = principal * 0.25 * 1; // 25% annual simple interest for 1 year
    const totalFinanced = principal + interest;
    const baseMonthlyPayment = Math.floor((totalFinanced / 12) * 100) / 100;
    const sumOfFirst11 = baseMonthlyPayment * 11;
    const finalPayment = Math.round((totalFinanced - sumOfFirst11) * 100) / 100;
    
    return {
      totalPrice,
      downPayment,
      principal,
      interest,
      totalFinanced,
      baseMonthlyPayment,
      finalPayment,
    };
  }, [formData.totalServicePrice]);

  // Payment schedule
  const paymentSchedule = useMemo(() => {
    const dates = calculatePaymentDates(formData.firstPaymentDate, 12);
    return dates.map((date, index) => ({
      number: index + 1,
      dueDate: date,
      amount: index === 11 ? calculations.finalPayment : calculations.baseMonthlyPayment,
    }));
  }, [formData.firstPaymentDate, calculations]);

  const handleInputChange = (field: keyof ContractData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    setHasSaved(true);
  };

  const handleLoad = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(defaultData);
    setHasSaved(false);
  };

  const handlePrint = () => {
    window.print();
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
                Save
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
                  <p className="font-medium">{defaultData.providerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Down Payment</p>
                  <p className="font-medium">75% of Total</p>
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Down Payment (75%)</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(calculations.downPayment)}</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Financed (25%)</p>
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

          {/* Parties Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">1. PARTIES</h2>
            <p className="mb-2">
              This Financing Agreement ("Agreement") is entered into as of{" "}
              <strong>{formatDate(formData.agreementDate) || "_______________"}</strong> by and between:
            </p>
            <div className="ml-4 mb-3">
              <p>
                <strong>PROVIDER:</strong> {formData.providerName || "_______________"}
              </p>
              <p>Address: {formData.providerAddress || "_______________"}</p>
              <p>Contact: {formData.providerContact || "_______________"}</p>
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
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">2. SERVICES</h2>
            <p>
              Provider has performed or will perform the following automotive repair services for Client:
            </p>
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
                <strong>a) Down Payment:</strong> {formatCurrency(calculations.downPayment)} (75% of Total Service Price),
                due upon execution of this Agreement.
              </p>
              <p>
                <strong>b) Financed Amount:</strong> {formatCurrency(calculations.principal)} (25% of Total Service Price),
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
            {formData.paymentMethod && (
              <p className="mt-3">
                <strong>Accepted Payment Method(s):</strong> {formData.paymentMethod}
              </p>
            )}
          </section>

          {/* Late Fees Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">7. LATE FEES</h2>
            <p>
              If any payment is not received within{" "}
              <strong>{formData.gracePeriodDays || "5"}</strong> days of its due date ("Grace Period"),
              Client agrees to pay a late fee of{" "}
              <strong>{formatCurrency(sanitizeNumber(formData.lateFee))}</strong> for each late payment.
            </p>
          </section>

          {/* Default Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">8. DEFAULT</h2>
            <p>
              If Client fails to make any payment within 30 days of its due date, Provider may declare
              the entire remaining balance immediately due and payable. Provider may also pursue any
              other remedies available under applicable law, including but not limited to collection
              efforts and legal action to recover the outstanding balance plus reasonable attorney's
              fees and court costs.
            </p>
          </section>

          {/* No Prepayment Penalty Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">9. NO PREPAYMENT PENALTY</h2>
            <p>
              Client may prepay any or all of the remaining financed balance at any time without
              penalty. If Client prepays in full, interest will not be reduced; the full interest
              amount as calculated herein remains due.
            </p>
          </section>

          {/* Governing Law Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">10. GOVERNING LAW</h2>
            <p>
              This Agreement shall be governed by and construed in accordance with the laws of the
              State of <strong>{formData.governingLaw || "South Carolina"}</strong>, without regard
              to its conflict of laws principles.
            </p>
          </section>

          {/* Entire Agreement Section */}
          <section className="mb-8 print:mb-6">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">11. ENTIRE AGREEMENT</h2>
            <p>
              This Agreement constitutes the entire agreement between the parties with respect to the
              subject matter hereof and supersedes all prior and contemporaneous agreements,
              representations, and understandings, whether written or oral. This Agreement may not be
              amended or modified except by a written instrument signed by both parties.
            </p>
          </section>

          {/* Signatures Section */}
          <section className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">12. SIGNATURES</h2>
            <p className="mb-6">
              IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first
              written above.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="font-bold mb-4">PROVIDER:</p>
                <div className="border-b border-black mb-2 h-12"></div>
                <p>{formData.providerName || "_______________"}</p>
                <div className="mt-4">
                  <p>Date: _______________________</p>
                </div>
              </div>
              <div>
                <p className="font-bold mb-4">CLIENT:</p>
                <div className="border-b border-black mb-2 h-12"></div>
                <p>{formData.clientName || "_______________"}</p>
                <div className="mt-4">
                  <p>Date: _______________________</p>
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
