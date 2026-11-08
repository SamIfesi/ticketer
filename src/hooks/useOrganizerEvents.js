// useOrganizerEvents — organizer-scoped event management.
//
// Covers: myEvents, single event fetch, create, update, delete,
// eventBookings, checkinList.
// Assumes the consuming component is already behind ProtectedRoute + RoleRoute.
// This hook does not re-check roles — that is the route layer's job.

import { useState, useCallback } from 'react';
import { useUiStore } from '../store/uiStore';
import OrganizerService from '../services/organizer.service';

export function useOrganizerEvents() {
  const toastSuccess = useUiStore((state) => state.toastSuccess);
  const toastError = useUiStore((state) => state.toastError);

  // ── My events list ────────────────────────────────────────────
  const [myEvents, setMyEvents] = useState([]);
  const [myEventsLoading, setMyEventsLoading] = useState(false);
  const [myEventsError, setMyEventsError] = useState(null);

  // ── Single event detail (for edit/manage page) ────────────────
  // NEW: separate from myEvents — loaded via slug or id from the URL.
  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState(null);

  // ── Mutation state ─────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Bookings for an event ─────────────────────────────────────
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // ── Check-in list ─────────────────────────────────────────────
  const [checkinData, setCheckinData] = useState(null); // { summary, tickets[] }
  const [checkinLoading, setCheckinLoading] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────
  const resetErrors = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  const extractError = useCallback((err) => {
    const data = err?.response?.data;

    if (data?.errors) {
      setFieldErrors(data.errors);

      // Extract real messages
      const messages = Object.values(data.errors);
      const combined = messages.join('\n');

      setError(combined);
      return combined;
    }

    const msg = data?.message ?? 'Something went wrong. Please try again.';

    setError(msg);
    return msg;
  }, []);

  // ── Fetch my events (list) ────────────────────────────────────
  const fetchMyEvents = useCallback(async () => {
    setMyEventsLoading(true);
    setMyEventsError(null);
    try {
      const data = await OrganizerService.getMyEvents();
      setMyEvents(data.events ?? []);
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to load your events.';
      setMyEventsError(msg);
      toastError(msg);
    } finally {
      setMyEventsLoading(false);
    }
  }, [toastError]);

  // ── Fetch a single event — accepts slug OR numeric id ─────────
  // Use this on edit/manage pages. The returned event.id is the
  // trusted numeric id — use it for updateEvent/deleteEvent/etc.
  const fetchMyEvent = useCallback(
    async (slugOrId) => {
      setEventLoading(true);
      setEventError(null);
      try {
        const data = await OrganizerService.getMyEvent(slugOrId);
        setEvent(data.event);
        return data.event;
      } catch (err) {
        const msg = err?.response?.data?.message ?? 'Event not found.';
        setEventError(msg);
        toastError(msg);
      } finally {
        setEventLoading(false);
      }
    },
    [toastError]
  );

  // ── Create event ──────────────────────────────────────────────
  // eventData shape: { title, description, location, category_id,
  //                    start_date, end_date, total_tickets, status,
  //                    banner_image, ticket_types[] }
  const createEvent = useCallback(
    async (eventData, { onSuccess } = {}) => {
      setLoading(true);
      resetErrors();

      try {
        const data = await OrganizerService.createEvent(eventData);

        toastSuccess('Event created successfully!');

        onSuccess?.(data.event);

        // Re-fetch because the server created a new record.
        await fetchMyEvents();
      } catch (err) {
        toastError(extractError(err));
      } finally {
        setLoading(false);
      }
    },
    [fetchMyEvents, resetErrors, extractError, toastSuccess, toastError]
  );

  // ── Update event ─────────────────────────────────────────────
  // `id` MUST be the numeric event.id — never a slug.
  const updateEvent = useCallback(
    async (id, eventData, { onSuccess, onPriceConfirm } = {}) => {
      setLoading(true);
      resetErrors();

      try {
        const data = await OrganizerService.updateEvent(id, eventData);

        toastSuccess('Event updated successfully!');

        // Patch local list state, if this event is in it.
        setMyEvents((prev) =>
          prev.map((e) => (e.id === id ? { ...e, ...data.event } : e))
        );

        // Patch single-event state, if this is the currently loaded event.
        setEvent((prev) =>
          prev && prev.id === id ? { ...prev, ...data.event } : prev
        );

        onSuccess?.(data.event);
      } catch (err) {
        const data = err?.response?.data;
        if (
          err?.response?.status === 409 &&
          data?.code === 'PRICE_CHANGE_CONFIRMATION_REQUIRED'
        ) {
          onPriceConfirm?.(data.price_changes ?? []);
          return;
        }
        toastError(extractError(err));
      } finally {
        setLoading(false);
      }
    },
    [resetErrors, extractError, toastSuccess, toastError]
  );

  // ── Delete event ─────────────────────────────────────────────
  // `id` MUST be the numeric event.id — never a slug.
  const deleteEvent = useCallback(
    async (id, { onSuccess } = {}) => {
      setLoading(true);
      resetErrors();

      try {
        await OrganizerService.deleteEvent(id);

        toastSuccess('Event cancelled.');

        // Remove locally instead of re-fetching.
        setMyEvents((prev) => prev.filter((e) => e.id !== id));

        onSuccess?.();
      } catch (err) {
        toastError(extractError(err));
      } finally {
        setLoading(false);
      }
    },
    [resetErrors, extractError, toastSuccess, toastError]
  );

  // ── Fetch event bookings ─────────────────────────────────────
  // eventId MUST be numeric — this backend route is not slug-aware.
  const fetchEventBookings = useCallback(
    async (eventId) => {
      setBookingsLoading(true);

      try {
        const data = await OrganizerService.getEventBookings(eventId);

        setBookings(data.bookings ?? []);
      } catch (err) {
        toastError(err?.response?.data?.message ?? 'Failed to load bookings.');
      } finally {
        setBookingsLoading(false);
      }
    },
    [toastError]
  );

  // ── Fetch check-in list ──────────────────────────────────────
  // eventId MUST be numeric — this backend route is not slug-aware.
  // day is only meaningful for multi_day events.
  const fetchCheckinList = useCallback(
    async (eventId, day = null) => {
      setCheckinLoading(true);

      try {
        const data = await OrganizerService.getCheckinList(eventId, day);

        setCheckinData(data);
      } catch (err) {
        toastError(
          err?.response?.data?.message ?? 'Failed to load check-in list.'
        );
      } finally {
        setCheckinLoading(false);
      }
    },
    [toastError]
  );

  return {
    // ── My events (list)
    myEvents,
    myEventsLoading,
    myEventsError,
    fetchMyEvents,

    // ── Single event (edit/manage page)
    event,
    eventLoading,
    eventError,
    fetchMyEvent,

    // ── Mutations
    loading,
    error,
    fieldErrors,
    createEvent,
    updateEvent,
    deleteEvent,

    // ── Event bookings
    bookings,
    bookingsLoading,
    fetchEventBookings,

    // ── Check-in
    checkinData,
    checkinLoading,
    fetchCheckinList,
  };
}
