// pages/ClientDashboard.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, CreditCard, Calendar, User, MapPin, Clock, DollarSign, Eye, Edit, ArrowRight,
  AlertTriangle, CheckCircle, Briefcase, Home, Phone, Mail, Sparkles, Filter, X,
  Baby, Brush, Users, BriefcaseBusiness, Mic, FileText, Search, ChevronDown, ChevronUp,
  ClipboardCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

interface ClientProfile {
  id: string;
  user_id: string;
  description: string | null;
  preferred_employment_type: 'full_time' | 'part_time' | null;
  preferred_experience_type: 'nanny' | 'cleaning' | 'both' | 'general_worker' | 'promoter' | 'admin_assistant' | null;
  preferred_accommodation_type: 'live_in' | 'stay_out' | null;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  suburb: string | null;
}

interface Interest {
  id: string;
  message: string;
  nanny_response: string;
  payment_status: string;
  admin_approved: boolean;
  created_at: string;
  nanny_id: string;
  client_id: string;
  nannies: {
    user_id: string;
    bio: string;
    experience_type: string;
    experience_duration: number;
    hourly_rate: number;
    languages: string[];
    profiles: {
      first_name: string;
      last_name: string;
      email: string;
      city: string;
      suburb: string;
      phone: string | null;
      profile_picture_url?: string;
    };
  };
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_method: string;
  nanny_id: string;
  transaction_id: string | null;
}

// Experience type options with icons and colors - ALL TYPES
const EXPERIENCE_TYPE_FILTERS = [
  { value: 'all', label: 'All Types', icon: Users, color: 'bg-gray-500' },
  { value: 'nanny', label: 'Nanny', icon: Baby, color: 'bg-blue-500' },
  { value: 'cleaning', label: 'Cleaner', icon: Brush, color: 'bg-green-500' },
  { value: 'both', label: 'Nanny & Cleaner', icon: Users, color: 'bg-purple-500' },
  { value: 'general_worker', label: 'General Worker', icon: BriefcaseBusiness, color: 'bg-orange-500' },
  { value: 'promoter', label: 'Promoter', icon: Mic, color: 'bg-pink-500' },
  { value: 'admin_assistant', label: 'Admin Assistant', icon: ClipboardCheck, color: 'bg-indigo-500' },
];

// All experience types for preferences
const ALL_EXPERIENCE_TYPES = [
  { value: 'nanny', label: 'Nanny Only' },
  { value: 'cleaning', label: 'Cleaning Only' },
  { value: 'both', label: 'Both Nanny & Cleaning' },
  { value: 'general_worker', label: 'General Worker' },
  { value: 'promoter', label: 'Promoter' },
  { value: 'admin_assistant', label: 'Admin Assistant' },
];

// Helper function to get missing client requirements
const getMissingClientRequirements = (userProfile: UserProfile | null, clientProfile: ClientProfile | null): string[] => {
  const missing: string[] = [];
  
  if (!userProfile?.first_name) missing.push('First Name');
  if (!userProfile?.last_name) missing.push('Last Name');
  if (!userProfile?.phone) missing.push('Phone Number');
  if (!userProfile?.city) missing.push('City');
  if (!clientProfile?.preferred_employment_type) missing.push('Preferred Employment Type');
  if (!clientProfile?.preferred_experience_type) missing.push('Preferred Experience Type');
  if (!clientProfile?.preferred_accommodation_type) missing.push('Preferred Accommodation Type');
  
  return missing;
};

// Helper function to get missing preferences for Auto Match
const getMissingPreferences = (clientProfile: ClientProfile | null): string[] => {
  const missing: string[] = [];
  
  if (!clientProfile?.preferred_employment_type) missing.push('Employment Type');
  if (!clientProfile?.preferred_experience_type) missing.push('Experience Type');
  if (!clientProfile?.preferred_accommodation_type) missing.push('Accommodation Type');
  
  return missing;
};

// Helper to get experience type display name
const getExperienceTypeDisplay = (type: string): string => {
  switch (type) {
    case 'nanny': return 'Nanny';
    case 'cleaning': return 'Cleaner';
    case 'both': return 'Nanny & Cleaner';
    case 'general_worker': return 'General Worker';
    case 'promoter': return 'Promoter';
    case 'admin_assistant': return 'Admin Assistant';
    default: return 'Unknown';
  }
};

export default function ClientDashboard() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [editedUserProfile, setEditedUserProfile] = useState<UserProfile | null>(null);
  const [editedClientProfile, setEditedClientProfile] = useState<ClientProfile | null>(null);
  
  // Filter states
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filteredInterests, setFilteredInterests] = useState<Interest[]>([]);

  useEffect(() => {
    if (user && userRole === 'client') {
      fetchData();
    }
  }, [user, userRole]);

  useEffect(() => {
    setEditedUserProfile(userProfile);
    setEditedClientProfile(clientProfile);
  }, [userProfile, clientProfile]);

  // Apply filter whenever interests or selectedFilter changes
  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredInterests(interests);
    } else {
      setFilteredInterests(
        interests.filter(interest => 
          interest.nannies?.experience_type === selectedFilter
        )
      );
    }
  }, [interests, selectedFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (client) setClientProfile(client);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profile) setUserProfile(profile);

      const { data: clientInterests } = await supabase
        .from('interests')
        .select(`
          *,
          nannies (
            user_id,
            bio,
            experience_type,
            experience_duration,
            hourly_rate,
            languages,
            profiles (
              first_name,
              last_name,
              email,
              city,
              suburb,
              phone,
              profile_picture_url
            )
          )
        `)
        .eq('client_id', client?.id || '')
        .order('created_at', { ascending: false });

      if (clientInterests) {
        const processed = clientInterests.map((i: any) => ({
          ...i,
          nanny_response: i.nanny_response || 'pending',
          payment_status: i.payment_status || 'pending',
          admin_approved: i.admin_approved || false
        }));
        setInterests(processed);
        setFilteredInterests(processed);
      }

      const { data: clientPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', client?.id || '')
        .order('created_at', { ascending: false });

      if (clientPayments) setPayments(clientPayments);

    } catch (error: any) {
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

  const handleSaveProfile = async () => {
    try {
      if (editedUserProfile) {
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: editedUserProfile.first_name,
            last_name: editedUserProfile.last_name,
            phone: editedUserProfile.phone,
            city: editedUserProfile.city,
            suburb: editedUserProfile.suburb,
          })
          .eq('id', user?.id);

        if (error) throw error;
        setUserProfile(editedUserProfile);
      }

      if (editedClientProfile && clientProfile) {
        const { error } = await supabase
          .from('clients')
          .update({
            description: editedClientProfile.description,
            preferred_employment_type: editedClientProfile.preferred_employment_type,
            preferred_experience_type: editedClientProfile.preferred_experience_type,
            preferred_accommodation_type: editedClientProfile.preferred_accommodation_type,
          })
          .eq('user_id', user?.id);

        if (error) throw error;
        setClientProfile(editedClientProfile);
      }

      setIsEditing(false);
      setIsEditingPreferences(false);
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update profile", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved': return <Badge className="bg-green-500">Accepted</Badge>;
      case 'declined': return <Badge variant="destructive">Declined</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500">Paid</Badge>;
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getExperienceIcon = (type: string) => {
    const filter = EXPERIENCE_TYPE_FILTERS.find(f => f.value === type);
    if (filter) {
      const Icon = filter.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <Users className="h-4 w-4" />;
  };

  const getFilterCount = (type: string) => {
    if (type === 'all') return interests.length;
    return interests.filter(i => i.nannies?.experience_type === type).length;
  };

  if (userRole !== 'client') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">This page is only accessible to clients.</p>
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

  const missingRequirements = getMissingClientRequirements(userProfile, clientProfile);
  const missingPreferences = getMissingPreferences(clientProfile);
  const isProfileComplete = missingRequirements.length === 0;
  const hasPreferences = missingPreferences.length === 0;
  const canUseAutoMatch = isProfileComplete && hasPreferences;

  const selectedFilterData = EXPERIENCE_TYPE_FILTERS.find(f => f.value === selectedFilter);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Client Dashboard</h1>
        <p className="text-muted-foreground">Manage your nanny search and bookings</p>
      </div>

      {/* ENHANCED INCOMPLETE PROFILE BANNER */}
      {!isProfileComplete && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800 mb-2">
                Complete your profile to find the best matches!
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
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-yellow-700 font-medium underline"
                    onClick={() => setIsEditing(true)}
                  >
                    Click here to complete your profile →
                  </Button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUTO MATCH READINESS BANNER */}
      {isProfileComplete && !hasPreferences && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800 mb-2">
                Set your preferences to use Auto Match!
              </p>
              <p className="text-sm text-blue-700 mb-2">
                Tell us what kind of worker you're looking for:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {missingPreferences.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    <span className="text-sm text-blue-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-blue-200">
                <p className="text-xs text-blue-600">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-blue-700 font-medium underline"
                    onClick={() => setIsEditingPreferences(true)}
                  >
                    Set your preferences now →
                  </Button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* READY FOR AUTO MATCH BANNER */}
      {canUseAutoMatch && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">
                ✓ Your profile is complete! You can now use Auto Match.
              </p>
              <p className="text-sm text-green-700 mt-1">
                Go to any "Find" page and click the "Auto Match" button to find workers that match your preferences.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{interests.length}</p>
                    <p className="text-sm text-muted-foreground">Interests Sent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{payments.filter(p => p.status === 'completed').length}</p>
                    <p className="text-sm text-muted-foreground">Payments Made</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{interests.filter(i => i.payment_status === 'completed').length}</p>
                    <p className="text-sm text-muted-foreground">Contact Details Unlocked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interests Card with Filter */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Expressed Interests
                  </CardTitle>
                  <CardDescription>Track your interest requests</CardDescription>
                </div>
                
                {/* Filter Button with Badge */}
                <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                      {selectedFilter !== 'all' && (
                        <Badge variant="default" className="ml-1 bg-primary text-white">
                          {getFilterCount(selectedFilter)}
                        </Badge>
                      )}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filter by Experience Type
                      </DialogTitle>
                      <DialogDescription>
                        Select an experience type to filter your interests
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                      {EXPERIENCE_TYPE_FILTERS.map((filter) => {
                        const Icon = filter.icon;
                        const count = getFilterCount(filter.value);
                        const isSelected = selectedFilter === filter.value;
                        
                        return (
                          <Button
                            key={filter.value}
                            variant={isSelected ? 'default' : 'ghost'}
                            className={`w-full justify-start gap-3 py-6 ${
                              isSelected ? 'bg-primary text-white' : 'hover:bg-gray-100'
                            }`}
                            onClick={() => {
                              setSelectedFilter(filter.value);
                              setShowFilterModal(false);
                            }}
                          >
                            <div className={`p-2 rounded-lg ${filter.color} text-white`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="flex-1 text-left">{filter.label}</span>
                            <Badge variant={isSelected ? 'secondary' : 'outline'} className={isSelected ? 'bg-white/20 text-white' : ''}>
                              {count}
                            </Badge>
                          </Button>
                        );
                      })}
                      
                      {selectedFilter !== 'all' && (
                        <Button 
                          variant="ghost" 
                          className="w-full justify-center text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setSelectedFilter('all');
                            setShowFilterModal(false);
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Filter
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Active Filter Display */}
              {selectedFilter !== 'all' && selectedFilterData && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 py-1.5">
                    {selectedFilterData.icon && <selectedFilterData.icon className="h-3 w-3" />}
                    {selectedFilterData.label}
                    <button
                      onClick={() => setSelectedFilter('all')}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {filteredInterests.length} {filteredInterests.length === 1 ? 'result' : 'results'}
                  </span>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              {filteredInterests.length === 0 ? (
                <div className="text-center py-8">
                  {selectedFilter !== 'all' ? (
                    <>
                      <div className="flex justify-center mb-4">
                        <div className="p-4 bg-gray-100 rounded-full">
                          {selectedFilterData?.icon && <selectedFilterData.icon className="h-8 w-8 text-gray-400" />}
                        </div>
                      </div>
                      <p className="text-muted-foreground">No {selectedFilterData?.label} interests yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Try changing your filter or find new workers</p>
                    </>
                  ) : (
                    <>
                      <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No interests expressed yet</p>
                      <Link to="/">
                        <Button className="mt-4">Find Workers</Button>
                      </Link>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInterests.map((interest) => {
                    const workerFirstName = interest.nannies.profiles.first_name;
                    const isApproved = interest.nanny_response === 'approved';
                    const isPaid = interest.payment_status === 'completed';
                    const experienceType = interest.nannies.experience_type;
                    const expDisplay = getExperienceTypeDisplay(experienceType);
                    const filterIcon = EXPERIENCE_TYPE_FILTERS.find(f => f.value === experienceType);
                    const IconComponent = filterIcon?.icon || Users;

                    return (
                      <div key={interest.id} className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="text-xl font-bold text-gray-900">
                                {workerFirstName}
                              </p>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <IconComponent className="h-3 w-3" />
                                {expDisplay}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Interest sent on {new Date(interest.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {getStatusBadge(interest.nanny_response)}
                        </div>

                        {isApproved && !isPaid && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <p className="font-medium text-yellow-800 mb-2">
                              🎉 Approved! Ready for Payment
                            </p>
                            <p className="text-sm text-yellow-700">
                              {workerFirstName} has approved your interest request.
                            </p>
                            <Link to={`/find-${experienceType}`}>
                              <Button className="mt-3 w-full">
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Go to Complete Payment
                              </Button>
                            </Link>
                          </div>
                        )}

                        {isPaid && (
                          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-400 rounded-xl p-6 text-center">
                            <p className="text-2xl font-bold text-emerald-800 mb-2">
                              ✓ Contact Details Unlocked!
                            </p>
                            <p className="text-emerald-700 font-medium">
                              {workerFirstName}'s full contact details have been sent to your email.
                            </p>
                            <p className="text-sm text-emerald-600 mt-3">
                              Check your email for {workerFirstName}'s phone number and email address.
                              You can now arrange your interview directly.
                            </p>
                          </div>
                        )}

                        {!isApproved && interest.nanny_response === 'pending' && (
                          <div className="text-center py-4">
                            <p className="text-amber-700 font-medium flex items-center justify-center gap-2">
                              <Clock className="h-5 w-5" />
                              Waiting for {workerFirstName} to accept your request...
                            </p>
                          </div>
                        )}

                        {interest.nanny_response === 'declined' && (
                          <div className="text-center py-4">
                            <p className="text-red-600 font-semibold">
                              {workerFirstName} has declined your request
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Don't be discouraged! There are many other workers available.
                            </p>
                            <Link to="/find-nanny">
                              <Button variant="outline" className="mt-3">
                                Browse More Workers
                              </Button>
                            </Link>
                          </div>
                        )}

                        {interest.message && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">Your Message:</p>
                            <p className="text-sm text-gray-600 mt-1">"{interest.message}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>All your successful payments</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payments yet</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium">R{p.amount.toFixed(2)} - Worker Contact Unlock</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString('en-ZA', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {p.transaction_id && (
                          <p className="text-xs text-muted-foreground">
                            Transaction ID: {p.transaction_id}
                          </p>
                        )}
                      </div>
                      {getPaymentStatusBadge(p.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Profile
              </CardTitle>
              {!isProfileComplete && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  Incomplete
                </Badge>
              )}
              {isProfileComplete && (
                <Badge className="bg-green-500">Complete</Badge>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="first-name">First Name *</Label>
                    <Input 
                      id="first-name"
                      value={editedUserProfile?.first_name || ''} 
                      onChange={(e) => setEditedUserProfile(prev => ({ ...prev!, first_name: e.target.value }))} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-name">Last Name *</Label>
                    <Input 
                      id="last-name"
                      value={editedUserProfile?.last_name || ''} 
                      onChange={(e) => setEditedUserProfile(prev => ({ ...prev!, last_name: e.target.value }))} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input 
                      id="phone"
                      value={editedUserProfile?.phone || ''} 
                      onChange={(e) => setEditedUserProfile(prev => ({ ...prev!, phone: e.target.value }))} 
                      placeholder="+27 82 123 4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input 
                      id="city"
                      value={editedUserProfile?.city || ''} 
                      onChange={(e) => setEditedUserProfile(prev => ({ ...prev!, city: e.target.value }))} 
                      placeholder="Cape Town"
                    />
                  </div>
                  <div>
                    <Label htmlFor="suburb">Suburb</Label>
                    <Input 
                      id="suburb"
                      value={editedUserProfile?.suburb || ''} 
                      onChange={(e) => setEditedUserProfile(prev => ({ ...prev!, suburb: e.target.value }))} 
                      placeholder="Sea Point"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveProfile}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-lg">{userProfile?.first_name} {userProfile?.last_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {userProfile?.email}</p>
                  </div>
                  
                  {userProfile?.phone && (
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</p>
                      <p className="text-sm text-muted-foreground">{userProfile.phone}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</p>
                    <p className="text-sm text-muted-foreground">
                      {userProfile?.suburb ? `${userProfile.suburb}, ` : ''}{userProfile?.city || 'Not specified'}
                    </p>
                  </div>
                  
                  <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preferences Card - UPDATED with ALL experience types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Your Preferences
              </CardTitle>
              <CardDescription>Used for Auto Match feature</CardDescription>
              {!hasPreferences && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  Set Preferences
                </Badge>
              )}
              {hasPreferences && (
                <Badge className="bg-green-500">Set</Badge>
              )}
            </CardHeader>
            <CardContent>
              {isEditingPreferences ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="preferred_employment_type">Preferred Employment Type *</Label>
                    <Select 
                      value={editedClientProfile?.preferred_employment_type || ''} 
                      onValueChange={(value) => setEditedClientProfile(prev => ({ ...prev!, preferred_employment_type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="preferred_experience_type">Preferred Experience Type *</Label>
                    <Select 
                      value={editedClientProfile?.preferred_experience_type || ''} 
                      onValueChange={(value) => setEditedClientProfile(prev => ({ ...prev!, preferred_experience_type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_EXPERIENCE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="preferred_accommodation_type">Preferred Accommodation Type *</Label>
                    <Select 
                      value={editedClientProfile?.preferred_accommodation_type || ''} 
                      onValueChange={(value) => setEditedClientProfile(prev => ({ ...prev!, preferred_accommodation_type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select accommodation type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="live_in">Live In</SelectItem>
                        <SelectItem value="stay_out">Stay Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Family Description (Optional)</Label>
                    <Textarea 
                      id="description"
                      value={editedClientProfile?.description || ''} 
                      onChange={(e) => setEditedClientProfile(prev => ({ ...prev!, description: e.target.value }))} 
                      placeholder="Tell workers about your family, children, and what you're looking for..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveProfile}>Save Preferences</Button>
                    <Button variant="outline" onClick={() => setIsEditingPreferences(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Employment Type</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {clientProfile?.preferred_employment_type?.replace('_', ' ') || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Experience Type</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {clientProfile?.preferred_experience_type ? getExperienceTypeDisplay(clientProfile.preferred_experience_type) : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Accommodation Type</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {clientProfile?.preferred_accommodation_type === 'stay_out' ? 'Stay Out' : clientProfile?.preferred_accommodation_type || 'Not set'}
                    </p>
                  </div>
                  {clientProfile?.description && (
                    <div>
                      <p className="text-sm font-medium">About Your Family</p>
                      <p className="text-sm text-muted-foreground">{clientProfile.description}</p>
                    </div>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => setIsEditingPreferences(true)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit Preferences
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
  <CardHeader>
    <CardTitle>Quick Actions</CardTitle>
    <CardDescription>Manage your worker search</CardDescription>
  </CardHeader>
  <CardContent className="space-y-3">
    <Link to="/">
      <Button className="w-full justify-start">
        <Users className="h-4 w-4 mr-2" />
        Find Workers
      </Button>
    </Link>
    
    {canUseAutoMatch && (
      <Link to="/find-nanny">
        <Button variant="default" className="w-full justify-start bg-purple-600 hover:bg-purple-700">
          <Sparkles className="h-4 w-4 mr-2" />
          Try Auto Match
        </Button>
      </Link>
    )}
    
    {interests.filter(i => i.nanny_response === 'approved' && i.payment_status !== 'completed').length > 0 && (
      <Link to="/find-nanny">
        <Button variant="default" className="w-full justify-start bg-green-600 hover:bg-green-700">
          <CreditCard className="h-4 w-4 mr-2" />
          Complete Pending Payments
        </Button>
      </Link>
    )}
    
    {interests.filter(i => i.payment_status === 'completed').length > 0 && (
      <Link to="/find-nanny">
        <Button variant="outline" className="w-full justify-start">
          <Eye className="h-4 w-4 mr-2" />
          View Unlocked Contacts
        </Button>
      </Link>
    )}
  </CardContent>
</Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-blue-800">Email Support</p>
                  <p className="text-sm text-blue-700">admin@nannyplacementssouthafrica.co.za</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Payment Issues?</p>
                  <p className="text-sm text-blue-700">Contact us if you paid but didn't receive contact details</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Interview Tips</p>
                  <ul className="text-sm text-blue-700 space-y-1 mt-1">
                    <li>• Meet in a public area, not in your home</li>
                    <li>• Prepare questions in advance</li>
                    <li>• Discuss expectations clearly</li>
                    <li>• Verify references</li>
                    <li>• Discuss salary and hours upfront</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}