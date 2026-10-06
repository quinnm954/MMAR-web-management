// Text of the Independent Technician Subcontractor Agreement & NDA.
// Shared by the admin screen, the public signing page, and the printable copy.

export const COMPANY_LEGAL = "Capital Services Management, INC.";
export const COMPANY_DBA = "Mike's Mobile Auto Repair (MMAR) and Garage Ace";

export type AgreementSection = {
  title: string;
  paragraphs: string[];
  initialKey?: string; // sections the technician must initial
};

export const INITIAL_LABELS: Record<string, string> = {
  contractor: "Independent contractor (1099) status",
  pay: "Pay terms & daily payout condition",
  rework: "Comeback / rework policy",
  damage: "Property damage responsibility",
  nda: "Non-disclosure & Garage Ace data",
  nonsolicit: "Non-solicitation & no side work",
};

export function agreementSections(rate: number): AgreementSection[] {
  const r = `$${Number(rate || 40).toFixed(2)}`;
  return [
    {
      title: "1. Independent Contractor Relationship",
      initialKey: "contractor",
      paragraphs: [
        "Technician is engaged as an independent subcontractor, not an employee. Nothing in this Agreement creates an employment, partnership, or joint-venture relationship.",
        "Technician is solely responsible for all federal, state, and local taxes, including self-employment tax. Company will issue IRS Form 1099-NEC where required.",
        "Technician is not eligible for wages, overtime, benefits, paid time off, unemployment, or workers' compensation through Company. Technician may accept or decline offered jobs and controls the manner and means of performing the work, subject to the quality standards in this Agreement.",
      ],
    },
    {
      title: "2. Service Territory, Vehicle & Tools",
      paragraphs: [
        "Primary service territory: Fort Myers, Cape Coral, and Estero, Florida, and other Lee County locations by mutual agreement.",
        "Technician provides and maintains, at Technician's own expense, a reliable vehicle, fuel, a valid Florida driver's license, auto insurance appropriate for business use, scan/diagnostic tools, hand and power tools, floor jack, rated jack stands, drip pans/mats, and personal protective equipment. Company does not insure Technician's vehicle, tools, or equipment.",
        "Technician will never work under a vehicle supported only by a jack.",
      ],
    },
    {
      title: "3. Compensation & Daily Payout",
      initialKey: "pay",
      paragraphs: [
        `Technician is paid a flat rate of ${r} per labor hour, based on the labor hours on the customer-approved estimate in Garage Ace, regardless of actual time spent. There is no base pay, hourly guarantee, or pay for drive time, waiting, or inspections that do not produce approved work.`,
        "On each assigned visit Technician completes a full digital vehicle inspection in Garage Ace (condition notes, codes, photos, mileage) and relays findings to the customer and to Company so Company can prepare a quote and schedule the repair.",
        "Technician may not quote prices, change the job scope, or collect any payment from customers. All pricing, approvals, and invoicing are handled by Company through Garage Ace.",
        "Pay is issued daily by cash or Cash App after the day's work is completed. Payout is released only after all inspections, photos, mileage, and job sign-offs for that day are submitted in Garage Ace.",
      ],
    },
    {
      title: "4. Workmanship & Comebacks",
      initialKey: "rework",
      paragraphs: [
        "If a repair fails within 90 days because of Technician's workmanship, Technician will return and correct it at no additional pay.",
        "If Technician is unavailable or refuses, Company's actual cost to have the work corrected may be deducted from amounts owed to Technician, to the extent permitted by law.",
      ],
    },
    {
      title: "5. Customer Property & Safety",
      initialKey: "damage",
      paragraphs: [
        "Technician will protect customer vehicles and property, use drip pans and mats for all fluid work, and dispose of fluids and parts properly.",
        "Technician is responsible for damage caused by Technician's negligence or misuse of tools (for example stripped threads, broken components, dropped vehicles, or stained driveways).",
      ],
    },
    {
      title: "6. Non-Disclosure (Company & Garage Ace)",
      initialKey: "nda",
      paragraphs: [
        "Confidential Information includes customer and fleet identities, phone numbers, addresses, vehicle and service histories, pricing, labor rates, margins, business processes, and all non-public features, screens, data, and software of the Garage Ace platform.",
        "Technician will use Confidential Information only to perform assigned work, and will not disclose, copy, screenshot, export, sell, or reverse-engineer it, during or after this Agreement.",
        "All customer records, inspections, photos, and communications created in Garage Ace belong to Company. On termination Technician will delete any Company information on personal devices and log out of Garage Ace.",
      ],
    },
    {
      title: "7. Non-Solicitation & No Side Work",
      initialKey: "nonsolicit",
      paragraphs: [
        "During this Agreement and for 12 months after it ends, within Lee County, Florida, Technician will not solicit, service, or accept payment directly from any customer, fleet account, or lead that Technician met or learned of through Company or Garage Ace, and will not give customers personal contact information for that purpose.",
        "Technician agrees Company's damages are hard to measure and agrees to pay $2,500 per customer diverted as liquidated damages, plus reasonable attorney's fees and costs. Company may also seek an injunction under Florida Statute 542.335.",
      ],
    },
    {
      title: "8. Term & Termination",
      paragraphs: [
        "Either party may end this Agreement at any time with written notice (text or email is acceptable). Sections 4 through 7 and 9 survive termination. Company will pay for approved work completed and submitted before termination.",
      ],
    },
    {
      title: "9. General Terms & Electronic Signatures",
      paragraphs: [
        "This Agreement is governed by Florida law, with exclusive venue in Lee County, Florida. If any part is unenforceable, the rest remains in effect and the court may narrow the restriction to make it enforceable. This is the entire agreement between the parties.",
        "The parties agree to sign electronically. Electronic signatures and initials are as binding as handwritten ones under the Florida Electronic Signature Act and the federal E-SIGN Act.",
      ],
    },
  ];
}
