// pages/Home.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Heart, Shield, Star, Users, Video, AlertCircle, Sparkles, Home as HomeIcon, AlertTriangle, Bell, X, Briefcase, Megaphone, ClipboardCheck, ArrowRight } from "lucide-react";
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
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [stats, setStats] = useState({
    nannies: 0,
    cleaners: 0,
    generalWorkers: 0,
    promoters: 0,
    adminAssistants: 0,
    clients: 0
  });

  // Check if logged-in user has incomplete profile
  useEffect(() => {
    if (!user || !userRole || userRole === 'admin') {
      setLoadingProfile(false);
      return;
    }

    const checkProfile = async () => {
      try {
        const missing: string[] = [];
        
        if (userRole === 'nanny') {
          const { data, error } = await supabase
            .from('nannies')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error || !data) {
            setProfileIncomplete(true);
            setMissingFields(['Complete your nanny profile']);
            return;
          }

          // Check each required field
          if (!data.bio) missing.push('Add your Bio');
          if (!data.languages || data.languages.length === 0) missing.push('Add Languages');
          if (!data.experience_duration && data.experience_duration !== 0) missing.push('Add Experience Duration');
          if (!data.hourly_rate) missing.push('Set Hourly Rate');
          if (!data.education_level) missing.push('Add Education Level');
          if (!data.date_of_birth) missing.push('Add Date of Birth');
          if (!data.cv_url) missing.push('Upload CV');
          if (!data.id_document_url) missing.push('Upload ID/Passport');
          if (!data.proof_of_residence_url) missing.push('Upload Proof of Residence');
          if (!data.interview_video_url) missing.push('Upload Introduction Video');
          
          setMissingFields(missing);
          setProfileIncomplete(missing.length > 0);
          
        } else if (userRole === 'client') {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, phone, city')
            .eq('id', user.id)
            .single();

          if (profileError || !profileData) {
            setProfileIncomplete(true);
            setMissingFields(['Complete your profile']);
            return;
          }

          // Check required fields for clients
          if (!profileData.first_name) missing.push('Add First Name');
          if (!profileData.last_name) missing.push('Add Last Name');
          if (!profileData.phone) missing.push('Add Phone Number');
          if (!profileData.city) missing.push('Add City');
          
          // Check client preferences
          const { data: clientData } = await supabase
            .from('clients')
            .select('preferred_employment_type, preferred_experience_type, preferred_accommodation_type')
            .eq('user_id', user.id)
            .single();
            
          if (clientData) {
            if (!clientData.preferred_employment_type) missing.push('Set Employment Preference');
            if (!clientData.preferred_experience_type) missing.push('Set Experience Preference');
            if (!clientData.preferred_accommodation_type) missing.push('Set Accommodation Preference');
          } else {
            missing.push('Complete your preferences');
          }
          
          setMissingFields(missing);
          setProfileIncomplete(missing.length > 0);
        }
      } catch (err) {
        console.error("Profile check failed:", err);
        setProfileIncomplete(true);
        setMissingFields(['Complete your profile']);
      } finally {
        setLoadingProfile(false);
      }
    };

    checkProfile();
  }, [user, userRole]);

  // Fetch stats - Updated with new worker types
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get approved nannies count
        const { count: nanniesCount } = await supabase
          .from('nannies')
          .select('*', { count: 'exact', head: true })
          .eq('profile_approved', true)
          .eq('experience_type', 'nanny');

        // Get approved cleaners count
        const { count: cleanersCount } = await supabase
          .from('nannies')
          .select('*', { count: 'exact', head: true })
          .eq('profile_approved', true)
          .in('experience_type', ['cleaning', 'both']);

        // Get general workers count
        const { count: generalWorkersCount } = await supabase
          .from('nannies')
          .select('*', { count: 'exact', head: true })
          .eq('profile_approved', true)
          .eq('experience_type', 'general_worker');

        // Get promoters count
        const { count: promotersCount } = await supabase
          .from('nannies')
          .select('*', { count: 'exact', head: true })
          .eq('profile_approved', true)
          .eq('experience_type', 'promoter');

        // Get admin assistants count
        const { count: adminAssistantsCount } = await supabase
          .from('nannies')
          .select('*', { count: 'exact', head: true })
          .eq('profile_approved', true)
          .eq('experience_type', 'admin_assistant');

        // Get clients count
        const { count: clientsCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true });

        setStats({
          nannies: nanniesCount || 0,
          cleaners: cleanersCount || 0,
          generalWorkers: generalWorkersCount || 0,
          promoters: promotersCount || 0,
          adminAssistants: adminAssistantsCount || 0,
          clients: clientsCount || 0
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Verified Profiles",
      description: "We verify that each profile is uploaded with the necessary verification documents such as ID's, Criminal Record Check and Proof Of Residence"
    },
    {
      icon: Video,
      title: "Professional Training",
      description: "Foundational training through our Virtual Academy to ensure good quality childcare and cleaning services"
    },
    {
      icon: Users,
      title: "More Control",
      description: "You get to shortlist your own Nannies and Cleaners based on your preferences. We make it easy for you"
    },
    {
      icon: Star,
      title: "Quality Process",
      description: "Only approved profiles who have completed our Virtual Training and submitted verification checks"
    }
  ];

  const cleaningFeatures = [
    {
      title: "Once-off Cleaning",
      description: "R400 - Our team arranges and manages the cleaning service for you",
      fee: "R400",
      color: "bg-blue-50"
    },
    {
      title: "Part-time Cleaning",
      description: "R200 sourcing fee - You arrange directly with the cleaner for regular part-time services",
      fee: "R200",
      color: "bg-green-50"
    },
    {
      title: "Full-time Cleaning",
      description: "R200 sourcing fee - You arrange directly with the cleaner for full-time employment",
      fee: "R200",
      color: "bg-purple-50"
    }
  ];

  const safetyGuidelines = [
    "Always meet in public places for initial interviews",
    "Bring a trusted friend or family member to meetings",
    "Verify all documents and references independently",
    "Ensure minimum wage compliance",
    "Trust your instincts - if something feels wrong, it probably is",
    "Report any suspicious behavior immediately"
  ];

  // Get dashboard link based on role
  const getDashboardLink = () => {
    if (userRole === 'nanny') return '/nanny-dashboard';
    if (userRole === 'client') return '/client-dashboard';
    return '/profile';
  };

  // Get role display name
  const getRoleDisplay = () => {
    if (userRole === 'nanny') return 'nanny/cleaner';
    if (userRole === 'client') return 'client';
    return 'user';
  };

  return (
    <div className="min-h-screen">
      {/* ENHANCED SCROLLING NOTIFICATION BAR FOR INCOMPLETE PROFILES */}
      {user && userRole !== 'admin' && !loadingProfile && profileIncomplete && !dismissed && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white py-4 px-6 shadow-lg animate-slide-down">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <AlertTriangle className="h-8 w-8 animate-bounce" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">
                    ⚠️ Action Required: Complete Your {getRoleDisplay()} Profile!
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {missingFields.slice(0, 3).map((field, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-white/20 text-white border-none text-xs">
                        {field}
                      </Badge>
                    ))}
                    {missingFields.length > 3 && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-none text-xs">
                        +{missingFields.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link to={getDashboardLink()}>
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 font-bold shadow-md transform transition-transform hover:scale-105">
                    Complete Profile Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-white hover:bg-white/20"
                  onClick={() => setDismissed(true)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Progress bar showing completion */}
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Profile Completion</span>
                <span>{Math.max(0, 100 - (missingFields.length * 10))}%</span>
              </div>
              <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(0, 100 - (missingFields.length * 10))}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success banner for complete profiles (optional) */}
      {user && userRole !== 'admin' && !loadingProfile && !profileIncomplete && !dismissed && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 shadow-lg">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 animate-pulse" />
              <p className="font-medium">
                ✓ Your profile is complete! Start browsing for {userRole === 'nanny' ? 'job opportunities' : 'workers'} today.
              </p>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white/20"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero-gradient text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Trusted Nannies & Cleaners in South Africa
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Connect families with verified, trained, and background-checked nannies and professional cleaners across South Africa
          </p>
         
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/find-nanny">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Find a Nanny
                </Button>
              </Link>
              <Link to="/find-cleaner">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Find a Cleaner
                </Button>
              </Link>
              <Link to="/find-generalworker">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Find a General Worker
                </Button>
              </Link>
              <Link to="/find-promoter">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Find a Promoter
                </Button>
              </Link>
              <Link to="/find-adminassistant">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Find an Admin Assistant
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Register an Account
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {userRole === 'client' && (
                <>
                  <Link to="/find-nanny">
                    <Button size="lg" variant="secondary" className="text-lg px-8">
                      Browse Nannies
                    </Button>
                  </Link>
                  <Link to="/find-cleaner">
                    <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                      Find Cleaners
                    </Button>
                  </Link>
                  <Link to="/find-generalworker">
                    <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                      Find General Workers
                    </Button>
                  </Link>
                  <Link to="/find-promoter">
                    <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                      Find Promoters
                    </Button>
                  </Link>
                  <Link to="/find-adminassistant">
                    <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                      Find Admin Assistants
                    </Button>
                  </Link>
                </>
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
              We ensure the highest standards of safety and quality in childcare and cleaning services
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

      {/* Find Worker Section - UPDATED with all worker types */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Need Cleaning Services?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse verified cleaners with flexible service options to suit your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {cleaningFeatures.map((feature, index) => (
              <Card key={index} className={`${feature.color} border-0 shadow-lg`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{feature.title}</span>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {feature.fee}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">{feature.description}</p>
                  <Link to="/find-cleaner">
                    <Button className="w-full">Find Cleaners</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Link to="/find-cleaner">
              <Button size="lg" className="px-8 py-6 text-lg">
                <HomeIcon className="mr-2 h-5 w-5" />
                Browse Cleaners
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* NEW: Other Services Section - General Worker, Promoter, Admin Assistant */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Other Services Available
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse verified workers for general labor, promotions, and administrative support
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* General Worker */}
            <Card className="bg-blue-50 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    General Worker
                  </span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    R50
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Packing, moving, painting, construction, and general labor tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Find workers for once-off jobs and general labor tasks. <strong>R50 once-off sourcing fee</strong> to unlock contact details.
                </p>
                <Link to="/find-generalworker">
                  <Button className="w-full">Find General Workers</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Promoter */}
            <Card className="bg-purple-50 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-purple-600" />
                    Promoter
                  </span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    R80
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Sales, storefront, distribution, flyers, and product activation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Find promoters for your brand, event, or campaign. <strong>R80 once-off sourcing fee</strong> to unlock contact details.
                </p>
                <Link to="/find-promoter">
                  <Button className="w-full">Find Promoters</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Admin Assistant */}
            <Card className="bg-green-50 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-green-600" />
                    Admin Assistant
                  </span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    R150
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Filing, documentation, data entry, and basic administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Find admin assistants for once-off or ongoing support. <strong>R150 once-off sourcing fee</strong> to unlock contact details.
                </p>
                <Link to="/find-adminassistant">
                  <Button className="w-full">Find Admin Assistants</Button>
                </Link>
              </CardContent>
            </Card>
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
                  Criminal background check upload option available, proof of residence mandatory, CV and referalls checked, proof of identity mandatory
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Professional Training</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A basic training virtual program covering childcare, cleaning standards, safety and foundational standards.
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

      {/* Stats Section */}
      {/*<section className="py-12 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Our Community</h2>
            <p className="text-muted-foreground">Join thousands of families and workers on our platform</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center max-w-3xl mx-auto">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-3xl font-bold text-primary">{stats.nannies + stats.cleaners}</p>
              <p className="text-sm text-muted-foreground">Nannies & Cleaners</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-3xl font-bold text-primary">{stats.generalWorkers + stats.promoters + stats.adminAssistants}</p>
              <p className="text-sm text-muted-foreground">General Workers</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-3xl font-bold text-primary">{stats.clients}</p>
              <p className="text-sm text-muted-foreground">Happy Families</p>
            </div>
          </div>
        </div>
      </section>*/}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center gap-6 mb-8">
            <Heart className="h-16 w-16 opacity-80" />
            <Sparkles className="h-16 w-16 opacity-80" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Trusted Help for Your Home?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of families who have found trusted nannies and cleaning services through our platform
          </p>
         
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Get Started Today
                </Button>
              </Link>
              <div className="flex gap-4">
                <Link to="/find-nanny">
                  <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                    Browse Nannies
                  </Button>
                </Link>
                <Link to="/find-generalworker">
                  <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                    Find Workers
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/find-nanny">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Browse Available Workers
                </Button>
              </Link>
              <Link to="/find-generalworker">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Browse General Workers
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}