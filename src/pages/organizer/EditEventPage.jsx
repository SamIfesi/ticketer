import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, AlertTriangle } from 'lucide-react';
import { useOrganizerEvents } from '../../hooks/useOrganizerEvents';
import { useOrganizerPayment } from '../../hooks/useOrganizerPayment';
import CategoryService from '../../services/category.service';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import EventForm from '../../components/events/EventForm';

function toInputDate(str) {
  if (!str) return '';
  return str.replace(' ', 'T').slice(0, 16);
}

export default function EditEventPage() {
  const { slug } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const {
    event,
    eventLoading,
    fetchMyEvent,
    updateEvent,
    loading,
    error,
    fieldErrors,
  } = useOrganizerEvents();

  const { hasPaymentDetails, paymentDetailsLoading, fetchPaymentDetails } =
    useOrganizerPayment();

  useEffect(() => {
    fetchPaymentDetails();
  }, [fetchPaymentDetails]);

  useEffect(() => {
    if (!slug) return;
    fetchMyEvent(slug);
    CategoryService.getCategories()
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => {});
  }, [slug, fetchMyEvent]);

  const initialValues = useMemo(() => {
    if (!event) return undefined;
    return {
      title: event.title ?? '',
      description: event.description ?? '',
      category_id: event.category_id ? String(event.category_id) : '',
      location: event.location ?? '',
      banner_image: event.banner_image ?? '',
      banner_public_id: event.banner_public_id ?? '',
      contact_email: event.contact_email ?? '',
      contact_phone: event.contact_phone ?? '',
      start_date: toInputDate(event.start_date),
      end_date: toInputDate(event.end_date),
      total_tickets: event.total_tickets ?? '',
      status: event.status ?? 'draft',
      checkin_mode: event.checkin_mode ?? 'single',
      checkin_days: event.checkin_days ?? 1,
      ticket_types: (event.ticket_types ?? []).map((tt) => ({
        id: tt.id,
        name: tt.name ?? '',
        price: tt.price ?? 0,
        quantity: tt.quantity ?? '',
        description: tt.description ?? '',
        sales_end_at: toInputDate(tt.sales_end_at),
      })),
    };
  }, [event]);

  async function handleSubmit(formData) {
    await updateEvent(event.id, formData, {
      onSuccess: () => {
        fetchMyEvent(slug);
        navigate(`/organizer/events/${event.slug}`);
      },
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-main-bg">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-2 text-xs text-secondary mb-6">
          <Link
            to="/organizer/events"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={13} strokeWidth={2.5} /> My Events
          </Link>
          <span className="text-muted">/</span>
          <span className="text-primary font-medium truncate max-w-50">
            {eventLoading ? 'Loading…' : (event?.title ?? 'Edit Event')}
          </span>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Pencil size={14} className="text-accent" />
            <span className="text-xs font-bold text-accent uppercase tracking-widest">
              Edit Event
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
            {eventLoading ? (
              <span className="inline-block h-8 bg-border rounded w-64 animate-pulse" />
            ) : (
              (event?.title ?? 'Edit Event')
            )}
          </h1>
          <p className="text-sm text-secondary mt-1">
            Update your event details. Changes are saved immediately.
          </p>
        </div>

        <div className="bg-card border border-border rounded-card p-6 sm:p-8">
          {!paymentDetailsLoading && !hasPaymentDetails && (
            <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-card mb-6">
              <AlertTriangle
                size={16}
                className="text-warning shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-semibold text-primary">
                  Bank details required to publish
                </p>
                <p className="text-xs text-secondary mt-0.5">
                  You can save as draft, but you must add your bank details
                  before going live.{' '}
                  <Link
                    to="/organizer/payment-details"
                    className="text-accent font-semibold hover:underline"
                  >
                    Add bank details →
                  </Link>
                </p>
              </div>
            </div>
          )}
          {eventLoading ? (
            <div className="flex flex-col gap-5 animate-pulse">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-3 bg-border rounded w-24" />
                  <div className="h-12 bg-border rounded-card" />
                </div>
              ))}
            </div>
          ) : (
            <EventForm
              initialValues={initialValues}
              categories={categories}
              loading={loading}
              error={error}
              fieldErrors={fieldErrors}
              onSubmit={handleSubmit}
              submitLabel="Save Changes"
            />
          )}
        </div>
      </main>
      <Footer variant="minimal" />
    </div>
  );
}
