import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  CalendarDays,
  Search,
  X,
  Pencil,
  Users,
  QrCode,
  Trash2,
  Eye,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';
import { useOrganizerEvents } from '../../hooks/useOrganizerEvents';
import { formatShortDate, isEventPast } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import Badge from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/Modal';

// ── Status filter options ─────────────────────────────────────
const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

const GRADIENTS = [
  'from-blue-600 to-indigo-700',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-violet-600 to-purple-700',
  'from-cyan-500 to-sky-600',
];

// ── Event card ────────────────────────────────────────────────
function EventCard({ event, index, onDelete, mutating }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const isPast = isEventPast(event.start_date);
  const soldPct =
    event.total_tickets > 0
      ? Math.round(((event.tickets_sold ?? 0) / event.total_tickets) * 100)
      : 0;
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const isLive = event.status === 'published' && !isPast;

  return (
    <>
      <div className="bg-card border border-border rounded-card overflow- hover:shadow-md hover:border-accent/20 transition-all duration-200 flex flex-col">
        {/* Banner */}
        <div
          className={`relative h-42 bg-linear-to-br ${gradient} rounded-t-card overflow-`}
        >
          {event.banner_image && (
            <img
              src={event.banner_image}
              alt={event.title}
              className="w-full h-full object-cover rounded-t-card"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <Badge status={event.status} size="sm" dot />
          </div>

          {/* Live indicator */}
          {isLive && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-success/20 backdrop-blur-sm border border-success/30 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-bold text-success">LIVE</span>
            </div>
          )}

          {/* Event title overlay */}
          <div className="absolute bottom-2.5 left-3 right-10">
            <p className="text-white text-sm font-bold leading-snug line-clamp-2">
              {event.title}
            </p>
          </div>

          {/* Three-dot menu */}
          <div className="absolute bottom-2 right-2">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <MoreHorizontal size={15} strokeWidth={2} />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute bottom-9 right-0 z-20 w-44 bg-card border border-border rounded-card shadow-lg py-1 overflow-">
                  <Link
                    to={`/events/${event.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-secondary hover:bg-main-bg hover:text-primary transition-colors"
                  >
                    <Eye size={13} className="text-muted" /> View public page
                  </Link>
                  <Link
                    to={`/organizer/events/${event.slug}/edit`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-secondary hover:bg-main-bg hover:text-primary transition-colors"
                  >
                    <Pencil size={13} className="text-muted" /> Edit event
                  </Link>
                  <Link
                    to={`/organizer/events/${event.slug}/bookings`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-secondary hover:bg-main-bg hover:text-primary transition-colors"
                  >
                    <Users size={13} className="text-muted" /> View bookings
                  </Link>
                  <Link
                    to={`/organizer/events/${event.slug}/checkin`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-secondary hover:bg-main-bg hover:text-primary transition-colors"
                  >
                    <QrCode size={13} className="text-muted" /> Check-in scanner
                  </Link>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => {
                      setDeleteConfirm(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-error hover:bg-error/5 transition-colors"
                  >
                    <Trash2 size={13} /> Cancel event
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* Date */}
          <p className="text-xs text-muted">
            {event.start_date ? formatShortDate(event.start_date) : '—'}
            {event.location && ` · ${event.location}`}
          </p>

          {/* Ticket progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted">Tickets sold</span>
              <span className="text-xs font-bold text-primary">
                {(event.tickets_sold ?? 0).toLocaleString()}
                <span className="text-muted font-normal">
                  /{(event.total_tickets ?? 0).toLocaleString()}
                </span>
                <span className="text-muted ml-1">({soldPct}%)</span>
              </span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${Math.min(soldPct, 100)}%` }}
              />
            </div>
          </div>

          {/* Revenue */}
          {event.revenue != null && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted">Revenue</span>
              <span className="text-sm font-black text-primary">
                {formatCurrency(event.revenue)}
              </span>
            </div>
          )}

          {/* Quick action buttons */}
          <div className="flex items-center gap-2 mt-auto pt-1">
            <Link
              to={`/organizer/events/${event.slug}/edit`}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-btn border border-border text-xs font-semibold text-secondary hover:text-primary hover:border-accent/40 transition-colors"
            >
              <Pencil size={12} strokeWidth={2.5} /> Edit
            </Link>
            <Link
              to={`/organizer/events/${event.slug}/bookings`}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-btn bg-accent-text text-accent border border-accent-border text-xs font-semibold hover:bg-accent hover:text-white transition-colors duration-150"
            >
              <Users size={12} strokeWidth={2.5} /> Bookings
            </Link>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(event.id);
          setDeleteConfirm(false);
        }}
        loading={mutating}
        title={`Cancel "${event.title}"?`}
        description="This will cancel the event. Attendees who have booked will be notified. This cannot be undone."
        confirmLabel="Yes, cancel event"
        danger
      />
    </>
  );
}

// ── Skeleton card ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-card overflow-hidden animate-pulse">
      <div className="h-36 bg-border" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-2.5 bg-border rounded w-32" />
        <div className="h-2 bg-border rounded-full" />
        <div className="flex gap-2 mt-2">
          <div className="flex-1 h-9 bg-border rounded-btn" />
          <div className="flex-1 h-9 bg-border rounded-btn" />
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
function EmptyState({ filtered }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div className="w-16 h-16 rounded-card bg-accent-text border border-accent-border flex items-center justify-center">
        <CalendarDays size={28} strokeWidth={1.5} className="text-accent" />
      </div>
      <div>
        <p className="font-bold text-primary text-lg">
          {filtered ? 'No events match this filter' : 'No events yet'}
        </p>
        <p className="text-sm text-secondary mt-1 max-w-xs">
          {filtered
            ? 'Try selecting a different status.'
            : 'Create your first event and start selling tickets.'}
        </p>
      </div>
      {!filtered && (
        <Link
          to="/organizer/create/event"
          className="flex items-center gap-2 h-11 px-5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-btn transition-colors"
        >
          <PlusCircle size={15} strokeWidth={2.5} /> Create Event
        </Link>
      )}
    </div>
  );
}

export default function ManageEventsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const {
    myEvents,
    myEventsLoading,
    fetchMyEvents,
    deleteEvent,
    loading,
  } = useOrganizerEvents();

  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);

  // Client-side filter (all events loaded at once for organizer)
  const filtered = myEvents.filter((e) => {
    const matchSearch =
      !search ||
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col min-h-screen bg-main-bg">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
              My Events
            </h1>
            <p className="text-sm text-secondary mt-1">
              {myEventsLoading
                ? 'Loading…'
                : `${myEvents.length} event${myEvents.length !== 1 ? 's' : ''} total`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchMyEvents}
              disabled={myEventsLoading}
              className="flex items-center gap-1.5 h-10 px-3 border border-border rounded-btn text-sm font-medium text-secondary hover:text-primary hover:border-accent/40 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={myEventsLoading ? 'animate-spin' : ''}
              />
            </button>
            <Link
              to="/organizer/create/event"
              className="flex items-center gap-2 h-10 px-4 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-btn transition-colors"
            >
              <PlusCircle size={15} strokeWidth={2.5} /> New Event
            </Link>
          </div>
        </div>

        {/* ── Search + status filter ────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events…"
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

          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`h-10 px-3 rounded-btn text-xs font-semibold border transition-colors ${
                  statusFilter === f.value
                    ? 'bg-accent text-white border-accent'
                    : 'bg-card text-secondary border-border hover:text-primary hover:border-accent/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Event grid ───────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {myEventsLoading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filtered.length > 0 ? (
            filtered.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                index={i}
                onDelete={deleteEvent}
                mutating={loading}
              />
            ))
          ) : (
            <EmptyState filtered={Boolean(search || statusFilter)} />
          )}
        </div>
      </main>
      <Footer variant="minimal"/>
    </div>
  );
}
