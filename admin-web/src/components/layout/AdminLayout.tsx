/**
 * Shared shell for every admin page.
 *
 * Sidebar on the left, top bar across the top, page content
 * scrolling in the remaining space.
 */

import { useEffect, useState, type ReactNode } from 'react';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { listReports } from '../../services/report.service';

interface AdminLayoutProps {
  title: string;
  children: ReactNode;
}

export function AdminLayout({ title, children }: AdminLayoutProps) {
  // A small, independent fetch just for the sidebar's pending-reports
  // badge, so every page gets it without threading the number through
  // each page's own data loading.
  const [pendingReports, setPendingReports] = useState<number | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    listReports({ status: 'pending', pageSize: 1 })
      .then((result) => {
        if (isMounted) setPendingReports(result.total);
      })
      .catch(() => {
        // A badge is a nice-to-have; a failed fetch just leaves it off.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar pendingReports={pendingReports} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />

        {/* overflow-y-auto keeps the sidebar and top bar fixed
            while only this area scrolls. */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
