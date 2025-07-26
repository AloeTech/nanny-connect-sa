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
import { User, MapPin, Phone, Mail, Upload, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  suburb: string;
  profile_picture_url: string;
}

interface NannyProfile {
  id: string;
  bio: string;
  languages: string[];
  experience_type: 'nanny' | 'cleaning' | 'both';
  experience_duration: number;
  education_level: 'matric' | 'certificate' | 'diploma' | 'degree';
  hourly_rate: number;
  training_first_aid: boolean;
  training_nanny: boolean;
  training_cpr: boolean;
  training_child_development: boolean;
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
          setNannyProfile(nanny);
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

  const createRoleProfile = async () => {
    if (userRole === 'nanny' && !nannyProfile) {
      setNannyProfile({
        id: '',
        bio: '',
        languages: [],
        experience_type: 'nanny',
        experience_duration: 0,
        education_level: 'matric',
        hourly_rate: 0,
        training_first_aid: false,
        training_nanny: false,
        training_cpr: false,
        training_child_development: false
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={userProfile?.city || ''}
                    onChange={(e) => setUserProfile(prev => prev ? {...prev, city: e.target.value} : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="suburb">Suburb</Label>
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
                    />
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