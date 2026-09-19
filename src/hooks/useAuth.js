// functions:
//   - Expose derived auth state (isLoggedIn, isVerified, role, user)
//   - Wrap AuthService calls with loading/error state
//   - Keep authStore in sync after every mutation
//   - Handle post-login redirect via getDefaultPath()
//   - Boot-time rehydration: if a token exists in the persisted store but
//   - the user object is stale, re-fetch /auth/me to get fresh data
//   - NOTE: /auth/me does NOT return a new token - we keep the existing one

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import { getDefaultPath } from '../utils/roleGuard';
import { useUiStore } from '../store/uiStore';
import { ROLES } from '../config/constants';
import { validateEmail, validateOtp } from '../utils/validators/authValidator';

export function useAuth() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isVerified = useAuthStore((state) => state.isVerified);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLoggingOut = useAuthStore((state) => state.setLoggingOut);
  const setEmailVerified = useAuthStore((state) => state.setEmailVerified);

  const toastSuccess = useUiStore((state) => state.toastSuccess);
  const toastError = useUiStore((state) => state.toastError);

  const isLoggedIn = Boolean(user) && Boolean(token);
  const role = user?.role ?? null;
  const isAdmin = role === ROLES.ADMIN || role === ROLES.DEV;
  const isOrganizer =
    role === ROLES.ORGANIZER || role === ROLES.ADMIN || role === ROLES.DEV;
  const isAttendee = role === ROLES.ATTENDEE;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // RATE LIMITING (429 responses from login/register/forgot-password/verify-otp)
  // `rateLimit` is null when not rate-limited, otherwise { message, secondsLeft }.
  // Countdown ticks down once a second and clears itself at 0.
  const [rateLimit, setRateLimit] = useState(null);
  const rateLimitIntervalRef = useRef(null);
  const isRateLimited = Boolean(rateLimit && rateLimit.secondsLeft > 0);

  const startRateLimitCountdown = useCallback((seconds, message) => {
    clearInterval(rateLimitIntervalRef.current);
    setRateLimit({ message, secondsLeft: seconds });
    rateLimitIntervalRef.current = setInterval(() => {
      setRateLimit((prev) => {
        if (!prev || prev.secondsLeft <= 1) {
          clearInterval(rateLimitIntervalRef.current);
          return null;
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => clearInterval(rateLimitIntervalRef.current);
  }, []);

  function resetErrors() {
    setError(null);
    setFieldErrors({});
  }

  function extractError(err) {
    const data = err?.response?.data;

    // 429 = rate limited (Redis-backed limiter on the four auth endpoints).
    // This is an expected, working-backend response — never a network/auth
    // failure — so it gets its own branch instead of falling into the
    // generic message path below. The backend deliberately keeps the
    // message generic (no attempt counts/thresholds); we just surface it
    // and, if a Retry-After header is present, drive a countdown from it.
    // No default duration is assumed when the header is missing.
    if (err?.response?.status === 429) {
      const msg = data?.message ?? 'Too many attempts. Please try again in a few minutes.';
      setError(msg);

      const retryAfterSeconds = Number(err.response.headers?.['retry-after']);
      if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
        startRateLimitCountdown(retryAfterSeconds, msg);
      }

      return msg;
    }

    if (data?.errors) {
      setFieldErrors(data.errors);

      // Extract real messages
      const messages = Object.values(data.errors);
      const combined = messages.join('\n');

      setError(combined);
      return combined;
    }

    const msg = data?.message ?? 'Something went wrong. Please try again.';

    setError(msg);
    return msg;
  }

  const register = useCallback(
    async ({ name, email, password }) => {
      if (isRateLimited) return;
      setLoading(true);
      resetErrors();
      try {
        const data = await AuthService.register({ name, email, password });
        setAuth({
          user: data.user,
          token: data.token,
          isVerified: false,
        });
        toastSuccess(
          data.message_hint ??
            'Account created! Check your email for the OTP to verify your account.'
        );
        navigate('/verify-email');
      } catch (error) {
        toastError(extractError(error));
      } finally {
        setLoading(false);
      }
    },
    [setAuth, toastError, toastSuccess, navigate, isRateLimited]
  );

  const verifyEmail = useCallback(
    async (otp) => {
      setLoading(true);
      resetErrors();
      try {
        await AuthService.verifyEmail(otp);
        setEmailVerified();
        toastSuccess('Email verified successfully!');
        navigate(getDefaultPath(role));
      } catch (error) {
        toastError(extractError(error));
      } finally {
        setLoading(false);
      }
    },
    [role, setEmailVerified, toastSuccess, toastError, navigate]
  );

  const resendOtp = useCallback(async () => {
    setLoading(true);
    resetErrors();
    try {
      const data = await AuthService.resendOtp();
      toastSuccess(data.message ?? 'A new OTP has been sent to your email.');
    } catch (error) {
      toastError(extractError(error));
    } finally {
      setLoading(false);
    }
  }, [toastError, toastSuccess]);

  const login = useCallback(
    async ({ email, password }) => {
      if (isRateLimited) return;
      setLoading(true);
      resetErrors();
      try {
        const data = await AuthService.login({ email, password });
        setAuth({
          user: data.user,
          token: data.token,
          isVerified: Boolean(data.email_verified),
        });

        !data.email_verified
          ? (toastSuccess(
              'Logged in successfully! Please verify your email to continue.'
            ),
            navigate('/verify-email'))
          : (toastSuccess(data.message_hint ?? 'Welcome back!'),
            navigate(getDefaultPath(data.user.role)));
      } catch (error) {
        toastError(extractError(error));
      } finally {
        setLoading(false);
      }
    },
    [setAuth, toastError, toastSuccess, navigate, isRateLimited]
  );

  const logout = useCallback(async () => {
    try {
      setLoggingOut();
      await AuthService.logout().catch(() => {});
    } finally {
      clearAuth();
      navigate('/home', { replace: true });
    }
  }, [navigate, setLoggingOut, clearAuth]);

  const rehydrate = useCallback(async () => {
    if (user) return; // already have user, skip
    try {
      const data = await AuthService.me();
      setAuth({
        user: data.user,
        token: token ?? null, // keep existing token if we had one; cookie covers the rest
        isVerified: Boolean(data.user?.email_verified),
      });
    } catch {
      if (token || user) {
        clearAuth();
      }
    }
  }, [token, user, clearAuth, setAuth]);

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  // FORGOTTON PASSWORD IMPLEMENTATION HOOKS
  const forgotPassword = useCallback(
    async (email) => {
      if (isRateLimited) return;
      setLoading(true);
      resetErrors();
      try {
        const data = await AuthService.forgotPassword(email);
        toastSuccess(data.message ?? 'OTP sent to your email.');
        navigate('/verify-otp', { state: { email } });
      } catch (error) {
        toastError(extractError(error));
      } finally {
        setLoading(false);
      }
    },
    [navigate, toastError, toastSuccess, isRateLimited]
  );

  const verifyForgotOtp = useCallback(
    async ({ email, otp }) => {
      if (isRateLimited) return;
      setLoading(true);
      resetErrors();

      const emailError = validateEmail(email);
      const otpError = validateOtp(otp);

      if (emailError || otpError) {
        const msg = emailError || otpError;
        setError(msg);
        toastError(msg);
        setLoading(false);
        return;
      }

      try {
        const data = await AuthService.verifyForgotOtp({ email, otp });

        toastSuccess(data.message ?? 'OTP verified successfully!');

        navigate(`/reset-password?token=${data.reset_token}`);
      } catch (error) {
        toastError(extractError(error));
      } finally {
        setLoading(false);
      }
    },
    [navigate, toastError, toastSuccess, isRateLimited]
  );

  const resetPassword = useCallback(
    async ({ resetToken, newPassword, confirmPassword }) => {
      setLoading(true);
      resetErrors();

      try {
        const data = await AuthService.resetPassword({
          resetToken,
          newPassword,
          confirmPassword,
        });
        toastSuccess(
          data.message ??
            'Password reset successfully! Please login with your new password.'
        );
        navigate('/login');
      } catch (error) {
        toastError(extractError(error));
      } finally {
        setLoading(false);
      }
    },
    [navigate, toastError, toastSuccess]
  );

  const googleLogin = useCallback(
    async (idToken) => {
      setLoading(true);
      resetErrors();
      try {
        const data = await AuthService.googleAuth(idToken);
        setAuth({ user: data.user, token: data.token, isVerified: true });
        toastSuccess('Welcome! Signed in with Google.');
        navigate(getDefaultPath(data.user.role));
      } catch (error) {
        toastError(extractError(error));
      } finally {
        setLoading(false);
      }
    },
    [setAuth, toastError, toastSuccess, navigate]
  );

  return {
    // State
    user,
    token,
    role,
    isLoggedIn,
    isVerified,
    isAdmin,
    isOrganizer,
    isAttendee,
    loading,
    error,
    fieldErrors,

    // Rate limiting (429s from login/register/forgot-password/verify-otp)
    isRateLimited,
    rateLimitSeconds: rateLimit?.secondsLeft ?? null,
    rateLimitMessage: rateLimit?.message ?? null,

    // Actions
    register,
    verifyEmail,
    resendOtp,
    login,
    logout,
    rehydrate,
    resetErrors,
    googleLogin,

    // forgotton password
    forgotPassword,
    verifyForgotOtp,
    resetPassword,
  };
}
