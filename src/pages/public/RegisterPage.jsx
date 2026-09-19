import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import PasswordStrength from './PasswordStrength';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import { formatCountdown } from '../../utils/formatCountdown';
import logo from '/assets/icons/logo.svg';

export default function RegisterPage() {
  const {
    register,
    googleLogin,
    loading,
    fieldErrors,
    isRateLimited,
    rateLimitSeconds,
  } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    await register({ name, email, password: password.password });
  }

  const passwordsMatch =
    password.confirmPassword && password.password === password.confirmPassword;

  const isValid =
    name.trim().length >= 3 &&
    email.trim() &&
    password.password.length >= 8 &&
    passwordsMatch;

  return (
    <div className="relative min-h-screen flex items-start justify-center bg-main-bg px-6 py-20">
      <div className="w-full max-w-105">
        <div className="flex flex-col items-start mb-8">
          <div className="absolute top-8 flex">
          <Link
              to="/home"
              className="flex items-center text-sm font-medium text-accent hover:text-accent-hover hover:underline transition-colors duration-180 group"
            >
              <ArrowLeft
                size={13}
                className="transition-transform duration-180 group-hover:translate-x-0.5 mr-0.75"
              />
              Back Home
            </Link>
          </div>
          <img src={logo} alt="Ticketer Logo" className="mb-8 self-center" />
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            Create your <span className="text-accent-hover">account</span>
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Free to join. Start discovering events today.
          </p>
        </div>

        <div className="bg-main-bg flex flex-col gap-5">
          {/* ── Email / password form ── */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-5"
          >
            <Input
              label="Fullname"
              type="text"
              id="name"
              placeholder="John Doe"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={fieldErrors.name}
              icon={<User size={17} />}
              disabled={loading}
            />

            <Input
              label="Email"
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

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password.password}
                onChange={(e) =>
                  setPassword({
                    password: e.target.value,
                    confirmPassword: password.confirmPassword,
                  })
                }
                error={fieldErrors.password}
                icon={<Lock size={17} />}
                disabled={loading}
                right={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    className="text-muted hover:text-primary transition-color duration-180 touch-manipulation"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              />
              <PasswordStrength password={password.password} />

              <Input
                className="mt-4"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password.confirmPassword}
                onChange={(e) =>
                  setPassword({
                    password: password.password,
                    confirmPassword: e.target.value,
                  })
                }
                error={fieldErrors.confirmPassword}
                icon={<Lock size={17} />}
                disabled={loading}
                right={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    }
                    className="text-muted hover:text-primary transition-color duration-180 touch-manipulation"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                }
              />
              {password.confirmPassword && (
                <p
                  className={`mt-2 text-end text-xs transition-color duration-180 ${
                    passwordsMatch ? 'text-success' : 'text-error'
                  }`}
                >
                  {passwordsMatch
                    ? 'Passwords match'
                    : 'Passwords do not match'}
                </p>
              )}
            </div>

            <p className="text-xs text-muted leading-relaxed -mt-1 text-center">
              By creating an account you agree to our{' '}
              <Link to="/terms" className="text-accent-hover font-medium">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-accent-hover font-medium">
                Privacy Policy
              </Link>
              .
            </p>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              disabled={!isValid || isRateLimited}
              className="w-full mt-1"
            >
              {isRateLimited
                ? `Try again in ${formatCountdown(rateLimitSeconds)}`
                : 'Create Account'}
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
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-accent hover:text-accent-hover transition-colors duration-180"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
