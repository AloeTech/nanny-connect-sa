import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Layout/Navbar";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import FindNanny from "./pages/FindNanny";
import FindCleaner from "./pages/FindCleaner"; // Import the FindCleaner component
import Academy from "./pages/Academy";
import NannyDashboard from "./pages/NannyDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import AdminPanel from "./pages/AdminPanel";
import AdminRoleAssignment from "./pages/AdminRoleAssignment";
import Profile from "./pages/Profile";
import About from "./pages/About";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/find-nanny" element={<FindNanny />} />
              <Route path="/find-cleaner" element={<FindCleaner />} /> {/* Added FindCleaner route */}
              <Route path="/register-nanny" element={<Auth />} />
              <Route path="/nanny-dashboard" element={<NannyDashboard />} />
              <Route path="/client-dashboard" element={<ClientDashboard />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin/roles" element={<AdminRoleAssignment />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;