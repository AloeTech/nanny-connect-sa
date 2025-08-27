import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, CreditCard, Calendar, User, MapPin, Clock, DollarSign, Eye, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import PayButton from '@/components/PayButton';
import InterestManagement from '@/components/InterestManagement';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ClientProfile {
  id: string;
  user_id: string;
  description: string | null;
  preferred_employment_type: 'full_time' | 'part_time' | null;
  preferred_experience_type: 'nanny' | 'cleaning' | 'both' | null;
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
}

export default function ClientDashboard() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUserProfile, setEditedUserProfile] = useState<UserProfile | null>(null);
  const [editedClientProfile, setEditedClientProfile] = useState<ClientProfile | null>(null);

  useEffect(() => {
    if (user && userRole === 'client') {
      fetchData();
    }
  }, [user, userRole]);

  useEffect(() => {
    setEditedUserProfile(userProfile);
    setEditedClientProfile(clientProfile);
  }, [userProfile, clientProfile]);

  const fetchData = async () => {
    try {
      // Fetch client profile
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (client) {
        setClientProfile(client);
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

      // Fetch interests with nanny details
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
              suburb
            )
          )
        `)
        .eq('client_id', client?.id || '')
        .order('created_at', { ascending: false });

      if (clientInterests) {
        // Ensure all required fields exist with defaults
        const processedInterests = clientInterests.map((interest: any) => ({
          ...interest,
          nanny_response: interest.nanny_response || 'pending',
          payment_status: interest.payment_status || 'pending',
          admin_approved: interest.admin_approved || false
        }));
        setInterests(processedInterests);
      }

      // Fetch payments
      const { data: clientPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', client?.id || '')
        .order('created_at', { ascending: false });

      if (clientPayments) {
        setPayments(clientPayments);
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

  const handleSaveProfile = async () => {
    try {
      if (editedUserProfile) {
        const { error: userError } = await supabase
          .from('profiles')
          .update({
            first_name: editedUserProfile.first_name,
            last_name: editedUserProfile.last_name,
            phone: editedUserProfile.phone,
            city: editedUserProfile.city,
            suburb: editedUserProfile.suburb,
          })
          .eq('id', user?.id);

        if (userError) throw userError;
        setUserProfile(editedUserProfile);
      }

      if (editedClientProfile) {
        if (clientProfile) {
          const { error: clientError } = await supabase
            .from('clients')
            .update({
              description: editedClientProfile.description,
              preferred_employment_type: editedClientProfile.preferred_employment_type,
              preferred_experience_type: editedClientProfile.preferred_experience_type,
              preferred_accommodation_type: editedClientProfile.preferred_accommodation_type,
            })
            .eq('user_id', user?.id);

          if (clientError) throw clientError;
          setClientProfile(editedClientProfile);
        } else {
          const { data: newClient, error: insertError } = await supabase
            .from('clients')
            .insert({
              user_id: user?.id,
              description: editedClientProfile.description,
              preferred_employment_type: editedClientProfile.preferred_employment_type,
              preferred_experience_type: editedClientProfile.preferred_experience_type,
              preferred_accommodation_type: editedClientProfile.preferred_accommodation_type,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setClientProfile(newClient);
        }
      }

      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      fetchData(); // Refresh data if needed
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. If you encounter a row level security error, ensure RLS policies are set correctly in Supabase for the profiles and clients tables.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-500">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Declined</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (userRole !== 'client') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">This page is only accessible to clients.</p>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Client Dashboard</h1>
        <p className="text-muted-foreground">Manage your nanny search and bookings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
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
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{interests.filter(i => i.admin_approved).length}</p>
                    <p className="text-sm text-muted-foreground">Interviews Scheduled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expressed Interests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Expressed Interests
              </CardTitle>
              <CardDescription>Track your nanny interest requests</CardDescription>
            </CardHeader>
            <CardContent>
              {interests.length === 0 ? (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No interests expressed yet</p>
                  <Link to="/find-nanny">
                    <Button className="mt-4">Find Nannies</Button>
                  </Link>
                </div>
              ) : (
                <InterestManagement 
                  interests={interests}
                  userRole="client"
                  onInterestUpdate={() => fetchData()}
                />
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>Your booking and interview payments</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No payments made yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center border rounded-lg p-4">
                      <div>
                        <p className="font-medium">R{payment.amount}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                        {payment.payment_method && (
                          <p className="text-xs text-muted-foreground">via {payment.payment_method}</p>
                        )}
                      </div>
                      {getPaymentStatusBadge(payment.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={editedUserProfile?.first_name || ''}
                      onChange={(e) => setEditedUserProfile(prev => ({ ...prev!, first_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={editedUserProfile?.last_name || ''}
                      onChange={(e) => setEditedUserProfile(prev => ({ ...prev!, last_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={editedUserProfile?.email || ''}
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editedUserProfile?.phone || ''}
                      onChange={(e) => setEditedUserProfile(prev => ({ ...prev!, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={editedUserProfile?.city || ''}
                      onChange={(e) => setEditedUserProfile(prev => ({ ...prev!, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="suburb">Suburb</Label>
                    <Input
                      id="suburb"
                      value={editedUserProfile?.suburb || ''}
                      onChange={(e) => setEditedUserProfile(prev => ({ ...prev!, suburb: e.target.value }))}
                    />
                  </div>
                  {editedClientProfile && (
                    <>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={editedClientProfile.description || ''}
                          onChange={(e) => setEditedClientProfile(prev => ({ ...prev!, description: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="preferred_employment_type">Preferred Employment Type</Label>
                        <Select
                          value={editedClientProfile.preferred_employment_type || ''}
                          onValueChange={(value) => setEditedClientProfile(prev => ({
                            ...prev!,
                            preferred_employment_type: value as 'full_time' | 'part_time' | null
                          }))}
                        >
                          <SelectTrigger id="preferred_employment_type">
                            <SelectValue placeholder="Select employment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full_time">Full Time</SelectItem>
                            <SelectItem value="part_time">Part Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="preferred_experience_type">Preferred Experience Type</Label>
                        <Select
                          value={editedClientProfile.preferred_experience_type || ''}
                          onValueChange={(value) => setEditedClientProfile(prev => ({
                            ...prev!,
                            preferred_experience_type: value as 'nanny' | 'cleaning' | 'both' | null
                          }))}
                        >
                          <SelectTrigger id="preferred_experience_type">
                            <SelectValue placeholder="Select experience type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nanny">Nanny</SelectItem>
                            <SelectItem value="cleaning">Cleaning</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="preferred_accommodation_type">Preferred Accommodation Type</Label>
                        <Select
                          value={editedClientProfile.preferred_accommodation_type || ''}
                          onValueChange={(value) => setEditedClientProfile(prev => ({
                            ...prev!,
                            preferred_accommodation_type: value as 'live_in' | 'stay_out' | null
                          }))}
                        >
                          <SelectTrigger id="preferred_accommodation_type">
                            <SelectValue placeholder="Select accommodation type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="live_in">Live In</SelectItem>
                            <SelectItem value="stay_out">Stay Out</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile}>Save</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div>
                    <p className="font-medium">{userProfile?.first_name} {userProfile?.last_name}</p>
                    <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
                    {userProfile?.city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {userProfile.suburb}, {userProfile.city}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" className="w-full mt-3" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Preferences */}
          {clientProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Search Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Experience Type</label>
                  <p className="text-sm">{clientProfile.preferred_experience_type || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Employment Type</label>
                  <p className="text-sm">{clientProfile.preferred_employment_type || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Accommodation</label>
                  <p className="text-sm">{clientProfile.preferred_accommodation_type || 'Not specified'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/find-nanny">
                <Button className="w-full">Find More Nannies</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Safety Reminder */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Safety Reminder</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Meet in public places</li>
                <li>• Bring someone with you</li>
                <li>• Verify all references</li>
                <li>• Respect minimum wage laws</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
