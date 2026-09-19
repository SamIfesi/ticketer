import { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  QrCode,
  AlertCircle,
  CalendarDays,
  Ticket,
  AlertTriangle,
  Banknote,
  Lock,
  ShieldCheck,
  ShieldX,
  UserX,
  Flag,
  CreditCard,
  Trash2,
  CheckCheck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotification';
import { formateRelativeTime } from '../../utils/formatDate';
import { isActionRequired } from '../../utils/notificationMeta';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import NotificationDetailModal from '../../components/notifications/NotificationDetailModal';
import Footer from '../../components/layout/Footer';

const TYPE_ICONS = {
  booking_confirmed: { icon: CheckCircle2, color: '#22c55e' },
  booking_failed: { icon: XCircle, color: '#ef4444' },
  ticket_checkin: { icon: QrCode, color: '#2563eb' },
  event_cancelled: { icon: AlertCircle, color: '#ef4444' },
  event_updated: { icon: CalendarDays, color: '#f59e0b' },
  new_booking: { icon: Ticket, color: '#10b981' },
  low_tickets: { icon: AlertTriangle, color: '#f59e0b' },
  payout_sent: { icon: Banknote, color: '#22c55e' },
  payout_failed: { icon: XCircle, color: '#ef4444' },
  payout_frozen: { icon: Lock, color: '#f59e0b' },
  organizer_approved: { icon: ShieldCheck, color: '#22c55e' },
  organizer_rejected: { icon: ShieldX, color: '#ef4444' },
  role_changed: { icon: ShieldCheck, color: '#2563eb' },
  account_deactivated: { icon: UserX, color: '#ef4444' },
  account_flagged: { icon: Flag, color: '#ef4444' },
  bank_details_required: { icon: CreditCard, color: '#f59e0b' },
  admin_payout_failed: { icon: AlertCircle, color: '#ef4444' },
  admin_organizer_flagged: { icon: Flag, color: '#f59e0b' },
  admin_payout_sent: { icon: Banknote, color: '#22c55e' },
  dev_payout_sent: { icon: Banknote, color: '#22c55e' },
  admin_payout_clawback_needed: { icon: ShieldAlert, color: '#ef4444' },
};

function NotificationSkeleton() {
  return (
    <div className="bg-card border border-border rounded-card p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-btn bg-border shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 bg-border rounded w-2/3" />
          <div className="h-3 bg-border rounded w-full" />
          <div className="h-3 bg-border rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

function NotificationCard({ notification, onOpen, onDelete }) {
  const [hovered, setHovered] = useState(false);

  const typeConfig = TYPE_ICONS[notification.type] ?? {
    icon: Bell,
    color: '#2563eb',
  };
  const Icon = typeConfig.icon;
  const actionRequired = isActionRequired(notification);

  function handleClick() {
    onOpen(notification);
  }

  return (
    <div
      className={`relative bg-card border rounded-card px-2 py-3 md:p-4 transition-all duration-150 cursor-pointer group overflow-hidden ${
        actionRequired
        ? 'border-error/50 bg-error/5 hover:shadow-md'
        : notification.is_read
          ? 'border-border hover:border-accent/30 hover:shadow-sm'
          : 'border-accent/30 bg-accent-text/30 hover:shadow-md'
      }`}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Unread dot */}
      {actionRequired ? (
        <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-card bg-error" />
      ) : (
        !notification.is_read && (
          <span className="absolute left-0 top-0 bottom-0 w-0.75 rounded-l-card bg-accent" />
        )
      )}

      <div className="flex items-start gap-1 pl-1">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-btn flex items-center justify-center shrink-0 mr-2"
          style={{ background: `${typeConfig.color}18` }}
        >
          <Icon
            size={17}
            strokeWidth={1.75}
            style={{ color: typeConfig.color }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {actionRequired && (
            <span className="inline-flex items-center gap-1 mb-1 px-2 py-0.5 rounded-full bg-error text-white text-[10px] font-bold uppercase tracking-wide">
              <ShieldAlert size={10} strokeWidth={2.5} /> Action required
            </span>
          )}
          <p
            className={`text-[11px] leading-snug ${notification.is_read ? 'text-primary font-medium' : 'text-primary font-bold'}`}
          >
            {notification.title}
          </p>
          <p className="text-xs text-secondary mt-1 leading-relaxed line-clamp-2">
            {notification.body}
          </p>
          <p className="text-[11px] text-muted mt-1.5">
            {formateRelativeTime(notification.created_at)}
          </p>
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className={`w-8 h-8 flex items-center justify-center rounded-btn transition-all duration-150 shrink-0 ${
            hovered ? 'opacity-100' : 'opacity-70'
          }`}
          aria-label="Delete notification"
        >
          <Trash2
            size={14}
            strokeWidth={2}
            className="text-muted hover:text-error hover:bg-error/10 transition-all duration-150"
          />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const {
    notifications,
    pagination,
    notificationsLoading,
    fetchNotifications,
    unreadCount,
    mutating,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications({
      page: currentPage,
      ...(filter === 'unread' ? { unread: 1 } : {}),
    });
  }, [filter, currentPage, fetchNotifications]);

  async function handleMarkAllRead() {
    await markAllRead();
    fetchNotifications({ page: currentPage });
  }

  function handlePageChange(page) {
    setCurrentPage(page);
  }

  function handleFilterChange(newFilter) {
    setFilter(newFilter);
    setCurrentPage(1);
  }

  return (
    <div className="flex flex-col min-h-screen bg-main-bg">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-error text-white text-xs font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <p className="text-sm text-secondary">
              Stay up to date with your bookings, events, and account.
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={<CheckCheck size={15} />}
              loading={mutating}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Action-required banner — clawback alerts must not blend into the feed */}
        {notifications.some(isActionRequired) && (
          <div className="flex items-start gap-3 p-4 mb-6 bg-error/10 border border-error/30 rounded-card">
            <ShieldAlert size={18} className="text-error shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-error">
                Payout clawback needed
              </p>
              <p className="text-xs text-secondary mt-0.5 leading-relaxed">
                {notifications.filter(isActionRequired).length} cancelled{' '}
                {notifications.filter(isActionRequired).length === 1
                  ? 'event has'
                  : 'events have'}{' '}
                money that already left the platform. It is not recovered
                automatically — follow up with the organizer directly.
              </p>
              <Link
                to="/admin/payouts"
                className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-error hover:underline"
              >
                Review payouts <ArrowRight size={12} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        )}

        {/* Filter pills */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { value: 'all', label: 'All' },
            {
              value: 'unread',
              label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`,
            },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`h-9 px-4 rounded-btn text-xs font-semibold border transition-colors ${
                filter === f.value
                  ? 'bg-accent text-white border-accent'
                  : 'bg-card text-secondary border-border hover:text-primary hover:border-accent/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {notificationsLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <>
            <div className="flex flex-col gap-3">
              {notifications.map((n) => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onOpen={setSelectedNotification}
                  onDelete={deleteNotification}
                />
              ))}
            </div>

            {pagination?.total_pages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.total_pages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
            <div className="w-16 h-16 rounded-card bg-accent-text border border-accent-border flex items-center justify-center">
              <Bell size={28} strokeWidth={1.5} className="text-accent" />
            </div>
            <div>
              <p className="font-bold text-primary text-lg">
                {filter === 'unread'
                  ? 'All caught up!'
                  : 'No notifications yet'}
              </p>
              <p className="text-sm text-secondary mt-1 max-w-xs">
                {filter === 'unread'
                  ? 'You have no unread notifications.'
                  : "You'll see updates about your bookings, events, and account here."}
              </p>
            </div>
            {filter === 'unread' && (
              <button
                onClick={() => handleFilterChange('all')}
                className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
              >
                View all notifications
              </button>
            )}
          </div>
        )}
      </main>

      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
        onMarkRead={markRead}
        onDelete={(id) => {
          deleteNotification(id);
          setSelectedNotification(null); // Close modal after deletion
        }}
      />
      <Footer variant="minimal" />
    </div>
  );
}
