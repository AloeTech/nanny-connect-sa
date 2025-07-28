import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, CreditCard, Calendar, User, MapPin, Clock, DollarSign, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import PayButton from '@/components/PayButton';

interface ClientProfile {
  id: string;
  description: string;
  preferred_employment_type: string;
  preferred_experience_type: string;
  preferred_accommodation_type: string;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  suburb: string;
}

interface Interest {
  id: string;
  message: string;
  status: string;
  created_at: string;
  nanny_id: string;
  nannies: {
    user_id: string;
    bio: string;
    experience_type: string;
    experience_duration: number;
    hourly_rate: number;
    languages: string[];
    profiles: {
      first_name: string;
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

  useEffect(() => {
    if (user && userRole === 'client') {
      fetchData();
    }
  }, [user, userRole]);

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
              city,
              suburb
            )
          )
        `)
        .eq('client_id', client?.id || '')
        .order('created_at', { ascending: false });

      if (clientInterests) {
        setInterests(clientInterests);
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
                    <p className="text-2xl font-bold">{interests.filter(i => i.status === 'accepted').length}</p>
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
                <div className="space-y-4">
                  {interests.map((interest) => (
                    <div key={interest.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{interest.nannies.profiles.first_name}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {interest.nannies.profiles.suburb}, {interest.nannies.profiles.city}
                          </p>
                        </div>
                        {getStatusBadge(interest.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Experience:</span> {interest.nannies.experience_duration} years
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type:</span> {interest.nannies.experience_type}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rate:</span> R{interest.nannies.hourly_rate}/hour
                        </div>
                        <div>
                          <span className="text-muted-foreground">Languages:</span> {interest.nannies.languages.join(', ')}
                        </div>
                      </div>
                      {interest.message && (
                        <div className="mt-3 p-3 bg-muted rounded">
                          <p className="text-sm"><strong>Your message:</strong> {interest.message}</p>
                        </div>
                      )}
                      {interest.status === 'accepted' && (
                        <div className="mt-3">
                          <PayButton 
                            interestId={interest.id}
                            amount={500}
                            nannyName={interest.nannies.profiles.first_name}
                            clientName={userProfile?.first_name || 'Client'}
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Sent {new Date(interest.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
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
              <Link to="/profile">
                <Button variant="outline" className="w-full">Edit Profile</Button>
              </Link>
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
                <Link to="/profile">
                  <Button variant="outline" className="w-full">Update Preferences</Button>
                </Link>
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
              <Link to="/profile">
                <Button variant="outline" className="w-full">Update Profile</Button>
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