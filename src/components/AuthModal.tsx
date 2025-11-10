import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Loader, Info, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/authContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  showEmailConfirmed?: boolean;
}

export default function AuthModal({ isOpen, onClose, showEmailConfirmed = false }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(showEmailConfirmed);
  const { signIn, signUp } = useAuth();

  // Update emailConfirmed state when prop changes
  useEffect(() => {
    if (showEmailConfirmed) {
      setEmailConfirmed(true);
    }
  }, [showEmailConfirmed]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (result.error) {
        // Provide more helpful error messages
        let errorMessage = result.error.message;
        
        // Handle specific error cases
        if (result.error.message?.includes('database error') || result.error.message?.includes('500')) {
          errorMessage = 'Server error during signup. Please try again or contact support.';
        } else if (result.error.message?.includes('confirmation email') && result.data?.user) {
          // User was created but email sending failed
          // Show message and allow them to try signing in
          errorMessage = 'Account created! Confirmation email could not be sent. You can try signing in - your account may work without confirmation.';
          // Switch to sign in mode after showing message
          setTimeout(() => {
            setIsSignUp(false); // Switch to sign in mode
            setError(null); // Clear error so they can try signing in
          }, 3000);
          return;
        } else if (result.error.message?.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (result.error.message?.includes('Password')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (result.error.message?.includes('Email')) {
          errorMessage = 'Please enter a valid email address.';
        }
        
        setError(errorMessage);
      } else {
        // Success - handle based on signup or signin
        if (isSignUp && result.data?.user) {
          // Signup successful - show confirmation message
          setSuccess('Account created successfully! Please check your email to confirm your account.');
          setAwaitingConfirmation(true);
          setError(null);
          
          // Don't close modal yet - keep it open to show confirmation message
          // User can close it manually or it will close when they confirm email
        } else {
          // Sign in successful - close modal
          onClose();
          setEmail('');
          setPassword('');
          setSuccess(null);
          setAwaitingConfirmation(false);
        }
      }
    } catch (err: any) {
      console.error('Signup/Signin error:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setLoading(false);
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  // Show email confirmed success state
  if (emailConfirmed && isOpen) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Email Confirmed!</h2>
            <button
              onClick={() => {
                setEmailConfirmed(false);
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Success Content */}
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Welcome to Profiles After Dark!
                </h3>
                <p className="text-slate-400 text-sm">
                  Your email has been successfully confirmed. Your account is now active.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <button
                onClick={() => {
                  setEmailConfirmed(false);
                  onClose();
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-300">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold mb-1">Check your email!</p>
                  <p className="text-sm">{success}</p>
                  <p className="text-xs mt-2 text-green-400">
                    Click the confirmation link in your email to complete signup. You can close this window - we'll redirect you when you click the link.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isSignUp && !awaitingConfirmation && (
            <div className="flex items-start space-x-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-300">
              <Info className="h-5 w-5 mt-0.5" />
              <p>
                Please be patient — it may take up to <strong>5 minutes</strong> to receive your confirmation email.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>
          </div>

          {!awaitingConfirmation && (
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                </>
              )}
            </button>
          )}

          {awaitingConfirmation && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Close (Check your email)
              </button>
              <p className="text-xs text-center text-slate-400">
                Didn't receive the email? Check your spam folder or try signing up again.
              </p>
            </div>
          )}

          <div className="text-center pt-4 border-t border-slate-700">
            <p className="text-slate-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={switchMode}
                className="ml-2 text-purple-400 hover:text-purple-300 transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
