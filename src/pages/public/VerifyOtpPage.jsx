import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import OTPInput from '../../components/auth/OTPInput';
import Button from '../../components/ui/Button';
import { formatCountdown } from '../../utils/formatCountdown';

function useResendTimer(initialSeconds = 60) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  function startTimer() {
    setSeconds(initialSeconds);
    setCanResend(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  return { seconds, canResend, startTimer };
}

export default function VerifyOtpPage() {
  const {
    loading,
    verifyForgotOtp,
    error,
    isRateLimited,
    rateLimitSeconds,
  } = useAuth();
  const [otp, setOtp] = useState('');
  const { seconds, canResend } = useResendTimer(60);
  const disabled = otp.length !== 6;
  const location = useLocation();

  const email = location.state?.email ?? '';
  // // If someone lands here directly with no email, send them back
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-main-bg px-4">
        <div className="text-center">
          <p className="text-sm text-secondary mb-4">
            Session expired or invalid access.
          </p>
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-accent hover:text-accent-hover"
          >
            Start over
          </Link>
        </div>
      </div>
    );
  }

  async function handleComplete(value) {
    if (loading || isRateLimited) return;
    await verifyForgotOtp({ email, otp: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (otp.length < 6 || loading || isRateLimited) return;
    await verifyForgotOtp({ email, otp });
  }

  function maskEmail(email) {
    if (typeof email !== 'string' || !email.includes('@')) return '';
    
    const [local, domain] = email.split('@');
    return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 4))}@${domain}`;
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-main-bg px-7 py-12">
      <div className="w-full max-w-105">
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-1.5 mb-8 text-sm font-medium text-secondary hover:text-primary transition-colors duration-150"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Back
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-card bg-accent-text border border-accent-border flex items-center justify-center mb-4">
            <ShieldCheck size={24} strokeWidth={1.75} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            Enter verification code
          </h1>
          <p className="text-sm text-secondary mt-2 text-center max-w-88 leading-relaxed">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-primary">
              {maskEmail(email)}
            </span>
            . Enter the code below to verify your email address.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <OTPInput
            value={otp}
            onChange={setOtp}
            onComplete={handleComplete}
            error={Boolean(error)}
            disabled={loading}
            className="mb-7"
            autoFocus
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={disabled || loading || isRateLimited}
            className="w-full"
          >
            {isRateLimited
              ? `Try again in ${formatCountdown(rateLimitSeconds)}`
              : 'Verify code'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className={canResend ? 'text-secondary' : 'text-muted'}>
            Didn't receive the code?{' '}
          </span>

          {canResend ? (
            <Link
              to="/forgot-password"
              className={`font-semibold text-accent hover:text-accent-hover transition-colors duration-180 touch-manipulation ${
                loading ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              Try again
            </Link>
          ) : (
            <span className="text-muted">
              Try again in{' '}
              <span className="font-semibold tabular-nums text-secondary">
                {seconds}s
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
