// ExpandableTicketCard — redesigned to match premium ticket aesthetic.
//
// Compact row: rounded gradient icon swatch, bold title, muted sub, pill badge (image 1)
// Expanded: full ticket with rich banner, category pill, 2-col meta grid,
//           dashed perforation with side notches, QR stub (image 2)
//
// Props:
//   ticket — ticket object from the API

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Ticket,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Music,
  Cpu,
  Trophy,
  Briefcase,
  Utensils,
  BookOpen,
  Heart,
  Star,
} from 'lucide-react';
import QRCodeDisplay from '../../components/tickets/QRCodeDisplay';
import DownloadTicketButton from './DownloadTicketButton';
import { formatShortDate, formatTime } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';

// ── Category icon map ─────────────────────────────────────────
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

// ── Gradient swatches for compact row icon ────────────────────
const ICON_GRADIENTS = [
  'linear-gradient(135deg, #3b5bdb, #7048e8)',
  'linear-gradient(135deg, #c0392b, #e67e22)',
  'linear-gradient(135deg, #087f5b, #2f9e44)',
  'linear-gradient(135deg, #c2255c, #e64980)',
  'linear-gradient(135deg, #1864ab, #1c7ed6)',
  'linear-gradient(135deg, #5f3dc4, #845ef7)',
];

// ── Banner gradients matching the event category feel ─────────
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
    ICON_GRADIENTS.length
  );
}

// ── Status helpers ────────────────────────────────────────────
function getStatusStyle(status) {
  switch (status) {
    case 'valid':
      return {
        bg: 'bg-success/10',
        text: 'text-success',
        border: 'border-success/20',
        dot: 'bg-success',
        label: 'Valid',
      };
    case 'used':
      return {
        bg: 'bg-border',
        text: 'text-muted',
        border: 'border-border',
        dot: 'bg-muted',
        label: 'Used',
      };
    case 'cancelled':
      return {
        bg: 'bg-error/10',
        text: 'text-error',
        border: 'border-error/20',
        dot: 'bg-error',
        label: 'Cancelled',
      };
    case 'expired':
      return {
        bg: 'bg-border',
        text: 'text-muted',
        border: 'border-border',
        dot: 'bg-muted',
        label: 'Expired',
      };
    default:
      return {
        bg: 'bg-border',
        text: 'text-muted',
        border: 'border-border',
        dot: 'bg-muted',
        label: status ?? 'Unknown',
      };
  }
}

// ── Status pill ───────────────────────────────────────────────
function StatusPill({ status, size = 'sm' }) {
  const s = getStatusStyle(status);
  const sizeClass = size === 'sm' ? 'text-xs px-3 py-1' : 'text-sm px-4 py-1.5';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClass} ${s.bg} ${s.text} ${s.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ── Category pill for banner ──────────────────────────────────
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

// ── Perforation divider ───────────────────────────────────────
function Perforation({ className = '' }) {
  return (
    <div
      className={`relative flex items-center ${className}`}
      style={{ margin: '0 -1px' }}
    >
      {/* Left notch */}
      <div
        className="w-5 h-5 rounded-full shrink-0 bg-main-bg border border-border"
        style={{ marginLeft: '-10px', zIndex: 1 }}
      />
      {/* Dashed line */}
      <div
        className="flex-1 border-t-2 border-dashed border-border"
        style={{ margin: '0 4px' }}
      />
      {/* Right notch */}
      <div
        className="w-5 h-5 rounded-full shrink-0 bg-main-bg border border-border"
        style={{ marginRight: '-10px', zIndex: 1 }}
      />
    </div>
  );
}

// ── Compact row (collapsed state) ────────────────────────────
function CompactRow({ ticket, gradientIndex, onExpand, expanded }) {
  const event = ticket?.event ?? {};
  const title = ticket?.event_title ?? event?.title ?? 'Event';
  const sub = [
    ticket?.ticket_type ?? 'General',
    ticket?.event_start_date || event?.start_date
      ? formatShortDate(ticket?.event_start_date ?? event?.start_date)
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      onClick={onExpand}
      className="w-full text-left flex items-start gap-3 p-3 bg-card border border-border rounded-card hover:border-accent/30 hover:shadow-sm transition-all duration-200 touch-manipulation group"
    >
      {/* Gradient icon swatch */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
        style={{ background: ICON_GRADIENTS[gradientIndex] }}
      >
        <Ticket size={24} className="text-white" strokeWidth={1.75} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-primary leading-snug truncate">
          {title}
        </p>
        <p className="text-[11px] text-secondary mt-0.5 truncate">{sub}</p>
      </div>

      {/* Status pill + chevron */}
      <div className="flex items-start gap-2 shrink-0">
        <StatusPill status={ticket?.status} />
        <div className="text-muted transition-transform duration-200 group-hover:text-primary">
          {expanded ? (
            <ChevronUp size={16} strokeWidth={2} />
          ) : (
            <ChevronDown size={16} strokeWidth={2} />
          )}
        </div>
      </div>
    </button>
  );
}

// ── Expanded ticket card (image 2 style) ──────────────────────
function ExpandedCard({ ticket, gradientIndex, onCollapse }) {
  const event = ticket?.event ?? {};
  // const isValid = ticket?.status === 'valid';
  const isUsed = ticket?.status === 'used';
  const isCancelled =
    ticket?.status === 'cancelled' || ticket?.status === 'expired';
  const title = ticket?.event_title ?? event?.title ?? 'Event';
  const startDate = ticket?.event_start_date ?? event?.start_date;
  const location = ticket?.event_location ?? event?.location;
  const ticketAmount = ticket?.unit_price;
  const banner = ticket?.banner_image;

  return (
    <div className="bg-card rounded-card overflow-hidden shadow-lg transition-all duration-300">
      {/* ── Banner ── */}
      <div
        className="relative h-44 overflow-hidden"
        style={{ background: BANNER_GRADIENTS[gradientIndex] }}
      >
        {ticket?.banner_image && (
          <img
            src={banner}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        )}
        {/* Gradient overlay — bottom-heavy */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)',
          }}
        />

        {/* Collapse button */}
        <button
          onClick={onCollapse}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/50 transition-colors touch-manipulation"
        >
          <ChevronUp size={16} strokeWidth={2.5} />
        </button>

        {/* Category + title */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <CategoryPill
            categoryName={event.category_name ?? ticket?.category_name}
          />
          <h3 className="text-xl font-bold text-white leading-tight line-clamp-2">
            {title}
          </h3>
        </div>
      </div>

      {/* ── Meta grid ── */}
      <div className="px-5 pt-5 pb-4 grid grid-cols-2 gap-x-6 gap-y-4">
        {/* Date */}
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
            Date
          </p>
          <p className="text-base font-semibold text-primary leading-snug">
            {startDate ? formatShortDate(startDate) : '—'}
          </p>
          {startDate && (
            <p className="text-sm text-secondary mt-0.5">
              {formatTime(startDate)}
            </p>
          )}
        </div>

        {/* Venue */}
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
            Venue
          </p>
          <p className="text-base font-semibold text-primary leading-snug line-clamp-2">
            {location ?? '—'}
          </p>
        </div>

        {/* Ticket type */}
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
            Ticket type
          </p>
          <p className="text-base font-semibold text-primary leading-snug">
            {ticket?.ticket_type ?? 'General Admission'}
          </p>
        </div>

        {/* Ticket Amount */}
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
            Ticket Amount
          </p>
          <p className="text-base font-semibold text-primary">
            {ticketAmount === '0.00' ? 'FREE' : formatCurrency(ticketAmount)}
          </p>
        </div>

        {/* 4th field: holder or checked-in time */}
        <div>
          {isUsed && ticket?.checked_in_at ? (
            <>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                Checked in
              </p>
              <p className="text-base font-semibold text-primary leading-snug">
                {formatShortDate(ticket.checked_in_at)},{' '}
                {formatTime(ticket.checked_in_at)}
              </p>
            </>
          ) : ticket?.holder_name ? (
            <>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                Holder
              </p>
              <p className="text-base font-semibold text-primary leading-snug truncate">
                {ticket.holder_name}
              </p>
            </>
          ) : null}
        </div>
      </div>

      {/* ── Perforation ── */}
      <Perforation className="mx-0 my-1" />

      {/* ── QR Stub ── */}
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
            <StatusPill status={ticket?.status} />
          </div>
          {ticket?.checkin_mode === 'multi_day' && (
            <p className="text-xs text-muted mt-1">
              {ticket.days_used ?? 0}/{ticket.total_days} days used
            </p>
          )}
        </div>

        {/* Download + Details actions */}
        <div className="flex flex-col items-center gap-2 shrink-0 w-20">
          {/* Details link */}
          <Link
            to={`/ticket/${ticket?.id}`}
            className="flex flex-col items-center gap-1 text-muted hover:text-accent transition-colors"
          >
            <ExternalLink size={16} strokeWidth={2} />
            <span className="text-[10px] font-medium">Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function ExpandableTicketCard({
  ticket,
  defaultExpanded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const gradientIndex = getGradientIndex(ticket?.id);

  return (
    <div className="transition-all duration-300">
      {expanded ? (
        <ExpandedCard
          ticket={ticket}
          gradientIndex={gradientIndex}
          onCollapse={() => setExpanded(false)}
        />
      ) : (
        <CompactRow
          ticket={ticket}
          gradientIndex={gradientIndex}
          expanded={false}
          onExpand={() => setExpanded(true)}
        />
      )}
    </div>
  );
}
