import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Flag,
  ChevronDown,
  Landmark,
  User,
  Percent,
  RefreshCw,
  Pencil,
  X,
} from 'lucide-react';
import { useOrganizerPayment } from '../../hooks/useOrganizerPayment';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatShortDate } from '../../utils/formatDate';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PayoutPlanBadge from '../../components/ui/PayoutPlanBadge';
import Pagination from '../../components/ui/Pagination';
import { SPLIT_MODE, PAYOUT_STATUS_LABEL } from '../../config/constants';

// ── Payout status badge ───────────────────────────────────────
const PAYOUT_STATUS_VARIANT = {
  pending: 'warning',
  processing: 'info',
  paid: 'success',
  failed: 'error',
  frozen: 'warning',
  cancelled: 'neutral',
  split_settled: 'success',
};

function PayoutStatusBadge({ status }) {
  return (
    <Badge variant={PAYOUT_STATUS_VARIANT[status] ?? 'neutral'} size="sm" dot>
      {PAYOUT_STATUS_LABEL[status] ??
        status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// ── Bank details form ─────────────────────────────────────────
function BankDetailsForm({
  onSubmit,
  saving,
  fieldErrors,
  saveError,
  banks,
  banksLoading,
  resolvedAccount,
  resolveLoading,
  resolveError,
  onResolve,
  onClearResolved,
  initialValues,
  isEdit,
  onCancel,
}) {
  const [bankCode, setBankCode] = useState(initialValues?.bank_code ?? '');
  const [bankName, setBankName] = useState(initialValues?.bank_name ?? '');
  const [accountNumber, setAccountNumber] = useState('');

  function handleBankChange(e) {
    const code = e.target.value;
    setBankCode(code);
    const bank = banks.find((b) => b.code === code);
    setBankName(bank?.name ?? '');
    onClearResolved();
  }

  function handleAccountChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(val);
    if (resolvedAccount) onClearResolved();
  }

  function handleVerify() {
    if (accountNumber.length === 10 && bankCode) {
      onResolve({ accountNumber, bankCode });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!resolvedAccount) return;
    onSubmit({ bankName, bankCode, accountNumber });
  }

  const canVerify = accountNumber.length === 10 && bankCode && !resolveLoading;
  const canSubmit = !!resolvedAccount && !saving;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {saveError && (
        <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-card">
          <AlertTriangle size={14} className="text-error shrink-0 mt-0.5" />
          <p className="text-xs text-error">{saveError}</p>
        </div>
      )}

      {/* Bank dropdown */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-primary select-none">
          Bank
        </label>
        <div className="relative">
          <Landmark
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <select
            value={bankCode}
            onChange={handleBankChange}
            disabled={banksLoading || saving}
            className="w-full h-12 pl-10 pr-9 bg-card text-primary border border-border rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent appearance-none disabled:opacity-50 transition-colors"
          >
            <option value="">
              {banksLoading ? 'Loading banks…' : 'Select your bank…'}
            </option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
        </div>
        {fieldErrors?.bank_code && (
          <p className="text-xs text-error">{fieldErrors.bank_code}</p>
        )}
      </div>

      {/* Account number + verify */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-primary select-none">
          Account Number
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <CreditCard
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={handleAccountChange}
              placeholder="10-digit account number"
              disabled={saving}
              className="w-full h-12 pl-10 pr-4 bg-card text-primary border border-border rounded-card text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors disabled:opacity-50"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="md"
            loading={resolveLoading}
            disabled={!canVerify}
            onClick={handleVerify}
          >
            Verify
          </Button>
        </div>
        {fieldErrors?.account_number && (
          <p className="text-xs text-error">{fieldErrors.account_number}</p>
        )}
        {resolveError && <p className="text-xs text-error">{resolveError}</p>}

        {/* Resolved account name */}
        {resolvedAccount && (
          <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-btn">
            <CheckCircle2 size={14} className="text-success shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-success">Account verified</p>
              <p className="text-xs text-secondary truncate">
                {resolvedAccount.account_name}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearResolved}
              className="text-muted hover:text-primary"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={saving}
          disabled={!canSubmit}
          className="flex-1 sm:flex-none sm:min-w-40"
        >
          {isEdit ? 'Update Bank Details' : 'Save Bank Details'}
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
        )}
      </div>

      {!isEdit && (
        <p className="text-xs text-muted">
          {SPLIT_MODE
            ? 'Your account will be checked via Paystack. Ticket revenue is paid directly into this account, so double-check the details: Paystack is not liable for funds sent to a wrong account.'
            : 'Your account will be verified instantly via Paystack. These details are used to send your event revenue after payouts.'}
        </p>
      )}
    </form>
  );
}

// ── Saved details card ────────────────────────────────────────
function SavedDetailsCard({
  paymentDetails,
  cancellationCount,
  isFlagged,
  onEdit,
}) {
  const BANK_DETAILS = [
    { label: 'Bank', value: paymentDetails.bank_name, icon: Landmark },
    {
      label: 'Account Number',
      value: paymentDetails.account_number_masked,
      icon: CreditCard,
    },
    {
      label: 'Account Name',
      value: paymentDetails.account_name,
      icon: User,
    },
    {
      label: 'Platform Fee',
      value: SPLIT_MODE ? '0%' : `${paymentDetails.platform_fee_percentage}%`,
      icon: Percent,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Flag warning */}
      {isFlagged && (
        <div className="flex items-start gap-3 p-4 bg-error/10 border border-error/20 rounded-card">
          <Flag size={16} className="text-error shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-error">Account Flagged</p>
            <p className="text-xs text-secondary mt-0.5">
              Your payouts are currently frozen pending admin review due to
              multiple event cancellations. Please contact support.
            </p>
          </div>
        </div>
      )}

      {/* Strike count */}
      {cancellationCount > 0 && !isFlagged && (
        <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-card">
          <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-secondary">
            You have <strong>{cancellationCount}</strong> event cancellation
            {cancellationCount !== 1 ? 's' : ''}. At 3, your account is flagged
            and payouts are frozen.
          </p>
        </div>
      )}

      {/* Details card */}
      <div className="bg-card border border-border rounded-card overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-primary">Bank Account</h3>
            {paymentDetails.is_verified && (
              <span className="inline-flex items-center gap-1 text-xs text-success font-semibold">
                <CheckCircle2 size={12} strokeWidth={2.5} /> Verified
              </span>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<Pencil size={13} />}
            onClick={onEdit}
          >
            Update
          </Button>
        </div>

        <div className="divide-y divide-border">
          {BANK_DETAILS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-4 px-3 py-3.5">
              <div className="w-8 h-8 rounded-btn bg-accent-text flex items-center justify-center shrink-0">
                <Icon size={14} strokeWidth={1.75} className="text-accent" />
              </div>
              <div className="flex-1 flex items-center justify-between gap-4">
                <span className="text-[9px] text-muted">{label}</span>
                <span className="text-[11px] font-semibold text-primary">
                  {value ?? '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Payout history table ──────────────────────────────────────
function PayoutHistory({
  payouts,
  payoutsLoading,
  payoutsPagination,
  onPageChange,
  page,
}) {
  function SkeletonRow() {
    return (
      <tr className="animate-pulse border-t border-border">
        {[140, 100, 90, 90, 90, 80, 80].map((w, i) => (
          <td key={i} className="px-4 py-3.5">
            <div className="h-3 bg-border rounded" style={{ width: w }} />
          </td>
        ))}
      </tr>
    );
  }

  return (
    <div>
      <h2 className="text-base font-bold text-primary mb-1">Payout History</h2>
      <p className="text-xs text-muted mb-4">
        {SPLIT_MODE ? (
          <>
            Revenue is paid by Paystack directly to your bank account, usually
            the next business day after each sale (excluding weekends and
            public holidays). Rows marked “Settled by Paystack” need no action
            from you.
          </>
        ) : (
          <>
        “Your Amount” is the running total owed for each event. On the{' '}
        <strong className="text-secondary">Early access</strong> plan, an event
        can be paid out several times as new tickets sell — “Paid” means
        everything owed so far has been sent, not that nothing more is coming.
        Payouts are processed in batches (typically within 30 minutes of
        becoming eligible), not instantly.
          </>
        )}
      </p>
      <div className="bg-card border border-border rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="bg-main-bg">
                {[
                  'Event',
                  'Gross Revenue',
                  'Platform Fee',
                  'Your Amount',
                  'Status',
                  'Hold Until',
                  'Last Paid At',
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
              {payoutsLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : payouts.length > 0 ? (
                payouts.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-border hover:bg-main-bg transition-colors duration-150"
                  >
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-primary truncate max-w-40">
                        {p.event_title}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {formatShortDate(p.event_end_date)}
                      </p>
                      <div className="mt-1">
                        <PayoutPlanBadge plan={p.payout_plan} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(p.gross_revenue)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-secondary">
                        {formatCurrency(p.platform_fee_amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(p.organizer_amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <PayoutStatusBadge status={p.payout_status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-muted">
                        {p.hold_until ? formatShortDate(p.hold_until) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-secondary">
                        {p.paid_at ? formatShortDate(p.paid_at) : '—'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-card bg-accent-text border border-accent-border flex items-center justify-center">
                        <Banknote
                          size={20}
                          strokeWidth={1.5}
                          className="text-accent"
                        />
                      </div>
                      <p className="text-sm font-semibold text-primary">
                        No payouts yet
                      </p>
                      <p className="text-xs text-muted">
                        {SPLIT_MODE
                          ? 'Sales appear here as they are paid. Paystack settles them to your bank account directly.'
                          : 'Payouts appear here once your hold period passes — 48 hours after the event ends on Standard, or ~1 hours after each sale on Early access.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {payoutsPagination?.total_pages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={payoutsPagination.total_pages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function OrganizerPaymentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [payoutPage, setPayoutPage] = useState(1);

  const {
    paymentDetails,
    paymentDetailsLoading,
    hasPaymentDetails,
    // isVerified,
    isFlagged,
    cancellationCount,
    fetchPaymentDetails,
    banks,
    banksLoading,
    fetchBanks,
    resolvedAccount,
    resolveLoading,
    resolveError,
    resolveAccount,
    clearResolvedAccount,
    saving,
    saveError,
    fieldErrors,
    savePaymentDetails,
    updatePaymentDetails,
    payouts,
    payoutsPagination,
    payoutsLoading,
    fetchMyPayouts,
  } = useOrganizerPayment();

  useEffect(() => {
    fetchPaymentDetails();
    fetchBanks();
  }, [fetchPaymentDetails, fetchBanks]);

  useEffect(() => {
    fetchMyPayouts({ page: payoutPage });
  }, [payoutPage, fetchMyPayouts]);

  async function handleSave(formData) {
    const ok = await savePaymentDetails(formData, {
      onSuccess: () => setEditing(false),
    });
    if (ok) fetchPaymentDetails();
  }

  async function handleUpdate(formData) {
    const ok = await updatePaymentDetails(formData, {
      onSuccess: () => setEditing(false),
    });
    if (ok) fetchPaymentDetails();
  }

  const showForm = !hasPaymentDetails || editing;

  return (
    <div className="flex flex-col min-h-screen bg-main-bg">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
            Payment Settings
          </h1>
          <p className="text-sm text-secondary mt-1">
            {SPLIT_MODE
              ? 'Add your bank details to receive ticket revenue directly from Paystack.'
              : 'Add your bank details to receive payouts after your events.'}
          </p>
        </div>

        {SPLIT_MODE && (
          <div className="flex items-start gap-3 p-4 mb-6 bg-accent-text border border-accent-border rounded-card">
            <Banknote size={16} className="text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-secondary leading-relaxed">
              Your first payout can take longer while Paystack verifies your
              account. After that, sales settle on the next business day. Ticketer
              takes no commission on this event.
            </p>
          </div>
        )}

        {paymentDetailsLoading ? (
          <div className="flex flex-col gap-5 animate-pulse">
            <div className="h-40 bg-border rounded-card" />
            <div className="h-12 bg-border rounded-card" />
            <div className="h-12 bg-border rounded-card" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* No details yet — show info banner + form */}
            {!hasPaymentDetails && (
              <div className="flex items-start gap-3 p-4 bg-accent-text border border-accent-border rounded-card">
                <Banknote size={16} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-accent">
                    Bank details required to receive payouts
                  </p>
                  <p className="text-xs text-secondary mt-0.5">
                    Add and verify your bank account below. You will not be able
                    to publish events until this is complete.
                  </p>
                </div>
              </div>
            )}

            {/* Saved details OR form */}
            <div>
              <h2 className="text-base font-bold text-primary mb-5">
                {showForm
                  ? editing
                    ? 'Update Bank Details'
                    : 'Add Bank Details'
                  : 'Bank Account'}
              </h2>

              {showForm ? (
                <BankDetailsForm
                  onSubmit={hasPaymentDetails ? handleUpdate : handleSave}
                  saving={saving}
                  fieldErrors={fieldErrors}
                  saveError={saveError}
                  banks={banks}
                  banksLoading={banksLoading}
                  resolvedAccount={resolvedAccount}
                  resolveLoading={resolveLoading}
                  resolveError={resolveError}
                  onResolve={resolveAccount}
                  onClearResolved={clearResolvedAccount}
                  initialValues={paymentDetails}
                  isEdit={editing}
                  onCancel={() => {
                    setEditing(false);
                    clearResolvedAccount();
                  }}
                />
              ) : (
                <SavedDetailsCard
                  paymentDetails={paymentDetails}
                  cancellationCount={cancellationCount}
                  isFlagged={isFlagged}
                  onEdit={() => setEditing(true)}
                />
              )}
            </div>

            {/* Payout history */}
            <PayoutHistory
              payouts={payouts}
              payoutsLoading={payoutsLoading}
              payoutsPagination={payoutsPagination}
              page={payoutPage}
              onPageChange={setPayoutPage}
            />
          </div>
        )}
      </main>

      <Footer variant="minimal"/>
    </div>
  );
}
