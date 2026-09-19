import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { X, ArrowRight, Trash2, ShieldAlert } from 'lucide-react';
import { getNotificationMeta, resolveNotificationLink, isActionRequired } from '../../utils/notificationMeta';
import { formatShortDate, formatTime } from '../../utils/formatDate';
import Button from '../ui/Button';

export default function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onMarkRead,
  onDelete,
}) {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isOpen && notification && !notification.is_read) {
      onMarkRead?.(notification.id);
    }
  }, [isOpen, notification, onMarkRead]);

  if (!isOpen || !notification) return null;
  const { icon: Icon, color } = getNotificationMeta(notification.type);
  const link = resolveNotificationLink(notification);

  function handleViewRelated() {
    onClose();
    if (link) navigate(link);
  }

  return createPortal(
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-9990 bg-black/50 backdrop-blur-sm animate-[fadeIn_180ms_ease_forwards]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-9991 flex items-center justify-center px-4 py-8 pointer-events-none"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-card shadow-shadow-lg flex flex-col animate-[modalIn_220ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-btn flex items-center justify-center shrink-0"
                style={{ background: `${color}18` }}
              >
                <Icon size={18} strokeWidth={1.75} style={{ color }} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-primary leading-snug">
                  {notification.title}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {formatShortDate(notification.created_at)} ·{' '}
                  {formatTime(notification.created_at)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-btn text-muted hover:text-primary hover:bg-border transition-colors duration-150"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 flex flex-col gap-3">
            {isActionRequired(notification) && (
              <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/30 rounded-btn">
                <ShieldAlert size={14} className="text-error shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-error leading-snug">
                  Action required — funds were already paid out for this event
                  and are not recovered automatically.
                </p>
              </div>
            )}
            <p className="text-sm text-secondary leading-relaxed">
              {notification.body}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-3 border-t border-border">
            <button
              onClick={() => {
                onDelete?.(notification.id);
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-error hover:opacity-80 transition-opacity"
            >
              <Trash2 size={13} strokeWidth={2} />
              Delete
            </button>

            {link && (
              <Button
                variant="primary"
                size="sm"
                iconRight={<ArrowRight size={14} strokeWidth={2.5} />}
                onClick={handleViewRelated}
              >
                View details
              </Button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}