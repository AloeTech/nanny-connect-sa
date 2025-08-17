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
      // Update payment status to completed
      const { error: updateError } = await supabase.functions.invoke('update-interest', {
        body: {
          interestId,
          updates: { payment_status: 'completed' }
        }
      });

      if (updateError) throw updateError;

      toast({
        title: "Payment Confirmed!",
        description: "Payment processed successfully! Waiting for admin approval to share contact details.",
      });

      // Refresh the page to show updated status
      window.location.reload();

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
          Pay R200 & Arrange Interview
        </>
      )}
    </Button>
  );
}