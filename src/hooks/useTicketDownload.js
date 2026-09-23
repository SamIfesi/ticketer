// useTicketDownload — all ticket download + management actions.
//
// Attendee:   downloadTicket(ticketId)      — PDF, one ticket
//             downloadTicketPng(ticketId)   — PNG, one ticket
//             downloadAllTickets(ticketIds) — sequential per-ticket loop
//             checkStatus(bookingId)        — poll readiness of every ticket under a booking
//             waitAndDownload(ticketId, bookingId) — poll then download a single ticket
//
// Organizer:  fetchCheckinList(eventId) — full attendee check-in list + summary
//             checkin(qrToken)          — submit scanned QR token at the gate
//
// Admin:      adminDownloadTicket(ticketId)    — download any single ticket's PDF
//             adminDownloadTicketPng(ticketId) — download any single ticket's PNG
//             regenerate(bookingId)            — force-clear cache and regenerate every ticket under a booking
//
// Dev:        devFetchFailed()   — list all failed/pending bookings
//             devForcePay()      — manually mark a booking as paid + issue tickets
//
// NOTE: there is no booking-level bulk download anymore. Every
// download call operates on a single ticket id. For a multi-ticket
// booking, use downloadAllTickets() to loop through them one at a time.

import { useState, useCallback } from 'react';
import TicketsService from '../services/tickets.service';
import { useUiStore } from '../store/uiStore';

export function useTicketDownload() {
  const toastSuccess = useUiStore((s) => s.toastSuccess);
  const toastError = useUiStore((s) => s.toastError);
  const toastInfo = useUiStore((s) => s.toastInfo);

  // ── Attendee download states ───────────────────────────────
  const [downloading, setDownloading] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isReady, setIsReady] = useState(null); // null=unknown true/false
  const [isPngReady, setIsPngReady] = useState(null);

  // ── Organizer check-in states ──────────────────────────────
  const [checkinList, setCheckinList] = useState(null);
  const [checkinListLoading, setCheckinListLoading] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);
  const [checkinError, setCheckinError] = useState(null);

  // ── Admin states ───────────────────────────────────────────
  const [adminDownloading, setAdminDownloading] = useState(false);
  const [adminDownloadingPng, setAdminDownloadingPng] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateResult, setRegenerateResult] = useState(null);

  // ── Dev states ─────────────────────────────────────────────
  const [failedBookings, setFailedBookings] = useState([]);
  const [failedBookingsLoading, setFailedBookingsLoading] = useState(false);
  const [forcePayLoading, setForcePayLoading] = useState(false);
  const [forcePayResult, setForcePayResult] = useState(null);

  // ============================================================
  // ATTENDEE
  // ============================================================

  // Check readiness for every ticket under a booking.
  // Returns { ticket_generated, tickets: [{ ticket_id, pdf_ready, png_ready }] }
  const checkStatus = useCallback(async (bookingId) => {
    setChecking(true);
    try {
      const data = await TicketsService.getTicketStatus(bookingId);
      setIsReady(data.ticket_generated);
      setIsPngReady(data.ticket_generated);
      return data;
    } catch {
      return { ticket_generated: false, tickets: [] };
    } finally {
      setChecking(false);
    }
  }, []);

  // Small sleep helper so the poll loop below is a real awaited
  // chain instead of a fire-and-forget setTimeout recursion (the old
  // version returned to its caller after the FIRST attempt, letting
  // callers flip `downloading` back to false while it kept silently
  // polling in the background — button looked idle mid-poll).
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Poll until a single ticket is ready then trigger its download.
  // Used right after payment when the worker may not have finished yet.
  // format: 'pdf' | 'png'
  //
  // maxWaitSeconds defaults to 110s — just over the PDF cron worker's
  // 2-minute cycle (job is queued with a 10s delay right at payment),
  // so a normal fresh-payment download almost always resolves inside
  // one poll window instead of needing a manual retry.
  const waitAndDownload = useCallback(
    async (ticketId, bookingId, format = 'pdf', maxWaitSeconds = 110) => {
      if (!ticketId || !bookingId) return toastError('Invalid ticket.');

      const isPng = format === 'png';
      isPng ? setDownloadingPng(true) : setDownloading(true);
      toastInfo(
        `Preparing your ticket ${isPng ? 'image' : 'PDF'}… this can take a little longer right after payment.`
      );

      const interval = 3000;
      const maxTries = Math.ceil((maxWaitSeconds * 1000) / interval);

      try {
        for (let tries = 0; tries < maxTries; tries++) {
          const status = await checkStatus(bookingId);
          const ticketStatus = status.tickets?.find(
            (t) => t.ticket_id === ticketId
          );
          const ready = isPng
            ? ticketStatus?.png_ready
            : ticketStatus?.pdf_ready;

          if (ready) {
            if (isPng) {
              await TicketsService.downloadTicketPng(ticketId);
            } else {
              await TicketsService.downloadTicket(ticketId);
            }
            toastSuccess('Ticket downloaded!');
            isPng ? setIsPngReady(true) : setIsReady(true);
            return;
          }

          if (tries < maxTries - 1) await sleep(interval);
        }

        // Timed out — this is a "not yet", not a hard failure, so
        // keep it informational rather than alarming.
        toastInfo('Ticket is still being generated. Try again in a moment.');
      } catch {
        toastError('Download failed. Please try again.');
      } finally {
        isPng ? setDownloadingPng(false) : setDownloading(false);
      }
    },
    [checkStatus, toastInfo, toastError, toastSuccess]
  );

  // A download error counts as "ticket isn't ready yet" (worth polling
  // for) rather than a hard failure whenever there's no clean 4xx from
  // the server telling us otherwise. In practice this is what actually
  // happens right after payment: the on-demand generation on the server
  // is slow enough to blow past the request timeout, so the browser
  // reports a timeout/network error with no `response` at all — not a
  // 404/400 — and that case was falling straight through to a scary
  // red "Download failed" instead of triggering the existing poll.
  function isRetryableDownloadError(err) {
    const status = err?.response?.status;
    if (!err?.response) return true; // timeout / network error / CORS abort
    if (status === 404 || status === 400 || status === 425) return true;
    if (status >= 500) return true; // generation blew up server-side mid-request
    return false; // e.g. 401/403 — a real permission problem, don't retry
  }

  // Direct single-ticket PDF download. Falls back to polling if not ready yet.
  const downloadTicket = useCallback(
    async (ticketId, bookingId) => {
      setDownloading(true);
      try {
        await TicketsService.downloadTicket(ticketId);
        toastSuccess('Ticket downloaded!');
      } catch (err) {
        if (bookingId && isRetryableDownloadError(err)) {
          await waitAndDownload(ticketId, bookingId, 'pdf');
        } else {
          toastError(
            err?.response?.data?.message ?? 'Download failed. Please try again.'
          );
        }
      } finally {
        setDownloading(false);
      }
    },
    [waitAndDownload, toastError, toastSuccess]
  );

  // Direct single-ticket PNG download. Falls back to polling if not ready yet.
  const downloadTicketPng = useCallback(
    async (ticketId, bookingId) => {
      setDownloadingPng(true);
      try {
        await TicketsService.downloadTicketPng(ticketId);
        toastSuccess('Ticket image downloaded!');
      } catch (err) {
        if (bookingId && isRetryableDownloadError(err)) {
          await waitAndDownload(ticketId, bookingId, 'png');
        } else {
          toastError(
            err?.response?.data?.message ?? 'Download failed. Please try again.'
          );
        }
      } finally {
        setDownloadingPng(false);
      }
    },
    [waitAndDownload, toastError, toastSuccess]
  );

  // Download every ticket in a booking, one at a time, with a short
  // pause between each so the browser doesn't throttle the burst.
  // ticketIds: array of ticket id numbers.
  const downloadAllTickets = useCallback(
    async (ticketIds, format = 'pdf') => {
      if (!ticketIds?.length) return;
      setDownloadingAll(true);
      try {
        await TicketsService.downloadAllTickets(ticketIds, format);
        toastSuccess(
          `${ticketIds.length} ticket${ticketIds.length !== 1 ? 's' : ''} downloaded!`
        );
      } catch (err) {
        toastError(
          err?.response?.data?.message ?? 'Some tickets failed to download.'
        );
      } finally {
        setDownloadingAll(false);
      }
    },
    [toastError, toastSuccess]
  );

  // ============================================================
  // ORGANIZER
  // ============================================================

  // Fetch the full check-in list + summary for an event.
  // day is only meaningful for multi_day events — omit for single-scan events.
  // Returns { summary, checkin_mode, checkin_days, tickets[] }
  const fetchCheckinList = useCallback(
    async (eventId, day = null) => {
      setCheckinListLoading(true);
      try {
        const data = await TicketsService.getCheckinList(eventId, day);
        setCheckinList(data);
        return data;
      } catch (err) {
        toastError(
          err?.response?.data?.message ?? 'Could not load check-in list.'
        );
        return null;
      } finally {
        setCheckinListLoading(false);
      }
    },
    [toastError]
  );

  // Submit a scanned QR token at the gate.
  // dayNumber only matters for multi_day events.
  // Stores result or error so the scanner UI can display it.
  const checkin = useCallback(
    async (qrToken, dayNumber = null, eventId) => {
      setCheckinLoading(true);
      setCheckinResult(null);
      setCheckinError(null);
      try {
        const data = await TicketsService.checkin(qrToken, dayNumber, eventId);
        setCheckinResult(data);
        const dayLabel =
          data.checkin_mode === 'multi_day'
            ? ` (Day ${data.day_number}/${data.total_days})`
            : '';
        toastSuccess(`✓ ${data.attendee_name} checked in.${dayLabel}`);
      } catch (err) {
        const msg = err?.response?.data?.message ?? 'Invalid ticket.';
        setCheckinError(msg);
        toastError(msg);
      } finally {
        setCheckinLoading(false);
      }
    },
    [toastError, toastSuccess]
  );

  function resetCheckin() {
    setCheckinResult(null);
    setCheckinError(null);
  }

  // ============================================================
  // ADMIN
  // ============================================================

  // Download any single ticket's PDF (no ownership check).
  const adminDownloadTicket = useCallback(
    async (ticketId) => {
      setAdminDownloading(true);
      try {
        await TicketsService.adminDownloadTicket(ticketId);
        toastSuccess('Ticket downloaded.');
      } catch (err) {
        toastError(
          err?.response?.data?.message ?? 'Download failed. Please try again.'
        );
      } finally {
        setAdminDownloading(false);
      }
    },
    [toastError, toastSuccess]
  );

  // Download any single ticket's PNG (no ownership check).
  const adminDownloadTicketPng = useCallback(
    async (ticketId) => {
      setAdminDownloadingPng(true);
      try {
        await TicketsService.adminDownloadTicketPng(ticketId);
        toastSuccess('Ticket image downloaded.');
      } catch (err) {
        toastError(
          err?.response?.data?.message ?? 'Download failed. Please try again.'
        );
      } finally {
        setAdminDownloadingPng(false);
      }
    },
    [toastError, toastSuccess]
  );

  // Force-clear the cache and regenerate every ticket (PDF + PNG)
  // under a booking.
  // Returns { booking_id, ticket_ids[], file_count }
  const regenerate = useCallback(
    async (bookingId) => {
      setRegenerating(true);
      setRegenerateResult(null);
      try {
        const data = await TicketsService.regenerateTicket(bookingId);
        setRegenerateResult(data);
        toastSuccess('Tickets regenerated successfully.');
        setIsReady(true);
        setIsPngReady(true);
        return data;
      } catch (err) {
        toastError(
          err?.response?.data?.message ??
            'Regeneration failed. Please try again.'
        );
        return null;
      } finally {
        setRegenerating(false);
      }
    },
    [toastError, toastSuccess]
  );

  // ============================================================
  // DEV
  // ============================================================

  // Fetch all failed and pending bookings for debugging.
  // Returns { bookings[] }
  const devFetchFailed = useCallback(async () => {
    setFailedBookingsLoading(true);
    try {
      const data = await TicketsService.devGetFailedBookings();
      setFailedBookings(data.bookings ?? []);
      return data;
    } catch (err) {
      toastError(
        err?.response?.data?.message ?? 'Could not load failed bookings.'
      );
      return null;
    } finally {
      setFailedBookingsLoading(false);
    }
  }, [toastError]);

  // Manually mark a booking as paid and issue tickets.
  // No real Paystack transaction — dev tool only.
  // Returns { booking_id, tickets[] }
  const devForcePay = useCallback(
    async (bookingId) => {
      setForcePayLoading(true);
      setForcePayResult(null);
      try {
        const data = await TicketsService.devForcePay(bookingId);
        setForcePayResult(data);
        toastSuccess(`Booking #${bookingId} force-paid. Tickets issued.`);
        return data;
      } catch (err) {
        toastError(
          err?.response?.data?.message ?? 'Force pay failed. Please try again.'
        );
        return null;
      } finally {
        setForcePayLoading(false);
      }
    },
    [toastError, toastSuccess]
  );

  // ============================================================
  // RETURN
  // ============================================================
  return {
    // ── Attendee ─────────────────────────────────────────────
    downloading,
    downloadingPng,
    downloadingAll,
    checking,
    isReady,
    isPngReady,
    checkStatus,
    downloadTicket,
    downloadTicketPng,
    downloadAllTickets,
    waitAndDownload,

    // ── Organizer ─────────────────────────────────────────────
    checkinList,
    checkinListLoading,
    fetchCheckinList,
    checkinLoading,
    checkinResult,
    checkinError,
    checkin,
    resetCheckin,

    // ── Admin ─────────────────────────────────────────────────
    adminDownloading,
    adminDownloadingPng,
    adminDownloadTicket,
    adminDownloadTicketPng,
    regenerating,
    regenerateResult,
    regenerate,

    // ── Dev ───────────────────────────────────────────────────
    failedBookings,
    failedBookingsLoading,
    devFetchFailed,
    forcePayLoading,
    forcePayResult,
    devForcePay,
  };
}
