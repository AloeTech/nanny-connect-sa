// pages/AdminPanel.tsx
import { useEffect, useState, useMemo } from 'react';
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
import {
  Shield,
  Users,
  Video,
  FileCheck,
  CreditCard,
  CheckCircle,
  X,
  Upload,
  Edit,
  Heart,
  Eye,
  Trash2,
  Plus,
  FileText,
  Film,
  Mail,
  Phone,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  Flag,
  MessageSquare,
  Filter,
  Search,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Archive,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NannyProfile {
  proof_of_residence_status: string;
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
    phone: string | null;
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

// NEW: Review/Complaint interface
interface ReviewComplaint {
  id: string;
  nanny_id: string;
  client_id: string;
  rating: number | null;
  complaint_text: string | null;
  status: 'pending' | 'resolved' | 'dismissed' | 'archived';
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  nanny_first_name?: string;
  nanny_last_name?: string;
  nanny_email?: string;
  client_first_name?: string;
  client_last_name?: string;
  client_email?: string;
  nanny_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
  client_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
}

// NEW: Function to send admin interest action email via dedicated PHP endpoint
const sendAdminInterestActionEmail = async (emailData: any): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch('https://nannyplacementssouthafrica.co.za/send-admin-interest-action.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Admin interest action API error:', data);
      return { success: false, message: data.error };
    }

    console.log('Admin interest action email sent successfully:', data);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Admin interest action email sending error:', error);
    return { success: false, message: 'Failed to send email' };
  }
};

// NEW: Function to send nanny notification email
const sendNannyNotificationEmail = async (emailData: any): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch('https://nannyplacementssouthafrica.co.za/send-nanny-notification.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Nanny notification API error:', data);
      return { success: false, message: data.error };
    }

    console.log('Nanny notification email sent successfully:', data);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Nanny notification email sending error:', error);
    return { success: false, message: 'Failed to send email' };
  }
};

// NEW: Function to send review/complaint status update email
const sendReviewStatusEmail = async (emailData: any): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch('https://nannyplacementssouthafrica.co.za/send-review-status-email.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Review status email API error:', data);
      return { success: false, message: data.error };
    }

    console.log('Review status email sent successfully:', data);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Review status email sending error:', error);
    return { success: false, message: 'Failed to send email' };
  }
};

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
    order_index: 0,
  });

  // ───────────────────────────────────────────────
  // NEW STATES for improved nanny list
  // ───────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNannyId, setExpandedNannyId] = useState<string | null>(null);

  // NEW STATES for reviews/complaints
  const [reviewsComplaints, setReviewsComplaints] = useState<ReviewComplaint[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'review' | 'complaint'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved' | 'dismissed' | 'archived'>('all');
  const [reviewSearch, setReviewSearch] = useState('');
  const [selectedReview, setSelectedReview] = useState<ReviewComplaint | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [updatingReview, setUpdatingReview] = useState(false);

  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchData();
      const subscription = supabase
        .channel('interests_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'interests' }, () => {
          fetchData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user, userRole]);

  // NEW: Fetch reviews and complaints
  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchReviewsComplaints();
    }
  }, [user, userRole]);

  const fetchData = async () => {
    try {
      const { data: nanniesData } = await supabase
        .from('nannies')
        .select(`*, profiles!inner(first_name, last_name, email, phone, city, suburb)`)
        .order('created_at', { ascending: false });

      const normalizedNannies = (nanniesData || []).map((nanny: any) => ({
        ...nanny,
        proof_of_residence_status: nanny.proof_of_residence_status || (nanny.proof_of_residence_url ? 'pending' : 'none'),
      })) as NannyProfile[];
      setNannies(normalizedNannies);

      const { data: videosData } = await supabase.from('academy_videos').select('*').order('order_index');
      setAcademyVideos(videosData || []);

      const { data: paymentsData } = await supabase
        .from('payments')
        .select(`*, clients!inner(profiles!inner(first_name, last_name, email))`)
        .order('created_at', { ascending: false });

      const transformedPayments = paymentsData?.map((p) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        created_at: p.created_at,
        profiles: p.clients.profiles,
      })) || [];
      setPayments(transformedPayments);

      const { data: interestsData } = await supabase
        .from('interests')
        .select(`
          id, client_id, nanny_id, message, status, created_at,
          admin_approved, nanny_response, payment_status,
          client_first_name, client_last_name, client_email,
          nanny_first_name, nanny_last_name, nanny_email
        `)
        .order('created_at', { ascending: false });

      setInterests(interestsData as Interest[] || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load admin data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch all reviews and complaints
  const fetchReviewsComplaints = async () => {
  try {
    setReviewsLoading(true);
    
    // Get all reviews with direct foreign key relationships
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        *,
        nannies!reviews_nanny_id_fkey (
          first_name,
          last_name,
          user_id
        ),
        clients!reviews_client_id_fkey (
          first_name,
          last_name,
          user_id
        )
      `)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return;
    }

    // Process reviews to get profile information
    const transformedReviews = await Promise.all(
      (reviewsData || []).map(async (review: any) => {
        try {
          // Nanny info from nannies table
          const nanny = review.nannies || {};
          
          // Client info from clients table
          const client = review.clients || {};
          
          // Get email/phone for nanny from profiles table
          let nannyEmail = '';
          let nannyPhone = '';
          if (nanny.user_id) {
            const { data: nannyProfile } = await supabase
              .from('profiles')
              .select('email, phone')
              .eq('id', nanny.user_id)
              .single();
            nannyEmail = nannyProfile?.email || '';
            nannyPhone = nannyProfile?.phone || '';
          } else if (nanny.id) {
            // Fallback: try to get profile using nanny id directly
            const { data: nannyProfile } = await supabase
              .from('profiles')
              .select('email, phone')
              .eq('id', nanny.id)
              .single();
            nannyEmail = nannyProfile?.email || '';
            nannyPhone = nannyProfile?.phone || '';
          }

          // Get email for client from profiles table
          let clientEmail = '';
          if (client.user_id) {
            const { data: clientProfile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', client.user_id)
              .single();
            clientEmail = clientProfile?.email || '';
          } else if (client.id) {
            // Fallback: try to get profile using client id directly
            const { data: clientProfile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', client.id)
              .single();
            clientEmail = clientProfile?.email || '';
          }

          return {
            id: review.id,
            nanny_id: review.nanny_id,
            client_id: review.client_id,
            rating: review.rating,
            complaint_text: review.complaint_text,
            status: review.status || 'pending',
            admin_response: review.admin_response,
            created_at: review.created_at,
            updated_at: review.updated_at || review.created_at,
            nanny_first_name: nanny.first_name || 'Unknown Nanny',
            nanny_last_name: nanny.last_name || '',
            nanny_email: nannyEmail,
            client_first_name: client.first_name || 'Unknown Client',
            client_last_name: client.last_name || '',
            client_email: clientEmail,
          };
        } catch (error) {
          console.error('Error processing review:', review.id, error);
          // Return basic info if we can't get all data
          return {
            id: review.id,
            nanny_id: review.nanny_id,
            client_id: review.client_id,
            rating: review.rating,
            complaint_text: review.complaint_text,
            status: review.status || 'pending',
            admin_response: review.admin_response,
            created_at: review.created_at,
            updated_at: review.updated_at || review.created_at,
            nanny_first_name: 'Unknown Nanny',
            nanny_last_name: '',
            nanny_email: '',
            client_first_name: 'Unknown Client',
            client_last_name: '',
            client_email: '',
          };
        }
      })
    );

    setReviewsComplaints(transformedReviews);
    
  } catch (error) {
    console.error('Error fetching reviews/complaints:', error);
  } finally {
    setReviewsLoading(false);
  }
};

  // ───────────────────────────────────────────────
  // LIVE SEARCH + ALPHABETICAL SORT BY LAST NAME
  // ───────────────────────────────────────────────
  const filteredAndSortedNannies = useMemo(() => {
    let result = [...nannies];

    // 1. Live search (first name OR last name OR email)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((nanny) => {
        const p = nanny.profiles;
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
        const email = p.email?.toLowerCase() || '';
        return fullName.includes(q) || email.includes(q);
      });
    }

    // 2. Sort alphabetically by last name
    result.sort((a, b) => {
      const lastA = a.profiles.last_name?.toLowerCase() || '';
      const lastB = b.profiles.last_name?.toLowerCase() || '';
      return lastA.localeCompare(lastB);
    });

    return result;
  }, [nannies, searchQuery]);

  // NEW: Filter reviews/complaints
  const filteredReviewsComplaints = useMemo(() => {
    let result = [...reviewsComplaints];

    // Filter by type
    if (filterType !== 'all') {
      if (filterType === 'review') {
        result = result.filter(item => item.rating !== null);
      } else if (filterType === 'complaint') {
        result = result.filter(item => item.complaint_text !== null);
      }
    }

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(item => item.status === filterStatus);
    }

    // Search filter
    if (reviewSearch.trim()) {
      const q = reviewSearch.toLowerCase().trim();
      result = result.filter(item => {
        const nannyName = `${item.nanny_first_name || ''} ${item.nanny_last_name || ''}`.toLowerCase();
        const clientName = `${item.client_first_name || ''} ${item.client_last_name || ''}`.toLowerCase();
        const complaintText = item.complaint_text?.toLowerCase() || '';
        const adminResponse = item.admin_response?.toLowerCase() || '';
        
        return nannyName.includes(q) || 
               clientName.includes(q) || 
               complaintText.includes(q) ||
               adminResponse.includes(q);
      });
    }

    return result;
  }, [reviewsComplaints, filterType, filterStatus, reviewSearch]);

  const updateDocumentStatus = async (nannyId: string, field: string, status: string) => {
    try {
      await supabase.from('nannies').update({ [field]: status }).eq('id', nannyId);
      setNannies(nannies.map((n) => (n.id === nannyId ? { ...n, [field]: status } : n)));

      // Send notification email to nanny if approved
      const nanny = nannies.find((n) => n.id === nannyId);
      if (nanny && status === 'approved') {
        const documentType =
          field === 'criminal_check_status'
            ? 'Criminal Check'
            : field === 'credit_check_status'
            ? 'Credit Check'
            : field === 'proof_of_residence_status'
            ? 'Proof of Residence'
            : 'Document';

        await sendNannyNotificationEmail({
          to: nanny.profiles.email,
          subject: `✅ ${documentType} Approved - Nanny Placements SA`,
          nanny_name: `${nanny.profiles.first_name} ${nanny.profiles.last_name}`,
          notification_type: 'document_approved',
          document_type: documentType,
          message: `Your ${documentType.toLowerCase()} has been reviewed and approved by the admin.`,
        }).catch((err) => console.error('Failed to send notification email:', err));
      }

      toast({ title: 'Success', description: `Document ${status} successfully` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const approveProfile = async (nannyId: string, approved: boolean) => {
    try {
      await supabase.from('nannies').update({ profile_approved: approved }).eq('id', nannyId);
      setNannies(nannies.map((n) => (n.id === nannyId ? { ...n, profile_approved: approved } : n)));

      // Send notification email to nanny
      const nanny = nannies.find((n) => n.id === nannyId);
      if (nanny) {
        await sendNannyNotificationEmail({
          to: nanny.profiles.email,
          subject: approved ? '🎉 Profile Approved - Nanny Placements SA' : 'Profile Update - Nanny Placements SA',
          nanny_name: `${nanny.profiles.first_name} ${nanny.profiles.last_name}`,
          notification_type: approved ? 'profile_approved' : 'profile_updated',
          message: approved
            ? 'Congratulations! Your profile has been approved and is now visible to clients.'
            : 'Your profile status has been updated by the admin.',
        }).catch((err) => console.error('Failed to send notification email:', err));
      }

      toast({ title: 'Success', description: `Profile ${approved ? 'approved' : 'rejected'}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const toggleTrainingBadge = async (nannyId: string, trainingType: string, currentValue: boolean) => {
    try {
      await supabase.from('nannies').update({ [trainingType]: !currentValue }).eq('id', nannyId);
      setNannies(nannies.map((n) => (n.id === nannyId ? { ...n, [trainingType]: !currentValue } : n)));

      // Send notification email to nanny
      const nanny = nannies.find((n) => n.id === nannyId);
      if (nanny) {
        const badgeName = trainingType.replace('training_', '').replace('_', ' ').toUpperCase();
        await sendNannyNotificationEmail({
          to: nanny.profiles.email,
          subject: `🎖️ Training Badge ${!currentValue ? 'Awarded' : 'Updated'} - Nanny Placements SA`,
          nanny_name: `${nanny.profiles.first_name} ${nanny.profiles.last_name}`,
          notification_type: 'badge_updated',
          badge_type: badgeName,
          message: `Your ${badgeName} training badge has been ${!currentValue ? 'awarded' : 'updated'} by the admin.`,
        }).catch((err) => console.error('Failed to send notification email:', err));
      }

      toast({ title: 'Success', description: `Badge ${!currentValue ? 'assigned' : 'revoked'}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const createAcademyVideo = async () => {
    try {
      await supabase.from('academy_videos').insert([newVideo]);
      setNewVideo({ title: '', description: '', video_url: '', duration_minutes: 0, order_index: 0 });
      fetchData();
      toast({ title: 'Success', description: 'Video created successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteAcademyVideo = async (videoId: string) => {
    try {
      await supabase.from('academy_videos').delete().eq('id', videoId);
      setAcademyVideos(academyVideos.filter((v) => v.id !== videoId));
      toast({ title: 'Success', description: 'Video deleted successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const toggleVideoActive = async (videoId: string, isActive: boolean) => {
    try {
      await supabase.from('academy_videos').update({ is_active: !isActive }).eq('id', videoId);
      setAcademyVideos(academyVideos.map((v) => (v.id === videoId ? { ...v, is_active: !isActive } : v)));
      toast({ title: 'Success', description: `Video ${!isActive ? 'activated' : 'deactivated'}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleInterestAction = async (interestId: string, action: 'approve' | 'decline') => {
    const interest = interests.find((i) => i.id === interestId);
    if (!interest) return;

    const responseText = `Admin has ${action === 'approve' ? 'approved' : 'declined'} your request on ${new Date().toLocaleDateString()}.`;

    try {
      const { data, error } = await supabase
        .from('interests')
        .update({
          status: action === 'approve' ? 'approved' : 'declined',
          admin_approved: action === 'approve',
          nanny_response: responseText,
        })
        .eq('id', interestId)
        .select();

      if (error) throw error;

      setInterests(interests.map((i) => (i.id === interestId ? (data[0] as Interest) : i)));

      // Send email to CLIENT using dedicated PHP endpoint
      const clientEmailResult = await sendAdminInterestActionEmail({
        to: interest.client_email || '',
        subject: `Interest Request ${action === 'approve' ? 'Approved' : 'Declined'} - Nanny Placements SA`,
        client_name: `${interest.client_first_name} ${interest.client_last_name || ''}`,
        nanny_name: `${interest.nanny_first_name} ${interest.nanny_last_name || ''}`,
        action: action,
        admin_message: responseText,
        recipient_type: 'client',
      });

      // Send email to NANNY using dedicated PHP endpoint
      const nannyEmailResult = await sendAdminInterestActionEmail({
        to: interest.nanny_email || '',
        subject: `Interest Update from Admin - Nanny Placements SA`,
        nanny_name: `${interest.nanny_first_name} ${interest.nanny_last_name || ''}`,
        client_name: `${interest.client_first_name} ${interest.client_last_name || ''}`,
        action: action,
        admin_message: responseText,
        recipient_type: 'nanny',
      });

      toast({
        title: 'Success',
        description: `Interest ${action}d${
          clientEmailResult.success || nannyEmailResult.success ? ' (emails sent)' : ' (email sending failed)'
        }`,
      });
    } catch (error: any) {
      console.error('Error handling interest action:', error);
      toast({ title: 'Error', description: error.message || 'Failed to process interest action', variant: 'destructive' });
    }
  };

  // NEW: Update review/complaint status
  const updateReviewStatus = async (reviewId: string, status: ReviewComplaint['status'], responseText?: string) => {
    try {
      setUpdatingReview(true);
      
      const updates: any = {
        status: status,
        updated_at: new Date().toISOString()
      };

      if (responseText) {
        updates.admin_response = responseText;
      }

      const { error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', reviewId);

      if (error) throw error;

      // Update local state
      setReviewsComplaints(reviewsComplaints.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              status, 
              admin_response: responseText || review.admin_response,
              updated_at: new Date().toISOString()
            } 
          : review
      ));

      // Send notification email to client and nanny
      const review = reviewsComplaints.find(r => r.id === reviewId);
      if (review) {
        const isReview = review.rating !== null;
        
        // Send to client
        await sendReviewStatusEmail({
          to: review.client_email || '',
          subject: `Update on Your ${isReview ? 'Review' : 'Complaint'} - Nanny Placements SA`,
          client_name: `${review.client_first_name} ${review.client_last_name || ''}`,
          nanny_name: `${review.nanny_first_name} ${review.nanny_last_name || ''}`,
          type: isReview ? 'review' : 'complaint',
          status: status,
          admin_message: responseText || '',
          rating: review.rating
        }).catch(err => console.error('Failed to send client email:', err));

        // Send to nanny (only if it's a complaint or negative review)
        if (!isReview || (review.rating && review.rating <= 2)) {
          await sendReviewStatusEmail({
            to: review.nanny_email || '',
            subject: `Update on Client ${isReview ? 'Review' : 'Complaint'} - Nanny Placements SA`,
            nanny_name: `${review.nanny_first_name} ${review.nanny_last_name || ''}`,
            client_name: `${review.client_first_name} ${review.client_last_name || ''}`,
            type: isReview ? 'review' : 'complaint',
            status: status,
            admin_message: responseText || '',
            rating: review.rating
          }).catch(err => console.error('Failed to send nanny email:', err));
        }
      }

      const isReview = review?.rating !== null;
      
      toast({
        title: 'Success',
        description: `${isReview ? 'Review' : 'Complaint'} marked as ${status}`,
      });

      // Close dialog if open
      setSelectedReview(null);
      setAdminResponse('');
      
    } catch (error: any) {
      console.error('Error updating review status:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update status', 
        variant: 'destructive' 
      });
    } finally {
      setUpdatingReview(false);
    }
  };

  // NEW: Archive a review/complaint
  const archiveReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;

      setReviewsComplaints(reviewsComplaints.map(review => 
        review.id === reviewId 
          ? { ...review, status: 'archived', updated_at: new Date().toISOString() } 
          : review
      ));

      toast({ title: 'Success', description: 'Item archived successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // NEW: Get status badge color
  const getStatusBadge = (status: ReviewComplaint['status']) => {
    switch (status) {
      case 'pending': return { color: 'bg-yellow-500', text: 'Pending' };
      case 'resolved': return { color: 'bg-green-500', text: 'Resolved' };
      case 'dismissed': return { color: 'bg-gray-500', text: 'Dismissed' };
      case 'archived': return { color: 'bg-blue-500', text: 'Archived' };
      default: return { color: 'bg-gray-500', text: status };
    }
  };

  // NEW: Get type badge
  const getTypeBadge = (review: ReviewComplaint) => {
    if (review.rating !== null) {
      return { 
        color: 'bg-blue-500', 
        text: `Review (${review.rating}★)`,
        icon: <Star className="h-3 w-3 mr-1" />
      };
    } else {
      return { 
        color: 'bg-red-500', 
        text: 'Complaint',
        icon: <Flag className="h-3 w-3 mr-1" />
      };
    }
  };

  const isImageFile = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');
  };

  if (userRole !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">This page is only accessible to administrators.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading admin panel...</p>
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
        <p className="text-muted-foreground">Manage nannies, content, reviews, and platform operations</p>
      </div>

      <Tabs defaultValue="nannies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="nannies">Nannies</TabsTrigger>
          <TabsTrigger value="interests">Interests</TabsTrigger>
          <TabsTrigger value="reviews">Reviews & Complaints</TabsTrigger>
          <TabsTrigger value="academy">Academy</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* Existing Nannies Tab - unchanged */}
        <TabsContent value="nannies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Nanny Management ({filteredAndSortedNannies.length})
                </div>
                <div className="text-sm text-muted-foreground">Click a nanny to view / approve documents</div>
              </CardTitle>
              <CardDescription>Review and approve nanny profiles and documents</CardDescription>
            </CardHeader>

            <CardContent>
              {/* ───────────────────────────────────────────────
                  SEARCH BAR
              ─────────────────────────────────────────────── */}
              <div className="mb-6">
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>

              <div className="space-y-3">
                {filteredAndSortedNannies.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No nannies found matching your search
                  </div>
                ) : (
                  filteredAndSortedNannies.map((nanny) => {
                    const profile = nanny.profiles;
                    const isExpanded = expandedNannyId === nanny.id;

                    return (
                      <div key={nanny.id}>
                        {/* ───────────────────────────────────────────────
                            COMPACT ROW – always visible
                        ─────────────────────────────────────────────── */}
                        <Card
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            isExpanded ? 'border-primary border-2 shadow-lg' : 'hover:border-gray-300'
                          }`}
                          onClick={() => setExpandedNannyId(isExpanded ? null : nanny.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                              {/* Avatar + Name */}
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0">
                                  {profile.first_name?.[0]}
                                  {profile.last_name?.[0]}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-medium truncate">
                                    {profile.first_name} {profile.last_name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                                </div>
                              </div>

                              {/* Status badges */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant={nanny.profile_approved ? 'default' : 'secondary'}
                                  className={nanny.profile_approved ? 'bg-green-600' : 'bg-yellow-500'}
                                >
                                  {nanny.profile_approved ? 'Approved' : 'Pending'}
                                </Badge>

                                {nanny.academy_completed && <Badge className="bg-blue-600">Academy ✓</Badge>}

                                {nanny.criminal_check_status === 'approved' && (
                                  <Badge className="bg-green-600">Criminal ✓</Badge>
                                )}

                                {nanny.credit_check_status === 'approved' && (
                                  <Badge className="bg-green-600">Credit ✓</Badge>
                                )}
                              </div>

                              {/* Expand / Collapse icon */}
                              <Button variant="ghost" size="icon" className="ml-2 shrink-0">
                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        {/* ───────────────────────────────────────────────
                            EXPANDED FULL VIEW (only when clicked)
                        ─────────────────────────────────────────────── */}
                        {isExpanded && (
                          <Card className="mt-2 border-t-4 border-t-primary animate-in fade-in slide-in-from-top-2 duration-300">
                            <CardContent className="p-6 space-y-6">
                              {/* Header with close button */}
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-xl font-semibold">
                                    {profile.first_name} {profile.last_name}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm mt-1 flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-4 w-4" />
                                      {profile.email}
                                    </span>
                                    {profile.phone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-4 w-4" />
                                        {profile.phone}
                                      </span>
                                    )}
                                    <span className="text-muted-foreground">
                                      {profile.suburb ? `${profile.suburb}, ` : ''}
                                      {profile.city || 'No location'}
                                    </span>
                                  </div>
                                </div>

                                <Button variant="ghost" size="sm" onClick={() => setExpandedNannyId(null)}>
                                  Close
                                </Button>
                              </div>

                              <div className="space-y-4">
                                {/* Criminal Check Section */}
                                <Card className="p-4 border-l-4 border-l-blue-500">
                                  <div className="flex items-center gap-2 mb-3">
                                    <FileText className="h-5 w-5 text-blue-500" />
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
                                            onError={(e) => {
                                              e.currentTarget.src = '/placeholder-image.jpg';
                                              toast({
                                                title: 'Image preview failed',
                                                description: 'Unable to load criminal check image.',
                                                variant: 'destructive',
                                              });
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-32 flex flex-col items-center justify-center bg-gray-100 rounded border p-4">
                                            <FileText className="h-8 w-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-600">PDF Document</span>
                                            <Button
                                              size="sm"
                                              variant="link"
                                              className="mt-2"
                                              onClick={() => window.open(nanny.criminal_check_url, '_blank')}
                                            >
                                              View PDF
                                            </Button>
                                          </div>
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
                                      {nanny.criminal_check_url && nanny.criminal_check_status !== 'approved' && (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => updateDocumentStatus(nanny.id, 'criminal_check_status', 'approved')}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Approve Criminal Check
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </Card>

                                {/* Credit Check Section */}
                                <Card className="p-4 border-l-4 border-l-purple-500">
                                  <div className="flex items-center gap-2 mb-3">
                                    <FileText className="h-5 w-5 text-purple-500" />
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
                                            onError={(e) => {
                                              e.currentTarget.src = '/placeholder-image.jpg';
                                              toast({
                                                title: 'Image preview failed',
                                                description: 'Unable to load credit check image.',
                                                variant: 'destructive',
                                              });
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-32 flex flex-col items-center justify-center bg-gray-100 rounded border p-4">
                                            <FileText className="h-8 w-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-600">PDF Document</span>
                                            <Button
                                              size="sm"
                                              variant="link"
                                              className="mt-2"
                                              onClick={() => window.open(nanny.credit_check_url, '_blank')}
                                            >
                                              View PDF
                                            </Button>
                                          </div>
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
                                      {nanny.credit_check_url && nanny.credit_check_status !== 'approved' && (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => updateDocumentStatus(nanny.id, 'credit_check_status', 'approved')}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Approve Credit Check
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </Card>

                                {/* Proof of Residence Section */}
                                <Card className="p-4 border-l-4 border-l-amber-500">
                                  <div className="flex items-center gap-2 mb-3">
                                    <FileText className="h-5 w-5 text-amber-500" />
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
                                            onError={(e) => {
                                              e.currentTarget.src = '/placeholder-image.jpg';
                                              toast({
                                                title: 'Image preview failed',
                                                description: 'Unable to load proof of residence image.',
                                                variant: 'destructive',
                                              });
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-32 flex flex-col items-center justify-center bg-gray-100 rounded border p-4">
                                            <FileText className="h-8 w-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-600">PDF Document</span>
                                            <Button
                                              size="sm"
                                              variant="link"
                                              className="mt-2"
                                              onClick={() => window.open(nanny.proof_of_residence_url, '_blank')}
                                            >
                                              View PDF
                                            </Button>
                                          </div>
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
                                          nanny.proof_of_residence_status === 'approved'
                                            ? 'default'
                                            : nanny.proof_of_residence_status === 'pending'
                                            ? 'secondary'
                                            : 'outline'
                                        }
                                        className={nanny.proof_of_residence_status === 'approved' ? 'bg-green-500' : ''}
                                      >
                                        {nanny.proof_of_residence_status === 'approved'
                                          ? 'Approved'
                                          : nanny.proof_of_residence_status === 'pending'
                                          ? 'Pending'
                                          : 'Not Uploaded'}
                                      </Badge>
                                      {nanny.proof_of_residence_url && nanny.proof_of_residence_status !== 'approved' && (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => updateDocumentStatus(nanny.id, 'proof_of_residence_status', 'approved')}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Approve Proof of Residence
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </Card>

                                {/* Interview Video Section */}
                                <Card className="p-4 border-l-4 border-l-red-500">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Film className="h-5 w-5 text-red-500" />
                                    <span className="font-medium">Interview Video</span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                                    <div className="w-full sm:w-48">
                                      {nanny.interview_video_url ? (
                                        <div className="relative">
                                          <video
                                            controls
                                            src={nanny.interview_video_url}
                                            className="w-full h-32 rounded border bg-black"
                                            preload="metadata"
                                          >
                                            Your browser does not support the video tag.
                                          </video>
                                          <Button
                                            size="sm"
                                            variant="secondary"
                                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                                            onClick={() => window.open(nanny.interview_video_url, '_blank')}
                                          >
                                            <Eye className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded border">
                                          <span className="text-sm text-muted-foreground">Not Uploaded</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                      <Badge variant={nanny.interview_video_url ? 'secondary' : 'outline'}>
                                        {nanny.interview_video_url ? 'Uploaded' : 'Not Uploaded'}
                                      </Badge>
                                    </div>
                                  </div>
                                </Card>
                              </div>

                              {/* Status Summary */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Academy Completion:</span>
                                  <Badge
                                    variant={nanny.academy_completed ? 'default' : 'secondary'}
                                    className={nanny.academy_completed ? 'bg-green-500' : ''}
                                  >
                                    {nanny.academy_completed ? 'Complete ✓' : 'Incomplete'}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Profile Status:</span>
                                  <Badge
                                    variant={nanny.profile_approved ? 'default' : 'secondary'}
                                    className={nanny.profile_approved ? 'bg-green-500' : 'bg-yellow-500'}
                                  >
                                    {nanny.profile_approved ? 'Approved ✓' : 'Pending Review'}
                                  </Badge>
                                </div>
                              </div>

                              {/* Training Badges */}
                              <div className="p-4 border rounded-lg">
                                <span className="text-sm font-medium text-muted-foreground">Training Badges:</span>
                                <div className="flex gap-2 mt-3 flex-wrap">
                                  <Button
                                    size="sm"
                                    variant={nanny.training_first_aid ? 'default' : 'outline'}
                                    onClick={() => toggleTrainingBadge(nanny.id, 'training_first_aid', nanny.training_first_aid)}
                                    className={nanny.training_first_aid ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                                  >
                                    🏥 First Aid {nanny.training_first_aid ? '✓' : ''}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={nanny.training_cpr ? 'default' : 'outline'}
                                    onClick={() => toggleTrainingBadge(nanny.id, 'training_cpr', nanny.training_cpr)}
                                    className={nanny.training_cpr ? 'bg-red-100 text-red-800 hover:bg-red-200' : ''}
                                  >
                                    ❤️ CPR {nanny.training_cpr ? '✓' : ''}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={nanny.training_nanny ? 'default' : 'outline'}
                                    onClick={() => toggleTrainingBadge(nanny.id, 'training_nanny', nanny.training_nanny)}
                                    className={nanny.training_nanny ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : ''}
                                  >
                                    👶 Nanny Training {nanny.training_nanny ? '✓' : ''}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={nanny.training_child_development ? 'default' : 'outline'}
                                    onClick={() => toggleTrainingBadge(nanny.id, 'training_child_development', nanny.training_child_development)}
                                    className={nanny.training_child_development ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' : ''}
                                  >
                                    📚 Child Development {nanny.training_child_development ? '✓' : ''}
                                  </Button>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col gap-3 min-w-[200px]">
                                <Button
                                  size="sm"
                                  variant={nanny.profile_approved ? 'secondary' : 'default'}
                                  onClick={() => approveProfile(nanny.id, !nanny.profile_approved)}
                                  className={nanny.profile_approved ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-600 hover:bg-green-700'}
                                >
                                  {nanny.profile_approved ? (
                                    <>
                                      <X className="h-4 w-4 mr-2" />
                                      Revoke Profile Approval
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve Full Profile
                                    </>
                                  )}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const subject = `Regarding your Nanny Profile - ${profile.first_name}`;
                                    const body = `Dear ${profile.first_name},\n\n`;
                                    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                  }}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Email Nanny
                                </Button>

                                {profile.phone && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => (window.location.href = `tel:${profile.phone}`)}
                                  >
                                    <Phone className="h-4 w-4 mr-2" />
                                    Call Nanny
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Existing Interests Tab - unchanged */}
        <TabsContent value="interests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Interest Management ({interests.length})
              </CardTitle>
              <CardDescription>Manage client interests and payment approvals</CardDescription>
            </CardHeader>
            <CardContent>
              {interests.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No interests found.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {interests.map((interest) => (
                    <Card key={interest.id} className="p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-lg text-blue-700">Client Information</h4>
                              <p>
                                <strong>Name:</strong> {interest.client_first_name} {interest.client_last_name}
                              </p>
                              <p>
                                <strong>Email:</strong> {interest.client_email}
                              </p>
                              <p>
                                <strong>Submitted:</strong>{' '}
                                {new Date(interest.created_at).toLocaleString('en-ZA', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <h4 className="font-semibold text-lg text-green-700">Nanny Information</h4>
                              <p>
                                <strong>Name:</strong> {interest.nanny_first_name} {interest.nanny_last_name}
                              </p>
                              <p>
                                <strong>Email:</strong> {interest.nanny_email}
                              </p>
                              <p>
                                <strong>Status:</strong>{' '}
                                <Badge
                                  className={
                                    interest.status === 'approved'
                                      ? 'bg-green-500'
                                      : interest.status === 'declined'
                                      ? 'bg-red-500'
                                      : 'bg-yellow-500'
                                  }
                                >
                                  {interest.status.toUpperCase()}
                                </Badge>
                              </p>
                            </div>
                          </div>

                          {interest.message && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="font-medium text-gray-700 mb-2">Client's Message:</p>
                              <p className="text-gray-600 italic">"{interest.message}"</p>
                            </div>
                          )}

                          {interest.nanny_response && (
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <p className="font-medium text-blue-700 mb-2">Nanny's Response:</p>
                              <p className="text-blue-600">"{interest.nanny_response}"</p>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="font-medium">Payment Status:</span>{' '}
                              <Badge variant={interest.payment_status === 'completed' ? 'default' : 'secondary'}>
                                {interest.payment_status || 'pending'}
                              </Badge>
                            </div>
                            <div>
                              <span className="font-medium">Admin Approved:</span>{' '}
                              <Badge variant={interest.admin_approved ? 'default' : 'outline'}>
                                {interest.admin_approved ? 'Yes' : 'No'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {interest.status === 'pending' && (
                          <div className="flex flex-col gap-3 min-w-[200px]">
                            <Button
                              onClick={() => handleInterestAction(interest.id, 'approve')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Interest
                            </Button>
                            <Button
                              onClick={() => handleInterestAction(interest.id, 'decline')}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Decline Interest
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

        {/* NEW: Reviews & Complaints Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Reviews & Complaints Management ({filteredReviewsComplaints.length})
              </CardTitle>
              <CardDescription>Manage client reviews and complaints for nannies and cleaners</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <Label htmlFor="type-filter">Type</Label>
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="review">Reviews Only</SelectItem>
                      <SelectItem value="complaint">Complaints Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="review-search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="review-search"
                      placeholder="Search by nanny name, client name, or complaint text..."
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {reviewsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading reviews and complaints...</p>
                </div>
              ) : filteredReviewsComplaints.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {reviewSearch || filterType !== 'all' || filterStatus !== 'all'
                      ? 'No matching reviews or complaints found'
                      : 'No reviews or complaints yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviewsComplaints.map((item) => {
                    const typeBadge = getTypeBadge(item);
                    const statusBadge = getStatusBadge(item.status);
                    const isReview = item.rating !== null;

                    return (
                      <Card key={item.id} className={`border-l-4 ${isReview ? 'border-l-blue-500' : 'border-l-red-500'}`}>
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                            <div className="flex-1 space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-lg">
                                    {isReview ? 'Review' : 'Complaint'} from {item.client_first_name} {item.client_last_name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    For {item.nanny_first_name} {item.nanny_last_name} • 
                                    {new Date(item.created_at).toLocaleDateString('en-ZA', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Badge className={typeBadge.color}>
                                    <div className="flex items-center">
                                      {typeBadge.icon}
                                      {typeBadge.text}
                                    </div>
                                  </Badge>
                                  <Badge className={statusBadge.color}>
                                    {statusBadge.text}
                                  </Badge>
                                </div>
                              </div>

                              {isReview && item.rating && (
                                <div className="flex items-center gap-2">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-5 w-5 ${
                                          star <= item.rating!
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="font-medium">{item.rating}/5</span>
                                </div>
                              )}

                              {item.complaint_text && (
                                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                  <p className="font-medium text-red-700 mb-2">Complaint Details:</p>
                                  <p className="text-red-600">{item.complaint_text}</p>
                                </div>
                              )}

                              {item.admin_response && (
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Shield className="h-4 w-4 text-blue-600" />
                                    <p className="font-medium text-blue-700">Admin Response:</p>
                                  </div>
                                  <p className="text-blue-600">{item.admin_response}</p>
                                  <p className="text-xs text-blue-500 mt-2">
                                    Updated: {new Date(item.updated_at).toLocaleDateString()}
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Client Information</p>
                                  <p>{item.client_first_name} {item.client_last_name}</p>
                                  <p className="text-sm text-muted-foreground">{item.client_email}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Nanny/Cleaner Information</p>
                                  <p>{item.nanny_first_name} {item.nanny_last_name}</p>
                                  <p className="text-sm text-muted-foreground">{item.nanny_email}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 min-w-[200px]">
                              {item.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => setSelectedReview(item)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Respond & Resolve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => updateReviewStatus(item.id, 'dismissed')}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Dismiss
                                  </Button>
                                </>
                              )}
                              {item.status === 'resolved' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  onClick={() => setSelectedReview(item)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Update Response
                                </Button>
                              )}
                              {item.status !== 'archived' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-gray-600 hover:bg-gray-100"
                                  onClick={() => archiveReview(item.id)}
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const subject = `Regarding your ${isReview ? 'review' : 'complaint'} about ${item.nanny_first_name}`;
                                  const body = `Dear ${item.client_first_name},\n\nRegarding your ${isReview ? 'review' : 'complaint'} about ${item.nanny_first_name} ${item.nanny_last_name}:\n\n`;
                                  window.location.href = `mailto:${item.client_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                }}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Email Client
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const subject = `Regarding client ${isReview ? 'review' : 'complaint'}`;
                                  const body = `Dear ${item.nanny_first_name},\n\nRegarding a ${isReview ? 'review' : 'complaint'} from ${item.client_first_name} ${item.client_last_name}:\n\n`;
                                  window.location.href = `mailto:${item.nanny_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                }}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Email Nanny
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Existing Academy Tab - unchanged */}
        <TabsContent value="academy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Academy Videos Management ({academyVideos.length})
              </CardTitle>
              <CardDescription>Manage nanny training content and videos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Academy Video
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Academy Video</DialogTitle>
                    <DialogDescription>
                      Add a new training video to the nanny academy. Make sure to use a reliable video URL.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="title">Video Title *</Label>
                      <Input
                        id="title"
                        value={newVideo.title}
                        onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                        placeholder="e.g., Child Safety Basics"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newVideo.description}
                        onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                        placeholder="Brief description of the video content"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="video_url">Video URL *</Label>
                      <Input
                        id="video_url"
                        value={newVideo.video_url}
                        onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
                        placeholder="https://example.com/video.mp4"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Supported formats: MP4, WebM, OGG. Ensure the URL is publicly accessible.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Duration (minutes) *</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          value={newVideo.duration_minutes}
                          onChange={(e) => setNewVideo({ ...newVideo, duration_minutes: parseInt(e.target.value) || 0 })}
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="order">Order Index *</Label>
                        <Input
                          id="order"
                          type="number"
                          min="0"
                          value={newVideo.order_index}
                          onChange={(e) => setNewVideo({ ...newVideo, order_index: parseInt(e.target.value) || 0 })}
                          placeholder="1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
                      </div>
                    </div>
                    <Button
                      onClick={createAcademyVideo}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={!newVideo.title || !newVideo.video_url || newVideo.duration_minutes <= 0}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Create Academy Video
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-4">
                {academyVideos.map((video) => (
                  <Card key={video.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{video.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{video.description}</p>
                            </div>
                            <Badge
                              variant={video.is_active ? 'default' : 'secondary'}
                              className={video.is_active ? 'bg-green-500' : 'bg-gray-500'}
                            >
                              {video.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{video.duration_minutes} minutes</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Order:</span>
                              <Badge variant="outline">{video.order_index}</Badge>
                            </div>
                          </div>

                          <div className="mt-4">
                            <video
                              controls
                              src={video.video_url}
                              className="w-full max-w-md h-48 rounded-lg border"
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                            <p className="text-xs text-muted-foreground mt-2">
                              <a
                                href={video.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Direct video link
                              </a>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[120px]">
                          <Button
                            size="sm"
                            variant={video.is_active ? 'secondary' : 'default'}
                            onClick={() => toggleVideoActive(video.id, video.is_active)}
                            className={video.is_active ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}
                          >
                            {video.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this academy video?')) {
                                deleteAcademyVideo(video.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
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

        {/* Existing Payments Tab - unchanged */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History ({payments.length})
              </CardTitle>
              <CardDescription>Monitor payment transactions and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No payment records found.</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">Revenue Summary</h4>
                        <p className="text-sm text-muted-foreground">Total completed payments</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          R
                          {payments
                            .filter((p) => p.status === 'completed')
                            .reduce((sum, p) => sum + p.amount, 0)
                            .toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payments.filter((p) => p.status === 'completed').length} successful payments
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <Card key={payment.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div className="space-y-2">
                              <p className="font-semibold text-lg">
                                {payment.profiles.first_name} {payment.profiles.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{payment.profiles.email}</p>
                              <p className="text-sm">
                                {new Date(payment.created_at).toLocaleString('en-ZA', {
                                  dateStyle: 'full',
                                  timeStyle: 'short',
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">R{payment.amount.toFixed(2)}</p>
                              <Badge
                                variant={payment.status === 'completed' ? 'default' : 'secondary'}
                                className={
                                  payment.status === 'completed'
                                    ? 'bg-green-500'
                                    : payment.status === 'pending'
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }
                              >
                                {payment.status.toUpperCase()}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-2">Contact Unlock Payment</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for responding to reviews/complaints */}
      <Dialog open={!!selectedReview} onOpenChange={() => {
        setSelectedReview(null);
        setAdminResponse('');
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedReview?.rating !== null ? 'Respond to Review' : 'Respond to Complaint'}
            </DialogTitle>
            <DialogDescription>
              Add your response and update the status. Your response will be emailed to both parties.
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">
                      {selectedReview.rating !== null ? 'Review' : 'Complaint'} from {selectedReview.client_first_name} {selectedReview.client_last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      About {selectedReview.nanny_first_name} {selectedReview.nanny_last_name}
                    </p>
                  </div>
                  {selectedReview.rating && (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= selectedReview.rating!
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedReview.complaint_text && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-700 mb-1">Complaint:</p>
                    <p className="text-sm text-red-600">{selectedReview.complaint_text}</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="admin-response" className="mb-2 block">
                  Your Response (will be sent via email)
                </Label>
                <Textarea
                  id="admin-response"
                  placeholder="Enter your response here. This will be sent to both the client and the nanny/cleaner..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={6}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => updateReviewStatus(selectedReview.id, 'resolved', adminResponse)}
                  disabled={updatingReview || !adminResponse.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updatingReview ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Resolved
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => updateReviewStatus(selectedReview.id, 'dismissed', adminResponse)}
                  disabled={updatingReview}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}