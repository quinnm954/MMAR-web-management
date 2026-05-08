import { Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import mmarLogo from "@/assets/mmar-logo.jpeg";
import EstimateSummaryCard from "@/components/EstimateSummaryCard";

const WarrantyPolicy = () => {
  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Hidden in print */}
      <div className="print:hidden bg-secondary/30 border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print Policy
          </Button>
        </div>
      </div>

      {/* Policy Document */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Linked estimate summary (when ?estimate= or ?token= present) */}
        <div className="print:hidden mb-6">
          <EstimateSummaryCard />
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-8 md:p-12 contract-document">
          {/* Header */}
          <div className="text-center border-b-2 border-primary pb-6 mb-8">
            <img src={mmarLogo} alt="MMAR Logo" className="h-20 mx-auto mb-4 rounded" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              WARRANTY & SERVICE POLICY
            </h1>
            <p className="text-muted-foreground mt-2">Mike's Mobile Auto Repair</p>
            <p className="text-sm text-muted-foreground">Fort Myers, Florida</p>
            <p className="text-xs text-muted-foreground mt-2">Effective Date: {currentDate}</p>
          </div>

          {/* Acceptance Notice */}
          <div className="bg-destructive/10 border-2 border-destructive/30 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-bold text-destructive mb-2">IMPORTANT NOTICE - PLEASE READ</h2>
            <p className="text-sm text-foreground leading-relaxed">
              <strong>BY AUTHORIZING ANY SERVICE, REPAIR, OR DIAGNOSTIC WORK, YOU ACKNOWLEDGE THAT YOU HAVE READ, 
              UNDERSTOOD, AND AGREE TO ALL TERMS AND CONDITIONS STATED IN THIS POLICY.</strong> Using our services 
              constitutes your acceptance of these terms. No verbal agreements, promises, or modifications shall 
              be valid unless confirmed in writing and signed by an authorized representative of Mike's Mobile Auto Repair ("MMAR").
            </p>
          </div>

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              1. ACCEPTANCE OF TERMS
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>1.1. By requesting, authorizing, or accepting any service from MMAR, Customer agrees to be bound by all terms and conditions set forth in this policy.</p>
              <p>1.2. This policy supersedes any prior verbal or written agreements unless specifically stated otherwise in writing.</p>
              <p>1.3. Customer acknowledges receipt of this policy and agrees to its terms upon authorization of any service.</p>
              <p>1.4. MMAR reserves the right to modify this policy at any time. Current policy will be available upon request.</p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              2. LIMITED WARRANTY COVERAGE
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>2.1. <strong>Parts Warranty:</strong> New parts installed by MMAR are warranted against defects in materials for twelve (12) months or twelve thousand (12,000) miles from the date of installation, whichever occurs first.</p>
              <p>2.2. <strong>Labor Warranty:</strong> Labor performed by MMAR is warranted for ninety (90) days from the date of service completion.</p>
              <p>2.3. <strong>Scope:</strong> Warranty covers defects in workmanship and materials only. Warranty does NOT cover failures resulting from normal wear and tear, abuse, neglect, lack of maintenance, aftermarket modifications, accidents, or acts of nature.</p>
              <p>2.4. <strong>Warranty Claims:</strong> All warranty claims must be made directly to MMAR. MMAR has sole discretion to repair, replace, or refund at its option.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              3. WARRANTY EXCLUSIONS
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>The limited warranty does NOT cover:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Electrical or mechanical issues caused by customer-installed accessories or modifications</li>
                <li>Damage resulting from continued operation after warning indicators (lights, sounds, gauges) activate</li>
                <li>Wear items including but not limited to: fluids, filters, belts, hoses, brake pads, wiper blades, bulbs, and tires</li>
                <li>Pre-existing conditions not disclosed to MMAR prior to service</li>
                <li>Damage caused by towing, improper use, or failure to follow operating instructions</li>
                <li>Environmental damage including flood, fire, vandalism, theft, or acts of God</li>
                <li>Vehicles used for racing, off-road purposes, or commercial use beyond stated purpose</li>
                <li>Customer-supplied parts (absolutely no warranty)</li>
                <li>Used, salvage, or rebuilt parts (manufacturer warranty only, if any)</li>
                <li>Failures caused by contaminated fuel, fluids, or incorrect fuel type</li>
                <li>Consequential or collateral damage to other vehicle components</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              4. WARRANTY CLAIM PROCEDURES
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>4.1. Vehicle must be returned to MMAR for inspection before any warranty determination is made.</p>
              <p>4.2. Customer must present the original repair invoice at time of warranty claim.</p>
              <p>4.3. All warranty claims must be filed within the applicable warranty period.</p>
              <p>4.4. MMAR will not reimburse for repairs performed by other service providers, regardless of circumstances.</p>
              <p>4.5. Transportation costs to return vehicle for warranty service are the sole responsibility of the Customer.</p>
              <p>4.6. MMAR reserves the right to inspect the vehicle and failed components before determining warranty applicability.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              5. LIMITATION OF LIABILITY
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>5.1. <strong>MAXIMUM LIABILITY:</strong> Except for claims arising from gross negligence, willful misconduct, or reckless conduct by MMAR, MMAR's maximum liability for any claim shall not exceed the original cost of the repair or service giving rise to the claim.</p>
              <p>5.2. <strong>EXCLUSION OF DAMAGES:</strong> TO THE FULLEST EXTENT PERMITTED BY LAW, AND EXCEPT FOR DAMAGES ARISING FROM GROSS NEGLIGENCE, WILLFUL MISCONDUCT, OR RECKLESS CONDUCT, MMAR SHALL NOT BE LIABLE FOR ANY CONSEQUENTIAL, INCIDENTAL, SPECIAL, PUNITIVE, OR INDIRECT DAMAGES, INCLUDING BUT NOT LIMITED TO:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Towing charges</li>
                <li>Rental car or substitute transportation costs</li>
                <li>Lost wages, lost business, or lost profits</li>
                <li>Hotel, meal, or travel expenses</li>
                <li>Delay in obtaining parts or completing repairs</li>
                <li>Diminished vehicle value</li>
              </ul>
              <p>5.3. <strong>PRESERVATION OF RIGHTS:</strong> Nothing in this policy shall be construed to limit or exclude liability for personal injury or property damage caused by MMAR's gross negligence, willful misconduct, or reckless conduct, or any other liability that cannot be limited or excluded under applicable law.</p>
              <p>5.4. Customer assumes all risk for vehicle operation and use during and after the repair process, except where damage results from MMAR's negligence.</p>
            </div>
          </section>

          {/* Section 5A - Disclaimer of Implied Warranties */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              5A. DISCLAIMER OF IMPLIED WARRANTIES
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>5A.1. <strong>DISCLAIMER:</strong> TO THE FULLEST EXTENT PERMITTED BY FLORIDA LAW, MMAR EXPRESSLY DISCLAIMS ALL IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.</p>
              <p>5A.2. THE LIMITED WARRANTY SET FORTH IN SECTION 2 OF THIS POLICY IS THE SOLE AND EXCLUSIVE WARRANTY PROVIDED BY MMAR. NO OTHER WARRANTIES, WHETHER EXPRESS OR IMPLIED, ARE MADE WITH RESPECT TO ANY SERVICES, PARTS, OR REPAIRS PROVIDED BY MMAR.</p>
              <p>5A.3. Some jurisdictions do not allow limitations on implied warranties, so the above limitations may not apply to you. In such jurisdictions, MMAR's liability shall be limited to the maximum extent permitted by law.</p>
              <p>5A.4. Customer acknowledges that the services provided by MMAR are provided "AS IS" except as expressly set forth in the Limited Warranty Coverage section of this policy.</p>
            </div>
          </section>

          {/* Section 5B - Magnuson-Moss Act Compliance */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              5B. MAGNUSON-MOSS WARRANTY ACT COMPLIANCE
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>5B.1. <strong>FEDERAL COMPLIANCE:</strong> This warranty policy is provided in compliance with the Magnuson-Moss Warranty Act, 15 U.S.C. §§ 2301-2312, and applicable Federal Trade Commission regulations.</p>
              <p>5B.2. <strong>WARRANTY DESIGNATION:</strong> The limited warranty provided by MMAR is a "LIMITED WARRANTY" as defined under the Magnuson-Moss Warranty Act. This warranty gives you specific legal rights, and you may also have other rights which vary from state to state.</p>
              <p>5B.3. <strong>WARRANTOR IDENTIFICATION:</strong> The warrantor of this limited warranty is Mike's Mobile Auto Repair ("MMAR"), located in Fort Myers, Florida. Contact: (813) 501-7572.</p>
              <p>5B.4. <strong>COVERAGE SUMMARY:</strong> This limited warranty covers defects in workmanship and materials for parts installed by MMAR for twelve (12) months or 12,000 miles (whichever comes first) and labor for ninety (90) days from the date of service, subject to the exclusions and conditions stated herein.</p>
              <p>5B.5. <strong>OBTAINING WARRANTY SERVICE:</strong> To obtain warranty service, Customer must return the vehicle to MMAR with the original repair invoice within the applicable warranty period. MMAR will, at its sole discretion, repair, replace, or refund the defective part or service.</p>
              <p>5B.6. <strong>NO CHARGE FOR WARRANTY SERVICE:</strong> There is no charge for warranty service on covered repairs performed by MMAR during the warranty period.</p>
              <p>5B.7. <strong>LIMITATIONS:</strong> Any implied warranties, including the implied warranties of merchantability and fitness for a particular purpose, are limited in duration to the duration of this written warranty to the extent permitted by law. Some states do not allow limitations on how long an implied warranty lasts, so the above limitation may not apply to you.</p>
              <p>5B.8. <strong>EXCLUSION OF CONSEQUENTIAL DAMAGES:</strong> MMAR shall not be liable for incidental or consequential damages, except where such exclusion is prohibited by law. Some states do not allow the exclusion or limitation of incidental or consequential damages, so the above limitation or exclusion may not apply to you.</p>
              <p>5B.9. <strong>STATE LAW RIGHTS:</strong> This warranty gives you specific legal rights. You may also have other rights which vary from state to state.</p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              6. PARTS & LABOR DISCLAIMER
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>6.1. <strong>Customer-Supplied Parts:</strong> Parts supplied by the Customer carry ABSOLUTELY NO WARRANTY from MMAR. Customer assumes all risk for quality, fitment, and performance. MMAR is not responsible for any damage, delays, or additional labor resulting from customer-supplied parts.</p>
              <p>6.2. <strong>Used/Salvage Parts:</strong> If Customer requests used or salvage parts, warranty is limited to manufacturer warranty only (if any). MMAR disclaims all warranties on used parts.</p>
              <p>6.3. <strong>Parts Selection:</strong> Customer may choose between OEM, aftermarket, or remanufactured parts at quoted prices. Part selection affects warranty coverage.</p>
              <p>6.4. <strong>Rebuilt/Remanufactured Parts:</strong> These parts carry manufacturer warranty only. MMAR will assist with warranty claims but is not directly liable.</p>
              <p>6.5. <strong>Parts Availability:</strong> MMAR is not responsible for delays in parts availability from suppliers or manufacturers.</p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              7. DIAGNOSTIC FEES
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>7.1. Diagnostic fees are non-refundable and are due regardless of whether repairs are performed.</p>
              <p>7.2. Diagnostic fees may be applied toward authorized repairs at MMAR's discretion.</p>
              <p>7.3. Additional diagnostic time beyond initial estimate may be required and will be charged accordingly.</p>
              <p>7.4. Customer authorizes MMAR to perform reasonable diagnostic procedures to identify the problem.</p>
              <p>7.5. Diagnosis may reveal additional issues not related to the original complaint. Customer will be notified before additional diagnostic work is performed.</p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              8. ESTIMATES & AUTHORIZATION
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>8.1. Written or verbal authorization is required before any work begins.</p>
              <p>8.2. Estimates are approximations based on initial inspection. Final cost may vary based on actual conditions found.</p>
              <p>8.3. Customer will be contacted if the estimate is expected to exceed the original quote by more than ten percent (10%).</p>
              <p>8.4. By declining recommended repairs, Customer releases MMAR from any and all liability for damage, injury, or consequential issues related to the declined service.</p>
              <p>8.5. Authorization may be given verbally (in person or by phone), in writing, or electronically (text/email). MMAR may record calls for verification purposes.</p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              9. STORAGE & ABANDONED VEHICLES
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>9.1. <strong>Storage Fees:</strong> Vehicles not picked up within seven (7) calendar days of completion notification are subject to storage fees of Twenty-Five Dollars ($25.00) per day.</p>
              <p>9.2. <strong>Abandoned Vehicles:</strong> Vehicles not picked up within thirty (30) calendar days of completion notification may be considered abandoned.</p>
              <p>9.3. <strong>Mechanic's Lien:</strong> MMAR reserves all rights under Florida law (Fla. Stat. §§ 713.58 and 713.585) to pursue a mechanic's lien on abandoned vehicles to recover unpaid charges.</p>
              <p>9.4. Customer agrees to pay all storage fees, lien filing fees, and legal costs associated with abandoned vehicle recovery.</p>
            </div>
          </section>

          {/* Section 10 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              10. PAYMENT TERMS
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>10.1. Full payment is due upon completion of service unless prior financing arrangements have been made in writing.</p>
              <p>10.2. Vehicle will not be released until payment is received in full.</p>
              <p>10.3. <strong>Returned Payment Fee:</strong> A fee of Thirty-Five Dollars ($35.00) will be charged for any returned check, declined card, or reversed payment.</p>
              <p>10.4. <strong>Late Payment Interest:</strong> Past-due balances accrue interest at a rate of one and one-half percent (1.5%) per month (18% APR).</p>
              <p>10.5. Customer agrees to pay all collection costs, attorney fees, and court costs incurred in collecting unpaid balances.</p>
              <p>10.6. Accepted payment methods: Cash, Credit Card, Debit Card, Approved Financing. Personal checks accepted at MMAR's discretion.</p>
            </div>
          </section>

          {/* Section 11 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              11. CUSTOMER RESPONSIBILITIES
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>11.1. Provide accurate and complete vehicle history, symptoms, and concerns.</p>
              <p>11.2. Disclose all known issues, previous repairs, modifications, and accident history.</p>
              <p>11.3. Remove all personal belongings and valuables from vehicle before service. MMAR is not responsible for lost or stolen items.</p>
              <p>11.4. Maintain vehicle according to manufacturer recommendations.</p>
              <p>11.5. Authorize repairs in writing or verbally before work begins.</p>
              <p>11.6. Provide valid contact information and respond promptly to communications.</p>
              <p>11.7. Pick up vehicle promptly upon notification of completion.</p>
            </div>
          </section>

          {/* Section 12 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              12. INDEMNIFICATION
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>12.1. Customer agrees to indemnify, defend, and hold harmless MMAR, its owners, employees, and agents from and against any and all claims, damages, losses, costs, and expenses (including attorney fees) arising from:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Customer's negligence, misrepresentation, or failure to disclose material information</li>
                <li>Customer's unauthorized use of the vehicle</li>
                <li>Use of customer-supplied parts</li>
                <li>Customer's failure to follow maintenance recommendations</li>
                <li>Operation of vehicle after being advised of unsafe conditions</li>
                <li>Claims by third parties arising from Customer's vehicle operation</li>
              </ul>
            </div>
          </section>

          {/* Section 13 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              13. DISPUTE RESOLUTION
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>13.1. <strong>Informal Resolution:</strong> Customer agrees to first attempt informal resolution by contacting MMAR management directly.</p>
              <p>13.2. <strong>Mediation:</strong> If informal resolution fails, disputes shall be submitted to non-binding mediation before any legal action is filed.</p>
              <p>13.3. <strong>Venue:</strong> Exclusive venue for any legal action shall be Lee County, Florida.</p>
              <p>13.4. <strong>Governing Law:</strong> This agreement shall be governed by and construed in accordance with the laws of the State of Florida.</p>
              <p>13.5. <strong>Attorney Fees:</strong> In any legal action arising from this agreement, the prevailing party shall be entitled to recover reasonable attorney fees and costs.</p>
              <p>13.6. <strong>Limitation Period:</strong> Any claim must be filed within one (1) year of the date of service.</p>
            </div>
          </section>

          {/* Section 14 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              14. SAFETY RECALLS & MANUFACTURER ISSUES
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>14.1. MMAR does not perform manufacturer safety recalls. Customer should contact their dealer for recall service.</p>
              <p>14.2. MMAR is not responsible for issues covered by manufacturer recalls or technical service bulletins.</p>
              <p>14.3. If a recall-related issue is discovered during service, Customer will be notified and referred to appropriate dealer.</p>
            </div>
          </section>

          {/* Section 15 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              15. PRIVACY POLICY
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>15.1. Customer information is kept confidential and is not sold to third parties.</p>
              <p>15.2. MMAR may share necessary information with parts suppliers for warranty purposes.</p>
              <p>15.3. MMAR may contact Customer regarding vehicle service, promotions, and important safety information.</p>
              <p>15.4. Customer may opt out of promotional communications at any time.</p>
            </div>
          </section>

          {/* Section 16 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3 border-b border-border pb-2">
              16. WAIVER & SEVERABILITY
            </h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>16.1. Failure by MMAR to enforce any provision of this policy shall not constitute a waiver of the right to enforce that provision in the future.</p>
              <p>16.2. If any provision of this policy is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.</p>
              <p>16.3. No oral modifications, amendments, or waivers of this policy shall be valid. All changes must be in writing and signed by an authorized representative of MMAR.</p>
              <p>16.4. This policy represents the entire agreement between Customer and MMAR regarding warranty and service terms.</p>
            </div>
          </section>

          {/* Shop Notice */}
          <section className="mt-12 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground italic">
              A copy of this policy is posted at our service location and is available upon request. 
              Customer signature or service authorization constitutes acceptance of all terms.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              © {new Date().getFullYear()} Mike's Mobile Auto Repair. All rights reserved.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default WarrantyPolicy;
