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
import { Shield, Users, Video, FileCheck, CreditCard, CheckCircle, X, Upload, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  payment_method: string;
  transaction_id: string;
  client_id: string;
  nanny_id: string;
}

export default function AdminPanel() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [nannies, setNannies] = useState<NannyProfile[]>([]);
  const [academyVideos, setAcademyVideos] = useState<AcademyVideo[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
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
          profiles (
            first_name,
            last_name,
            email,
            city,
            suburb
          )
        `)
        .order('created_at', { ascending: false });

      if (nanniesData) {
        setNannies(nanniesData);
      }

      // Fetch academy videos
      const { data: videosData } = await supabase
        .from('academy_videos')
        .select('*')
        .order('order_index', { ascending: true });

      if (videosData) {
        setAcademyVideos(videosData);
      }

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsData) {
        setPayments(paymentsData);
      }

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
        description: `Document ${status}`,
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
        description: `Profile ${approved ? 'approved' : 'rejected'}`,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground">Manage nannies, academy content, and platform operations</p>
      </div>

      <Tabs defaultValue="nannies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="nannies" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Nannies
          </TabsTrigger>
          <TabsTrigger value="academy" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Academy
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nannies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nanny Profiles</CardTitle>
              <CardDescription>Review and approve nanny registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nannies.map((nanny) => (
                  <div key={nanny.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold">
                          {nanny.profiles.first_name} {nanny.profiles.last_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{nanny.profiles.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {nanny.profiles.suburb}, {nanny.profiles.city}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {nanny.profile_approved ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending Approval</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Criminal Check:</span>
                        <div>{getStatusBadge(nanny.criminal_check_status)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Credit Check:</span>
                        <div>{getStatusBadge(nanny.credit_check_status)}</div>
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
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => approveProfile(nanny.id, true)}
                        disabled={nanny.profile_approved}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => approveProfile(nanny.id, false)}
                        disabled={!nanny.profile_approved}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject Profile
                      </Button>
                      {nanny.academy_completed && !nanny.profile_approved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveProfile(nanny.id, true)}
                          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve Academy Badge
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                        placeholder="Video title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newVideo.description}
                        onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                        placeholder="Video description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="video_url">Video URL</Label>
                      <Input
                        id="video_url"
                        value={newVideo.video_url}
                        onChange={(e) => setNewVideo({...newVideo, video_url: e.target.value})}
                        placeholder="https://..."
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
                  <div key={video.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{video.title}</h4>
                        <p className="text-sm text-muted-foreground">{video.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {video.duration_minutes} minutes • Order: {video.order_index}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {video.is_active ? (
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleVideoActive(video.id, video.is_active)}
                        >
                          {video.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Review</CardTitle>
              <CardDescription>Approve or reject uploaded documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nannies.filter(nanny => 
                  nanny.criminal_check_status === 'pending' || 
                  nanny.credit_check_status === 'pending'
                ).map((nanny) => (
                  <div key={nanny.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">
                      {nanny.profiles.first_name} {nanny.profiles.last_name}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {nanny.criminal_check_url && nanny.criminal_check_status === 'pending' && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Criminal Check</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateDocumentStatus(nanny.id, 'criminal_check_status', 'approved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateDocumentStatus(nanny.id, 'criminal_check_status', 'rejected')}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {nanny.credit_check_url && nanny.credit_check_status === 'pending' && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Credit Check</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateDocumentStatus(nanny.id, 'credit_check_status', 'approved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateDocumentStatus(nanny.id, 'credit_check_status', 'rejected')}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>Monitor and manage platform payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">R{payment.amount}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.created_at).toLocaleString()}
                        </p>
                        {payment.payment_method && (
                          <p className="text-xs text-muted-foreground">via {payment.payment_method}</p>
                        )}
                        {payment.transaction_id && (
                          <p className="text-xs text-muted-foreground">ID: {payment.transaction_id}</p>
                        )}
                      </div>
                      <div>
                        {payment.status === 'completed' ? (
                          <Badge variant="default" className="bg-green-500">Completed</Badge>
                        ) : payment.status === 'pending' ? (
                          <Badge variant="secondary">Pending</Badge>
                        ) : (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                      </div>
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