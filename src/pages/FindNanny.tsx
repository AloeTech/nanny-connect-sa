import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, MapPin, CheckCircle, X, Eye, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Initialize Flutterwave script
declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

// Profile interface
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

interface Nanny {
  id: string;
  user_id: string;
  languages: string[] | null;
  experience_type: string;
  experience_duration: number | null;
  education_level: string | null;
  training_first_aid: boolean | null;
  training_nanny: boolean | null;
  training_cpr: boolean | null;
  training_child_development: boolean | null;
  academy_completed: boolean | null;
  profile_approved: boolean | null;
  criminal_check_status: string | null;
  credit_check_status: string | null;
  hourly_rate: number | null;
  bio: string | null;
  interview_video_url: string | null;
  date_of_birth: string | null;
  accommodation_preference: string | null;
  employment_type: string | null;
  first_name: string | null; // From nannies table
  last_name: string | null; // From nannies table
  city: string | null; // From nannies table
  suburb: string | null; // From nannies table
  phone: string | null; // From nannies table
  profiles?: Profile | Profile[]; // Optional join with profiles
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

// Map numeric experience_duration to dropdown labels
const experienceDurationOptions = [
  { label: '0 years', value: 0 },
  { label: '1-2 years', value: 2 },
  { label: '3-4 years', value: 4 },
  { label: '5-10 years', value: 10 },
  { label: '10+ years', value: 15 },
];

const getExperienceLabel = (duration: number | null): string => {
  if (duration === null) return 'Not specified';
  const option = experienceDurationOptions.find(opt => opt.value >= duration) || experienceDurationOptions[experienceDurationOptions.length - 1];
  return option.label;
};

const educationOptions = [
  'high school no matric',
  'matric',
  'certificate',
  'diploma',
  'degree'
];

const ageRanges = [
  { label: '20-25 years', min: 20, max: 25 },
  { label: '25-30 years', min: 25, max: 30 },
  { label: '30-35 years', min: 30, max: 35 },
  { label: '35-40 years', min: 35, max: 40 },
  { label: '40-45 years', min: 40, max: 45 },
  { label: '45-50 years', min: 45, max: 50 },
  { label: '50-55 years', min: 50, max: 55 },
];

const languagesOptions = [
  'Afrikaans', 'English', 'Zulu', 'Xhosa', 'Sotho', 'Tswana',
  'Pedi', 'Venda', 'Tsonga', 'Swati', 'Ndebele', 'Shona', 'Chewa'
];

// Helper function to extract profile info from nanny
const getNannyProfileInfo = (nanny: Nanny) => {
  // First check if we have profiles join
  if (nanny.profiles) {
    const profiles = Array.isArray(nanny.profiles) ? nanny.profiles[0] : nanny.profiles;
    return {
      first_name: profiles.first_name || nanny.first_name || 'No name',
      last_name: profiles.last_name || nanny.last_name || '',
      city: profiles.city || nanny.city || 'Location not specified',
      suburb: profiles.suburb || nanny.suburb || '',
      town: profiles.town || '',
      profile_picture_url: profiles.profile_picture_url || null,
      email: profiles.email || '',
      phone: profiles.phone || nanny.phone || null
    };
  }
  
  // Fallback to nanny table fields
  return {
    first_name: nanny.first_name || 'No name',
    last_name: nanny.last_name || '',
    city: nanny.city || 'Location not specified',
    suburb: nanny.suburb || '',
    town: '',
    profile_picture_url: null,
    email: '',
    phone: nanny.phone || null
  };
};

const extractInterestId = (txRef: string): string | null => {
  console.log("🔧 Extracting interest ID from txRef:", txRef);

  if (!txRef) return null;

  // Remove nanny- prefix
  let cleanRef = txRef.startsWith("nanny-") ? txRef.substring(6) : txRef;

  console.log("🔧 Clean ref after removing prefix:", cleanRef);

  // Split into parts
  const parts = cleanRef.split("-");
  console.log("🔧 Parts after split:", parts);

  // A UUID has 5 dashes → 6 parts
  if (parts.length < 6) {
    console.error("❌ Not enough parts for UUID");
    return null;
  }

  // Correct: take first 6 parts (0–5)
  const uuid = parts.slice(0, 6).join("-");

  console.log("🔧 Extracted interest ID:", uuid);
  console.log("🔧 UUID length:", uuid.length); // Should be 36

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    console.error("❌ Invalid UUID format:", uuid);
    return null;
  }

  return uuid;
};
// Email sending function using your PHP endpoint
const sendEmailViaPHP = async (emailData: any) => {
  try {
    const response = await fetch('/send-contact-email.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

export default function FindNanny() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [nannies, setNannies] = useState<Nanny[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    experienceType: '',
    employmentType: '',
    accommodationPreference: '',
    maxRate: '',
    languages: [] as string[],
    education: '',
    experienceDuration: '',
    ageRange: ''
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRedirect = useRef(false);

  // Interest modal state
  const [selectedNanny, setSelectedNanny] = useState<Nanny | null>(null);
  const [interestMessage, setInterestMessage] = useState('');
  const [sendingInterest, setSendingInterest] = useState(false);
  const [existingInterests, setExistingInterests] = useState<Interest[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

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
      // Check if we're returning from a successful payment
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('status');
      const txRef = urlParams.get('tx_ref');
      const transactionId = urlParams.get('transaction_id');
      
      console.log('🔍 Payment redirect check:', { status, txRef, transactionId });
      
      // Prevent multiple processing
      if (isProcessingRedirect.current) {
        console.log('⏸️ Already processing redirect, skipping...');
        return;
      }
      
      if (status === 'successful' && txRef && transactionId) {
        isProcessingRedirect.current = true;
        console.log('✅ Payment successful redirect detected, starting processing...');
        
        try {
          // Get client info
          if (!user) {
            toast({
              title: "User Not Found",
              description: "Please log in to complete payment processing.",
              variant: "destructive"
            });
            return;
          }

          // Check if user has client role
          if (userRole !== 'client') {
            toast({
              title: "Access Denied",
              description: "Only clients can make payments for nanny contacts.",
              variant: "destructive"
            });
            return;
          }

          // Extract interest ID
          const interestId = extractInterestId(txRef);
          if (!interestId) {
            toast({
              title: "Payment Error",
              description: "Could not extract payment information. Please contact support.",
              variant: "destructive"
            });
            return;
          }

          console.log('🎯 Processing payment for interest:', interestId);

          // Get client record
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
            return;
          }

          console.log('👤 Client found:', clientData.id);

          // Check if payment already exists
          const { data: existingPayment } = await supabase
            .from('payments')
            .select('*')
            .eq('transaction_id', transactionId)
            .single();

          if (existingPayment) {
            console.log('✅ Payment already exists:', existingPayment);
            
            if (existingPayment.status === 'completed') {
              toast({
                title: "Payment Already Processed",
                description: "This payment has already been recorded.",
              });
            } else {
              // Update to completed
              const { error: updateError } = await supabase
                .from('payments')
                .update({
                  status: 'completed',
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingPayment.id);
                
              if (updateError) {
                console.error('❌ Error updating payment:', updateError);
                throw updateError;
              }
              console.log('✅ Payment updated to completed');
            }
          } else {
            // Create new payment
            console.log('🆕 Creating new payment record...');
            
            // First get interest to verify and get nanny_id
            const { data: interestData, error: interestError } = await supabase
              .from('interests')
              .select('id, nanny_id, client_id, payment_status')
              .eq('id', interestId)
              .single();

            if (interestError || !interestData) {
              console.error('❌ Interest not found:', interestError);
              console.log('🔍 Query was for full interestId:', interestId);
              toast({
                title: "Payment Record Error",
                description: "Could not find interest record. Please contact support.",
                variant: "destructive"
              });
              return;
            }

            // Verify client owns this interest
            if (interestData.client_id !== clientData.id) {
              console.error('❌ Client mismatch');
              toast({
                title: "Access Denied",
                description: "This payment does not belong to your account.",
                variant: "destructive"
              });
              return;
            }

            // Check if already paid
            if (interestData.payment_status === 'completed') {
              console.log('✅ Interest already paid');
              toast({
                title: "Already Paid",
                description: "This interest has already been paid.",
              });
            } else {
              // Create payment record
              const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                  client_id: clientData.id,
                  nanny_id: interestData.nanny_id,
                  interest_id: interestId,
                  amount: 200.00,
                  status: 'completed',
                  payment_method: 'flutterwave',
                  transaction_id: transactionId,
                  created_at: new Date().toISOString()
                });

              if (paymentError) {
                console.error('❌ Error creating payment:', paymentError);
                throw paymentError;
              }
              console.log('✅ Payment record created');

              // Update interest
              const { error: interestUpdateError } = await supabase
                .from('interests')
                .update({
                  payment_status: 'completed',
                  status: 'approved'
                })
                .eq('id', interestId);

              if (interestUpdateError) {
                console.error('❌ Error updating interest:', interestUpdateError);
                throw interestUpdateError;
              }
              console.log('✅ Interest updated');

              // Get nanny and client info for email
              const { data: nannyData } = await supabase
                .from('nannies')
                .select('first_name, last_name, email, phone')
                .eq('id', interestData.nanny_id)
                .single();

              const { data: clientProfile } = await supabase
                .from('profiles')
                .select('first_name, last_name, email')
                .eq('id', user.id)
                .single();

              // Send email
              if (nannyData && clientProfile) {
                console.log('📧 Sending success email...');
                await sendPaymentSuccessEmail(clientProfile, nannyData);
              }
            }
          }

          toast({
            title: "🎉 Payment Successful!",
            description: "Contact details have been unlocked. The page will refresh...",
          });

          // Clear URL and refresh
          setTimeout(() => {
            window.history.replaceState({}, document.title, '/find-nanny');
            setRefreshCount(prev => prev + 1);
            fetchExistingInterests();
            console.log('✅ Page refresh triggered');
          }, 2000);

        } catch (error: any) {
          console.error('❌ Error processing payment redirect:', error);
          toast({
            title: "Payment Processing Error",
            description: error.message || "There was an error processing your payment. Please contact support.",
            variant: "destructive"
          });
        } finally {
          // Reset after delay
          setTimeout(() => {
            isProcessingRedirect.current = false;
          }, 3000);
        }
      }
    };

    handlePaymentRedirect();
  }, [user, userRole, window.location.search]);

  useEffect(() => {
    fetchNannies();
    if (user && hasRole) {
      fetchExistingInterests();
      const subscription = supabase
        .channel('custom-all-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'interests', filter: `client_id=eq.${user.id}` }, (payload) => {
          console.log('Real-time update received:', payload);
          fetchExistingInterests();
        })
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, hasRole, refreshCount]);

  useEffect(() => {
    return () => {
      // Cleanup any pending timeouts on component unmount
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const fetchNannies = async () => {
    try {
      let query = supabase
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
        `);

      if (userRole !== 'admin') {
        query = query.eq('profile_approved', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      console.log('Fetched nannies data:', data);
      setNannies(data || []);
    } catch (error) {
      console.error('Error fetching nannies:', error);
      toast({
        title: "Error",
        description: "Failed to load nannies",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingInterests = async () => {
    if (!user) return;

    try {
      // Get client ID from clients table using user_id
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientData) {
        const { data: interests } = await supabase
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

        setExistingInterests(interests || []);
        
        // Also check payments table for any completed payments
        const { data: payments } = await supabase
          .from('payments')
          .select('interest_id, status')
          .eq('client_id', clientData.id)
          .eq('status', 'completed');
          
        console.log('Completed payments found:', payments);
      } else {
        setExistingInterests([]);
      }
    } catch (error) {
      console.error('Error fetching existing interests:', error);
    }
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

  const canExpressInterest = (nannyId: string) => {
    const existingInterest = existingInterests.find(i => i.nanny_id === nannyId);
    return !existingInterest || existingInterest.status === 'declined';
  };

  const getInterestStatusForNanny = (nannyId: string): Interest | null => {
    const interest = existingInterests.find(i => i.nanny_id === nannyId);
    return interest || null;
  };

  const hasInterestForNanny = (nannyId: string): boolean => {
    return existingInterests.some(i => i.nanny_id === nannyId);
  };

  // Check if interest is approved by nanny (either through status or nanny_response)
  const isInterestApprovedByNanny = (interest: Interest | null): boolean => {
    if (!interest) return false;
        
    // Check multiple approval indicators
    return interest.status === 'approved' || 
           interest.nanny_response === 'approved' || 
           interest.admin_approved === true ||
           interest.payment_status === 'completed';
  };

  const sendInterestNotificationEmails = async (nanny: Nanny, clientProfile: any, message: string) => {
    try {
      const nannyProfile = getNannyProfileInfo(nanny);
      
      // Send to nanny
      const nannyEmailData = {
        to: nannyProfile.email,
        subject: 'New Client Interest - Nanny Placements SA',
        message: `Hello ${nannyProfile.first_name} ${nannyProfile.last_name || ''},

You have received a new interest request from a client.

Client: ${clientProfile.first_name} ${clientProfile.last_name || ''}
Client Message: "${message}"

Please log in to your nanny dashboard to approve or decline this request.

Best regards,
Nanny Placements SA Team`
      };

      await sendEmailViaPHP(nannyEmailData);

      // Send to client
      const clientEmailData = {
        to: clientProfile.email,
        subject: 'Interest Submitted - Nanny Placements SA',
        message: `Hello ${clientProfile.first_name} ${clientProfile.last_name || ''},

You have successfully expressed interest in ${nannyProfile.first_name} ${nannyProfile.last_name || ''}.

Your message: "${message}"

Please log in to your account to approve or decline this interest once the nanny responds.

Best regards,
Nanny Placements SA Team`
      };

      await sendEmailViaPHP(clientEmailData);

      return true;
    } catch (error) {
      console.error('Error sending interest notification emails:', error);
      return false;
    }
  };

  const handleExpressInterest = async () => {
    if (!selectedNanny || !user) return;

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
        // Create client record if it doesn't exist
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
        .eq('nanny_id', selectedNanny.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existingInterest) {
        toast({
          title: "Interest Already Sent",
          description: "You have already expressed interest in this nanny. Please wait for their response or contact admin.",
          variant: "destructive"
        });
        setSelectedNanny(null);
        setSendingInterest(false);
        return;
      }

      const nannyProfile = getNannyProfileInfo(selectedNanny);
      
      const { error } = await supabase
        .from('interests')
        .insert({
          client_id: clientId,
          nanny_id: selectedNanny.id,
          message: interestMessage || null,
          status: 'pending',
          created_at: new Date().toISOString(),
          admin_approved: false,
          nanny_response: null,
          payment_status: null,
          client_first_name: clientProfile.first_name,
          client_last_name: clientProfile.last_name,
          client_email: clientProfile.email,
          nanny_first_name: nannyProfile.first_name,
          nanny_last_name: nannyProfile.last_name,
          nanny_email: nannyProfile.email,
        });

      if (error) throw error;

      // Send notification emails using PHP endpoint
      await sendInterestNotificationEmails(selectedNanny, clientProfile, interestMessage);

      toast({
        title: "Interest Sent!",
        description: "The nanny will be notified of your interest and can approve or decline it.",
      });

      setSelectedNanny(null);
      setInterestMessage('');
      fetchExistingInterests();
    } catch (error: any) {
      console.error('Error expressing interest:', error.message);
      toast({
        title: "Error",
        description: error.message || "Failed to express interest",
        variant: "destructive"
      });
    } finally {
      setSendingInterest(false);
    }
  };

  // Create payment record in payments table
  const createPaymentRecord = async (clientId: string, nannyId: string, interestId: string, transactionId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          client_id: clientId,
          nanny_id: nannyId,
          interest_id: interestId,
          amount: 200.00,
          status: 'completed',
          payment_method: 'flutterwave',
          transaction_id: transactionId,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating payment record:', error);
        throw error;
      }
          
      return true;
    } catch (error) {
      console.error('Failed to create payment record:', error);
      throw error;
    }
  };

  // Send email after successful payment using PHP endpoint
  const sendPaymentSuccessEmail = async (clientProfile: any, nannyData: any) => {
    try {
      const emailData = {
        to: clientProfile?.email || user?.email || "",
        subject: 'Nanny Contact Details Unlocked - Nanny Placements SA',
        message: `Congratulations ${clientProfile?.first_name} ${clientProfile?.last_name || ''}!

You have successfully unlocked ${nannyData.first_name} ${nannyData.last_name || ''}'s contact details.

Nanny Information:
- Name: ${nannyData.first_name} ${nannyData.last_name || ''}
- Email: ${nannyData.email}
- Phone: ${nannyData.phone || 'Will be provided by admin'}

Please contact the nanny directly to schedule an interview. We recommend:
1. Call or message to introduce yourself
2. Schedule a meeting time
3. Discuss your requirements and expectations

Best regards,
Nanny Placements SA Team`
      };

      await sendEmailViaPHP(emailData);
      console.log('Payment success email sent successfully');
      return true;
    } catch (emailError) {
      console.error('Error sending payment success email:', emailError);
      return false;
    }
  };

  // Flutterwave payment function for individual nanny
  const handlePayment = async (nanny: Nanny, interestId: string) => {
    if (!window.FlutterwaveCheckout) {
      toast({
        title: "Payment Error",
        description: "Payment system is not available. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    setProcessingPayment(nanny.id);
        
    try {
      // Get client info from clients table
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

      // Get client profile info from profiles table
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

      const nannyProfile = getNannyProfileInfo(nanny);
      // Generate a unique transaction reference with the FULL interest ID
      const timestamp = Date.now();
      const txRef = `nanny-${interestId}-${timestamp}`;
      
      console.log('💰 Starting payment with:', { 
        interestId, 
        txRef,
        nannyId: nanny.id,
        clientId: clientData.id 
      });
      
      window.FlutterwaveCheckout({
        public_key: flutterwavePublicKey,
        tx_ref: txRef,
        amount: 200,
        currency: "ZAR",
        payment_options: "card, mobilemoneyghana, ussd",
        redirect_url: "https://nannyplacementssouthafrica.co.za/find-nanny",
        customer: {
          email: clientProfile?.email || user?.email || "",
          phone_number: clientProfile?.phone || "",
          name: `${clientProfile?.first_name} ${clientProfile?.last_name}` || "Client",
        },
        customizations: {
          title: "Nanny Placements SA",
          description: `Payment to unlock ${nannyProfile.first_name}'s contact details`,
          logo: "/favicon.ico",
        },
        callback: async (response: any) => {
          console.log('💳 Payment callback response:', response);
                  
          if (response.status === "successful") {
            toast({
              title: "Payment Processing",
              description: "Processing your payment...",
            });
            
            console.log('✅ Payment successful, redirecting...');
            // Redirect to the success URL - let the useEffect handle the processing
            window.location.href = `https://nannyplacementssouthafrica.co.za/find-nanny?status=successful&tx_ref=${encodeURIComponent(txRef)}&transaction_id=${response.transaction_id}`;
            
          } else {
            console.log('❌ Payment failed:', response);
            toast({
              title: "Payment Failed",
              description: "Payment was not successful. Please try again.",
              variant: "destructive"
            });
          }
          setProcessingPayment(null);
        },
        onclose: () => {
          console.log('Payment modal closed');
          setProcessingPayment(null);
        }
      });
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast({
        title: "Payment Error",
        description: "An error occurred during payment processing.",
        variant: "destructive"
      });
      setProcessingPayment(null);
    }
  };

  const calculateAge = (dateOfBirth: string | null): number | null => {
    if (!dateOfBirth) return null;
    try {
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) return null; // Invalid date
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--; // Birthday hasn't occurred this year
      }
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return null;
    }
  };

  const handleAutoMatch = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to use Auto Match.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: clientData } = await supabase
        .from('clients')
        .select('preferred_employment_type, preferred_experience_type, preferred_accommodation_type')
        .eq('user_id', user.id)
        .single();

      if (clientData) {
        const newFilters = {
          ...filters,
          employmentType: clientData.preferred_employment_type || '',
          experienceType: clientData.preferred_experience_type || '',
          accommodationPreference: clientData.preferred_accommodation_type === 'stay_out' ? 'live_out' : clientData.preferred_accommodation_type || ''
        };

        // Count matching profiles
        const matchingNannies = nannies.filter(nanny => {
          if (newFilters.employmentType && newFilters.employmentType !== 'all' && nanny.employment_type !== newFilters.employmentType) {
            return false;
          }
          if (newFilters.experienceType && newFilters.experienceType !== 'all' && nanny.experience_type !== newFilters.experienceType) {
            return false;
          }
          if (newFilters.accommodationPreference && newFilters.accommodationPreference !== 'all' && nanny.accommodation_preference !== newFilters.accommodationPreference) {
            return false;
          }
          return true;
        });

        setFilters(newFilters);

        if (matchingNannies.length > 0) {
          toast({
            title: "Auto Match Applied",
            description: `Found ${matchingNannies.length} matching profile${matchingNannies.length === 1 ? '' : 's'}.`,
          });
        } else {
          toast({
            title: "No Matches Found",
            description: "No profiles match your preferences. Showing default profiles in 5 seconds.",
            variant: "destructive"
          });
          timeoutRef.current = setTimeout(() => {
            setFilters({
              city: '',
              experienceType: '',
              employmentType: '',
              accommodationPreference: '',
              maxRate: '',
              languages: [],
              education: '',
              experienceDuration: '',
              ageRange: ''
            });
            toast({
              title: "Showing All Profiles",
              description: "Default profiles are now displayed.",
            });
          }, 5000);
        }
      } else {
        toast({
          title: "No Preferences Found",
          description: "Please set your preferences in your profile.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching client preferences:', error);
      toast({
        title: "Error",
        description: "Failed to apply auto match.",
        variant: "destructive"
      });
    }
  };

  const handleLanguageChange = (lang: string) => {
    setFilters(prev => {
      const newLanguages = prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang];
      return { ...prev, languages: newLanguages };
    });
  };

  const filteredNannies = nannies.filter(nanny => {
    const nannyProfile = getNannyProfileInfo(nanny);
    
    if (filters.city && !nannyProfile.city?.toLowerCase().includes(filters.city.toLowerCase())) {
      return false;
    }
    if (filters.experienceType && filters.experienceType !== 'all' && nanny.experience_type !== filters.experienceType) {
      return false;
    }
    if (filters.employmentType && filters.employmentType !== 'all' && nanny.employment_type !== filters.experienceType) {
      return false;
    }
    if (filters.accommodationPreference && filters.accommodationPreference !== 'all' && nanny.accommodation_preference !== filters.accommodationPreference) {
      return false;
    }
    if (filters.maxRate && nanny.hourly_rate && nanny.hourly_rate > parseFloat(filters.maxRate)) {
      return false;
    }
    if (filters.languages.length > 0 && nanny.languages && !filters.languages.every(lang => nanny.languages?.includes(lang))) {
      return false;
    }
    if (filters.education && filters.education !== 'all' && nanny.education_level !== filters.education) {
      return false;
    }
    if (filters.experienceDuration && filters.experienceDuration !== 'all') {
      const selectedDuration = parseInt(filters.experienceDuration);
      if (nanny.experience_duration !== selectedDuration) {
        return false;
      }
    }
    if (filters.ageRange && filters.ageRange !== 'all') {
      const selectedRange = ageRanges.find(range => range.label === filters.ageRange);
      if (!selectedRange) return false;
      const age = calculateAge(nanny.date_of_birth);
      if (age === null || age < selectedRange.min || age > selectedRange.max) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading nannies...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Find Your Perfect Nanny</h1>
        <p className="text-muted-foreground">
          Browse verified, trained nannies in your area
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filter Nannies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Label htmlFor="experience">Experience Type</Label>
              <Select value={filters.experienceType} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any experience</SelectItem>
                  <SelectItem value="nanny">Nanny only</SelectItem>
                  <SelectItem value="cleaning">Cleaning only</SelectItem>
                  <SelectItem value="both">Both nanny & cleaning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="employment">Employment Type</Label>
              <Select value={filters.employmentType} onValueChange={(value) => setFilters(prev => ({ ...prev, employmentType: value }))}>
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
            <div>
              <Label htmlFor="accommodation">Accommodation</Label>
              <Select value={filters.accommodationPreference} onValueChange={(value) => setFilters(prev => ({ ...prev, accommodationPreference: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any accommodation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any accommodation</SelectItem>
                  <SelectItem value="live_in">Live In</SelectItem>
                  <SelectItem value="live_out">Live Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rate">Max Rate (R/hour)</Label>
              <Input
                id="rate"
                type="number"
                placeholder="Max hourly rate"
                value={filters.maxRate}
                onChange={(e) => setFilters(prev => ({ ...prev, maxRate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="ageRange">Age Range</Label>
              <Select value={filters.ageRange} onValueChange={(value) => setFilters(prev => ({ ...prev, ageRange: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any age</SelectItem>
                  {ageRanges.map(range => (
                    <SelectItem key={range.label} value={range.label}>{range.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="education">Education Level</Label>
              <Select value={filters.education} onValueChange={(value) => setFilters(prev => ({ ...prev, education: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any education" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any education</SelectItem>
                  {educationOptions.map(edu => (
                    <SelectItem key={edu} value={edu}>{edu.charAt(0).toUpperCase() + edu.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="experienceDuration">Experience Duration</Label>
              <Select value={filters.experienceDuration} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceDuration: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any duration</SelectItem>
                  {experienceDurationOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Languages</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                {languagesOptions.map(lang => (
                  <div key={lang} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`lang-${lang}`}
                      checked={filters.languages.includes(lang)}
                      onChange={() => handleLanguageChange(lang)}
                      className="h-4 w-4"
                    />
                    <label htmlFor={`lang-${lang}`} className="text-sm">{lang}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={handleAutoMatch} className="mt-4">
            Auto Match
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNannies.map((nanny) => {
          const nannyProfile = getNannyProfileInfo(nanny);
          const interest = getInterestStatusForNanny(nanny.id);
          const isApproved = interest ? isInterestApprovedByNanny(interest) : false;
          const isPaid = interest?.payment_status === 'completed';
          const hasInterest = !!interest;

          return (
            <Card key={nanny.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  {nannyProfile.profile_picture_url ? (
                    <img 
                      src={nannyProfile.profile_picture_url}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Heart className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{nannyProfile.first_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {nannyProfile.city}{nannyProfile.town ? `, ${nannyProfile.town}` : ''}
                    </p>
                    {nanny.date_of_birth && (
                      <p className="text-xs text-muted-foreground">
                        Age: {calculateAge(nanny.date_of_birth)} years
                      </p>
                    )}
                    {nanny.accommodation_preference && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {nanny.accommodation_preference.replace('_', ' ')} • {nanny.employment_type?.replace('_', ' ') || ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{nannyProfile.first_name} </h3>
                    <p className="text-muted-foreground">
                      {nannyProfile.city}{nannyProfile.town ? `, ${nannyProfile.town}` : ''}
                    </p>
                    {nanny.date_of_birth && (
                      <p className="text-sm text-muted-foreground">
                        Age: {calculateAge(nanny.date_of_birth)} years • 
                        {nanny.accommodation_preference && (
                          <span className="capitalize ml-1">
                            {nanny.accommodation_preference.replace('_', ' ')} • {nanny.employment_type?.replace('_', ' ') || ''}
                          </span>
                        )}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {getExperienceLabel(nanny.experience_duration)} - {nanny.experience_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-wrap gap-1 mt-1">
                      {nanny.academy_completed && (
                        <Badge variant="secondary">Academy Complete</Badge>
                      )}
                      {nanny.criminal_check_status === 'approved' && (
                        <Badge variant="default">Criminal Check ✓</Badge>
                      )}
                      {nanny.credit_check_status === 'approved' && (
                        <Badge variant="default">Credit Check ✓</Badge>
                      )}
                      {nanny.profile_approved && (
                        <Badge variant="default">Profile Verified</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {nanny.bio && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {nanny.bio}
                  </p>
                )}

                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Languages:</p>
                  <div className="flex flex-wrap gap-1">
                    {(nanny.languages || []).slice(0, 3).map((lang, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                    {(nanny.languages || []).length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{(nanny.languages || []).length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedNanny(nanny)}
                  >
                    View Profile
                  </Button>
                  {user && hasRole && (
                    <>
                      {!hasInterest ? (
                        <Button 
                          className="flex-1"
                          onClick={() => setSelectedNanny(nanny)}
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
                          onClick={() => interest?.id && handlePayment(nanny, interest.id)}
                          disabled={processingPayment === nanny.id}
                        >
                          {processingPayment === nanny.id ? (
                            'Processing...'
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
                          Awaiting Nanny Response
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

      {filteredNannies.length === 0 && (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No nannies found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or check back later for new profiles.
          </p>
        </div>
      )}

      <Dialog open={!!selectedNanny} onOpenChange={() => setSelectedNanny(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nanny Profile - {selectedNanny ? getNannyProfileInfo(selectedNanny).first_name : ''}</DialogTitle>
            <DialogDescription>
              Detailed profile information
            </DialogDescription>
          </DialogHeader>
                    
          {selectedNanny && (() => {
            const nannyProfile = getNannyProfileInfo(selectedNanny);
            const interest = getInterestStatusForNanny(selectedNanny.id);
            const hasInterest = !!interest;
            const isApproved = interest ? isInterestApprovedByNanny(interest) : false;
            const isPaid = interest?.payment_status === 'completed';
            
            return (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  {nannyProfile.profile_picture_url && (
                    <img
                      src={nannyProfile.profile_picture_url}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{nannyProfile.first_name}</h3>
                    <p className="text-muted-foreground">
                      {nannyProfile.city}{nannyProfile.town ? `, ${nannyProfile.town}` : ''}{nannyProfile.suburb ? `, ${nannyProfile.suburb}` : ''}
                    </p>
                    <div className="flex gap-4 mt-1">
                      {selectedNanny.date_of_birth && (
                        <p className="text-lg text-muted-foreground">
                          Age: {calculateAge(selectedNanny.date_of_birth)} years
                        </p>
                      )}
                    </div>
                    {selectedNanny.accommodation_preference && (
                      <p className="text-sm text-muted-foreground capitalize mt-1">
                        Prefers {selectedNanny.accommodation_preference.replace('_', ' ')} position
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedNanny.academy_completed && (
                        <Badge variant="secondary">Academy Complete</Badge>
                      )}
                      {selectedNanny.criminal_check_status === 'approved' && (
                        <Badge variant="default">Criminal Check ✓</Badge>
                      )}
                      {selectedNanny.credit_check_status === 'approved' && (
                        <Badge variant="default">Credit Check ✓</Badge>
                      )}
                      {selectedNanny.profile_approved && (
                        <Badge variant="default">Profile Verified</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {selectedNanny.bio && (
                  <div>
                    <h4 className="font-semibold mb-2">About Me</h4>
                    <p className="text-muted-foreground">{selectedNanny.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Experience</h4>
                    <p className="capitalize">{selectedNanny.experience_type}</p>
                    {selectedNanny.experience_duration !== null && (
                      <p className="text-sm text-muted-foreground">{getExperienceLabel(selectedNanny.experience_duration)}</p>
                    )}
                  </div>
                  {selectedNanny.education_level && (
                    <div>
                      <h4 className="font-semibold mb-2">Education</h4>
                      <p className="capitalize">{selectedNanny.education_level}</p>
                    </div>
                  )}
                  {(selectedNanny.languages || []).length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Languages</h4>
                      <p>{(selectedNanny.languages || []).join(', ')}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Training & Certifications</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`flex items-center gap-2 ${selectedNanny.training_first_aid ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {selectedNanny.training_first_aid ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      First Aid
                    </div>
                    <div className={`flex items-center gap-2 ${selectedNanny.training_cpr ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {selectedNanny.training_cpr ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      CPR
                    </div>
                    <div className={`flex items-center gap-2 ${selectedNanny.training_nanny ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {selectedNanny.training_nanny ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      Nanny Training
                    </div>
                    <div className={`flex items-center gap-2 ${selectedNanny.training_child_development ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {selectedNanny.training_child_development ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      Child Development
                    </div>
                  </div>
                </div>

                {selectedNanny.interview_video_url && (
                  <div>
                    <h4 className="font-semibold mb-2">Introduction Video</h4>
                    <video
                      controls
                      className="w-full max-w-md rounded-lg"
                      src={selectedNanny.interview_video_url}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {user && hasRole && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Express Interest</h4>
                    <div className="space-y-3">
                      <textarea
                        className="w-full p-3 border rounded-md resize-none"
                        rows={3}
                        value={interestMessage}
                        onChange={(e) => setInterestMessage(e.target.value)}
                        placeholder="Tell the nanny about your family and what you're looking for..."
                      />
                                          
                      {!isProfileComplete(user.id) && (
                        <div className="text-sm text-red-600">
                          Please complete your profile (name, email, phone, and city are required) to send an interest.{' '}
                          <a href="/profile" className="underline">Complete Profile</a>
                        </div>
                      )}
                                          
                      {!hasInterest ? (
                        <Button 
                          onClick={handleExpressInterest} 
                          disabled={sendingInterest || !interestMessage.trim() || !isProfileComplete(user.id)}
                          className="w-full"
                        >
                          {sendingInterest ? 'Sending...' : 'Express Interest'}
                        </Button>
                      ) : isPaid ? (
                        <div className="p-3 bg-green-100 text-green-800 rounded-md text-center">
                          <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                          <p className="font-semibold">Contact Details Unlocked</p>
                          <p className="text-sm">Check your email for nanny contact information</p>
                        </div>
                      ) : isApproved ? (
                        <Button 
                          className="w-full" 
                          variant="default"
                          onClick={() => interest?.id && handlePayment(selectedNanny, interest.id)}
                          disabled={processingPayment === selectedNanny.id}
                        >
                          {processingPayment === selectedNanny.id ? (
                            'Processing Payment...'
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Pay to Unlock Contact Details
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          className="w-full"
                          variant="secondary"
                          disabled
                        >
                          Interest Pending - Awaiting Nanny Response
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
                    
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedNanny(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}