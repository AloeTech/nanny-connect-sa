import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MapPin, CheckCircle, X, Eye, CreditCard, Loader2, Star, Sparkles, ShieldCheck } from "lucide-react";
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

interface Cleaner {
  review_count: any;
  id: string;
  user_id: string;
  experience_type: string;               // "cleaning" or "both"
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
  training_cleaning: boolean | null;
  training_specialized: boolean | null;
  experience_duration: number | null;
  employment_type: string | null;
  profiles?: Profile | Profile[];
}

interface Interest {
  id: string;
  client_id: string;
  nanny_id: string;                      // cleaner id here
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

// Cleaning type options with fees
const cleaningTypes = [
  { value: 'once_off', label: 'Once-off Cleaning', fee: 400, description: 'Admin arranges cleaner to visit your location' },
  { value: 'part_time', label: 'Part-time Cleaning', fee: 200, description: 'Sourcing fee - arrange directly with cleaner' },
  { value: 'full_time', label: 'Full-time Cleaning', fee: 200, description: 'Sourcing fee - arrange directly with cleaner' }
];

const getCleanerProfileInfo = (cleaner: Cleaner) => {
  if (cleaner.profiles) {
    const p = Array.isArray(cleaner.profiles) ? cleaner.profiles[0] : cleaner.profiles;
    return {
      first_name: p.first_name || cleaner.first_name || 'No name',
      last_name: p.last_name || cleaner.last_name || '',
      city: p.city || cleaner.city || 'Location not specified',
      suburb: p.suburb || cleaner.suburb || '',
      town: p.town || '',
      profile_picture_url: p.profile_picture_url || null,
      email: p.email || '',
      phone: p.phone || cleaner.phone || null
    };
  }
  return {
    first_name: cleaner.first_name || 'No name',
    last_name: cleaner.last_name || '',
    city: cleaner.city || 'Location not specified',
    suburb: cleaner.suburb || '',
    town: '',
    profile_picture_url: null,
    email: '',
    phone: cleaner.phone || null
  };
};

const extractInterestId = (txRef: string): string | null => {
  if (!txRef) return null;
  let cleanRef = txRef.startsWith("cleaner-") ? txRef.substring(8) : txRef;
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
    console.log('🔄 Starting payment processing for cleaner interest:', interestId);
    
    // Check if payment already exists
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

    // Get interest details
    const { data: interestData, error: interestError } = await supabase
      .from('interests')
      .select('id, nanny_id, client_id, payment_status, status')
      .eq('id', interestId)
      .single();

    if (interestError || !interestData) {
      console.error('❌ Cleaner interest not found:', interestError);
      throw new Error('Interest record not found');
    }

    // Get the cleaning type from interest message or default
    const cleaningType = 'once_off'; // You might want to store this in the interest table
    const feeAmount = cleaningTypes.find(t => t.value === cleaningType)?.fee || 200;

    // Create payment record
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

    // Update interest payment_status
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

export default function FindCleaner() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ 
    city: '', 
    town: '',
    employmentType: ''
  });
  const [cleaningType, setCleaningType] = useState('');
  const [selectedCleaner, setSelectedCleaner] = useState<Cleaner | null>(null);
  const [interestMessage, setInterestMessage] = useState('');
  const [sendingInterest, setSendingInterest] = useState(false);
  const [existingInterests, setExistingInterests] = useState<Interest[]>([]);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const hasProcessedRedirect = useRef(false);

  const hasRole = userRole === 'client';

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
      
      console.log('🔍 Cleaner payment redirect check:', { status, txRef, transactionId });
      
      if (status === 'successful' && txRef && transactionId) {
        hasProcessedRedirect.current = true;
        console.log('✅ Cleaner payment successful redirect detected, starting processing...');
        
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

          console.log('🎯 Processing cleaner payment for interest:', interestId);

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
            console.error('❌ Cleaner interest not found:', interestError);
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
            console.log('✅ Cleaner interest already paid');
            toast({
              title: "Already Paid",
              description: "This interest has already been paid.",
            });
            window.history.replaceState({}, document.title, window.location.pathname);
            hasProcessedRedirect.current = false;
            return;
          }

          await processPaymentSuccess(interestId, transactionId, clientData);

          // Get cleaner and client info for email
          const { data: cleanerData } = await supabase
            .from('nannies')
            .select('first_name, last_name')
            .eq('id', interestData.nanny_id)
            .single();

          const { data: clientProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', user.id)
            .single();

          // Get cleaner contact info from profiles table
          const { data: cleanerProfile } = await supabase
            .from('profiles')
            .select('phone, email')
            .eq('id', interestData.nanny_id)
            .single();

          // Send payment success email
          if (cleanerData && clientProfile) {
            console.log('📧 Attempting to send payment success email for cleaner...');
            
            const selectedCleaningTypeObj = cleaningTypes.find(t => t.value === cleaningType) || cleaningTypes[0];
            
            const paymentEmailData = {
              to: clientProfile.email,
              client_name: `${clientProfile.first_name} ${clientProfile.last_name || ''}`,
              cleaner_name: `${cleanerData.first_name} ${cleanerData.last_name || ''}`,
              cleaner_phone: cleanerProfile?.phone || 'Not provided',
              cleaner_email: cleanerProfile?.email || 'Not provided',
              transaction_id: transactionId,
              amount: selectedCleaningTypeObj.fee.toString(),
              service_type: selectedCleaningTypeObj.label,
              description: selectedCleaningTypeObj.description
            };

            await sendPaymentSuccessEmail(paymentEmailData).catch(err => 
              console.error('Payment success email failed silently:', err)
            );
          }

          toast({
            title: "🎉 Payment Successful!",
            description: cleaningType === 'once_off' 
              ? "Admin will arrange the cleaner to visit your location shortly."
              : "Contact details have been unlocked. Refreshing...",
          });

          window.history.replaceState({}, document.title, '/find-cleaner');
          await fetchExistingInterests();
          setRefreshCount(prev => prev + 1);

          console.log('✅ Cleaner payment processed successfully');

        } catch (error: any) {
          console.error('❌ Error processing cleaner payment redirect:', error);
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
  }, [user, userRole, toast, authLoading, cleaningType]);

  useEffect(() => {
    fetchCleaners();
    if (user && hasRole) {
      fetchExistingInterests();
      const subscription = supabase
        .channel('cleaner-interests-channel')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'interests', 
          filter: `client_id=eq.${user.id}` 
        }, (payload) => {
          console.log('Cleaner real-time update received:', payload);
          fetchExistingInterests();
        })
        .subscribe((status) => {
          console.log('Cleaner subscription status:', status);
        });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, hasRole, refreshCount]);

  const fetchCleaners = async () => {
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
      .in('experience_type', ['cleaning', 'both'])
      .eq('profile_approved', true)
      .order('average_rating', { ascending: false, nullsFirst: false }); // Sort by rating

    if (error) throw error;
    
    console.log('Fetched cleaners data with average_rating:', data);
    setCleaners(data || []);
  } catch (error) {
    console.error('Error fetching cleaners:', error);
    toast({
      title: "Error",
      description: "Failed to load cleaners",
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};

  const fetchExistingInterests = async () => {
    if (!user) return;

    try {
      console.log('🔍 Fetching client interests for cleaners...');
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
          console.error('❌ Error fetching cleaner interests:', error);
          throw error;
        }

        console.log('📋 Fetched cleaner interests with payment_status:', interests);
        setExistingInterests(interests || []);
        
        const { data: payments } = await supabase
          .from('payments')
          .select('interest_id, status')
          .eq('client_id', clientData.id)
          .eq('status', 'completed');
          
        console.log('💳 Completed payments for cleaners:', payments);
        
        if (payments && payments.length > 0) {
          console.log('🔄 Verifying payment_status consistency for cleaners...');
          for (const payment of payments) {
            const interest = interests?.find(i => i.id === payment.interest_id);
            if (interest && interest.payment_status !== 'completed') {
              console.warn(`⚠️ Inconsistency found: Payment exists for cleaner interest ${payment.interest_id} but payment_status is not 'completed'`);
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
      console.error('Error fetching existing cleaner interests:', error);
      setExistingInterests([]);
    }
  };

  const canExpressInterest = (cleanerId: string) => {
    const existingInterest = existingInterests.find(i => i.nanny_id === cleanerId);
    return !existingInterest || existingInterest.status === 'declined';
  };

  const getInterestStatusForCleaner = (cleanerId: string): Interest | null => {
    const interest = existingInterests.find(i => i.nanny_id === cleanerId);
    return interest || null;
  };

  const isInterestApprovedByCleaner = (interest: Interest | null): boolean => {
    if (!interest) return false;
    return interest.status === 'approved' || 
           interest.nanny_response === 'approved' || 
           interest.admin_approved === true;
  };

  const isPaymentCompleted = (interest: Interest | null): boolean => {
    if (!interest) return false;
    console.log('🔍 Checking payment status for cleaner interest:', {
      interestId: interest.id,
      payment_status: interest.payment_status,
      status: interest.status
    });
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

  const sendInterestNotificationEmails = async (cleaner: Cleaner, clientProfile: any, message: string) => {
    try {
      const cleanerProfile = getCleanerProfileInfo(cleaner);
      
      const cleanerEmailData = {
        to: cleanerProfile.email,
        subject: 'New Client Interest - Nanny Placements SA',
        cleaner_name: `${cleanerProfile.first_name} ${cleanerProfile.last_name || ''}`,
        client_name: `${clientProfile.first_name} ${clientProfile.last_name || ''}`,
        client_message: message,
        client_email: clientProfile.email
      };

      const result = await sendInterestNotificationEmail(cleanerEmailData);
      
      if (result.success) {
        console.log('Cleaner interest notification sent successfully');
      } else {
        console.warn('Cleaner interest notification email may have failed:', result.message);
      }

      return result.success;

    } catch (error) {
      console.error('Error sending cleaner interest notification emails:', error);
      return false;
    }
  };

  const handleExpressInterest = async () => {
    if (!selectedCleaner || !user) return;

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

      // Get or create client record
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

      // Check if interest already exists
      const { data: existingInterest, error: checkError } = await supabase
        .from('interests')
        .select('id')
        .eq('client_id', clientId)
        .eq('nanny_id', selectedCleaner.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existingInterest) {
        toast({
          title: "Interest Already Sent",
          description: "You have already expressed interest in this cleaner. Please wait for their response or contact admin.",
          variant: "destructive"
        });
        setSelectedCleaner(null);
        setSendingInterest(false);
        return;
      }

      const cleanerProfile = getCleanerProfileInfo(selectedCleaner);
      
      const { error } = await supabase
        .from('interests')
        .insert({
          client_id: clientId,
          nanny_id: selectedCleaner.id,
          message: interestMessage || null,
          status: 'pending',
          created_at: new Date().toISOString(),
          admin_approved: false,
          nanny_response: null,
          payment_status: null,
          client_first_name: clientProfile.first_name,
          client_last_name: clientProfile.last_name,
          client_email: clientProfile.email,
          nanny_first_name: cleanerProfile.first_name,
          nanny_last_name: cleanerProfile.last_name,
          nanny_email: cleanerProfile.email,
        });

      if (error) throw error;

      // Send notification emails
      await sendInterestNotificationEmails(selectedCleaner, clientProfile, interestMessage);

      toast({
        title: "Interest Sent!",
        description: "The cleaner will be notified of your interest and can approve or decline it.",
      });

      setSelectedCleaner(null);
      setInterestMessage('');
      fetchExistingInterests();
    } catch (error: any) {
      console.error('Error expressing interest in cleaner:', error.message);
      toast({
        title: "Error",
        description: error.message || "Failed to express interest",
        variant: "destructive"
      });
    } finally {
      setSendingInterest(false);
    }
  };

  const handlePayment = async (cleaner: Cleaner, interestId: string) => {
    if (!window.FlutterwaveCheckout) {
      toast({
        title: "Payment Error",
        description: "Payment system is not available. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    if (!cleaningType) {
      toast({
        title: "Selection Required",
        description: "Please select a cleaning type first.",
        variant: "destructive"
      });
      return;
    }

    setProcessingPayment(cleaner.id);
        
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
        return;
      }

      const cleanerProfile = getCleanerProfileInfo(cleaner);
      const selectedCleaningTypeObj = cleaningTypes.find(t => t.value === cleaningType);
      const timestamp = Date.now();
      const txRef = `cleaner-${interestId}-${timestamp}`;
      
      console.log('💰 Starting cleaner payment with:', { 
        interestId, 
        txRef,
        cleanerId: cleaner.id,
        clientId: clientData.id,
        cleaningType,
        amount: selectedCleaningTypeObj?.fee
      });
      
      window.FlutterwaveCheckout({
        public_key: flutterwavePublicKey,
        tx_ref: txRef,
        amount: selectedCleaningTypeObj?.fee || 200,
        currency: "ZAR",
        payment_options: "card, mobilemoneyghana, ussd",
        redirect_url: "https://nannyplacementssouthafrica.co.za/find-cleaner",
        customer: {
          email: clientProfile?.email || user?.email || "",
          phone_number: clientProfile?.phone || "",
          name: `${clientProfile?.first_name} ${clientProfile?.last_name}` || "Client",
        },
        customizations: {
          title: "Nanny Placements SA",
          description: `Payment for ${selectedCleaningTypeObj?.label} service`,
          logo: "/favicon.ico",
        },
        callback: async (response: any) => {
          console.log('💳 Cleaner payment callback response:', response);
                  
          if (response.status === "successful") {
            toast({
              title: "Payment Processing",
              description: "Processing your payment...",
            });
            
            console.log('✅ Cleaner payment successful, redirecting...');
            window.location.href = `https://nannyplacementssouthafrica.co.za/find-cleaner?status=successful&tx_ref=${encodeURIComponent(txRef)}&transaction_id=${response.transaction_id}`;
            
          } else {
            console.log('❌ Cleaner payment failed:', response);
            toast({
              title: "Payment Failed",
              description: "Payment was not successful. Please try again.",
              variant: "destructive"
            });
          }
          setProcessingPayment(null);
        },
        onclose: () => {
          console.log('Cleaner payment modal closed');
          setProcessingPayment(null);
        }
      });
    } catch (error) {
      console.error('Cleaner payment initialization error:', error);
      toast({
        title: "Payment Error",
        description: "An error occurred during payment processing.",
        variant: "destructive"
      });
      setProcessingPayment(null);
    }
  };

  const submitReview = async () => {
  if (!selectedCleaner || !rating || !user) return;
  setSubmittingReview(true);
  try {
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) throw new Error('Client not found');

    // Check if client has already reviewed this cleaner
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('nanny_id', selectedCleaner.id)
      .eq('client_id', client.id)
      .single();

    if (existingReview) {
      throw new Error('You have already reviewed this cleaner');
    }

    // Insert review
    const { error: reviewError } = await supabase
      .from('reviews')
      .insert({
        nanny_id: selectedCleaner.id,
        client_id: client.id,
        rating,
        complaint_text: review.trim() || null,
        created_at: new Date().toISOString()
      });

    if (reviewError) throw reviewError;

    // The trigger will automatically update the average_rating in nannies table
    
    // Notify admin about the review
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    const cleanerProfile = getCleanerProfileInfo(selectedCleaner);

    if (clientProfile) {
      await sendReviewNotificationEmail({
        to: 'admin@nannyplacementssouthafrica.co.za',
        client_name: `${clientProfile.first_name} ${clientProfile.last_name || ''}`,
        client_email: clientProfile.email,
        cleaner_name: `${cleanerProfile.first_name} ${cleanerProfile.last_name || ''}`,
        rating: rating,
        review_text: review.trim() || 'No review text provided'
      }).catch(err => console.error('Review notification email failed:', err));
    }

    toast({
      title: "Thank You!",
      description: "Your review has been submitted successfully."
    });

    // Refresh cleaner data to show updated rating
    fetchCleaners();
    setRating(0);
    setReview('');
    setSelectedCleaner(null);

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

  const filteredCleaners = cleaners.filter(cleaner => {
    const cleanerProfile = getCleanerProfileInfo(cleaner);
    
    if (filters.city && !cleanerProfile.city?.toLowerCase().includes(filters.city.toLowerCase())) {
      return false;
    }
    if (filters.town && !cleanerProfile.suburb?.toLowerCase().includes(filters.town.toLowerCase()) && 
        !cleanerProfile.town?.toLowerCase().includes(filters.town.toLowerCase())) {
      return false;
    }
    if (filters.employmentType && filters.employmentType !== 'all' && cleaner.employment_type !== filters.employmentType) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading available cleaners...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find a Professional Cleaner</h1>
        <p className="text-muted-foreground">
          Browse verified, trained cleaners available in your area
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filter Cleaners</CardTitle>
          <CardDescription>Find the perfect cleaner for your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
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
            <div>
              <Label htmlFor="employment">Employment Type</Label>
              <Select 
                value={filters.employmentType} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, employmentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any employment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any employment type</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="full_time">Full Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Cleaning Service Type</CardTitle>
          <CardDescription>Choose the type of cleaning service you need</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {cleaningTypes.map((type) => (
              <div
                key={type.value}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  cleaningType === type.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setCleaningType(type.value)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{type.label}</h3>
                  <div className="text-lg font-bold text-primary">R{type.fee}</div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                {cleaningType === type.value && (
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCleaners.map((cleaner) => {
          const cleanerProfile = getCleanerProfileInfo(cleaner);
          const interest = getInterestStatusForCleaner(cleaner.id);
          const hasInterest = !!interest;
          const isApproved = interest ? isInterestApprovedByCleaner(interest) : false;
          const isPaid = interest ? isPaymentCompleted(interest) : false;
          
          console.log(`Cleaner ${cleaner.id}:`, { 
            hasInterest, 
            isApproved, 
            isPaid, 
            payment_status: interest?.payment_status,
            status: interest?.status
          });

          return (
            <Card key={cleaner.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  {cleanerProfile.profile_picture_url ? (
                    <img 
                      src={cleanerProfile.profile_picture_url}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{cleanerProfile.first_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {cleanerProfile.city}{cleanerProfile.suburb ? `, ${cleanerProfile.suburb}` : ''}
                    </p>
                    {cleaner.employment_type && (
                      <p className="text-xs text-muted-foreground capitalize mt-1">
                        {cleaner.employment_type.replace('_', ' ')} cleaner
                      </p>
                    )}
                    {cleaner.average_rating && (
                    <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                        {cleaner.average_rating.toFixed(1)}
                        {cleaner.review_count && (
                            <span className="text-xs text-muted-foreground ml-1">
                            ({cleaner.review_count})
                            </span>
                        )}
                        </span>
                    </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{cleanerProfile.first_name} {cleanerProfile.last_name}</h3>
                    <p className="text-muted-foreground">
                      {cleanerProfile.city}{cleanerProfile.town ? `, ${cleanerProfile.town}` : ''}
                    </p>
                    {cleaner.hourly_rate && (
                      <p className="text-sm font-medium mt-1">R{cleaner.hourly_rate}/hour</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cleaner.academy_completed && (
                        <Badge variant="secondary">Online Training Complete</Badge>
                      )}
                      {cleaner.criminal_check_status === 'approved' && (
                        <Badge variant="default">Criminal Check ✓</Badge>
                      )}
                      {cleaner.credit_check_status === 'approved' && (
                        <Badge variant="default">Credit Check ✓</Badge>
                      )}
                      {cleaner.profile_approved && (
                        <Badge variant="default">Profile Verified</Badge>
                      )}
                      {cleaner.training_cleaning && (
                        <Badge variant="outline">Cleaning Certified</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {cleaner.bio && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {cleaner.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedCleaner(cleaner)}
                  >
                    View Profile
                  </Button>
                  {user && hasRole && (
                    <>
                      {!hasInterest ? (
                        <Button 
                          className="flex-1"
                          onClick={() => setSelectedCleaner(cleaner)}
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
                          onClick={() => interest?.id && handlePayment(cleaner, interest.id)}
                          disabled={processingPayment === cleaner.id || !cleaningType}
                        >
                          {processingPayment === cleaner.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Pay to Unlock Contact
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          className="flex-1"
                          variant="secondary"
                          disabled
                        >
                          Awaiting Cleaner Response
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

      {filteredCleaners.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No cleaners found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or check back later for new profiles.
          </p>
        </div>
      )}

      <Dialog open={!!selectedCleaner} onOpenChange={() => setSelectedCleaner(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cleaner Profile - {selectedCleaner ? getCleanerProfileInfo(selectedCleaner).first_name : ''}</DialogTitle>
            <DialogDescription>
              Detailed cleaner information and service options
            </DialogDescription>
          </DialogHeader>
                    
          {selectedCleaner && (() => {
            const cleanerProfile = getCleanerProfileInfo(selectedCleaner);
            const interest = getInterestStatusForCleaner(selectedCleaner.id);
            const hasInterest = !!interest;
            const isApproved = interest ? isInterestApprovedByCleaner(interest) : false;
            const isPaid = interest ? isPaymentCompleted(interest) : false;
            
            return (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  {cleanerProfile.profile_picture_url && (
                    <img
                      src={cleanerProfile.profile_picture_url}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{cleanerProfile.first_name} {cleanerProfile.last_name}</h3>
                    <p className="text-muted-foreground">
                      {cleanerProfile.city}{cleanerProfile.suburb ? `, ${cleanerProfile.suburb}` : ''}{cleanerProfile.town ? `, ${cleanerProfile.town}` : ''}
                    </p>
                    <div className="flex gap-4 mt-1">
                      {selectedCleaner.hourly_rate && (
                        <p className="text-lg font-semibold text-primary">
                          R{selectedCleaner.hourly_rate}/hour
                        </p>
                      )}
                      {selectedCleaner.average_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{selectedCleaner.average_rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    {selectedCleaner.employment_type && (
                      <p className="text-sm text-muted-foreground capitalize mt-1">
                        {selectedCleaner.employment_type.replace('_', ' ')} cleaner
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedCleaner.academy_completed && (
                        <Badge variant="secondary">Online Training Complete</Badge>
                      )}
                      {selectedCleaner.criminal_check_status === 'approved' && (
                        <Badge variant="default">Criminal Check ✓</Badge>
                      )}
                      {selectedCleaner.credit_check_status === 'approved' && (
                        <Badge variant="default">Credit Check ✓</Badge>
                      )}
                      {selectedCleaner.profile_approved && (
                        <Badge variant="default">Profile Verified</Badge>
                      )}
                     
                    </div>
                  </div>
                </div>

                {selectedCleaner.bio && (
                  <div>
                    <h4 className="font-semibold mb-2">About Me</h4>
                    <p className="text-muted-foreground">{selectedCleaner.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Experience</h4>
                    <p className="capitalize">{selectedCleaner.experience_type}</p>
                    {selectedCleaner.experience_duration !== null && (
                      <p className="text-sm text-muted-foreground">
                        {selectedCleaner.experience_duration === 0 ? 'No experience' : 
                         selectedCleaner.experience_duration === 2 ? '1-2 years experience' :
                         selectedCleaner.experience_duration === 4 ? '3-4 years experience' :
                         selectedCleaner.experience_duration === 10 ? '5-10 years experience' :
                         selectedCleaner.experience_duration === 15 ? '10+ years experience' : 
                         'Experience not specified'}
                      </p>
                    )}
                  </div>
                  {selectedCleaner.employment_type && (
                    <div>
                      <h4 className="font-semibold mb-2">Availability</h4>
                      <p className="capitalize">{selectedCleaner.employment_type.replace('_', ' ')}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Service Options</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    {cleaningTypes.map((type) => (
                      <div
                        key={type.value}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          cleaningType === type.value
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setCleaningType(type.value)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{type.label}</h3>
                          <div className="text-lg font-bold text-primary">R{type.fee}</div>
                        </div>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {isPaid && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Star className="h-5 w-5" /> Rate & Review This Cleaner
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
                        placeholder="Share your experience with this cleaner..."
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
                            placeholder="Tell the cleaner about your cleaning needs, frequency, and any specific requirements..."
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
                        <>
                          {!cleaningType && (
                            <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md mb-4">
                              <p className="font-semibold">Please select a cleaning service type above before proceeding to payment</p>
                              <p className="text-sm">Choose between Once-off Cleaning (R400) or Sourcing Fee (R200) for part-time/full-time arrangements</p>
                            </div>
                          )}
                          <Button 
                            className="w-full" 
                            variant="default"
                            onClick={() => interest?.id && handlePayment(selectedCleaner, interest.id)}
                            disabled={processingPayment === selectedCleaner.id || !cleaningType}
                          >
                            {processingPayment === selectedCleaner.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing Payment...
                              </>
                            ) : (
                              <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                {cleaningType === 'once_off' ? 'Pay R400 - Admin Arranges Cleaner' : 'Pay R200 to Unlock Contact Details'}
                              </>
                            )}
                          </Button>
                          {cleaningType && cleaningType !== 'once_off' && (
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              R200 sourcing fee - you'll arrange directly with the cleaner after receiving contact details
                            </p>
                          )}
                        </>
                      ) : (
                        <Button 
                          className="w-full"
                          variant="secondary"
                          disabled
                        >
                          Interest Pending - Awaiting Cleaner Response
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
                    
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCleaner(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}