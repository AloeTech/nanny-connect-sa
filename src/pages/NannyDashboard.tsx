import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, Upload, Video, User, MapPin, Languages, GraduationCap, Award, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';

// Initialize EmailJS with the public key from FindNanny
emailjs.init('rK97vwvxnXTTY8PjW');

interface NannyProfile {
  id: string;
  bio: string | null;
  languages: string[] | null;
  experience_type: 'nanny' | 'cleaning' | 'both';
  experience_duration: number | null;
  education_level: 'high school no matric' | 'matric' | 'certificate' | 'diploma' | 'degree' | null;
  hourly_rate: number | null;
  training_first_aid: boolean | null;
  training_nanny: boolean | null;
  training_cpr: boolean | null;
  training_child_development: boolean | null;
  criminal_check_status: 'pending' | 'approved' | 'rejected' | null;
  credit_check_status: 'pending' | 'approved' | 'rejected' | null;
  academy_completed: boolean | null;
  profile_approved: boolean | null;
  criminal_check_url: string | null;
  credit_check_url: string | null;
  interview_video_url: string | null;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  suburb: string | null;
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

// Map numeric experience_duration to dropdown labels
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

export default function NannyDashboard() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [nannyProfile, setNannyProfile] = useState<NannyProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [academyProgress, setAcademyProgress] = useState<AcademyProgress>({ total_videos: 0, completed_videos: 0, progress_percentage: 0 });
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userRole === 'nanny') {
      fetchData();
    }
  }, [user, userRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch nanny profile
      const { data: nannyData, error: nannyError } = await supabase
        .from('nannies')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (nannyError) throw nannyError;

      const safeNannyData: NannyProfile = {
        ...nannyData,
        experience_type: nannyData.experience_type as 'nanny' | 'cleaning' | 'both' || 'nanny',
        education_level: nannyData.education_level as 'high school no matric' | 'matric' | 'certificate' | 'diploma' | 'degree' || 'matric',
      };
      setNannyProfile(safeNannyData);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profileData);

      // Fetch academy progress
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

      // Fetch interests for the specific nanny
      if (nannyData?.id) {
        console.log('Fetching interests for nanny ID:', nannyData.id);
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
          console.error('Error fetching interests:', interestsError.message, interestsError.details);
          toast({
            title: 'Error',
            description: 'Failed to load interest requests',
            variant: 'destructive',
          });
        } else {
          console.log('Fetched interests for nanny:', interestsData);
          setInterests(interestsData as Interest[] || []);
        }
      }
    } catch (error: any) {
      console.error('Error fetching data:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'criminal_check' | 'credit_check' | 'interview_video' | 'profile_picture' | 'intro_video') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${type}-${Date.now()}.${fileExt}`;

      const bucketName = type === 'criminal_check'
        ? 'criminal-checks'
        : type === 'credit_check'
        ? 'credit-checks'
        : type === 'profile_picture'
        ? 'profile-pictures'
        : 'interview-videos';

      console.log('Uploading file:', fileName, 'to bucket:', bucketName);

      const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, file);

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
    }
  };

  const handleInterestResponse = async (interestId: string, response: 'approved' | 'declined') => {
    const interest = interests.find(i => i.id === interestId);
    if (!interest || !userProfile) return;

    // Update interests table
    console.log(`Attempting to update interest ${interestId} with status: ${response}`);
    const { data, error: updateError } = await supabase
      .from('interests')
      .update({
        status: response === 'approved' ? 'approved' : 'declined',
        nanny_response: `${userProfile.first_name} has ${response} your request on ${new Date().toLocaleDateString()}.`,
      })
      .eq('id', interestId)
      .select();

    if (updateError) {
      console.error('Error updating interest:', updateError.message, updateError.details, updateError.code);
      toast({
        title: 'Error',
        description: `Failed to update interest response: ${updateError.message}. Check console for details.`,
        variant: 'destructive',
      });
      return;
    }

    if (!data || data.length === 0) {
      console.error('No data returned after update for interest:', interestId);
      toast({
        title: 'Error',
        description: 'Failed to retrieve updated interest data.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Updated interest data:', data[0]);
    // Update local state with the returned data
    setInterests(interests.map(i => i.id === interestId ? data[0] as Interest : i));

    // Send email notification to client using EmailJS
    const emailParams = {
      serviceID: 'service_syqn4ol',
      templateID: 'template_exkrbne',
      publicKey: 'rK97vwvxnXTTY8PjW',
      templateParams: {
        name: `${interest.client_first_name} ${interest.client_last_name || ''}`,
        email: interest.client_email || '',
        subject: `Interest Response - Nanny Placements SA`,
        message: `Your interest request for ${interest.nanny_first_name} ${interest.nanny_last_name || ''} has been ${response}.

${userProfile.first_name}'s response: "${userProfile.first_name} has ${response} your request on ${new Date().toLocaleDateString()}."

Best regards,
Nanny Placements SA Team`,
        to_email: interest.client_email || '',
      },
    };

    try {
      await emailjs.send(emailParams.serviceID, emailParams.templateID, emailParams.templateParams, emailParams.publicKey);
      toast({
        title: 'Success',
        description: `Email sent to ${interest.client_email} regarding ${response} interest.`,
      });
    } catch (error: any) {
      console.error('Email sending failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email notification',
        variant: 'destructive',
      });
    }
  };

  if (userRole !== 'nanny') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">This page is only accessible to nannies.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nanny Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {userProfile?.first_name}!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Status Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Status
              </CardTitle>
              <CardDescription>Complete your profile to start receiving client interests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span>Criminal Check</span>
                  {getStatusBadge(nannyProfile?.criminal_check_status || 'pending')}
                </div>
                <div className="flex items-center justify-between">
                  <span>Credit Check</span>
                  {getStatusBadge(nannyProfile?.credit_check_status || 'pending')}
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
              {!nannyProfile?.profile_approved && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Complete all requirements to get your profile approved and start receiving client interest.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Academy Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Academy Progress
              </CardTitle>
              <CardDescription>Complete all academy videos to earn your certification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Videos Completed</span>
                  <span>{academyProgress.completed_videos} / {academyProgress.total_videos}</span>
                </div>
                <Progress value={academyProgress.progress_percentage} className="h-2" />
                <p className="text-xs text-muted-foreground">{academyProgress.progress_percentage}% complete</p>
              </div>
              <Link to="/academy">
                <Button className="w-full">
                  {academyProgress.progress_percentage === 100 ? 'Review Academy' : 'Continue Academy'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Your professional nanny profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {userProfile?.suburb}, {userProfile?.city}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Languages</label>
                  <p className="flex items-center gap-1">
                    <Languages className="h-4 w-4" />
                    {nannyProfile?.languages?.join(', ') || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Experience</label>
                  <p className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    {getExperienceLabel(nannyProfile?.experience_duration)} - {nannyProfile?.experience_type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Education</label>
                  <p className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    {nannyProfile?.education_level || 'Not specified'}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bio</label>
                <p className="text-sm mt-1">{nannyProfile?.bio || 'No bio provided'}</p>
              </div>
              <Link to="/profile">
                <Button variant="outline" className="w-full">Edit Profile</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/profile">
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
              <Link to="/academy">
                <Button variant="outline" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  Academy Training
                </Button>
              </Link>
              {!userProfile?.profile_picture_url && (
                <div>
                  <input
                    type="file"
                    id="profile-picture-upload"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'profile_picture');
                    }}
                  />
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => document.getElementById('profile-picture-upload')?.click()}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Upload Profile Picture
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'interview_video');
                    }}
                  />
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => document.getElementById('intro-video-upload')?.click()}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Upload Introduction Video
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Introduction Video Uploaded</span>
                  <video
                    controls
                    className="w-full max-h-32 rounded"
                    src={nannyProfile.interview_video_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
              {!nannyProfile?.criminal_check_url && (
                <div>
                  <input
                    type="file"
                    id="criminal-check-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'criminal_check');
                    }}
                  />
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => document.getElementById('criminal-check-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Criminal Check
                  </Button>
                </div>
              )}
              {!nannyProfile?.credit_check_url && (
                <div>
                  <input
                    type="file"
                    id="credit-check-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'credit_check');
                    }}
                  />
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => document.getElementById('credit-check-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Credit Check
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

          {/* Interest Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Client Interest Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {interests.length > 0 ? (
                interests.map(interest => (
                  <div key={interest.id} className="mb-4 p-4 border rounded-lg">
                    <p><strong>Client:</strong> {interest.client_first_name} {interest.client_last_name}</p>
                    <p><strong>Email:</strong> {interest.client_email}</p>
                    <p><strong>Message:</strong> {interest.message}</p>
                    <p><strong>Status:</strong> {getStatusBadge(interest.status || 'pending')}</p>
                    {interest.nanny_response && <p><strong>Response:</strong> {interest.nanny_response}</p>}
                    {interest.status === 'pending' && (
                      <div className="mt-2 space-x-2">
                        <Button onClick={() => handleInterestResponse(interest.id, 'approved')} variant="default">
                          Approve
                        </Button>
                        <Button onClick={() => handleInterestResponse(interest.id, 'declined')} variant="destructive">
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No interest requests yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
