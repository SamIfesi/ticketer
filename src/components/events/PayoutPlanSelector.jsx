// Payout plan picker — shared by CreateEventSteps (StepPublish) and EventForm.
//
// "early" releases money ~2h after each booking, BEFORE the event happens.
// The backend cannot claw that money back if the event is cancelled/fraudulent,
// so picking it requires an explicit acknowledgement (UI-level consent).
//
// Props:
//   value      — 'standard' | 'early'
//   ack        — boolean, organizer has acknowledged the early-plan risk
//   onChange   — (plan) => void
//   onAckChange— (bool) => void
//   disabled   — boolean

import { Check, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import { PAYOUT_PLAN } from '../../../new/config/constants';

const PLANS = [
  {
    value: PAYOUT_PLAN.STANDARD,
    label: 'Standard (recommended)',
    description:
      'Funds release 48 hours after your event ends. Safest option, no action needed.',
    icon: ShieldCheck,
  },
  {
    value: PAYOUT_PLAN.EARLY,
    label: 'Early access',
    description:
      'Funds start releasing ~2 hours after each ticket sale, so you can use revenue to prepare the event.',
    icon: Zap,
  },
];

export default function PayoutPlanSelector({
  value = PAYOUT_PLAN.STANDARD,
  ack = false,
  onChange,
  onAckChange,
  disabled = false,
}) {
  const isEarly = value === PAYOUT_PLAN.EARLY;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-primary">
        When do you want to receive ticket revenue?
      </p>

      {PLANS.map((plan) => {
        const Icon = plan.icon;
        const active = value === plan.value;
        return (
          <button
            key={plan.value}
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange(plan.value);
              if (plan.value === PAYOUT_PLAN.STANDARD) onAckChange?.(false);
            }}
            className={`w-full text-left flex items-start gap-2 p-4 rounded-card border-2 transition-all duration-150 disabled:opacity-50 ${
              active
                ? 'border-accent bg-accent-text'
                : 'border-border bg-card hover:border-accent/40'
            }`}
          >
            <Icon
              size={14}
              strokeWidth={2.5}
              className={`mt-1 shrink-0 ${active ? 'text-accent' : 'text-primary'}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-bold ${active ? 'text-accent' : 'text-primary'}`}
                >
                  {plan.label}
                </p>
                {active && (
                  <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <Check size={10} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5 leading-snug">
                {plan.description}
              </p>
            </div>
          </button>
        );
      })}

      {isEarly && (
        <div className="flex flex-col gap-3 p-4 bg-warning/10 border border-warning/20 rounded-card">
          <div className="flex items-start gap-2">
            <AlertTriangle size={15} className="text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-secondary leading-relaxed">
              <strong className="text-primary">Read before choosing.</strong>{' '}
              If your event is cancelled or found fraudulent after payouts have
              gone out, that money is{' '}
              <strong className="text-primary">
                not automatically returned
              </strong>{' '}
              and may be pursued from you directly. Payouts run in batches
              (typically within 15 minutes of becoming eligible), not instantly.
            </p>
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={ack}
              disabled={disabled}
              onChange={(e) => onAckChange?.(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[var(--color-accent)] shrink-0"
            />
            <span className="text-xs font-semibold text-primary leading-snug">
              I understand the risk and want early access to my ticket revenue.
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
