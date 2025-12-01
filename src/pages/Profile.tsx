import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { User, MapPin, Phone, Mail, Upload, Save, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SOUTH_AFRICAN_CITIES } from '@/data/southAfricanCities';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  town: string;
  suburb: string;
  profile_picture_url: string;
}

interface NannyProfile {
  id: string;
  user_id: string;
  bio: string;
  languages: string[];
  experience_type: 'nanny' | 'cleaning' | 'both';
  employment_type: 'part_time' | 'full_time';
  experience_duration: number;
  education_level: 'high school no matric' | 'matric' | 'certificate' | 'diploma' | 'degree';
  hourly_rate: number;
  training_first_aid: boolean;
  training_nanny: boolean;
  training_cpr: boolean;
  training_child_development: boolean;
  date_of_birth: string;
  accommodation_preference: 'live_in' | 'live_out';
  proof_of_residence_url: string;
  interview_video_url: string;
  criminal_check_url: string;
  criminal_check_status: 'pending' | 'approved' | 'rejected';
  credit_check_url: string;
  credit_check_status: 'pending' | 'approved' | 'rejected';
  academy_completed: boolean;
  profile_approved: boolean;
  created_at: string;
  updated_at: string;
}

interface ClientProfile {
  id: string;
  description: string;
  preferred_employment_type: 'full_time' | 'part_time';
  preferred_experience_type: 'nanny' | 'cleaning' | 'both';
  preferred_accommodation_type: 'live_in' | 'stay_out';
}

const SA_LANGUAGES = [
  'Afrikaans', 'English', 'Zulu', 'Xhosa', 'Sotho', 'Tswana',
  'Pedi', 'Venda', 'Tsonga', 'Swati', 'Ndebele', 'Shona', 'Chewa'
];

const EXPERIENCE_TYPES: ('nanny' | 'cleaning' | 'both')[] = ['nanny', 'cleaning', 'both'];
const EDUCATION_LEVELS: ('high school no matric' | 'matric' | 'certificate' | 'diploma' | 'degree')[] = ['high school no matric', 'matric', 'certificate', 'diploma', 'degree'];
const EMPLOYMENT_TYPES: ('full_time' | 'part_time')[] = ['full_time', 'part_time'];
const ACCOMMODATION_TYPES: ('live_in' | 'stay_out')[] = ['live_in', 'stay_out'];

const EXPERIENCE_DURATION_OPTIONS = [
  { label: '0 years', value: 0 },
  { label: '1-2 years', value: 2 },
  { label: '3-4 years', value: 4 },
  { label: '5-10 years', value: 10 },
  { label: '10+ years', value: 15 },
];

export default function Profile() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [nannyProfile, setNannyProfile] = useState<NannyProfile | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [uploading, setUploading] = useState({ proof: false, video: false, criminal: false, credit: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

      // Fetch role-specific profile
      if (userRole === 'nanny') {
        const { data: nanny } = await supabase
          .from('nannies')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        if (nanny) {
          setNannyProfile({
            ...nanny,
            employment_type: (nanny.employment_type as 'part_time' | 'full_time') || 'full_time',
            accommodation_preference: (nanny.accommodation_preference as 'live_in' | 'live_out') || 'live_out',
            interview_video_url: nanny.interview_video_url || '',
            criminal_check_url: nanny.criminal_check_url || '',
            credit_check_url: nanny.credit_check_url || '',
            criminal_check_status: nanny.criminal_check_status || 'pending',
            credit_check_status: nanny.credit_check_status || 'pending',
            academy_completed: nanny.academy_completed || false,
            profile_approved: nanny.profile_approved || false
          });
        }
      } else if (userRole === 'client') {
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        if (client) {
          setClientProfile(client);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUserProfile = async () => {
    if (!userProfile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          ...userProfile
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveNannyProfile = async () => {
    if (!nannyProfile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('nannies')
        .upsert({
          ...nannyProfile,
          user_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Nanny profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveClientProfile = async () => {
    if (!clientProfile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .upsert({
          ...clientProfile,
          user_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Fixed introduction video upload function
  const handleInterviewVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !nannyProfile) return;

    // Validate file type
    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/avi'];
    if (!validVideoTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file (MP4, MOV, WebM, or AVI).",
        variant: "destructive"
      });
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a video smaller than 50MB.",
        variant: "destructive"
      });
      return;
    }

    setUploading(prev => ({ ...prev, video: true }));
    
    try {
      // Get file extension and create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/interview_video-${Date.now()}.${fileExt}`;
      const bucketName = 'interview-videos';

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
      
      const publicUrl = urlData.publicUrl;

      // Update nanny profile with the video URL
      const { error: updateError } = await supabase
        .from('nannies')
        .update({ 
          interview_video_url: publicUrl 
        })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      // Update local state
      setNannyProfile(prev => prev ? { 
        ...prev, 
        interview_video_url: publicUrl 
      } : null);

      toast({
        title: "Success!",
        description: "Introduction video uploaded successfully.",
      });

    } catch (error: any) {
      console.error('Video upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(prev => ({ ...prev, video: false }));
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fileType: 'proof_of_residence' | 'criminal_check' | 'credit_check') => {
    const file = event.target.files?.[0];
    if (!file || !nannyProfile) return;

    // Validate file type for documents
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, JPEG, or PNG file.",
        variant: "destructive"
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    const uploadingKey = fileType === 'proof_of_residence' ? 'proof' : 
                        fileType === 'criminal_check' ? 'criminal' : 'credit';
    
    setUploading(prev => ({ ...prev, [uploadingKey]: true }));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${fileType}-${Date.now()}.${fileExt}`;
      
      const bucket = fileType === 'proof_of_residence' ? 'proof-of-residence' :
                    fileType === 'criminal_check' ? 'criminal-checks' : 'credit-checks';

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      const updateData: any = { [fileType]: publicUrl };
      if (fileType === 'criminal_check') {
        updateData.criminal_check_status = 'pending';
      } else if (fileType === 'credit_check') {
        updateData.credit_check_status = 'pending';
      }

      const { error: updateError } = await supabase
        .from('nannies')
        .update(updateData)
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      setNannyProfile(prev => prev ? { ...prev, ...updateData } : null);

      toast({
        title: "File uploaded successfully",
        description: `Your ${fileType.replace('_', ' ')} has been uploaded.`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(prev => ({ ...prev, [uploadingKey]: false }));
      event.target.value = '';
    }
  };

  const createRoleProfile = async () => {
    if (userRole === 'nanny' && !nannyProfile) {
      setNannyProfile({
        id: '',
        user_id: user?.id || '',
        bio: '',
        languages: [],
        experience_type: 'nanny',
        employment_type: 'full_time',
        experience_duration: 0,
        education_level: 'matric',
        hourly_rate: 50,
        training_first_aid: false,
        training_nanny: false,
        training_cpr: false,
        training_child_development: false,
        date_of_birth: '',
        accommodation_preference: 'live_out',
        proof_of_residence_url: '',
        interview_video_url: '',
        criminal_check_url: '',
        criminal_check_status: 'pending',
        credit_check_url: '',
        credit_check_status: 'pending',
        academy_completed: false,
        profile_approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } else if (userRole === 'client' && !clientProfile) {
      setClientProfile({
        id: '',
        description: '',
        preferred_employment_type: 'full_time',
        preferred_experience_type: 'nanny',
        preferred_accommodation_type: 'stay_out'
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8" />
          Profile Settings
        </h1>
        <p className="text-muted-foreground">Manage your personal and professional information</p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          {userRole === 'nanny' && <TabsTrigger value="nanny">Nanny Profile</TabsTrigger>}
          {userRole === 'client' && <TabsTrigger value="client">Preferences</TabsTrigger>}
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your basic profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={userProfile?.first_name || ''}
                    onChange={(e) => setUserProfile(prev => prev ? {...prev, first_name: e.target.value} : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={userProfile?.last_name || ''}
                    onChange={(e) => setUserProfile(prev => prev ? {...prev, last_name: e.target.value} : null)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userProfile?.email || ''}
                  onChange={(e) => setUserProfile(prev => prev ? {...prev, email: e.target.value} : null)}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={userProfile?.phone || ''}
                  onChange={(e) => setUserProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Select value={userProfile?.city || ''} onValueChange={(value) => setUserProfile(prev => prev ? {...prev, city: value} : null)}>
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
                <div>
                  <Label htmlFor="town">Town/Suburb</Label>
                  <Input
                    id="town"
                    placeholder="Enter your town or suburb"
                    value={userProfile?.town || ''}
                    onChange={(e) => setUserProfile(prev => prev ? {...prev, town: e.target.value} : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="suburb">Additional Suburb Info</Label>
                  <Input
                    id="suburb"
                    value={userProfile?.suburb || ''}
                    onChange={(e) => setUserProfile(prev => prev ? {...prev, suburb: e.target.value} : null)}
                  />
                </div>
              </div>

              <Button onClick={saveUserProfile} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Personal Info'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === 'nanny' && (
          <TabsContent value="nanny" className="space-y-6">
            {!nannyProfile ? (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">Complete Your Nanny Profile</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your professional nanny profile to start receiving client interest.
                  </p>
                  <Button onClick={createRoleProfile}>Create Nanny Profile</Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Nanny Profile</CardTitle>
                  <CardDescription>Professional information for potential clients</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell families about yourself, your experience, and what makes you special..."
                      value={nannyProfile.bio}
                      onChange={(e) => setNannyProfile({...nannyProfile, bio: e.target.value})}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="interview_video">Introduction Video</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id="interview_video"
                        accept="video/mp4,video/quicktime,video/webm,video/avi"
                        onChange={handleInterviewVideoUpload}
                        className="hidden"
                        disabled={uploading.video}
                      />
                      <label htmlFor="interview_video" className="cursor-pointer">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">
                          {uploading.video ? 'Uploading...' : 'Click to upload introduction video'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          MP4, MOV, WebM, or AVI accepted, up to 50MB
                        </p>
                      </label>
                      {nannyProfile.interview_video_url && (
                        <div className="mt-4">
                          <p className="text-sm text-green-600 mb-2">✓ Introduction video uploaded</p>
                          <div className="relative">
                            <video
                              controls
                              src={nannyProfile.interview_video_url}
                              className="w-full max-h-64 rounded-lg"
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(nannyProfile.interview_video_url, '_blank')}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View in new tab
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Remove video
                                  setNannyProfile(prev => prev ? {...prev, interview_video_url: ''} : null);
                                  toast({
                                    title: "Video removed",
                                    description: "You can upload a new introduction video.",
                                  });
                                }}
                              >
                                Remove video
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="proof_of_residence">Proof of Residence</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id="proof_of_residence"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, 'proof_of_residence')}
                        className="hidden"
                        disabled={uploading.proof}
                      />
                      <label htmlFor="proof_of_residence" className="cursor-pointer">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">
                          {uploading.proof ? 'Uploading...' : 'Click to upload proof of residence'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, JPG, JPEG, PNG up to 10MB
                        </p>
                      </label>
                      {nannyProfile.proof_of_residence_url && (
                        <div className="mt-2">
                          <p className="text-sm text-green-600">✓ Proof of residence uploaded</p>
                          <a href={nannyProfile.proof_of_residence_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="criminal_check">Criminal Check Document</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id="criminal_check"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, 'criminal_check')}
                        className="hidden"
                        disabled={uploading.criminal}
                      />
                      <label htmlFor="criminal_check" className="cursor-pointer">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">
                          {uploading.criminal ? 'Uploading...' : 'Click to upload criminal check document'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, JPG, JPEG, PNG up to 10MB
                        </p>
                      </label>
                      {nannyProfile.criminal_check_url && (
                        <div className="mt-2">
                          <p className="text-sm text-green-600">✓ Criminal check uploaded</p>
                          <a href={nannyProfile.criminal_check_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="credit_check">Credit Check Document</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id="credit_check"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, 'credit_check')}
                        className="hidden"
                        disabled={uploading.credit}
                      />
                      <label htmlFor="credit_check" className="cursor-pointer">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">
                          {uploading.credit ? 'Uploading...' : 'Click to upload credit check document'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, JPG, JPEG, PNG up to 10MB
                        </p>
                      </label>
                      {nannyProfile.credit_check_url && (
                        <div className="mt-2">
                          <p className="text-sm text-green-600">✓ Credit check uploaded</p>
                          <a href={nannyProfile.credit_check_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={nannyProfile.date_of_birth}
                        onChange={(e) => setNannyProfile({...nannyProfile, date_of_birth: e.target.value})}
                      />
                      {nannyProfile.date_of_birth && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Age: {new Date().getFullYear() - new Date(nannyProfile.date_of_birth).getFullYear()} years
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="accommodation_preference">Accommodation Preference</Label>
                      <Select 
                        value={nannyProfile.accommodation_preference} 
                        onValueChange={(value: 'live_in' | 'live_out') => setNannyProfile({...nannyProfile, accommodation_preference: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="live_in">Live In</SelectItem>
                          <SelectItem value="live_out">Live Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="employment_type">Employment Type</Label>
                      <Select 
                        value={nannyProfile.employment_type} 
                        onValueChange={(value: 'part_time' | 'full_time') => setNannyProfile({...nannyProfile, employment_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="part_time">Part Time</SelectItem>
                          <SelectItem value="full_time">Full Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="experience_type">Experience Type</Label>
                      <Select 
                        value={nannyProfile.experience_type} 
                        onValueChange={(value) => setNannyProfile({...nannyProfile, experience_type: value as 'nanny' | 'cleaning' | 'both'})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="experience_duration">Years of Experience</Label>
                      <Select
                        value={EXPERIENCE_DURATION_OPTIONS.find(opt => opt.value === nannyProfile.experience_duration)?.label || '0 years'}
                        onValueChange={(label) => {
                          const selected = EXPERIENCE_DURATION_OPTIONS.find(opt => opt.label === label);
                          setNannyProfile({...nannyProfile, experience_duration: selected ? selected.value : 0});
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_DURATION_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.label}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="education_level">Education Level</Label>
                      <Select 
                        value={nannyProfile.education_level} 
                        onValueChange={(value) => setNannyProfile({...nannyProfile, education_level: value as 'high school no matric' | 'matric' | 'certificate' | 'diploma' | 'degree'})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EDUCATION_LEVELS.map(level => (
                            <SelectItem key={level} value={level}>
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="hourly_rate">Hourly Rate (R)</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={nannyProfile.hourly_rate}
                        onChange={(e) => setNannyProfile({...nannyProfile, hourly_rate: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Languages Spoken</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {SA_LANGUAGES.map(language => (
                        <div key={language} className="flex items-center space-x-2">
                          <Checkbox
                            id={language}
                            checked={nannyProfile.languages.includes(language)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNannyProfile({
                                  ...nannyProfile, 
                                  languages: [...nannyProfile.languages, language]
                                });
                              } else {
                                setNannyProfile({
                                  ...nannyProfile,
                                  languages: nannyProfile.languages.filter(l => l !== language)
                                });
                              }
                            }}
                          />
                          <Label htmlFor={language} className="text-sm">{language}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Training & Certifications</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="first_aid"
                          checked={nannyProfile.training_first_aid}
                          onCheckedChange={(checked) => setNannyProfile({...nannyProfile, training_first_aid: !!checked})}
                        />
                        <Label htmlFor="first_aid">First Aid</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="cpr"
                          checked={nannyProfile.training_cpr}
                          onCheckedChange={(checked) => setNannyProfile({...nannyProfile, training_cpr: !!checked})}
                        />
                        <Label htmlFor="cpr">CPR</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="nanny_training"
                          checked={nannyProfile.training_nanny}
                          onCheckedChange={(checked) => setNannyProfile({...nannyProfile, training_nanny: !!checked})}
                        />
                        <Label htmlFor="nanny_training">Nanny Training</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="child_development"
                          checked={nannyProfile.training_child_development}
                          onCheckedChange={(checked) => setNannyProfile({...nannyProfile, training_child_development: !!checked})}
                        />
                        <Label htmlFor="child_development">Child Development</Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Academy Completion</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox
                        id="academy_completed"
                        checked={nannyProfile.academy_completed}
                        onCheckedChange={(checked) => setNannyProfile({...nannyProfile, academy_completed: !!checked})}
                      />
                      <Label htmlFor="academy_completed">Completed Nanny Academy</Label>
                    </div>
                  </div>

                  <Button onClick={saveNannyProfile} disabled={saving} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Nanny Profile'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {userRole === 'client' && (
          <TabsContent value="client" className="space-y-6">
            {!clientProfile ? (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">Set Your Preferences</h3>
                  <p className="text-muted-foreground mb-4">
                    Tell us what kind of nanny you're looking for to get better matches.
                  </p>
                  <Button onClick={createRoleProfile}>Set Preferences</Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Search Preferences</CardTitle>
                  <CardDescription>Help us find the perfect nanny for your family</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="description">Family Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell potential nannies about your family, children, and what you're looking for..."
                      value={clientProfile.description}
                      onChange={(e) => setClientProfile({...clientProfile, description: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="preferred_experience_type">Experience Type</Label>
                      <Select 
                        value={clientProfile.preferred_experience_type} 
                        onValueChange={(value) => setClientProfile({...clientProfile, preferred_experience_type: value as 'nanny' | 'cleaning' | 'both'})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="preferred_employment_type">Employment Type</Label>
                      <Select 
                        value={clientProfile.preferred_employment_type} 
                        onValueChange={(value) => setClientProfile({...clientProfile, preferred_employment_type: value as 'full_time' | 'part_time'})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYMENT_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.replace('_', '-').charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="preferred_accommodation_type">Accommodation</Label>
                      <Select 
                        value={clientProfile.preferred_accommodation_type} 
                        onValueChange={(value) => setClientProfile({...clientProfile, preferred_accommodation_type: value as 'live_in' | 'stay_out'})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCOMMODATION_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.replace('_', '-').charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={saveClientProfile} disabled={saving} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Current Email</h4>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Password</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  To change your password, you'll need to reset it via email.
                </p>
                <Button variant="outline">Reset Password</Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 text-destructive">Danger Zone</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data.
                </p>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}