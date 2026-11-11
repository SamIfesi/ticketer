// Reusable event table for Organizer and Admin dashboards.
// Shows title, status, dates, ticket sales, revenue, and actions.
//
// Props:
//   events         — array of event objects
//   loading        — skeleton rows
//   onEdit         — (eventId) => void   (organizer)
//   onDelete       — (eventId) => void   (organizer)
//   onStatusChange — (eventId, status) => void  (admin)
//   showActions    — 'organizer' | 'admin' | false
//   mutating       — disables buttons during mutation

import { Link } from 'react-router-dom';
import { MoreHorizontal, Pencil, Trash2, Eye, Users } from 'lucide-react';
import { useState } from 'react';
import Badge from '../ui/Badge';
import { formatShortDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { EVENT_STATUS, EVENT_TABLE_HEADS } from '../../config/constants';

const STATUS_OPTIONS = Object.values(EVENT_STATUS);

export function SkeletonRow() {
  return (
    <tr className="animate-pulse border-t border-border">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-btn bg-border shrink-0" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 bg-border rounded w-32" />
            <div className="h-2.5 bg-border rounded w-20" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-5 bg-border rounded w-16" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 bg-border rounded w-20" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 bg-border rounded w-16" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 bg-border rounded w-20" />
      </td>
      <td className="px-4 py-3">
        <div className="h-8 bg-border rounded w-8" />
      </td>
    </tr>
  );
}

function EventRow({
  event,
  onEdit,
  onDelete,
  onStatusChange,
  showActions,
  mutating,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ticketsSold = event.tickets_sold ?? 0;
  const totalTickets = event.total_tickets ?? 0;
  const soldPct = totalTickets > 0 ? (ticketsSold / totalTickets) * 100 : 0; 

  return (
    <tr className="border-t border-border hover:bg-main-bg transition-colors duration-150">
      {/* Title + organizer */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Mini banner swatch */}
          <div className="w-10 h-10 rounded-btn flex items-center justify-center shrink-0 bg-accent-text overflow-hidden">
            {event.banner_image ? (
              <img
                src={event.banner_image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-black text-accent">
                {event.title?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <Link
              to={`/organizer/events/${event.slug}`}
              className="text-sm font-semibold text-primary hover:text-accent transition-colors truncate block max-w-45"
            >
              {event.title}
            </Link>
            {event.organizer_name && (
              <p className="text-xs text-muted truncate max-w-40">
                {event.organizer_name}
              </p>
            )}
          </div>
        </div>
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <Badge status={event.status} size="sm" dot />
      </td>
      {/* Tickets sold */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-primary">
            {ticketsSold.toLocaleString()}
            {totalTickets > 0 && (
              <span className="font-normal text-muted">
                /{totalTickets.toLocaleString()}
              </span>
            )}
          </span>
          {totalTickets > 0 && (
            <div className="w-16 h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${Math.min(soldPct, 100)}%` }}
              />
            </div>
          )}
        </div>
      </td>
      {/* Revenue */}
      <td className="px-4 py-3">
        <span className="text-xs font-semibold text-primary">
          {event.total_revenue != null ? formatCurrency(event.total_revenue) : '—'}
        </span>
      </td>
      {/* Date */}
      <td className="px-4 py-3 min-w-30">
        <span className="text-xs text-secondary">
          {event.start_date ? formatShortDate(event.start_date) : '—'}
        </span>
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        {showActions && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              disabled={mutating}
              className="w-8 h-8 flex items-center justify-center rounded-btn text-muted hover:text-primary hover:bg-border transition-colors duration-150 disabled:opacity-50"
            >
              <MoreHorizontal size={16} strokeWidth={2} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-9 z-20 w-44 bg-card border border-border rounded-card shadow-lg py-1 overflow-hidden">
                  {/* View */}
                  <Link
                    to={`/events/${event.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-secondary hover:bg-main-bg hover:text-primary transition-colors duration-150"
                  >
                    <Eye size={13} className="text-muted" /> View public page
                  </Link>

                  {showActions === 'admin' && (
                    <>
                      <div className="border-t border-border my-1" />
                      <p className="px-3 py-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                        Set status
                      </p>
                      {STATUS_OPTIONS.filter((s) => s !== event.status).map(
                        (s) => (
                          <button
                            key={s}
                            onClick={() => {
                              onStatusChange?.(event.id, s);
                              setMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-secondary hover:bg-main-bg hover:text-primary transition-colors capitalize"
                          >
                            {s}
                          </button>
                        )
                      )}
                    </>
                  )}

                  {(showActions === 'organizer' || showActions === 'admin') && (
                    <>
                      <Link
                        to={`/organizer/events/${event.slug}/edit`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-secondary hover:bg-main-bg hover:text-primary transition-colors duration"
                      >
                        <Pencil size={13} className="text-muted" /> Edit event
                      </Link>
                      <Link
                        to={`/organizer/events/${event.slug}/bookings`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-secondary hover:bg-main-bg hover:text-primary transition-colors"
                      >
                        <Users size={13} className="text-muted" /> Bookings
                      </Link>
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={() => {
                          onDelete?.(event.id);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-error hover:bg-error/5 transition-colors"
                      >
                        <Trash2 size={13} /> Cancel event
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

export default function EventTable({
  events = [],
  loading = false,
  onEdit,
  onDelete,
  onStatusChange,
  showActions = 'organizer',
  mutating = false,
  className = '',
}) {
  return (
    <div
      className={`bg-card border border-border rounded-card overflow-hidden min-w-0 ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="bg-main-bg">
              {EVENT_TABLE_HEADS.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
            ) : events.length > 0 ? (
              events.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                  showActions={showActions}
                  mutating={mutating}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-muted"
                >
                  No events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
