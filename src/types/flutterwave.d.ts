declare module 'flutterwave-react-v3' {
  import { ComponentType } from 'react';
  
  export interface FlutterwaveCheckoutOptions {
    public_key: string;
    tx_ref: string;
    amount: number;
    currency: string;
    payment_options: string;
    customer: {
      email: string;
      phone_number?: string;
      name: string;
    };
    customizations?: {
      title?: string;
      description?: string;
      logo?: string;
    };
    callback?: (response: any) => void;
    onclose?: () => void;
  }

  export interface FlutterWaveButtonProps {
    className?: string;
    style?: React.CSSProperties;
    text?: string;
    children?: React.ReactNode;
    disabled?: boolean;
    onClose?: () => void;
  }

  export interface FlutterWaveConfig {
    public_key: string;
    tx_ref: string;
    amount: number;
    currency: string;
    payment_options: string;
    customer: {
      email: string;
      phone_number?: string;
      name: string;
    };
    customizations?: {
      title?: string;
      description?: string;
      logo?: string;
    };
  }

  export interface UseFlutterWaveProps {
    onClose: () => void;
    onAbort?: () => void;
  }

  export const FlutterWaveButton: ComponentType<FlutterWaveButtonProps>;
  export const useFlutterWave: (config: FlutterWaveConfig) => (options?: UseFlutterWaveProps) => void;
  
  // Add this export if needed
  export declare const FlutterwaveCheckout: (options: FlutterwaveCheckoutOptions) => void;
}