import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Send, AlertTriangle } from 'lucide-react';
import { useOrganizerEvents } from '../../hooks/useOrganizerEvents';
import { useOrganizerPayment } from '../../hooks/useOrganizerPayment';
import { useUiStore } from '../../store/uiStore';
import CategoryService from '../../services/category.service';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import {
  GRADIENTS,
  STEPS,
  EMPTY_TICKET,
  DEFAULT_FORM,
} from '../../config/constants';
import { SPLIT_MODE } from '../../config/constants';
import {
  StepIndicator,
  StepBasicInfo,
  DateInfo,
  StepTickets,
  StepPublish,
} from '../../components/events/CreateEventSteps';

// ── Validation per step ───────────────────────────────────────
function validateStep(step, form) {
  const errors = [];
  if (step === 1) {
    if (!form.title.trim()) errors.push('Event title is required.');
    if (!form.location.trim()) errors.push('Location is required.');
    if (
      form.contact_email?.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email.trim())
    ) {
      errors.push('Enter a valid enquiry email address, or leave it blank.');
    }
    if (!form.contact_phone?.trim() || !/^\d{11}$/.test(form.contact_phone)) {
      errors.push(
        'Contact phone is required and must be a valid 10-digit number.'
      );
    }
  }
  if (step === 2) {
    if (!form.start_date) errors.push('Start date is required.');
    if (!form.end_date) errors.push('End date is required.');
  }
  if (step === 3) {
    const hasInvalid = form.ticket_types.some(
      (tt) => !tt.name.trim() || !tt.quantity
    );
    if (hasInvalid) errors.push('Each ticket type needs a name and quantity.');
  }
  return errors;
}

// ── Main Page ─────────────────────────────────────────────────
export default function CreateEventPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const navigate = useNavigate();

  const { hasPaymentDetails, paymentDetailsLoading, fetchPaymentDetails } =
    useOrganizerPayment();
  const { createEvent, loading, error, fieldErrors } = useOrganizerEvents();
  const toastError = useUiStore((state) => state.toastError);

  useEffect(() => {
    fetchPaymentDetails();
  }, [fetchPaymentDetails]);

  useEffect(() => {
    CategoryService.getCategories()
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  function goNext() {
    const errors = validateStep(currentStep, form);
    if (errors.length > 0) {
      errors.map((err) => toastError(err));
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  }

  function goBack() {
    // setStepErrors([]);
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit() {
    const totalFromTypes = form.ticket_types.reduce(
      (acc, tt) => acc + parseInt(tt.quantity || 0, 10),
      0
    );
    // early_payout_ack is a UI-only consent flag — never sent to the API
    // eslint-disable-next-line no-unused-vars
    const { early_payout_ack, ...payload } = form;
    await createEvent(
      { ...payload, total_tickets: totalFromTypes },
      {
        onSuccess: (event) => {
          navigate(`/organizer/events/${event.slug}`);
        },
      }
    );
  }

  const isLastStep = currentStep === STEPS.length;
  const needsEarlyAck =
    !SPLIT_MODE && form.payout_plan === 'early' && !form.early_payout_ack;

  return (
    <div className="flex flex-col min-h-screen bg-main-bg">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-secondary mb-6">
          <Link
            to="/organizer/events"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={13} strokeWidth={2.5} /> My Events
          </Link>
          <span className="text-muted">/</span>
          <span className="text-primary font-medium">Create Event</span>
        </div>

        {/* Page title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
            Create an Event
          </h1>
          <p className="text-sm text-secondary mt-1">
            Follow the steps below to set up and publish your event.
          </p>
        </div>

        {!paymentDetailsLoading && !hasPaymentDetails && (
          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-card mb-6">
            <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-primary">
                Bank details required to publish
              </p>
              <p className="text-xs text-secondary mt-0.5">
                You can save as draft, but you must add your bank details before
                going live.{' '}
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

        {/* Step indicator */}
        <StepIndicator current={currentStep} />

        {/* Step content card */}
        <div className="md:bg-card md:border md:border-border md:rounded-card  md:p-8 mb-6 p-2">
          {currentStep === 1 && (
            <StepBasicInfo
              form={form}
              setForm={setForm}
              categories={categories}
              fieldErrors={fieldErrors}
            />
          )}
          {currentStep === 2 && (
            <DateInfo form={form} setForm={setForm} fieldErrors={fieldErrors} />
          )}
          {currentStep === 3 && <StepTickets form={form} setForm={setForm} />}
          {currentStep === 4 && (
            <StepPublish form={form} setForm={setForm} error={error} />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={loading}
              className="flex items-center gap-2 h-12 px-5 border border-border rounded-btn text-sm font-semibold text-secondary hover:text-primary hover:border-accent/40 transition-colors disabled:opacity-50"
            >
              <ArrowLeft size={15} strokeWidth={2.5} />
              Back
            </button>
          ) : (
            <div />
          )}

          {isLastStep ? (
            <Button
              variant="primary"
              size="md"
              loading={loading}
              disabled={needsEarlyAck}
              onClick={handleSubmit}
              className="min-w-40"
              icon={<Send size={15} strokeWidth={2} />}
            >
              {form.status === 'published' ? 'Publish Event' : 'Save Draft'}
            </Button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center justify-center gap-2 h-12 w-full px-5 bg-accent hover:bg-accent-hover text-white text-sm  font-semibold rounded-btn transition-colors active:scale-[.98]"
            >
              Continue
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Step counter helper */}
        <p className="text-center text-xs text-muted mt-4">
          Step {currentStep} of {STEPS.length}
        </p>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
