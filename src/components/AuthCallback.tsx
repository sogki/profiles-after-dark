import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, Loader, XCircle } from 'lucide-react';

interface AuthCallbackProps {
  onEmailConfirmed?: () => void;
}

export default function AuthCallback({ onEmailConfirmed }: AuthCallbackProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase automatically handles email verification when the link is clicked
        // The token is in the URL hash, and Supabase processes it automatically
        // We just need to check if the session was established
        
        // Wait a moment for Supabase to process the verification
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if we have a session (user was already verified by Supabase)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is authenticated - email was verified
          setStatus('success');
          setMessage('Email verified successfully!');
          
          // Check if user has a username set
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('user_id', session.user.id)
            .single();

          // Trigger modal to open and redirect
          if (onEmailConfirmed) {
            onEmailConfirmed();
          }
          
          // Wait a moment to show success message, then redirect
          setTimeout(() => {
            if (!profile?.username) {
              // No username set, redirect to settings to set one
              navigate('/profile-settings?tab=account&setup=true');
            } else {
              // Username already set, redirect to home with success param
              navigate('/?emailConfirmed=true');
            }
          }, 1000);
          return;
        }

        // If no session yet, wait a bit longer and check again
        // Supabase might still be processing the verification
        setStatus('loading');
        setMessage('Verifying your email... Please wait.');
        
        // Wait a bit longer and check again
        setTimeout(async () => {
          const { data: { session: finalSession } } = await supabase.auth.getSession();
          if (finalSession?.user) {
            setStatus('success');
            setMessage('Email verified successfully!');
            
            // Check if user has a username set
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('username')
              .eq('user_id', finalSession.user.id)
              .single();

            // Trigger modal to open
            if (onEmailConfirmed) {
              onEmailConfirmed();
            }

            setTimeout(() => {
              if (!profile?.username) {
                // No username set, redirect to settings to set one
                navigate('/profile-settings?tab=account&setup=true');
              } else {
                // Username already set, redirect to home with success param
                navigate('/?emailConfirmed=true');
              }
            }, 1000);
          } else {
            setStatus('error');
            setMessage('Verification failed. Please try clicking the link again or contact support.');
            setTimeout(() => navigate('/'), 3000);
          }
        }, 1500);
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader className="h-16 w-16 text-purple-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Verifying Email</h2>
            <p className="text-slate-400">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-slate-400">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-slate-400 mb-4">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Go to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}

