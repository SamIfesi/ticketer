// Shown on EventDetailPage's right-side ticket panel column, below the
// ticket purchase card. Renders only if the organizer provided a contact
// phone and/or email when creating/editing the event — both fields are
// optional (see EventForm.jsx / CreateEventSteps.jsx StepBasicInfo).
//
// Usage:
//   <ContactOrganizerCard
//     phone={event.contact_phone}
//     email={event.contact_email}
//     organizerName={event.organizer_name}
//   />

import { Phone, Mail, MessageCircleQuestion } from 'lucide-react';

export default function ContactOrganizerCard({ phone, email, organizerName }) {
  if (!phone && !email) return null;

  return (
    <div className="bg-card border border-border rounded-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-btn bg-accent-text flex items-center justify-center shrink-0">
          <MessageCircleQuestion
            size={13}
            className="text-accent"
            strokeWidth={2}
          />
        </div>
        <h3 className="text-sm font-bold text-primary">
          Questions about this event?
        </h3>
      </div>

      <p className="text-xs text-secondary leading-relaxed mb-3">
        Reach out to {organizerName ? organizerName : 'the organizer'} directly
        for enquiries about tickets, accessibility, or anything else.
      </p>

      <div className="flex flex-col gap-2 md:flex-row">
        {phone && (
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="flex items-center gap-2.5 h-12 px-5 border border-border rounded-btn text-sm font-medium text-primary hover:border-accent/40 hover:text-accent transition-colors duration-150"
          >
            <Phone
              size={14}
              className="text-muted shrink-0"
              strokeWidth={1.75}
            />
            <span className="truncate">{phone}</span>
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2.5 h-12 px-5 border border-border rounded-btn text-sm font-medium text-primary hover:border-accent/40 hover:text-accent transition-colors duration-150"
          >
            <Mail
              size={14}
              className="text-muted shrink-0"
              strokeWidth={1.75}
            />
            <span className="truncate">{email}</span>
          </a>
        )}
      </div>
    </div>
  );
}
