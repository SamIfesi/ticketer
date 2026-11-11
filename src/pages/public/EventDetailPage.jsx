import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Ticket,
  AlertCircle,
  Share2,
  ChevronRight,
  TrendingUp,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import { useBookings } from '../../hooks/useBookings';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import {
  formatEventDate,
  formatTime,
  isEventPast,
} from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import EventsService from '../../services/events.service';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Sidebar from '../../components/layout/Sidebar';
import Navbar from '../../components/layout/Navbar';
import { TicketTypeSelector } from '../../components/events/TicketTypeSelector';
import ContactOrganizerCard from '../../components/events/ContactOrganizerCard.jsx';
import { ROLES, PAYSTACK_PUBLIC_KEY } from '../../config/constants';
import { Helmet } from 'react-helmet-async';

// ── Page skeleton ─────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-full h-72 sm:h-96 bg-border" />
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="h-8 bg-border rounded w-3/4" />
          <div className="h-4 bg-border rounded w-1/3" />
          <div className="flex flex-col gap-2 mt-4">
            <div className="h-3 bg-border rounded" />
            <div className="h-3 bg-border rounded" />
            <div className="h-3 bg-border rounded w-4/5" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-40 bg-border rounded-card" />
          <div className="h-40 bg-border rounded-card" />
        </div>
      </div>
    </div>
  );
}

// ── Revenue panel (admin + organizer only) ────────────────────
function RevenuePannel({ ticketTypes }) {
  // Calculate total revenue: sum of (price × quantity_sold) per ticket type
  const revenue = (ticketTypes ?? []).reduce(
    (acc, tt) => acc + Number(tt.total_revenue ?? 0),
    0
  );

  const totalSold = (ticketTypes ?? []).reduce(
    (acc, tt) => acc + parseInt(tt.quantity_sold ?? 0, 10),
    0
  );

  const totalCapacity = (ticketTypes ?? []).reduce(
    (acc, tt) => acc + parseInt(tt.quantity ?? 0, 10),
    0
  );

  const soldPct =
    totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;

  return (
    <div className="bg-card border border-border rounded-card p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <div className="w-7 h-7 rounded-btn bg-success/10 flex items-center justify-center">
          <TrendingUp size={13} className="text-success" strokeWidth={2} />
        </div>
        <h3 className="text-sm font-bold text-primary">Revenue Summary</h3>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-muted bg-border px-2 py-0.5 rounded-full">
          Organizer View
        </span>
      </div>

      {/* Main revenue figure */}
      <div className="mb-4">
        <p className="text-xs text-muted mb-1">Total Revenue</p>
        <p className="text-3xl font-black text-primary tracking-tight">
          {formatCurrency(revenue)}
        </p>
      </div>

      {/* Sales progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-muted">Ticket Sales</p>
          <p className="text-xs font-semibold text-primary">
            {totalSold.toLocaleString()} / {totalCapacity.toLocaleString()}
            <span className="text-muted font-normal ml-1">({soldPct}%)</span>
          </p>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${Math.min(soldPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Per ticket-type breakdown */}
      {(ticketTypes ?? []).length > 0 && (
        <div className="flex flex-col gap-0 divide-y divide-border">
          {ticketTypes.map((tt) => {
            const typeRevenue = Number(tt.total_revenue ?? 0);
            const available =
              parseInt(tt.quantity ?? 0, 10) -
              parseInt(tt.quantity_sold ?? 0, 10);

            return (
              <div key={tt.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary truncate">
                      {tt.name}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {tt.paid_sold} paid{' '}
                      {tt.free_sold > 0 && `${tt.free_sold} free`}
                      {' · '}
                      {available.toLocaleString()} left
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-primary">
                      {formatCurrency(typeRevenue)}
                    </p>
                    <p className="text-[11px] text-muted">
                      list price: {formatCurrency(tt.price)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const isLoggedIn = Boolean(token);

  const toastInfo = useUiStore((s) => s.toastInfo);
  const cancelPayment = () => {};
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { event, eventLoading, eventError, fetchEvent } = useEvents();
  const { initiateBooking, payLoading } = useBookings();
  const [ownTypes, setOwnTypes] = useState(null);

  const isEventOwner = user?.id === event?.organizer_id;
  const canSeeRevenue =
    isEventOwner || role === ROLES.ADMIN || role === ROLES.DEV;

  useEffect(() => {
    if (id) fetchEvent(id);
  }, [id, fetchEvent]);

  useEffect(() => {
    if (!canSeeRevenue || !event?.id) return;
    let active = true;
    EventsService.getMyEvent(event.id)
      .then((d) => active && setOwnTypes(d.event?.ticket_types ?? []))
      .catch(() => {
        console.error;
      });
    return () => {
      active = false;
    };
  }, [canSeeRevenue, event?.id]);

  const isPast = event
    ? isEventPast(event.end_date ?? event.start_date)
    : false;

  const isFullySoldOut =
    event?.ticket_types?.length > 0 &&
    event.ticket_types.every((tt) => tt.quantity - tt.quantity_sold <= 0);

  async function handleSelectTicket({ ticketType, quantity }) {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    const data = await initiateBooking({
      ticketTypeId: ticketType.id,
      quantity,
    });
    if (!data) return;

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: data.amount * 100, // convert to kobo
      ref: data.reference,
      access_code: data.access_code,
      onClose: () => {
        cancelPayment();
        toastInfo('Payment cancelled');
      },
      callback: (response) => {
        navigate(`/payment/callback?reference=${response.reference}`);
      },
    });
    handler.openIframe();
  }

  function handleShare() {
    if (navigator.share) {
      navigator
        .share({ title: event?.title, url: window.location.href })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toastInfo('Link copied to clipboard!');
    }
  }

  if (eventError && !eventLoading) {
    return (
      <div className="min-h-screen bg-main-bg flex flex-col items-center justify-center gap-5 px-6 text-center">
        <AlertCircle size={40} className="text-error" strokeWidth={1.5} />
        <div>
          <p className="font-bold text-primary text-lg">Event not found</p>
          <p className="text-sm text-secondary mt-1">
            This event may have been removed or is no longer available.
          </p>
        </div>
        <Link
          to="/events"
          className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
        >
          <ArrowLeft size={15} strokeWidth={2.5} /> Browse events
        </Link>
      </div>
    );
  }

  return (
    <>
      {event && (
        <Helmet>
          <title>{event.title} | Ticketer</title>
          <meta
            name="description"
            content={event.description?.slice(0, 160) ?? ''}
          />

          {/* Open Graph (WhatsApp, Facebook, Telegram, LinkedIn) */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content={event.title} />
          <meta
            property="og:description"
            content={event.description?.slice(0, 160) ?? ''}
          />
          <meta property="og:url" content={window.location.href} />
          {event.banner_image && (
            <meta property="og:image" content={event.banner_image} />
          )}

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={event.title} />
          <meta
            name="twitter:description"
            content={event.description?.slice(0, 160) ?? ''}
          />
          {event.banner_image && (
            <meta name="twitter:image" content={event.banner_image} />
          )}
        </Helmet>
      )}

      <div className="flex flex-col min-h-screen bg-main-bg">
        {/* Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* ── Breadcrumb ────────────────────────────────────── */}
        {!eventLoading && event && (
          <nav className="bg-card border-b border-border">
            <div className="max-w-6xl mx-auto px-6 h-10 flex items-center gap-2 text-xs text-secondary">
              <Link
                to="/events"
                className="hover:text-primary transition-colors"
              >
                Events
              </Link>
              <ChevronRight size={12} className="text-muted" />
              {event.category_name && (
                <>
                  <Link
                    to={`/events?category=${event.category_id ?? ''}`}
                    className="hover:text-primary transition-colors"
                  >
                    {event.category_name}
                  </Link>
                  <ChevronRight size={12} className="text-muted" />
                </>
              )}
              <span className="text-primary font-medium truncate max-w-50">
                {event.title}
              </span>
            </div>
          </nav>
        )}

        {/* ── Main content ──────────────────────────────────── */}
        {eventLoading ? (
          <PageSkeleton />
        ) : event ? (
          <>
            {/* Hero banner */}
            <div
              className="relative w-full bg-linear-to-br from-blue-600 to-indigo-800 overflow-hidden"
              style={{ height: '360px' }}
            >
              {event.banner_image ? (
                <img
                  src={event.banner_image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-white/10 font-black select-none"
                    style={{
                      fontSize: 'clamp(8rem, 20vw, 16rem)',
                      lineHeight: 1,
                    }}
                  >
                    {event.title.charAt(0)}
                  </span>
                </div>
              )}
              {event.banner_image && (
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
              )}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                {event.category_name && (
                  <span className="px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                    {event.category_name}
                  </span>
                )}
                {isPast && (
                  <span className="px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                    Past event
                  </span>
                )}
              </div>
              <button
                onClick={handleShare}
                aria-label="Share this event"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <Share2 size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Body */}
            <div className="max-w-6xl mx-auto px-6 py-10 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* ── Left: event details ────────────────────── */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge status={event.status} size="sm" dot />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight leading-tight">
                      {event.title}
                    </h1>
                    {event.organizer_name && (
                      <p className="text-sm text-secondary mt-2">
                        Hosted by{' '}
                        <span className="font-semibold text-primary">
                          {event.organizer_name}
                        </span>
                      </p>
                    )}
                    {event.contact_email && (
                      <>
                        <p className="text-[12px] text-secondary mt-0.5">
                          For more information, contact:{' '}
                          <Link
                            to={`mailto:${event.contact_email}`}
                            className="font-medium text-accent hover:border-accent/40 hover:text-accent transition-colors duration-150"
                          >
                            {event.contact_email}
                          </Link>
                        </p>
                        <p className="text-[12px] text-secondary">
                          or call us at{' '}
                          <Link
                            to={`tel:${event.contact_phone?.replace(/\s+/g, '')}`}
                            className="font-medium text-accent hover:border-accent/40 hover:text-accent transition-colors duration-150"
                          >
                            {event.contact_phone}
                          </Link>
                        </p>
                      </>
                    )}
                  </div>

                  {/* Key detail cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-card border border-border rounded-card">
                      <div className="w-9 h-9 rounded-btn bg-accent-text flex items-center justify-center shrink-0">
                        <Calendar
                          size={17}
                          className="text-accent"
                          strokeWidth={1.75}
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                          Date
                        </p>
                        <p className="text-sm font-semibold text-primary mt-0.5">
                          {formatEventDate(event.start_date)}
                        </p>
                        <p className="text-xs text-secondary mt-0.5">
                          {formatTime(event.start_date)}
                          {event.end_date && ` – ${formatTime(event.end_date)}`}
                        </p>
                      </div>
                    </div>

                    {event.location && (
                      <div className="flex items-start gap-3 p-4 bg-card border border-border rounded-card">
                        <div className="w-9 h-9 rounded-btn bg-accent-text flex items-center justify-center shrink-0">
                          <MapPin
                            size={17}
                            className="text-accent"
                            strokeWidth={1.75}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                            Location
                          </p>
                          <p className="text-sm font-semibold text-primary mt-0.5">
                            {event.location}
                          </p>
                        </div>
                      </div>
                    )}

                    {event.total_tickets > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-card border border-border rounded-card">
                        <div className="w-9 h-9 rounded-btn bg-accent-text flex items-center justify-center shrink-0">
                          <Ticket
                            size={17}
                            className="text-accent"
                            strokeWidth={1.75}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                            Tickets
                          </p>
                          <p className="text-sm font-semibold text-primary mt-0.5">
                            {(
                              event.total_tickets - (event.tickets_sold ?? 0)
                            ).toLocaleString()}{' '}
                            remaining
                          </p>
                          <p className="text-xs text-secondary mt-0.5">
                            of {event.total_tickets.toLocaleString()} total
                          </p>
                        </div>
                      </div>
                    )}

                    {event.tickets_sold > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-card border border-border rounded-card">
                        <div className="w-9 h-9 rounded-btn bg-accent-text flex items-center justify-center shrink-0">
                          <Users
                            size={17}
                            className="text-accent"
                            strokeWidth={1.75}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                            Attending
                          </p>
                          <p className="text-sm font-semibold text-primary mt-0.5">
                            {event.tickets_sold.toLocaleString()} people
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {event.description && (
                    <div>
                      <h2 className="text-base font-bold text-primary mb-3">
                        About this event
                      </h2>
                      <div className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
                        {event.description}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <button
                      onClick={() => navigate(-1)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-primary transition-colors"
                    >
                      <ArrowLeft size={15} strokeWidth={2.5} />
                      Back
                    </button>
                  </div>

                  <ContactOrganizerCard
                    phone={event.contact_phone}
                    email={event.contact_email}
                    organizerName={event.organizer_name}
                  />
                </div>

                {/* ── Right: ticket panel + revenue (if privileged) ── */}
                <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
                  {/* Revenue panel — organizer / admin / dev only */}
                  {canSeeRevenue && ownTypes && (
                    <RevenuePannel
                      event={event}
                      ticketTypes={ownTypes}
                      // ticketTypes={event.ticket_types ?? []}
                    />
                  )}

                  {/* Ticket purchase panel */}
                  <div className="bg-card border border-border rounded-card p-4">
                    <h2 className="font-bold text-primary mb-1">Get tickets</h2>

                    {isPast && (
                      <div className="flex items-start gap-2 p-3 bg-border rounded-btn mb-3 mt-2">
                        <AlertCircle
                          size={15}
                          className="text-muted shrink-0 mt-0.5"
                        />
                        <p className="text-xs text-secondary">
                          This event has already taken place.
                        </p>
                      </div>
                    )}

                    {!isPast && isFullySoldOut && (
                      <div className="flex items-start gap-2 p-3 bg-border rounded-btn mb-3 mt-2">
                        <AlertCircle
                          size={15}
                          className="text-error shrink-0 mt-0.5"
                        />
                        <p className="text-xs text-secondary">
                          All ticket types are sold out.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 mt-3">
                      {event.ticket_types && event.ticket_types.length > 0 ? (
                        <TicketTypeSelector
                          ticketTypes={event.ticket_types}
                          disabled={
                            isPast || event.status !== 'published' || payLoading
                          }
                          onSelect={handleSelectTicket}
                          loading={payLoading}
                        />
                      ) : (
                        <div className="text-center py-6">
                          <Ticket
                            size={24}
                            className="text-muted mx-auto mb-2"
                            strokeWidth={1.5}
                          />
                          <p className="text-sm text-secondary">
                            Ticket details not yet available.
                          </p>
                          <p className="text-xs text-muted mt-1">
                            Check back closer to the event date.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Login nudge for guests */}
                  {!isLoggedIn && event.ticket_types?.length > 0 && !isPast && (
                    <div className="bg-accent-text border border-accent-border rounded-card p-4 flex flex-col gap-2">
                      <p className="text-xs font-semibold text-accent">
                        Sign in to book
                      </p>
                      <p className="text-xs text-secondary">
                        Create a free account to purchase tickets and manage
                        your bookings.
                      </p>
                      <Link
                        to="/register"
                        state={{ from: `/events/${id}` }}
                        className="mt-1 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
                      >
                        Create account →
                      </Link>
                    </div>
                  )}

                  {/* Share button */}
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 h-10 border border-border rounded-btn text-sm font-medium text-secondary hover:text-primary hover:border-accent/40 transition-all duration-150"
                  >
                    <Share2 size={15} strokeWidth={2} />
                    Share event
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
