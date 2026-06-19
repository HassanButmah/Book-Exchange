/**
 * navbar.js – Shared navigation component for every authenticated page.
 * Injects a consistent navbar with:
 *   - Logo
 *   - Nav links (shown only when authenticated)
 *   - User name display + dropdown (logout)
 *   - Mobile hamburger drawer
 *   - Auth guard + back-button security after logout
 */

(function () {
    'use strict';

    // ── helpers ──────────────────────────────────────────────────────────────

    function getUser() {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    }

    function getToken() { return localStorage.getItem('token'); }

    function currentPage() {
        return location.pathname.split('/').pop() || 'index.html';
    }

    // ── auth guard ───────────────────────────────────────────────────────────

    const PROTECTED = ['add-book.html', 'my-books.html', 'messages.html', 'edit-book.html', 'admin.html'];

    function guardAuth() {
        if (PROTECTED.includes(currentPage()) && !getToken()) {
            location.replace('login.html');
        }
    }

    // ── logout ───────────────────────────────────────────────────────────────

    window.logout = function () {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        // Replace current history entry so back-button skips authenticated pages
        history.replaceState(null, '', 'login.html');
        location.replace('login.html');
    };

    // ── toggle mobile menu ───────────────────────────────────────────────────

    window.toggleMenu = function () {
        const drawer = document.getElementById('navLinks');
        if (drawer) drawer.classList.toggle('open');
    };

    // ── toggle user dropdown ─────────────────────────────────────────────────

    window.toggleUserMenu = function (e) {
        e.stopPropagation();
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.classList.toggle('open');
    };

    // ── build HTML ───────────────────────────────────────────────────────────

    function buildNavbar() {
        const token = getToken();
        const user  = getUser();
        const page  = currentPage();

        // Pages that have their own completely different navbar (landing page)
        if (page === 'index.html' || page === 'login.html' || page === 'register.html') {
            // Still handle logout link if it exists on those pages
            document.querySelectorAll('[data-action="logout"]').forEach(el =>
                el.addEventListener('click', logout));
            return;
        }

    // ── SVG icons (Lucide-style) ─────────────────────────────────────────────
    const ICONS = {
        home:     `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        plus:     `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        book:     `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
        message:  `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
        shield:   `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        user:     `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        logout:   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
        menu:     `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
        books:    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
        chevron:  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
    };

    const links = [
            { href: 'marketplace.html', label: 'الرئيسية',    icon: ICONS.home,    authOnly: false, adminOnly: false },
            { href: 'add-book.html',    label: 'إضافة كتاب',  icon: ICONS.plus,    authOnly: true,  adminOnly: false },
            { href: 'my-books.html',    label: 'كتبي',         icon: ICONS.book,    authOnly: true,  adminOnly: false },
            { href: 'messages.html',    label: 'الرسائل',      icon: ICONS.message, authOnly: true,  adminOnly: false },
            { href: 'admin.html',       label: 'لوحة التحكم', icon: ICONS.shield,  authOnly: true,  adminOnly: true  },
        ];

        const navLinksHTML = links
            .filter(l => {
                if (l.adminOnly) return token && user?.role === 'admin';
                return !l.authOnly || token;
            })
            .map(l => `
                <li>
                    <a href="${l.href}" class="nav-link${page === l.href ? ' active' : ''}">
                        <span class="nav-icon">${l.icon}</span>${l.label}
                    </a>
                </li>`)
            .join('');

        // Desktop: show user info + dropdown. Mobile: user info inside drawer.
        const userSection = token && user ? `
            <!-- Desktop user menu -->
            <div class="nav-user-menu" id="navUserMenu">
                <button class="nav-user-btn" onclick="toggleUserMenu(event)" aria-haspopup="true" aria-expanded="false">
                    <span class="nav-user-avatar">${ICONS.user}</span>
                    <span class="nav-user-name">${escapeHtml(user.name)}</span>
                    <span class="nav-user-caret">${ICONS.chevron}</span>
                </button>
                <div class="nav-user-dropdown" id="userDropdown" role="menu">
                    <div class="nav-user-info">
                        <strong>${escapeHtml(user.name)}</strong>
                        <small>${escapeHtml(user.email)}</small>
                    </div>
                    <hr class="dropdown-divider">
                    <button class="dropdown-item logout-item" onclick="logout()" role="menuitem">
                        <span>${ICONS.logout}</span> تسجيل الخروج
                    </button>
                </div>
            </div>` : `
            <!-- Login link when not authenticated -->
            <a href="login.html" class="btn-nav btn-primary-nav nav-login-btn">تسجيل الدخول</a>`;

        // Mobile drawer logout row (only when authenticated)
        const mobileLogout = token && user ? `
            <li class="nav-mobile-user">
                <span class="nav-mobile-name">${ICONS.user} ${escapeHtml(user.name)}</span>
                <button class="btn-logout mobile-logout-btn" onclick="logout()">
                    ${ICONS.logout} تسجيل الخروج
                </button>
            </li>` : '';

        const navbar = document.createElement('nav');
        navbar.className = 'navbar';
        navbar.id = 'mainNavbar';
        navbar.innerHTML = `
            <div class="nav-container">
                <a href="marketplace.html" class="nav-logo">
                    <img src="images/hebron-logo.png" alt="شعار جامعة الخليل" class="nav-logo-img">
                    <span class="nav-logo-text">
                        <span class="nav-logo-university">جامعة الخليل</span>
                        <span class="nav-logo-platform">تبادل الكتب</span>
                    </span>
                </a>

                <!-- Mobile toggle -->
                <button class="menu-toggle" onclick="toggleMenu()" aria-label="فتح القائمة" aria-expanded="false">${ICONS.menu}</button>

                <!-- Links drawer -->
                <ul class="nav-links" id="navLinks">
                    ${navLinksHTML}
                    ${mobileLogout}
                </ul>

                <!-- Desktop user section -->
                ${userSection}
            </div>`;

        // Insert at top of <body> (before any existing nav)
        const existingNav = document.querySelector('nav.navbar');
        if (existingNav) {
            existingNav.replaceWith(navbar);
        } else {
            document.body.insertAdjacentElement('afterbegin', navbar);
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            document.getElementById('userDropdown')?.classList.remove('open');
            // Also close mobile drawer when clicking outside
            const drawer = document.getElementById('navLinks');
            if (drawer) drawer.classList.remove('open');
        });

        // Prevent drawer-internal clicks from closing it
        document.getElementById('navLinks')?.addEventListener('click', e => e.stopPropagation());
        document.getElementById('navUserMenu')?.addEventListener('click', e => e.stopPropagation());
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        }[m]));
    }

    // ── init ─────────────────────────────────────────────────────────────────

    function init() {
        guardAuth();
        buildNavbar();
        // Also update any legacy .auth-only elements for backward compatibility
        const token = getToken();
        document.querySelectorAll('.auth-only').forEach(el => {
            el.style.display = token ? '' : 'none';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
