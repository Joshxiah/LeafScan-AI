/**
 * Partner logos, office name and copyright line.
 *
 * Shared by the sidebar and the login page so both show the same
 * credits.
 */

import wmsuLogo from '../assets/wmsu.png';
import esuLogo from '../assets/wmsu-esu.png';
import bscsLogo from '../assets/wmsu-bscs.png';
import caoLogo from '../assets/cao.png';

const DEVELOPERS = ['Realyn Joy T. Danong', 'Virlyn G. Sandialan', 'Jhoana Marie S. Sumalpong'];

const LOGO_CLASS = 'h-10 w-10 rounded-full bg-white object-cover';

export function PartnerLogos({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src={wmsuLogo} alt="Western Mindanao State University" className={LOGO_CLASS} />
      <img src={esuLogo} alt="WMSU External Studies" className={LOGO_CLASS} />
      <img src={bscsLogo} alt="WMSU Computer Science" className={LOGO_CLASS} />
      <img src={caoLogo} alt="City Agriculture Office" className={LOGO_CLASS} />
    </div>
  );
}

export function CopyrightLine({ className = '' }: { className?: string }) {
  return (
    <p className={className}>
      © {new Date().getFullYear()} LeafScan AI · {DEVELOPERS.slice(0, -1).join(', ')}, and{' '}
      {DEVELOPERS[DEVELOPERS.length - 1]}. All rights reserved.
    </p>
  );
}
