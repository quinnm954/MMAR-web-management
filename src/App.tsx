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
import CustomerProtectedRoute from "./components/portal/CustomerProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/financing-contract" element={<FinancingContract />} />
            <Route path="/warranty-policy" element={<WarrantyPolicy />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesIndex />} />
            <Route path="/services/:slug" element={<ServiceCategory />} />
            <Route path="/service-areas" element={<ServiceAreas />} />
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
            <Route path="/portal/login" element={<PortalLogin />} />
            <Route path="/portal/signup" element={<PortalSignup />} />
            <Route path="/portal/membership-signup" element={<MembershipSignup />} />
            <Route
              path="/portal/dashboard"
              element={
                <CustomerProtectedRoute>
                  <PortalDashboard />
                </CustomerProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
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
