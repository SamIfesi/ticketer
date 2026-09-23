import api from './api';

const TicketsService = {
  // ============================================================
  // ATTENDEE — view own tickets
  // ============================================================

  // GET /api/tickets/:id
  // Single ticket with QR code URL. Backend strips raw qr_token,
  // returns qr_code_url instead. Accessible to ticket owner,
  // event organizer, or dev.
  async getTicket(id) {
    const response = await api.get(`/tickets/${id}`);
    return response.data.data; // return {ticket} includes qr_code_url (raw token is stripped by backend)
  },

  // GET /api/tickets/booking/:bookingId
  // All tickets under one booking (e.g. user bought 3 at once).
  // Each ticket includes qr_code_url and status.
  async getTicketsByBooking(bookingId) {
    const response = await api.get(`/tickets/booking/${bookingId}`);
    return response.data.data; // return {tickets[]} - all tickets under one booking each with qr_code_url
  },

  // ============================================================
  // ATTENDEE — single-ticket file downloads (PDF + PNG)
  //
  // Every download is one ticket, one file. There is no
  // booking-level bulk/ZIP download — for a multi-ticket booking,
  // call downloadAllTickets() below, which downloads each ticket
  // one at a time.
  // ============================================================

  // GET /api/tickets/:id/download
  // Streams the server-generated PDF binary for a single ticket.
  // Must use responseType: 'blob' — Axios defaults to JSON.
  // Both PDF and PNG are generated together on the first request
  // for a booking, so downloading either format warms the cache
  // for every ticket under that booking.
  //
  // timeout is overridden to 100s here (the app-wide default is
  // 15s) because this specific request can trigger on-demand
  // generation server-side — the backend's PHP max_execution_time
  // is 120s for exactly that reason, so the old 15s axios timeout
  // was cutting the request off long before the server was actually
  // done, which is what made a fresh-payment download look broken.
  async downloadTicket(ticketId) {
    const response = await api.get(`/tickets/${ticketId}/download`, {
      responseType: 'blob',
      skipLoader: true,
      timeout: 100000,
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const disposition = response.headers['content-disposition'];
    let filename = 'ticket.pdf';
  
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) {
        filename = match[1];
      }
    }
  
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  },

  // GET /api/tickets/:id/download/png
  // Streams the server-generated PNG binary for a single ticket.
  // timeout overridden for the same reason as downloadTicket above.
  async downloadTicketPng(ticketId) {
    const response = await api.get(`/tickets/${ticketId}/download/png`, {
      responseType: 'blob',
      skipLoader: true,
      timeout: 100000,
    });

    const blob = new Blob([response.data], { type: 'image/png' });
    const url = window.URL.createObjectURL(blob);
  
    const disposition = response.headers['content-disposition'];
    let filename = 'ticket.png';
  
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) {
        filename = match[1];
      }
    }
  
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  },

  // Download every ticket under a booking, one at a time.
  // ticketIds: array of ticket id numbers.
  // format: 'pdf' | 'png'
  // A short delay between downloads avoids the browser silently
  // throttling/blocking a burst of same-tab downloads.
  async downloadAllTickets(ticketIds, format = 'pdf') {
    for (let i = 0; i < ticketIds.length; i++) {
      if (format === 'png') {
        await this.downloadTicketPng(ticketIds[i]);
      } else {
        await this.downloadTicket(ticketIds[i]);
      }
      if (i < ticketIds.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }
    return true;
  },

  // GET /api/bookings/:id/ticket/status
  // Check readiness for every ticket under a booking.
  // Returns:
  //   ticket_generated: bool         — true only if ALL tickets are ready
  //   tickets: [{ ticket_id, pdf_ready, png_ready }]
  // Use this before attempting a download to show a
  // "still generating…" state when the worker hasn't finished yet.
  async getTicketStatus(bookingId) {
    const response = await api.get(`/bookings/${bookingId}/ticket/status`, {
      skipLoader: true,
    });
    return response.data.data;
  },

  // ============================================================
  // ORGANIZER — gate check-in
  // ============================================================

  // POST /api/tickets/checkin
  // Called when organizer scans a QR code at the gate.
  // Parameters:
  //   qrToken: The QR code token
  //   dayNumber: The day number (optional, only for multi-day events)
  //   eventId: The event ID
  // Returns: { attendee_name, ticket_type, event_title, checked_in_at,
  //            checkin_mode, day_number?, days_used?, total_days? }
  // Backend errors are very descriptive (already used, not your event, etc.)
  async checkin(qrToken, dayNumber = null, eventId) {
    const body = { qr_token: qrToken, event_id: eventId };
    if (dayNumber !== null) body.day_number = dayNumber;

    const response = await api.post('/tickets/checkin', body);
    return response.data.data;
  },

  // GET /api/organizer/events/:eventId/checkins
  // Full check-in list + summary for an event.
  // ?day= only matters for multi_day events — defaults to day 1 on the backend.
  // Returns:
  //   summary: { total, checked_in, remaining }
  //   checkin_mode, checkin_days (event-level, so UI knows how to render the list)
  //   tickets: [{ id, is_used, used_at, attendee_name, attendee_email, ticket_type,
  //              days_used?, total_days? }]  (days_used/total_days only in multi_day mode)
  async getCheckinList(eventId, day = null) {
    const params = day ? { day } : {};
    const response = await api.get(`/organizer/events/${eventId}/checkins`, {
      params,
    });
    return response.data.data; // { summary, checkin_mode, checkin_days, tickets[] }
  },

  // ============================================================
  // ADMIN — ticket management
  // ============================================================

  // GET /api/admin/tickets/:id/download
  // Admin downloads any single ticket's PDF directly.
  // No ownership check — admin can access any ticket.
  async adminDownloadTicket(ticketId) {
    const response = await api.get(`/admin/tickets/${ticketId}/download`, {
      responseType: 'blob',
      skipLoader: true,
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
  
    const disposition = response.headers['content-disposition'];
    let filename = 'ticket.pdf';
  
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) {
        filename = match[1];
      }
    }
  
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  },

  // GET /api/admin/tickets/:id/download/png
  // Admin downloads any single ticket's PNG directly.
  async adminDownloadTicketPng(ticketId) {
    const response = await api.get(`/admin/tickets/${ticketId}/download/png`, {
      responseType: 'blob',
      skipLoader: true,
    });

    const blob = new Blob([response.data], { type: 'image/png' });
    const url = window.URL.createObjectURL(blob);
  
    const disposition = response.headers['content-disposition'];
    let filename = 'ticket.png';
  
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) {
        filename = match[1];
      }
    }
  
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  },

  // POST /api/bookings/:bookingId/ticket/regenerate
  // Force-regenerate every ticket (PDF + PNG) under a booking.
  // Useful after admin edits or when the cached version is stale.
  // Returns: { booking_id, ticket_ids[], file_count }
  async regenerateTicket(bookingId) {
    const response = await api.post(`/bookings/${bookingId}/ticket/regenerate`);
    return response.data.data;
  },

  // ============================================================
  // DEV — force actions (hidden from non-dev users)
  // ============================================================

  // GET /api/dev/bookings/failed
  // All failed and pending bookings — useful for debugging payment issues.
  // Returns: { bookings[] } each with paystack_reference, payment_status, etc.
  async devGetFailedBookings() {
    const response = await api.get('/dev/bookings/failed');
    return response.data.data; // { bookings[] }
  },

  // POST /api/dev/bookings/:bookingId/force-pay
  // Manually mark a booking as paid and issue tickets.
  // No real Paystack transaction — dev tool only.
  // Returns: { booking_id, tickets[] }
  async devForcePay(bookingId) {
    const response = await api.post(`/dev/bookings/${bookingId}/force-pay`);
    return response.data.data; // { booking_id, tickets[] }
  },
};

export default TicketsService;
