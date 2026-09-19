import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import { formatCountdown } from '../../utils/formatCountdown';
import logo from '/assets/icons/logo.svg';

export default function LoginPage() {
  const {
    login,
    googleLogin,
    loading,
    fieldErrors,
    isRateLimited,
    rateLimitSeconds,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    await login({ email, password });
  }

  return (
    <div className="relative min-h-screen flex items-start justify-center bg-main-bg px-6 py-20">
      <div className="w-full max-w-105">
        <div className="flex flex-col items-start mb-8">
          <div className="absolute top-8 left-6 flex justify-between">
            <Link
              to="/home"
              className="flex items-center text-sm font-medium text-accent hover:text-accent-hover hover:underline transition-colors duration-180 group"
            >
              <ArrowLeft
                size={13}
                className="transition-transform duration-180 group-hover:translate-x-0.5 mr-0.5"
              />
              Back Home
            </Link>
          </div>
          <img src={logo} alt="Ticketer Logo" className="mb-8 self-center" />
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            Welcome <span className="text-accent-hover">Back</span>
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Sign in to your account to continue
          </p>
        </div>

        <div className="bg-main-bg pt-4 flex flex-col gap-5">
          {/* ── Email / password form ── */}
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

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              icon={<Lock size={17} />}
              disabled={loading}
              right={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-muted hover:text-primary transition-color duration-180 touch-manipulation"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              }
            />

            <div className="flex justify-end -mt-2">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-180"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              disabled={!email || !password || isRateLimited}
              className="w-full mt-1"
            >
              {isRateLimited
                ? `Try again in ${formatCountdown(rateLimitSeconds)}`
                : 'Sign in'}
            </Button>
          </form>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted font-medium">
              or continue with google
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Google sign-in ── */}
          <GoogleSignInButton
            label="Sign in with Google"
            loading={loading}
            onSuccess={(idToken) => googleLogin(idToken)}
            onError={() => {}}
          />
        </div>

        <p className="mt-6 text-center text-sm text-secondary">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-accent hover:text-accent-hover transition-colors duration-180"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
