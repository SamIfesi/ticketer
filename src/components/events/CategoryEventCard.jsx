import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { formatTime } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCategoryIcon } from '../../utils/categoryIcons';

// Compact card used inside a horizontally-scrolling category row.
// Fixed width + locked aspect-ratio banner so every card is identical
// regardless of how many sit in a row or what shape the source image is.
export default function CategoryEventCard({ event }) {
  const lowestPrice = (event.ticket_types ?? []).reduce((min, tt) => {
    const price = parseFloat(tt.price ?? 0);
    return min === null || price < min ? price : min;
  }, null);

  const categoryName = event.category_name;
  const Icon = getCategoryIcon(categoryName);

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group shrink-0 w-44 sm:w-52 lg:w-56 snap-start flex flex-col bg-card border border-border rounded-card overflow-hidden hover:border-accent/30 hover:shadow-md transition-all duration-200"
    >
      {/* Banner — fixed aspect box so every card is identical regardless
          of whether the source image is landscape or a tall portrait poster */}
      <div className="relative w-full aspect-4/3 bg-border overflow-hidden">
        {event.banner_image ? (
          <img
            src={event.banner_image}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-accent/20 to-accent/5">
            <span className="text-3xl font-black text-accent/30">
              {event.title?.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />

        {/* Category badge — top-left, matches the Featured Events pill style */}
        {categoryName && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium">
            <Icon size={10} strokeWidth={2} />
            {categoryName}
          </span>
        )}

        {/* Date pill — top-right so it never collides with the category badge */}
        {event.start_date && (
          <div className="absolute top-2.5 right-2.5 flex flex-col items-center justify-center w-11 h-11 bg-card/95 backdrop-blur-sm rounded-btn shadow-sm">
            <span className="text-[9px] font-bold text-error uppercase leading-none">
              {new Date(event.start_date).toLocaleDateString('en-NG', {
                month: 'short',
              })}
            </span>
            <span className="text-sm font-black text-primary leading-tight">
              {new Date(event.start_date).getDate()}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col gap-1.5">
        <p className="text-sm font-bold text-primary leading-snug line-clamp-2 min-h-10">
          {event.title}
        </p>

        {/* Always reserve this row's height — even with no location, so
            every card in the row stays the same total height */}
        <div className="flex items-center gap-1.5 text-xs text-secondary h-4">
          {event.location && (
            <>
              <MapPin size={11} className="text-muted shrink-0" />
              <span className="truncate">{event.location}</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-border h-7">
          <span className="text-[11px] text-muted">
            {event.start_date ? formatTime(event.start_date) : ''}
          </span>
          <span className="text-xs font-bold text-accent">
            {lowestPrice === null
              ? ''
              : lowestPrice === 0
                ? 'Free'
                : `From ${formatCurrency(lowestPrice)}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
