'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '🏠', section: 'MENU UTAMA' },
    { href: '/data-alumni', label: 'Data Alumni', icon: '📋', section: 'MENU UTAMA' },
    { href: '/hasil-pelacakan', label: 'Hasil Pelacakan', icon: '🔍', section: 'PELACAKAN' },
  ];

  let currentSection = '';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🎓</div>
        <div>
          <h1>Alumni Tracker</h1>
          <span>UMM - Admin Panel</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const showSection = item.section !== currentSection;
          if (showSection) currentSection = item.section;

          return (
            <div key={item.href}>
              {showSection && (
                <div className="sidebar-section-title">{item.section}</div>
              )}
              <Link
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </Link>
            </div>
          );
        })}

        <div className="sidebar-section-title" style={{ marginTop: 24 }}>AKUN</div>
        <button
          onClick={logout}
          className="sidebar-link"
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <span className="sidebar-link-icon">🚪</span>
          Logout
        </button>
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 11, opacity: 0.5 }}>
        © 2026 UMM Alumni Tracker
      </div>
    </aside>
  );
}
