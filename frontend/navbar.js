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

        const links = [
            { href: 'marketplace.html', label: 'الرئيسية',      icon: '🏠', authOnly: false, adminOnly: false },
            { href: 'add-book.html',    label: 'إضافة كتاب',    icon: '➕', authOnly: true,  adminOnly: false },
            { href: 'my-books.html',    label: 'كتبي',           icon: '📖', authOnly: true,  adminOnly: false },
            { href: 'messages.html',    label: 'الرسائل',        icon: '💬', authOnly: true,  adminOnly: false },
            { href: 'admin.html',       label: 'لوحة التحكم',   icon: '🛡️', authOnly: true,  adminOnly: true  },
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
                    <span class="nav-user-avatar">👤</span>
                    <span class="nav-user-name">${escapeHtml(user.name)}</span>
                    <span class="nav-user-caret">▾</span>
                </button>
                <div class="nav-user-dropdown" id="userDropdown" role="menu">
                    <div class="nav-user-info">
                        <strong>${escapeHtml(user.name)}</strong>
                        <small>${escapeHtml(user.email)}</small>
                    </div>
                    <hr class="dropdown-divider">
                    <button class="dropdown-item logout-item" onclick="logout()" role="menuitem">
                        <span>🚪</span> تسجيل الخروج
                    </button>
                </div>
            </div>` : `
            <!-- Login link when not authenticated -->
            <a href="login.html" class="btn-nav btn-primary-nav nav-login-btn">تسجيل الدخول</a>`;

        // Mobile drawer logout row (only when authenticated)
        const mobileLogout = token && user ? `
            <li class="nav-mobile-user">
                <span class="nav-mobile-name">👤 ${escapeHtml(user.name)}</span>
                <button class="btn-logout mobile-logout-btn" onclick="logout()">
                    🚪 تسجيل الخروج
                </button>
            </li>` : '';

        const navbar = document.createElement('nav');
        navbar.className = 'navbar';
        navbar.id = 'mainNavbar';
        navbar.innerHTML = `
            <div class="nav-container">
                <a href="marketplace.html" class="nav-logo">
                    <span>📚</span>
                    <span>تبادل الكتب</span>
                </a>

                <!-- Mobile toggle -->
                <button class="menu-toggle" onclick="toggleMenu()" aria-label="فتح القائمة" aria-expanded="false">☰</button>

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
