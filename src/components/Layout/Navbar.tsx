import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Heart, LogOut, Menu, Shield, User, Users, Video, Sparkles, Briefcase, Megaphone, ClipboardCheck, X, Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const getDashboardRoute = () => {
    switch (userRole) {
      case 'admin':
        return '/admin';
      case 'nanny':
        return '/nanny-dashboard';
      case 'client':
        return '/client-dashboard';
      default:
        return '/';
    }
  };

  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'admin': return 'Admin';
      case 'nanny': return 'Nanny';
      case 'client': return 'Client';
      default: return '';
    }
  };

  // Common links for all users (authenticated or not)
  const CommonLinks = () => (
    <>
      <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
        About
      </Link>
      <Link to="/terms" className="text-sm font-medium hover:text-primary transition-colors">
        Terms
      </Link>
    </>
  );

  // Desktop navigation items - PUBLIC (non-authenticated users)
  const PublicNavLinks = () => (
    <>
      <Link to="/find-nanny" className="text-sm font-medium hover:text-primary transition-colors">
        Find Nanny
      </Link>
      <Link to="/find-cleaner" className="text-sm font-medium hover:text-primary transition-colors">
        Find Cleaner
      </Link>
      <Link to="/find-generalworker" className="text-sm font-medium hover:text-primary transition-colors">
        General Workers
      </Link>
      <Link to="/find-promoter" className="text-sm font-medium hover:text-primary transition-colors">
        Promoters
      </Link>
      <Link to="/find-adminassistant" className="text-sm font-medium hover:text-primary transition-colors">
        Admin Assistants
      </Link>
      <CommonLinks />
    </>
  );

  // Desktop navigation items - NANNY (and other workers)
  const WorkerNavLinks = () => (
    <>
      <Link to="/nanny-dashboard" className="text-sm font-medium hover:text-primary transition-colors">
        Dashboard
      </Link>
      <Link to="/academy" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
        <Video className="h-4 w-4" />
        Academy
      </Link>
      <Link to="/profile" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
        <User className="h-4 w-4" />
        Profile
      </Link>
      <CommonLinks />
    </>
  );

  // Desktop navigation items - CLIENT
  const ClientNavLinks = () => (
    <>
      <Link to="/" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
        <Home className="h-4 w-4" />
        Home
      </Link>
      <Link to="/client-dashboard" className="text-sm font-medium hover:text-primary transition-colors">
        Dashboard
      </Link>
      <Link to="/find-nanny" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
        <Users className="h-4 w-4" />
        Nannies
      </Link>
      <Link to="/find-cleaner" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
        <Sparkles className="h-4 w-4" />
        Cleaners
      </Link>
      <Link to="/find-generalworker" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
        <Briefcase className="h-4 w-4" />
        General Workers
      </Link>
      <Link to="/find-promoter" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
        <Megaphone className="h-4 w-4" />
        Promoters
      </Link>
      <Link to="/find-adminassistant" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
        <ClipboardCheck className="h-4 w-4" />
        Admin Assistants
      </Link>
      <CommonLinks />
    </>
  );

  // Desktop navigation items - ADMIN
  const AdminNavLinks = () => (
    <>
      <Link to="/" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
        <Home className="h-4 w-4" />
        Home
      </Link>
      <Link to="/admin" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
        <Shield className="h-4 w-4" />
        Admin Panel
      </Link>
      <Link to="/admin/roles" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
        <Users className="h-4 w-4" />
        Assign Roles
      </Link>
      <Link to="/academy" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
        <Video className="h-4 w-4" />
        Academy
      </Link>
      <CommonLinks />
    </>
  );

  // Desktop navigation renderer
  const DesktopNavLinks = () => {
    if (!user) {
      return <PublicNavLinks />;
    }

    switch (userRole) {
      case 'nanny':
        return <WorkerNavLinks />;
      case 'client':
        return <ClientNavLinks />;
      case 'admin':
        return <AdminNavLinks />;
      default:
        return <WorkerNavLinks />;
    }
  };

  // Mobile navigation items
  const MobileNavLinks = () => {
    if (!user) {
      return (
        <div className="flex flex-col space-y-3">
          <Link to="/find-nanny" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1">
            Find Nanny
          </Link>
          <Link to="/find-cleaner" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1">
            Find Cleaner
          </Link>
          <Link to="/find-generalworker" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1">
            General Workers
          </Link>
          <Link to="/find-promoter" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1">
            Promoters
          </Link>
          <Link to="/find-adminassistant" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1">
            Admin Assistants
          </Link>
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1">
            About
          </Link>
          <Link to="/terms" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1">
            Terms of Service
          </Link>
        </div>
      );
    }

    switch (userRole) {
      case 'nanny':
        return (
          <div className="flex flex-col space-y-3">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1 flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link to="/nanny-dashboard" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1">
              Dashboard
            </Link>
            <Link to="/academy" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1 flex items-center gap-2">
              <Video className="h-4 w-4" />
              Academy
            </Link>
            <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1 flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1">
              About
            </Link>
            <Link to="/terms" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1">
              Terms of Service
            </Link>
          </div>
        );

      case 'client':
        return (
          <div className="flex flex-col space-y-3">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1 flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link to="/client-dashboard" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1">
              Dashboard
            </Link>
            <Link to="/find-nanny" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Nannies
            </Link>
            <Link to="/find-cleaner" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Cleaners
            </Link>
            <Link to="/find-generalworker" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              General Workers
            </Link>
            <Link to="/find-promoter" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1 flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Promoters
            </Link>
            <Link to="/find-adminassistant" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Admin Assistants
            </Link>
            <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1 flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1">
              About
            </Link>
            <Link to="/terms" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1">
              Terms of Service
            </Link>
          </div>
        );

      case 'admin':
        return (
          <div className="flex flex-col space-y-3">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1 flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
            <Link to="/admin/roles" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assign Roles
            </Link>
            <Link to="/academy" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1 flex items-center gap-2">
              <Video className="h-4 w-4" />
              Academy
            </Link>
            <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1 flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1">
              About
            </Link>
            <Link to="/terms" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:text-primary transition-colors py-1">
              Terms of Service
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left Side - Always goes to Home */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            <span className="text-lg sm:text-xl font-bold text-foreground whitespace-nowrap">
              Nanny Placements SA
            </span>
          </Link>

          {/* Desktop Navigation - Center/Right */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            <DesktopNavLinks />
            
            {!user ? (
              <div className="flex items-center gap-2 ml-4">
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="h-9">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="h-9">
                    Get Started
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4">
                {userRole && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {getRoleDisplayName()}
                  </span>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 h-9">
                      <User className="h-4 w-4" />
                      <span className="max-w-[120px] truncate">{user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/" className="cursor-pointer">
                        <Home className="h-4 w-4 mr-2" />
                        Home
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={getDashboardRoute()} className="cursor-pointer">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/about" className="cursor-pointer">
                        About
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/terms" className="cursor-pointer">
                        Terms of Service
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-10 w-10"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[350px] p-6">
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">Nanny Placements SA</span>
              </Link>
              {userRole && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {getRoleDisplayName()}
                </span>
              )}
            </div>

            {/* Mobile Navigation Links */}
            <div className="flex-1 overflow-y-auto py-6">
              <MobileNavLinks />
            </div>

            {/* Mobile Auth Buttons */}
            <div className="border-t pt-4 space-y-2">
              {!user ? (
                <>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </Button>
                  </Link>
                  <Link to={getDashboardRoute()} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    onClick={handleSignOut}
                    variant="destructive"
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}