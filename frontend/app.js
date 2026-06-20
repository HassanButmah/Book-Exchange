// ==================== CONFIGURATION ====================
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = IS_LOCAL ? 'http://localhost:5000/api' : '/api';
const BASE_URL = IS_LOCAL ? 'http://localhost:5000' : '';
function sanitizeImageUrl(url) {
    if (!url) return null;
    if (url.startsWith('data:image/')) return url;           // base64 data URLs ✓
    if (url.startsWith('https://') || url.startsWith('http://')) return url; // external URLs ✓
    if (url.startsWith('/')) return BASE_URL + url;          // local /uploads/ paths ✓
    return null;
}

// ==================== GLOBAL STATE ====================
let currentUser = null;
let currentPage = document.location.pathname.split('/').pop() || 'index.html';
let pendingUserId = null;
let verificationCode = null;



// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
    loadPageContent();
    updateNavbar();
});

function initializeApp() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
        try {
            currentUser = JSON.parse(userStr);
        } catch (err) {
            console.error('Invalid user data:', err);
            logout();
        }
    }
}

// ==================== PAGE DETECTION ====================
function getCurrentPage() {
    return document.location.pathname.split('/').pop() || 'index.html';
}

// ==================== AUTH STATUS ====================
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const page = getCurrentPage();

    const protectedPages = ['add-book.html', 'my-books.html', 'messages.html', 'edit-book.html', 'admin.html', 'marketplace.html', 'exchanges.html'];

    if (protectedPages.includes(page) && !token) {
        window.location.href = 'login.html';
    }
}

    // Update navigation
    updateNavigation();


function updateNavigation() {
    const token = localStorage.getItem('token');
    const addBookLink = document.getElementById('addBookLink');
    const myBooksLink = document.getElementById('myBooksLink');
    const messagesLink = document.getElementById('messagesLink');
    const logoutLink = document.getElementById('logoutLink');
    const loginLink = document.getElementById('loginLink');

    if (token) {
        if (addBookLink) addBookLink.classList.remove('hidden');
        if (myBooksLink) myBooksLink.classList.remove('hidden');
        if (messagesLink) messagesLink.classList.remove('hidden');
        if (logoutLink) logoutLink.classList.remove('hidden');
        if (loginLink) loginLink.classList.add('hidden');
    } else {
        if (addBookLink) addBookLink.classList.add('hidden');
        if (myBooksLink) myBooksLink.classList.add('hidden');
        if (messagesLink) messagesLink.classList.add('hidden');
        if (logoutLink) logoutLink.classList.add('hidden');
        if (loginLink) loginLink.classList.remove('hidden');
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    const page = getCurrentPage();

    if (page === 'login.html') {
        document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    }

    // NOTE: register.html has its own custom JavaScript handlers - don't add listeners here
    // if (page === 'register.html') { ... } ← Removed to avoid conflicts

    if (page === 'add-book.html') {
        document.getElementById('addBookForm')?.addEventListener('submit', handleAddBook);
        document.getElementById('bookImages')?.addEventListener('change', function() { previewSelectedImages(this); });
    }

    if (page === 'marketplace.html') {
        loadBooks();
        setupFilters();
        setupBookModal();
    }

    if (page === 'my-books.html') {
        loadMyBooks();
    }


    if (page === 'edit-book.html') {
        initEditBookPage();
    }

    if (page === 'admin.html') {
        initAdminPage();
    }

    document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

function loadPageContent() {
    const page = getCurrentPage();
    if (page === 'marketplace.html') loadBooks();
    if (page === 'my-books.html') loadMyBooks();
}


// ==================== REGISTRATION ====================
async function handleRegister(e) {
    e.preventDefault();

    // Support both old and new ID names
    const name = (document.getElementById('reg-name') || document.getElementById('name'))?.value;
    const email = (document.getElementById('reg-email') || document.getElementById('email'))?.value;
    const password = (document.getElementById('reg-pass') || document.getElementById('password'))?.value;

    if (!name || !email || !password) {
        showToast('⚠️ جميع الحقول مطلوبة', 'error');
        return;
    }

    const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) return showToast(data.error, 'error');

    pendingUserId = data.userId;
    showToast("✅ Check email for verification", "success");
}


async function handleVerification(e) {
    e.preventDefault();

    // Get code from OTP boxes (new) or verificationCode input (old)
    let code;
    const otpBoxes = document.querySelectorAll('.otp-box');
    if (otpBoxes.length > 0) {
        // New format: OTP boxes
        code = Array.from(otpBoxes).map(b => b.value).join('');
    } else {
        // Old format: single input
        code = document.getElementById('verificationCode')?.value;
    }

    if (!code || code.length < 6) {
        showToast('⚠️ أدخل الرمز كاملاً', 'error');
        return;
    }

    const res = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: pendingUserId, code })
    });

    const data = await res.json();

    if (!res.ok) return showToast(data.error, 'error');

    showToast('✅ تم التحقق بنجاح!', 'success');
    window.location.href = 'login.html';
}


// ==================== LOGIN ====================
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) return showToast(data.error, 'error');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    currentUser = data.user;

    window.location.href = 'marketplace.html';
}


// ==================== LOGOUT ====================
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    currentUser = null;
    // Replace history entry so the back button can't re-expose authenticated pages
    history.replaceState(null, '', 'index.html');
    location.replace('index.html');
}

// ==================== BOOKS ====================
async function loadBooks() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/books`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        if (!response.ok) throw new Error('Failed to load books');

        const books = await response.json();
        displayBooks(books);
    } catch (err) {
        console.error('Error loading books:', err);
        showToast('فشل تحميل الكتب', 'error');
        document.getElementById('booksGrid').innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><h2>لا توجد كتب متاحة</h2></div>';
    }
}

function displayBooks(books) {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;

    if (books.length === 0) {
        booksGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h2>لا توجد كتب متاحة</h2>
                <p>كن أول من يضيف كتاب!</p>
            </div>
        `;
        return;
    }

    booksGrid.innerHTML = books.filter(book => book.is_available).map(book => {
        const imgs = Array.isArray(book.images) && book.images.length > 0 ? book.images : (book.image_url ? [book.image_url] : []);
        const firstImg = imgs[0];
        const imgSrc = firstImg ? sanitizeImageUrl(firstImg) : null;
        const photoCount = imgs.length > 1 ? `<span class="photo-count-badge">📷 ${imgs.length}</span>` : '';
        return `
            <div class="book-card" data-book-id="${book.id}">
                <div class="book-image">
                    ${imgSrc ? `<img src="${imgSrc}" alt="${escapeHtml(book.title)}" onerror="this.style.display='none'">` : '<span class="book-emoji">📖</span>'}
                    ${photoCount}
                </div>
                <div class="book-card-content">
                    <div class="book-title">${escapeHtml(book.title)}</div>
                    <div class="book-meta">
                        <span class="badge ${book.condition === 'New' ? 'badge-new' : 'badge-used'}">
                            ${book.condition === 'New' ? 'جديد' : 'مستعمل'}
                        </span>
                    </div>
                    <div class="book-owner">من: ${escapeHtml(book.owner_name)}</div>
                </div>
            </div>
        `;
    }).join('');

    // Add click listeners
    document.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', () => {
            openBookModal(parseInt(card.dataset.bookId), books);
        });
    });
}

function setupBookModal() {
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            document.getElementById('bookModal').classList.add('hidden');
        });
    }

    document.addEventListener('click', (e) => {
        const modal = document.getElementById('bookModal');
        if (modal && e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

// ==================== CAROUSEL STATE ====================
let _carouselImages = [];
let _carouselIndex = 0;

function buildCarousel(images) {
    const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"%3E%3Crect fill="%23667eea" width="400" height="600"/%3E%3Ctext x="200" y="300" font-size="120" fill="white" text-anchor="middle"%3E%F0%9F%93%96%3C/text%3E%3C/svg%3E';
    _carouselImages = images.length > 0 ? images : [PLACEHOLDER];
    _carouselIndex = 0;

    const track = document.getElementById('carouselTrack');
    const dots = document.getElementById('carouselDots');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    track.innerHTML = _carouselImages.map((src, i) => `
        <div class="carousel-slide${i === 0 ? ' active' : ''}">
            <img src="${sanitizeImageUrl(src) || PLACEHOLDER}"
                 alt="صورة ${i + 1}"
                 onerror="this.src='${PLACEHOLDER}'">
        </div>
    `).join('');

    dots.innerHTML = _carouselImages.length > 1
        ? _carouselImages.map((_, i) => `<span class="carousel-dot${i === 0 ? ' active' : ''}" onclick="goToSlide(${i})"></span>`).join('')
        : '';

    // Hide arrows when only 1 image
    prevBtn.style.display = _carouselImages.length > 1 ? '' : 'none';
    nextBtn.style.display = _carouselImages.length > 1 ? '' : 'none';
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    slides[_carouselIndex]?.classList.remove('active');
    dots[_carouselIndex]?.classList.remove('active');
    _carouselIndex = (index + _carouselImages.length) % _carouselImages.length;
    slides[_carouselIndex]?.classList.add('active');
    dots[_carouselIndex]?.classList.add('active');
}

function carouselPrev() { goToSlide(_carouselIndex - 1); }
function carouselNext() { goToSlide(_carouselIndex + 1); }

function openBookModal(bookId, books) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    document.getElementById('bookTitle').textContent = book.title;
    document.getElementById('bookCondition').textContent = book.condition === 'New' ? 'جديد' : 'مستعمل';
    document.getElementById('bookCondition').className = `badge ${book.condition === 'New' ? 'badge-new' : 'badge-used'}`;
    document.getElementById('bookOwner').textContent = book.owner_name;
    document.getElementById('bookDescription').textContent = book.description;

    // Build carousel: prefer book_images, fall back to image_url
    const imgs = Array.isArray(book.images) && book.images.length > 0
        ? book.images
        : (book.image_url ? [book.image_url] : []);
    buildCarousel(imgs);

    // Show message button
    const token = localStorage.getItem('token');
    const actionsDiv = document.getElementById('exchangeActions');
    if (token && currentUser && currentUser.id !== book.owner_id) {
        actionsDiv.innerHTML = `
            <button class="btn btn-secondary" onclick="startMessageWithUser(${book.owner_id}, '${escapeHtml(book.owner_name)}', ${bookId})">📨 إرسال رسالة</button>
        `;
    } else if (!token) {
        actionsDiv.innerHTML = `<p style="color:#666;text-align:center;">يرجى <a href="login.html">تسجيل الدخول</a> للتواصل مع صاحب الكتاب</p>`;
    } else {
        actionsDiv.innerHTML = `<p style="color:#666;text-align:center;">هذا كتابك</p>`;
    }

    document.getElementById('bookModal').classList.remove('hidden');
}

// ==================== ADD BOOK ====================
async function handleAddBook(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        showToast('يرجى تسجيل الدخول أولاً', 'error');
        return;
    }

    const title       = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const condition   = document.getElementById('condition').value;
    const submitBtn   = document.getElementById('submitBookBtn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري الإضافة...';

    try {
        // Compress and convert selected files to base64
        const base64Images = [];
        for (const file of selectedFiles) {
            const compressed = await compressImage(file, 900, 0.78);
            base64Images.push(compressed);
        }

        // Single request with images embedded as base64
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ title, description, condition, images: base64Images }),
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || 'فشل إضافة الكتاب', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'إضافة الكتاب';
            return;
        }

        showToast('تم إضافة الكتاب بنجاح!', 'success');
        selectedFiles = [];
        setTimeout(() => { window.location.href = 'my-books.html'; }, 1000);
    } catch (err) {
        showToast('خطأ في الخادم', 'error');
        console.error(err);
        submitBtn.disabled = false;
        submitBtn.textContent = 'إضافة الكتاب';
    }
}

/**
 * Resize + compress an image file to JPEG via Canvas.
 * Keeps output well within Vercel's 4.5 MB body limit.
 * @param {File} file
 * @param {number} maxPx  – max width or height in pixels (default 900)
 * @param {number} quality – JPEG quality 0-1 (default 0.78)
 * @returns {Promise<string>} base64 data-URL
 */
function compressImage(file, maxPx = 900, quality = 0.78) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                let w = img.width, h = img.height;
                if (w > maxPx || h > maxPx) {
                    if (w >= h) { h = Math.round(h * maxPx / w); w = maxPx; }
                    else        { w = Math.round(w * maxPx / h); h = maxPx; }
                }
                const canvas = document.createElement('canvas');
                canvas.width  = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// ==================== IMAGE PREVIEW (with delete) ====================
let selectedFiles = []; // module-level array to track chosen files

function previewSelectedImages(input) {
    const grid = document.getElementById('imagePreviewGrid');
    if (!grid) return;

    // Merge new files into selectedFiles (avoid duplicates by name+size)
    Array.from(input.files).forEach(newFile => {
        const exists = selectedFiles.some(f => f.name === newFile.name && f.size === newFile.size);
        if (!exists) selectedFiles.push(newFile);
    });

    // Cap at 5
    if (selectedFiles.length > 5) {
        selectedFiles = selectedFiles.slice(0, 5);
        showToast('الحد الأقصى 5 صور فقط', 'info');
    }

    renderPreviewGrid(grid);

    // Reset input so same files can be re-selected if needed
    input.value = '';
}

function renderPreviewGrid(grid) {
    if (!grid) return;

    if (selectedFiles.length === 0) {
        grid.classList.add('hidden');
        grid.innerHTML = '';
        return;
    }

    grid.classList.remove('hidden');
    grid.innerHTML = selectedFiles.map((file, i) => {
        const url = URL.createObjectURL(file);
        return `
            <div class="preview-thumb" id="thumb-${i}">
                <img src="${url}" alt="صورة ${i + 1}">
                <span class="preview-num">${i + 1}</span>
                <button type="button" class="preview-delete" onclick="removeSelectedFile(${i})" title="حذف الصورة">✕</button>
            </div>
        `;
    }).join('');
}

function removeSelectedFile(index) {
    // Revoke the object URL to free memory
    const thumb = document.getElementById(`thumb-${index}`);
    const img = thumb?.querySelector('img');
    if (img?.src) URL.revokeObjectURL(img.src);

    selectedFiles.splice(index, 1);
    const grid = document.getElementById('imagePreviewGrid');
    renderPreviewGrid(grid);
}

// ==================== MY BOOKS ====================
async function loadMyBooks() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/books/user/my-books`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to load books');

        const books = await response.json();
        displayMyBooks(books);
    } catch (err) {
        console.error('Error loading my books:', err);
        showToast('Failed to load your books', 'error');
    }
}

function displayMyBooks(books) {
    const myBooksGrid = document.getElementById('myBooksGrid');
    if (!myBooksGrid) return;

    if (books.length === 0) {
        myBooksGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h2>لم تضف أي كتب بعد</h2>
                <p><a href="add-book.html" class="nav-link">أضف كتابك الأول</a></p>
            </div>
        `;
        return;
    }

    myBooksGrid.innerHTML = books.map(book => {
        const statusLabel = { available: 'متاح', reserved: 'محجوز', unavailable: 'غير متوفر' }[book.status] || (book.is_available ? 'متاح' : 'غير متوفر');
        const statusClass = { available: 'badge-available', reserved: 'badge-reserved', unavailable: 'badge-unavailable' }[book.status] || (book.is_available ? 'badge-available' : 'badge-unavailable');
        const visibilityNote = book.is_visible === false ? '<span style="color:#9ba3af;font-size:0.78rem;">👁️‍🗨️ مخفي عن العامة</span>' : '';
        const imgs = Array.isArray(book.images) && book.images.length > 0 ? book.images : (book.image_url ? [book.image_url] : []);
        const firstImg = imgs[0];
        const imgSrc = firstImg ? sanitizeImageUrl(firstImg) : null;
        const photoCount = imgs.length > 1 ? `<span class="photo-count-badge">📷 ${imgs.length}</span>` : '';
        return `
        <div class="book-card">
            <div class="book-image">
                ${imgSrc ? `<img src="${imgSrc}" alt="${escapeHtml(book.title)}" onerror="this.style.display='none'">` : '<span class="book-emoji">📖</span>'}
                ${photoCount}
            </div>
            <div class="book-card-content">
                <div class="book-title">${escapeHtml(book.title)}</div>
                <div class="book-meta">
                    <span class="badge ${book.condition === 'New' ? 'badge-new' : 'badge-used'}">
                        ${book.condition === 'New' ? 'جديد' : 'مستعمل'}
                    </span>
                    <span class="badge ${statusClass}">${statusLabel}</span>
                </div>
                ${visibilityNote}
                <div class="book-actions" style="margin-top:0.75rem;">
                    <button class="btn-edit" onclick="goToEditBook(${book.id})">✏️ تعديل</button>
                    <button class="btn btn-danger" onclick="deleteBook(${book.id})">حذف</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

async function deleteBook(bookId) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الكتاب؟')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to delete book');

        showToast('تم حذف الكتاب بنجاح', 'success');
        loadMyBooks();
    } catch (err) {
        showToast('فشل حذف الكتاب', 'error');
        console.error(err);
    }
}

// ==================== FILTERING ====================
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const conditionFilter = document.getElementById('conditionFilter');
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');

    [searchInput, conditionFilter, priceMin, priceMax].forEach(element => {
        if (element) {
            element.addEventListener('input', performSearch);
            element.addEventListener('change', performSearch);
        }
    });
}

async function performSearch() {
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const condition = document.getElementById('conditionFilter')?.value || '';

    const token = localStorage.getItem('token');
    const params = new URLSearchParams();

    if (searchTerm) params.append('q', searchTerm);
    if (condition) params.append('condition', condition);

    try {
        const response = await fetch(`${API_BASE_URL}/books/search?${params}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        if (!response.ok) throw new Error('Search failed');

        const books = await response.json();
        displayBooks(books);
    } catch (err) {
        console.error('Search error:', err);
    }
}

// ==================== UTILITIES ====================
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ==================== MESSAGING ====================
function startMessageWithUser(userId, userName, bookId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('يرجى تسجيل الدخول أولاً', 'error');
        return;
    }
    
    // Store the conversation info in sessionStorage for the messages page
    sessionStorage.setItem('selectedUserId', userId);
    sessionStorage.setItem('selectedUserName', userName);
    if (bookId) {
        sessionStorage.setItem('selectedBookId', bookId);
    }
    
    // Navigate to messages page
    window.location.href = 'messages.html';
}

// ==================== EXCHANGES ====================
async function showExchangeModal(bookRequestedId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Please login first', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/books/user/my-books`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to load user books');

        const userBooks = await response.json();
        
        if (userBooks.length === 0) {
            showToast('Add a book first before requesting exchanges', 'info');
            return;
        }

        // Create a modal for selecting which book to offer
        let modalHtml = `
            <div class="modal" id="exchangeSelectModal" style="display: block;">
                <div class="modal-content" style="max-width: 500px;">
                    <button class="modal-close" onclick="document.getElementById('exchangeSelectModal').remove()">&times;</button>
                    <h2>Select a book to offer in exchange</h2>
                    <div style="max-height: 400px; overflow-y: auto;">
        `;

        userBooks.forEach(book => {
            modalHtml += `
                <div style="padding: 10px; border: 1px solid #ddd; margin: 10px 0; border-radius: 5px; cursor: pointer;" onclick="submitExchange(${bookRequestedId}, ${book.id})">
                    <strong>${escapeHtml(book.title)}</strong>
                    <p style="margin: 5px 0; color: #666;">Condition: ${book.condition}</p>
                </div>
            `;
        });

        modalHtml += `
                    </div>
                </div>
            </div>
            <style>
                #exchangeSelectModal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('bookModal').classList.add('hidden');
    } catch (err) {
        console.error('Error loading user books:', err);
        showToast('Failed to load your books', 'error');
    }
}

async function submitExchange(bookRequestedId, bookOfferedId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Please login first', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/exchanges/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ bookRequestedId, bookOfferedId }),
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || 'فشل طلب التبادل', 'error');
            return;
        }

        showToast('تم إرسال طلب التبادل!', 'success');
        document.getElementById('exchangeSelectModal')?.remove();
        document.getElementById('bookModal').classList.add('hidden');
    } catch (err) {
        console.error('Error submitting exchange:', err);
        showToast('Server error', 'error');
    }
}

async function loadExchangesPage() {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('يرجى تسجيل الدخول أولاً', 'error');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/exchanges/`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to load exchanges');

        const exchanges = await response.json();
        displayExchanges(exchanges);
    } catch (err) {
        console.error('Error loading exchanges:', err);
        showToast('فشل تحميل طلبات التبادل', 'error');
    }
}

function displayExchanges(exchanges) {
    // Separate sent and received exchanges
    const sentExchanges = exchanges.filter(ex => ex.requester_id === currentUser.id);
    const receivedExchanges = exchanges.filter(ex => ex.receiver_id === currentUser.id);

    // Display pending exchanges
    const pendingDiv = document.getElementById('pendingExchanges');
    if (pendingDiv) {
        let pendingHtml = '';

        // Show sent requests
        sentExchanges.filter(ex => ex.status === 'pending').forEach(ex => {
            pendingHtml += `
                <div style="padding: 15px; border: 1px solid #ddd; margin: 10px 0; border-radius: 5px;">
                    <h3>عرضت: ${escapeHtml(ex.book_offered_title)}</h3>
                    <p><strong>مقابل:</strong> ${escapeHtml(ex.book_requested_title)}</p>
                    <p><strong>من:</strong> ${escapeHtml(ex.receiver_name)}</p>
                    <p style="color: #666; font-size: 0.9em;">الحالة: <span style="color: #ff9800;">معلق</span></p>
                    <button class="btn btn-danger" onclick="cancelExchange(${ex.id})" style="margin-top: 10px;">إلغاء الطلب</button>
                </div>
            `;
        });

        // Show received requests
        receivedExchanges.filter(ex => ex.status === 'pending').forEach(ex => {
            pendingHtml += `
                <div style="padding: 15px; border: 1px solid #ddd; margin: 10px 0; border-radius: 5px;">
                    <h3>${escapeHtml(ex.requester_name)} يريد: ${escapeHtml(ex.book_requested_title)}</h3>
                    <p><strong>يعرض:</strong> ${escapeHtml(ex.book_offered_title)}</p>
                    <p style="color: #666; font-size: 0.9em;">الحالة: <span style="color: #ff9800;">معلق</span></p>
                    <div style="margin-top: 10px;">
                        <button class="btn btn-primary" onclick="acceptExchange(${ex.id})" style="margin-right: 5px;">قبول</button>
                        <button class="btn btn-secondary" onclick="rejectExchange(${ex.id})">رفض</button>
                    </div>
                </div>
            `;
        });

        if (pendingHtml) {
            pendingDiv.innerHTML = pendingHtml;
        } else {
            pendingDiv.innerHTML = '<p style="text-align: center; color: #999;">لا توجد طلبات تبادل معلقة</p>';
        }
    }

    // Display completed/rejected exchanges
    const completedDiv = document.getElementById('completedExchanges');
    if (completedDiv) {
        let completedHtml = '';

        exchanges.filter(ex => ex.status !== 'pending').forEach(ex => {
            const isRequester = ex.requester_id === currentUser.id;
            completedHtml += `
                <div style="padding: 15px; border: 1px solid #ddd; margin: 10px 0; border-radius: 5px; opacity: 0.7;">
                    <h3>${isRequester ? 'عرضت' : 'تلقيت طلب لـ'}: ${escapeHtml(isRequester ? ex.book_offered_title : ex.book_requested_title)}</h3>
                    <p><strong>${isRequester ? 'مقابل' : 'مقابل'}:</strong> ${escapeHtml(isRequester ? ex.book_requested_title : ex.book_offered_title)}</p>
                    <p style="color: #666; font-size: 0.9em;">الحالة: <span style="color: ${ex.status === 'accepted' ? '#4caf50' : '#f44336'};">${ex.status === 'accepted' ? 'مقبول' : 'مرفوض'}</span></p>
                </div>
            `;
        });

        if (completedHtml) {
            completedDiv.innerHTML = completedHtml;
        } else {
            completedDiv.innerHTML = '<p style="text-align: center; color: #999;">لا توجد تبادلات مكتملة حتى الآن</p>';
        }
    }
}

async function acceptExchange(exchangeId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Please login first', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/exchanges/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ exchangeId }),
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || 'فشل قبول التبادل', 'error');
            return;
        }

        showToast('تم قبول التبادل!', 'success');
        loadExchangesPage(); // Reload the page
    } catch (err) {
        console.error('Error accepting exchange:', err);
        showToast('Server error', 'error');
    }
}

async function rejectExchange(exchangeId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Please login first', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/exchanges/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ exchangeId }),
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || 'فشل رفض التبادل', 'error');
            return;
        }

        showToast('تم رفض التبادل', 'success');
        loadExchangesPage(); // Reload the page
    } catch (err) {
        console.error('Error rejecting exchange:', err);
        showToast('Server error', 'error');
    }
}

async function cancelExchange(exchangeId) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/exchanges/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ exchangeId }),
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || 'فشل إلغاء التبادل', 'error');
            return;
        }

        showToast('تم إلغاء طلب التبادل', 'success');
        loadExchangesPage();

    } catch (err) {
        console.error('Error cancelling exchange:', err);
        showToast('Server error', 'error');
    }
}

function toggleMenu() {
    document.getElementById('navLinks')?.classList.toggle('open');
}

function updateNavbar() {
    // Navbar is now fully managed by navbar.js.
    // This stub is kept for backward compatibility with any direct callers.
    const token = localStorage.getItem('token');
    document.querySelectorAll('.auth-only').forEach(el => {
        el.style.display = token ? '' : 'none';
    });
}

const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");

if (messageInput) {
    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e);
        }
    });
}

if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
}
// ==================== CHATBOT ====================

function toggleChatbot() {
    const box = document.getElementById("chatbotBox");
    if (!box) return;
    box.classList.toggle("hidden");
}

async function sendChatbotMessage() {
    const input = document.getElementById("chatbotInput");
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    const messages = document.getElementById("chatbotMessages");
    if (!messages) return;

    messages.innerHTML += `<div class="user-msg">${escapeHtml(text)}</div>`;
    input.value = "";

    messages.innerHTML += `<div class="bot-msg" id="loading">⏳ جاري التفكير...</div>`;
    messages.scrollTop = messages.scrollHeight;

    const reply = await askGemma(text);
    const loading = document.getElementById("loading");
    if (loading) loading.remove();

    messages.innerHTML += `<div class="bot-msg">${escapeHtml(reply)}</div>`;
    messages.scrollTop = messages.scrollHeight;
}

async function askGemma(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: query })
        });

        if (!response.ok) {
            console.error('Chat API error:', response.status);
            return '🤖 عذراً، حدث خطأ في الخادم. حاول لاحقاً.';
        }

        const data = await response.json();
        return data.reply || data.response || '🤖 لم أستطع فهم سؤالك. حاول مرة أخرى.';
    } catch (err) {
        console.error('Chatbot error:', err);
        return '🤖 خطأ في الاتصال. تأكد من اتصالك بالإنترنت.';
    }
}

// ==================== EDIT BOOK PAGE ====================

/** Navigate to the edit page, carrying the book ID in the URL */
function goToEditBook(bookId) {
    window.location.href = `edit-book.html?id=${bookId}`;
}

/** Called on DOMContentLoaded when page === 'edit-book.html' */
let editSelectedFiles = [];

async function initEditBookPage() {
    const params  = new URLSearchParams(window.location.search);
    const bookId  = params.get('id');

    if (!bookId) {
        showToast('معرّف الكتاب مفقود', 'error');
        setTimeout(() => window.location.href = 'my-books.html', 1500);
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    // Load existing book data
    try {
        const res  = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Book not found or access denied');
        const book = await res.json();

        // Ensure the logged-in user owns the book
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (book.owner_id !== user.id && user.role !== 'admin') {
            showToast('ليس لديك صلاحية تعديل هذا الكتاب', 'error');
            setTimeout(() => window.location.href = 'my-books.html', 1500);
            return;
        }

        // Populate text fields
        document.getElementById('editTitle').value       = book.title       || '';
        document.getElementById('editDescription').value = book.description || '';
        document.getElementById('editCondition').value   = book.condition   || '';
        document.getElementById('editStatus').value      = book.status      || 'available';

        // Render existing images with delete buttons
        renderExistingImages(book.image_objects || [], bookId, token);

        updateStatusHint();

    } catch (err) {
        showToast('تعذّر تحميل بيانات الكتاب', 'error');
        console.error(err);
        return;
    }

    // New image selection
    document.getElementById('editBookImages')?.addEventListener('change', function() {
        Array.from(this.files).forEach(f => {
            if (editSelectedFiles.length < 5 &&
                !editSelectedFiles.some(x => x.name === f.name && x.size === f.size)) {
                editSelectedFiles.push(f);
            }
        });
        this.value = '';
        renderEditNewPreviews();
    });

    // Status dropdown
    document.getElementById('editStatus')?.addEventListener('change', updateStatusHint);

    // Form submit
    document.getElementById('editBookForm')?.addEventListener('submit', (e) => handleEditBook(e, bookId));
}

function renderExistingImages(imageObjects, bookId, token) {
    const grid = document.getElementById('existingImagesGrid');
    if (!grid) return;

    if (!imageObjects || imageObjects.length === 0) {
        grid.style.display = 'none';
        return;
    }

    grid.style.display = 'grid';
    grid.innerHTML = imageObjects.map(img => `
        <div class="image-preview-item" id="existing-img-${img.id}" style="position:relative">
            <img src="${sanitizeImageUrl(img.path) || img.path}" alt="صورة" style="width:100%;height:100%;object-fit:cover;border-radius:8px">
            <button type="button" class="remove-img-btn" onclick="deleteExistingImage(${img.id}, ${bookId})"
                style="position:absolute;top:4px;left:4px;background:#e53e3e;color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">
                ✕
            </button>
        </div>
    `).join('');
}

async function deleteExistingImage(imageId, bookId) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/books/${bookId}/images/${imageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            document.getElementById(`existing-img-${imageId}`)?.remove();
            showToast('تم حذف الصورة', 'success');
            // Hide grid if empty
            const grid = document.getElementById('existingImagesGrid');
            if (grid && grid.children.length === 0) grid.style.display = 'none';
        } else {
            showToast('فشل حذف الصورة', 'error');
        }
    } catch (err) {
        showToast('خطأ في الاتصال', 'error');
    }
}

function renderEditNewPreviews() {
    const grid = document.getElementById('editImagePreviewGrid');
    if (!grid) return;
    if (editSelectedFiles.length === 0) { grid.classList.add('hidden'); grid.innerHTML = ''; return; }
    grid.classList.remove('hidden');
    grid.innerHTML = editSelectedFiles.map((f, i) => `
        <div class="image-preview-item" style="position:relative">
            <img src="${URL.createObjectURL(f)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:8px">
            <button type="button" class="remove-img-btn" onclick="removeEditNewFile(${i})"
                style="position:absolute;top:4px;left:4px;background:#e53e3e;color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">
                ✕
            </button>
        </div>
    `).join('');
}

function removeEditNewFile(index) {
    editSelectedFiles.splice(index, 1);
    renderEditNewPreviews();
}

function updateStatusHint() {
    const status  = document.getElementById('editStatus')?.value;
    const warning = document.getElementById('unavailableWarning');
    const hint    = document.getElementById('statusHint');
    if (!status || !warning) return;

    const hints = {
        available:   'سيظهر الكتاب في صفحة تبادل الكتب ويمكن للجميع رؤيته.',
        reserved:    'سيُعرض الكتاب لكنه مُعلَّم كمحجوز – لن يُقبل طلبات تبادل جديدة.',
        unavailable: 'سيُخفى الكتاب فوراً من قائمة التبادل.',
    };
    if (hint) hint.textContent = hints[status] || '';

    if (status === 'unavailable') {
        warning.classList.remove('hidden');
    } else {
        warning.classList.add('hidden');
    }
}

async function handleEditBook(e, bookId) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    const title       = document.getElementById('editTitle').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const condition   = document.getElementById('editCondition').value;
    const status      = document.getElementById('editStatus').value;

    const submitBtn = document.getElementById('editSubmitBtn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'جاري الحفظ...'; }

    try {
        // Step 1: Save book metadata
        const res = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ title, description, condition, status }),
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || 'فشل تحديث الكتاب', 'error');
            return;
        }

        // Step 2: Upload any new images as base64
        if (editSelectedFiles.length > 0) {
            if (submitBtn) submitBtn.textContent = 'جاري رفع الصور...';
            const base64Images = [];
            for (const file of editSelectedFiles) {
                base64Images.push(await compressImage(file, 900, 0.78));
            }
            await fetch(`${API_BASE_URL}/books/${bookId}/images/base64`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ images: base64Images }),
            });
            editSelectedFiles = [];
        }

        const msg = status === 'unavailable'
            ? 'تم إخفاء الكتاب من قائمة التبادل بنجاح.'
            : 'تم تحديث الكتاب بنجاح!';

        showToast(msg, 'success');
        setTimeout(() => window.location.href = 'my-books.html', 1600);

    } catch (err) {
        showToast('خطأ في الخادم', 'error');
        console.error(err);
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'حفظ التعديلات'; }
    }
}


// ==================== ADMIN PAGE ====================

// ==================== ADMIN PAGE ====================
// Admin logic is now handled inline in admin.html.
// These stubs prevent errors if loadPageContent tries to call them.
let _adminAllBooks = [];
async function initAdminPage()   { /* handled by admin.html inline script */ }
async function loadAdminBooks()  { /* handled by admin.html inline script */ }
function renderAdminStats()      { /* handled by admin.html inline script */ }
function renderAdminTable()      { /* handled by admin.html inline script */ }
function filterAdminTable()      { /* handled by admin.html inline script */ }
async function adminChangeStatus()  { /* handled by admin.html inline script */ }
function adminDeleteBook()       { /* handled by admin.html inline script */ }
function closeAdminConfirm()     { /* handled by admin.html inline script */ }
async function confirmAdminDelete() { /* handled by admin.html inline script */ }

