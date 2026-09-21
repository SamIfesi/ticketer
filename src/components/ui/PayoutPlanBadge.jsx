import { Zap } from 'lucide-react';
import Badge from './Badge';
import { PAYOUT_PLAN_MAP, SPLIT_MODE } from '../../config/constants';

// Shows which payout plan an event is on. Renders nothing if unknown.
export default function PayoutPlanBadge({ plan, size = 'sm' }) {
  // Plans are meaningless in split mode (Paystack settles directly)
  if (SPLIT_MODE) return null;
  const meta = PAYOUT_PLAN_MAP[plan];
  if (!meta) return null;
  return (
    <Badge variant={meta.variant} size={size}>
      {plan === 'early' && <Zap size={10} strokeWidth={2.5} />}
      {meta.label}
    </Badge>
  );
}
