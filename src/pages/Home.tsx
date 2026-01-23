// pages/Home.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Heart, Shield, Star, Users, Video, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Check if logged-in user has incomplete profile
  useEffect(() => {
    if (!user || !userRole || userRole === 'admin') {
      setLoadingProfile(false);
      return;
    }

    const checkProfile = async () => {
      try {
        let table = userRole === 'nanny' ? 'nannies' : 'clients';
        let requiredFields = userRole === 'nanny'
          ? ['criminal_check_url', 'credit_check_url', 'proof_of_residence_url', 'interview_video_url', 'bio', 'academy_completed']
          : ['first_name', 'last_name', 'phone', 'city'];

        const { data, error } = await supabase
          .from(table)
          .select(requiredFields.join(','))
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          setProfileIncomplete(true);
          return;
        }

        const missing = requiredFields.some(field => {
          const value = data[field];
          return value === null || value === '' || value === false;
        });

        setProfileIncomplete(missing);
      } catch (err) {
        console.error("Profile check failed:", err);
        setProfileIncomplete(true);
      } finally {
        setLoadingProfile(false);
      }
    };

    checkProfile();
  }, [user, userRole]);

  const features = [
    {
      icon: Shield,
      title: "Verified Nanny Profiles",
      description: "We verify that each profile is uploaded with the necessary verification documents such as ID's, Criminal Record Check and Proof Of Residence"
    },
    {
      icon: Video,
      title: "Nanny Academy",
      description: "Foundational training through our Virtual Nanny Academy to ensure good quality childcare"
    },
    {
      icon: Users,
      title: "More Control",
      description: "You get to shortlist your own Nannies based on your preferences. We make it easy for you"
    },
    {
      icon: Star,
      title: "Quality Process",
      description: "Only approved profiles who have completed our Virtual Nanny Training and submitted verification checks"
    }
  ];

  const safetyGuidelines = [
    "Always meet in public places for initial interviews",
    "Bring a trusted friend or family member to meetings",
    "Verify all documents and references independently",
    "Ensure minimum wage compliance (R25/hour minimum)",
    "Trust your instincts - if something feels wrong, it probably is",
    "Report any suspicious behavior immediately"
  ];

  return (
    <div className="min-h-screen">
      {/* NEW: Scrolling Notification Bar for Incomplete Profiles */}
      {user && userRole !== 'admin' && !loadingProfile && profileIncomplete && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 px-6 shadow-lg animate-pulse">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 animate-bounce" />
              <p className="font-bold text-lg">
                Action Required: Complete your profile to get full access to the platform!
              </p>
            </div>
            <Link to={userRole === 'nanny' ? "/nanny-dashboard" : "/client-dashboard"}>
              <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100 font-bold shadow-md">
                Complete Profile Now
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero-gradient text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Trusted Nannies in South Africa
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Connect families with verified, trained, and background-checked nannies across South Africa
          </p>
         
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/find-nanny">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Find a Nanny
                </Button>
              </Link>
              <Link to="/register-nanny">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Become a Nanny
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {userRole === 'client' && (
                <Link to="/find-nanny">
                  <Button size="lg" variant="secondary" className="text-lg px-8">
                    Browse Nannies
                  </Button>
                </Link>
              )}
              {userRole === 'nanny' && (
                <Link to="/nanny-dashboard">
                  <Button size="lg" variant="secondary" className="text-lg px-8">
                    My Dashboard
                  </Button>
                </Link>
              )}
              {userRole === 'admin' && (
                <Link to="/admin">
                  <Button size="lg" variant="secondary" className="text-lg px-8">
                    Admin Panel
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Nanny Placements SA?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We ensure the highest standards of safety and quality in childcare placement
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center card-hover">
                <CardHeader>
                  <feature.icon className="h-12 w-12 mx-auto feature-icon mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Verification Process */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Verification Process
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every nanny and cleaner goes through our comprehensive verification to support your family's safety
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Background Checks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Criminal background verification, credit checks and proof of residence for all nannies.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Nanny Academy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A basic training virtual program covering childcare,safety and foundational standards.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Profile Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Admin review and approval process before profiles go live
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Safety Guidelines */}
      <section className="py-20 bg-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-amber-900">
                🛡️ Safety First Guidelines
              </h2>
              <p className="text-lg text-amber-800">
                Your safety and the safety of your children is our top priority. Please follow these guidelines:
              </p>
            </div>
            <Card className="border-amber-200">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  {safetyGuidelines.map((guideline, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-amber-900">{guideline}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="text-center mt-8">
              <Badge variant="outline" className="text-amber-800 border-amber-300 px-4 py-2">
                Report concerns to: admin@nannyplacementssouthafrica.co.za
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <Heart className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find A Nanny That Matches Your Needs?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of families who have found trusted childcare through our platform
          </p>
         
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Get Started Today
                </Button>
              </Link>
              <Link to="/find-nanny">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Browse Nannies
                </Button>
              </Link>
            </div>
          ) : (
            <Link to="/find-nanny">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Browse Available Nannies
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}