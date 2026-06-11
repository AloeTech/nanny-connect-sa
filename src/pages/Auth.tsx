import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Shield, AlertTriangle, CheckCircle, Loader2, Baby, Home, UserCheck, Eye, EyeOff, Mail, ArrowLeft, CreditCard, FileText, Upload, X, Languages, Briefcase, GraduationCap, Calendar, MapPin, Phone, Globe, IdCard, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { SOUTH_AFRICAN_CITIES } from '@/data/southAfricanCities';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Language options
const SA_LANGUAGES = [
  'Afrikaans', 'English', 'Zulu', 'Xhosa', 'Sotho', 'Tswana',
  'Pedi', 'Venda', 'Tsonga', 'Swati', 'Ndebele', 'Shona', 'Chewa'
];

// Nationality options
const NATIONALITIES = [
  'South African', 'Zimbabwean', 'Malawian', 'Namibian', 'Botswanan',
  'Lesotho', 'Eswatini (Swaziland)', 'Mozambican', 'Zambian', 'Angolan',
  'Nigerian', 'Ghanaian', 'Kenyan', 'Other African', 'British', 'German',
  'Dutch', 'Portuguese', 'French', 'American', 'Other European', 'Other'
];

// Education levels
const EDUCATION_LEVELS = [
  { value: 'high school no matric', label: 'No Matric' },
  { value: 'matric', label: 'Matric' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'degree', label: 'Degree' }
];

// Experience types
const EXPERIENCE_TYPES = [
  { value: 'nanny', label: 'Nanny only' },
  { value: 'cleaning', label: 'Cleaning only' },
  { value: 'both', label: 'Both nanny & cleaning' }
];

// Employment types
const EMPLOYMENT_TYPES = [
  { value: 'part_time', label: 'Part Time' },
  { value: 'full_time', label: 'Full Time' }
];

// Accommodation preferences
const ACCOMMODATION_TYPES = [
  { value: 'live_in', label: 'Live In' },
  { value: 'live_out', label: 'Live Out' }
];

// Experience duration options - includes 0
const EXPERIENCE_DURATION_OPTIONS = [
  { label: '0 years (No experience)', value: 0 },
  { label: '1-2 years', value: 2 },
  { label: '3-4 years', value: 4 },
  { label: '5-10 years', value: 10 },
  { label: '10+ years', value: 15 },
];

// Calculate age from date of birth
const calculateAge = (dateOfBirth: string): number | null => {
  if (!dateOfBirth) return null;
  try {
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return null;
  }
};

// Post-Registration Document Upload Modal Component - COMPLETE VERSION
function DocumentUploadModal({ userId, userType, onComplete, onSkip }: { 
  userId: string; 
  userType: string;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [uploading, setUploading] = useState({
    cv: false,
    id: false,
    proof: false,
    criminal: false,
    credit: false
  });
  const [uploadedDocs, setUploadedDocs] = useState({
    cv_url: '',
    id_document_url: '',
    proof_of_residence_url: '',
    criminal_check_url: '',
    credit_check_url: ''
  });
  const [currentStep, setCurrentStep] = useState(0);
  
  const documents = [
    { 
      key: 'cv', 
      label: 'CV / Resume', 
      icon: FileText, 
      accept: '.pdf,.doc,.docx', 
      description: 'PDF, DOC, DOCX up to 10MB',
      bucket: 'cv-documents',
      required: true,
      dbField: 'cv_url'
    },
    { 
      key: 'id', 
      label: 'ID / Passport', 
      icon: IdCard, 
      accept: '.pdf,.jpg,.jpeg,.png', 
      description: 'PDF, JPG, PNG up to 10MB',
      bucket: 'id-documents',
      required: true,
      dbField: 'id_document_url'
    },
    { 
      key: 'proof', 
      label: 'Proof of Residence', 
      icon: Home, 
      accept: '.pdf,.jpg,.jpeg,.png', 
      description: 'PDF, JPG, PNG up to 10MB',
      bucket: 'proof-of-residence',
      required: true,
      dbField: 'proof_of_residence_url'
    },
    { 
      key: 'criminal', 
      label: 'Criminal Check', 
      icon: Shield, 
      accept: '.pdf,.jpg,.jpeg,.png', 
      description: 'PDF, JPG, PNG up to 10MB',
      bucket: 'criminal-checks',
      required: false,
      dbField: 'criminal_check_url'
    },
    { 
      key: 'credit', 
      label: 'Credit Check', 
      icon: CreditCard, 
      accept: '.pdf,.jpg,.jpeg,.png', 
      description: 'PDF, JPG, PNG up to 10MB',
      bucket: 'credit-checks',
      required: false,
      dbField: 'credit_check_url'
    }
  ];
  
  const currentDoc = documents[currentStep];
  const CurrentIcon = currentDoc.icon;
  const isUploaded = uploadedDocs[`${currentDoc.key}_url` as keyof typeof uploadedDocs];
  const completedCount = Object.values(uploadedDocs).filter(Boolean).length;
  
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, docKey: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const doc = documents.find(d => d.key === docKey);
    if (!doc) return;
    
    let validTypes: string[] = [];
    
    switch (docKey) {
      case 'cv':
        validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        break;
      case 'id':
      case 'proof':
      case 'criminal':
      case 'credit':
        validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        break;
    }
    
    if (!validTypes.includes(file.type)) {
      toast({ 
        title: "Invalid file type", 
        description: `Please upload a ${docKey === 'cv' ? 'PDF or Word document' : 'PDF or image file'}.`, 
        variant: "destructive" 
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload a file smaller than 10MB.", variant: "destructive" });
      return;
    }
    
    setUploading(prev => ({ ...prev, [docKey]: true }));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${docKey}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from(doc.bucket).upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from(doc.bucket).getPublicUrl(fileName);
      setUploadedDocs(prev => ({ ...prev, [`${docKey}_url`]: publicUrl }));
      
      // Save to database immediately
      const updateData: any = {};
      updateData[doc.dbField] = publicUrl;
      
      // Add status fields for criminal and credit checks
      if (docKey === 'criminal') updateData.criminal_check_status = 'pending';
      if (docKey === 'credit') updateData.credit_check_status = 'pending';
      if (docKey === 'proof') updateData.proof_of_residence_status = 'pending';
      
      await supabase.from('nannies').update(updateData).eq('user_id', userId);
      
      toast({ title: "Success", description: `${doc.label} uploaded successfully!` });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Upload failed", description: "Please try again later.", variant: "destructive" });
    } finally {
      setUploading(prev => ({ ...prev, [docKey]: false }));
      event.target.value = '';
    }
  };
  
  const nextStep = () => {
    if (currentStep < documents.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };
  
  const skipStep = () => {
    if (currentStep < documents.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onSkip();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <CardTitle>Upload Your Documents</CardTitle>
            <span className="text-sm text-muted-foreground">Step {currentStep + 1} of {documents.length}</span>
          </div>
          <Progress value={((currentStep + 1) / documents.length) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Completed: {completedCount}/{documents.length}</span>
          </div>
          <CardDescription className="mt-2">
            {currentDoc.required ? `${currentDoc.label} (Required)` : `${currentDoc.label} (Optional)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
            <CurrentIcon className="h-6 w-6 text-primary" />
            <p className="text-sm text-gray-600">Upload your {currentDoc.label.toLowerCase()} to complete your profile</p>
          </div>
          
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              id={`${currentDoc.key}-upload`}
              accept={currentDoc.accept}
              onChange={(e) => handleUpload(e, currentDoc.key)}
              className="hidden"
              disabled={uploading[currentDoc.key as keyof typeof uploading]}
            />
            <label htmlFor={`${currentDoc.key}-upload`} className="cursor-pointer block">
              {uploading[currentDoc.key as keyof typeof uploading] ? (
                <Loader2 className="h-10 w-10 mx-auto mb-2 text-primary animate-spin" />
              ) : (
                <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground">
                {uploading[currentDoc.key as keyof typeof uploading] ? 'Uploading...' : `Click to upload ${currentDoc.label}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{currentDoc.description}</p>
            </label>
            {isUploaded && (
              <div className="mt-3">
                <Badge className="bg-green-500">✓ Uploaded</Badge>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={skipStep} className="flex-1">
              Skip for Now
            </Button>
            <Button onClick={nextStep} className="flex-1" disabled={currentDoc.required && !isUploaded}>
              {currentStep === documents.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-xs text-amber-800">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              <strong>Important:</strong> Criminal check and credit check documents are optional and can be uploaded later. You can also upload all documents from your profile page after registration.
            </p>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            You can always upload these documents later from your profile page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

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
  const [newLanguage, setNewLanguage] = useState('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [registeredUserType, setRegisteredUserType] = useState<string | null>(null);

  // Terms agreement
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Sign In Form
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Sign Up Form – Conditional based on user type
  const [signUpData, setSignUpData] = useState({
    // Basic Info (Step 1 - EVERYONE)
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    // Contact (Step 2 - EVERYONE)
    email: '',
    phone: '',
    // Location (Step 3 - EVERYONE)
    city: '',
    town: '',
    // Role (Step 4 - EVERYONE)
    userType: '',
    // Professional Details (Step 5 - ONLY NANNIES/CLEANERS)
    bio: '',
    languages: [] as string[],
    experience_type: 'nanny',
    experience_duration: 0,
    education_level: 'matric',
    hourly_rate: 50,
    employment_type: 'full_time',
    accommodation_preference: 'live_out',
    // Password (Step 6 for nannies, Step 5 for clients)
    password: '',
    confirmPassword: '',
    // Bank Details (Step 6 - ONLY NANNIES/CLEANERS)
    bankName: '',
    accountNumber: '',
    accountHolderName: ''
  });

  // Password validation
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

  // Update progress based on signup step and user type
  useEffect(() => {
    const totalSteps = signUpData.userType === 'nanny' ? 6 : 5;
    const progressValue = (signUpStep / totalSteps) * 100;
    setProgress(progressValue);
  }, [signUpStep, signUpData.userType]);

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
          toast({ title: "Email Verification Required", description: "Please verify your email address before signing in.", variant: "default" });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      toast({ title: "Sign In Failed", description: error.message || "Please check your email and password.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !signUpData.languages.includes(newLanguage.trim())) {
      setSignUpData(prev => ({ ...prev, languages: [...prev.languages, newLanguage.trim()] }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    setSignUpData(prev => ({ ...prev, languages: prev.languages.filter(l => l !== language) }));
  };

  const getTotalSteps = () => {
    return signUpData.userType === 'nanny' ? 6 : 5;
  };

  const getStepDescription = (step: number) => {
    if (signUpData.userType === 'nanny') {
      switch (step) {
        case 1: return "Personal Information";
        case 2: return "Contact Details";
        case 3: return "Location";
        case 4: return "Select Your Role";
        case 5: return "Professional Details";
        case 6: return "Password & Bank Details";
        default: return "";
      }
    } else {
      switch (step) {
        case 1: return "Personal Information";
        case 2: return "Contact Details";
        case 3: return "Location";
        case 4: return "Select Your Role";
        case 5: return "Create Password";
        default: return "";
      }
    }
  };

  const validateStep = (step: number) => {
    const isNanny = signUpData.userType === 'nanny';
    
    switch (step) {
      case 1: // Personal Info - EVERYONE
        return signUpData.firstName.trim() && signUpData.lastName.trim() && signUpData.dateOfBirth.trim() && signUpData.nationality.trim();
      case 2: // Contact Details - EVERYONE
        return signUpData.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpData.email) &&
               signUpData.phone.trim() && /^\+27\d{9}$/.test(signUpData.phone.replace(/\s/g, ''));
      case 3: // Location - EVERYONE
        return signUpData.city && signUpData.town.trim();
      case 4: // Role Selection - EVERYONE
        return !!signUpData.userType;
      case 5: // For nannies: Professional Details | For clients: Password
        if (isNanny) {
          return signUpData.bio.trim() && 
                 signUpData.languages.length > 0 && 
                 signUpData.hourly_rate > 0;
        } else {
          return passwordStrength >= 60 && signUpData.password === signUpData.confirmPassword;
        }
      case 6: // For nannies: Password & Bank Details
        if (isNanny) {
          return passwordStrength >= 60 && 
                 signUpData.password === signUpData.confirmPassword &&
                 signUpData.bankName.trim() !== '' &&
                 signUpData.accountNumber.trim() !== '' &&
                 signUpData.accountHolderName.trim() !== '';
        }
        return false;
      default:
        return false;
    }
  };

  const showValidationToast = (step: number) => {
    const isNanny = signUpData.userType === 'nanny';
    
    switch (step) {
      case 1:
        toast({ title: "Missing Information", description: "Please enter your first name, last name, date of birth, and nationality.", variant: "destructive" });
        break;
      case 2:
        toast({ title: "Invalid Contact Details", description: "Please enter a valid email and South African phone number (+27XXXXXXXXX).", variant: "destructive" });
        break;
      case 3:
        toast({ title: "Location Required", description: "Please select your city and enter your town/suburb.", variant: "destructive" });
        break;
      case 4:
        toast({ title: "Role Required", description: "Please select whether you're a family or nanny/cleaner.", variant: "destructive" });
        break;
      case 5:
        if (isNanny) {
          toast({ title: "Professional Details Required", description: "Please complete your bio, languages, and hourly rate.", variant: "destructive" });
        } else {
          toast({ title: "Password Requirements", description: "Please ensure your password is strong and matches confirmation.", variant: "destructive" });
        }
        break;
      case 6:
        toast({ title: "Incomplete Information", description: "Please ensure passwords match and bank details are complete.", variant: "destructive" });
        break;
    }
  };

  const nextStep = () => {
    if (!termsAgreed) {
      toast({ title: "Terms & Privacy Required", description: "You must agree to the Terms of Service and Privacy Policy to continue.", variant: "destructive" });
      return;
    }
    if (validateStep(signUpStep)) {
      setSignUpStep(prev => Math.min(prev + 1, getTotalSteps()));
      toast({ title: `Step ${signUpStep + 1} of ${getTotalSteps()}`, description: getStepDescription(signUpStep + 1) });
    } else {
      showValidationToast(signUpStep);
    }
  };

  const prevStep = () => {
    setSignUpStep(prev => Math.max(prev - 1, 1));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) {
      toast({ title: "Terms & Privacy Required", description: "You must agree to the Terms of Service and Privacy Policy to create an account.", variant: "destructive" });
      return;
    }
    if (!validateStep(getTotalSteps())) {
      toast({ title: "Incomplete Form", description: "Please complete all required fields.", variant: "destructive" });
      return;
    }

    setIsCreatingAccount(true);
    const inputs = document.querySelectorAll('input, select, button');
    inputs.forEach(el => el.setAttribute('disabled', 'true'));

    try {
      const metadata: any = {
        first_name: signUpData.firstName,
        last_name: signUpData.lastName,
        date_of_birth: signUpData.dateOfBirth,
        nationality: signUpData.nationality,
        phone: signUpData.phone,
        city: signUpData.city,
        suburb: signUpData.town,
        user_type: signUpData.userType
      };

      // Only add nanny-specific fields if user is a nanny
      if (signUpData.userType === 'nanny') {
        metadata.bio = signUpData.bio;
        metadata.languages = signUpData.languages;
        metadata.experience_type = signUpData.experience_type;
        metadata.experience_duration = signUpData.experience_duration;
        metadata.education_level = signUpData.education_level;
        metadata.hourly_rate = signUpData.hourly_rate;
        metadata.employment_type = signUpData.employment_type;
        metadata.accommodation_preference = signUpData.accommodation_preference;
        metadata.bank_name = signUpData.bankName.trim();
        metadata.account_number = signUpData.accountNumber.trim();
        metadata.account_holder_name = signUpData.accountHolderName.trim();
      }

      const signUpResult: any = await signUp(signUpData.email, signUpData.password, metadata);
      const { data, error } = signUpResult;

      if (error) {
        if (error.message?.toLowerCase().includes('already registered') || error.message?.includes('409')) {
          toast({ title: "Email Already Registered", description: ( <span>A user with this email already exists. Please <button className="underline font-medium text-primary" onClick={() => (document.querySelector('[value="signin"]') as HTMLElement)?.click()}>sign in</button> or contact support.</span> ), duration: 10000, variant: "destructive" });
        } else {
          toast({ title: "Account Creation Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
        }
      } else {
        setVerificationEmail(signUpData.email);
        
        // Store the user ID and type for document upload modal (only for nannies)
        if (data?.user?.id && signUpData.userType === 'nanny') {
          setRegisteredUserId(data.user.id);
          setRegisteredUserType(signUpData.userType);
          setShowDocumentModal(true);
        }
        
        setShowVerificationView(true);
        toast({ title: "Account Created Successfully!", description: "Please check your email to verify your account.", variant: "default" });
      }
    } catch (error: any) {
      toast({ title: "Account Creation Failed", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      inputs.forEach(el => el.removeAttribute('disabled'));
      setIsCreatingAccount(false);
    }
  };

  const handleDocumentModalComplete = () => {
    setShowDocumentModal(false);
    toast({ 
      title: "Profile Setup Complete!", 
      description: "Your documents have been uploaded. You can add more later from your profile.",
      variant: "default" 
    });
  };

  const handleDocumentModalSkip = () => {
    setShowDocumentModal(false);
    toast({ 
      title: "Documents Can Be Added Later", 
      description: "You can upload your documents anytime from your profile page.",
      variant: "default" 
    });
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
        <Card className="w-full max-w-md relative z-10">
          <CardHeader className="text-center">
            <Button variant="ghost" size="sm" className="absolute left-4 top-4" onClick={() => setShowVerificationView(false)}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center"><Mail className="h-10 w-10 text-blue-600" /></div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription className="text-base">We've sent a verification link to</CardDescription>
            <div className="font-semibold text-lg mt-2">{verificationEmail}</div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg"><CheckCircle className="h-5 w-5 text-blue-600" /><div><p className="font-medium text-blue-800">Check your inbox</p><p className="text-sm text-blue-600">Look for an email from Nanny Placements SA</p></div></div>
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-amber-600" /><div><p className="font-medium text-amber-800">Can't find it?</p><p className="text-sm text-amber-600">Check your spam or junk folder.</p></div></div>
            </div>
            <Button onClick={() => setShowVerificationView(false)} className="w-full">Return to Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSteps = getTotalSteps();
  const isNanny = signUpData.userType === 'nanny';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/20 flex items-center justify-center p-4 relative">
      {/* Document Upload Modal - Shows after registration for nannies only */}
      {showDocumentModal && registeredUserId && registeredUserType === 'nanny' && (
        <DocumentUploadModal
          userId={registeredUserId}
          userType={registeredUserType}
          onComplete={handleDocumentModalComplete}
          onSkip={handleDocumentModalSkip}
        />
      )}

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4"><Heart className="h-8 w-8 text-primary animate-bounce" /><span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Nanny Placements SA</span></div>
          <p className="text-muted-foreground">Connecting families with trusted nannies</p>
        </div>

        <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100">
          <CardContent className="p-4">
            <div className="flex items-start gap-3"><Shield className="h-5 w-5 text-amber-600" /><div><p className="text-sm text-amber-800 font-medium">Safety Reminder</p><p className="text-xs text-amber-700">Always verify documents independently and trust your instincts.</p></div></div>
          </CardContent>
        </Card>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="signin">Sign In</TabsTrigger><TabsTrigger value="signup">Sign Up</TabsTrigger></TabsList>

          {/* Sign In */}
          <TabsContent value="signin">
            <Card>
              <CardHeader><CardTitle>Welcome Back</CardTitle><CardDescription>Sign in to your account</CardDescription></CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="signin-email">Email</Label><Input id="signin-email" type="email" value={signInData.email} onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))} required disabled={loading} /></div>
                  <div className="space-y-2"><Label htmlFor="signin-password">Password</Label><Input id="signin-password" type={showPassword ? "text" : "password"} value={signInData.password} onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))} required disabled={loading} /></div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing In...</> : 'Sign In'}</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sign Up - Conditional Steps */}
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center mb-2"><CardTitle>Join Our Community</CardTitle><span className="text-sm font-medium text-primary">Step {signUpStep} of {totalSteps}</span></div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300" style={{ width: `${progress}%` }}></div></div>
                <CardDescription>{getStepDescription(signUpStep)}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} id="signup-form" className="space-y-4">

                  {/* STEP 1: Personal Information - EVERYONE */}
                  {signUpStep === 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg"><UserCheck className="h-6 w-6 text-primary" /><p className="text-sm text-gray-600">Your personal information helps us verify your identity</p></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>First Name *</Label><Input value={signUpData.firstName} onChange={(e) => setSignUpData(prev => ({ ...prev, firstName: e.target.value }))} required /></div>
                        <div><Label>Last Name *</Label><Input value={signUpData.lastName} onChange={(e) => setSignUpData(prev => ({ ...prev, lastName: e.target.value }))} required /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Date of Birth *</Label><Input type="date" value={signUpData.dateOfBirth} onChange={(e) => setSignUpData(prev => ({ ...prev, dateOfBirth: e.target.value }))} required max={new Date().toISOString().split('T')[0]} /></div>
                        <div><Label>Nationality *</Label><Select value={signUpData.nationality} onValueChange={(value) => setSignUpData(prev => ({ ...prev, nationality: value }))}><SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger><SelectContent>{NATIONALITIES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select></div>
                      </div>
                      {signUpData.dateOfBirth && <p className="text-sm text-muted-foreground">Age: {calculateAge(signUpData.dateOfBirth)} years</p>}
                    </div>
                  )}

                  {/* STEP 2: Contact Details - EVERYONE */}
                  {signUpStep === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg"><Phone className="h-6 w-6 text-primary" /><p className="text-sm text-gray-600">We'll use this to contact you</p></div>
                      <div><Label>Email *</Label><Input type="email" value={signUpData.email} onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))} required /></div>
                      <div><Label>Phone Number *</Label><Input type="tel" placeholder="+27 82 123 4567" value={signUpData.phone} onChange={(e) => setSignUpData(prev => ({ ...prev, phone: e.target.value }))} required /></div>
                    </div>
                  )}

                  {/* STEP 3: Location - EVERYONE */}
                  {signUpStep === 3 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg"><MapPin className="h-6 w-6 text-primary" /><p className="text-sm text-gray-600">Your location helps match you with local opportunities</p></div>
                      <div><Label>City *</Label><Select value={signUpData.city} onValueChange={(value) => setSignUpData(prev => ({ ...prev, city: value }))}><SelectTrigger><SelectValue placeholder="Select your city" /></SelectTrigger><SelectContent>{SOUTH_AFRICAN_CITIES.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label>Town/Suburb *</Label><Input value={signUpData.town} onChange={(e) => setSignUpData(prev => ({ ...prev, town: e.target.value }))} required /></div>
                    </div>
                  )}

                  {/* STEP 4: Select Role - EVERYONE */}
                  {signUpStep === 4 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg"><UserCheck className="h-6 w-6 text-primary" /><p className="text-sm text-gray-600">Tell us how you'll use the platform</p></div>
                      <div><Label>I am a... *</Label><Select value={signUpData.userType} onValueChange={(value) => setSignUpData(prev => ({ ...prev, userType: value }))}><SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger><SelectContent><SelectItem value="client"><div className="flex items-center gap-2"><Home className="h-4 w-4" />Family looking for a nanny</div></SelectItem><SelectItem value="nanny"><div className="flex items-center gap-2"><Baby className="h-4 w-4" />Nanny / Cleaner looking for work</div></SelectItem></SelectContent></Select></div>
                    </div>
                  )}

                  {/* STEP 5: For NANNIES - Professional Details | For CLIENTS - Create Password */}
                  {signUpStep === 5 && (
                    <div className="space-y-4">
                      {isNanny ? (
                        // NANNY: Professional Details
                        <>
                          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg"><Briefcase className="h-6 w-6 text-primary" /><p className="text-sm text-gray-600">Tell us about your experience and skills</p></div>
                          <div><Label>Bio / About Me *</Label><Textarea rows={3} value={signUpData.bio} onChange={(e) => setSignUpData(prev => ({ ...prev, bio: e.target.value }))} placeholder="Tell families about yourself, your experience, and what makes you special..." required /></div>
                          
                          <div><Label>Languages Spoken *</Label><div className="flex gap-2 mb-2"><Input placeholder="Add a language" value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())} /><Button type="button" onClick={addLanguage}>Add</Button></div><div className="flex flex-wrap gap-2">{signUpData.languages.map(lang => (<Badge key={lang} className="flex items-center gap-1">{lang}<X className="h-3 w-3 cursor-pointer" onClick={() => removeLanguage(lang)} /></Badge>))}</div></div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div><Label>Experience Type *</Label><Select value={signUpData.experience_type} onValueChange={(value) => setSignUpData(prev => ({ ...prev, experience_type: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXPERIENCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label>Experience Duration</Label><Select value={EXPERIENCE_DURATION_OPTIONS.find(opt => opt.value === signUpData.experience_duration)?.label || '0 years (No experience)'} onValueChange={(label) => { const selected = EXPERIENCE_DURATION_OPTIONS.find(opt => opt.label === label); setSignUpData(prev => ({ ...prev, experience_duration: selected ? selected.value : 0 })); }}><SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger><SelectContent>{EXPERIENCE_DURATION_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.label}>{opt.label}</SelectItem>)}</SelectContent></Select></div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div><Label>Education Level *</Label><Select value={signUpData.education_level} onValueChange={(value) => setSignUpData(prev => ({ ...prev, education_level: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EDUCATION_LEVELS.map(edu => <SelectItem key={edu.value} value={edu.value}>{edu.label}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label>Hourly Rate (R) *</Label><Input type="number" value={signUpData.hourly_rate} onChange={(e) => setSignUpData(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))} required /></div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div><Label>Employment Type *</Label><Select value={signUpData.employment_type} onValueChange={(value) => setSignUpData(prev => ({ ...prev, employment_type: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EMPLOYMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label>Accommodation Preference *</Label><Select value={signUpData.accommodation_preference} onValueChange={(value) => setSignUpData(prev => ({ ...prev, accommodation_preference: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACCOMMODATION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                          </div>
                        </>
                      ) : (
                        // CLIENT: Create Password
                        <>
                          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg"><Shield className="h-6 w-6 text-primary" /><p className="text-sm text-gray-600">Create a strong password to secure your account</p></div>
                          <div><Label>Password *</Label><Input type={showPassword ? "text" : "password"} value={signUpData.password} onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))} required /><div className="mt-2"><div className="flex justify-between"><span className="text-xs">Strength: {getStrengthText(passwordStrength)}</span><span className="text-xs">{Math.round(passwordStrength)}%</span></div><div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full transition-all ${getStrengthColor(passwordStrength)}`} style={{ width: `${passwordStrength}%` }}></div></div><div className="mt-2 text-xs space-y-1">{Object.entries(passwordValidation).map(([key, isValid]) => (<div key={key} className="flex items-center gap-2">{isValid ? <CheckCircle className="h-3 w-3 text-green-500" /> : <div className="h-3 w-3 rounded-full border border-gray-300" />}<span className={isValid ? 'text-green-600' : 'text-gray-500'}>{key === 'length' && 'At least 8 characters'}{key === 'uppercase' && 'One uppercase letter'}{key === 'lowercase' && 'One lowercase letter'}{key === 'number' && 'One number'}{key === 'special' && 'One special character'}</span></div>))}</div></div></div>
                          <div><Label>Confirm Password *</Label><Input type={showConfirmPassword ? "text" : "password"} value={signUpData.confirmPassword} onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))} required /></div>
                        </>
                      )}
                    </div>
                  )}

                  {/* STEP 6: For NANNIES ONLY - Password & Bank Details */}
                  {signUpStep === 6 && isNanny && (
                    <div className="space-y-4">
                      <div><Label>Password *</Label><Input type={showPassword ? "text" : "password"} value={signUpData.password} onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))} required /><div className="mt-2"><div className="flex justify-between"><span className="text-xs">Strength: {getStrengthText(passwordStrength)}</span><span className="text-xs">{Math.round(passwordStrength)}%</span></div><div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full transition-all ${getStrengthColor(passwordStrength)}`} style={{ width: `${passwordStrength}%` }}></div></div><div className="mt-2 text-xs space-y-1">{Object.entries(passwordValidation).map(([key, isValid]) => (<div key={key} className="flex items-center gap-2">{isValid ? <CheckCircle className="h-3 w-3 text-green-500" /> : <div className="h-3 w-3 rounded-full border border-gray-300" />}<span className={isValid ? 'text-green-600' : 'text-gray-500'}>{key === 'length' && 'At least 8 characters'}{key === 'uppercase' && 'One uppercase letter'}{key === 'lowercase' && 'One lowercase letter'}{key === 'number' && 'One number'}{key === 'special' && 'One special character'}</span></div>))}</div></div></div>

                      <div><Label>Confirm Password *</Label><Input type={showConfirmPassword ? "text" : "password"} value={signUpData.confirmPassword} onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))} required /></div>

                      <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /><h4 className="font-semibold">Bank Details for Payments</h4></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><Label>Bank Name *</Label><Input placeholder="e.g. FNB, Standard Bank" value={signUpData.bankName} onChange={(e) => setSignUpData(prev => ({ ...prev, bankName: e.target.value }))} required /></div>
                          <div><Label>Account Number *</Label><Input placeholder="Account number" value={signUpData.accountNumber} onChange={(e) => setSignUpData(prev => ({ ...prev, accountNumber: e.target.value }))} required /></div>
                        </div>
                        <div><Label>Account Holder Name *</Label><Input placeholder="Full name on account" value={signUpData.accountHolderName} onChange={(e) => setSignUpData(prev => ({ ...prev, accountHolderName: e.target.value }))} required /></div>
                      </div>
                    </div>
                  )}

                  {/* Terms & Navigation */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-start gap-3"><input type="checkbox" id="terms-agreed" checked={termsAgreed} onChange={(e) => setTermsAgreed(e.target.checked)} className="mt-1" /><label htmlFor="terms-agreed" className="text-sm">I agree to the <a href="https://nannyplacementssouthafrica.co.za/terms" target="_blank" className="text-primary hover:underline">Terms of Service</a> and <a href="https://nannyplacementssouthafrica.co.za/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</a></label></div>
                    <div className="flex gap-3">
                      {signUpStep > 1 && <Button type="button" variant="outline" onClick={prevStep} className="flex-1">Back</Button>}
                      {signUpStep < totalSteps ? <Button type="button" onClick={nextStep} className="flex-1" disabled={!termsAgreed || !validateStep(signUpStep)}>Next</Button> : <Button type="submit" className="flex-1" disabled={!termsAgreed || (isNanny ? passwordStrength < 60 || !validateStep(6) : passwordStrength < 60 || !validateStep(5))}>Create Account</Button>}
                    </div>
                  </div>
                </form>
              </CardContent>
              <div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-800"><strong>Important:</strong> All information provided is <strong>final</strong> and cannot be edited later. Please double-check before creating your account.</p>
              </div>
              <div className="mx-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700">📄 <strong>After registration:</strong> Nannies/Cleaners will be prompted to upload their CV, ID/Passport, Proof of Residence, Criminal Check, and Credit Check documents. These can also be uploaded later from your profile.</p>
              </div>
            </Card>
            <div className="flex justify-center gap-2 mt-4">{Array.from({ length: totalSteps }).map((_, step) => (<div key={step} className={`w-2 h-2 rounded-full transition-all ${step + 1 === signUpStep ? 'bg-primary w-4' : step + 1 < signUpStep ? 'bg-primary/50' : 'bg-gray-300'}`} />))}</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}