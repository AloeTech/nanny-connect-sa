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
import { User, MapPin, Phone, Mail, Upload, Save, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  bio: string;
  languages: string[];
  experience_type: 'nanny' | 'cleaning' | 'both';
  employment_type: 'part_time' | 'full_time';
  experience_duration: number;
  education_level: 'matric' | 'certificate' | 'diploma' | 'degree';
  hourly_rate: number;
  training_first_aid: boolean;
  training_nanny: boolean;
  training_cpr: boolean;
  training_child_development: boolean;
  date_of_birth: string;
  accommodation_preference: 'live_in' | 'live_out';
  proof_of_residence_url: string;
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
const EDUCATION_LEVELS: ('matric' | 'certificate' | 'diploma' | 'degree')[] = ['matric', 'certificate', 'diploma', 'degree'];
const EMPLOYMENT_TYPES: ('full_time' | 'part_time')[] = ['full_time', 'part_time'];
const ACCOMMODATION_TYPES: ('live_in' | 'stay_out')[] = ['live_in', 'stay_out'];

export default function Profile() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [nannyProfile, setNannyProfile] = useState<NannyProfile | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [newLanguage, setNewLanguage] = useState('');
  const [uploading, setUploading] = useState(false);
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
            accommodation_preference: (nanny.accommodation_preference as 'live_in' | 'live_out') || 'live_out'
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

  const addLanguage = () => {
    if (newLanguage.trim() && nannyProfile && !nannyProfile.languages.includes(newLanguage.trim())) {
      setNannyProfile({
        ...nannyProfile,
        languages: [...nannyProfile.languages, newLanguage.trim()]
      });
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    if (nannyProfile) {
      setNannyProfile({
        ...nannyProfile,
        languages: nannyProfile.languages.filter(lang => lang !== language)
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = event.target.files?.[0];
    if (!file || !nannyProfile) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${fileType}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('proof-of-residence')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('proof-of-residence')
        .getPublicUrl(fileName);

      setNannyProfile({
        ...nannyProfile,
        proof_of_residence_url: publicUrl
      });

      toast({
        title: "File uploaded successfully",
        description: "Your proof of residence has been uploaded.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const createRoleProfile = async () => {
    if (userRole === 'nanny' && !nannyProfile) {
      setNannyProfile({
        id: '',
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
                      <Select value={nannyProfile.accommodation_preference} onValueChange={(value: any) => setNannyProfile({...nannyProfile, accommodation_preference: value})}>
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
                      <Select value={nannyProfile.employment_type} onValueChange={(value: any) => setNannyProfile({...nannyProfile, employment_type: value})}>
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

                  <div>
                    <Label htmlFor="proof_of_residence">Proof of Residence</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id="proof_of_residence"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, 'proof_of_residence')}
                        className="hidden"
                        disabled={uploading}
                      />
                      <label htmlFor="proof_of_residence" className="cursor-pointer">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">
                          {uploading ? 'Uploading...' : 'Click to upload proof of residence'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, JPG, JPEG, PNG up to 10MB
                        </p>
                      </label>
                      {nannyProfile.proof_of_residence_url && (
                        <p className="text-sm text-green-600 mt-2">✓ Proof of residence uploaded</p>
                      )}
                    </div>
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
                      <Input
                        id="experience_duration"
                        type="number"
                        value={nannyProfile.experience_duration}
                        onChange={(e) => setNannyProfile({...nannyProfile, experience_duration: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="education_level">Education Level</Label>
                      <Select 
                        value={nannyProfile.education_level} 
                        onValueChange={(value) => setNannyProfile({...nannyProfile, education_level: value as 'matric' | 'certificate' | 'diploma' | 'degree'})}
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
                    <Label>Languages</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add a language"
                        value={newLanguage}
                        onChange={(e) => setNewLanguage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                      />
                      <Button type="button" onClick={addLanguage}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {nannyProfile.languages.map((language) => (
                        <Badge key={language} variant="secondary" className="flex items-center gap-1">
                          {language}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeLanguage(language)} />
                        </Badge>
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