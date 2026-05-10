import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";

import FinancingContract from "./pages/FinancingContract";
import WarrantyPolicy from "./pages/WarrantyPolicy";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
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
import Memberships from "./pages/Memberships";
import PortalLogin from "./pages/portal/PortalLogin";
import PortalSignup from "./pages/portal/PortalSignup";
import PortalDashboard from "./pages/portal/PortalDashboard";
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
import TechDashboard from "./pages/tech/TechDashboard";
import TechClock from "./pages/tech/TechClock";
import TechInspections from "./pages/tech/TechInspections";
import TechProtectedRoute from "./components/tech/TechProtectedRoute";
import EstimateApproval from "./pages/EstimateApproval";
import InspectionReport from "./pages/InspectionReport";
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import SharedCustomerSummary from "./pages/SharedCustomerSummary";
import MmarCare from "./pages/MmarCare";
import Fleet from "./pages/Fleet";
import NativeBoot from "./components/NativeBoot";
import PullToRefresh from "./components/PullToRefresh";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NativeBoot />
          <PullToRefresh />
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
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/memberships" element={<Memberships />} />
            <Route path="/mmar-care" element={<MmarCare />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/portal/login" element={<PortalLogin />} />
            <Route path="/portal/signup" element={<PortalSignup />} />
            <Route path="/portal/membership-signup" element={<MembershipSignup />} />
            <Route path="/portal/dashboard" element={<CustomerProtectedRoute><PortalDashboard /></CustomerProtectedRoute>} />
            <Route path="/portal/vehicles" element={<CustomerProtectedRoute><PortalVehicles /></CustomerProtectedRoute>} />
            <Route path="/portal/membership" element={<CustomerProtectedRoute><PortalMembership /></CustomerProtectedRoute>} />
            <Route path="/portal/appointments" element={<CustomerProtectedRoute><PortalAppointments /></CustomerProtectedRoute>} />
            <Route path="/portal/service-history" element={<CustomerProtectedRoute><PortalServiceHistory /></CustomerProtectedRoute>} />
            <Route path="/portal/invoices" element={<CustomerProtectedRoute><PortalInvoices /></CustomerProtectedRoute>} />
            <Route path="/portal/invoices/:id" element={<CustomerProtectedRoute><PortalInvoiceDetail /></CustomerProtectedRoute>} />
            <Route path="/portal/estimates" element={<CustomerProtectedRoute><PortalEstimates /></CustomerProtectedRoute>} />
            <Route path="/portal/repair-orders" element={<CustomerProtectedRoute><PortalRepairOrders /></CustomerProtectedRoute>} />
            <Route path="/portal/financing" element={<CustomerProtectedRoute><PortalFinancing /></CustomerProtectedRoute>} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/tech" element={<TechProtectedRoute><TechDashboard /></TechProtectedRoute>} />
            <Route path="/tech/clock" element={<TechProtectedRoute><TechClock /></TechProtectedRoute>} />
            <Route path="/tech/inspections" element={<TechProtectedRoute><TechInspections /></TechProtectedRoute>} />
            <Route path="/estimate/:token" element={<EstimateApproval />} />
            <Route path="/inspection/:token" element={<InspectionReport />} />
            <Route path="/login" element={<Login />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/share/:token" element={<SharedCustomerSummary />} />
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
