// Shared form used by both CreateEventPage and EditEventPage.
// Handles: title, description, category, location, banner_image URL,
//          contact_phone, contact_email, start_date, end_date,
//          total_tickets, status, ticket_types[]
//
// Props:
//   initialValues — pre-filled data (for edit mode)
//   categories    — array from CategoryService
//   loading       — disables submit while mutating
//   error         — top-level error string
//   fieldErrors   — { field: message } from backend validation
//   onSubmit      — (formData) => void
//   submitLabel   — button label e.g. "Create Event" | "Save Changes"

import { useState, useEffect } from 'react';
import PayoutPlanSelector from './PayoutPlanSelector';
import {
  Plus,
  Trash2,
  Image,
  MapPin,
  Calendar,
  Tag,
  FileText,
  Ticket,
  ChevronDown,
  XCircle,
  Info,
  Phone,
  Mail,
} from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import ImageUpload from '../ui/ImageUpload';

// ── Ticket type row ───────────────────────────────────────────
function TicketTypeRow({ tt, index, onChange, onRemove, disabled }) {
  return (
    <div className="relative bg-main-bg border border-border rounded-card p-4 flex flex-col gap-3">
      {/* Remove button */}
      {index > 0 && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={disabled}
          className="absolute top-3 right-3 text-muted hover:text-error transition-colors disabled:opacity-50"
          aria-label="Remove ticket type"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Name */}
        <Input
          label="Ticket name"
          placeholder="e.g. Regular, VIP, Early Bird"
          value={tt.name}
          onChange={(e) => onChange(index, 'name', e.target.value)}
          disabled={disabled}
          icon={<Ticket size={15} />}
        />

        {/* Price */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-primary select-none">
            Price (₦)
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-muted text-sm font-semibold pointer-events-none">
              ₦
            </span>
            <input
              type="number"
              min="0"
              step="100"
              placeholder="0 for free"
              value={tt.price}
              onChange={(e) => onChange(index, 'price', e.target.value)}
              disabled={disabled}
              className="w-full h-12 pl-8 pr-4 bg-main-bg text-primary border border-border rounded-card text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors disabled:opacity-50"
            />
          </div>
          {tt.price > 0 && (
            <p className="text-xs text-muted">{formatCurrency(tt.price)}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Quantity */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-primary select-none">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 100"
            value={tt.quantity}
            onChange={(e) => onChange(index, 'quantity', e.target.value)}
            disabled={disabled}
            className="w-full h-12 px-4 bg-main-bg text-primary border border-border rounded-card text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors disabled:opacity-50"
          />
        </div>

        {/* Sales end */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-primary select-none">
            Sales end <span className="text-muted font-normal">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={tt.sales_end_at ?? ''}
            onChange={(e) => onChange(index, 'sales_end_at', e.target.value)}
            disabled={disabled}
            className="w-full h-12 px-4 bg-main-bg text-primary border border-border rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-primary select-none">
          Description <span className="text-muted font-normal">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="Brief description of what's included…"
          value={tt.description ?? ''}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          disabled={disabled}
          className="w-full h-12 px-4 bg-main-bg text-primary border border-border rounded-card text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors disabled:opacity-50"
        />
      </div>
    </div>
  );
}

// ── Defaults ──────────────────────────────────────────────────
const EMPTY_TICKET = { 
  id: null,
  name: '', 
  price: 0, 
  quantity: '', 
  description: '', 
  sales_end_at: '' 
};

const DEFAULT_VALUES = {
  title: '',
  description: '',
  category_id: '',
  location: '',
  banner_image: '',
  banner_public_id: '',
  contact_email: '',
  contact_phone: '',
  start_date: '',
  end_date: '',
  total_tickets: '',
  status: 'draft',
  ticket_types: [{ ...EMPTY_TICKET }],
  checkin_mode: 'single',
  checkin_days: 1,
  payout_plan: 'standard',
  early_payout_ack: false,
};

// ── Main component ────────────────────────────────────────────
export default function EventForm({
  initialValues,
  categories = [],
  loading = false,
  error,
  fieldErrors = {},
  onSubmit,
  submitLabel = 'Create Event',
}) {
  const [form, setForm] = useState({ ...DEFAULT_VALUES, ...initialValues });

  // Sync if initialValues change (edit mode data arriving async)
  useEffect(() => {
    if (initialValues) {
      setForm((prev) => ({ ...prev, ...initialValues }));
    }
  }, [initialValues]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Ticket type helpers
  function updateTicket(index, field, value) {
    setForm((prev) => {
      const updated = prev.ticket_types.map((tt, i) =>
        i === index ? { ...tt, [field]: value } : tt
      );
      return { ...prev, ticket_types: updated };
    });
  }

  function addTicket() {
    setForm((prev) => ({
      ...prev,
      ticket_types: [...prev.ticket_types, { ...EMPTY_TICKET }],
    }));
  }

  function removeTicket(index) {
    setForm((prev) => ({
      ...prev,
      ticket_types: prev.ticket_types.filter((_, i) => i !== index),
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Derive total_tickets from sum of ticket type quantities if not set manually
    const totalFromTypes = form.ticket_types.reduce(
      (acc, tt) => acc + parseInt(tt.quantity || 0, 10),
      0
    );
    if (form.payout_plan === 'early' && !form.early_payout_ack) return;
    // early_payout_ack is a UI-only consent flag — never sent to the API
    // eslint-disable-next-line no-unused-vars
    const { early_payout_ack, ...payload } = form;
    onSubmit({
      ...payload,
      total_tickets: form.total_tickets || totalFromTypes,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {/* Top-level error */}
      {error && (
        <div className="flex items-start gap-2 p-3.5 bg-error/10 border border-error/20 rounded-card">
          <XCircle size={15} className="text-error shrink-0 mt-0.5" />
          <p className="text-xs text-error leading-relaxed">{error}</p>
        </div>
      )}

      {/* ── Section: Basic info ────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <FileText size={15} className="text-accent" />
          <h3 className="text-sm font-bold text-primary">Basic Information</h3>
        </div>

        <Input
          label="Event title"
          placeholder="e.g. Lagos Tech Summit 2026"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          error={fieldErrors.title}
          disabled={loading}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-primary select-none">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Tell attendees what this event is about…"
            rows={4}
            disabled={loading}
            className="w-full px-4 py-3 bg-main-bg text-primary border border-border rounded-card text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-none disabled:opacity-50 leading-relaxed"
          />
          {fieldErrors.description && (
            <p className="text-xs text-error">{fieldErrors.description}</p>
          )}
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-primary select-none">
            Category
          </label>
          <div className="relative">
            <Tag
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <select
              value={form.category_id}
              onChange={(e) => set('category_id', e.target.value)}
              disabled={loading}
              className="w-full h-12 pl-10 pr-9 bg-main-bg text-primary border border-border rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent appearance-none disabled:opacity-50 transition-colors"
            >
              <option value="">Select a category…</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
          </div>
        </div>

        {/* Location */}
        <Input
          label="Location / Venue"
          placeholder="e.g. Eko Hotel, Lagos"
          value={form.location}
          onChange={(e) => set('location', e.target.value)}
          error={fieldErrors.location}
          disabled={loading}
          icon={<MapPin size={15} />}
        />

        {/* Banner image URL */}
        <div className="flex flex-col gap-1.5 mt-4">
          <label className="text-sm font-medium text-primary select-none">
            Banner image{' '}
            <span className="text-muted font-normal">(optional)</span>
          </label>
          <ImageUpload
            type="banner"
            currentUrl={form.banner_image}
            disabled={loading}
            onUploaded={({ publicId, secureUrl }) => {
              set('banner_image', secureUrl);
              set('banner_public_id', publicId);
            }}
          />
        </div>
      </section>

      {/* ── Section: Contact information ─────────────────────
          Optional enquiry contact shown to attendees on the event
          detail page — lets people reach the organizer directly. */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Phone size={15} className="text-accent" />
          <h3 className="text-sm font-bold text-primary">
            Contact Information
          </h3>
        </div>

        <p className="text-xs text-muted -mt-2">
          Shown to attendees on the event page so they can reach you with
          questions. Leave blank to keep it private.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Enquiry phone number"
            type="tel"
            placeholder="e.g. 08012345678"
            value={form.contact_phone ?? ''}
            onChange={(e) => set('contact_phone', e.target.value)}
            error={fieldErrors.contact_phone}
            disabled={loading}
            icon={<Phone size={15} />}
          />
          <Input
            label="Enquiry email"
            type="email"
            placeholder="e.g. events@yourbrand.com"
            value={form.contact_email ?? ''}
            onChange={(e) => set('contact_email', e.target.value)}
            error={fieldErrors.contact_email}
            disabled={loading}
            icon={<Mail size={15} />}
          />
        </div>
      </section>

      {/* ── Section: Date & time ────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Calendar size={15} className="text-accent" />
          <h3 className="text-sm font-bold text-primary">Date & Time</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-primary select-none">
              Start date & time
            </label>
            <input
              type="datetime-local"
              value={form.start_date}
              onChange={(e) => set('start_date', e.target.value)}
              disabled={loading}
              className="w-full h-12 px-4 bg-main-bg text-primary border border-border rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors disabled:opacity-50"
            />
            {fieldErrors.start_date && (
              <p className="text-xs text-error">{fieldErrors.start_date}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-primary select-none">
              End date & time
            </label>
            <input
              type="datetime-local"
              value={form.end_date}
              onChange={(e) => set('end_date', e.target.value)}
              disabled={loading}
              className="w-full h-12 px-4 bg-main-bg text-primary border border-border rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors disabled:opacity-50"
            />
            {fieldErrors.end_date && (
              <p className="text-xs text-error">{fieldErrors.end_date}</p>
            )}
          </div>
        </div>

        {/* ── NEW: Check-in settings ── */}
        <div className="flex flex-col gap-3 mt-2">
          <label className="text-sm font-medium text-primary select-none">
            Ticket scanning
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => set('checkin_mode', 'single')}
              disabled={loading}
              className={`flex-1 h-11 rounded-card border text-sm font-semibold transition-colors disabled:opacity-50 ${
                form.checkin_mode !== 'multi_day'
                  ? 'border-accent bg-accent-text text-accent'
                  : 'border-border text-secondary hover:border-accent/40'
              }`}
            >
              Scan once
            </button>
            <button
              type="button"
              onClick={() => set('checkin_mode', 'multi_day')}
              disabled={loading}
              className={`flex-1 h-11 rounded-card border text-sm font-semibold transition-colors disabled:opacity-50 ${
                form.checkin_mode === 'multi_day'
                  ? 'border-accent bg-accent-text text-accent'
                  : 'border-border text-secondary hover:border-accent/40'
              }`}
            >
              Scan on multiple days
            </button>
          </div>
          <p className="text-xs text-muted">
            "Scan once" invalidates the ticket after the first gate scan.
            "Multiple days" lets attendees be scanned once per day for a
            multi-day event.
          </p>

          {form.checkin_mode === 'multi_day' && (
            <Input
              label="Number of check-in days"
              type="number"
              min="1"
              value={form.checkin_days}
              onChange={(e) => set('checkin_days', e.target.value)}
              disabled={loading}
              helper="e.g. a 3-day festival — attendees can be scanned once per day, up to this many days."
            />
          )}
        </div>
      </section>

      {/* ── Section: Ticket types ────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Ticket size={15} className="text-accent" />
            <h3 className="text-sm font-bold text-primary">Ticket Types</h3>
          </div>
          <button
            type="button"
            onClick={addTicket}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
          >
            <Plus size={13} strokeWidth={2.5} /> Add type
          </button>
        </div>

        <div className="flex items-start gap-1.5 p-3 bg-accent-text border border-accent-border rounded-btn">
          <Info size={13} className="text-accent shrink-0 mt-0.5" />
          <p className="text-xs text-accent/80 leading-relaxed">
            Total ticket capacity is the sum of all ticket type quantities. Set
            price to 0 for free tickets.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {form.ticket_types.map((tt, i) => (
            <TicketTypeRow
              key={i}
              tt={tt}
              index={i}
              onChange={updateTicket}
              onRemove={removeTicket}
              disabled={loading}
            />
          ))}
        </div>
      </section>

      {/* ── Section: Publish settings ────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <h3 className="text-sm font-bold text-primary">Publish Settings</h3>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-primary select-none">
            Status
          </label>
          <div className="relative">
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              disabled={loading}
              className="w-full h-12 pl-4 pr-9 bg-main-bg text-primary border border-border rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent appearance-none disabled:opacity-50 transition-colors"
            >
              <option value="draft">Draft — not visible to public</option>
              <option value="published">Published — live and bookable</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
          </div>
          <p className="text-xs text-muted">
            You can always publish later from your events list.
          </p>
        </div>

        <PayoutPlanSelector
          value={form.payout_plan}
          ack={form.early_payout_ack}
          onChange={(v) => set('payout_plan', v)}
          onAckChange={(v) => set('early_payout_ack', v)}
          disabled={loading}
        />
      </section>

      {/* ── Submit ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={form.payout_plan === 'early' && !form.early_payout_ack}
          className="flex-1 sm:flex-none sm:min-w-45"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
