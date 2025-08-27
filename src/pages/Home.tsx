import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Heart, Shield, Star, Users, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, userRole } = useAuth();

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
      description: "You get to shortlist yuor own Nannies based on your prreferences. We make it easy fo you"
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
              Every nanny goes through our comprehensive verification to ensure your family's safety
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
                  Criminal background verification, credit checks  and proof of residence for all nannies.
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
                Report concerns to: support@nannyplacement.co.za
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
            Ready to Find Your Perfect Nanny?
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
