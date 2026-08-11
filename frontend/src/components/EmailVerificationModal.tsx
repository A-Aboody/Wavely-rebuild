import { useState } from 'react';
import { apiClient } from '../lib/apiClient';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export const EmailVerificationModal = ({ isOpen, onClose, email }: EmailVerificationModalProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/verify-email', { code });
      setSuccess(true);

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate({ to: '/home' });
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');

    try {
      await apiClient.post('/auth/resend-verification');
      alert('Verification code sent! Check your email.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        {success ? (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-1">Email verified</h2>
            <p className="text-sm text-muted-foreground">Redirecting to your feed...</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Verify your email</DialogTitle>
              <DialogDescription>
                We sent a 6-digit verification code to{' '}
                <span className="font-semibold text-foreground">{email}</span>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleVerify} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                  pattern="\d{6}"
                  required
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 px-4 py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  'Verify'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleResend}
                disabled={resending}
                className="w-full text-sm"
              >
                {resending ? 'Sending...' : 'Resend code'}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-2">
              Code expires in 24 hours
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
