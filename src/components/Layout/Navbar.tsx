import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Heart, LogOut, Menu, Shield, User, Users, Video } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Navbar() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
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

  const NavLinks = () => (
    <>
      {!user && (
        <>
          <Link to="/find-nanny">
            <Button variant="ghost">Find a Nanny</Button>
          </Link>
          <Link to="/register-nanny">
            <Button variant="ghost">Become a Nanny</Button>
          </Link>
          <Link to="/about">
            <Button variant="ghost">About</Button>
          </Link>
        </>
      )}
      
      {user && userRole === 'nanny' && (
        <>
          <Link to="/nanny-dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Link to="/academy">
            <Button variant="ghost" className="gap-2">
              <Video className="h-4 w-4" />
              Academy
            </Button>
          </Link>
        </>
      )}
      
      {user && userRole === 'client' && (
        <>
          <Link to="/client-dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Link to="/find-nanny">
            <Button variant="ghost" className="gap-2">
              <Users className="h-4 w-4" />
              Find Nannies
            </Button>
          </Link>
        </>
      )}
      
      {user && userRole === 'admin' && (
        <>
          <Link to="/admin">
            <Button variant="ghost" className="gap-2">
              <Shield className="h-4 w-4" />
              Admin Panel
            </Button>
          </Link>
          <Link to="/admin/roles">
            <Button variant="ghost" className="gap-2">
              <Users className="h-4 w-4" />
              Assign Roles
            </Button>
          </Link>
          <Link to="/academy">
            <Button variant="ghost" className="gap-2">
              <Video className="h-4 w-4" />
              Academy
            </Button>
          </Link>
        </>
      )}
      
       {/* Common links for authenticated users only */}
       {user && (
         <>
           <Link to="/about">
             <Button variant="ghost">About</Button>
           </Link>
           <Link to="/terms">
             <Button variant="ghost">Terms</Button>
           </Link>
         </>
       )}
    </>
  );

  return (
    <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">
              Nanny Placements SA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <NavLinks />
            
            {!user ? (
              <div className="flex gap-2">
                <Link to="/auth">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button>Get Started</Button>
                </Link>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <User className="h-4 w-4" />
                    {user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-4 mt-8">
                  <NavLinks />
                  
                  {!user ? (
                    <div className="flex flex-col gap-2 mt-4">
                      <Link to="/auth">
                        <Button variant="outline" className="w-full">
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/auth">
                        <Button className="w-full">Get Started</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 mt-4">
                      <Link to={getDashboardRoute()}>
                        <Button variant="outline" className="w-full">
                          Dashboard
                        </Button>
                      </Link>
                      <Link to="/profile">
                        <Button variant="outline" className="w-full">
                          Profile Settings
                        </Button>
                      </Link>
                      <Link to="/about">
                        <Button variant="outline" className="w-full">
                          About
                        </Button>
                      </Link>
                      <Link to="/terms">
                        <Button variant="outline" className="w-full">
                          Terms of Service
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
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
