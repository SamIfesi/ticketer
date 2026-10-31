import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Ticket, CreditCard, CheckCircle2 } from 'lucide-react';
import { useBookings } from '../../hooks/useBookings';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatShortDate, formatTime } from '../../utils/formatDate';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import Badge from '../../components/ui/Badge';
import DownloadTicketButton from '../../components/tickets/DownloadTicketButton';
import { useState } from 'react';

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <Icon size={14} className="text-muted shrink-0" strokeWidth={1.75} />
      <span className="text-xs text-muted flex-1">{label}</span>
      <span className="text-sm font-semibold text-primary text-right">{value ?? '—'}</span>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { booking, bookingLoading, fetchBooking } = useBookings();

  useEffect(() => {
    if (id) fetchBooking(id);
  }, [id, fetchBooking]);

  const event = booking?.event ?? {};
  const tickets = booking?.tickets ?? [];
  const isPaid = booking?.payment_status === 'paid';
  const ticketsId = tickets[0]?.ticket_number
  const bookingId = booking?.booking_number;

  return (
    <div className="flex flex-col min-h-screen bg-main-bg">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-2 text-xs text-secondary mb-6">
          <Link
            to="/my-bookings"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={13} strokeWidth={2.5} /> My Bookings
          </Link>
          <span className="text-muted">/</span>
          <span className="text-primary font-medium">
            Booking ID: {bookingId}
          </span>
        </div>

        {bookingLoading ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-40 bg-border rounded-card" />
            <div className="h-32 bg-border rounded-card" />
          </div>
        ) : !booking ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <p className="font-bold text-primary text-lg">Booking not found</p>
            <p className="text-sm text-secondary">
              It may have been removed or doesn't belong to your account.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Summary card */}
            <div className="border border-border rounded-card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h1 className="text-lg font-black text-primary leading-snug">
                    {booking.event_title ?? event.title ?? 'Event booking'}
                  </h1>
                  <p className="text-xs text-muted mt-1">
                    Booked {formatShortDate(booking.created_at)}
                  </p>
                </div>
                <Badge status={booking.payment_status} />
              </div>

              <Row
                icon={Calendar}
                label="Date"
                value={
                  (event.start_date ?? booking.event_start_date)
                    ? `${formatShortDate(event.start_date ?? booking.event_start_date)} · ${formatTime(event.start_date ?? booking.event_start_date)}`
                    : '—'
                }
              />
              <Row
                icon={MapPin}
                label="Location"
                value={event.location ?? booking.event_location}
              />
              <Row
                icon={Ticket}
                label="Ticket type"
                value={booking.ticket_type}
              />
              <Row
                icon={Ticket}
                label="Quantity"
                value={`${booking.quantity ?? 1} ticket${(booking.quantity ?? 1) !== 1 ? 's' : ''}`}
              />
              <Row
                icon={CreditCard}
                label="Total paid"
                value={formatCurrency(booking.total_amount ?? 0)}
              />
              {booking.paystack_reference && (
                <Row
                  icon={CheckCircle2}
                  label="Reference"
                  value={booking.paystack_reference}
                />
              )}
            </div>

            {/* Tickets */}
            {isPaid && (
              <div className="border border-border rounded-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-primary">
                    {tickets.length} Ticket{tickets.length !== 1 ? 's' : ''}
                  </h2>
                  <DownloadTicketButton
                    ticketId={tickets?.ticket_number}
                    variant="link"
                    size="sm"
                  />
                </div>

                <div className="flex flex-col divide-y divide-border">
                  {tickets.map((t) => (
                    <Link
                      key={t.id}
                      to={`/ticket/${t.id}`}
                      className="flex items-center justify-between py-3 hover:bg-main-bg transition-colors rounded-btn px-2 -mx-2"
                    >
                      <span className="text-sm font-semibold text-primary">
                        Ticket ID: {ticketsId}
                      </span>
                      <Badge status={t.is_used ? 'used' : 'valid'} size="sm" />
                    </Link>
                  ))}
                  {tickets.length === 0 && (
                    <p className="text-sm text-muted py-3">
                      Tickets are still being issued.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer variant="minimal" />
    </div>
  );
}