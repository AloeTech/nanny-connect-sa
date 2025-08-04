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
import { Shield, Users, Video, FileCheck, CreditCard, CheckCircle, X, Upload, Edit, Heart, Eye, Trash2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import InterestManagement from '@/components/InterestManagement';

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

export default function AdminPanel() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [nannies, setNannies] = useState<NannyProfile[]>([]);
  const [academyVideos, setAcademyVideos] = useState<AcademyVideo[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
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

      // Fetch interests
      const { data: interestsData } = await supabase
        .from('interests')
        .select(`
          *,
          clients!inner(
            id,
            profiles!inner(first_name, last_name, email)
          ),
          nannies!inner(
            id,
            profiles!inner(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false });

      setInterests(interestsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
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

      if (error) throw error;

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

      if (error) throw error;

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

      if (error) throw error;

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

      if (error) throw error;

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

      if (error) throw error;

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

      if (error) throw error;

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
                  <Card key={nanny.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="font-semibold">
                          {nanny.profiles.first_name} {nanny.profiles.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{nanny.profiles.email}</p>
                        <p className="text-sm">{nanny.profiles.suburb}, {nanny.profiles.city}</p>
                        
                        {/* Document Status */}
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <span className="text-sm text-muted-foreground">Criminal Check:</span>
                            <div className="flex items-center gap-2">
                              {nanny.criminal_check_status === 'approved' ? (
                                <Badge variant="default" className="bg-green-500">Approved</Badge>
                              ) : nanny.criminal_check_status === 'pending' ? (
                                <Badge variant="secondary">Pending</Badge>
                              ) : (
                                <Badge variant="secondary">Not Uploaded</Badge>
                              )}
                              {nanny.criminal_check_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(nanny.criminal_check_url, '_blank')}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Credit Check:</span>
                            <div className="flex items-center gap-2">
                              {nanny.credit_check_status === 'approved' ? (
                                <Badge variant="default" className="bg-green-500">Approved</Badge>
                              ) : nanny.credit_check_status === 'pending' ? (
                                <Badge variant="secondary">Pending</Badge>
                              ) : (
                                <Badge variant="secondary">Not Uploaded</Badge>
                              )}
                              {nanny.credit_check_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(nanny.credit_check_url, '_blank')}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Academy:</span>
                            <div>
                              {nanny.academy_completed ? (
                                <Badge variant="default" className="bg-green-500">Complete</Badge>
                              ) : (
                                <Badge variant="secondary">Incomplete</Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Profile:</span>
                            <div>
                              {nanny.profile_approved ? (
                                <Badge variant="default" className="bg-green-500">Approved</Badge>
                              ) : (
                                <Badge variant="secondary">Pending</Badge>
                              )}
                            </div>
                          </div>
                          {nanny.interview_video_url && (
                            <div>
                              <span className="text-sm text-muted-foreground">Interview Video:</span>
                              <div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(nanny.interview_video_url, '_blank')}
                                >
                                  <Video className="h-3 w-3 mr-1" />
                                  View Video
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Training Badges */}
                        <div>
                          <span className="text-sm text-muted-foreground">Training Badges:</span>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <Button
                              size="sm"
                              variant={nanny.training_first_aid ? "default" : "outline"}
                              onClick={() => toggleTrainingBadge(nanny.id, 'training_first_aid', nanny.training_first_aid)}
                            >
                              First Aid {nanny.training_first_aid ? '✓' : ''}
                            </Button>
                            <Button
                              size="sm"
                              variant={nanny.training_cpr ? "default" : "outline"}
                              onClick={() => toggleTrainingBadge(nanny.id, 'training_cpr', nanny.training_cpr)}
                            >
                              CPR {nanny.training_cpr ? '✓' : ''}
                            </Button>
                            <Button
                              size="sm"
                              variant={nanny.training_nanny ? "default" : "outline"}
                              onClick={() => toggleTrainingBadge(nanny.id, 'training_nanny', nanny.training_nanny)}
                            >
                              Nanny Training {nanny.training_nanny ? '✓' : ''}
                            </Button>
                            <Button
                              size="sm"
                              variant={nanny.training_child_development ? "default" : "outline"}
                              onClick={() => toggleTrainingBadge(nanny.id, 'training_child_development', nanny.training_child_development)}
                            >
                              Child Dev {nanny.training_child_development ? '✓' : ''}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        {nanny.criminal_check_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateDocumentStatus(nanny.id, 'criminal_check_status', 'approved')}
                            disabled={nanny.criminal_check_status === 'approved'}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve Criminal
                          </Button>
                        )}
                        {nanny.credit_check_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateDocumentStatus(nanny.id, 'credit_check_status', 'approved')}
                            disabled={nanny.credit_check_status === 'approved'}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve Credit
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={nanny.profile_approved ? "secondary" : "default"}
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
                <InterestManagement 
                  interests={interests}
                  userRole="admin"
                  onInterestUpdate={() => fetchData()}
                />
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