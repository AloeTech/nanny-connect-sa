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
              <Route path="/register-nanny" element={<Auth />} />
              {/* Additional routes to be created */}
              <Route path="/nanny-dashboard" element={<div>Nanny Dashboard - To be implemented</div>} />
              <Route path="/client-dashboard" element={<div>Client Dashboard - To be implemented</div>} />
              <Route path="/admin" element={<div>Admin Panel - To be implemented</div>} />
              <Route path="/academy" element={<div>Academy - To be implemented</div>} />
              <Route path="/profile" element={<div>Profile - To be implemented</div>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
