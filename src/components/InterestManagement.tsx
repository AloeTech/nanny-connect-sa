import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';
import PayButton from './PayButton';

interface Interest {
  id: string;
  message: string;
  created_at: string;
  nanny_response: string;
  payment_status: string;
  admin_approved: boolean;
  clients?: {
    profiles: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  nannies?: {
    profiles: {
      first_name: string;
      last_name: string;
    };
    hourly_rate: number;
  };
}

interface InterestManagementProps {
  interests: Interest[];
  userRole: 'nanny' | 'client' | 'admin';
  onInterestUpdate: () => void;
}

export default function InterestManagement({ interests, userRole, onInterestUpdate }: InterestManagementProps) {
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const handleNannyResponse = async (interestId: string, response: 'approved' | 'declined') => {
    setProcessing(interestId);
    try {
      const { error } = await supabase.functions.invoke('update-interest', {
        body: {
          interestId,
          updates: { nanny_response: response }
        }
      });

      if (error) throw error;

      toast({
        title: response === 'approved' ? "Interest Approved!" : "Interest Declined",
        description: response === 'approved' 
          ? "The client can now proceed with payment to get your contact details."
          : "The interest has been declined. The client has been notified.",
      });

      onInterestUpdate();
    } catch (error) {
      console.error('Error updating interest:', error);
      toast({
        title: "Error",
        description: "Failed to update interest",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleAdminApproval = async (interestId: string, approved: boolean) => {
    setProcessing(interestId);
    try {
      const { error } = await supabase.functions.invoke('update-interest', {
        body: {
          interestId,
          updates: { admin_approved: approved }
        }
      });

      if (error) throw error;

      if (approved) {
        // Send contact details email
        const { error: emailError } = await supabase.functions.invoke('send-contact-details', {
          body: { interestId }
        });

        if (emailError) {
          console.error('Email error:', emailError);
          toast({
            title: "Payment Approved",
            description: "Payment approved but there was an issue sending emails. Please contact support.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Payment Approved!",
            description: "Contact details have been sent to both parties via email.",
          });
        }
      } else {
        toast({
          title: "Payment Rejected",
          description: "The payment has been rejected and both parties have been notified.",
        });
      }

      onInterestUpdate();
    } catch (error) {
      console.error('Error updating admin approval:', error);
      toast({
        title: "Error",
        description: "Failed to update approval status",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (interest: Interest) => {
    if (interest.admin_approved) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
    }
    if (interest.payment_status === 'completed') {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Awaiting Admin</Badge>;
    }
    if (interest.nanny_response === 'approved') {
      return <Badge variant="outline"><CreditCard className="h-3 w-3 mr-1" />Awaiting Payment</Badge>;
    }
    if (interest.nanny_response === 'declined') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Declined</Badge>;
    }
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Response</Badge>;
  };

  return (
    <div className="space-y-4">
      {interests.map((interest) => (
        <Card key={interest.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {userRole === 'nanny' && interest.clients?.profiles 
                  ? `Interest from ${interest.clients.profiles.first_name} ${interest.clients.profiles.last_name}`
                  : userRole === 'client' && interest.nannies?.profiles
                  ? `Interest in ${interest.nannies.profiles.first_name} ${interest.nannies.profiles.last_name}`
                  : userRole === 'admin' && interest.clients?.profiles && interest.nannies?.profiles
                  ? `${interest.clients.profiles.first_name} → ${interest.nannies.profiles.first_name}`
                  : 'Interest Request'
                }
              </CardTitle>
              {getStatusBadge(interest)}
            </div>
          </CardHeader>
          <CardContent>
            {interest.message && (
              <p className="text-muted-foreground mb-4">{interest.message}</p>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <span>Submitted: {new Date(interest.created_at).toLocaleDateString()}</span>
            </div>

            {/* Nanny Actions */}
            {userRole === 'nanny' && interest.nanny_response === 'pending' && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleNannyResponse(interest.id, 'approved')}
                  disabled={processing === interest.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleNannyResponse(interest.id, 'declined')}
                  disabled={processing === interest.id}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </div>
            )}

            {/* Client Payment */}
            {userRole === 'client' && 
             interest.nanny_response === 'approved' && 
             interest.payment_status === 'pending' && (
              <PayButton 
                interestId={interest.id}
                amount={200}
                nannyName={interest.nannies?.profiles ? 
                  `${interest.nannies.profiles.first_name} ${interest.nannies.profiles.last_name}` : 'Nanny'}
                clientName={interest.clients?.profiles ? 
                  `${interest.clients.profiles.first_name} ${interest.clients.profiles.last_name}` : 'Client'}
              />
            )}

            {/* Admin Actions */}
            {userRole === 'admin' && (
              <>
                {interest.payment_status === 'completed' && !interest.admin_approved && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAdminApproval(interest.id, true)}
                      disabled={processing === interest.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Payment & Send Details
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleAdminApproval(interest.id, false)}
                      disabled={processing === interest.id}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Payment
                    </Button>
                  </div>
                )}
                {interest.nanny_response === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleNannyResponse(interest.id, 'approved')}
                      disabled={processing === interest.id}
                      variant="secondary"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Admin Approve on Behalf
                    </Button>
                    <Button
                      onClick={() => handleNannyResponse(interest.id, 'declined')}
                      disabled={processing === interest.id}
                      variant="outline"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Admin Decline on Behalf
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Status Messages */}
            {interest.admin_approved && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">
                  ✅ Contact details have been shared. You can now arrange your interview!
                </p>
              </div>
            )}

            {interest.payment_status === 'completed' && !interest.admin_approved && userRole !== 'admin' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  💰 Payment received! Waiting for admin approval to share contact details.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}