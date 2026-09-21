export const BASE_URL = import.meta.env.VITE_API_URL;
// Temporary payout mode. 'split' = Paystack pays organizers directly
// (Starter Business). Must match PAYOUT_MODE on the backend .env.
export const SPLIT_MODE = import.meta.env.VITE_PAYOUT_MODE === 'split';
export const PAYSTACK_PUBLIC_KEY =
  import.meta.env.VITE_LIVE_PAYSTACK_PUBLIC_KEY ?? '';

// ==== FOR USERTABLE AND EVENT-TABLE COMPONENT
export const ROLES = {
  DEV: 'dev',
  ADMIN: 'admin',
  ORGANIZER: 'organizer',
  ATTENDEE: 'attendee',
};

export const ROLE_OPTIONS = [
  { value: ROLES.ATTENDEE, label: 'Attendee' },
  { value: ROLES.ORGANIZER, label: 'Organizer' },
  { value: ROLES.ADMIN, label: 'Admin' },
];

export const ROLE_COLORS = {
  [ROLES.DEV]: '#8b5cf6',
  [ROLES.ADMIN]: '#ef4444',
  [ROLES.ORGANIZER]: '#10b981',
  [ROLES.ATTENDEE]: '#2563eb',
};

export const USERTABLE_HEADS = ['User', 'Role', 'Status', 'Joined', ''];
export const EVENT_TABLE_HEADS = [
  'Event',
  'Status',
  'Tickets',
  'Revenue',
  'Date',
  '',
];

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
};

export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};
// === END OF USERTABLE AND EVENT-TABLE CONSTANTS===

export const TICKET_STATUS = {
  VALID: 'valid',
  USED: 'used',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  DONE: 'done',
  FAILED: 'failed',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 12,
};

export const STORAGE_KEY = {
  AUTH: 'auth',
};

// ==== FOR BADGE COMPONENTS ====
export const EVENT_STATUS_MAP = {
  draft: { variant: 'warning', label: 'Draft' },
  published: { variant: 'success', label: 'Published' },
  cancelled: { variant: 'error', label: 'Cancelled' },
  completed: { variant: 'neutral', label: 'Completed' },
};

export const PAYMENT_STATUS_MAP = {
  pending: { variant: 'warning', label: 'Pending' },
  paid: { variant: 'success', label: 'Paid' },
  failed: { variant: 'error', label: 'Failed' },
  refunded: { variant: 'neutral', label: 'Refunded' },
};

export const BOOKING_STATUS_MAP = {
  pending: { variant: 'warning', label: 'Pending' },
  confirmed: { variant: 'success', label: 'Confirmed' },
  cancelled: { variant: 'error', label: 'Cancelled' },
};

export const TICKET_STATUS_MAP = {
  valid: { variant: 'success', label: 'Valid' },
  used: { variant: 'neutral', label: 'Used' },
  cancelled: { variant: 'error', label: 'Cancelled' },
  expired: { variant: 'neutral', label: 'Expired' },
};

export const VARIANT_STYLES = {
  success:
    'bg-[var(--color-success)]/10 text-[var(--color-success)] ring-[var(--color-success)]/20',
  error:
    'bg-[var(--color-error)]/10   text-[var(--color-error)]   ring-[var(--color-error)]/20',
  warning:
    'bg-[var(--color-warning)]/10 text-[var(--color-warning)] ring-[var(--color-warning)]/20',
  info: 'bg-[var(--color-info)]/10    text-[var(--color-info)]    ring-[var(--color-info)]/20',
  neutral:
    'bg-[var(--color-border)]     text-[var(--color-secondary)]  ring-[var(--color-border)]',
  accent:
    'bg-[var(--color-accent-text)] text-[var(--color-accent)] ring-[var(--color-accent-border)]',
};

export const SIZE_STYLES = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
};

// ── Dot indicator ─────────────────────────────────────────────
export const DOT_COLORS = {
  success: 'bg-[var(--color-success)]',
  error: 'bg-[var(--color-error)]',
  warning: 'bg-[var(--color-warning)]',
  info: 'bg-[var(--color-info)]',
  neutral: 'bg-[var(--color-muted)]',
  accent: 'bg-[var(--color-accent)]',
};
// === END OF BADGE CONSTANTS ===

// === FOR BUTTON CONSTANTS ===
export const VARIANTS = {
  primary: `
  bg-accent text-white border-transparent hover:bg-accent-hover focus-visible:ring-accent
  `,
  secondary: `
  bg-transparent text-primary border-border hover:bg-text-accent focus-visible:ring-accent
  `,
  ghost: `
  bg-transparent text-secondary border-transparent hover:bg-border hover:text-primary focus-visible:ring-accent
  `,
  danger: `bg-error text-white border-transparent hover:opacity-90 focus-visible:ring-error
  `,
};

export const SIZES = {
  sm: 'h-11 px-4 text-sm gap-2 rounded-btn',
  md: 'h-12 px-5 text-sm gap-2 rounded-btn',
  lg: 'h-14 px-6 text-base gap-2.5 rounded-btn',
};
// === END OF BUTTON CONSTANTS ===

// === FOR MODAL CONSTANTS ===
export const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};
// === END OF MODAL CONSTANTS ===

// === FOR TICKET FILTER CONSTANTS ===
export const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'valid', label: 'Valid' },
  { value: 'used', label: 'Used' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
];

export const DATE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];
// === END OF BUTTON CONSTANTS ===

import {
  Home,
  Search,
  LayoutDashboard,
  BookOpen,
  Ticket,
  ShieldUser,
  User,
  CalendarDays,
  PlusCircle,
  ShieldCheck,
  Users,
  ClipboardList,
  FileText,
  Send,
  Rocket,
  ClipboardClock,
  Bell,
  CreditCard,
  Banknote,
  BarChart3,
} from 'lucide-react';

/**
 * NAV_GROUPS — top-level dropdown groups shown in the desktop navbar.
 */
export const NAV_GROUPS = [
  {
    id: 'discover',
    label: 'Discover',
    requireAuth: false,
    roles: [],
    items: [
      {
        to: '/home',
        icon: Home,
        label: 'Home',
        description: 'Back to the homepage',
      },
      {
        to: '/events',
        icon: Search,
        label: 'Browse Events',
        description: 'Find and explore events',
      },
      {
        to: '/about',
        icon: ShieldUser,
        label: 'About',
        description: 'Learn more about us',
      },
    ],
  },
  {
    id: 'activity',
    label: 'My Activity',
    requireAuth: true,
    roles: [ROLES.ATTENDEE, ROLES.ORGANIZER, ROLES.ADMIN, ROLES.DEV],
    items: [
      {
        to: '/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
        description: 'Your personal overview',
      },
      {
        to: '/my-bookings',
        icon: BookOpen,
        label: 'My Bookings',
        description: 'View and manage bookings',
      },
      {
        to: '/my-tickets',
        icon: Ticket,
        label: 'My Tickets',
        description: 'Access your tickets',
      },
      // ── NEW ──
      {
        to: '/my-transactions',
        icon: CreditCard,
        label: 'Transaction History',
        description: 'Your payment records',
      },
      {
        to: '/become-organizer',
        icon: ShieldUser,
        label: 'Become Organizer',
        description: 'Apply for organizer status',
      },
      {
        to: '/profile',
        icon: User,
        label: 'Profile',
        description: 'Edit your profile',
      },
    ],
  },
  {
    id: 'organizer',
    label: 'Organizer',
    requireAuth: true,
    roles: [ROLES.ORGANIZER, ROLES.ADMIN, ROLES.DEV],
    items: [
      {
        to: '/organizer/dashboard',
        icon: LayoutDashboard,
        label: 'Organiser Dashboard',
        description: 'Overview of your events',
      },
      {
        to: '/organizer/events',
        icon: CalendarDays,
        label: 'My Events',
        description: 'Manage your events',
      },
      {
        to: '/organizer/create/event',
        icon: PlusCircle,
        label: 'Create Event',
        description: 'Publish a new event',
      },
      // ── NEW ──
      {
        to: '/organizer/payment-details',
        icon: Banknote,
        label: 'Payment Settings',
        description: 'Bank details & payouts',
      },
      {
        to: '/organizer/transactions',
        icon: BarChart3,
        label: 'Revenue Ledger',
        description: 'Your earnings history',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    requireAuth: true,
    roles: [ROLES.ADMIN, ROLES.DEV],
    items: [
      {
        to: '/admin/dashboard',
        icon: ShieldCheck,
        label: 'Admin Dashboard',
        description: 'Full platform overview',
      },
      {
        to: '/admin/users',
        icon: Users,
        label: 'Manage Users',
        description: 'View and manage users',
      },
      {
        to: '/admin/events',
        icon: CalendarDays,
        label: 'All Events',
        description: 'Browse all platform events',
      },
      {
        to: '/admin/organizer/applications',
        icon: ClipboardList,
        label: 'Organizer Applications',
        description: 'Review pending applications',
      },
      // ── NEW ──
      {
        to: '/admin/transactions',
        icon: BarChart3,
        label: 'Transactions',
        description: 'Platform-wide audit log',
      },
      {
        to: '/admin/payouts',
        icon: Banknote,
        label: 'Payouts',
        description: 'Manage organizer payouts',
      },
    ],
  },
];

export const PROFILE_MENU = [{ to: '/profile', icon: User, label: 'Profile' }];

//==== START OF USERS PAGE CONSTANTS ====
export const ROLE_FILTERS = [
  { value: '', label: 'All Roles' },
  { value: ROLES.ATTENDEE, label: 'Attendees' },
  { value: ROLES.ORGANIZER, label: 'Organizers' },
  { value: ROLES.ADMIN, label: 'Admins' },
];

export const PER_PAGE_OPTIONS = [20, 50, 100];
//==== END USERS PAGE CONSTANTS ====

// === CREATE EVENT PAGE ====
export const GRADIENTS = [
  'from-blue-600 to-indigo-700',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
];

export const STEPS = [
  { id: 1, label: 'Basic Info', icon: FileText },
  { id: 2, label: 'Date', icon: CalendarDays },
  { id: 3, label: 'Tickets', icon: Ticket },
  { id: 4, label: 'Publish', icon: Send },
];

export const EMPTY_TICKET = {
  name: '',
  price: 0,
  quantity: '',
  description: '',
  sales_end_at: '',
};

export const DEFAULT_FORM = {
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
  ticket_types: [{ ...EMPTY_TICKET }],
  status: 'draft',
  checkin_mode: 'single',
  checkin_days: 1,
  payout_plan: 'standard',
  early_payout_ack: false, // UI-only consent flag, stripped before submit
};

// === PAYOUT PLAN CONSTANTS ===
export const PAYOUT_PLAN = {
  STANDARD: 'standard',
  EARLY: 'early',
};

export const PAYOUT_PLAN_MAP = {
  standard: { variant: 'neutral', label: 'Standard' },
  early: { variant: 'warning', label: 'Early access' },
};

export const PAYOUT_STATUS_VARIANT = {
  pending: 'warning',
  processing: 'info',
  paid: 'success',
  failed: 'error',
  frozen: 'warning',
  cancelled: 'neutral',
  split_settled: 'success',
};

export const PAYOUT_STATUS_LABEL = {
  split_settled: 'Settled by Paystack',
};
// === END PAYOUT PLAN CONSTANTS ===

// === CHECK-IN MODE CONSTANTS ===
export const CHECKIN_MODE = {
  SINGLE: 'single',
  MULTI_DAY: 'multi_day',
};
// === END CHECK-IN MODE CONSTANTS ===

export const OPTIONS = [
  {
    value: 'draft',
    label: 'Save as Draft',
    description:
      'Hidden from the public. You can publish later from your events list.',
    icon: ClipboardClock,
  },
  {
    value: 'published',
    label: 'Publish Now',
    description:
      'Immediately visible to attendees and open for ticket purchases.',
    icon: Rocket,
  },
];
