import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NannyData {
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

interface Props {
  userId: string;
  onComplete: () => void;
}

export default function NannyRegistrationForm({ userId, onComplete }: Props) {
  const [formData, setFormData] = useState<NannyData>({
    bio: '',
    languages: [],
    experience_type: 'nanny',
    experience_duration: 0,
    education_level: 'matric',
    hourly_rate: 50,
    training_first_aid: false,
    training_nanny: false,
    training_cpr: false,
    training_child_development: false,
  });
  
  const [newLanguage, setNewLanguage] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('nannies')
        .update(formData)
        .eq('user_id', userId);

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error updating nanny profile:', error);
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
