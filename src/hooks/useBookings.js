// useBookings — attendee booking flow and history.
//
// The Paystack flow works like this:
//   1. User clicks "Buy Ticket"
//   2. useBookings.initiateBooking() calls the backend → gets back
//      { reference, access_code, amount }
//   3. The BookingPage opens the Paystack popup using react-paystack
//      and passes the access_code
//   4. On popup success, Paystack calls our onSuccess callback with
//      the reference
//   5. useBookings.confirmPayment(reference) calls /bookings/verify
//      → backend confirms with Paystack → issues tickets
//
// The hook stores the pending booking details between steps 2 and 5
// in `pendingBooking` so the payment page has everything it needs.

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingsService from '../services/bookings.service';
import { useUiStore } from '../store/uiStore';

export function useBookings() {
  const navigate = useNavigate();
  const toastSuccess = useUiStore((state) => state.toastSuccess);
  const toastError = useUiStore((state) => state.toastError);

  // ── Booking list (history) ────────────────────────────────────
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // ── Single booking ────────────────────────────────────────────
  const [booking, setBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // ── Payment flow state ────────────────────────────────────────
  // Holds the data needed by the Paystack popup between step 2 and step 5.
  // Shape: { booking_id, reference, amount, access_code }
  const [pendingBooking, setPendingBooking] = useState(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState(null);

  // ── Step 1: Initiate booking ──────────────────────────────────
  // Creates a pending booking on the backend and stores the Paystack
  // details for the popup. Does NOT open the popup — the component does that.
  const initiateBooking = useCallback(
    async ({ ticketTypeId, quantity }) => {
      setPayLoading(true);
      setPayError(null);
      setPendingBooking(null);
      try {
        // step 1 check  for existing pending booking for this ticket type and quantity
        const resumeRes = await BookingsService.resumeBooking({
          ticketTypeId,
          quantity,
        });

        if (resumeRes.already_paid) {
          toastSuccess(
            'Your previous payment was confirmed. Your ticket is ready!'
          );
          navigate('/my-tickets');
          return null;
        }

        if (resumeRes.has_pending) {
          setPendingBooking(resumeRes);
          return resumeRes;
        }

        // step 2 No resumable booking - create new one
        const data = await BookingsService.createBooking({
          ticketTypeId,
          quantity,
        });

        // Free ticket — already issued, skip Paystack popup
        if (data.free) {
          toastSuccess('Your free ticket has been issued!');
          navigate(`/my-tickets`);
          return null;
        }

        setPendingBooking(data);
        return data;
      } catch (err) {
        const msg =
          err?.response?.data?.message ?? 'Could not initiate booking.';
        setPayError(msg);
        toastError(msg);
        return null;
      } finally {
        setPayLoading(false);
      }
    },
    [navigate, toastError, toastSuccess]
  );

  // ── Step 2: Confirm payment ───────────────────────────────────
  // Called from the Paystack popup's onSuccess callback.
  // Verifies the payment with the backend and redirects to success.
  const confirmPayment = useCallback(
    async (reference) => {
      setPayLoading(true);
      setPayError(null);
      try {
        const data = await BookingsService.verifyPayment(reference);
        setPendingBooking(null);
        toastSuccess('Payment confirmed! Your tickets have been issued.');
        // Navigate to the booking detail page so they can see their tickets
        navigate(`/bookings/${data.booking_id}`);
      } catch (err) {
        const msg =
          err?.response?.data?.message ?? 'Payment verification failed.';
        setPayError(msg);
        toastError(msg);
      } finally {
        setPayLoading(false);
      }
    },
    [navigate, toastError, toastSuccess]
  );

  // ── Called if the user closes the Paystack popup ──────────────
  function cancelPayment() {
    setPendingBooking(null);
    setPayError(null);
    toastError('Payment was cancelled.');
  }

  // ── Fetch booking history ─────────────────────────────────────
  const fetchMyBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const data = await BookingsService.getMyBookings();
      setBookings(data.bookings);
    } catch (err) {
      toastError(err?.response?.data?.message ?? 'Failed to load bookings.');
    } finally {
      setBookingsLoading(false);
    }
  }, [toastError]);

  // ── Fetch single booking (with tickets) ──────────────────────
  const fetchBooking = useCallback(
    async (id) => {
      setBookingLoading(true);
      try {
        const data = await BookingsService.getBooking(id);
        setBooking(data.booking);
      } catch (err) {
        toastError(err?.response?.data?.message ?? 'Booking not found.');
      } finally {
        setBookingLoading(false);
      }
    },
    [toastError]
  );

  return {
    // ── History
    bookings,
    bookingsLoading,
    fetchMyBookings,

    // ── Single booking
    booking,
    bookingLoading,
    fetchBooking,

    // ── Payment flow
    pendingBooking,
    payLoading,
    payError,
    initiateBooking,
    confirmPayment,
    cancelPayment,
  };
}
