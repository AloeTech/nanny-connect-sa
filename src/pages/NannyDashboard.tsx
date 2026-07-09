import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, Clock, Upload, Video, User, MapPin, Languages, 
  GraduationCap, Award, Heart, FileText, Eye, Calendar, DollarSign, Briefcase, Home,
  AlertTriangle, Globe, IdCard, Users, Phone, Brush, ClipboardCheck, Mic, BriefcaseBusiness
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface NannyProfile {
  id: string;
  bio: string | null;
  languages: string[] | null;
  experience_type: 'nanny' | 'cleaning' | 'both' | 'general_worker' | 'promoter' | 'admin_assistant';
  experience_duration: number | null;
  education_level: 'high school no matric' | 'matric' | 'certificate' | 'diploma' | 'degree' | null;
  hourly_rate: number | null;
  training_first_aid: boolean | null;
  training_nanny: boolean | null;
  training_cpr: boolean | null;
  training_child_development: boolean | null;
  criminal_check_status: 'pending' | 'approved' | 'rejected' | null;
  credit_check_status: 'pending' | 'approved' | 'rejected' | null;
  proof_of_residence_status: 'pending' | 'approved' | 'rejected' | null;
  academy_completed: boolean | null;
  profile_approved: boolean | null;
  criminal_check_url: string | null;
  credit_check_url: string | null;
  interview_video_url: string | null;
  date_of_birth: string | null;
  accommodation_preference: string | null;
  proof_of_residence_url: string | null;
  cv_url: string | null;
  employment_type: string | null;
  average_rating: number | null;
  nationality: string | null;
  id_document_url: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  suburb: string | null;
  town: string | null;
  profile_picture_url: string | null;
}

interface AcademyProgress {
  total_videos: number;
  completed_videos: number;
  progress_percentage: number;
}

interface Interest {
  id: string;
  client_id: string;
  nanny_id: string;
  message: string | null;
  status: string | null;
  created_at: string;
  admin_approved: boolean | null;
  nanny_response: string | null;
  payment_status: string | null;
  client_first_name: string | null;
  client_last_name: string | null;
  client_email: string | null;
  nanny_first_name: string | null;
  nanny_last_name: string | null;
  nanny_email: string | null;
}

const experienceDurationOptions = [
  { label: '0 years', value: 0 },
  { label: '1-2 years', value: 2 },
  { label: '3-4 years', value: 4 },
  { label: '5-10 years', value: 10 },
  { label: '10+ years', value: 15 },
];

const getExperienceLabel = (duration: number | null): string => {
  if (duration === null) return 'Not specified';
  const option = experienceDurationOptions.find(opt => opt.value >= duration) || experienceDurationOptions[experienceDurationOptions.length - 1];
  return option.label;
};

const calculateAge = (dateOfBirth: string | null): number | null => {
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

// Helper function to get experience type display name
const getExperienceTypeDisplay = (type: string): string => {
  switch (type) {
    case 'nanny': return 'Nanny';
    case 'cleaning': return 'Cleaner';
    case 'both': return 'Nanny & Cleaner';
    case 'general_worker': return 'General Worker';
    case 'promoter': return 'Promoter';
    case 'admin_assistant': return 'Admin Assistant';
    default: return 'Worker';
  }
};

// Helper function to get experience type icon
const getExperienceTypeIcon = (type: string) => {
  switch (type) {
    case 'nanny':
      return <User className="h-6 w-6" />;
    case 'cleaning':
      return <Brush className="h-6 w-6" />;
    case 'general_worker':
      return <BriefcaseBusiness className="h-6 w-6" />;
    case 'promoter':
      return <Mic className="h-6 w-6" />;
    case 'admin_assistant':
      return <ClipboardCheck className="h-6 w-6" />;
    case 'both':
      return <Users className="h-6 w-6" />;
    default:
      return <User className="h-6 w-6" />;
  }
};

// Helper function to get dashboard title based on experience type
const getDashboardTitle = (type: string): string => {
  const display = getExperienceTypeDisplay(type);
  return `${display} Dashboard`;
};

// Helper function to get welcome message based on experience type
const getWelcomeMessage = (type: string): string => {
  const display = getExperienceTypeDisplay(type);
  switch (type) {
    case 'nanny':
      return 'Manage your nanny profile and connect with families.';
    case 'cleaning':
      return 'Manage your cleaner profile and connect with clients.';
    case 'general_worker':
      return 'Manage your profile and connect with employers.';
    case 'promoter':
      return 'Manage your promoter profile and connect with businesses.';
    case 'admin_assistant':
      return 'Manage your admin assistant profile and connect with employers.';
    case 'both':
      return 'Manage your dual profile and connect with clients.';
    default:
      return 'Manage your profile and connect with clients.';
  }
};

// Helper function to get profile completion description based on experience type
const getProfileCompletionDescription = (type: string): string => {
  const display = getExperienceTypeDisplay(type);
  return `Complete your ${display.toLowerCase()} profile to start receiving client interests`;
};

// Helper function to get missing requirements
const getMissingRequirements = (nannyProfile: NannyProfile | null, userProfile: UserProfile | null): string[] => {
  const missing: string[] = [];
  
  if (!nannyProfile?.date_of_birth) missing.push('Date of Birth');
  if (!nannyProfile?.nationality) missing.push('Nationality');
  if (!userProfile?.profile_picture_url) missing.push('Profile Picture');
  if (!nannyProfile?.bio) missing.push('Bio / About Me');
  if (!nannyProfile?.languages || nannyProfile.languages.length === 0) missing.push('Languages Spoken');
  if (!nannyProfile?.experience_duration && nannyProfile?.experience_duration !== 0) missing.push('Experience Duration');
  if (!nannyProfile?.hourly_rate) missing.push('Hourly Rate');
  if (!nannyProfile?.education_level) missing.push('Education Level');
  if (!nannyProfile?.criminal_check_url) missing.push('Criminal Check Document');
  if (!nannyProfile?.credit_check_url) missing.push('Credit Check Document');
  if (!nannyProfile?.proof_of_residence_url) missing.push('Proof of Residence');
  if (!nannyProfile?.cv_url) missing.push('CV / Resume');
  if (!nannyProfile?.id_document_url) missing.push('ID / Passport Document');
  if (!nannyProfile?.interview_video_url) missing.push('Introduction Video');
  if (!nannyProfile?.emergency_contact_name) missing.push('Emergency Contact Name');
  if (!nannyProfile?.emergency_contact_relationship) missing.push('Emergency Contact Relationship');
  if (!nannyProfile?.emergency_contact_phone) missing.push('Emergency Contact Phone');
  if (!nannyProfile?.academy_completed) missing.push('Academy Training Completion');
  
  return missing;
};

// Function to send nanny interest response email via dedicated PHP endpoint
const sendNannyInterestResponseEmail = async (emailData: any): Promise<{success: boolean, message?: string}> => {
  try {
    const response = await fetch('https://nannyplacementssouthafrica.co.za/send-nanny-interest-response.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Nanny interest response API error:', data);
      return { success: false, message: data.error };
    }

    console.log('Nanny interest response email sent successfully:', data);
    return { success: true, message: 'Interest response email sent successfully' };
  } catch (error) {
    console.error('Nanny interest response email sending error:', error);
    return { success: false, message: 'Failed to send interest response email' };
  }
};

export default function NannyDashboard() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [nannyProfile, setNannyProfile] = useState<NannyProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [academyProgress, setAcademyProgress] = useState<AcademyProgress>({ total_videos: 0, completed_videos: 0, progress_percentage: 0 });
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({ cv: false, criminal: false, credit: false, proof: false, video: false, picture: false, id: false });

  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);

  // Get experience type from profile
  const experienceType = nannyProfile?.experience_type || 'nanny';
  const dashboardTitle = getDashboardTitle(experienceType);
  const welcomeMessage = getWelcomeMessage(experienceType);
  const profileCompletionDesc = getProfileCompletionDescription(experienceType);
  const ExperienceIcon = getExperienceTypeIcon(experienceType);

  useEffect(() => {
    if (user && userRole === 'nanny') {
      fetchData();
    }
  }, [user, userRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: nannyData, error: nannyError } = await supabase
        .from('nannies')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (nannyError) throw nannyError;

      const safeNannyData: NannyProfile = {
        ...nannyData,
        experience_type: nannyData.experience_type as 'nanny' | 'cleaning' | 'both' | 'general_worker' | 'promoter' | 'admin_assistant' || 'nanny',
        education_level: nannyData.education_level as 'high school no matric' | 'matric' | 'certificate' | 'diploma' | 'degree' || 'matric',
        criminal_check_status: nannyData.criminal_check_status as 'pending' | 'approved' | 'rejected' || 'pending',
        credit_check_status: nannyData.credit_check_status as 'pending' | 'approved' | 'rejected' || 'pending',
        proof_of_residence_status: ('proof_of_residence_status' in nannyData ? (nannyData as any).proof_of_residence_status as 'pending' | 'approved' | 'rejected' : 'pending'),
        cv_url: nannyData.cv_url || null,
        nationality: nannyData.nationality || null,
        id_document_url: nannyData.id_document_url || null,
        emergency_contact_name: nannyData.emergency_contact_name || null,
        emergency_contact_relationship: nannyData.emergency_contact_relationship || null,
        emergency_contact_phone: nannyData.emergency_contact_phone || null,
      };
      setNannyProfile(safeNannyData);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profileData);

      const { data: totalVideos } = await supabase
        .from('academy_videos')
        .select('id')
        .eq('is_active', true);

      const { data: completedVideos } = await supabase
        .from('nanny_academy_progress')
        .select('video_id')
        .eq('nanny_id', nannyData?.id);

      const total = totalVideos?.length || 0;
      const completed = completedVideos?.length || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      setAcademyProgress({
        total_videos: total,
        completed_videos: completed,
        progress_percentage: percentage,
      });

      if (nannyData?.id) {
        const { data: interestsData, error: interestsError } = await supabase
          .from('interests')
          .select(`
            id,
            client_id,
            nanny_id,
            message,
            status,
            created_at,
            admin_approved,
            nanny_response,
            payment_status,
            client_first_name,
            client_last_name,
            client_email,
            nanny_first_name,
            nanny_last_name,
            nanny_email
          `)
          .eq('nanny_id', nannyData.id)
          .order('created_at', { ascending: false });

        if (interestsError) {
          toast({
            title: 'Error',
            description: 'Failed to load interest requests',
            variant: 'destructive',
          });
        } else {
          setInterests(interestsData as Interest[] || []);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'criminal_check' | 'credit_check' | 'interview_video' | 'profile_picture' | 'intro_video' | 'proof_of_residence' | 'cv' | 'id_document') => {
    if (type === 'cv') {
      const validCvTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validCvTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Word document (.pdf, .doc, .docx).",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a CV smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (type === 'id_document') {
      const validIdTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validIdTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, JPEG, or PNG file for your ID/Passport.",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
    }

    const uploadingKey = type === 'cv' ? 'cv' :
                        type === 'criminal_check' ? 'criminal' :
                        type === 'credit_check' ? 'credit' :
                        type === 'proof_of_residence' ? 'proof' :
                        type === 'profile_picture' ? 'picture' :
                        type === 'id_document' ? 'id' : 'video';
    
    setUploading(prev => ({ ...prev, [uploadingKey]: true }));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${type}-${Date.now()}.${fileExt}`;

      let bucketName = '';
      switch (type) {
        case 'criminal_check':
          bucketName = 'criminal-checks';
          break;
        case 'credit_check':
          bucketName = 'credit-checks';
          break;
        case 'profile_picture':
          bucketName = 'profile-pictures';
          break;
        case 'proof_of_residence':
          bucketName = 'proof-of-residence';
          break;
        case 'cv':
          bucketName = 'cv-documents';
          break;
        case 'id_document':
          bucketName = 'id-documents';
          break;
        default:
          bucketName = 'interview-videos';
      }

      const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      const fileUrl = urlData.publicUrl;

      if (type === 'profile_picture') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ profile_picture_url: fileUrl })
          .eq('id', user?.id);
        if (updateError) throw updateError;
        if (userProfile) {
          setUserProfile({ ...userProfile, profile_picture_url: fileUrl });
        }
      } else {
        const updateData: Partial<NannyProfile> = {};
        if (type === 'criminal_check') {
          updateData.criminal_check_url = fileUrl;
          updateData.criminal_check_status = 'pending';
        } else if (type === 'credit_check') {
          updateData.credit_check_url = fileUrl;
          updateData.credit_check_status = 'pending';
        } else if (type === 'interview_video' || type === 'intro_video') {
          updateData.interview_video_url = fileUrl;
        } else if (type === 'proof_of_residence') {
          updateData.proof_of_residence_url = fileUrl;
          updateData.proof_of_residence_status = 'pending';
        } else if (type === 'cv') {
          updateData.cv_url = fileUrl;
        } else if (type === 'id_document') {
          updateData.id_document_url = fileUrl;
        }

        const { error: updateError } = await supabase
          .from('nannies')
          .update(updateData)
          .eq('user_id', user?.id);
        if (updateError) throw updateError;
        if (nannyProfile) {
          setNannyProfile({ ...nannyProfile, ...updateData });
        }
      }

      toast({
        title: 'Success',
        description: `${type.replace('_', ' ')} uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(prev => ({ ...prev, [uploadingKey]: false }));
    }
  };

  const handleInterestResponse = async (interestId: string, response: 'approved' | 'declined') => {
    const interest = interests.find(i => i.id === interestId);
    if (!interest || !userProfile) return;

    try {
      const { data, error: updateError } = await supabase
        .from('interests')
        .update({
          status: response === 'approved' ? 'approved' : 'declined',
          nanny_response: `${userProfile.first_name} has ${response} your request on ${new Date().toLocaleDateString()}.`,
        })
        .eq('id', interestId)
        .select();

      if (updateError || !data || data.length === 0) {
        toast({
          title: 'Error',
          description: 'Failed to update interest response',
          variant: 'destructive',
        });
        return;
      }

      setInterests(interests.map(i => i.id === interestId ? data[0] as Interest : i));

      const emailData = {
        to: interest.client_email || '',
        subject: `Interest Request ${response === 'approved' ? 'Approved' : 'Declined'} - Nanny Placements SA`,
        client_name: `${interest.client_first_name} ${interest.client_last_name || ''}`,
        nanny_name: `${userProfile.first_name} ${userProfile.last_name || ''}`,
        response: response,
        nanny_response_message: `${userProfile.first_name} has ${response} your request on ${new Date().toLocaleDateString()}.`,
        date: new Date().toISOString().split('T')[0]
      };

      const emailResult = await sendNannyInterestResponseEmail(emailData);

      toast({
        title: 'Success',
        description: `Request ${response}d${emailResult.success ? ' and email sent to client' : ''}`,
      });
    } catch (error: any) {
      console.error('Error handling interest response:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process response',
        variant: 'destructive',
      });
    }
  };

  const openVideoDialog = () => setIsVideoDialogOpen(true);
  const closeVideoDialog = () => {
    setIsVideoDialogOpen(false);
    setPendingVideoFile(null);
  };

  const confirmVideoUpload = () => {
    if (pendingVideoFile) {
      handleFileUpload(pendingVideoFile, 'interview_video');
      closeVideoDialog();
    }
  };

  if (userRole !== 'nanny') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">This page is only accessible to workers.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const getStatusBadge = (status: string, completed: boolean = false) => {
    if (completed) return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Complete</Badge>;
    if (status === 'approved') return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    if (status === 'pending') return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    if (status === 'declined') return <Badge variant="destructive">Declined</Badge>;
    return <Badge variant="outline">Not Uploaded</Badge>;
  };

  const age = calculateAge(nannyProfile?.date_of_birth || null);
  const missingRequirements = getMissingRequirements(nannyProfile, userProfile);
  const isProfileComplete = missingRequirements.length === 0 && nannyProfile?.profile_approved === true;
  const experienceDisplay = getExperienceTypeDisplay(experienceType);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          {ExperienceIcon}
          <h1 className="text-3xl font-bold">{dashboardTitle}</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Welcome back, {userProfile?.first_name} {userProfile?.last_name}! {welcomeMessage}
        </p>
        <Badge className="mt-2 bg-primary/10 text-primary border-primary/20">
          {experienceDisplay}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile Status</CardTitle>
              <CardDescription>{profileCompletionDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span>Criminal Check</span>
                  {nannyProfile?.criminal_check_url ? 
                    getStatusBadge(nannyProfile?.criminal_check_status || 'pending') : 
                    <Badge variant="outline">Not Uploaded</Badge>
                  }
                </div>
                <div className="flex items-center justify-between">
                  <span>Credit Check</span>
                  {nannyProfile?.credit_check_url ? 
                    getStatusBadge(nannyProfile?.credit_check_status || 'pending') : 
                    <Badge variant="outline">Not Uploaded</Badge>
                  }
                </div>
                <div className="flex items-center justify-between">
                  <span>Proof of Residence</span>
                  {nannyProfile?.proof_of_residence_url ? 
                    getStatusBadge(nannyProfile?.proof_of_residence_status || 'pending') : 
                    <Badge variant="outline">Not Uploaded</Badge>
                  }
                </div>
                <div className="flex items-center justify-between">
                  <span>ID / Passport</span>
                  {nannyProfile?.id_document_url ? 
                    <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Uploaded</Badge> : 
                    <Badge variant="outline">Not Uploaded</Badge>
                  }
                </div>
                <div className="flex items-center justify-between">
                  <span>CV / Resume</span>
                  {nannyProfile?.cv_url ? 
                    <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Uploaded</Badge> : 
                    <Badge variant="outline">Not Uploaded</Badge>
                  }
                </div>
                <div className="flex items-center justify-between">
                  <span>Academy Training</span>
                  {getStatusBadge('', nannyProfile?.academy_completed || false)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Profile Approval</span>
                  {getStatusBadge('', nannyProfile?.profile_approved || false)}
                </div>
              </div>
              
              {!isProfileComplete && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">
                        Your profile is {missingRequirements.length} item{missingRequirements.length !== 1 ? 's' : ''} away from being complete!
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {missingRequirements.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-600"></div>
                            <span className="text-sm text-yellow-700">{item}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-yellow-200">
                        <p className="text-xs text-yellow-600">
                          <Link to="/profile" className="font-medium underline hover:text-yellow-800">
                            Click here to complete your profile →
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {missingRequirements.length === 0 && nannyProfile?.profile_approved === false && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Your profile is 100% complete!
                      </p>
                      <p className="text-sm text-green-700">
                        Waiting for admin approval. You'll be notified once approved.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Academy Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" /> Academy Progress</CardTitle>
              <CardDescription>Complete all academy videos to earn your certification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span>Videos Completed</span><span>{academyProgress.completed_videos} / {academyProgress.total_videos}</span></div>
                <Progress value={academyProgress.progress_percentage} className="h-2" />
                <p className="text-xs text-muted-foreground">{academyProgress.progress_percentage}% complete</p>
              </div>
              <Link to="/academy"><Button className="w-full">{academyProgress.progress_percentage === 100 ? 'Review Academy' : 'Continue Academy'}</Button></Link>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile Information</CardTitle>
              <CardDescription>Your professional {experienceDisplay.toLowerCase()} profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Full Name
                  </label>
                  <p>{userProfile?.first_name} {userProfile?.last_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Age
                  </label>
                  <p>{age ? `${age} years` : 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Nationality
                  </label>
                  <p>{nannyProfile?.nationality || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Location
                  </label>
                  <p>{userProfile?.suburb ? `${userProfile.suburb}, ` : ''}{userProfile?.city || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Home className="h-3 w-3" /> Accommodation
                  </label>
                  <p className="capitalize">{nannyProfile?.accommodation_preference?.replace('_', ' ') || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> Role
                  </label>
                  <p>{experienceDisplay}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> Experience
                  </label>
                  <p>{getExperienceLabel(nannyProfile?.experience_duration)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Hourly Rate
                  </label>
                  <p>R{nannyProfile?.hourly_rate || 'Not specified'}/hour</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" /> Education
                  </label>
                  <p className="capitalize">{nannyProfile?.education_level?.replace(/_/g, ' ') || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Languages className="h-3 w-3" /> Languages
                  </label>
                  <p>{nannyProfile?.languages?.join(', ') || 'Not specified'}</p>
                </div>
              </div>

              <div className="border-t pt-4 mt-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-2">
                  <Users className="h-3 w-3" /> Emergency Contact
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm">{nannyProfile?.emergency_contact_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Relationship</p>
                    <p className="text-sm">{nannyProfile?.emergency_contact_relationship || 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</p>
                    <p className="text-sm">{nannyProfile?.emergency_contact_phone || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {nannyProfile?.average_rating && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Award className="h-3 w-3" /> Client Rating
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= (nannyProfile.average_rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium">{nannyProfile.average_rating.toFixed(1)} / 5</span>
                  </div>
                </div>
              )}

              {nannyProfile?.bio && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bio</label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{nannyProfile.bio}</p>
                </div>
              )}

              {nannyProfile?.cv_url && (
                <div className="mt-2 p-3 bg-green-50 rounded-md">
                  <label className="text-sm font-medium text-green-800 flex items-center gap-1">
                    <FileText className="h-4 w-4" /> CV / Resume
                  </label>
                  <a 
                    href={nannyProfile.cv_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <Eye className="h-3 w-3" /> View uploaded CV
                  </a>
                </div>
              )}

              {nannyProfile?.id_document_url && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <label className="text-sm font-medium text-blue-800 flex items-center gap-1">
                    <IdCard className="h-4 w-4" /> ID / Passport
                  </label>
                  <a 
                    href={nannyProfile.id_document_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <Eye className="h-3 w-3" /> View uploaded ID/Passport
                  </a>
                </div>
              )}

              <Link to="/profile"><Button variant="outline" className="w-full">Edit Full Profile</Button></Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Link to="/profile"><Button variant="outline" className="w-full justify-start"><User className="h-4 w-4 mr-2" />Edit Profile</Button></Link>
              <Link to="/academy"><Button variant="outline" className="w-full justify-start"><Video className="h-4 w-4 mr-2" />Academy Training</Button></Link>

              {!userProfile?.profile_picture_url && (
                <div>
                  <input type="file" id="profile-picture-upload" accept=".jpg,.jpeg,.png" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'profile_picture')} />
                  <Button variant="outline" className="w-full justify-start" onClick={() => document.getElementById('profile-picture-upload')?.click()}>
                    <User className="h-4 w-4 mr-2" />Upload Profile Picture
                  </Button>
                </div>
              )}

              {!nannyProfile?.interview_video_url ? (
                <div>
                  <input
                    type="file"
                    id="intro-video-upload"
                    accept=".mp4,.avi,.mov"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setPendingVideoFile(e.target.files[0])}
                  />
                  <Button variant="outline" className="w-full justify-start" onClick={openVideoDialog}>
                    <Video className="h-4 w-4 mr-2" />Upload Introduction Video
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Introduction Video Uploaded</span>
                  <video controls className="w-full max-h-32 rounded" src={nannyProfile.interview_video_url}>
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {!nannyProfile?.id_document_url ? (
                <div>
                  <input
                    type="file"
                    id="id-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'id_document')}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => document.getElementById('id-upload')?.click()}
                    disabled={uploading.id}
                  >
                    {uploading.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <IdCard className="h-4 w-4 mr-2" />
                        Upload ID / Passport
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800 font-medium flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> ID/Passport Uploaded
                  </p>
                  <a 
                    href={nannyProfile.id_document_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <Eye className="h-3 w-3" /> View Document
                  </a>
                </div>
              )}

              {!nannyProfile?.cv_url ? (
                <div>
                  <input
                    type="file"
                    id="cv-upload"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cv')}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => document.getElementById('cv-upload')?.click()}
                    disabled={uploading.cv}
                  >
                    {uploading.cv ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Upload CV / Resume
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="text-sm text-green-800 font-medium flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> CV Uploaded
                  </p>
                  <a 
                    href={nannyProfile.cv_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <Eye className="h-3 w-3" /> View CV
                  </a>
                </div>
              )}

              {!nannyProfile?.criminal_check_url && (
                <div>
                  <input type="file" id="criminal-check-upload" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'criminal_check')} />
                  <Button variant="outline" className="w-full justify-start" onClick={() => document.getElementById('criminal-check-upload')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />Upload Criminal Check
                  </Button>
                </div>
              )}

              {!nannyProfile?.credit_check_url && (
                <div>
                  <input type="file" id="credit-check-upload" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'credit_check')} />
                  <Button variant="outline" className="w-full justify-start" onClick={() => document.getElementById('credit-check-upload')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />Upload Credit Check
                  </Button>
                </div>
              )}

              {!nannyProfile?.proof_of_residence_url && (
                <div>
                  <input
                    type="file"
                    id="proof-of-residence-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'proof_of_residence');
                    }}
                  />
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => document.getElementById('proof-of-residence-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Proof of Residence
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Training Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">First Aid</span>
                {nannyProfile?.training_first_aid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">CPR Training</span>
                {nannyProfile?.training_cpr ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Nanny Training</span>
                {nannyProfile?.training_nanny ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Child Development</span>
                {nannyProfile?.training_child_development ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Client Interest Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Client Interest Requests
              </CardTitle>
              <CardDescription>
                Clients can only see your <strong>first name</strong> until they pay
              </CardDescription>
            </CardHeader>
            <CardContent>
              {interests.length > 0 ? (
                interests.map(interest => (
                  <div key={interest.id} className="mb-6 p-5 border rounded-xl bg-gray-50">
                    <div className="space-y-3">
                      <p className="font-semibold text-lg">
                        {interest.client_first_name} {interest.client_last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Email:</strong> {interest.client_email}
                      </p>
                      {interest.message && (
                        <p className="text-sm text-gray-700 italic">
                          "{interest.message}"
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Sent on {new Date(interest.created_at).toLocaleDateString()}
                      </p>

                      {interest.nanny_response && (
                        <p className="text-sm mt-2 text-gray-700">
                          <strong>Your Response:</strong> {interest.nanny_response}
                        </p>
                      )}
                    </div>

                    {interest.status === 'pending' && (
                      <div className="mt-5 flex gap-3">
                        <Button 
                          onClick={() => handleInterestResponse(interest.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve Request
                        </Button>
                        <Button 
                          onClick={() => handleInterestResponse(interest.id, 'declined')}
                          variant="destructive"
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No client interest requests yet.</p>
                  <p className="text-sm mt-2">Complete your profile to start receiving requests!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Introduction Video Instruction Dialog */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Video className="h-6 w-6" />
              Record Your Introduction Video
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Create a <strong>1 minute 30 seconds</strong> video answering these questions:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-left">
            <ol className="list-decimal list-inside space-y-3 text-sm md:text-base">
              <li><strong>Can you tell me a bit about your previous experience in being a nanny or cleaner?</strong></li>
              <li><strong>What makes you different from other nannies or cleaners and why should we choose you?</strong></li>
              <li>
                <strong>How do you make sure children are safe in your care when looking after them?</strong>
                <br />
                <span className="text-muted-foreground text-sm">(Only answer if you are seeking a nanny job)</span>
              </li>
              <li><strong>How do you manage your time when cleaning or caring for children?</strong></li>
            </ol>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-sm font-medium text-blue-900">
                Once you are done, upload the video on your profile to increase your chances of getting placed!
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-3 sm:justify-between">
            <Button variant="outline" onClick={closeVideoDialog}>Cancel</Button>
            <div>
              <input
                type="file"
                id="dialog-video-upload"
                accept=".mp4,.avi,.mov"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPendingVideoFile(file);
                    confirmVideoUpload();
                  }
                }}
              />
              <Button
                onClick={() => document.getElementById('dialog-video-upload')?.click()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                I Understand – Upload Video Now
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Star component
const Star = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);