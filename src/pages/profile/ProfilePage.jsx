import { useEffect, useState } from 'react';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  Moon,
  Sun,
  Monitor,
  LogOut,
  Ticket,
  BookOpen,
  Bell,
  Gavel,
} from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import ProfileHeader from '../../components/profile/ProfileHeader';
import SettingsGroup from '../../components/profile/SettingsGroup';
import SettingsItem from '../../components/profile/SettingsItem';

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const { profile, profileLoading, fetchProfile } = useProfile();
  const { logout } = useAuth();
  const { theme, resolvedTheme } = useThemeStore();

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user, fetchProfile]);

  const ThemeIcon =
    theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;
  const themeSubtitle =
    theme === 'system'
      ? `Following device setting · ${resolvedTheme}`
      : theme === 'dark'
        ? 'Always use dark theme'
        : 'Always use light theme';
  const themeIconColor =
    theme === 'system' ? '#2563eb' : theme === 'dark' ? '#8b5cf6' : '#f59e0b';

  return (
    <div className="flex flex-col min-h-screen bg-main-bg">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
            My Profile
          </h1>
          <p className="text-sm text-secondary mt-1">
            Manage your account and preferences.
          </p>
        </div>

        <div className="mb-6">
          <ProfileHeader
            profile={profile}
            user={user}
            loading={profileLoading}
          />
        </div>

        <div className="flex flex-col gap-5">
          <SettingsGroup title="Activity">
            <SettingsItem
              icon={BookOpen}
              iconColor="#2563eb"
              label="My Bookings"
              subtitle="View all your event bookings"
              to="/my-bookings"
            />
            <SettingsItem
              icon={Ticket}
              iconColor="#f59e0b"
              label="My Tickets"
              subtitle="Your QR entry passes"
              to="/my-tickets"
            />
            <SettingsItem
              icon={Bell}
              iconColor="#046307"
              label="Notifications"
              subtitle="View your recent notifications"
              to="/notifications"
            />
          </SettingsGroup>

          <SettingsGroup title="Account">
            <SettingsItem
              icon={User}
              iconColor="#10b981"
              label="Edit Profile"
              subtitle="Update your name and avatar"
              to="/profile/edit"
            />
            <SettingsItem
              icon={Lock}
              iconColor="#8b5cf6"
              label="Change Password"
              subtitle="Keep your account secure"
              to="/profile/change-password"
            />
            <SettingsItem
              icon={Mail}
              iconColor="#06b6d4"
              label="Change Email"
              subtitle={profile?.email ?? user?.email ?? '—'}
              to="/profile/change-email"
            />
          </SettingsGroup>

          <SettingsGroup title="Legal">
            <SettingsItem
              icon={Gavel}
              iconColor="#10b981"
              label="Legal & Privacy"
              subtitle="View our terms of service and privacy policy"
              to="/legal"
            />
          </SettingsGroup>

          <SettingsGroup title="Preferences">
            <SettingsItem
              icon={ThemeIcon}
              iconColor={themeIconColor}
              label="Theme"
              subtitle={themeSubtitle}
              to="/theme"
            />
          </SettingsGroup>

          <SettingsGroup title="Security">
            <SettingsItem
              icon={ShieldCheck}
              iconColor="#22c55e"
              label="Security Center"
              subtitle="Manage login sessions and activity"
              to="/profile/security"
            />
          </SettingsGroup>

          <SettingsGroup>
            <SettingsItem
              icon={LogOut}
              iconColor="#ef4444"
              label="Sign Out"
              danger
              onClick={logout}
              right={<span />}
            />
          </SettingsGroup>

          <p className="text-center text-xs text-muted pb-4">
            Ticketer · Version 1.0.1
          </p>
        </div>
      </main>
    </div>
  );
}
