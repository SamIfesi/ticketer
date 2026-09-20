import {
  Check,
  Tag,
  ChevronDown,
  MapPin,
  Image,
  Calendar,
  Trash2,
  Ticket,
  XCircle,
  Plus,
  Info,
  Phone,
  Mail,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import Input from '../../components/ui/Input';
import PayoutPlanSelector from './PayoutPlanSelector';
import ImageUpload from '../../components/ui/ImageUpload';
import {
  GRADIENTS,
  STEPS,
  EMPTY_TICKET,
  DEFAULT_FORM,
  OPTIONS,
} from '../../config/constants';

// ── Step indicator ────────────────────────────────────────────
export function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  done
                    ? 'bg-accent border-accent text-white'
                    : active
                      ? 'bg-accent-text border-accent text-accent'
                      : 'bg-card border-border text-muted'
                }`}
              >
                {done ? (
                  <Check size={16} strokeWidth={2.5} />
                ) : (
                  <Icon size={16} strokeWidth={active ? 2.5 : 1.75} />
                )}
              </div>
              <span
                className={`text-[11px] font-semibold whitespace-nowrap transition-colors duration-300 ${
                  active ? 'text-accent' : done ? 'text-primary' : 'text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-px mx-1 mb-5 transition-all duration-500 ${
                  current > step.id ? 'bg-accent' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Basic Information ─────────────────────────────────
export function StepBasicInfo({ form, setForm, categories, fieldErrors }) {
  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-primary">Basic Information</h2>
        <p className="text-sm text-muted mt-0.5">
          Tell attendees what your event is about.
        </p>
      </div>

      <Input
        label="Event title"
        placeholder="e.g. Lagos Tech Summit 2026"
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
        error={fieldErrors?.title}
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
          className="w-full px-4 py-3 bg-main-bg text-primary border border-border rounded-card text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-none leading-relaxed"
        />
        {fieldErrors?.description && (
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
            className="w-full h-12 pl-10 pr-9 bg-main-bg text-primary border border-border rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent appearance-none transition-colors"
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

      <Input
        label="Location / Venue"
        placeholder="e.g. Eko Hotel, Lagos"
        value={form.location}
        onChange={(e) => set('location', e.target.value)}
        error={fieldErrors?.location}
        icon={<MapPin size={15} />}
      />

      {/* ── Contact Information ──────────────────────────────*/}
      <div className="pt-2 mt-5 border-t border-border">
        <div className="flex items-start gap-2 mb-4">
          <div>
            <p className="text-lg font-semibold text-primary">
              Contact Information
            </p>
            <p className="text-xs text-muted mt-0.5">
              Shown to attendees so they can reach you with questions about this
              event. Leave blank to keep it private.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Enquiry phone number"
            type="tel"
            placeholder="e.g. 08012345678"
            value={form.contact_phone ?? ''}
            onChange={(e) => set('contact_phone', e.target.value)}
            error={fieldErrors?.contact_phone}
            icon={<Phone size={15} />}
          />
          <Input
            label="Enquiry email"
            type="email"
            placeholder="e.g. events@yourbrand.com"
            value={form.contact_email ?? ''}
            onChange={(e) => set('contact_email', e.target.value)}
            error={fieldErrors?.contact_email}
            icon={<Mail size={15} />}
          />
        </div>
      </div>
    </div>
  );
}

// ── Ticket type row ───────────────────────────────────────────
export function DateInfo({ form, setForm, fieldErrors }) {
  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }
  return (
    <>
      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-primary select-none">
            Start date & time
          </label>
          <div className="relative">
            <Calendar
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="datetime-local"
              value={form.start_date}
              onChange={(e) => set('start_date', e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-main-bg text-primary border border-border rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            />
          </div>
          {fieldErrors?.start_date && (
            <p className="text-xs text-error">{fieldErrors.start_date}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-primary select-none">
            End date & time
          </label>
          <div className="relative">
            <Calendar
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="datetime-local"
              value={form.end_date}
              onChange={(e) => set('end_date', e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-main-bg text-primary border border-border rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            />
          </div>
          {fieldErrors?.end_date && (
            <p className="text-xs text-error">{fieldErrors.end_date}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <label className="text-sm font-medium text-primary select-none">
          Ticket scanning
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => set('checkin_mode', 'single')}
            className={`flex-1 h-11 rounded-btn border text-sm font-semibold ${form.checkin_mode !== 'multi_day' ? 'border-accent bg-accent-text text-accent' : 'border-border text-secondary'}`}
          >
            Scan once
          </button>
          <button
            type="button"
            onClick={() => set('checkin_mode', 'multi_day')}
            className={`flex-1 h-11 rounded-btn border text-sm font-semibold ${form.checkin_mode === 'multi_day' ? 'border-accent bg-accent-text text-accent' : 'border-border text-secondary'}`}
          >
            Scan on multiple days
          </button>
        </div>
        {form.checkin_mode === 'multi_day' && (
          <Input
            label="Number of check-in days"
            type="number"
            min="1"
            value={form.checkin_days}
            onChange={(e) => set('checkin_days', e.target.value)}
            helper="e.g. a 3-day festival — attendees can scan once per day, up to this many days."
          />
        )}
      </div>

      {/* Banner */}
      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-sm font-medium text-primary select-none">
          Banner image{' '}
          <span className="text-muted font-normal">(optional)</span>
        </label>
        <ImageUpload
          type="banner"
          currentUrl={form.banner_image}
          onUploaded={({ publicId, secureUrl }) => {
            set('banner_image', secureUrl);
            set('banner_public_id', publicId);
          }}
        />
      </div>
    </>
  );
}

// ── Ticket type row ───────────────────────────────────────────
export function TicketTypeRow({ tt, index, onChange, onRemove }) {
  return (
    <div className="relative md:bg-main-bg border border-border rounded-card p-4 flex flex-col gap-3">
      {index > 0 && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="absolute top-3 right-3 text-muted hover:text-error transition-colors"
          aria-label="Remove ticket type"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Ticket name"
          placeholder="e.g. Regular, VIP, Early Bird"
          value={tt.name}
          onChange={(e) => onChange(index, 'name', e.target.value)}
          icon={<Ticket size={15} />}
        />
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
              className="w-full h-12 pl-8 pr-4 bg-card text-primary border border-border rounded-card text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            />
          </div>
          {tt.price > 0 && (
            <p className="text-xs text-muted">{formatCurrency(tt.price)}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            className="w-full h-12 px-4 bg-card text-primary border border-border rounded-card text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-primary select-none">
            Sales end <span className="text-muted font-normal">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={tt.sales_end_at ?? ''}
            onChange={(e) => onChange(index, 'sales_end_at', e.target.value)}
            className="w-full h-12 px-4 bg-card text-primary border border-border rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-primary select-none">
          Description <span className="text-muted font-normal">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="Brief description of what's included…"
          value={tt.description ?? ''}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          className="w-full h-12 px-4 bg-card text-primary border border-border rounded-card text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
        />
      </div>
    </div>
  );
}

// ── Step 2: Tickets ───────────────────────────────────────────
export function StepTickets({ form, setForm }) {
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

  const totalCapacity = form.ticket_types.reduce(
    (acc, tt) => acc + parseInt(tt.quantity || 0, 10),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Ticket Types</h2>
          <p className="text-sm text-muted mt-0.5">
            Define how attendees can purchase tickets.
          </p>
        </div>
        <button
          type="button"
          onClick={addTicket}
          className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors shrink-0 h-9 px-3 border border-accent-border rounded-btn bg-accent-text"
        >
          <Plus size={13} strokeWidth={2.5} /> Add ticket type
        </button>
      </div>

      <div className="flex items-start gap-2 p-3 bg-accent-text border border-accent-border rounded-btn">
        <Info size={13} className="text-accent shrink-0 mt-0.5" />
        <p className="text-xs text-accent/80 leading-relaxed">
          Total capacity is the sum of all ticket quantities. Set price to 0 for
          free tickets.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {form.ticket_types.map((tt, i) => (
          <TicketTypeRow
            key={i}
            tt={tt}
            index={i}
            onChange={updateTicket}
            onRemove={removeTicket}
          />
        ))}
      </div>

      {/* Capacity summary */}
      {totalCapacity > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-card">
          <span className="text-sm text-muted">Total capacity</span>
          <span className="text-sm font-bold text-primary">
            {totalCapacity.toLocaleString()} tickets
          </span>
        </div>
      )}
    </div>
  );
}

// ── Step 3: Publish ───────────────────────────────────────────
export function StepPublish({ form, setForm, error }) {
  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Summary values
  const totalCapacity = form.ticket_types.reduce(
    (acc, tt) => acc + parseInt(tt.quantity || 0, 10),
    0
  );
  const hasFreeTickets = form.ticket_types.some(
    (tt) => parseInt(tt.price || 0, 10) === 0
  );
  const minPrice = Math.min(
    ...form.ticket_types.map((tt) => parseFloat(tt.price || 0))
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-primary">Review & Publish</h2>
        <p className="text-sm text-muted mt-0.5">
          Check your event details and choose when to go live.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3.5 bg-error/10 border border-error/20 rounded-card">
          <XCircle size={15} className="text-error shrink-0 mt-0.5" />
          <p className="text-xs text-error leading-relaxed">{error}</p>
        </div>
      )}

      {/* Event summary card */}
      <div className="bg-card border border-border rounded-card overflow-hidden">
        {/* Mini banner */}
        <div className="h- bg-linear-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
          {form.banner_image && (
            <img
              src={form.banner_image}
              alt=""
              className="w-full h-full object-cover opacity-80"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-white font-bold text-sm leading-snug line-clamp-2">
              {form.title || 'Untitled Event'}
            </p>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-2.5">
          {[
            { label: 'Location', value: form.location || '—' },
            {
              label: 'Start',
              value: form.start_date
                ? new Date(form.start_date).toLocaleString('en-NG', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : '—',
            },
            {
              label: 'End',
              value: form.end_date
                ? new Date(form.end_date).toLocaleString('en-NG', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : '—',
            },
            {
              label: 'Ticket types',
              value: `${form.ticket_types.length} type${form.ticket_types.length !== 1 ? 's' : ''}`,
            },
            {
              label: 'Capacity',
              value:
                totalCapacity > 0
                  ? `${totalCapacity.toLocaleString()} tickets`
                  : '—',
            },
            {
              label: 'Pricing',
              value:
                hasFreeTickets && minPrice === 0
                  ? 'Free'
                  : `From ${formatCurrency(minPrice)}`,
            },
            {
              label: 'Enquiry contact',
              value:
                form.contact_phone || form.contact_email
                  ? [form.contact_phone, form.contact_email]
                      .filter(Boolean)
                      .join(' · ')
                  : 'Not provided',
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
            >
              <span className="text-xs text-muted">{label}</span>
              <span className="text-xs font-semibold text-primary text-right max-w-[55%] truncate">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status selection */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-primary">
          When do you want to go live?
        </p>

        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = form.status === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => set('status', option.value)}
              className={`w-full text-left flex items-start gap-2 p-4 rounded-card border-2 transition-all duration-150 ${
                isActive
                  ? 'border-accent bg-accent-text'
                  : 'border-border bg-card hover:border-accent/40'
              }`}
            >
              <span className="text-xl shrink-0 mt-0.5">
                <Icon
                  size={14}
                  strokeWidth={2.5}
                  className={isActive ? 'text-primary' : 'text-secondary'}
                />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-secondary'}`}
                  >
                    {option.label}
                  </p>
                  {isActive && (
                    <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p
                  className={`text-xs mt-0.5 leading-snug ${isActive ? 'text-secondary' : 'text-muted'}`}
                >
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Payout plan */}
      <PayoutPlanSelector
        value={form.payout_plan}
        ack={form.early_payout_ack}
        onChange={(v) => set('payout_plan', v)}
        onAckChange={(v) => set('early_payout_ack', v)}
      />
    </div>
  );
}
