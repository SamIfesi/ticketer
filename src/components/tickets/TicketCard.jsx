// TicketCard — premium full ticket card matching the image 2 design.
//
// Full layout: rich gradient banner with category pill + event title overlay,
//              2-col meta grid with uppercase labels, dashed perforation with
//              side notches, QR code stub with ticket ID + status pill.
//
// Compact layout: redesigned compact row matching image 1 style.
//
// Props:
//   ticket  — ticket object from the API
//   compact — smaller layout for lists (uses compact row style)
//   showQr  — whether to show QR code (default true)

import { Link } from 'react-router-dom';
import {
  Ticket,
  Music,
  Cpu,
  Trophy,
  Briefcase,
  Utensils,
  BookOpen,
  Heart,
  Star,
} from 'lucide-react';
import QRCodeDisplay from './QRCodeDisplay';
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

const ICON_GRADIENTS = [
  'linear-gradient(135deg, #3b5bdb, #7048e8)',
  'linear-gradient(135deg, #c0392b, #e67e22)',
  'linear-gradient(135deg, #087f5b, #2f9e44)',
  'linear-gradient(135deg, #c2255c, #e64980)',
  'linear-gradient(135deg, #1864ab, #1c7ed6)',
  'linear-gradient(135deg, #5f3dc4, #845ef7)',
];

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

function StatusPill({ status }) {
  const s = getStatusStyle(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border text-xs font-medium px-3 py-1 ${s.bg} ${s.text} ${s.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

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

function Perforation() {
  return (
    <div className="relative flex items-center" style={{ margin: '0 -1px' }}>
      <div
        className="w-5 h-5 rounded-full flex-shrink-0 bg-main-bg border border-border"
        style={{ marginLeft: '-10px', zIndex: 1 }}
      />
      <div
        className="flex-1 border-t-2 border-dashed border-border"
        style={{ margin: '0 4px' }}
      />
      <div
        className="w-5 h-5 rounded-full flex-shrink-0 bg-main-bg border border-border"
        style={{ marginRight: '-10px', zIndex: 1 }}
      />
    </div>
  );
}

// ── Full ticket card ──────────────────────────────────────────
function FullTicketCard({ ticket, showQr }) {
  const event = ticket?.event ?? {};
  const isUsed = ticket?.status === 'used';
  const isCancelled =
    ticket?.status === 'cancelled' || ticket?.status === 'expired';
  const gradientIndex = getGradientIndex(ticket?.id);
  const title = ticket?.event_title ?? event?.title ?? 'Event';
  const startDate = ticket?.event_start_date ?? event?.start_date;
  const location = ticket?.event_location ?? event?.location;
  const ticketAmount = ticket?.unit_price;

  return (
    <div className="bg-card border border-border rounded-card overflow-hidden shadow-md">
      {/* Banner */}
      <div
        className="relative h-44 overflow-hidden"
        style={{ background: BANNER_GRADIENTS[gradientIndex] }}
      >
        {event.banner_image && (
          <img
            src={event.banner_image}
            alt={title}
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
          <h3 className="text-xl font-bold text-white leading-tight line-clamp-2">
            {title}
          </h3>
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
            {ticket?.ticket_type ?? 'General Admission'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
            Ticket Amount
          </p>
          <p className="text-base font-semibold text-primary">
            {ticketAmount === '0.00' ? 'FREE' : formatCurrency(ticketAmount)}
          </p>
        </div>
        <div>
          {isUsed && ticket?.checked_in_at ? (
            <>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                Checked in
              </p>
              <p className="text-base font-semibold text-primary">
                {formatShortDate(ticket.checked_in_at)},{' '}
                {formatTime(ticket.checked_in_at)}
              </p>
            </>
          ) : ticket?.holder_name ? (
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

      {/* QR Stub */}
      {showQr && (
        <div className="px-5 py-4 flex items-center gap-4">
          <QRCodeDisplay
            url={ticket?.qr_code_url}
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
        </div>
      )}
    </div>
  );
}

// ── Compact ticket row ── matches image 1 ─────────────────────
function CompactTicketCard({ ticket }) {
  const event = ticket?.event ?? {};
  const gradientIndex = getGradientIndex(ticket?.id);
  const title = ticket?.event_title ?? event?.title ?? 'Ticket';
  const startDate = ticket?.event_start_date ?? event?.start_date;

  return (
    <Link
      to={`/ticket/${ticket?.id}`}
      className="flex items-center gap-4 p-4 bg-card border border-border rounded-card hover:border-accent/30 hover:shadow-sm transition-all duration-200 touch-manipulation"
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
        style={{ background: ICON_GRADIENTS[gradientIndex] }}
      >
        <Ticket size={24} className="text-white" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-primary leading-snug truncate">
          {title}
        </p>
        <p className="text-sm text-secondary mt-0.5 truncate">
          {[
            ticket?.ticket_type ?? 'General',
            startDate ? formatShortDate(startDate) : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <StatusPill status={ticket?.status} />
    </Link>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function TicketCard({ ticket, compact = false, showQr = true }) {
  if (compact) return <CompactTicketCard ticket={ticket} />;
  return <FullTicketCard ticket={ticket} showQr={showQr} />;
}
