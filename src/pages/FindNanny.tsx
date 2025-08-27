import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, MapPin, CheckCircle, X, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import emailjs from '@emailjs/browser';

interface Nanny {
  id: string;
  user_id: string;
  languages: string[] | null;
  experience_type: string;
  experience_duration: number | null;
  education_level: string | null;
  training_first_aid: boolean | null;
  training_nanny: boolean | null;
  training_cpr: boolean | null;
  training_child_development: boolean | null;
  academy_completed: boolean | null;
  profile_approved: boolean | null;
  criminal_check_status: string | null;
  credit_check_status: string | null;
  hourly_rate: number | null;
  bio: string | null;
  interview_video_url: string | null;
  date_of_birth: string | null;
  accommodation_preference: string | null;
  employment_type: string | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    city: string | null;
    suburb: string | null;
    town: string | null;
    profile_picture_url: string | null;
    email: string;
  };
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

const educationOptions = [
  'high school no matric',
  'matric',
  'certificate',
  'diploma',
  'degree'
];

const ageRanges = [
  { label: '20-25 years', min: 20, max: 25 },
  { label: '25-30 years', min: 25, max: 30 },
  { label: '30-35 years', min: 30, max: 35 },
  { label: '35-40 years', min: 35, max: 40 },
  { label: '40-45 years', min: 40, max: 45 },
  { label: '45-50 years', min: 45, max: 50 },
  { label: '50-55 years', min: 50, max: 55 },
];

const languagesOptions = [
  'Afrikaans', 'English', 'Zulu', 'Xhosa', 'Sotho', 'Tswana',
  'Pedi', 'Venda', 'Tsonga', 'Swati', 'Ndebele', 'Shona', 'Chewa'
];

export default function FindNanny() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [nannies, setNannies] = useState<Nanny[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    experienceType: '',
    employmentType: '',
    accommodationPreference: '',
    maxRate: '',
    languages: [] as string[],
    education: '',
    experienceDuration: '',
    ageRange: ''
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Interest modal state
  const [selectedNanny, setSelectedNanny] = useState<Nanny | null>(null);
  const [interestMessage, setInterestMessage] = useState('');
  const [sendingInterest, setSendingInterest] = useState(false);
  const [existingInterests, setExistingInterests] = useState<Interest[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);

  const hasRole = userRole === 'client';

  useEffect(() => {
    fetchNannies();
    if (user && hasRole) {
      fetchExistingInterests();
      const subscription = supabase
        .channel('custom-all-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'interests', filter: `client_id=eq.${user.id}` }, (payload) => {
          console.log('Real-time update received:', payload);
          fetchExistingInterests();
        })
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, hasRole, refreshCount]);

  useEffect(() => {
    return () => {
      // Cleanup any pending timeouts on component unmount
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const fetchNannies = async () => {
    try {
      let query = supabase
        .from('nannies')
        .select(`
          *,
          profiles!inner(
            first_name,
            last_name,
            city,
            suburb,
            town,
            profile_picture_url,
            email
          )
        `);

      if (userRole !== 'admin') {
        query = query.eq('profile_approved', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      setNannies(data || []);
    } catch (error) {
      console.error('Error fetching nannies:', error);
      toast({
        title: "Error",
        description: "Failed to load nannies",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingInterests = async () => {
    if (!user) return;

    try {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientData) {
        const { data: interests } = await supabase
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
          .eq('client_id', clientData.id);

        setExistingInterests(interests || []);
      } else {
        setExistingInterests([]);
      }
    } catch (error) {
      console.error('Error fetching existing interests:', error);
    }
  };

  const isProfileComplete = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone, city')
        .eq('id', userId)
        .single();

      if (error || !data) return false;

      return !!(
        data.first_name &&
        data.last_name &&
        data.email &&
        data.phone &&
        data.city
      );
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      return false;
    }
  };

  const canExpressInterest = (nannyId: string) => {
    const existingInterest = existingInterests.find(i => i.nanny_id === nannyId);
    return !existingInterest || existingInterest.status === 'declined';
  };

  const getInterestStatusForNanny = (nannyId: string): string | null => {
    const interest = existingInterests.find(i => i.nanny_id === nannyId);
    return interest ? interest.status : null;
  };

  const hasInterestForNanny = (nannyId: string): boolean => {
    return existingInterests.some(i => i.nanny_id === nannyId);
  };

  const handleExpressInterest = async () => {
    if (!selectedNanny || !user) return;

    setSendingInterest(true);
    try {
      const isComplete = await isProfileComplete(user.id);
      if (!isComplete) {
        toast({
          title: "Incomplete Profile",
          description: "Please complete your profile (name, email, phone, and city are required) before sending an interest. Go to your profile page to update it.",
          variant: "destructive",
        });
        setSendingInterest(false);
        return;
      }

      let clientId;
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({ user_id: user.id })
          .select('id')
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      const { data: clientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single();

      if (profileError || !clientProfile) throw new Error('Failed to fetch client profile');

      const { data: existingInterest, error: checkError } = await supabase
        .from('interests')
        .select('id')
        .eq('client_id', clientId)
        .eq('nanny_id', selectedNanny.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existingInterest) {
        toast({
          title: "Interest Already Sent",
          description: "You have already expressed interest in this nanny. Please wait for their response or contact admin.",
          variant: "destructive"
        });
        setSelectedNanny(null);
        setSendingInterest(false);
        return;
      }

      const { error } = await supabase
        .from('interests')
        .insert({
          client_id: clientId,
          nanny_id: selectedNanny.id,
          message: interestMessage || null,
          status: 'pending',
          created_at: new Date().toISOString(),
          admin_approved: false,
          nanny_response: null,
          payment_status: null,
          client_first_name: clientProfile.first_name,
          client_last_name: clientProfile.last_name,
          client_email: clientProfile.email,
          nanny_first_name: selectedNanny.profiles.first_name,
          nanny_last_name: selectedNanny.profiles.last_name,
          nanny_email: selectedNanny.profiles.email,
        });

      if (error) throw error;

      const nannyEmailParams = {
        serviceID: "service_syqn4ol",
        templateID: "template_exkrbne",
        publicKey: "rK97vwvxnXTTY8PjW",
        templateParams: {
          name: `${selectedNanny.profiles.first_name} ${selectedNanny.profiles.last_name || ''}`,
          email: selectedNanny.profiles.email,
          subject: 'New Client Interest - Nanny Placements SA',
          message: `You have received a new interest request from a client.\n\nClient Message: "${interestMessage}"\n\nPlease log in to your nanny dashboard to approve or decline this request.\n\nBest regards,\nNanny Placements SA Team`,
          to_email: selectedNanny.profiles.email,
        }
      };
      await emailjs.send(nannyEmailParams.serviceID, nannyEmailParams.templateID, nannyEmailParams.templateParams, nannyEmailParams.publicKey);

      const clientEmailParams = {
        serviceID: "service_syqn4ol",
        templateID: "template_exkrbne",
        publicKey: "rK97vwvxnXTTY8PjW",
        templateParams: {
          name: `${clientProfile.first_name} ${clientProfile.last_name || ''}`,
          email: clientProfile.email,
          subject: 'Interest Submitted - Nanny Placements SA',
          message: `You have successfully expressed interest in ${selectedNanny.profiles.first_name} ${selectedNanny.profiles.last_name || ''}.\n\nPlease log in to your account to approve or decline this interest once the nanny responds.\n\nBest regards,\nNanny Placements SA Team`,
          to_email: clientProfile.email,
        }
      };
      await emailjs.send(clientEmailParams.serviceID, clientEmailParams.templateID, clientEmailParams.templateParams, clientEmailParams.publicKey);

      toast({
        title: "Interest Sent!",
        description: "The nanny will be notified of your interest and can approve or decline it.",
      });

      setSelectedNanny(null);
      setInterestMessage('');
      fetchExistingInterests();
    } catch (error: any) {
      console.error('Error expressing interest:', error.message);
      toast({
        title: "Error",
        description: error.message || "Failed to express interest",
        variant: "destructive"
      });
    } finally {
      setSendingInterest(false);
    }
  };

  const handleManualRefresh = () => {
    setRefreshCount(prev => prev + 1);
    fetchExistingInterests();
  };

  const calculateAge = (dateOfBirth: string | null): number | null => {
    if (!dateOfBirth) return null;
    try {
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) return null; // Invalid date
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--; // Birthday hasn't occurred this year
      }
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return null;
    }
  };

  const handleAutoMatch = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to use Auto Match.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: clientData } = await supabase
        .from('clients')
        .select('preferred_employment_type, preferred_experience_type, preferred_accommodation_type')
        .eq('user_id', user.id)
        .single();

      if (clientData) {
        const newFilters = {
          ...filters,
          employmentType: clientData.preferred_employment_type || '',
          experienceType: clientData.preferred_experience_type || '',
          accommodationPreference: clientData.preferred_accommodation_type === 'stay_out' ? 'live_out' : clientData.preferred_accommodation_type || ''
        };

        // Count matching profiles
        const matchingNannies = nannies.filter(nanny => {
          if (newFilters.employmentType && newFilters.employmentType !== 'all' && nanny.employment_type !== newFilters.employmentType) {
            return false;
          }
          if (newFilters.experienceType && newFilters.experienceType !== 'all' && nanny.experience_type !== newFilters.experienceType) {
            return false;
          }
          if (newFilters.accommodationPreference && newFilters.accommodationPreference !== 'all' && nanny.accommodation_preference !== newFilters.accommodationPreference) {
            return false;
          }
          return true;
        });

        setFilters(newFilters);

        if (matchingNannies.length > 0) {
          toast({
            title: "Auto Match Applied",
            description: `Found ${matchingNannies.length} matching profile${matchingNannies.length === 1 ? '' : 's'}.`,
          });
        } else {
          toast({
            title: "No Matches Found",
            description: "No profiles match your preferences. Showing default profiles in 5 seconds.",
            variant: "destructive"
          });
          timeoutRef.current = setTimeout(() => {
            setFilters({
              city: '',
              experienceType: '',
              employmentType: '',
              accommodationPreference: '',
              maxRate: '',
              languages: [],
              education: '',
              experienceDuration: '',
              ageRange: ''
            });
            toast({
              title: "Showing All Profiles",
              description: "Default profiles are now displayed.",
            });
          }, 5000);
        }
      } else {
        toast({
          title: "No Preferences Found",
          description: "Please set your preferences in your profile.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching client preferences:', error);
      toast({
        title: "Error",
        description: "Failed to apply auto match.",
        variant: "destructive"
      });
    }
  };

  const handleLanguageChange = (lang: string) => {
    setFilters(prev => {
      const newLanguages = prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang];
      return { ...prev, languages: newLanguages };
    });
  };

  const filteredNannies = nannies.filter(nanny => {
    if (filters.city && !nanny.profiles.city?.toLowerCase().includes(filters.city.toLowerCase())) {
      return false;
    }
    if (filters.experienceType && filters.experienceType !== 'all' && nanny.experience_type !== filters.experienceType) {
      return false;
    }
    if (filters.employmentType && filters.employmentType !== 'all' && nanny.employment_type !== filters.experienceType) {
      return false;
    }
    if (filters.accommodationPreference && filters.accommodationPreference !== 'all' && nanny.accommodation_preference !== filters.accommodationPreference) {
      return false;
    }
    if (filters.maxRate && nanny.hourly_rate && nanny.hourly_rate > parseFloat(filters.maxRate)) {
      return false;
    }
    if (filters.languages.length > 0 && nanny.languages && !filters.languages.every(lang => nanny.languages?.includes(lang))) {
      return false;
    }
    if (filters.education && filters.education !== 'all' && nanny.education_level !== filters.education) {
      return false;
    }
    if (filters.experienceDuration && filters.experienceDuration !== 'all') {
      const selectedDuration = parseInt(filters.experienceDuration);
      if (nanny.experience_duration !== selectedDuration) {
        return false;
      }
    }
    if (filters.ageRange && filters.ageRange !== 'all') {
      const selectedRange = ageRanges.find(range => range.label === filters.ageRange);
      if (!selectedRange) return false;
      const age = calculateAge(nanny.date_of_birth);
      if (age === null || age < selectedRange.min || age > selectedRange.max) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading nannies...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Find Your Perfect Nanny</h1>
        <p className="text-muted-foreground">
          Browse verified, trained nannies in your area
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filter Nannies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Search by city"
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="experience">Experience Type</Label>
              <Select value={filters.experienceType} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any experience</SelectItem>
                  <SelectItem value="nanny">Nanny only</SelectItem>
                  <SelectItem value="cleaning">Cleaning only</SelectItem>
                  <SelectItem value="both">Both nanny & cleaning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="employment">Employment Type</Label>
              <Select value={filters.employmentType} onValueChange={(value) => setFilters(prev => ({ ...prev, employmentType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any employment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any employment type</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="full_time">Full Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="accommodation">Accommodation</Label>
              <Select value={filters.accommodationPreference} onValueChange={(value) => setFilters(prev => ({ ...prev, accommodationPreference: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any accommodation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any accommodation</SelectItem>
                  <SelectItem value="live_in">Live In</SelectItem>
                  <SelectItem value="live_out">Live Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rate">Max Rate (R/hour)</Label>
              <Input
                id="rate"
                type="number"
                placeholder="Max hourly rate"
                value={filters.maxRate}
                onChange={(e) => setFilters(prev => ({ ...prev, maxRate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="ageRange">Age Range</Label>
              <Select value={filters.ageRange} onValueChange={(value) => setFilters(prev => ({ ...prev, ageRange: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any age</SelectItem>
                  {ageRanges.map(range => (
                    <SelectItem key={range.label} value={range.label}>{range.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
            <div>
              <Label htmlFor="education">Education Level</Label>
              <Select value={filters.education} onValueChange={(value) => setFilters(prev => ({ ...prev, education: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any education" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any education</SelectItem>
                  {educationOptions.map(edu => (
                    <SelectItem key={edu} value={edu}>{edu.charAt(0).toUpperCase() + edu.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="experienceDuration">Experience Duration</Label>
              <Select value={filters.experienceDuration} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceDuration: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any duration</SelectItem>
                  {experienceDurationOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Languages</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                {languagesOptions.map(lang => (
                  <div key={lang} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`lang-${lang}`}
                      checked={filters.languages.includes(lang)}
                      onChange={() => handleLanguageChange(lang)}
                      className="h-4 w-4"
                    />
                    <label htmlFor={`lang-${lang}`} className="text-sm">{lang}</label>
                  </div>
                ))}
              </div>
          </div>
          <Button onClick={handleAutoMatch} className="mt-4">
            Auto Match
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNannies.map((nanny) => (
          <Card key={nanny.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {nanny.profiles.profile_picture_url ? (
                  <img 
                    src={nanny.profiles.profile_picture_url}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Heart className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{nanny.profiles.first_name || ''} {nanny.profiles.last_name || ''}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {nanny.profiles.city || ''}{nanny.profiles.town ? `, ${nanny.profiles.town}` : ''}
                  </p>
                  {nanny.date_of_birth && (
                    <p className="text-xs text-muted-foreground">
                      Age: {calculateAge(nanny.date_of_birth)} years
                    </p>
                  )}
                  {nanny.accommodation_preference && (
                    <p className="text-xs text-muted-foreground capitalize">
                      {nanny.accommodation_preference.replace('_', ' ')} • {nanny.employment_type?.replace('_', ' ') || ''}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{nanny.profiles.first_name || ''} {nanny.profiles.last_name || ''}</h3>
                  <p className="text-muted-foreground">
                    {nanny.profiles.city || ''}{nanny.profiles.town ? `, ${nanny.profiles.town}` : ''}
                  </p>
                  {nanny.date_of_birth && (
                    <p className="text-sm text-muted-foreground">
                      Age: {calculateAge(nanny.date_of_birth)} years • 
                      {nanny.accommodation_preference && (
                        <span className="capitalize ml-1">
                          {nanny.accommodation_preference.replace('_', ' ')} • {nanny.employment_type?.replace('_', ' ') || ''}
                        </span>
                      )}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {getExperienceLabel(nanny.experience_duration)} - {nanny.experience_type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">R{nanny.hourly_rate || 0}/hour</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {nanny.academy_completed && (
                      <Badge variant="secondary">Academy Complete</Badge>
                    )}
                    {nanny.criminal_check_status === 'approved' && (
                      <Badge variant="default">Criminal Check ✓</Badge>
                    )}
                    {nanny.credit_check_status === 'approved' && (
                      <Badge variant="default">Credit Check ✓</Badge>
                    )}
                    {nanny.profile_approved && (
                      <Badge variant="default">Profile Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              {nanny.bio && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {nanny.bio}
                </p>
              )}

              <div className="mt-3">
                <p className="text-sm font-medium mb-1">Languages:</p>
                <div className="flex flex-wrap gap-1">
                  {(nanny.languages || []).slice(0, 3).map((lang, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                  {(nanny.languages || []).length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{(nanny.languages || []).length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button 
                  variant="outline"
                  onClick={() => setSelectedNanny(nanny)}
                >
                  View Profile
                </Button>
                {user && hasRole && (
                  <>
                    <Button 
                      className="flex-1"
                      onClick={() => setSelectedNanny(nanny)}
                      disabled={!canExpressInterest(nanny.id)}
                    >
                      {canExpressInterest(nanny.id) ? 'Express Interest' : 'Interest Pending'}
                    </Button>
                    {hasInterestForNanny(nanny.id) && getInterestStatusForNanny(nanny.id) === 'approved' && (
                      <Button 
                        className="flex-1"
                        variant="default"
                      >
                        Pay
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNannies.length === 0 && (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No nannies found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or check back later for new profiles.
          </p>
        </div>
      )}

      <Dialog open={!!selectedNanny} onOpenChange={() => setSelectedNanny(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nanny Profile - {selectedNanny?.profiles.first_name || ''}</DialogTitle>
            <DialogDescription>
              Detailed profile information
            </DialogDescription>
          </DialogHeader>
          
          {selectedNanny && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                {selectedNanny.profiles.profile_picture_url && (
                  <img
                    src={selectedNanny.profiles.profile_picture_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{selectedNanny.profiles.first_name || ''} {selectedNanny.profiles.last_name || ''}</h3>
                  <p className="text-muted-foreground">
                    {selectedNanny.profiles.city || ''}{selectedNanny.profiles.town ? `, ${selectedNanny.profiles.town}` : ''}{selectedNanny.profiles.suburb ? `, ${selectedNanny.profiles.suburb}` : ''}
                  </p>
                  <div className="flex gap-4 mt-1">
                    <p className="text-xl font-semibold text-primary">R{selectedNanny.hourly_rate || 0}/hour</p>
                    {selectedNanny.date_of_birth && (
                      <p className="text-lg text-muted-foreground">
                        Age: {calculateAge(selectedNanny.date_of_birth)} years
                      </p>
                    )}
                  </div>
                  {selectedNanny.accommodation_preference && (
                    <p className="text-sm text-muted-foreground capitalize mt-1">
                      Prefers {selectedNanny.accommodation_preference.replace('_', ' ')} position
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedNanny.academy_completed && (
                      <Badge variant="secondary">Academy Complete</Badge>
                    )}
                    {selectedNanny.criminal_check_status === 'approved' && (
                      <Badge variant="default">Criminal Check ✓</Badge>
                    )}
                    {selectedNanny.criminal_check_status === 'approved' && (
                      <Badge variant="default">Credit Check ✓</Badge>
                    )}
                    {selectedNanny.profile_approved && (
                      <Badge variant="default">Profile Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedNanny.bio && (
                <div>
                  <h4 className="font-semibold mb-2">About Me</h4>
                  <p className="text-muted-foreground">{selectedNanny.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Experience</h4>
                  <p className="capitalize">{selectedNanny.experience_type}</p>
                  {selectedNanny.experience_duration !== null && (
                    <p className="text-sm text-muted-foreground">{getExperienceLabel(selectedNanny.experience_duration)}</p>
                  )}
                </div>
                {selectedNanny.education_level && (
                  <div>
                    <h4 className="font-semibold mb-2">Education</h4>
                    <p className="capitalize">{selectedNanny.education_level}</p>
                  </div>
                )}
                {(selectedNanny.languages || []).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Languages</h4>
                    <p>{(selectedNanny.languages || []).join(', ')}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Training & Certifications</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`flex items-center gap-2 ${selectedNanny.training_first_aid ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {selectedNanny.training_first_aid ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    First Aid
                  </div>
                  <div className={`flex items-center gap-2 ${selectedNanny.training_cpr ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {selectedNanny.training_cpr ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    CPR
                  </div>
                  <div className={`flex items-center gap-2 ${selectedNanny.training_nanny ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {selectedNanny.training_nanny ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    Nanny Training
                  </div>
                  <div className={`flex items-center gap-2 ${selectedNanny.training_child_development ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {selectedNanny.training_child_development ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    Child Development
                  </div>
                </div>
              </div>

              {selectedNanny.interview_video_url && (
                <div>
                  <h4 className="font-semibold mb-2">Introduction Video</h4>
                  <video
                    controls
                    className="w-full max-w-md rounded-lg"
                    src={selectedNanny.interview_video_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {user && hasRole && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Express Interest</h4>
                  <div className="space-y-3">
                    <textarea
                      className="w-full p-3 border rounded-md resize-none"
                      rows={3}
                      value={interestMessage}
                      onChange={(e) => setInterestMessage(e.target.value)}
                      placeholder="Tell the nanny about your family and what you're looking for..."
                    />
                    {!isProfileComplete(user.id) && (
                      <div className="text-sm text-red-600">
                        Please complete your profile (name, email, phone, and city are required) to send an interest.{' '}
                        <a href="/profile" className="underline">Complete Profile</a>
                      </div>
                    )}
                    <Button 
                      onClick={handleExpressInterest} 
                      disabled={sendingInterest || !interestMessage.trim() || !canExpressInterest(selectedNanny.id) || !isProfileComplete(user.id)}
                      className="w-full"
                    >
                      {sendingInterest ? 'Sending...' : canExpressInterest(selectedNanny.id) ? 'Express Interest' : 'Interest Pending'}
                    </Button>
                    {hasInterestForNanny(selectedNanny.id) && getInterestStatusForNanny(selectedNanny.id) === 'approved' && (
                      <Button className="w-full mt-2" variant="default">
                        Pay
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedNanny(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
