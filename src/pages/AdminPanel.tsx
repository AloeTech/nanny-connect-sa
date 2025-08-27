import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Video, FileCheck, CreditCard, CheckCircle, X, Upload, Edit, Heart, Eye, Trash2, Plus, FileText, Film } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import emailjs from '@emailjs/browser';

interface NannyProfile {
  id: string;
  user_id: string;
  bio: string;
  criminal_check_status: string;
  credit_check_status: string;
  academy_completed: boolean;
  profile_approved: boolean;
  criminal_check_url: string;
  credit_check_url: string;
  interview_video_url: string;
  proof_of_residence_url: string;
  training_first_aid: boolean;
  training_nanny: boolean;
  training_cpr: boolean;
  training_child_development: boolean;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    city: string;
    suburb: string;
  };
}

interface AcademyVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
  is_active: boolean;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Interest {
  id: string;
  client_id: string;
  nanny_id: string;
  message: string | null;
  status: 'pending' | 'approved' | 'declined';
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

export default function AdminPanel() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [nannies, setNannies] = useState<NannyProfile[]>([]);
  const [academyVideos, setAcademyVideos] = useState<AcademyVideo[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    video_url: '',
    duration_minutes: 0,
    order_index: 0
  });

  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchData();
      // Set up real-time subscription for interests
      const subscription = supabase
        .channel('interests_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'interests',
          },
          (payload) => {
            console.log('Real-time interests update:', payload);
            fetchData(); // Re-fetch data on any change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user, userRole]);

  const fetchData = async () => {
    try {
      // Fetch nannies with profiles
      const { data: nanniesData } = await supabase
        .from('nannies')
        .select(`
          *,
          profiles!inner(first_name, last_name, email, city, suburb)
        `)
        .order('created_at', { ascending: false });

      setNannies(nanniesData || []);

      // Fetch academy videos
      const { data: videosData } = await supabase
        .from('academy_videos')
        .select('*')
        .order('order_index');

      setAcademyVideos(videosData || []);

      // Fetch payments with client profiles
      const { data: paymentsData } = await supabase
        .from('payments')
        .select(`
          *,
          clients!inner(
            profiles!inner(first_name, last_name, email)
          )
        `)
        .order('created_at', { ascending: false });

      // Transform data to match Payment interface
      const transformedPayments = paymentsData?.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        created_at: payment.created_at,
        profiles: payment.clients.profiles
      })) || [];

      setPayments(transformedPayments);

      // Fetch interests with explicit admin access (relies on RLS policy for user_roles)
      const { data: interestsData, error: interestsError } = await supabase
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
        .order('created_at', { ascending: false });

      if (interestsError) {
        console.error('Interests fetch error:', {
          message: interestsError.message,
          details: interestsError.details,
          hint: interestsError.hint,
          code: interestsError.code
        });
        toast({
          title: "Error",
          description: `Failed to load interests: ${interestsError.message}. Check if admin role is correctly set in user_roles table.`,
          variant: "destructive"
        });
      } else {
        console.log('Fetched interests data:', interestsData);
        setInterests(interestsData as Interest[] || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data. Please try again or check console for details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDocumentStatus = async (nannyId: string, field: string, status: string) => {
    try {
      const { error } = await supabase
        .from('nannies')
        .update({ [field]: status })
        .eq('id', nannyId);

      if (error) {
        console.log('Document update error:', error);
        throw error;
      }

      setNannies(nannies.map(nanny => 
        nanny.id === nannyId ? { ...nanny, [field]: status } : nanny
      ));

      toast({
        title: "Success",
        description: `Document ${status} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const approveProfile = async (nannyId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('nannies')
        .update({ profile_approved: approved })
        .eq('id', nannyId);

      if (error) {
        console.log('Profile approval update error:', error);
        throw error;
      }

      setNannies(nannies.map(nanny => 
        nanny.id === nannyId ? { ...nanny, profile_approved: approved } : nanny
      ));

      toast({
        title: "Success",
        description: `Profile ${approved ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleTrainingBadge = async (nannyId: string, trainingType: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('nannies')
        .update({ [trainingType]: !currentValue })
        .eq('id', nannyId);

      if (error) {
        console.log('Training badge update error:', error);
        throw error;
      }

      setNannies(nannies.map(nanny => 
        nanny.id === nannyId ? { ...nanny, [trainingType]: !currentValue } : nanny
      ));

      toast({
        title: "Success",
        description: `Badge ${!currentValue ? 'assigned' : 'revoked'} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createAcademyVideo = async () => {
    try {
      const { error } = await supabase
        .from('academy_videos')
        .insert([newVideo]);

      if (error) {
        console.log('Academy video creation error:', error);
        throw error;
      }

      setNewVideo({
        title: '',
        description: '',
        video_url: '',
        duration_minutes: 0,
        order_index: 0
      });

      fetchData(); // Refresh data

      toast({
        title: "Success",
        description: "Academy video created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteAcademyVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('academy_videos')
        .delete()
        .eq('id', videoId);

      if (error) {
        console.log('Academy video deletion error:', error);
        throw error;
      }

      setAcademyVideos(academyVideos.filter(video => video.id !== videoId));

      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleVideoActive = async (videoId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('academy_videos')
        .update({ is_active: !isActive })
        .eq('id', videoId);

      if (error) {
        console.log('Academy video active toggle error:', error);
        throw error;
      }

      setAcademyVideos(academyVideos.map(video => 
        video.id === videoId ? { ...video, is_active: !isActive } : video
      ));

      toast({
        title: "Success",
        description: `Video ${!isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleInterestAction = async (interestId: string, action: 'approve' | 'decline') => {
    const interest = interests.find(i => i.id === interestId);
    if (!interest) return;

    // Update interests table
    console.log(`Attempting to update interest ${interestId} with status: ${action}`);
    const responseText = `Admin has ${action === 'approve' ? 'approved' : 'declined'} your request on behalf of the nanny on ${new Date().toLocaleDateString()}.`;
    const { data, error: updateError } = await supabase
      .from('interests')
      .update({
        status: action === 'approve' ? 'approved' : 'declined',
        admin_approved: action === 'approve',
        nanny_response: responseText,
      })
      .eq('id', interestId)
      .select();

    if (updateError) {
      console.error('Error updating interest:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
      toast({
        title: 'Error',
        description: `Failed to update interest: ${updateError.message}. Check if admin has update permissions.`,
        variant: 'destructive',
      });
      return;
    }

    if (!data || data.length === 0) {
      console.error('No data returned after update for interest:', interestId);
      toast({
        title: 'Error',
        description: 'Failed to retrieve updated interest data.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Updated interest data:', data[0]);
    // Update local state with the returned data
    setInterests(interests.map(i => i.id === interestId ? data[0] as Interest : i));

    // Send email notification to client using EmailJS
    const clientEmailParams = {
      serviceID: 'service_syqn4ol',
      templateID: 'template_exkrbne',
      publicKey: 'rK97vwvxnXTTY8PjW',
      templateParams: {
        name: `${interest.client_first_name} ${interest.client_last_name || ''}`,
        email: interest.client_email || '',
        subject: `Interest Response - Nanny Placements SA`,
        message: `Your interest request for ${interest.nanny_first_name} ${interest.nanny_last_name || ''} has been ${action === 'approve' ? 'approved' : 'declined'} by the admin on behalf of the nanny.

Admin's response: "${responseText}"

Best regards,
Nanny Placements SA Team`,
        to_email: interest.client_email || '',
      },
    };

    try {
      await emailjs.send(clientEmailParams.serviceID, clientEmailParams.templateID, clientEmailParams.templateParams, clientEmailParams.publicKey);
      toast({
        title: 'Success',
        description: `Email sent to client ${interest.client_email} regarding ${action} interest.`,
      });
    } catch (error: any) {
      console.error('Email sending to client failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email notification to client',
        variant: 'destructive',
      });
    }

    // Send email notification to nanny using EmailJS
    const nannyEmailParams = {
      serviceID: 'service_syqn4ol',
      templateID: 'template_exkrbne',
      publicKey: 'rK97vwvxnXTTY8PjW',
      templateParams: {
        name: `${interest.nanny_first_name} ${interest.nanny_last_name || ''}`,
        email: interest.nanny_email || '',
        subject: `Interest Response - Nanny Placements SA`,
        message: `The interest request from ${interest.client_first_name} ${interest.client_last_name || ''} has been ${action === 'approve' ? 'approved' : 'declined'} by the admin on your behalf.

Admin's response: "${responseText}"

Best regards,
Nanny Placements SA Team`,
        to_email: interest.nanny_email || '',
      },
    };

    try {
      await emailjs.send(nannyEmailParams.serviceID, nannyEmailParams.templateID, nannyEmailParams.templateParams, nannyEmailParams.publicKey);
      toast({
        title: 'Success',
        description: `Email sent to nanny ${interest.nanny_email} regarding ${action} interest.`,
      });
    } catch (error: any) {
      console.error('Email sending to nanny failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email notification to nanny',
        variant: 'destructive',
      });
    }
  };

  // Helper function to determine if file is PDF or image
  const isImageFile = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png'].includes(extension || '');
  };

  if (userRole !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground">Manage nannies, content, and platform operations</p>
      </div>

      <Tabs defaultValue="nannies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="nannies">Nannies</TabsTrigger>
          <TabsTrigger value="interests">Interests</TabsTrigger>
          <TabsTrigger value="academy">Academy</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="nannies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Nanny Management
              </CardTitle>
              <CardDescription>Review and approve nanny profiles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {nannies.map((nanny) => (
                  <Card key={nanny.id} className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {nanny.profiles.first_name} {nanny.profiles.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{nanny.profiles.email}</p>
                          <p className="text-sm">{nanny.profiles.suburb}, {nanny.profiles.city}</p>
                        </div>

                        {/* Document Cards */}
                        <div className="space-y-4">
                          {/* Criminal Check */}
                          <Card className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">Criminal Check</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                              <div className="w-full sm:w-48">
                                {nanny.criminal_check_url ? (
                                  isImageFile(nanny.criminal_check_url) ? (
                                    <img
                                      src={nanny.criminal_check_url}
                                      alt="Criminal Check Preview"
                                      className="w-full h-32 object-contain rounded border bg-gray-50"
                                      onError={() => toast({
                                        title: "Image preview failed",
                                        description: "Unable to load criminal check image. Try viewing externally.",
                                        variant: "destructive"
                                      })}
                                    />
                                  ) : (
                                    <iframe
                                      src={nanny.criminal_check_url}
                                      title="Criminal Check Preview"
                                      className="w-full h-32 rounded border"
                                      onError={() => toast({
                                        title: "PDF preview failed",
                                        description: "Unable to load criminal check PDF. Try viewing externally.",
                                        variant: "destructive"
                                      })}
                                    />
                                  )
                                ) : (
                                  <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded border">
                                    <span className="text-sm text-muted-foreground">Not Uploaded</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 space-y-2">
                                <Badge
                                  variant={
                                    nanny.criminal_check_status === 'approved'
                                      ? 'default'
                                      : nanny.criminal_check_status === 'pending'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                  className={nanny.criminal_check_status === 'approved' ? 'bg-green-500' : ''}
                                >
                                  {nanny.criminal_check_status === 'approved'
                                    ? 'Approved'
                                    : nanny.criminal_check_status === 'pending'
                                    ? 'Pending'
                                    : 'Not Uploaded'}
                                </Badge>
                                {nanny.criminal_check_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(nanny.criminal_check_url, '_blank')}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Externally
                                  </Button>
                                )}
                                {nanny.criminal_check_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateDocumentStatus(nanny.id, 'criminal_check_status', 'approved')}
                                    disabled={nanny.criminal_check_status === 'approved'}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>

                          {/* Credit Check */}
                          <Card className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">Credit Check</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                              <div className="w-full sm:w-48">
                                {nanny.credit_check_url ? (
                                  isImageFile(nanny.credit_check_url) ? (
                                    <img
                                      src={nanny.credit_check_url}
                                      alt="Credit Check Preview"
                                      className="w-full h-32 object-contain rounded border bg-gray-50"
                                      onError={() => toast({
                                        title: "Image preview failed",
                                        description: "Unable to load credit check image. Try viewing externally.",
                                        variant: "destructive"
                                      })}
                                    />
                                  ) : (
                                    <iframe
                                      src={nanny.credit_check_url}
                                      title="Credit Check Preview"
                                      className="w-full h-32 rounded border"
                                      onError={() => toast({
                                        title: "PDF preview failed",
                                        description: "Unable to load credit check PDF. Try viewing externally.",
                                        variant: "destructive"
                                      })}
                                    />
                                  )
                                ) : (
                                  <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded border">
                                    <span className="text-sm text-muted-foreground">Not Uploaded</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 space-y-2">
                                <Badge
                                  variant={
                                    nanny.credit_check_status === 'approved'
                                      ? 'default'
                                      : nanny.credit_check_status === 'pending'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                  className={nanny.credit_check_status === 'approved' ? 'bg-green-500' : ''}
                                >
                                  {nanny.credit_check_status === 'approved'
                                    ? 'Approved'
                                    : nanny.credit_check_status === 'pending'
                                    ? 'Pending'
                                    : 'Not Uploaded'}
                                </Badge>
                                {nanny.credit_check_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(nanny.credit_check_url, '_blank')}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Externally
                                  </Button>
                                )}
                                {nanny.credit_check_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateDocumentStatus(nanny.id, 'credit_check_status', 'approved')}
                                    disabled={nanny.criminal_check_status === 'approved'}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>

                          {/* Proof of Residence */}
                          <Card className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">Proof of Residence</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                              <div className="w-full sm:w-48">
                                {nanny.proof_of_residence_url ? (
                                  isImageFile(nanny.proof_of_residence_url) ? (
                                    <img
                                      src={nanny.proof_of_residence_url}
                                      alt="Proof of Residence Preview"
                                      className="w-full h-32 object-contain rounded border bg-gray-50"
                                      onError={() => toast({
                                        title: "Image preview failed",
                                        description: "Unable to load proof of residence image. Try viewing externally.",
                                        variant: "destructive"
                                      })}
                                    />
                                  ) : (
                                    <iframe
                                      src={nanny.proof_of_residence_url}
                                      title="Proof of Residence Preview"
                                      className="w-full h-32 rounded border"
                                      onError={() => toast({
                                        title: "PDF preview failed",
                                        description: "Unable to load proof of residence PDF. Try viewing externally.",
                                        variant: "destructive"
                                      })}
                                    />
                                  )
                                ) : (
                                  <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded border">
                                    <span className="text-sm text-muted-foreground">Not Uploaded</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 space-y-2">
                                <Badge
                                  variant={nanny.proof_of_residence_url ? 'secondary' : 'outline'}
                                >
                                  {nanny.proof_of_residence_url ? 'Uploaded' : 'Not Uploaded'}
                                </Badge>
                                {nanny.proof_of_residence_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(nanny.proof_of_residence_url, '_blank')}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Externally
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>

                          {/* Interview Video */}
                          <Card className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Film className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">Interview Video</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                              <div className="w-full sm:w-48">
                                {nanny.interview_video_url ? (
                                  <video
                                    controls
                                    src={nanny.interview_video_url}
                                    className="w-full h-32 rounded border"
                                    onError={(e) => {
                                      console.error('Video playback error:', e, 'URL:', nanny.interview_video_url);
                                      fetch(nanny.interview_video_url, { method: 'HEAD' })
                                        .then(response => console.log('Video MIME type:', response.headers.get('content-type')))
                                        .catch(err => console.error('Fetch error:', err));
                                      toast({
                                        title: "Video playback failed",
                                        description: "The video could not be played. Try viewing externally or using a different browser.",
                                        variant: "destructive"
                                      });
                                    }}
                                  >
                                    <source src={nanny.interview_video_url} type="video/mp4" />
                                    <source src={nanny.interview_video_url} type="video/quicktime" />
                                    <source src={nanny.interview_video_url} type="video/webm" />
                                    Your browser does not support the video tag.
                                  </video>
                                ) : (
                                  <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded border">
                                    <span className="text-sm text-muted-foreground">Not Uploaded</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 space-y-2">
                                <Badge
                                  variant={nanny.interview_video_url ? 'secondary' : 'outline'}
                                >
                                  {nanny.interview_video_url ? 'Uploaded' : 'Not Uploaded'}
                                </Badge>
                                {nanny.interview_video_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(nanny.interview_video_url, '_blank')}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Externally
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>

                          {/* Additional Statuses */}
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Academy:</span>
                              <Badge
                                variant={nanny.academy_completed ? 'default' : 'secondary'}
                                className={nanny.academy_completed ? 'bg-green-500' : ''}
                              >
                                {nanny.academy_completed ? 'Complete' : 'Incomplete'}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Profile:</span>
                              <Badge
                                variant={nanny.profile_approved ? 'default' : 'secondary'}
                                className={nanny.profile_approved ? 'bg-green-500' : ''}
                              >
                                {nanny.profile_approved ? 'Approved' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Training Badges */}
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Training Badges:</span>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Button
                              size="sm"
                              variant={nanny.training_first_aid ? 'default' : 'outline'}
                              onClick={() => toggleTrainingBadge(nanny.id, 'training_first_aid', nanny.training_first_aid)}
                            >
                              First Aid {nanny.training_first_aid ? '✓' : ''}
                            </Button>
                            <Button
                              size="sm"
                              variant={nanny.training_cpr ? 'default' : 'outline'}
                              onClick={() => toggleTrainingBadge(nanny.id, 'training_cpr', nanny.training_cpr)}
                            >
                              CPR {nanny.training_cpr ? '✓' : ''}
                            </Button>
                            <Button
                              size="sm"
                              variant={nanny.training_nanny ? 'default' : 'outline'}
                              onClick={() => toggleTrainingBadge(nanny.id, 'training_nanny', nanny.training_nanny)}
                            >
                              Nanny Training {nanny.training_nanny ? '✓' : ''}
                            </Button>
                            <Button
                              size="sm"
                              variant={nanny.training_child_development ? 'default' : 'outline'}
                              onClick={() => toggleTrainingBadge(nanny.id, 'training_child_development', nanny.training_child_development)}
                            >
                              Child Dev {nanny.training_child_development ? '✓' : ''}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant={nanny.profile_approved ? 'secondary' : 'default'}
                          onClick={() => approveProfile(nanny.id, !nanny.profile_approved)}
                        >
                          {nanny.profile_approved ? 'Revoke Profile' : 'Approve Profile'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interest Management</CardTitle>
              <CardDescription>Manage client interests and payment approvals</CardDescription>
            </CardHeader>
            <CardContent>
              {interests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No interests found.</p>
              ) : (
                <div className="space-y-4">
                  {interests.map((interest) => (
                    <Card key={interest.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <p><strong>Client:</strong> {interest.client_first_name} {interest.client_last_name}</p>
                          <p><strong>Nanny:</strong> {interest.nanny_first_name} {interest.nanny_last_name}</p>
                          <p><strong>Message:</strong> {interest.message}</p>
                          <p><strong>Status:</strong> {interest.status}</p>
                          <p><strong>Submitted:</strong> {new Date(interest.created_at).toLocaleString()}</p>
                          {interest.nanny_response && <p><strong>Response:</strong> {interest.nanny_response}</p>}
                        </div>
                        {interest.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleInterestAction(interest.id, 'approve')}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button
                              onClick={() => handleInterestAction(interest.id, 'decline')}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              <X className="h-4 w-4 mr-1" /> Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Academy Videos</CardTitle>
              <CardDescription>Manage nanny training content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Video */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Add New Video
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Academy Video</DialogTitle>
                    <DialogDescription>Create a new training video for nannies</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newVideo.title}
                        onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newVideo.description}
                        onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="video_url">Video URL</Label>
                      <Input
                        id="video_url"
                        value={newVideo.video_url}
                        onChange={(e) => setNewVideo({...newVideo, video_url: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={newVideo.duration_minutes}
                          onChange={(e) => setNewVideo({...newVideo, duration_minutes: parseInt(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="order">Order Index</Label>
                        <Input
                          id="order"
                          type="number"
                          value={newVideo.order_index}
                          onChange={(e) => setNewVideo({...newVideo, order_index: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>
                    <Button onClick={createAcademyVideo} className="w-full">
                      Create Video
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Video List */}
              <div className="space-y-4">
                {academyVideos.map((video) => (
                  <Card key={video.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{video.title}</h3>
                          <p className="text-sm text-muted-foreground">{video.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>Duration: {video.duration_minutes} min</span>
                            <span>Order: {video.order_index}</span>
                            <Badge variant={video.is_active ? "default" : "secondary"}>
                              {video.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleVideoActive(video.id, video.is_active)}
                          >
                            {video.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteAcademyVideo(video.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>Monitor payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{payment.profiles.first_name} {payment.profiles.last_name}</p>
                      <p className="text-sm text-muted-foreground">{payment.profiles.email}</p>
                      <p className="text-sm">{new Date(payment.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">R{payment.amount}</p>
                      <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
