import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, GraduationCap, Users, DollarSign, CheckCircle } from 'lucide-react';
import ContactForm from '@/components/ContactForm';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/10">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            About Nanny Placements SA
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Connecting South African families with trusted, nannies through our comprehensive 
            vetting process and foundational training programs.
          </p>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                To empower South African families with access nannies and cleaners providing a seamless 
                platform that streamlines vetting, offers foundational training, and fosters meaningful 
                connections between workers and families.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                To become South Africa's most trusted nanny and cleaner placement platform, ensuring every home
                receives a good match for their family.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What Sets Us Apart */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">What Sets Us Apart</h2>
            <p className="text-lg text-muted-foreground">Our comprehensive approach to nanny matching</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Comprehensive Approach</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We go beyond basic matching to ensure a perfect fit for both families and nannies
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Thorough Vetting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our nannies can upload criminal record checks and prior written references for added reassurance
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Foundational Training</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our online academy provides basic training to all nannies on the plartform
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Perfect Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Advanced filtering technology connects families with compatible nannies, tailored to their unique needs
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Affordability */}
        <Card className="mb-16 border-primary/20 shadow-lg bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-primary flex items-center justify-center gap-3">
              <DollarSign className="w-8 h-8" />
              Affordability
            </CardTitle>
            <CardDescription className="text-lg">Quality service at competitive prices</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-semibold text-foreground mb-4">Most Competitive Rates</h3>
              <p className="text-lg text-muted-foreground mb-6">
                We offer one of the most competitive nanny matching services in South Africa, with a maximum 
                once-off matching fee of R200.00.
              </p>
              <Badge variant="secondary" className="text-lg px-6 py-2 bg-primary text-primary-foreground">
                Maximum Fee: R200.00
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Simple steps to connect families with perfect nannies</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="relative border-primary/20 shadow-lg">
              <CardHeader>
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <CardTitle className="text-xl text-primary">For Nannies: Complete Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upload documents, complete background checks, and finish our training academy
                </p>
              </CardContent>
            </Card>

            <Card className="relative border-primary/20 shadow-lg">
              <CardHeader>
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <CardTitle className="text-xl text-primary">Admin Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our team reviews all documents and approves qualified nannies
                </p>
              </CardContent>
            </Card>

            <Card className="relative border-primary/20 shadow-lg">
              <CardHeader>
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <CardTitle className="text-xl text-primary">For Families: Browse & Connect</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Search verified nannies, view profiles, and connect with suitable candidates
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust Indicators */}
        <Card className="border-primary/20 shadow-lg bg-gradient-to-r from-accent/5 to-primary/5">
          <CardContent className="py-12">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-foreground mb-8">Why Families Trust Us</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center">
                  <CheckCircle className="w-12 h-12 text-primary mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Verified Profiles</h4>
                  <p className="text-muted-foreground text-center">
                    All nannies undergo thorough background checks and document verification
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <CheckCircle className="w-12 h-12 text-primary mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Foundational Training</h4>
                  <p className="text-muted-foreground text-center">
                    Academy-trained nannies with essential childcare and safety skills
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <CheckCircle className="w-12 h-12 text-primary mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Ongoing Support</h4>
                  <p className="text-muted-foreground text-center">
                    Continuous support throughout the matching process and beyond
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <ContactForm />
      </div>
    </div>
  );
}
