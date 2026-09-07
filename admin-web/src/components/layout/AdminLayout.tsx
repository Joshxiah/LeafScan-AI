/**
 * Shared shell for every admin page.
 *
 * Sidebar on the left, top bar across the top, page content
 * scrolling in the remaining space.
 */

import { type ReactNode } from 'react';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useNotifications } from '../../context/NotificationsContext';

interface AdminLayoutProps {
  title: string;
  children: ReactNode;
}

export function AdminLayout({ title, children }: AdminLayoutProps) {
  // Unread-reports badge on the Reports nav item, kept live by the
  // shared notifications context (one SSE connection for the shell).
  const { reportsUnreadCount } = useNotifications();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar unreadReports={reportsUnreadCount} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />

        {/* overflow-y-auto keeps the sidebar and top bar fixed
            while only this area scrolls. */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
