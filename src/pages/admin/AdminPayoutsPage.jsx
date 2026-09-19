import { useEffect, useState } from 'react';
import {
  Banknote,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  RefreshCw,
  Flag,
  Info,
} from 'lucide-react';
import { usePayouts } from '../../hooks/usePayment';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatShortDate } from '../../utils/formatDate';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PayoutPlanBadge from '../../components/ui/PayoutPlanBadge';
import Pagination from '../../components/ui/Pagination';
import { ConfirmModal } from '../../components/ui/Modal';

const PAYOUT_STATUS_VARIANT = {
  pending: 'warning',
  processing: 'info',
  paid: 'success',
  failed: 'error',
  frozen: 'warning',
  cancelled: 'neutral',
};

function PayoutStatusBadge({ status }) {
  return (
    <Badge variant={PAYOUT_STATUS_VARIANT[status] ?? 'neutral'} size="sm" dot>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// ── Freeze modal with reason input ───────────────────────────
function FreezeModal({ isOpen, onClose, onConfirm, loading, eventTitle }) {
  const [reason, setReason] = useState('');

  function handleConfirm() {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  }

  function handleClose() {
    setReason('');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={handleClose}
        className="fixed inset-0 z-9990 bg-black/50 backdrop-blur-sm animate-[fadeIn_180ms_ease_forwards]"
      />
      <div className="fixed inset-0 z-9991 flex items-center justify-center px-4 py-8 pointer-events-none">
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-card shadow-2xl flex flex-col animate-[modalIn_220ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
        >
          <div className="px-5 pt-5 pb-4 border-b border-border">
            <h2 className="text-base font-bold text-primary">Freeze Payout</h2>
            <p className="text-sm text-secondary mt-0.5 truncate">
              {eventTitle}
            </p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            <p className="text-sm text-secondary">
              Freezing stops the auto worker from paying out this event. Provide
              a reason for the record.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-primary">
                Reason <span className="text-error">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Attendee reported potential fraud, investigating…"
                rows={3}
                className="w-full px-4 py-3 bg-main-bg text-primary border border-border rounded-card text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-none"
              />
            </div>
          </div>
          <div className="px-5 pb-5 pt-2 flex items-center justify-end gap-3 border-t border-border">
            <Button
              variant="ghost"
              size="md"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={loading}
              disabled={!reason.trim()}
              icon={<Lock size={15} />}
              onClick={handleConfirm}
            >
              Freeze Payout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Pending payout card ───────────────────────────────────────
function PendingPayoutCard({
  payout,
  onTrigger,
  onFreeze,
  onRefundAll,
  mutating,
  mutatingId,
}) {
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [showFreeze, setShowFreeze] = useState(false);

  const isThisMutating = mutating && mutatingId === payout.event_id;
  const isFlagged = payout.is_flagged;
  const isUnverified = !payout.is_verified;
  const cannotTrigger = isFlagged || isUnverified;

  return (
    <>
      <div className="bg-card border border-border rounded-card p-5 hover:border-accent/20 hover:shadow-sm transition-all duration-200">
        {/* Warnings */}
        {isFlagged && (
          <div className="flex items-center gap-2 px-3 py-2 bg-error/10 border border-error/20 rounded-btn mb-4">
            <Flag size={13} className="text-error shrink-0" />
            <p className="text-xs text-error font-medium">
              Organizer account is flagged — payout blocked
            </p>
          </div>
        )}
        {isUnverified && !isFlagged && (
          <div className="flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/20 rounded-btn mb-4">
            <AlertTriangle size={13} className="text-warning shrink-0" />
            <p className="text-xs text-warning font-medium">
              Organizer has no verified bank account
            </p>
          </div>
        )}

        {/* Event info */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <p className="text-base font-bold text-primary truncate">
              {payout.event_title}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {new Date(payout.event_end_date) > new Date()
                ? 'Ends'
                : 'Ended'}{' '}
              {payout.event_end_date
                ? formatShortDate(payout.event_end_date)
                : '—'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <PayoutStatusBadge status={payout.payout_status} />
            <PayoutPlanBadge plan={payout.payout_plan} />
          </div>
        </div>

        {/* Organizer */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
          <div className="w-7 h-7 rounded-full bg-accent-text flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-accent">
              {payout.organizer_name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary truncate">
              {payout.organizer_name}
            </p>
            <p className="text-[11px] text-muted truncate">
              {payout.organizer_email}
            </p>
          </div>
        </div>

        {/* Revenue breakdown */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            {
              label: 'Gross Revenue',
              value: formatCurrency(payout.gross_revenue ?? 0),
              color: 'text-primary',
            },
            {
              label: 'Platform Fee',
              value: formatCurrency(payout.platform_fee_amount ?? 0),
              color: 'text-muted',
            },
            {
              label: 'Organizer Gets',
              value: formatCurrency(payout.organizer_amount ?? 0),
              color: 'text-success',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-main-bg rounded-btn p-3 text-center">
              <p className={`text-sm font-black ${color}`}>{value}</p>
              <p className="text-[10px] text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Already received vs still pending (lifetime organizer_amount is a running total) */}
        {(() => {
          const paidOut = Number(payout.total_paid_out ?? 0);
          const owed = Number(payout.organizer_amount ?? 0);
          const remaining = Math.max(0, owed - paidOut);
          return (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-main-bg rounded-btn p-3 text-center">
                <p className="text-sm font-black text-primary">
                  {formatCurrency(paidOut)}
                </p>
                <p className="text-[10px] text-muted mt-0.5">
                  Already received
                </p>
              </div>
              <div className="bg-main-bg rounded-btn p-3 text-center">
                <p className="text-sm font-black text-warning">
                  {formatCurrency(remaining)}
                </p>
                <p className="text-[10px] text-muted mt-0.5">
                  Still pending
                </p>
              </div>
            </div>
          );
        })()}

        {/* Hold until */}
        <div className="flex items-center gap-1.5 mb-4">
          <Info size={12} className="text-muted shrink-0" />
          <p className="text-xs text-muted">
            Hold until:{' '}
            <span className="font-semibold text-secondary">
              {payout.hold_until ? formatShortDate(payout.hold_until) : '—'}
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            icon={<CheckCircle2 size={14} />}
            loading={isThisMutating}
            disabled={cannotTrigger || (mutating && !isThisMutating)}
            onClick={() => onTrigger(payout.event_id)}
            className="flex-1"
          >
            Trigger Payout
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Lock size={14} />}
            disabled={mutating}
            onClick={() => setShowFreeze(true)}
          >
            Freeze
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<XCircle size={14} />}
            disabled={mutating}
            onClick={() => setConfirmRefund(true)}
          >
            Refund All
          </Button>
        </div>
      </div>

      {/* Freeze modal */}
      <FreezeModal
        isOpen={showFreeze}
        onClose={() => setShowFreeze(false)}
        onConfirm={(reason) => {
          onFreeze(payout.event_id, reason);
          setShowFreeze(false);
        }}
        loading={isThisMutating}
        eventTitle={payout.event_title}
      />

      {/* Refund confirm */}
      <ConfirmModal
        isOpen={confirmRefund}
        onClose={() => setConfirmRefund(false)}
        onConfirm={() => {
          onRefundAll(payout.event_id);
          setConfirmRefund(false);
        }}
        loading={isThisMutating}
        title={`Refund all attendees for "${payout.event_title}"?`}
        description="This will initiate Paystack refunds for every paid booking. The organizer receives nothing. This cannot be undone."
        confirmLabel="Yes, refund all"
        danger
      />
    </>
  );
}

// ── All payouts table ─────────────────────────────────────────
function AllPayoutsTab({
  payouts,
  payoutsLoading,
  payoutsPagination,
  statusFilter,
  setStatusFilter,
  page,
  setPage,
  mutating,
  mutatingId,
  onTrigger,
  onFreeze,
  onUnfreeze,
  onRefundAll,
}) {
  const [freezeTarget, setFreezeTarget] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);

  const STATUS_FILTERS = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    { value: 'frozen', label: 'Frozen' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  function SkeletonRow() {
    return (
      <tr className="animate-pulse border-t border-border">
        {[160, 120, 90, 90, 80, 80, 80, 100].map((w, i) => (
          <td key={i} className="px-4 py-3.5">
            <div className="h-3 bg-border rounded" style={{ width: w }} />
          </td>
        ))}
      </tr>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`h-9 px-4 rounded-btn text-xs font-semibold border transition-colors ${
              statusFilter === f.value
                ? 'bg-accent text-white border-accent'
                : 'bg-card text-secondary border-border hover:text-primary hover:border-accent/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="bg-main-bg">
                {[
                  'Event',
                  'Organizer',
                  'Gross',
                  'Org. Amount',
                  'Status',
                  'Hold Until',
                  'Paid At',
                  'Actions',
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
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : payouts.length > 0 ? (
                payouts.map((p) => {
                  const isThisMutating = mutating && mutatingId === p.event_id;
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-border hover:bg-main-bg transition-colors duration-150"
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-primary truncate max-w-35">
                          {p.event_title}
                        </p>
                        <p className="text-[11px] text-muted">
                          {p.event_end_date
                            ? formatShortDate(p.event_end_date)
                            : '—'}
                        </p>
                        <div className="mt-1">
                          <PayoutPlanBadge plan={p.payout_plan} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-primary truncate max-w-27.5">
                          {p.organizer_name}
                        </p>
                        <p className="text-[11px] text-muted truncate max-w-27.5">
                          {p.organizer_email}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-primary">
                          {formatCurrency(p.gross_revenue ?? 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-bold text-success">
                          {formatCurrency(p.organizer_amount ?? 0)}
                        </span>
                        {p.total_paid_out !== undefined && (
                          <p className="text-[11px] text-muted mt-0.5">
                            {formatCurrency(p.total_paid_out ?? 0)} sent
                          </p>
                        )}
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
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {['pending', 'failed'].includes(p.payout_status) && (
                            <button
                              onClick={() => onTrigger(p.event_id)}
                              disabled={mutating}
                              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-success bg-success/10 border border-success/20 rounded-btn hover:bg-success/20 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 size={11} /> Trigger
                            </button>
                          )}
                          {p.payout_status === 'frozen' && (
                            <button
                              onClick={() => onUnfreeze(p.event_id)}
                              disabled={mutating}
                              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-info bg-info/10 border border-info/20 rounded-btn hover:bg-info/20 transition-colors disabled:opacity-50"
                            >
                              <Unlock size={11} /> Unfreeze
                            </button>
                          )}
                          {/* Freezing a 'paid' event is valid: it stops the NEXT delta on early-plan events */}
                          {!['cancelled'].includes(p.payout_status) && (
                            <button
                              onClick={() => setFreezeTarget(p)}
                              disabled={
                                mutating || p.payout_status === 'frozen'
                              }
                              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-warning bg-warning/10 border border-warning/20 rounded-btn hover:bg-warning/20 transition-colors disabled:opacity-50"
                            >
                              <Lock size={11} /> Freeze
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-card bg-accent-text border border-accent-border flex items-center justify-center">
                        <Banknote
                          size={20}
                          strokeWidth={1.5}
                          className="text-accent"
                        />
                      </div>
                      <p className="text-sm font-semibold text-primary">
                        No payouts found
                      </p>
                      <p className="text-xs text-muted">
                        Try a different status filter.
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
        <Pagination
          currentPage={page}
          totalPages={payoutsPagination.total_pages}
          onPageChange={setPage}
        />
      )}

      {/* Freeze modal */}
      <FreezeModal
        isOpen={!!freezeTarget}
        onClose={() => setFreezeTarget(null)}
        onConfirm={(reason) => {
          onFreeze(freezeTarget.event_id, reason);
          setFreezeTarget(null);
        }}
        loading={mutating && mutatingId === freezeTarget?.event_id}
        eventTitle={freezeTarget?.event_title ?? ''}
      />

      {/* Refund confirm */}
      <ConfirmModal
        isOpen={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        onConfirm={() => {
          onRefundAll(refundTarget.event_id);
          setRefundTarget(null);
        }}
        loading={mutating && mutatingId === refundTarget?.event_id}
        title={`Refund all attendees for "${refundTarget?.event_title}"?`}
        description="This will initiate Paystack refunds for every paid booking. The organizer receives nothing. This cannot be undone."
        confirmLabel="Yes, refund all"
        danger
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminPayoutsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('queue');

  const {
    payouts,
    payoutsPagination,
    payoutsLoading,
    fetchPayouts,
    pendingPayouts,
    pendingPayoutsLoading,
    fetchPendingPayouts,
    mutating,
    mutatingId,
    triggerPayout,
    freezePayout,
    unfreezePayout,
    refundAll,
    page,
    statusFilter,
    setPage,
    setStatusFilter,
  } = usePayouts();

  useEffect(() => {
    fetchPendingPayouts();
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [page, statusFilter]);

  return (
    <div className="flex flex-col min-h-screen bg-main-bg">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={14} className="text-accent" />
            <span className="text-xs font-bold text-accent uppercase tracking-widest">
              Admin
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
            Payouts
          </h1>
          <p className="text-sm text-secondary mt-1">
            Manage organizer payouts, freeze disputed transfers, and trigger
            refunds.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-main-bg border border-border rounded-card mb-8 w-fit">
          {[
            {
              value: 'queue',
              label: `Action Queue${pendingPayouts.length > 0 ? ` (${pendingPayouts.length})` : ''}`,
            },
            { value: 'all', label: 'All Payouts' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-5 py-2 rounded-btn text-sm font-semibold transition-colors duration-150 ${
                activeTab === tab.value
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Queue tab */}
        {activeTab === 'queue' && (
          <div className="flex flex-col gap-6">
            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 bg-accent-text border border-accent-border rounded-card">
              <Info size={15} className="text-accent shrink-0 mt-0.5" />
              <p className="text-sm text-secondary">
                These payouts have passed their hold period. Standard-plan
                events have ended; <strong className="text-primary">early-plan</strong>{' '}
                events may still be selling tickets and can appear here
                repeatedly as new bookings land. Review each one carefully
                before triggering a payout. If an attendee reports a scam,{' '}
                <strong className="text-primary">freeze first</strong>,
                investigate, then trigger or refund.
              </p>
            </div>

            {pendingPayoutsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-card p-5 animate-pulse flex flex-col gap-4"
                  >
                    <div className="h-5 bg-border rounded w-2/3" />
                    <div className="h-3 bg-border rounded w-1/3" />
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((j) => (
                        <div key={j} className="h-14 bg-border rounded-btn" />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-9 bg-border rounded-btn" />
                      <div className="h-9 w-20 bg-border rounded-btn" />
                      <div className="h-9 w-24 bg-border rounded-btn" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingPayouts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingPayouts.map((p) => (
                  <PendingPayoutCard
                    key={p.event_id}
                    payout={p}
                    onTrigger={triggerPayout}
                    onFreeze={freezePayout}
                    onRefundAll={refundAll}
                    mutating={mutating}
                    mutatingId={mutatingId}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
                <div className="w-16 h-16 rounded-card bg-accent-text border border-accent-border flex items-center justify-center">
                  <CheckCircle2
                    size={28}
                    strokeWidth={1.5}
                    className="text-accent"
                  />
                </div>
                <div>
                  <p className="font-bold text-primary text-lg">
                    Queue is empty
                  </p>
                  <p className="text-sm text-secondary mt-1 max-w-xs">
                    No events are currently waiting for a payout. Check back
                    after events conclude.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Payouts tab */}
        {activeTab === 'all' && (
          <AllPayoutsTab
            payouts={payouts}
            payoutsLoading={payoutsLoading}
            payoutsPagination={payoutsPagination}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            page={page}
            setPage={setPage}
            mutating={mutating}
            mutatingId={mutatingId}
            onTrigger={triggerPayout}
            onFreeze={freezePayout}
            onUnfreeze={unfreezePayout}
            onRefundAll={refundAll}
          />
        )}
      </main>

      <Footer variant="minimal"/>
    </div>
  );
}
