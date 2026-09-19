import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { formatCountdown } from '../../utils/formatCountdown';

export default function ForgotPasswordPage() {
  const {
    loading,
    fieldErrors,
    forgotPassword,
    isRateLimited,
    rateLimitSeconds,
  } = useAuth();

  const [email, setEmail] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    await forgotPassword(email);
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-main-bg px-8 py-12">
      <div className="w-full max-w-105">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 mb-4 text-sm font-medium text-secondary hover:text-primary transition-colors duration-150"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Back to sign in
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-card bg-accent-text border border-accent-border flex items-center justify-center mb-4">
            <Mail size={24} strokeWidth={1.75} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            Forgot your password?
          </h1>
          <p className="mt-2 text-sm text-secondary text-center leading-relaxed max-w-75">
            Enter your email and we'll send you a 6-digit verification code.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5"
        >
          <Input
            label="Email address"
            type="email"
            id="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            icon={<Mail size={17} />}
            disabled={loading}
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={!email || isRateLimited}
            className="w-full mt-1"
          >
            {isRateLimited
              ? `Try again in ${formatCountdown(rateLimitSeconds)}`
              : 'Send code'}
          </Button>
        </form>
      </div>
    </div>
  );
}
