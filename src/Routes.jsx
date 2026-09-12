import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { getDefaultPath } from './utils/roleGuard';
import { ROLES } from './config/constants';

import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';

// Terms of Service and Privacy Policy
const TermsPage = lazy(() => import('./pages/public/TermsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/public/PrivacyPolicyPage'));
const LegalPage = lazy(() => import('./pages/public/LegalPage'));
const RefundPolicyPage = lazy(() => import('./pages/public/RefundPolicyPage'));

// auth Pages
const LoginPage = lazy(() => import('./pages/public/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/public/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPasswordPage'));
const ResetPassworPage = lazy(() => import('./pages/public/ResetPasswordPage'));
const VerifyOtpPage = lazy(() => import('./pages/public/VerifyOtpPage'));
const OnboardingPage = lazy(() => import('./pages/public/OnboardingPage.jsx'));

// ── Page imports ──────────────────────────────────────────────────────────────
// public
const HomePage = lazy(() => import('./pages/public/HomePage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const HowItWorksPage = lazy(() => import('./pages/public/HowItWorksPage'));
const EventsPage = lazy(() => import('./pages/public/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/public/EventDetailPage'));
const UnauthorizedPage = lazy(() => import('./pages/public/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'));
const ThemePage = lazy(() => import('./pages/public/ThemePage'));

// attendee
const AttendeeDashboard = lazy(() => import('./pages/attendee/AttendeeDashboard'));
const MyBookingsPage = lazy(() => import('./pages/attendee/MyBookingsPage'));
const BookingDetailPage = lazy(() => import('./pages/attendee/BookingDetailPage'));
const BecomeOrganizerPage = lazy(() => import('./pages/attendee/BecomeOrganizerPage'));
const MyTicketsPage = lazy(() => import('./pages/attendee/MyTicketsPage'));

//profile
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const EditProfilePage = lazy(() => import('./pages/profile/EditProfilePage'));
const ChangePasswordPage = lazy(() => import('./pages/profile/ChangePasswordPage'));
const ChangeEmailPage = lazy(() => import('./pages/profile/ChangeEmailPage'));
const TicketDetailPage = lazy(() => import('./pages/attendee/TicketDetailPage'));

// organizer
const OrganizerDashboard = lazy(() => import('./pages/organizer/OrganizerDashboard'));
const ManageEventsPage = lazy(() => import('./pages/organizer/ManageEventsPage'));
const CreateEventPage = lazy(() => import('./pages/organizer/CreateEventPage'));
const EditEventPage = lazy(() => import('./pages/organizer/EditEventPage'));
const EventBookingsPage = lazy(() => import('./pages/organizer/EventBookingsPage'));
const CheckinPage = lazy(() => import('./pages/organizer/CheckinPage'));
const OrganizerEventDetailPage = lazy(() => import('./pages/organizer/OrganizerEventDetailPage'));

// admin
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AdminEventsPage = lazy(() => import('./pages/admin/AdminEventsPage'));
const AdminUserDetailPage = lazy(() => import('./pages/admin/AdminUserDetailPage'));
const OrgApplicationsPage = lazy(() => import('./pages/admin/OrgApplicationsPage'));

// payment
const PaymentCallbackPage = lazy(() => import('./pages/payment/PaymentCallbackPage'));
import Spinner from './components/loaders/Spinner';

// ── NEW IMPORTS ───────────────────────────────────────────────
const NotificationsPage = lazy(() => import('./pages/public/NotificationsPage'));
const MyTransactionsPage = lazy(() => import('./pages/attendee/MyTransactionsPage'));
const OrganizerPaymentPage = lazy(() => import('./pages/organizer/OrganizerPaymentPage'));
const OrganizerTransactionsPage = lazy(() => import('./pages/organizer/OrganizerTransactionsPage'));
const AdminTransactionsPage = lazy(() => import('./pages/admin/AdminTransactionsPage'));
const AdminPayoutsPage = lazy(() => import('./pages/admin/AdminPayoutsPage'));

function RootRedirect() {
  const token = useAuthStore((state) => state.token);
  const isVerified = useAuthStore((state) => state.isVerified);
  const user = useAuthStore((state) => state.user);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const hasSeenOnboarding = localStorage.getItem('onboarding_seen');

  if (!_hasHydrated) return null;

  if (!token) {
    return hasSeenOnboarding ? (
      <Navigate to="/home" replace />
    ) : (
      <Navigate to="/onboarding" replace />
    );
  }
  if (!isVerified) return <Navigate to="/verify-email" replace />;
  return <Navigate to={getDefaultPath(user?.role)} replace />;
}

function GuestOnly({ children }) {
  const token = useAuthStore((state) => state.token);
  const isVerified = useAuthStore((state) => state.isVerified);
  const user = useAuthStore((state) => state.user);

  if (!token) return children;
  if (!isVerified) return <Navigate to="/verify-email" replace />;
  return <Navigate to={getDefaultPath(user?.role)} replace />;
}

// AppRoutes
export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size={35} className="text-accent" />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        {/* Onboarding */}
        <Route
          path="/onboarding"
          element={
            <GuestOnly>
              <OnboardingPage />
            </GuestOnly>
          }
        />

        {/* Legal pages */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />

        {/* Public */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/theme" element={<ThemePage />} />

        {/* Auth — guest only */}
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnly>
              <RegisterPage />
            </GuestOnly>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestOnly>
              <ForgotPasswordPage />
            </GuestOnly>
          }
        />
        <Route
          path="/verify-otp"
          element={
            <GuestOnly>
              <VerifyOtpPage />
            </GuestOnly>
          }
        />
        <Route
          path="/reset-password"
          element={
            <GuestOnly>
              <ResetPassworPage />
            </GuestOnly>
          }
        />

        {/* Verify email — needs token but not verified */}
        <Route
          path="/verify-email"
          element={
            <ProtectedRoute requireVerified={false}>
              <VerifyEmailPage />
            </ProtectedRoute>
          }
        />

        {/* Attendee */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AttendeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:id"
          element={
            <ProtectedRoute>
              <BookingDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/become-organizer"
          element={
            <ProtectedRoute>
              <BecomeOrganizerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-tickets"
          element={
            <ProtectedRoute>
              <MyTicketsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ticket/:id"
          element={
            <ProtectedRoute>
              <TicketDetailPage />
            </ProtectedRoute>
          }
        />

        {/* ── NEW: All logged-in users ── */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-transactions"
          element={
            <ProtectedRoute>
              <MyTransactionsPage />
            </ProtectedRoute>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <EditProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/change-email"
          element={
            <ProtectedRoute>
              <ChangeEmailPage />
            </ProtectedRoute>
          }
        />

        {/* Organizer */}
        <Route
          path="/organizer/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ORGANIZER, ROLES.ADMIN, ROLES.DEV]}>
                <OrganizerDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ORGANIZER, ROLES.ADMIN, ROLES.DEV]}>
                <ManageEventsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:slug"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ORGANIZER, ROLES.ADMIN, ROLES.DEV]}>
                <OrganizerEventDetailPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/create/event"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ORGANIZER, ROLES.ADMIN, ROLES.DEV]}>
                <CreateEventPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:slug/edit"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ORGANIZER, ROLES.ADMIN, ROLES.DEV]}>
                <EditEventPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:slug/bookings"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ORGANIZER, ROLES.ADMIN, ROLES.DEV]}>
                <EventBookingsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:slug/checkin"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ORGANIZER, ROLES.ADMIN, ROLES.DEV]}>
                <CheckinPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* ── Organizer PAYMENTS only ── */}
        <Route
          path="/organizer/payment-details"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ORGANIZER, ROLES.DEV, ROLES.ADMIN]}>
                <OrganizerPaymentPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/transactions"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ORGANIZER, ROLES.DEV, ROLES.ADMIN]}>
                <OrganizerTransactionsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ADMIN, ROLES.DEV]}>
                <AdminDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ADMIN, ROLES.DEV]}>
                <UsersPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ADMIN, ROLES.DEV]}>
                <AdminUserDetailPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ADMIN, ROLES.DEV]}>
                <AdminEventsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/organizer/applications"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ADMIN, ROLES.DEV]}>
                <OrgApplicationsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* ── NEW: Admin only ── */}
        <Route
          path="/admin/transactions"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ADMIN, ROLES.DEV]}>
                <AdminTransactionsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payouts"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLES.ADMIN, ROLES.DEV]}>
                <AdminPayoutsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Payment */}
        <Route
          path="/payment/callback"
          element={
            <ProtectedRoute>
              <PaymentCallbackPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
