// pages/ClientDashboard.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, CreditCard, Calendar, User, MapPin, Clock, DollarSign, Eye, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
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

// New function to send email via Afrihost PHP
const sendEmail = async (to: string, subject: string, message: string) => {
  try {
    const response = await fetch('https://nannyplacementssouthafrica.co.za/send-contact-email.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        to, 
        subject, 
        message 
        // Remove 'type' parameter since PHP no longer uses it
      })
    });
    
    if (!response.ok) throw new Error('Email failed');
    return await response.json();
  } catch (error) {
    console.error('Email error:', error);
    return { success: false };
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

  const handleFlutterwavePayment = async (interest: Interest) => {
    // Prevent multiple payments for the same interest
    if (interest.payment_status === 'completed') {
      toast({ 
        title: "Already Paid", 
        description: "You have already paid for this nanny's contact details." 
      });
      return;
    }

    if (!userProfile || !clientProfile) {
      toast({ title: "Error", description: "Profile not loaded", variant: "destructive" });
      return;
    }

    const nannyFirstName = interest.nannies.profiles.first_name;
    const nannyFullName = `${interest.nannies.profiles.first_name} ${interest.nannies.profiles.last_name}`;
    const nannyEmail = interest.nannies.profiles.email;
    const nannyPhone = interest.nannies.profiles.phone || 'Not provided';
    const clientName = `${userProfile.first_name} ${userProfile.last_name}`;
    const clientEmail = userProfile.email;
    const clientPhone = userProfile.phone || 'Not provided';

    const FlutterwaveCheckout = (window as any).FlutterwaveCheckout;

    if (!FlutterwaveCheckout) {
      toast({ title: "Error", description: "Payment system not ready. Try again.", variant: "destructive" });
      return;
    }

    const flutterwavePublicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;

    // Use it in FlutterwaveCheckout
    FlutterwaveCheckout({
      public_key: flutterwavePublicKey,
      tx_ref: `nanny-int-${interest.id}-${Date.now()}`,
      amount: 200,
      currency: "ZAR",
      payment_options: "card,mobilemoney,ussd",
      customer: {
        email: userProfile.email,
        phone_number: userProfile.phone || "",
        name: clientName,
      },

      callback: async (response: any) => {
        if (response.status === "successful") {
          try {
            // Check again to prevent race conditions
            const { data: currentInterest } = await supabase
              .from('interests')
              .select('payment_status')
              .eq('id', interest.id)
              .single();

            if (currentInterest?.payment_status === 'completed') {
              toast({ 
                title: "Already Paid", 
                description: "This interest has already been paid for." 
              });
              return;
            }

            // Create payment record
            const { error: payError } = await supabase
              .from('payments')
              .insert({
                client_id: clientProfile.id,
                nanny_id: interest.nanny_id,
                interest_id: interest.id,
                amount: 200.00,
                status: 'completed',
                payment_method: 'flutterwave_card',
                transaction_id: response.transaction_id
              });

            if (payError) throw payError;

            // Update interest payment status
            const { error: updateError } = await supabase
              .from('interests')
              .update({ payment_status: 'completed' })
              .eq('id', interest.id);

            if (updateError) throw updateError;

            // Update local state immediately
            setInterests(prev => prev.map(i => 
              i.id === interest.id ? { ...i, payment_status: 'completed' } : i
            ));

            // Send email to CLIENT with nanny contact details
            const clientEmailSent = await sendEmail(
              clientEmail,
              `Interview Ready - Nanny Contact Details`,
              `Congratulations ${userProfile.first_name}!\n\nYour payment was successful.\n\nHere are ${nannyFirstName}'s full contact details:\n\n• Full Name: ${nannyFullName}\n• Email: ${nannyEmail}\n• Phone: ${nannyPhone}\n\nYou can now contact ${nannyFirstName} directly to arrange your interview.\n\nBest regards,\nNanny Placements SA Team`
            );

            // Send email to NANNY to notify them
            const nannyEmailSent = await sendEmail(
              
            nannyEmail,
            `A Client Has Access To Your Contact Details - Nanny Placements SA`,
            `Hi ${nannyFirstName},\n\nA Client now has your full contact information and may contact you directly to arrange an interview.\n\nPlease ensure you are ready and available to schedule and attend the interview promptly.\n\nBest regards,\nNanny Placements SA Team`

            );

            toast({
              title: "Payment Successful!",
              description: `You've unlocked ${nannyFirstName}'s contact details.${clientEmailSent ? ' Check your email!' : ' (Email sending failed, contact support for details)'}`,
            });

          } catch (err: any) {
            console.error("Payment processing failed:", err);
            toast({
              title: "Payment Failed",
              description: "Please try again or contact support.",
              variant: "destructive"
            });
          }
        } else {
          toast({ title: "Payment Failed", description: "Please try again.", variant: "destructive" });
        }
      },
      onclose: () => {},
      customizations: {
        title: "Unlock Nanny Contact",
        description: `Pay to contact ${nannyFirstName}`,
        logo: "public\favicon.ico",
      },
    });
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
    <>
      <script src="https://checkout.flutterwave.com/v3.js" async></script>

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
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleFlutterwavePayment(interest)}
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg py-6"
                                size="lg"
                              >
                                <CreditCard className="h-6 w-6 mr-3" />
                                Pay R200 to Unlock Contact Details
                              </Button>
                            </div>
                          )}

                          {isPaid && (
                            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-400 rounded-xl p-6 text-center">
                              <p className="text-2xl font-bold text-emerald-800 mb-2">
                                ✓ Payment Successful!
                              </p>
                              <p className="text-emerald-700 font-medium">
                                {nannyFirstName}'s full name, email, and phone number have been sent to your email.
                              </p>
                              <p className="text-sm text-emerald-600 mt-3">
                                You can now arrange your interview directly. The nanny has been notified.
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
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No payments yet</p>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p) => (
                      <div key={p.id} className="flex justify-between items-center border rounded-lg p-4">
                        <div>
                          <p className="font-medium">R{p.amount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Transaction: {p.transaction_id || 'N/A'}
                          </p>
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
                      <Label>First Name</Label>
                      <Input value={editedUserProfile?.first_name || ''} onChange={(e) => setEditedUserProfile(prev => ({ ...prev!, first_name: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input value={editedUserProfile?.last_name || ''} onChange={(e) => setEditedUserProfile(prev => ({ ...prev!, last_name:  e.target.value }))} />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={editedUserProfile?.phone || ''} onChange={(e) => setEditedUserProfile(prev => ({ ...prev!, phone: e.target.value }))} />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input value={editedUserProfile?.city || ''} onChange={(e) => setEditedUserProfile(prev => ({ ...prev!, city: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Suburb</Label>
                      <Input value={editedUserProfile?.suburb || ''} onChange={(e) => setEditedUserProfile(prev => ({ ...prev!, suburb: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile}>Save</Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-lg">{userProfile?.first_name} {userProfile?.last_name}</p>
                    <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
                    {userProfile?.phone && <p className="text-sm text-muted-foreground">{userProfile.phone}</p>}
                    <Button variant="outline" className="w-full mt-4" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent>
                <Link to="/find-nanny">
                  <Button className="w-full">Find More Nannies</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Safety First</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Always meet in public</li>
                  <li>• Bring a friend</li>
                  <li>• Verify references</li>
                  <li>• Follow labor laws</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}