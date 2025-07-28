import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Loader2 } from 'lucide-react';

interface PayButtonProps {
  interestId: string;
  amount: number;
  nannyName: string;
  clientName: string;
}

export default function PayButton({ interestId, amount, nannyName, clientName }: PayButtonProps) {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setProcessing(true);
    
    try {
      // For now, simulate payment and send notification emails
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'interview_setup',
          to: 'all_parties', // This will be handled by the edge function
          subject: 'Interview Setup - Payment Confirmed',
          message: `Payment confirmed for ${nannyName} and ${clientName}. Please arrange your interview.`,
          interestId,
          amount,
          nannyName,
          clientName
        }
      });

      if (error) throw error;

      toast({
        title: "Payment Confirmed!",
        description: "Both parties have been notified to arrange the interview. You will receive contact details via email.",
      });

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Button 
      onClick={handlePayment} 
      disabled={processing}
      className="w-full"
    >
      {processing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Pay R{amount} & Arrange Interview
        </>
      )}
    </Button>
  );
}