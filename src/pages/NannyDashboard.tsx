import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, Upload, Video, User, MapPin, Languages, GraduationCap, Award, Heart } from 'lucide-react';
import InterestManagement from '@/components/InterestManagement';
import { Link } from 'react-router-dom';

interface NannyProfile {
  id: string;
  bio: string;
  languages: string[];
  experience_type: string;
  experience_duration: number;
  education_level: string;
  hourly_rate: number;
  training_first_aid: boolean;
  training_nanny: boolean;
  training_cpr: boolean;
  training_child_development: boolean;
  criminal_check_status: string;
  credit_check_status: string;
  academy_completed: boolean;
  profile_approved: boolean;
  criminal_check_url: string;
  credit_check_url: string;
  interview_video_url: string;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  suburb: string;
  profile_picture_url: string;
}

interface AcademyProgress {
  total_videos: number;
  completed_videos: number;
  progress_percentage: number;
}

export default function NannyDashboard() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [nannyProfile, setNannyProfile] = useState<NannyProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [academyProgress, setAcademyProgress] = useState<AcademyProgress>({ total_videos: 0, completed_videos: 0, progress_percentage: 0 });
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userRole === 'nanny') {
      fetchData();
    }
  }, [user, userRole]);

  const fetchData = async () => {
    try {
      // Fetch nanny profile
      const { data: nanny } = await supabase
        .from('nannies')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (nanny) {
        setNannyProfile(nanny);
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

      // Fetch academy progress
      const { data: totalVideos } = await supabase
        .from('academy_videos')
        .select('id')
        .eq('is_active', true);

      const { data: completedVideos } = await supabase
        .from('nanny_academy_progress')
        .select('video_id')
        .eq('nanny_id', nanny?.id);

      const total = totalVideos?.length || 0;
      const completed = completedVideos?.length || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      setAcademyProgress({
        total_videos: total,
        completed_videos: completed,
        progress_percentage: percentage
      });

      // Fetch interests in this nanny
      if (nanny?.id) {
        const { data: interestsData, error: interestsError } = await supabase
          .from('interests')
          .select(`
            *,
            clients!inner(
              id,
              user_id,
              profiles!inner(first_name, last_name, email)
            )
          `)
          .eq('nanny_id', nanny.id)
          .order('created_at', { ascending: false });

        if (interestsError) {
          console.error('Error fetching interests:', interestsError);
        } else {
          console.log('Fetched interests for nanny:', interestsData);
          setInterests(interestsData || []);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'criminal_check' | 'credit_check' | 'interview_video' | 'profile_picture' | 'intro_video') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${type}-${Date.now()}.${fileExt}`;
      
      const bucketName = type === 'criminal_check' ? 'criminal-checks' : 
                        type === 'credit_check' ? 'credit-checks' : 
                        type === 'profile_picture' ? 'profile-pictures' : 'interview-videos';
      
      console.log('Uploading file:', fileName, 'to bucket:', bucketName);
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      const fileUrl = urlData.publicUrl;

      // Update appropriate table with file URL
      if (type === 'profile_picture') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ profile_picture_url: fileUrl })
          .eq('id', user?.id);
        
        if (updateError) throw updateError;
        
        // Update local state
        if (userProfile) {
          setUserProfile({ ...userProfile, profile_picture_url: fileUrl });
        }
      } else {
        const updateData: any = {};
        
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

        // Update local state
        if (nannyProfile) {
          setNannyProfile({ ...nannyProfile, ...updateData });
        }
      }

      toast({
        title: "Success",
        description: `${type.replace('_', ' ')} uploaded successfully`,
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
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
    if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
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
                  {getStatusBadge('', nannyProfile?.academy_completed)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Profile Approval</span>
                  {getStatusBadge('', nannyProfile?.profile_approved)}
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
                    {nannyProfile?.experience_duration} years - {nannyProfile?.experience_type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Education</label>
                  <p className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    {nannyProfile?.education_level}
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
                      if (file) handleFileUpload(file, 'intro_video');
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
                <InterestManagement 
                  interests={interests}
                  userRole="nanny"
                  onInterestUpdate={() => fetchData()}
                />
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