import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Users, QrCode, Eye, CalendarDays, MapPin, AlertTriangle } from 'lucide-react';
import EventsService from '../../services/events.service';
import { formatShortDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import Badge from '../../components/ui/Badge';
import PayoutPlanBadge from '../../components/ui/PayoutPlanBadge';
import StatCard from '../../components/dashboard/StatCard';

function TicketTypeRow({ tt }) {
  const sold = tt.quantity_sold ?? 0;
  const total = tt.quantity ?? 0;
  const remaining = total - sold;
  const pct = total > 0 ? (sold / total) * 100 : 0;
  const isLow = total > 0 && remaining / total < 0.1;

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-primary truncate">{tt.name}</p>
          {isLow && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">
              <AlertTriangle size={10} /> Low stock
            </span>
          )}
        </div>
        <p className="text-xs text-muted mt-0.5">{formatCurrency(tt.price)} · {remaining} left</p>
        <div className="h-1.5 bg-border rounded-full overflow-hidden mt-2 max-w-50">
          <div
            className={`h-full rounded-full ${isLow ? 'bg-warning' : 'bg-accent'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
      <span className="text-sm font-bold text-primary shrink-0">{sold}/{total}</span>
    </div>
  );
}

export default function OrganizerEventDetailPage() {
  const { slug } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    EventsService.getMyEvent(slug)
      .then((data) => setEvent(data.event))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const ticketTypes = event?.ticket_types ?? [];
  const totalSold = ticketTypes.reduce((acc, tt) => acc + (tt.quantity_sold ?? 0), 0);
  const totalQty = ticketTypes.reduce((acc, tt) => acc + (tt.quantity ?? 0), 0);
  const estRevenue = ticketTypes.reduce((acc, tt) => acc + (tt.quantity_sold ?? 0) * (tt.price ?? 0), 0);

  return (
    <div className="flex flex-col min-h-screen bg-main-bg">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-2 text-xs text-secondary mb-6">
          <Link to="/organizer/events" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft size={13} strokeWidth={2.5} /> My Events
          </Link>
          <span className="text-muted">/</span>
          <span className="text-primary font-medium truncate max-w-50">
            {loading ? 'Loading…' : (event?.title ?? 'Event')}
          </span>
        </div>

        {loading ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-32 bg-border rounded-card" />
            <div className="h-48 bg-border rounded-card" />
          </div>
        ) : !event ? (
          <p className="text-sm text-muted py-10 text-center">Event not found.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge status={event.status} size="sm" dot />
                  <PayoutPlanBadge plan={event.payout_plan} />
                </div>
                <h1 className="text-2xl font-black text-primary tracking-tight">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-secondary">
                    <CalendarDays size={12} className="text-muted" /> {formatShortDate(event.start_date)}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1.5 text-xs text-secondary">
                      <MapPin size={12} className="text-muted" /> {event.location}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/events/${event.slug}`}
                  className="flex items-center gap-1.5 h-9 px-3 border border-border rounded-btn text-xs font-semibold text-secondary hover:text-primary hover:border-accent/40 transition-colors"
                >
                  <Eye size={13} /> Public page
                </Link>
                <Link
                  to={`/organizer/events/${event.slug}/edit`}
                  className="flex items-center gap-1.5 h-9 px-3 bg-accent-text text-accent border border-accent-border rounded-btn text-xs font-semibold hover:bg-accent hover:text-white transition-colors"
                >
                  <Pencil size={13} /> Edit
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard
                icon={Users}
                label="Tickets Sold"
                value={`${totalSold}/${totalQty}`}
                accent="#2563eb"
              />
              <StatCard
                icon={QrCode}
                label="Est. Revenue"
                value={formatCurrency(estRevenue)}
                sub="from ticket sales"
                accent="#10b981"
              />
              <StatCard
                icon={CalendarDays}
                label="Ticket Types"
                value={ticketTypes.length}
                accent="#f59e0b"
              />
            </div>

            {/* Ticket types breakdown */}
            <div className="bg-card border border-border rounded-card p-5">
              <h2 className="text-sm font-bold text-primary mb-3">Ticket Types</h2>
              <div className="flex flex-col">
                {ticketTypes.length > 0 ? (
                  ticketTypes.map((tt) => <TicketTypeRow key={tt.id} tt={tt} />)
                ) : (
                  <p className="text-sm text-muted py-4">No ticket types configured yet.</p>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                to={`/organizer/events/${event.slug}/bookings`}
                className="flex items-center justify-center gap-2 h-11 rounded-btn bg-card border border-border text-sm font-semibold text-secondary hover:text-primary hover:border-accent/40 transition-colors"
              >
                <Users size={15} strokeWidth={2} /> View Bookings
              </Link>
              <Link
                to={`/organizer/events/${event.slug}/checkin`}
                className="flex items-center justify-center gap-2 h-11 rounded-btn bg-card border border-border text-sm font-semibold text-secondary hover:text-primary hover:border-accent/40 transition-colors"
              >
                <QrCode size={15} strokeWidth={2} /> Check-in Scanner
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer variant="minimal" />
    </div>
  );
}