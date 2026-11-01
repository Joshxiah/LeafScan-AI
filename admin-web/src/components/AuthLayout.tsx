/**
 * Two-panel shell shared by the signed-out pages (sign-in and
 * forgot-password): green branding on the left (hidden on small
 * screens), the page's own form on the right.
 */

import type { ReactNode } from 'react';

import logo from '../assets/logo.png';
import { PartnerLogos, CopyrightLine } from './PartnerFooter';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* ---------- Left: branding ---------- */}
      <div className="hidden flex-1 flex-col justify-center bg-leaf-800 px-16 lg:flex">
        <img src={logo} alt="LeafScan AI" className="h-16 w-16 object-contain" />

        <h1 className="mt-8 text-4xl font-bold text-white">LeafScan AI</h1>

        <p className="mt-3 max-w-md text-lg text-leaf-200">
          Corn Leaf Disease Detection and Treatment Recommendation System
        </p>

        <p className="mt-1 text-sm text-leaf-300">
          City Agriculture Office · Pagadian City
        </p>

        <div className="mt-12 max-w-md border-t border-leaf-700 pt-8">
          <PartnerLogos />
          <CopyrightLine className="mt-4 text-[10px] text-leaf-400" />
        </div>
      </div>

      {/* ---------- Right: form ---------- */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Small-screen logo, since the left panel is hidden */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src={logo} alt="LeafScan AI" className="h-11 w-11 object-contain" />
            <div>
              <p className="text-base font-bold text-leaf-800">LeafScan AI</p>
              <p className="text-xs text-gray-500">Admin Platform</p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
