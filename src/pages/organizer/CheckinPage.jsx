import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Users,
  QrCode,
  Search,
  X,
  ListChecks,
  Camera,
  CalendarDays,
} from 'lucide-react';
import { useOrganizerEvents } from '../../hooks/useOrganizerEvents';
import { formatShortDate, formatTime } from '../../utils/formatDate';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import CheckinScanner from '../../components/tickets/CheckinScanner';

const TABS = { SCANNER: 'scanner', LIST: 'list' };

function StatPill({ label, value, color }) {
  return (
    <div
      className="flex flex-col items-center justify-center px-5 py-3 rounded-card border"
      style={{ borderColor: `${color}30`, background: `${color}0d` }}
    >
      <p className="text-2xl font-black" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  );
}

//  Day tabs — only rendered for multi-day events ─
function DayTabs({ totalDays, day, onSelect }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <div className="flex items-center gap-1.5 text-xs text-muted mr-1">
        <CalendarDays size={13} />
        Day:
      </div>
      {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
        <button
          key={d}
          onClick={() => onSelect(d)}
          className={`h-9 px-3 rounded-btn text-xs font-semibold transition-colors border ${
            day === d
              ? 'bg-accent text-white border-accent'
              : 'bg-card text-secondary border-border hover:text-primary hover:border-accent/40'
          }`}
        >
          Day {d}/{totalDays}
        </button>
      ))}
    </div>
  );
}

function AttendeeRow({ ticket, isMultiDay }) {
  const isCheckedIn = ticket.is_used === 1 || ticket.is_used === true;
  const ticketId = ticket?.ticket_number;

  return (
    <tr className="border-t border-border hover:bg-main-bg transition-colors duration-150">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isCheckedIn ? 'bg-success/10' : 'bg-border'
            }`}
          >
            <span
              className={`text-xs font-bold ${isCheckedIn ? 'text-success' : 'text-muted'}`}
            >
              {(ticket.attendee_name ?? 'A')?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary truncate max-w-40">
              {ticket.attendee_name ?? '—'}
            </p>
            <p className="text-xs text-muted truncate max-w-45">
              {ticket.attendee_email ?? '—'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs font-semibold text-primary">
          {ticket.ticket_type ?? '—'}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs font-semibold text-primary">{ticketId}</span>
      </td>

      {/*  NEW: day-count column, multi-day events only  */}
      {isMultiDay && (
        <td className="px-4 py-3.5">
          <span className="text-xs font-semibold text-primary">
            {ticket.days_used ?? 0}/{ticket.total_days ?? 1}
          </span>
        </td>
      )}

      <td className="px-4 py-3.5">
        {isCheckedIn ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">
            <CheckCircle2 size={11} strokeWidth={2.5} />
            {isMultiDay ? 'Checked in today' : 'Checked in'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-border text-muted">
            <Clock size={11} strokeWidth={2} /> Pending
          </span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs text-muted">
          {isCheckedIn && (ticket.used_at || ticket.last_checked_in_at)
            ? `${formatShortDate(ticket.used_at ?? ticket.last_checked_in_at)} ${formatTime(ticket.used_at ?? ticket.last_checked_in_at)}`
            : '—'}
        </span>
      </td>
    </tr>
  );
}

function SkeletonRow({ isMultiDay }) {
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
      {[72, 80, isMultiDay ? 60 : null, 80, 80]
        .filter((w) => w !== null)
        .map((w, i) => (
          <td key={i} className="px-4 py-3.5">
            <div className="h-4 bg-border rounded" style={{ width: w }} />
          </td>
        ))}
    </tr>
  );
}

export default function CheckinPage() {
  const { slug } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS.SCANNER);
  const [search, setSearch] = useState('');

  // NEW: which check-in day is currently active/being viewed.
  // Declared here at the page level since both the scanner (to know
  // which day to submit) and the attendee list (to know which day's
  // status to display) need to read and update it. 
  const [day, setDay] = useState(1);

  const {
    event,
    eventLoading,
    fetchMyEvent,
    checkinData,
    checkinLoading,
    fetchCheckinList,
  } = useOrganizerEvents();

  const isMultiDay = event?.checkin_mode === 'multi_day';
  const totalDays = event?.checkin_days ?? 1;

  useEffect(() => {
    if (!slug) return;

    fetchMyEvent(slug).then((resolved) => {
      if (resolved?.id) fetchCheckinList(resolved.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Re-fetch the list whenever the viewed day changes (multi-day only —
  // single-scan events never pass a day param, so this is a no-op for them).
  useEffect(() => {
    if (!event?.id || !isMultiDay) return;
    fetchCheckinList(event.id, day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, event?.id, isMultiDay]);

  // Called by CheckinScanner after a scan. scannedDay is whatever day
  // was selected in the scanner's own day picker at the moment of the
  // scan — pass it straight through so the refetch matches what was
  // just scanned, then sync the page's day state to match too so the
  // attendee-list tab lands on the same day if the organizer switches over.
  function handleCheckin(result, scannedDay) {
    if (!event?.id) return;

    if (isMultiDay && scannedDay) {
      setDay(scannedDay);
      fetchCheckinList(event.id, scannedDay);
    } else {
      fetchCheckinList(event.id);
    }
  }

  const tickets = checkinData?.tickets ?? [];
  const summary = checkinData?.summary ?? {};
  const total = summary.total ?? 0;
  const checkedIn = summary.checked_in ?? 0;
  const remaining = summary.remaining ?? 0;

  const tableHeaders = [
    'Attendee',
    'Ticket Type',
    'Ticket ID',
    ...(isMultiDay ? ['Days'] : []),
    'Status',
    'Checked In At',
  ];

  const filtered = tickets.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const ticketNumber = String(t.id ?? '').padStart(6, '0');
    return (
      (t.attendee_name ?? '').toLowerCase().includes(q) ||
      (t.attendee_email ?? '').toLowerCase().includes(q) ||
      (t.ticket_type ?? '').toLowerCase().includes(q) ||
      ticketNumber.includes(q)
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-main-bg">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-2 text-xs text-secondary mb-6">
          <Link
            to="/organizer/events"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={13} strokeWidth={2.5} /> My Events
          </Link>
          <span className="text-muted">/</span>
          <span className="text-primary font-medium truncate max-w-50">
            {eventLoading ? 'Loading…' : (event?.title ?? 'Check-in')}
          </span>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <QrCode size={14} className="text-accent" />
            <span className="text-xs font-bold text-accent uppercase tracking-widest">
              Gate Check-in
            </span>
            {isMultiDay && !eventLoading && (
              <span className="text-xs font-bold text-muted bg-border px-2 py-0.5 rounded-full">
                {totalDays}-day event
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
            {eventLoading ? (
              <span className="inline-block h-8 w-64 bg-border rounded animate-pulse" />
            ) : (
              (event?.title ?? 'Check-in')
            )}
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatPill label="Total" value={total} color="#2563eb" />
          <StatPill
            label={isMultiDay ? `Checked in (Day ${day})` : 'Checked in'}
            value={checkedIn}
            color="#22c55e"
          />
          <StatPill label="Remaining" value={remaining} color="#f59e0b" />
        </div>

        {total > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted">
                {isMultiDay
                  ? `Day ${day}/${totalDays} progress`
                  : 'Check-in progress'}
              </span>
              <span className="text-xs font-bold text-primary">
                {Math.round((checkedIn / total) * 100)}%
              </span>
            </div>
            <div className="h-3 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min((checkedIn / total) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 p-1 bg-main-bg border border-border rounded-card mb-6 w-fit">
          <button
            onClick={() => setActiveTab(TABS.SCANNER)}
            className={`flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-semibold transition-colors duration-150 ${
              activeTab === TABS.SCANNER
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted hover:text-primary'
            }`}
          >
            <Camera size={15} strokeWidth={2} /> Scanner
          </button>
          <button
            onClick={() => setActiveTab(TABS.LIST)}
            className={`flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-semibold transition-colors duration-150 ${
              activeTab === TABS.LIST
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted hover:text-primary'
            }`}
          >
            <ListChecks size={15} strokeWidth={2} /> Attendee List
            {total > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-accent text-white text-[10px] font-bold rounded-full">
                {total}
              </span>
            )}
          </button>
        </div>

        {activeTab === TABS.SCANNER && (
          <div className="p-6 md:bg-card md:border md:border-border md:rounded-card">
            <p className="text-sm text-secondary mb-6 text-center">
              Point the camera at an attendee's ticket QR code to check them in.
            </p>
            <CheckinScanner
              eventId={event?.id}
              event={event}
              onCheckin={handleCheckin}
            />
          </div>
        )}

        {activeTab === TABS.LIST && (
          <div>
            {/* Day tabs — multi-day events only. Reuses the same `day`
                state as the scanner so switching tabs never desyncs
                which day's data is being shown. */}
            {isMultiDay && (
              <DayTabs totalDays={totalDays} day={day} onSelect={setDay} />
            )}

            <div className="relative mb-4 max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search attendees…"
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
                      {tableHeaders.map((h) => (
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
                    {checkinLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonRow key={i} isMultiDay={isMultiDay} />
                      ))
                    ) : filtered.length > 0 ? (
                      filtered.map((ticket) => (
                        <AttendeeRow
                          key={ticket.id}
                          ticket={ticket}
                          isMultiDay={isMultiDay}
                        />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={tableHeaders.length}
                          className="px-4 py-16 text-center"
                        >
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
                                ? 'No attendees match your search'
                                : 'No attendees yet'}
                            </p>
                            <p className="text-xs text-muted">
                              {search
                                ? 'Try a different name or email.'
                                : 'Attendees will appear here once tickets are purchased.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer variant="minimal" />
    </div>
  );
}
