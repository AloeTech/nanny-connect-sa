import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SOUTH_AFRICAN_CITIES } from "@/data/southAfricanCities";

interface NannyData {
  bio: string;
  languages: string[];
  experience_type: 'nanny' | 'cleaning' | 'both';
  employment_type: 'part_time' | 'full_time';
  experience_duration: number;
  education_level:'high school no matric' | 'matric' | 'certificate' | 'diploma' | 'degree';
  hourly_rate: number;
  training_first_aid: boolean;
  training_nanny: boolean;
  training_cpr: boolean;
  training_child_development: boolean;
  date_of_birth: string;
  accommodation_preference: 'live_in' | 'live_out';
  proof_of_residence_url: string;
}

interface ProfileData {
  city: string;
  town: string;
}

interface Props {
  userId: string;
  onComplete: () => void;
}

export default function NannyRegistrationForm({ userId, onComplete }: Props) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<NannyData>({
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
  
  const [profileData, setProfileData] = useState<ProfileData>({
    city: '',
    town: '',
  });
  
  const [newLanguage, setNewLanguage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang !== language)
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${fileType}.${fileExt}`;

      let bucket = '';
      switch (fileType) {
        case 'proof_of_residence':
          bucket = 'proof-of-residence';
          break;
        default:
          throw new Error('Invalid file type');
      }

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        [`${fileType}_url`]: publicUrl
      }));

      toast({
        title: "File uploaded successfully",
        description: `Your ${fileType.replace('_', ' ')} has been uploaded.`,
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

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Update nanny profile
      const { error: nannyError } = await supabase
        .from('nannies')
        .update(formData)
        .eq('user_id', userId);

      if (nannyError) throw nannyError;

      // Update profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);

      if (profileError) throw profileError;

      toast({
        title: "Profile updated successfully",
        description: "Your nanny profile has been completed.",
      });

      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Nanny Profile</CardTitle>
        <CardDescription>
          Tell families about your experience and qualifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell families about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
              />
              {formData.date_of_birth && (
                <p className="text-sm text-muted-foreground mt-1">
                  Age: {calculateAge(formData.date_of_birth)} years
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="accommodation_preference">Accommodation Preference</Label>
              <Select value={formData.accommodation_preference} onValueChange={(value: any) => setFormData(prev => ({ ...prev, accommodation_preference: value }))}>
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
              <Select value={formData.employment_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, employment_type: value }))}>
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
              <Label htmlFor="city">City</Label>
              <Select value={profileData.city} onValueChange={(value) => setProfileData(prev => ({ ...prev, city: value }))}>
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
                value={profileData.town}
                onChange={(e) => setProfileData(prev => ({ ...prev, town: e.target.value }))}
              />
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
              {formData.proof_of_residence_url && (
                <p className="text-sm text-green-600 mt-2">✓ Proof of residence uploaded</p>
              )}
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
              {formData.languages.map((language) => (
                <Badge key={language} variant="secondary" className="flex items-center gap-1">
                  {language}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeLanguage(language)} />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="experience_type">Experience Type</Label>
            <Select value={formData.experience_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, experience_type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nanny">Nanny only</SelectItem>
                <SelectItem value="cleaning">Cleaning only</SelectItem>
                <SelectItem value="both">Both nanny & cleaning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="experience_duration">Experience Duration (months)</Label>
            <Input
              id="experience_duration"
              type="number"
              min="0"
              value={formData.experience_duration}
              onChange={(e) => setFormData(prev => ({ ...prev, experience_duration: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div>
            <Label htmlFor="education_level">Education Level</Label>
            <Select value={formData.education_level} onValueChange={(value: any) => setFormData(prev => ({ ...prev, education_level: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high school no matric">No Matric</SelectItem>
                <SelectItem value="matric">Matric</SelectItem>
                <SelectItem value="certificate">Certificate</SelectItem>
                <SelectItem value="diploma">Diploma</SelectItem>
                <SelectItem value="degree">Degree</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="hourly_rate">Hourly Rate (R)</Label>
            <Input
              id="hourly_rate"
              type="number"
              min="0"
              value={formData.hourly_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Training & Certifications</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="first_aid"
                  checked={formData.training_first_aid}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, training_first_aid: !!checked }))}
                />
                <Label htmlFor="first_aid">First Aid Training</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cpr"
                  checked={formData.training_cpr}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, training_cpr: !!checked }))}
                />
                <Label htmlFor="cpr">CPR Training</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="nanny_training"
                  checked={formData.training_nanny}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, training_nanny: !!checked }))}
                />
                <Label htmlFor="nanny_training">Foundational Nanny Training</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="child_dev"
                  checked={formData.training_child_development}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, training_child_development: !!checked }))}
                />
                <Label htmlFor="child_dev">Child Development Training</Label>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Saving...' : 'Complete Registration'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
