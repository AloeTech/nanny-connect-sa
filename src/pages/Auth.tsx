import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Shield, AlertTriangle, CheckCircle, Loader2, Baby, Home, UserCheck, Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { SOUTH_AFRICAN_CITIES } from '@/data/southAfricanCities';
import { toast } from "@/hooks/use-toast";

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [signUpStep, setSignUpStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerificationView, setShowVerificationView] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  // Sign In Form
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Sign Up Form
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    userType: '',
    phone: '',
    city: '',
    town: ''
  });

  // Password validation messages
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Update progress based on signup step
  useEffect(() => {
    const progressValue = (signUpStep / 4) * 100;
    setProgress(progressValue);
  }, [signUpStep]);

  // Check password strength
  useEffect(() => {
    const strengthChecks = {
      length: signUpData.password.length >= 8,
      uppercase: /[A-Z]/.test(signUpData.password),
      lowercase: /[a-z]/.test(signUpData.password),
      number: /[0-9]/.test(signUpData.password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(signUpData.password)
    };

    setPasswordValidation(strengthChecks);

    const score = Object.values(strengthChecks).filter(Boolean).length;
    setPasswordStrength((score / 5) * 100);
  }, [signUpData.password]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(signInData.email, signInData.password);
      
      if (error) {
        if (error.message?.includes('not verified')) {
          setVerificationEmail(signInData.email);
          setShowVerificationView(true);
          toast({
            title: "Email Verification Required",
            description: "Please verify your email address before signing in.",
            variant: "default",
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign In Failed",
        description: error.message || "Please check your email and password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return signUpData.firstName.trim() && signUpData.lastName.trim();
      case 2:
        return signUpData.email.trim() && 
               /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpData.email) &&
               signUpData.phone.trim() &&
               /^\+27\d{9}$/.test(signUpData.phone.replace(/\s/g, ''));
      case 3:
        return signUpData.city && signUpData.town.trim();
      case 4:
        return signUpData.userType && 
               passwordStrength >= 60 && 
               signUpData.password === signUpData.confirmPassword;
      default:
        return false;
    }
  };

  const showValidationToast = (step: number) => {
    switch (step) {
      case 1:
        toast({
          title: "Missing Information",
          description: "Please enter your first and last name.",
          variant: "destructive",
        });
        break;
      case 2:
        toast({
          title: "Invalid Contact Details",
          description: "Please enter a valid email and South African phone number (+27XXXXXXXXX).",
          variant: "destructive",
        });
        break;
      case 3:
        toast({
          title: "Location Required",
          description: "Please select your city and enter your town/suburb.",
          variant: "destructive",
        });
        break;
      case 4:
        toast({
          title: "Incomplete Information",
          description: "Please select your role and ensure passwords match with strong password.",
          variant: "destructive",
        });
        break;
    }
  };

  const nextStep = () => {
    if (validateStep(signUpStep)) {
      setSignUpStep(prev => Math.min(prev + 1, 4));
      toast({
        title: `Step ${signUpStep + 1} of 4`,
        description: getStepDescription(signUpStep + 1),
      });
    } else {
      showValidationToast(signUpStep);
    }
  };

  const prevStep = () => {
    setSignUpStep(prev => Math.max(prev - 1, 1));
  };

  const getStepDescription = (step: number) => {
    switch (step) {
      case 1: return "Basic Information";
      case 2: return "Contact Details";
      case 3: return "Location";
      case 4: return "Role & Security";
      default: return "";
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(4)) {
      toast({
        title: "Incomplete Form",
        description: "Please complete all steps before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingAccount(true);
    
    // Disable all inputs
    const inputs = document.querySelectorAll('input, select, button');
    inputs.forEach(el => {
      el.setAttribute('disabled', 'true');
    });

    try {
      const { error } = await signUp(
        signUpData.email,
        signUpData.password,
        {
          first_name: signUpData.firstName,
          last_name: signUpData.lastName,
          phone: signUpData.phone,
          city: signUpData.city,
          suburb: signUpData.town,
          user_type: signUpData.userType
        }
      );

      if (error) {
        if (error.message?.includes('already registered')) {
          toast({
            title: "Email Already Registered",
            description: "This email is already associated with an account. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        // Show verification view after successful signup
        setVerificationEmail(signUpData.email);
        setShowVerificationView(true);
        toast({
          title: "Account Created Successfully!",
          description: "Please check your email to verify your account.",
          variant: "default",
        });
      }

    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "Account Creation Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      // Re-enable inputs
      inputs.forEach(el => {
        el.removeAttribute('disabled');
      });
      setIsCreatingAccount(false);
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 20) return 'bg-red-500';
    if (strength < 40) return 'bg-orange-500';
    if (strength < 60) return 'bg-yellow-500';
    if (strength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength < 20) return 'Very Weak';
    if (strength < 40) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  };

  // Email Verification View
  if (showVerificationView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/20 flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-primary/5 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-secondary/5 animate-pulse delay-1000"></div>
        </div>

        <Card className="w-full max-w-md relative z-10">
          <CardHeader className="text-center">
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-4"
              onClick={() => setShowVerificationView(false)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="h-10 w-10 text-blue-600" />
            </div>
            
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription className="text-base">
              We've sent a verification link to
            </CardDescription>
            <div className="font-semibold text-lg mt-2">{verificationEmail}</div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800">Check your inbox</p>
                  <p className="text-sm text-blue-600">
                    Look for an email from Nanny Placements SA with the subject "Verify your email address"
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">Can't find it?</p>
                  <p className="text-sm text-amber-600">
                    Check your spam or junk folder. Some email providers may filter our messages.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">Next Steps</p>
                  <p className="text-sm text-green-600">
                    Once verified, return to the sign in page and log in with your email and password.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <Button
                  onClick={() => setShowVerificationView(false)}
                  className="w-full"
                >
                  Return to Sign In
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                If you're still having trouble, contact us at{' '}
                <a href="mailto:support@nannyplacements.co.za" className="text-primary hover:underline">
                  admin@nannyplacementssouthafrica.co.za
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/20 flex items-center justify-center p-4 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-primary/5 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-secondary/5 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-amber-100/10 animate-pulse delay-500"></div>
      </div>

      {/* Account Creation Overlay */}
      {isCreatingAccount && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="relative">
            {/* Animated loader with theme */}
            <div className="w-32 h-32 mb-8 relative">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart className="h-12 w-12 text-primary animate-pulse" />
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="w-64 h-2 bg-gray-200 rounded-full mb-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progress + 25, 100)}%` }}
              ></div>
            </div>
            
            {/* Animated steps */}
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-gray-800 mb-2">
                Creating Your Account...
              </p>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 animate-fade-in">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Validating information</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 animate-fade-in delay-300">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Securing your data</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 animate-fade-in delay-600">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  <span>Setting up your {signUpData.userType === 'client' ? 'family' : 'nanny'} profile</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-6 text-center max-w-md">
              Please wait while we set up your account. This should only take a moment...
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-md relative z-10">
        {/* Header with animation */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-primary animate-bounce" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Nanny Placements SA
            </span>
          </div>
          <p className="text-muted-foreground">Connecting families with trusted nannies</p>
        </div>

        {/* Safety Notice */}
        <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 shadow-sm animate-fade-in-up">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0 animate-pulse" />
              <div>
                <p className="text-sm text-amber-800 font-medium mb-1">Safety Reminder</p>
                <p className="text-xs text-amber-700">
                  Always meet in public places, verify documents independently, and trust your instincts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="signin" className="w-full animate-fade-in-up">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Sign In */}
          <TabsContent value="signin">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to your account to continue</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        value={signInData.password}
                        onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        disabled={loading}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="remember-me"
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="remember-me" className="text-sm text-gray-600">
                        Remember me
                      </label>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sign Up - Multi-step form */}
          <TabsContent value="signup">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-center mb-2">
                  <CardTitle>Join Our Community</CardTitle>
                  <span className="text-sm font-medium text-primary">
                    Step {signUpStep} of 4
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <CardDescription>
                  {signUpStep === 1 && "Let's start with your basic information"}
                  {signUpStep === 2 && "Add your contact details"}
                  {signUpStep === 3 && "Tell us where you're located"}
                  {signUpStep === 4 && "Choose your role and set password"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSignUp} id="signup-form">
                  {/* Step 1: Basic Info */}
                  {signUpStep === 1 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 rounded-lg">
                        <UserCheck className="h-6 w-6 text-primary" />
                        <p className="text-sm text-gray-600">
                          Your name helps personalize your experience
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first-name">
                            First Name <span className="text-red-600">*</span>
                          </Label>
                          <Input
                            id="first-name"
                            value={signUpData.firstName}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, firstName: e.target.value }))}
                            required
                            disabled={isCreatingAccount}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last-name">
                            Last Name <span className="text-red-600">*</span>
                          </Label>
                          <Input
                            id="last-name"
                            value={signUpData.lastName}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, lastName: e.target.value }))}
                            required
                            disabled={isCreatingAccount}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Contact Info */}
                  {signUpStep === 2 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 rounded-lg">
                        <Home className="h-6 w-6 text-primary" />
                        <p className="text-sm text-gray-600">
                          We'll use this to connect you with local opportunities
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">
                          Email <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                          required
                          disabled={isCreatingAccount}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          You'll need to verify this email address
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          Phone Number <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+27 82 123 4567"
                          value={signUpData.phone}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, phone: e.target.value }))}
                          required
                          disabled={isCreatingAccount}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Format: +27821234567 (South African number required)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Location */}
                  {signUpStep === 3 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 rounded-lg">
                        <Home className="h-6 w-6 text-primary" />
                        <p className="text-sm text-gray-600">
                          This helps match you with {signUpData.userType === 'client' ? 'nannies' : 'families'} in your area
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">
                          City <span className="text-red-600">*</span>
                        </Label>
                        <Select
                          value={signUpData.city}
                          onValueChange={(value) => setSignUpData(prev => ({ ...prev, city: value }))}
                          required
                          disabled={isCreatingAccount}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your city" />
                          </SelectTrigger>
                          <SelectContent>
                            {SOUTH_AFRICAN_CITIES.map((city) => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="town">
                          Town/Suburb <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          id="town"
                          placeholder="Enter your town or suburb"
                          value={signUpData.town}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, town: e.target.value }))}
                          required
                          disabled={isCreatingAccount}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 4: Role & Password */}
                  {signUpStep === 4 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="space-y-2">
                        <Label htmlFor="user-type">
                          I am a... <span className="text-red-600">*</span>
                        </Label>
                        <Select
                          value={signUpData.userType}
                          onValueChange={(value) => setSignUpData(prev => ({ ...prev, userType: value }))}
                          required
                          disabled={isCreatingAccount}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">
                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                <span>Family looking for a nanny</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="nanny">
                              <div className="flex items-center gap-2">
                                <Baby className="h-4 w-4" />
                                <span>Nanny looking for work</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">
                          Password <span className="text-red-600">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            value={signUpData.password}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                            required
                            disabled={isCreatingAccount}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isCreatingAccount}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                        
                        {/* Password strength indicator */}
                        <div className="mt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium">Password strength: {getStrengthText(passwordStrength)}</span>
                            <span className="text-xs">{Math.round(passwordStrength)}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                              style={{ width: `${passwordStrength}%` }}
                            ></div>
                          </div>
                          
                          {/* Password requirements */}
                          <div className="mt-3 space-y-1">
                            {Object.entries(passwordValidation).map(([key, isValid]) => (
                              <div key={key} className="flex items-center gap-2 text-xs">
                                {isValid ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <div className="h-3 w-3 rounded-full border border-gray-300" />
                                )}
                                <span className={isValid ? 'text-green-600' : 'text-gray-500'}>
                                  {key === 'length' && 'At least 8 characters'}
                                  {key === 'uppercase' && 'One uppercase letter (A-Z)'}
                                  {key === 'lowercase' && 'One lowercase letter (a-z)'}
                                  {key === 'number' && 'One number (0-9)'}
                                  {key === 'special' && 'One special character (!@#$%^&*)'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">
                          Confirm Password <span className="text-red-600">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={signUpData.confirmPassword}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                            disabled={isCreatingAccount}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isCreatingAccount}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                        {signUpData.password && signUpData.confirmPassword && (
                          <p className={`text-xs mt-1 ${signUpData.password === signUpData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                            {signUpData.password === signUpData.confirmPassword 
                              ? '✓ Passwords match' 
                              : '✗ Passwords do not match'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-3 mt-6">
                    {signUpStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        className="flex-1"
                        disabled={isCreatingAccount}
                      >
                        Back
                      </Button>
                    )}
                    
                    {signUpStep < 4 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className={signUpStep === 1 ? "flex-1" : "flex-1"}
                        disabled={isCreatingAccount}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        disabled={isCreatingAccount || passwordStrength < 60}
                      >
                        {isCreatingAccount ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>

              {/* Permanent Warning Banner */}
              <div className="mt-4 mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Important:</strong> The phone number, city, and town/suburb you enter are
                  <strong> final</strong> and cannot be edited later. Please double-check before creating your account.
                </p>
              </div>
            </Card>

            {/* Step indicator dots */}
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-all ${
                    step === signUpStep 
                      ? 'bg-primary w-4' 
                      : step < signUpStep 
                        ? 'bg-primary/50' 
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Additional Information */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          By signing up, you agree to our{' '}
          <a 
            href="https://nannyplacementssouthafrica.co.za/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a 
            href="https://nannyplacementssouthafrica.co.za/about"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </a>
        </p>
      </div>
      </div>
    </div>
  );
}