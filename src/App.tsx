import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { GtagRouteTracker } from "@/components/GtagRouteTracker";
import Index from "./pages/Index";

import FinancingContract from "./pages/FinancingContract";
import WarrantyPolicy from "./pages/WarrantyPolicy";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Login from "./pages/Login";
import { Navigate } from "react-router-dom";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import ServiceCategory from "./pages/ServiceCategory";
import ServicesIndex from "./pages/ServicesIndex";
import CityPage from "./pages/CityPage";
import ServiceAreas from "./pages/ServiceAreas";
import LeeCounty from "./pages/LeeCounty";
import LocalLanding from "./pages/LocalLanding";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogTag from "./pages/BlogTag";
import AboutPage from "./pages/AboutPage";
import Reviews from "./pages/Reviews";
import ReviewLanding from "./pages/ReviewLanding";
import ContactPage from "./pages/ContactPage";
import InstallApp from "./pages/InstallApp";

import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalOnboarding from "./pages/portal/PortalOnboarding";
import PortalMaintenance from "./pages/portal/PortalMaintenance";
import MembershipSignup from "./pages/portal/MembershipSignup";
import PortalVehicles from "./pages/portal/PortalVehicles";
import PortalMembership from "./pages/portal/PortalMembership";
import PortalAppointments from "./pages/portal/PortalAppointments";
import PortalServiceHistory from "./pages/portal/PortalServiceHistory";
import PortalInvoices from "./pages/portal/PortalInvoices";
import PortalInvoiceDetail from "./pages/portal/PortalInvoiceDetail";
import PortalEstimates from "./pages/portal/PortalEstimates";
import PortalRepairOrders from "./pages/portal/PortalRepairOrders";
import PortalFinancing from "./pages/portal/PortalFinancing";
import CustomerProtectedRoute from "./components/portal/CustomerProtectedRoute";
import NotFound from "./pages/NotFound";
import Unsubscribe from "./pages/Unsubscribe";
import MileageUpdate from "./pages/MileageUpdate";
import TechDashboard from "./pages/tech/TechDashboard";
import TechJobs from "./pages/tech/TechJobs";
import TechCustomers from "./pages/tech/TechCustomers";
import TechHistory from "./pages/tech/TechHistory";
import TechTime from "./pages/tech/TechTime";

import TechInspections from "./pages/tech/TechInspections";
import TechChecklists from "./pages/tech/TechChecklists";
import PortalChecklists from "./pages/portal/PortalChecklists";
import PortalVehicleHealth from "./pages/portal/PortalVehicleHealth";
import PortalInspections from "./pages/portal/PortalInspections";
import TechProtectedRoute from "./components/tech/TechProtectedRoute";
import EstimateApproval from "./pages/EstimateApproval";
import InspectionReport from "./pages/InspectionReport";
import SetPassword from "./pages/SetPassword";
import SharedCustomerSummary from "./pages/SharedCustomerSummary";
import MmarCare from "./pages/MmarCare";
import GarageAce from "./pages/GarageAce";
import WhyGarageAce from "./pages/WhyGarageAce";
import Fleet from "./pages/Fleet";
import Book from "./pages/Book";
import AppointmentConfirmation from "./pages/AppointmentConfirmation";
import NativeBoot from "./components/NativeBoot";
import PullToRefresh from "./components/PullToRefresh";
import { captureAttribution } from "@/lib/gtag";

const queryClient = new QueryClient();

if (typeof window !== "undefined") captureAttribution();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NativeBoot />
          <PullToRefresh />
          <GtagRouteTracker />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/financing-contract" element={<FinancingContract />} />
            <Route path="/warranty-policy" element={<WarrantyPolicy />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesIndex />} />
            <Route path="/services/:slug" element={<ServiceCategory />} />
            <Route path="/service-areas" element={<ServiceAreas />} />
            <Route path="/lee-county-fl" element={<LeeCounty />} />
            <Route path="/areas/:city" element={<CityPage />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/review" element={<ReviewLanding />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/install" element={<InstallApp />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/tag/:tag" element={<BlogTag />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/memberships" element={<Navigate to="/mmar-care" replace />} />
            <Route path="/memberships/*" element={<Navigate to="/mmar-care" replace />} />
            <Route path="/mmar-care" element={<MmarCare />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/garage-ace" element={<GarageAce />} />
            <Route path="/why-garage-ace" element={<WhyGarageAce />} />
            <Route path="/portal/login" element={<Navigate to="/login" replace />} />
            <Route path="/portal/signup" element={<Navigate to="/login?tab=signup" replace />} />
            <Route path="/portal/membership-signup" element={<MembershipSignup />} />
            <Route path="/portal/onboarding" element={<CustomerProtectedRoute><PortalOnboarding /></CustomerProtectedRoute>} />
            <Route path="/portal/dashboard" element={<CustomerProtectedRoute><PortalDashboard /></CustomerProtectedRoute>} />
            <Route path="/portal/vehicles" element={<CustomerProtectedRoute><PortalVehicles /></CustomerProtectedRoute>} />
            <Route path="/portal/maintenance" element={<CustomerProtectedRoute><PortalMaintenance /></CustomerProtectedRoute>} />
            <Route path="/portal/membership" element={<CustomerProtectedRoute><PortalMembership /></CustomerProtectedRoute>} />
            <Route path="/portal/appointments" element={<CustomerProtectedRoute><PortalAppointments /></CustomerProtectedRoute>} />
            <Route path="/portal/service-history" element={<CustomerProtectedRoute><PortalServiceHistory /></CustomerProtectedRoute>} />
            <Route path="/portal/invoices" element={<CustomerProtectedRoute><PortalInvoices /></CustomerProtectedRoute>} />
            <Route path="/portal/invoices/:id" element={<CustomerProtectedRoute><PortalInvoiceDetail /></CustomerProtectedRoute>} />
            <Route path="/portal/estimates" element={<CustomerProtectedRoute><PortalEstimates /></CustomerProtectedRoute>} />
            <Route path="/portal/repair-orders" element={<CustomerProtectedRoute><PortalRepairOrders /></CustomerProtectedRoute>} />
            <Route path="/portal/financing" element={<CustomerProtectedRoute><PortalFinancing /></CustomerProtectedRoute>} />
            <Route path="/portal/vehicle-health" element={<CustomerProtectedRoute><PortalVehicleHealth /></CustomerProtectedRoute>} />
            <Route path="/portal/inspections" element={<CustomerProtectedRoute><PortalInspections /></CustomerProtectedRoute>} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/m/:token" element={<MileageUpdate />} />
            <Route path="/tech" element={<TechProtectedRoute><TechDashboard /></TechProtectedRoute>} />
            <Route path="/tech/jobs" element={<TechProtectedRoute><TechJobs /></TechProtectedRoute>} />
            <Route path="/tech/customers" element={<TechProtectedRoute><TechCustomers /></TechProtectedRoute>} />
            <Route path="/tech/history" element={<TechProtectedRoute><TechHistory /></TechProtectedRoute>} />
            <Route path="/tech/time" element={<TechProtectedRoute><TechTime /></TechProtectedRoute>} />
            <Route path="/tech/inspections" element={<TechProtectedRoute><TechInspections /></TechProtectedRoute>} />
            <Route path="/tech/checklists" element={<Navigate to="/tech/inspections?tab=checklists" replace />} />
            <Route path="/tech/checklists/:id" element={<TechProtectedRoute><TechChecklists /></TechProtectedRoute>} />
            <Route path="/portal/checklists" element={<CustomerProtectedRoute><PortalChecklists /></CustomerProtectedRoute>} />
            <Route path="/portal/checklists/:id" element={<CustomerProtectedRoute><PortalChecklists /></CustomerProtectedRoute>} />
            <Route path="/estimate/:token" element={<EstimateApproval />} />
            <Route path="/inspection/:token" element={<InspectionReport />} />
            <Route path="/staff/login" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/share/:token" element={<SharedCustomerSummary />} />
            <Route path="/book" element={<Book />} />
            <Route path="/appointments/:token" element={<AppointmentConfirmation />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/:landingSlug" element={<LocalLanding />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
