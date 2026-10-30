import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Search,
  X,
  Ticket,
  TrendingUp,
  QrCode,
} from 'lucide-react';
import { useOrganizerEvents } from '../../hooks/useOrganizerEvents';
import { formatShortDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import Badge from '../../components/ui/Badge';

function MiniStat({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-card px-4 py-3.5 flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-btn flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}
      >
        <Icon size={16} strokeWidth={1.75} style={{ color }} />
      </div>
      <div>
        <p className="text-base font-black text-primary leading-none">
          {value}
        </p>
        <p className="text-xs text-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-t border-border">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-border shrink-0" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3 bg-border rounded w-28" />
            <div className="h-2.5 bg-border rounded w-36" />
          </div>
        </div>
      </td>
      {[80, 64, 80, 72].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-border rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

function BookingRow({ booking, onView }) {
  return (
    <tr
      onClick={() => onView(booking.id)}
      className="border-t border-border hover:bg-main-bg transition-colors duration-150 cursor-pointer"
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-text flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-accent">
              {(booking.attendee_name ?? 'A')?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary truncate max-w-40">
              {booking.attendee_name ?? '—'}
            </p>
            <p className="text-xs text-muted truncate max-w-45">
              {booking.attendee_email ?? '—'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs font-semibold text-primary">
          {booking.ticket_type ?? '—'}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs font-semibold text-primary">
          {booking.quantity ?? 1}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-sm font-bold text-primary">
          {formatCurrency(booking.total_amount ?? 0)}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs text-muted">
          {booking.paid_at ? formatShortDate(booking.paid_at) : '—'}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <Badge status={booking.payment_status ?? 'paid'} size="sm" />
      </td>
    </tr>
  );
}

export default function EventBookingsPage() {
  const { slug } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const {
    event,
    eventLoading,
    fetchMyEvent,
    bookings,
    bookingsLoading,
    fetchEventBookings,
  } = useOrganizerEvents();

  useEffect(() => {
    if (!slug) return;

      fetchMyEvent(slug).then((resolved) => {
      if (resolved?.id) fetchEventBookings(resolved.id);
    });
  }, [slug, fetchMyEvent, fetchEventBookings]);

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.attendee_name ?? '').toLowerCase().includes(q) ||
      (b.attendee_email ?? '').toLowerCase().includes(q) ||
      (b.ticket_type ?? '').toLowerCase().includes(q)
    );
  });

  const totalRevenue = bookings.reduce(
    (acc, b) => acc + parseFloat(b.total_amount ?? 0),
    0
  );
  const totalTickets = bookings.reduce(
    (acc, b) => acc + parseInt(b.quantity ?? 1, 10),
    0
  );
  const totalBookings = bookings.length;

  return (
    <div className="flex flex-col min-h-screen bg-main-bg">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-2 text-xs text-secondary mb-6">
          <Link
            to="/organizer/events"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={13} strokeWidth={2.5} /> My Events
          </Link>
          <span className="text-muted">/</span>
          <span className="text-primary font-medium truncate max-w-50">
            {eventLoading ? 'Loading…' : (event?.title ?? 'Bookings')}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
              Bookings
            </h1>
            <p className="text-sm text-secondary mt-1">
              {bookingsLoading
                ? 'Loading…'
                : `${totalBookings} paid booking${totalBookings !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/organizer/events/${slug}/checkin`}
              className="flex items-center gap-1.5 h-10 px-4 bg-accent-text text-accent border border-accent-border text-xs font-semibold rounded-btn hover:bg-accent hover:text-white transition-colors duration-150"
            >
              <QrCode size={14} strokeWidth={2} /> Check-in Scanner
            </Link>
          </div>
        </div>

        {!bookingsLoading && bookings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <MiniStat
              icon={Users}
              label="Total Bookings"
              value={totalBookings}
              color="#2563eb"
            />
            <MiniStat
              icon={Ticket}
              label="Tickets Issued"
              value={totalTickets.toLocaleString()}
              color="#f59e0b"
            />
            <MiniStat
              icon={TrendingUp}
              label="Revenue"
              value={formatCurrency(totalRevenue)}
              color="#10b981"
            />
          </div>
        )}

        <div className="relative mb-6 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full h-10 pl-9 pr-9 bg-card border border-border rounded-btn text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="bg-card border border-border rounded-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-main-bg">
                  {[
                    'Attendee',
                    'Ticket Type',
                    'Qty',
                    'Amount',
                    'Paid On',
                    'Status',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookingsLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      onView={(id) => navigate(`/bookings/${id}`)}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-card bg-accent-text border border-accent-border flex items-center justify-center">
                          <Users
                            size={20}
                            strokeWidth={1.5}
                            className="text-accent"
                          />
                        </div>
                        <p className="text-sm font-semibold text-primary">
                          {search
                            ? 'No bookings match your search'
                            : 'No bookings yet'}
                        </p>
                        <p className="text-xs text-muted">
                          {search
                            ? 'Try a different name or email.'
                            : 'Bookings will appear here once attendees purchase tickets.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer variant="minimal"/>
    </div>
  );
}