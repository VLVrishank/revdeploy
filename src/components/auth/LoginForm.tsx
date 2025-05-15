import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface LoginFormProps {
  isController: boolean;
}

type ControllerFormData = {
  email: string;
  password: string;
};

type DisplayFormData = {
  pin: string;
};

const LoginForm: React.FC<LoginFormProps> = ({ isController }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const controllerForm = useForm<ControllerFormData>({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const displayForm = useForm<DisplayFormData>({
    defaultValues: {
      pin: ''
    }
  });

  const handleControllerLogin = async (data: ControllerFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });
      
      if (error) throw error;
      
      navigate('/controller');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisplayLogin = async (data: DisplayFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, you would validate the PIN against Supabase
      // For MVP, we'll use a simple check
      const { data: devices, error } = await supabase
        .from('rickshaw_devices')
        .select('id, phone_number')
        .eq('pin', data.pin)
        .single();
      
      if (error) throw new Error('Invalid PIN');
      
      // Store the device ID in local storage
      localStorage.setItem('deviceId', devices.id);
      navigate('/display');
    } catch (err: any) {
      setError(err.message || 'Invalid PIN');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {isController ? (
        <form onSubmit={controllerForm.handleSubmit(handleControllerLogin)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            {...controllerForm.register('email', { required: 'Email is required' })}
            error={controllerForm.formState.errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            {...controllerForm.register('password', { required: 'Password is required' })}
            error={controllerForm.formState.errors.password?.message}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" fullWidth isLoading={isLoading}>
            Sign In
          </Button>
        </form>
      ) : (
        <form onSubmit={displayForm.handleSubmit(handleDisplayLogin)} className="space-y-4">
          <Input
            label="Enter 4-digit PIN"
            type="password"
            maxLength={4}
            {...displayForm.register('pin', { 
              required: 'PIN is required',
              pattern: {
                value: /^\d{4}$/,
                message: 'PIN must be 4 digits'
              }
            })}
            error={displayForm.formState.errors.pin?.message}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" fullWidth isLoading={isLoading}>
            Access Display
          </Button>
        </form>
      )}
    </div>
  );
};

export default LoginForm;