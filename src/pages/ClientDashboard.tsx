// pages/ClientDashboard.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, CreditCard, Calendar, User, MapPin, Clock, DollarSign, Eye, Edit, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Client Dashboard</h1>
        <p className="text-muted-foreground">Manage your nanny search and bookings</p>
      </div>

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
                <div className="space-y-4">
                  {interests.map((interest) => {
                    const nannyFirstName = interest.nannies.profiles.first_name;
                    const isApproved = interest.nanny_response === 'approved';
                    const isPaid = interest.payment_status === 'completed';

                    return (
                      <div key={interest.id} className="border rounded-lg p-6 bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xl font-bold text-gray-900">
                              {nannyFirstName}
                            </p>
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
                              {nannyFirstName} has approved your interest request.
                            </p>
                            <Link to="/find-nanny">
                              <Button className="mt-3 w-full">
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Go to Find Nanny to Complete Payment
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
                              {nannyFirstName}'s full contact details have been sent to your email.
                            </p>
                            <p className="text-sm text-emerald-600 mt-3">
                              Check your email for {nannyFirstName}'s phone number and email address.
                              You can now arrange your interview directly.
                            </p>
                          </div>
                        )}

                        {!isApproved && interest.nanny_response === 'pending' && (
                          <div className="text-center py-4">
                            <p className="text-amber-700 font-medium flex items-center justify-center gap-2">
                              <Clock className="h-5 w-5" />
                              Waiting for {nannyFirstName} to accept your request...
                            </p>
                          </div>
                        )}

                        {interest.nanny_response === 'declined' && (
                          <div className="text-center py-4">
                            <p className="text-red-600 font-semibold">
                              {nannyFirstName} has declined your request
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Don't be discouraged! There are many other qualified nannies available.
                            </p>
                            <Link to="/find-nanny">
                              <Button variant="outline" className="mt-3">
                                Browse More Nannies
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
                        <p className="font-medium">R{p.amount.toFixed(2)} - Nanny Contact Unlock</p>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Profile
              </CardTitle>
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
                    <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
                  </div>
                  
                  {userProfile?.phone && (
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{userProfile.phone}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium">Location</p>
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

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your nanny search</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/find-nanny">
                <Button className="w-full justify-start">
                  <Heart className="h-4 w-4 mr-2" />
                  Find More Nannies
                </Button>
              </Link>
              
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