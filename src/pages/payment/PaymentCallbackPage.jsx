// PaymentCallbackPage
// Handles Paystack redirect after payment.
//
// Flow:
//   1. Paystack redirects to /payment/callback?reference=xxx&trxref=xxx
//   2. This page reads the reference from the URL
//   3. Calls BookingsService.verifyPayment(reference) via useBookings
//   4. On success → shows ticket confirmation + redirects to /my-tickets
//   5. On failure → shows error with retry/support options
//
// Edge cases handled:
//   - Missing reference param → immediate error
//   - Double-mount in StrictMode → useRef guard prevents double-call
//   - User navigates back → stale status shown correctly

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Ticket,
  ArrowRight,
  RefreshCw,
  Home,
  MessageCircle,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import BookingsService from '../../services/bookings.service';
import { useUiStore } from '../../store/uiStore';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';

// ── Status types ──────────────────────────────────────────────
const STATUS = {
  VERIFYING: 'verifying',
  SUCCESS: 'success',
  FAILED: 'failed',
  NO_REFERENCE: 'no_reference',
};

// ── Animated ticket icon ──────────────────────────────────────
function TicketSuccess() {
  return (
    <div className="relative flex items-center justify-center w-28 h-28 mx-auto mb-8">
      {/* Outer pulse ring */}
      <div
        className="absolute inset-0 rounded-full border-2 border-success/30 animate-ping"
        style={{ animationDuration: '2s' }}
      />
      {/* Mid ring */}
      <div className="absolute inset-2 rounded-full border border-success/20" />
      {/* Inner filled circle */}
      <div className="w-20 h-20 rounded-full bg-success/10 border-2 border-success/40 flex items-center justify-center">
        <CheckCircle2 size={36} className="text-success" strokeWidth={1.75} />
      </div>
      {/* Sparkle decorations */}
      <Sparkles size={14} className="absolute top-1 right-3 text-success/60" />
      <Sparkles
        size={10}
        className="absolute bottom-3 left-2 text-success/40"
      />
    </div>
  );
}

// ── Verifying spinner ─────────────────────────────────────────
function VerifyingState() {
  const [step, setStep] = useState(0);
  const steps = [
    'Contacting payment gateway…',
    'Verifying transaction…',
    'Issuing your tickets…',
    'Almost done…',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => Math.min(prev + 1, steps.length - 1));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      {/* Animated spinner with ticket inside */}
      <div className="relative w-24 h-24 mx-auto mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-border" />
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent animate-spin"
          style={{ animationDuration: '1s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Ticket size={28} className="text-accent" strokeWidth={1.5} />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-text border border-accent-border rounded-full mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        <span className="text-xs font-bold text-accent uppercase tracking-widest">
          Processing Payment
        </span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight mb-3">
        Confirming your booking
      </h1>
      <p className="text-sm text-secondary mb-8 max-w-xs leading-relaxed">
        Please don't close this page. We're confirming your payment and issuing
        your tickets.
      </p>

      {/* Step indicator */}
      <div className="bg-card border border-border rounded-card px-5 py-3 min-w-70">
        <div className="flex items-center gap-2">
          <Loader2 size={14} className="text-accent animate-spin shrink-0" />
          <p className="text-xs font-medium text-secondary transition-all duration-500">
            {steps[step]}
          </p>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-1000"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Success state ─────────────────────────────────────────────
function SuccessState({ data, reference, countdown, onViewTickets }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8">
      <TicketSuccess />

      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-full mb-5">
        <span className="text-xs font-bold text-success uppercase tracking-widest">
          Payment Confirmed
        </span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight mb-3">
        You're all set! 🎉
      </h1>
      <p className="text-sm text-secondary mb-8 max-w-xs leading-relaxed">
        Your payment was successful and your tickets have been issued. Show your
        QR code at the gate for entry.
      </p>

      {/* Ticket card */}
      <div className="w-full max-w-sm bg-card border border-card rounded-card overflow-hidden mb-8">
        {/* Green top strip */}
        <div className="h-1.5 w-full bg-success" />

        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted uppercase font-bold tracking-wider">
              Reference
            </span>
            <span className="text-xs font-mono font-semibold text-primary">
              {reference}
            </span>
          </div>

          {data?.booking_number && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted uppercase font-bold tracking-wider">
                Booking
              </span>
              <span className="text-xs font-semibold text-primary">
                {data.booking_number}
              </span>
            </div>
          )}

          {data?.tickets_issued != null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted uppercase font-bold tracking-wider">
                Tickets
              </span>
              <span className="text-xs font-semibold text-success">
                {data.tickets_issued} ticket
                {data.tickets_issued !== 1 ? 's' : ''} issued
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted uppercase font-bold tracking-wider">
              Status
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success">
              <CheckCircle2 size={10} strokeWidth={2.5} /> Paid
            </span>
          </div>
        </div>

        {/* Perforation */}
        <div className="relative mx-0 border-t border-dashed border-border">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-main-bg border border-border" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-main-bg border border-border" />
        </div>

        <div className="px-5 py-4 bg-main-bg flex items-center gap-2">
          <Ticket size={14} className="text-muted shrink-0" />
          <p className="text-xs text-muted">
            Your QR codes are ready to use in{' '}
            <span className="text-accent font-semibold">My Tickets</span>
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button
          onClick={onViewTickets}
          className="flex items-center justify-center gap-2 h-12 px-5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-btn transition-colors active:scale-95 touch-manipulation w-full sm:flex-1"
        >
          <Ticket size={15} strokeWidth={2.5} />
          View My Tickets
        </button>
        <Link
          to="/events"
          className="flex items-center justify-center gap-2 h-12 px-5 bg-card border border-border text-secondary text-sm font-semibold rounded-btn hover:text-primary hover:border-accent/40 transition-colors w-full sm:flex-1"
        >
          Browse More
        </Link>
      </div>

      {/* Auto-redirect countdown */}
      {countdown > 0 && (
        <div className="mt-6 flex items-center gap-1.5 text-xs text-muted">
          <Clock size={11} />
          <span>Redirecting to your tickets in {countdown}s…</span>
        </div>
      )}
    </div>
  );
}

// ── Failed state ──────────────────────────────────────────────
function FailedState({ reference, error, onRetry, retrying }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8">
      {/* Icon */}
      <div className="relative w-24 h-24 mx-auto mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-error/30" />
        <div className="w-24 h-24 rounded-full bg-error/10 border-2 border-error/30 flex items-center justify-center">
          <XCircle size={36} className="text-error" strokeWidth={1.75} />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-error/10 border border-error/20 rounded-full mb-5">
        <span className="text-xs font-bold text-error uppercase tracking-widest">
          Payment Failed
        </span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight mb-3">
        Something went wrong
      </h1>
      <p className="text-sm text-secondary mb-3 max-w-xs leading-relaxed">
        We couldn't confirm your payment. If money was deducted from your
        account, it will be refunded within 3–5 business days.
      </p>

      {/* Error detail */}
      {error && (
        <div className="w-full max-w-sm p-3 bg-error/5 border border-error/15 rounded-card mb-6 text-left">
          <p className="text-xs font-bold text-error mb-1">Error details</p>
          <p className="text-xs text-secondary leading-relaxed">{error}</p>
        </div>
      )}

      {/* Reference */}
      {reference && (
        <div className="w-full max-w-sm bg-card border border-border rounded-card p-4 mb-8 text-left">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
            Keep this for support
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted">Reference</span>
            <span className="text-xs font-mono font-semibold text-primary break-all">
              {reference}
            </span>
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={onRetry}
          disabled={retrying}
          className="flex items-center justify-center gap-2 h-12 px-5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-btn transition-colors disabled:opacity-50 active:scale-95 p-3"
        >
          {retrying ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : (
            <RefreshCw size={15} strokeWidth={2.5} />
          )}
          {retrying ? 'Retrying…' : 'Try Again'}
        </button>
        <Link
          to="/my-bookings"
          className="flex items-center justify-center gap-2 h-12 px-5 bg-card border border-border text-secondary text-sm font-semibold rounded-btn hover:text-primary hover:border-accent/40 transition-colors"
        >
          My Bookings
        </Link>
      </div>

      <p className="mt-6 text-xs text-muted max-w-xs">
        Still having issues?{' '}
        <a
          href="mailto:support@ticketer.ng"
          className="text-accent hover:text-accent-hover transition-colors font-medium"
        >
          Contact support
        </a>
      </p>
    </div>
  );
}

// ── No reference state ────────────────────────────────────────
function NoReferenceState() {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      <div className="w-16 h-16 rounded-card bg-warning/10 border border-warning/20 flex items-center justify-center mb-6">
        <Ticket size={28} strokeWidth={1.5} className="text-warning" />
      </div>
      <h1 className="text-xl font-bold text-primary mb-2">
        No payment reference found
      </h1>
      <p className="text-sm text-secondary mb-8 max-w-xs leading-relaxed">
        This page is for processing Paystack payment callbacks. If you're
        looking for your tickets, check My Tickets below.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Link
          to="/my-tickets"
          className="flex items-center justify-center gap-2 h-12 px-6 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-btn transition-colors duration-180 active:scale-95 touch-manipulation w-full sm:w-40"
        >
          <Ticket size={14} /> My Tickets
        </Link>
        <Link
          to="/events"
          className="flex items-center justify-center gap-2 h-12 px-6 bg-card border border-border text-primary text-sm font-semibold rounded-btn hover:border-accent/40 hover:shadow-md transition-all duration-180 active:scale-95 touch-manipulation w-full sm:w-40"
        >
          <Home size={14} /> Browse Events
        </Link>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toastSuccess = useUiStore((s) => s.toastSuccess);
  const toastError = useUiStore((s) => s.toastError);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState(STATUS.VERIFYING);
  const [verifyData, setVerifyData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Prevent double-verification in StrictMode
  const verified = useRef(false);

  const reference =
    searchParams.get('reference') || searchParams.get('trxref') || '';

  async function verify() {
    if (!reference) {
      setStatus(STATUS.NO_REFERENCE);
      return;
    }

    try {
      const data = await BookingsService.verifyPayment({ reference });
      setVerifyData(data);
      setStatus(STATUS.SUCCESS);
      toastSuccess('Payment confirmed! Your tickets have been issued.');

      // Auto-redirect countdown
      setCountdown(60);
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        'Payment verification failed. Please try again or contact support.';
      setErrorMsg(msg);
      setStatus(STATUS.FAILED);
      toastError(msg);
    }
  }

  useEffect(() => {
    if (verified.current) return;
    verified.current = true;
    verify();
  }, [verified]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    if (countdown === 1) {
      // Navigate on last tick
      const t = setTimeout(() => navigate(
        verifyData?.booking_number
        ? `/my-tickets?booking=${verifyData.booking_number}&expand=true`
        : '/my-tickets'
      ), 1000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, navigate, verifyData]);

  async function handleRetry() {
    setRetrying(true);
    setStatus(STATUS.VERIFYING);
    setErrorMsg('');
    verified.current = false;
    await verify();
    setRetrying(false);
  }

  function handleViewTickets() {
    navigate(
      verifyData?.booking_number
        ? `/my-tickets?booking=${verifyData.booking_number}&expand=true`
        : '/my-tickets'
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-main-bg">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex items-center justify-center py-8 min-h-screen">
        <div className="w-full max-w-lg">
          {/* Card wrapper */}
          <div className="">
            {status === STATUS.VERIFYING && <VerifyingState />}

            {status === STATUS.SUCCESS && (
              <SuccessState
                data={verifyData}
                reference={reference}
                countdown={countdown}
                onViewTickets={handleViewTickets}
              />
            )}

            {status === STATUS.FAILED && (
              <FailedState
                reference={reference}
                error={errorMsg}
                onRetry={handleRetry}
                retrying={retrying}
              />
            )}

            {status === STATUS.NO_REFERENCE && <NoReferenceState />}
          </div>

          {/* Help footer */}
          {status !== STATUS.VERIFYING && (
            <p className="text-center text-xs text-muted mt-4">
              Having trouble?{' '}
              <a
                href="mailto:support@ticketer.ng"
                className="text-accent hover:text-accent-hover transition-colors"
              >
                support@ticketer.ng
              </a>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
