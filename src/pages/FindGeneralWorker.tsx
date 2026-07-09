// pages/FindGeneralWorker.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MapPin, CheckCircle, X, Eye, CreditCard, Loader2, Star, Sparkles, ShieldCheck, Briefcase, User, Mail, Phone, FileText, Download, Calendar, DollarSign, Home, BriefcaseBusiness } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Flutterwave global declaration
declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

// Types
interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  suburb: string | null;
  town: string | null;
  profile_picture_url: string | null;
  phone?: string | null;
  user_type: string | null;
}

interface GeneralWorker {
  review_count: any;
  id: string;
  user_id: string;
  experience_type: string;
  hourly_rate: number | null;
  bio: string | null;
  profile_approved: boolean | null;
  average_rating: number | null;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  suburb: string | null;
  phone: string | null;
  criminal_check_status: string | null;
  credit_check_status: string | null;
  academy_completed: boolean | null;
  experience_duration: number | null;
  employment_type: string | null;
  cv_url: string | null;
  id_document_url: string | null;
  proof_of_residence_url: string | null;
  languages: string[] | null;
  education_level: string | null;
  date_of_birth: string | null;
  profiles?: Profile | Profile[];
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

interface TermsAcceptanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  onCancel: () => void;
  loading?: boolean;
  workerType: string;
  amount: number;
  workerName: string;
}

// Terms Acceptance Dialog Component
const TermsAcceptanceDialog: React.FC<TermsAcceptanceDialogProps> = ({
  open,
  onOpenChange,
  onAccept,
  onCancel,
  loading = false,
  workerType,
  amount,
  workerName
}) => {
  const [hasAgreed, setHasAgreed] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Terms of Service Agreement
          </DialogTitle>
          <DialogDescription>
            Please review and accept our terms before proceeding with payment for {workerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-primary/5 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Payment Summary:</p>
            <div className="flex justify-between items-center">
              <span>{workerType} Service</span>
              <span className="font-bold text-primary">R{amount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Once-off payment to connect with this worker
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium">By clicking "I Agree" below, you acknowledge that you have read, understood, and agree to be bound by the following terms and conditions:</p>

            <div className="space-y-3">
              <div className="border-l-4 border-primary pl-4 py-2">
                <h4 className="font-semibold text-sm mb-1">1. Use of Website</h4>
                <p className="text-sm text-muted-foreground">You agree to use the nannyplacementssouthafrica.co.za website only for lawful purposes and in accordance with these terms.</p>
              </div>

              <div className="border-l-4 border-primary pl-4 py-2">
                <h4 className="font-semibold text-sm mb-1">2. Indemnification</h4>
                <p className="text-sm text-muted-foreground">You agree to indemnify, defend, and hold harmless Nanny Placements South Africa, its officers, directors, employees, and affiliates from any claims, damages, or expenses arising out of your use of this website or breach of these terms.</p>
              </div>

              <div className="border-l-4 border-primary pl-4 py-2">
                <h4 className="font-semibold text-sm mb-1">3. Disclaimer of Warranties</h4>
                <p className="text-sm text-muted-foreground">This website is provided "as is" without warranties of any kind. Nanny Placements South Africa disclaims all liability for any damages arising from your use of this website.</p>
              </div>

              <div className="border-l-4 border-primary pl-4 py-2">
                <h4 className="font-semibold text-sm mb-1">4. Limitation of Liability</h4>
                <p className="text-sm text-muted-foreground">Nanny Placements South Africa shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of this website.</p>
              </div>

              <div className="border-l-4 border-primary pl-4 py-2">
                <h4 className="font-semibold text-sm mb-1">5. Worker Sourcing</h4>
                <p className="text-sm text-muted-foreground">You understand that Nanny Placements South Africa is a platform connecting families with workers. We do not employ or supervise workers listed on our platform. You are responsible for conducting your own checks and ensuring suitability.</p>
              </div>

              <div className="border-l-4 border-primary pl-4 py-2">
                <h4 className="font-semibold text-sm mb-1">6. Compliance with Laws</h4>
                <p className="text-sm text-muted-foreground">You agree to comply with all applicable laws and regulations in using our services.</p>
              </div>
            </div>

            <div className="flex items-start space-x-2 pt-4">
              <Checkbox
                id="terms"
                checked={hasAgreed}
                onCheckedChange={(checked) => setHasAgreed(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I have read and agree to the terms and conditions above
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setHasAgreed(false);
              onCancel();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (hasAgreed) {
                onAccept();
              }
            }}
            disabled={!hasAgreed || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'I Agree & Proceed to Payment'
            )}
          </Button>
        </DialogFooter>
        <p className="text-xs text-center text-muted-foreground mt-2">
          By clicking "I Agree & Proceed to Payment", you confirm you have read and agree to these terms.
        </p>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to get worker profile info with privacy - ONLY FIRST NAME visible until paid
const getWorkerProfileInfo = (worker: GeneralWorker, showFullName: boolean = false) => {
  if (worker.profiles) {
    const p = Array.isArray(worker.profiles) ? worker.profiles[0] : worker.profiles;
    return {
      first_name: showFullName ? (p.first_name || worker.first_name || 'No name') : (p.first_name || worker.first_name || 'No name'),
      last_name: showFullName ? (p.last_name || worker.last_name || '') : '', // HIDE LAST NAME unless paid
      fullName: showFullName ? `${p.first_name || worker.first_name || 'No name'} ${p.last_name || worker.last_name || ''}` : (p.first_name || worker.first_name || 'No name'),
      city: p.city || worker.city || 'Location not specified',
      suburb: p.suburb || worker.suburb || '',
      town: p.town || '',
      profile_picture_url: p.profile_picture_url || null,
      email: showFullName ? (p.email || '') : '', // HIDE EMAIL unless paid
      phone: showFullName ? (p.phone || worker.phone || null) : null, // HIDE PHONE unless paid
      cv_url: showFullName ? (worker.cv_url || null) : null, // HIDE CV unless paid
      showFullDetails: showFullName
    };
  }
  return {
    first_name: showFullName ? (worker.first_name || 'No name') : (worker.first_name || 'No name'),
    last_name: showFullName ? (worker.last_name || '') : '',
    fullName: showFullName ? `${worker.first_name || 'No name'} ${worker.last_name || ''}` : (worker.first_name || 'No name'),
    city: worker.city || 'Location not specified',
    suburb: worker.suburb || '',
    town: '',
    profile_picture_url: null,
    email: showFullName ? '' : '',
    phone: showFullName ? (worker.phone || null) : null,
    cv_url: showFullName ? (worker.cv_url || null) : null,
    showFullDetails: showFullName
  };
};

const extractInterestId = (txRef: string): string | null => {
  if (!txRef) return null;
  let cleanRef = txRef.startsWith("generalworker-") ? txRef.substring(15) : txRef;
  const parts = cleanRef.split("-");
  if (parts.length < 5) return null;
  const uuid = parts.slice(0, 5).join("-");
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid) ? uuid : null;
};

const sendInterestNotificationEmail = async (data: any): Promise<{success: boolean, message?: string}> => {
  try {
    const response = await fetch('https://nannyplacementssouthafrica.co.za/send-interest-notification.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return response.ok ? { success: true } : { success: false, message: result.error };
  } catch (error) {
    console.error('Interest notification error:', error);
    return { success: false, message: 'Failed to send interest notification' };
  }
};

const sendPaymentSuccessEmail = async (data: any): Promise<{success: boolean, message?: string}> => {
  try {
    const response = await fetch('https://nannyplacementssouthafrica.co.za/send-payment-success.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return response.ok ? { success: true } : { success: false, message: result.error };
  } catch (error) {
    console.error('Payment success email error:', error);
    return { success: false, message: 'Failed to send payment success email' };
  }
};

const sendReviewNotificationEmail = async (data: any): Promise<{success: boolean, message?: string}> => {
  try {
    const response = await fetch('https://nannyplacementssouthafrica.co.za/send-review-notification.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return response.ok ? { success: true } : { success: false, message: result.error };
  } catch (error) {
    console.error('Review notification error:', error);
    return { success: false, message: 'Failed to send review notification' };
  }
};

const processPaymentSuccess = async (interestId: string, transactionId: string, clientData: any) => {
  try {
    console.log('🔄 Starting payment processing for worker interest:', interestId);
    
    const { data: existingPayments, error: paymentCheckError } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId);

    if (paymentCheckError) {
      console.error('❌ Error checking payments:', paymentCheckError);
      throw paymentCheckError;
    }

    const existingPayment = existingPayments && existingPayments.length > 0 ? existingPayments[0] : null;

    if (existingPayment) {
      console.log('✅ Payment already exists in payments table');
      
      const { data: existingInterest } = await supabase
        .from('interests')
        .select('payment_status')
        .eq('id', interestId)
        .single();

      if (existingInterest && existingInterest.payment_status !== 'completed') {
        const { error: interestUpdateError } = await supabase
          .from('interests')
          .update({
            payment_status: 'completed',
            status: 'approved'
          })
          .eq('id', interestId);

        if (interestUpdateError) {
          console.error('❌ Error updating interest payment_status:', interestUpdateError);
          throw interestUpdateError;
        }
        console.log('✅ Interest payment_status updated to completed');
      }
      
      return true;
    }

    const { data: interestData, error: interestError } = await supabase
      .from('interests')
      .select('id, nanny_id, client_id, payment_status, status')
      .eq('id', interestId)
      .single();

    if (interestError || !interestData) {
      console.error('❌ Worker interest not found:', interestError);
      throw new Error('Interest record not found');
    }

    const feeAmount = 50;

    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        client_id: clientData.id,
        nanny_id: interestData.nanny_id,
        interest_id: interestId,
        amount: feeAmount,
        status: 'completed',
        payment_method: 'flutterwave',
        transaction_id: transactionId,
        created_at: new Date().toISOString()
      });

    if (paymentError) {
      console.error('❌ Error creating payment record:', paymentError);
      throw paymentError;
    }
    console.log('✅ Payment record created');

    const { error: interestUpdateError } = await supabase
      .from('interests')
      .update({
        payment_status: 'completed',
        status: 'approved'
      })
      .eq('id', interestId);

    if (interestUpdateError) {
      console.error('❌ Error updating interest payment_status:', interestUpdateError);
      throw interestUpdateError;
    }
    console.log('✅ Interest payment_status updated to completed');

    return true;
  } catch (error) {
    console.error('❌ Error in payment processing:', error);
    throw error;
  }
};

export default function FindGeneralWorker() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [workers, setWorkers] = useState<GeneralWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ 
    city: '', 
    town: '',
    employmentType: ''
  });
  const [selectedWorker, setSelectedWorker] = useState<GeneralWorker | null>(null);
  const [interestMessage, setInterestMessage] = useState('');
  const [sendingInterest, setSendingInterest] = useState(false);
  const [existingInterests, setExistingInterests] = useState<Interest[]>([]);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [pendingPaymentDetails, setPendingPaymentDetails] = useState<{
    worker: GeneralWorker;
    interestId: string;
  } | null>(null);
  const hasProcessedRedirect = useRef(false);

  const hasRole = userRole === 'client';

  // Worker type display name
  const workerTypeName = 'General Worker';
  const workerFee = 50;
  const workerSlug = 'generalworker';

  useEffect(() => {
    // Load Flutterwave script
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Handle payment redirect after successful payment
  useEffect(() => {
    const handlePaymentRedirect = async () => {
      if (hasProcessedRedirect.current) {
        console.log('⏸️ Already processed redirect, skipping...');
        return;
      }

      if (authLoading) {
        console.log('⏳ Waiting for auth to load...');
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('status');
      const txRef = urlParams.get('tx_ref');
      const transactionId = urlParams.get('transaction_id');
      
      console.log('🔍 Worker payment redirect check:', { status, txRef, transactionId });
      
      if (status === 'successful' && txRef && transactionId) {
        hasProcessedRedirect.current = true;
        console.log('✅ Worker payment successful redirect detected, starting processing...');
        
        try {
          if (!user) {
            console.log('⏸️ No user, skipping payment processing');
            window.history.replaceState({}, document.title, window.location.pathname);
            hasProcessedRedirect.current = false;
            return;
          }

          if (userRole !== 'client') {
            console.log('⏸️ User is not a client');
            window.history.replaceState({}, document.title, window.location.pathname);
            hasProcessedRedirect.current = false;
            return;
          }

          const interestId = extractInterestId(txRef);
          if (!interestId) {
            toast({
              title: "Payment Error",
              description: "Could not extract payment information. Please contact support.",
              variant: "destructive"
            });
            window.history.replaceState({}, document.title, window.location.pathname);
            hasProcessedRedirect.current = false;
            return;
          }

          console.log('🎯 Processing worker payment for interest:', interestId);

          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (clientError || !clientData) {
            console.error('❌ Client not found:', clientError);
            toast({
              title: "Client Not Found",
              description: "Client information not found. Please complete your client profile.",
              variant: "destructive"
            });
            window.history.replaceState({}, document.title, window.location.pathname);
            hasProcessedRedirect.current = false;
            return;
          }

          console.log('👤 Client found:', clientData.id);

          const { data: interestData, error: interestError } = await supabase
            .from('interests')
            .select('id, nanny_id, client_id, payment_status, status')
            .eq('id', interestId)
            .single();

          if (interestError || !interestData) {
            console.error('❌ Worker interest not found:', interestError);
            toast({
              title: "Payment Record Error",
              description: "Could not find interest record. Please contact support.",
              variant: "destructive"
            });
            window.history.replaceState({}, document.title, window.location.pathname);
            hasProcessedRedirect.current = false;
            return;
          }

          if (interestData.client_id !== clientData.id) {
            console.error('❌ Client mismatch');
            toast({
              title: "Access Denied",
              description: "This payment does not belong to your account.",
              variant: "destructive"
            });
            window.history.replaceState({}, document.title, window.location.pathname);
            hasProcessedRedirect.current = false;
            return;
          }

          if (interestData.payment_status === 'completed') {
            console.log('✅ Worker interest already paid');
            toast({
              title: "Already Paid",
              description: "This interest has already been paid.",
            });
            window.history.replaceState({}, document.title, window.location.pathname);
            hasProcessedRedirect.current = false;
            return;
          }

          await processPaymentSuccess(interestId, transactionId, clientData);

          const { data: workerData } = await supabase
            .from('nannies')
            .select('first_name, last_name')
            .eq('id', interestData.nanny_id)
            .single();

          const { data: clientProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', user.id)
            .single();

          const { data: workerProfile } = await supabase
            .from('profiles')
            .select('phone, email')
            .eq('id', interestData.nanny_id)
            .single();

          if (workerData && clientProfile) {
            console.log('📧 Attempting to send payment success email...');
            
            const paymentEmailData = {
              to: clientProfile.email,
              client_name: `${clientProfile.first_name} ${clientProfile.last_name || ''}`,
              worker_name: `${workerData.first_name} ${workerData.last_name || ''}`,
              worker_phone: workerProfile?.phone || 'Not provided',
              worker_email: workerProfile?.email || 'Not provided',
              transaction_id: transactionId,
              amount: workerFee.toString(),
              service_type: workerTypeName,
              description: `General Worker service - contact details unlocked`
            };

            await sendPaymentSuccessEmail(paymentEmailData).catch(err => 
              console.error('Payment success email failed silently:', err)
            );
          }

          toast({
            title: "🎉 Payment Successful!",
            description: "Contact details have been unlocked. Refreshing...",
          });

          window.history.replaceState({}, document.title, `/find-${workerSlug}`);
          await fetchExistingInterests();
          setRefreshCount(prev => prev + 1);

          console.log('✅ Worker payment processed successfully');

        } catch (error: any) {
          console.error('❌ Error processing worker payment redirect:', error);
          if (!error.message?.includes('already processed') && 
              !error.message?.includes('already paid')) {
            toast({
              title: "Payment Processing Error",
              description: "Please contact support if the payment was deducted but contact details aren't showing.",
              variant: "destructive"
            });
          }
        } finally {
          setTimeout(() => {
            hasProcessedRedirect.current = false;
          }, 10000);
        }
      }
    };

    handlePaymentRedirect();
  }, [user, userRole, toast, authLoading]);

  useEffect(() => {
    fetchWorkers();
    if (user && hasRole) {
      fetchExistingInterests();
      const subscription = supabase
        .channel('worker-interests-channel')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'interests', 
          filter: `client_id=eq.${user.id}` 
        }, (payload) => {
          console.log('Worker real-time update received:', payload);
          fetchExistingInterests();
        })
        .subscribe((status) => {
          console.log('Worker subscription status:', status);
        });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, hasRole, refreshCount]);

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('nannies')
        .select(`
          *,
          profiles!inner(
            id,
            email,
            first_name,
            last_name,
            city,
            suburb,
            town,
            profile_picture_url,
            phone,
            user_type
          )
        `)
        .eq('profile_approved', true)
        .eq('experience_type', 'general_worker')
        .order('average_rating', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching workers:', error);
        // Don't show toast for "no results" - just set empty array
        setWorkers([]);
      } else {
        console.log('Fetched workers data:', data);
        setWorkers(data || []);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
      // Don't show toast for fetch errors - just set empty array
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingInterests = async () => {
    if (!user) return;

    try {
      console.log('🔍 Fetching client interests for workers...');
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientData) {
        const { data: interests, error } = await supabase
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

        if (error) {
          console.error('❌ Error fetching worker interests:', error);
          throw error;
        }

        console.log('📋 Fetched worker interests with payment_status:', interests);
        setExistingInterests(interests || []);
        
        const { data: payments } = await supabase
          .from('payments')
          .select('interest_id, status')
          .eq('client_id', clientData.id)
          .eq('status', 'completed');
          
        console.log('💳 Completed payments for workers:', payments);
        
        if (payments && payments.length > 0) {
          console.log('🔄 Verifying payment_status consistency for workers...');
          for (const payment of payments) {
            const interest = interests?.find(i => i.id === payment.interest_id);
            if (interest && interest.payment_status !== 'completed') {
              console.warn(`⚠️ Inconsistency found: Payment exists for worker interest ${payment.interest_id} but payment_status is not 'completed'`);
              await supabase
                .from('interests')
                .update({ 
                  payment_status: 'completed',
                  status: 'approved'
                })
                .eq('id', payment.interest_id);
            }
          }
        }
      } else {
        console.log('No client data found for user');
        setExistingInterests([]);
      }
    } catch (error) {
      console.error('Error fetching existing worker interests:', error);
      setExistingInterests([]);
    }
  };

  const getInterestStatusForWorker = (workerId: string): Interest | null => {
    const interest = existingInterests.find(i => i.nanny_id === workerId);
    return interest || null;
  };

  const isInterestApprovedByWorker = (interest: Interest | null): boolean => {
    if (!interest) return false;
    return interest.status === 'approved' || 
           interest.nanny_response === 'approved' || 
           interest.admin_approved === true;
  };

  const isPaymentCompleted = (interest: Interest | null): boolean => {
    if (!interest) return false;
    return interest.payment_status === 'completed';
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

  const sendInterestNotificationEmails = async (worker: GeneralWorker, clientProfile: any, message: string) => {
    try {
      const workerProfile = getWorkerProfileInfo(worker, false);
      
      const workerEmailData = {
        to: workerProfile.email,
        subject: 'New Client Interest - Nanny Placements SA',
        worker_name: `${workerProfile.first_name} ${workerProfile.last_name || ''}`,
        client_name: `${clientProfile.first_name} ${clientProfile.last_name || ''}`,
        client_message: message,
        client_email: clientProfile.email
      };

      const result = await sendInterestNotificationEmail(workerEmailData);
      
      if (result.success) {
        console.log('Worker interest notification sent successfully');
      } else {
        console.warn('Worker interest notification email may have failed:', result.message);
      }

      return result.success;

    } catch (error) {
      console.error('Error sending worker interest notification emails:', error);
      return false;
    }
  };

  const handleExpressInterest = async () => {
    if (!selectedWorker || !user) return;

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
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone, city, suburb')
          .eq('id', user.id)
          .single();

        if (!profileData) {
          throw new Error('Profile not found');
        }

        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            phone: profileData.phone,
            city: profileData.city,
            suburb: profileData.suburb
          })
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
        .eq('nanny_id', selectedWorker.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existingInterest) {
        toast({
          title: "Interest Already Sent",
          description: "You have already expressed interest in this worker. Please wait for their response or contact admin.",
          variant: "destructive"
        });
        setSelectedWorker(null);
        setSendingInterest(false);
        return;
      }

      const workerProfile = getWorkerProfileInfo(selectedWorker, false);
      
      const { error } = await supabase
        .from('interests')
        .insert({
          client_id: clientId,
          nanny_id: selectedWorker.id,
          message: interestMessage || null,
          status: 'pending',
          created_at: new Date().toISOString(),
          admin_approved: false,
          nanny_response: null,
          payment_status: null,
          client_first_name: clientProfile.first_name,
          client_last_name: clientProfile.last_name,
          client_email: clientProfile.email,
          nanny_first_name: workerProfile.first_name,
          nanny_last_name: workerProfile.last_name,
          nanny_email: workerProfile.email,
        });

      if (error) throw error;

      await sendInterestNotificationEmails(selectedWorker, clientProfile, interestMessage);

      toast({
        title: "Interest Sent!",
        description: "The worker will be notified of your interest and can approve or decline it.",
      });

      setSelectedWorker(null);
      setInterestMessage('');
      fetchExistingInterests();
    } catch (error: any) {
      console.error('Error expressing interest in worker:', error.message);
      toast({
        title: "Error",
        description: error.message || "Failed to express interest",
        variant: "destructive"
      });
    } finally {
      setSendingInterest(false);
    }
  };

  const handlePayment = async (worker: GeneralWorker, interestId: string) => {
    setPendingPaymentDetails({ worker, interestId });
    setShowTermsDialog(true);
  };

  const handleTermsAccepted = async () => {
    if (!pendingPaymentDetails || !window.FlutterwaveCheckout) {
      toast({
        title: "Payment Error",
        description: "Payment system is not available. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    const { worker, interestId } = pendingPaymentDetails;
    setShowTermsDialog(false);
    setProcessingPayment(worker.id);
    
    try {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!clientData) {
        toast({
          title: "Client Error",
          description: "Client information not found. Please complete your client profile.",
          variant: "destructive"
        });
        setProcessingPayment(null);
        setPendingPaymentDetails(null);
        return;
      }

      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('id', user?.id)
        .single();

      const flutterwavePublicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
            
      if (!flutterwavePublicKey) {
        toast({
          title: "Configuration Error",
          description: "Payment gateway not configured properly.",
          variant: "destructive"
        });
        setProcessingPayment(null);
        setPendingPaymentDetails(null);
        return;
      }

      const workerProfile = getWorkerProfileInfo(worker, false);
      const timestamp = Date.now();
      const txRef = `${workerSlug}-${interestId}-${timestamp}`;
      
      console.log('💰 Starting worker payment with:', { 
        interestId, 
        txRef,
        workerId: worker.id,
        clientId: clientData.id,
        amount: workerFee
      });
      
      window.FlutterwaveCheckout({
        public_key: flutterwavePublicKey,
        tx_ref: txRef,
        amount: workerFee,
        currency: "ZAR",
        payment_options: "card, mobilemoneyghana, ussd",
        redirect_url: `https://nannyplacementssouthafrica.co.za/find-${workerSlug}`,
        customer: {
          email: clientProfile?.email || user?.email || "",
          phone_number: clientProfile?.phone || "",
          name: `${clientProfile?.first_name} ${clientProfile?.last_name}` || "Client",
        },
        customizations: {
          title: "Nanny Placements SA",
          description: `Payment for ${workerTypeName} service`,
          logo: "/favicon.ico",
        },
        callback: async (response: any) => {
          console.log('💳 Worker payment callback response:', response);
                  
          if (response.status === "successful") {
            toast({
              title: "Payment Processing",
              description: "Processing your payment...",
            });
            
            console.log('✅ Worker payment successful, redirecting...');
            window.location.href = `https://nannyplacementssouthafrica.co.za/find-${workerSlug}?status=successful&tx_ref=${encodeURIComponent(txRef)}&transaction_id=${response.transaction_id}`;
            
          } else {
            console.log('❌ Worker payment failed:', response);
            toast({
              title: "Payment Failed",
              description: "Payment was not successful. Please try again.",
              variant: "destructive"
            });
          }
          setProcessingPayment(null);
          setPendingPaymentDetails(null);
        },
        onclose: () => {
          console.log('Worker payment modal closed');
          setProcessingPayment(null);
          setPendingPaymentDetails(null);
        }
      });
    } catch (error) {
      console.error('Worker payment initialization error:', error);
      toast({
        title: "Payment Error",
        description: "An error occurred during payment processing.",
        variant: "destructive"
      });
      setProcessingPayment(null);
      setPendingPaymentDetails(null);
    }
  };

  const handleTermsCancel = () => {
    setShowTermsDialog(false);
    setPendingPaymentDetails(null);
    toast({
      title: "Payment Cancelled",
      description: "You have cancelled the payment process.",
    });
  };

  const submitReview = async () => {
    if (!selectedWorker || !rating || !user) return;
    setSubmittingReview(true);
    try {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!client) throw new Error('Client not found');

      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('nanny_id', selectedWorker.id)
        .eq('client_id', client.id)
        .single();

      if (existingReview) {
        throw new Error('You have already reviewed this worker');
      }

      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          nanny_id: selectedWorker.id,
          client_id: client.id,
          rating,
          complaint_text: review.trim() || null,
          created_at: new Date().toISOString()
        });

      if (reviewError) throw reviewError;

      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single();

      const workerProfile = getWorkerProfileInfo(selectedWorker, false);

      if (clientProfile) {
        await sendReviewNotificationEmail({
          to: 'admin@nannyplacementssouthafrica.co.za',
          client_name: `${clientProfile.first_name} ${clientProfile.last_name || ''}`,
          client_email: clientProfile.email,
          worker_name: `${workerProfile.first_name} ${workerProfile.last_name || ''}`,
          rating: rating,
          review_text: review.trim() || 'No review text provided'
        }).catch(err => console.error('Review notification email failed:', err));
      }

      toast({
        title: "Thank You!",
        description: "Your review has been submitted successfully."
      });

      fetchWorkers();
      setRating(0);
      setReview('');
      setSelectedWorker(null);

    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const workerProfile = getWorkerProfileInfo(worker, false);
    
    if (filters.city && !workerProfile.city?.toLowerCase().includes(filters.city.toLowerCase())) {
      return false;
    }
    if (filters.town && !workerProfile.suburb?.toLowerCase().includes(filters.town.toLowerCase()) && 
        !workerProfile.town?.toLowerCase().includes(filters.town.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading available workers...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Terms Acceptance Dialog */}
      <TermsAcceptanceDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
        onAccept={handleTermsAccepted}
        onCancel={handleTermsCancel}
        loading={processingPayment !== null}
        workerType={workerTypeName}
        amount={workerFee}
        workerName={pendingPaymentDetails ? getWorkerProfileInfo(pendingPaymentDetails.worker, false).first_name : ''}
      />

      <div className="mb-10">
  <div className="flex items-center gap-4 mb-3">
    <div className="p-3 rounded-xl bg-primary/10 text-primary">
      <BriefcaseBusiness className="h-8 w-8" />
    </div>
    <div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
        Find a General Worker
      </h1>
      <div className="flex items-center gap-3 mt-1">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
          Reliable Workers
        </span>
      </div>
    </div>
  </div>
  
  {/* STYLE D: Professional descriptions */}
  <p className="text-muted-foreground text-base md:text-lg font-medium tracking-wide ml-0 md:ml-[76px]">
    Looking for someone to help you <span className="text-primary font-semibold bg-primary/5 px-1.5 py-0.5 rounded">pack boxes, carry heavy items, painting, construction work</span>, or any other general labor tasks?
  </p>
  <p className="text-muted-foreground text-base font-medium tracking-wide ml-0 md:ml-[76px] mt-2">
    Browse verified workers available in your area for once-off jobs. <span className="text-primary font-semibold bg-primary/5 px-1.5 py-0.5 rounded">R{workerFee} once-off sourcing fee</span> to unlock contact details.
  </p>
  
  <div className="flex flex-wrap gap-3 mt-3 ml-0 md:ml-[76px]">
    <span className="text-sm text-muted-foreground">✓ Verified profiles</span>
    <span className="text-sm text-muted-foreground">✓ Background checked</span>
    <span className="text-sm text-muted-foreground">✓ Flexible hours</span>
  </div>
</div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filter Workers</CardTitle>
          <CardDescription>Find the perfect worker for your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
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
              <Label htmlFor="town">Town / Suburb</Label>
              <Input
                id="town"
                placeholder="Search by town or suburb"
                value={filters.town}
                onChange={(e) => setFilters(prev => ({ ...prev, town: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkers.map((worker) => {
          const workerProfile = getWorkerProfileInfo(worker, false);
          const interest = getInterestStatusForWorker(worker.id);
          const hasInterest = !!interest;
          const isApproved = interest ? isInterestApprovedByWorker(interest) : false;
          const isPaid = interest ? isPaymentCompleted(interest) : false;
          
          const showFullName = isPaid;
          const displayProfile = getWorkerProfileInfo(worker, showFullName);

          return (
            <Card key={worker.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  {displayProfile.profile_picture_url ? (
                    <img 
                      src={displayProfile.profile_picture_url}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Briefcase className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    {/* ONLY FIRST NAME shown until paid */}
                    <h3 className="text-lg font-semibold">{displayProfile.first_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {displayProfile.city}{displayProfile.suburb ? `, ${displayProfile.suburb}` : ''}
                    </p>
                    {worker.average_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {worker.average_rating.toFixed(1)}
                          {worker.review_count && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({worker.review_count})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    {/* ONLY FIRST NAME shown until paid */}
                    <h3 className="text-xl font-semibold">{displayProfile.first_name}</h3>
                    <p className="text-muted-foreground">
                      {displayProfile.city}{displayProfile.town ? `, ${displayProfile.town}` : ''}
                    </p>
                    <p className="text-sm font-medium mt-1">R{worker.hourly_rate || 50}/hour</p>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-wrap gap-1 mt-1">
                      {worker.profile_approved && (
                        <Badge variant="default">Profile Verified</Badge>
                      )}
                      {worker.criminal_check_status === 'approved' && (
                        <Badge variant="default">Criminal Check ✓</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {worker.bio && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {worker.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedWorker(worker)}
                  >
                    View Profile
                  </Button>
                  {user && hasRole && (
                    <>
                      {!hasInterest ? (
                        <Button 
                          className="flex-1"
                          onClick={() => setSelectedWorker(worker)}
                        >
                          Express Interest
                        </Button>
                      ) : isPaid ? (
                        <div className="flex-1 flex items-center justify-center p-2 bg-green-100 text-green-800 rounded-md">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Contact Unlocked
                        </div>
                      ) : isApproved ? (
                        <Button 
                          className="flex-1"
                          variant="default"
                          onClick={() => interest?.id && handlePayment(worker, interest.id)}
                          disabled={processingPayment === worker.id}
                        >
                          {processingPayment === worker.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Pay R{workerFee} to Unlock Contact
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          className="flex-1"
                          variant="secondary"
                          disabled
                        >
                          Awaiting Worker Response
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredWorkers.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No workers found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or check back later for new profiles.
          </p>
        </div>
      )}

      <Dialog open={!!selectedWorker} onOpenChange={() => setSelectedWorker(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Worker Profile - {selectedWorker ? getWorkerProfileInfo(selectedWorker, false).first_name : ''}</DialogTitle>
            <DialogDescription>
              Detailed worker information and contact options
            </DialogDescription>
          </DialogHeader>
                    
          {selectedWorker && (() => {
            const interest = getInterestStatusForWorker(selectedWorker.id);
            const hasInterest = !!interest;
            const isApproved = interest ? isInterestApprovedByWorker(interest) : false;
            const isPaid = interest ? isPaymentCompleted(interest) : false;
            
            const showFullDetails = isPaid;
            const workerProfile = getWorkerProfileInfo(selectedWorker, showFullDetails);
            
            return (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  {workerProfile.profile_picture_url && (
                    <img
                      src={workerProfile.profile_picture_url}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    {/* Show full name only if paid, otherwise only first name */}
                    <h3 className="text-2xl font-bold">{showFullDetails ? workerProfile.fullName : workerProfile.first_name}</h3>
                    <p className="text-muted-foreground">
                      {workerProfile.city}{workerProfile.suburb ? `, ${workerProfile.suburb}` : ''}{workerProfile.town ? `, ${workerProfile.town}` : ''}
                    </p>
                    <div className="flex gap-4 mt-1">
                      {selectedWorker.hourly_rate && (
                        <p className="text-lg font-semibold text-primary">
                          R{selectedWorker.hourly_rate}/hour
                        </p>
                      )}
                      {selectedWorker.average_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{selectedWorker.average_rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedWorker.profile_approved && (
                        <Badge variant="default">Profile Verified</Badge>
                      )}
                      {selectedWorker.criminal_check_status === 'approved' && (
                        <Badge variant="default">Criminal Check ✓</Badge>
                      )}
                      {selectedWorker.academy_completed && (
                        <Badge variant="secondary">Training Complete</Badge>
                      )}
                    </div>
                    
                    {/* Show contact details and CV only if paid */}
                    {showFullDetails && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg">
                        <p className="font-semibold text-green-800">Contact Information (Unlocked)</p>
                        <p className="text-sm text-green-700">📧 Email: {workerProfile.email}</p>
                        <p className="text-sm text-green-700">📞 Phone: {workerProfile.phone}</p>
                        {workerProfile.cv_url && (
                          <p className="text-sm text-green-700 mt-2">
                            📄 <a href={workerProfile.cv_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-800">
                              View CV / Resume
                            </a>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {selectedWorker.bio && (
                  <div>
                    <h4 className="font-semibold mb-2">About Me</h4>
                    <p className="text-muted-foreground">{selectedWorker.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedWorker.experience_duration !== null && (
                    <div>
                      <h4 className="font-semibold mb-2">Experience</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedWorker.experience_duration === 0 ? 'No experience' : 
                         selectedWorker.experience_duration === 2 ? '1-2 years experience' :
                         selectedWorker.experience_duration === 4 ? '3-4 years experience' :
                         selectedWorker.experience_duration === 10 ? '5-10 years experience' :
                         selectedWorker.experience_duration === 15 ? '10+ years experience' : 
                         `${selectedWorker.experience_duration} months experience`}
                      </p>
                    </div>
                  )}
                  {selectedWorker.employment_type && (
                    <div>
                      <h4 className="font-semibold mb-2">Availability</h4>
                      <p className="capitalize">{selectedWorker.employment_type.replace('_', ' ')}</p>
                    </div>
                  )}
                  {selectedWorker.languages && selectedWorker.languages.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Languages</h4>
                      <p className="text-sm text-muted-foreground">{selectedWorker.languages.join(', ')}</p>
                    </div>
                  )}
                </div>

                {isPaid && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Star className="h-5 w-5" /> Rate & Review This Worker
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your feedback helps other clients and improves our service quality
                    </p>
                    
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    
                    <div className="mb-4">
                      <Label htmlFor="review" className="mb-2 block">
                        Your Feedback (Optional)
                      </Label>
                      <Textarea
                        id="review"
                        placeholder="Share your experience with this worker..."
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        rows={3}
                        className="w-full"
                      />
                    </div>
                    
                    <Button
                      onClick={submitReview}
                      disabled={submittingReview || rating === 0}
                      className="w-full"
                    >
                      {submittingReview ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting Review...
                        </>
                      ) : (
                        'Submit Review'
                      )}
                    </Button>
                    
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Your review will be visible to other clients and helps maintain quality standards
                    </p>
                  </div>
                )}

                {user && hasRole && !isPaid && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Express Interest</h4>
                    <div className="space-y-3">
                      {!hasInterest ? (
                        <>
                          <textarea
                            className="w-full p-3 border rounded-md resize-none"
                            rows={3}
                            value={interestMessage}
                            onChange={(e) => setInterestMessage(e.target.value)}
                            placeholder="Tell the worker about your job requirements, timing, and any specific needs..."
                          />
                                          
                          {!isProfileComplete(user.id) && (
                            <div className="text-sm text-red-600">
                              Please complete your profile (name, email, phone, and city are required) to send an interest.{' '}
                              <a href="/profile" className="underline">Complete Profile</a>
                            </div>
                          )}
                                          
                          <Button 
                            onClick={handleExpressInterest} 
                            disabled={sendingInterest || !interestMessage.trim() || !isProfileComplete(user.id)}
                            className="w-full"
                          >
                            {sendingInterest ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                              </>
                            ) : 'Express Interest'}
                          </Button>
                        </>
                      ) : isApproved ? (
                        <Button 
                          className="w-full" 
                          variant="default"
                          onClick={() => interest?.id && handlePayment(selectedWorker, interest.id)}
                          disabled={processingPayment === selectedWorker.id}
                        >
                          {processingPayment === selectedWorker.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Pay R{workerFee} to Unlock Contact Details
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          className="w-full"
                          variant="secondary"
                          disabled
                        >
                          Interest Pending - Awaiting Worker Response
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
                    
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedWorker(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}