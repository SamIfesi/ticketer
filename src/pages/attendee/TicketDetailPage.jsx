// /ticket/:id — Full ticket detail page.
// Shows the complete premium ticket with:
//   - Rich gradient banner with category pill + event title
//   - 2-col meta grid with uppercase labels (DATE, VENUE, TICKET TYPE, etc.)
//   - Dashed perforation with side notches
//   - QR code stub with ticket ID + status pill
//   - Download ticket button (theme-aware PNG export)
//   - Share button (Web Share API → clipboard fallback)
//   - Back navigation

import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  AlertCircle,
  ExternalLink,
  Music,
  Cpu,
  Trophy,
  Briefcase,
  Utensils,
  BookOpen,
  Heart,
  Star,
  Ticket,
} from 'lucide-react';
import { useTickets } from '../../hooks/useTickets';
import { useUiStore } from '../../store/uiStore';
import { formatShortDate, formatTime } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import QRCodeDisplay from '../../components/tickets/QRCodeDisplay';
import DownloadTicketButton from '../../components/tickets/DownloadTicketButton';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';

// ── Category icons ────────────────────────────────────────────
const CATEGORY_ICONS = {
  music: Music,
  technology: Cpu,
  sports: Trophy,
  business: Briefcase,
  food: Utensils,
  education: BookOpen,
  health: Heart,
  entertainment: Star,
};

const BANNER_GRADIENTS = [
  'linear-gradient(135deg, #1a1f2e 0%, #2c3e6b 50%, #3b5bdb 100%)',
  'linear-gradient(135deg, #2d0a00 0%, #7c2d12 50%, #c2410c 100%)',
  'linear-gradient(135deg, #052e16 0%, #14532d 50%, #16a34a 100%)',
  'linear-gradient(135deg, #2d1b69 0%, #6d28d9 50%, #a855f7 100%)',
  'linear-gradient(135deg, #0c1445 0%, #1e3a8a 50%, #2563eb 100%)',
  'linear-gradient(135deg, #1a0a2e 0%, #6b21a8 50%, #a855f7 100%)',
];

function getGradientIndex(id) {
  return (
    parseInt(String(id ?? '0').replace(/\D/g, '') || '0', 10) %
    BANNER_GRADIENTS.length
  );
}

// ── Category pill ─────────────────────────────────────────────
function CategoryPill({ categoryName }) {
  if (!categoryName) return null;
  const key = categoryName.toLowerCase().split(' ')[0];
  const Icon = CATEGORY_ICONS[key] ?? Ticket;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white text-xs font-medium mb-2">
      <Icon size={11} strokeWidth={2} />
      {categoryName}
    </span>
  );
}

// ── Status pill ───────────────────────────────────────────────
function StatusPill({ status }) {
  const styles = {
    valid: {
      bg: 'bg-success/10',
      text: 'text-success',
      border: 'border-success/20',
      dot: 'bg-success',
      label: 'Valid',
    },
    used: {
      bg: 'bg-border',
      text: 'text-muted',
      border: 'border-border',
      dot: 'bg-muted',
      label: 'Used',
    },
    cancelled: {
      bg: 'bg-error/10',
      text: 'text-error',
      border: 'border-error/20',
      dot: 'bg-error',
      label: 'Cancelled',
    },
    expired: {
      bg: 'bg-border',
      text: 'text-muted',
      border: 'border-border',
      dot: 'bg-muted',
      label: 'Expired',
    },
  };
  const normalizedStatus = status?.toLowerCase();
  const s = styles[normalizedStatus] ?? styles.expired;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border text-xs font-medium px-3 py-1 ${s.bg} ${s.text} ${s.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ── Perforation divider ───────────────────────────────────────
function Perforation() {
  return (
    <div className="relative flex items-center" style={{ margin: '0 -1px' }}>
      <div
        className="w-5 h-5 rounded-full shrink-0 bg-main-bg border border-border"
        style={{ marginLeft: '-10px', zIndex: 1 }}
      />
      <div
        className="flex-1 border-t-2 border-dashed border-border"
        style={{ margin: '0 4px' }}
      />
      <div
        className="w-5 h-5 rounded-full shrink-0 bg-main-bg border border-border"
        style={{ marginRight: '-10px', zIndex: 1 }}
      />
    </div>
  );
}

// ── Page skeleton ─────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="animate-pulse max-w-lg mx-auto px-6 py-8 flex flex-col gap-4">
      <div className="h-44 bg-border rounded-card" />
      <div className="bg-card border border-border rounded-b-card px-5 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-2.5 bg-border rounded w-16" />
              <div className="h-4 bg-border rounded w-28" />
            </div>
          ))}
        </div>
      </div>
      <div className="h-px bg-border" />
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-20 h-20 bg-border rounded-card shrink-0" />
        <div className="flex flex-col gap-2">
          <div className="h-2.5 bg-border rounded w-16" />
          <div className="h-5 bg-border rounded w-24" />
          <div className="h-6 bg-border rounded-full w-16 mt-1" />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { ticket, ticketLoading, ticketError, fetchTicket } = useTickets();
  const toastSuccess = useUiStore((s) => s.toastSuccess);

  useEffect(() => {
    if (id) fetchTicket(id);
  }, [id, fetchTicket]);

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({ title: ticket?.event_title ?? 'My Ticket', url })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        toastSuccess('Ticket link copied to clipboard!');
      });
    }
  }

  // Error state
  if (ticketError && !ticketLoading) {
    return (
      <div className="min-h-screen bg-main-bg flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="w-14 h-14 rounded-card bg-error/10 border border-error/20 flex items-center justify-center">
          <AlertCircle size={26} className="text-error" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-bold text-primary text-lg">Ticket not found</p>
          <p className="text-sm text-secondary mt-1">
            This ticket doesn't exist or you don't have access to it.
          </p>
        </div>
        <Link
          to="/my-tickets"
          className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
        >
          <ArrowLeft size={15} strokeWidth={2.5} /> My Tickets
        </Link>
      </div>
    );
  }

  const isValid = ticket?.status?.toLowerCase() === 'valid';
  const isUsed = ticket?.status?.toLowerCase() === 'used';
  const isCancelled =
    ticket?.status?.toLowerCase() === 'cancelled' ||
    ticket?.status?.toLowerCase() === 'expired';
  const gradientIndex = getGradientIndex(id);
  const event = ticket?.event ?? {};
  const startDate = ticket?.event_start_date ?? event?.start_date;
  const location = ticket?.event_location ?? event?.location;
  const ticketAmount = ticket?.unit_price;

  return (
    <div className="flex flex-col min-h-screen bg-main-bg">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-8">
        {/* Back + Share header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            Back
          </button>
          {!ticketLoading && ticket && (
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 h-9 px-3 border border-border rounded-btn text-xs font-semibold text-secondary hover:text-primary hover:border-accent/40 transition-colors"
            >
              <Share2 size={14} strokeWidth={2} />
              Share
            </button>
          )}
        </div>

        {ticketLoading ? (
          <PageSkeleton />
        ) : ticket ? (
          <div className="flex flex-col gap-5">
            {/* ── Premium ticket card ── */}
            <div className="bg-card border border-border rounded-card overflow-hidden shadow-md">
              {/* Banner */}
              <div
                className="relative h-44 overflow-hidden"
                style={{ background: BANNER_GRADIENTS[gradientIndex] }}
              >
                {event.banner_image && (
                  <img
                    src={event.banner_image}
                    alt={ticket.event_title}
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                  />
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)',
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <CategoryPill
                    categoryName={event.category_name ?? ticket?.category_name}
                  />
                  <h1 className="text-xl font-bold text-white leading-tight line-clamp-2">
                    {ticket.event_title ?? event.title ?? 'Event'}
                  </h1>
                </div>
              </div>

              {/* Meta grid */}
              <div className="px-5 pt-5 pb-4 grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                    Date
                  </p>
                  <p className="text-base font-semibold text-primary">
                    {startDate ? formatShortDate(startDate) : '—'}
                  </p>
                  {startDate && (
                    <p className="text-sm text-secondary mt-0.5">
                      {formatTime(startDate)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                    Venue
                  </p>
                  <p className="text-base font-semibold text-primary line-clamp-2">
                    {location ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                    Ticket type
                  </p>
                  <p className="text-base font-semibold text-primary">
                    {ticket.ticket_type ?? 'General Admission'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                    Ticket Amount
                  </p>
                  <p className="text-base font-semibold text-primary">
                    {ticketAmount === '0.00'
                      ? 'FREE'
                      : formatCurrency(ticketAmount)}
                  </p>
                </div>
                <div>
                  {isUsed && ticket.checked_in_at ? (
                    <>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                        Checked in
                      </p>
                      <p className="text-base font-semibold text-primary">
                        {formatShortDate(ticket.checked_in_at)},{' '}
                        {formatTime(ticket.checked_in_at)}
                      </p>
                    </>
                  ) : ticket.holder_name ? (
                    <>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                        Holder
                      </p>
                      <p className="text-base font-semibold text-primary truncate">
                        {ticket.holder_name}
                      </p>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Perforation */}
              <Perforation />

              {/* QR stub */}
              <div className="px-5 py-4 flex items-center gap-4">
                <QRCodeDisplay
                  url={ticket.qr_code_url}
                  size={80}
                  disabled={isUsed || isCancelled}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                    Ticket ID
                  </p>
                  <p className="text-base font-semibold text-primary tracking-wide">
                    {ticket?.ticket_number}
                  </p>
                  <div className="mt-2">
                    <StatusPill status={ticket.status} />
                  </div>
                  {ticket?.checkin_mode === 'multi_day' && (
                    <p className="text-xs text-muted mt-1">
                      {ticket.days_used ?? 0}/{ticket.total_days} days used
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex flex-col gap-3">
              {/* Download ticket PDF — valid and used tickets both get a PDF */}
              {(isValid || isUsed) && ticket?.booking_id && (
                <DownloadTicketButton
                  ticketId={ticket.id}
                  // bookingId={ticket.booking_id}
                  size="md"
                  checkOnMount
                />
              )}

              <div className="flex items-center gap-3">
                <Link
                  to={`/events/${ticket.event_id ?? event.id}`}
                  className="flex-1 flex items-center justify-center gap-2 h-11 border border-border rounded-btn text-sm font-semibold text-secondary hover:text-primary hover:border-accent/40 transition-colors"
                >
                  View event
                  <ExternalLink size={14} strokeWidth={2} />
                </Link>
                <Link
                  to="/my-tickets"
                  className="flex-1 flex items-center justify-center gap-2 h-11 bg-accent-text text-accent border border-accent-border rounded-btn text-sm font-semibold hover:bg-accent hover:text-white transition-colors duration-150"
                >
                  All tickets
                </Link>
              </div>
            </div>

            {/* Fine print */}
            <p className="text-center text-xs text-muted pb-2">
              Ticket ID: {' '}
              {ticket?.ticket_number}{' '}
              · Issued via Ticketer
            </p>
          </div>
        ) : null}
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
