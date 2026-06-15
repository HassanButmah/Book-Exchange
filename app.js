// ==================== APP STATE ====================
const app = {
    currentUser: null,
    books: [],
    selectedBook: null,
    isVerifying: false,
};


// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    initializeEventListeners();
    checkAuthStatus();
    setupPageNavigation();
    setupMobileMenu();
});

// ==================== LOCAL STORAGE ====================
function saveToLocalStorage() {
    localStorage.setItem('users', JSON.stringify(window.users || []));
    localStorage.setItem('currentUser', JSON.stringify(app.currentUser));
    localStorage.setItem('books', JSON.stringify(app.books));
}

function loadFromLocalStorage() {
    window.users = JSON.parse(localStorage.getItem('users')) || [];
    app.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    app.books = JSON.parse(localStorage.getItem('books')) || [];
}

// ==================== AUTHENTICATION ====================
function checkAuthStatus() {
    if (!app.currentUser) {
        showPage('loginPage');
        showNavbar(false);
    } else {
        showPage('homePage');
        showNavbar(true);
        loadBooks();
    }
}

// ==================== PAGE MANAGEMENT ====================
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Scroll to top
    window.scrollTo(0, 0);
}

function showNavbar(show) {
    const navbar = document.getElementById('navbar');
    if (show) {
        navbar.style.display = 'flex';
    } else {
        navbar.style.display = 'none';
    }
}

// ==================== PAGE NAVIGATION ====================
function setupPageNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page') + 'Page';
            showPage(pageId);
            document.getElementById('navMenu').classList.remove('active');
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('cancelAddBook').addEventListener('click', () => {
        showPage('homePage');
    });
}

// ==================== MOBILE MENU ====================
function setupMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar-container')) {
            navMenu.classList.remove('active');
        }
    });
}

// ==================== LOGIN & REGISTER ====================
function validateUniversityEmail(email) {
    return email.endsWith('@students.hebron.edu');
}

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

document.getElementById('switchToRegister').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('registerPage');
});

document.getElementById('switchToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('loginPage');
});

// LOGIN FORM
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (!validateUniversityEmail(email)) {
        showToast('Email must end with @students.hebron.edu', 'error');
        return;
    }

    // Find user
    const user = window.users.find(u => u.email === email && u.password === password);

    if (!user) {
        showToast('Invalid email or password', 'error');
        return;
    }

    // Login successful
    app.currentUser = user;
    saveToLocalStorage();
    showToast('Login successful!', 'success');
    
    setTimeout(() => {
        showPage('homePage');
        showNavbar(true);
        loadBooks();
        document.getElementById('loginForm').reset();
    }, 500);
});

// REGISTER FORM
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirm').value;

    if (!name || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (!validateUniversityEmail(email)) {
        showToast('Email must end with @students.hebron.edu', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    // Check if email already exists
    if (window.users.find(u => u.email === email)) {
        showToast('Email already registered', 'error');
        return;
    }

    // Store verification code temporarily
    window.verificationEmail = email;
    window.verificationCode = generateVerificationCode();
    window.newUserData = { name, email, password };

    // Show verification modal
    app.isVerifying = true;
    document.getElementById('verificationModal').classList.add('active');
});

// EMAIL VERIFICATION
document.getElementById('verificationForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const code = document.getElementById('verificationCode').value;

    if (code !== window.verificationCode) {
        showToast('Invalid verification code', 'error');
        return;
    }

    // Create user account
    const newUser = {
        id: Date.now(),
        name: window.newUserData.name,
        email: window.newUserData.email,
        password: window.newUserData.password,
    };

    window.users.push(newUser);
    app.currentUser = newUser;
    saveToLocalStorage();

    showToast('Registration successful!', 'success');

    // Clean up
    document.getElementById('verificationModal').classList.remove('active');
    document.getElementById('verificationForm').reset();
    window.verificationEmail = null;
    window.verificationCode = null;
    window.newUserData = null;

    setTimeout(() => {
        showPage('homePage');
        showNavbar(true);
        loadBooks();
        document.getElementById('registerForm').reset();
    }, 500);
});

document.getElementById('closeVerification').addEventListener('click', () => {
    document.getElementById('verificationModal').classList.remove('active');
    document.getElementById('verificationForm').reset();
});

// ==================== LOGOUT ====================
function logout() {
    app.currentUser = null;
    app.books = [];
    app.selectedBook = null;
    localStorage.removeItem('currentUser');
    saveToLocalStorage();
    showToast('Logged out successfully', 'success');
    
    setTimeout(() => {
        showPage('loginPage');
        showNavbar(false);
        document.getElementById('loginForm').reset();
    }, 500);
}

// ==================== BOOK MANAGEMENT ====================
function loadBooks() {
    displayBooks(app.books);
}

function displayBooks(books) {
    const grid = document.getElementById('booksGrid');
    const emptyState = document.getElementById('emptyState');

    if (books.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h2>No books available</h2>
                <p>Be the first to add a book!</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = books.map(book => `
        <div class="book-card" onclick="openBookModal(${book.id})">
            <div class="book-image">
                ${book.image ? `<img src="${book.image}" alt="${book.title}" onerror="this.style.display='none'">` : '📖'}
            </div>
            <div class="book-card-content">
                <div class="book-title">${escapeHtml(book.title)}</div>
                <div class="book-price">${book.price} ILS</div>
                <div class="book-meta">
                    <span class="badge ${book.condition === 'New' ? 'badge-new' : 'badge-used'}">
                        ${book.condition}
                    </span>
                </div>
                <div class="book-owner">by ${escapeHtml(book.ownerName)}</div>
            </div>
        </div>
    `).join('');
}

function displayMyBooks() {
    const grid = document.getElementById('myBooksGrid');
    const myBooks = app.books.filter(b => b.ownerId === app.currentUser.id);

    if (myBooks.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h2>You haven't added any books yet</h2>
                <p><a href="#" class="nav-link" data-page="add-book">Add your first book</a></p>
            </div>
        `;
        return;
    }

    grid.innerHTML = myBooks.map(book => `
        <div class="book-card">
            <div class="book-image">
                ${book.image ? `<img src="${book.image}" alt="${book.title}" onerror="this.style.display='none'">` : '📖'}
            </div>
            <div class="book-card-content">
                <div class="book-title">${escapeHtml(book.title)}</div>
                <div class="book-price">${book.price} ILS</div>
                <div class="book-meta">
                    <span class="badge ${book.condition === 'New' ? 'badge-new' : 'badge-used'}">
                        ${book.condition}
                    </span>
                </div>
                <div class="book-actions">
                    <button class="btn btn-secondary" onclick="deleteBook(${book.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ADD BOOK FORM
document.getElementById('addBookForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('bookTitle').value.trim();
    const description = document.getElementById('bookDescription').value.trim();
    const price = parseFloat(document.getElementById('bookPrice').value);
    const condition = document.getElementById('bookCondition').value;
    const image = document.getElementById('bookImage').value.trim();

    if (!title || !description || !price || !condition) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    if (price < 0) {
        showToast('Price cannot be negative', 'error');
        return;
    }

    const newBook = {
        id: Date.now(),
        title,
        description,
        price,
        condition,
        image: image || null,
        ownerId: app.currentUser.id,
        ownerName: app.currentUser.name,
        createdAt: new Date().toISOString(),
    };

    app.books.push(newBook);
    saveToLocalStorage();
    showToast('Book added successfully!', 'success');

    document.getElementById('addBookForm').reset();
    setTimeout(() => {
        showPage('homePage');
        loadBooks();
    }, 500);
});

function deleteBook(bookId) {
    if (confirm('Are you sure you want to delete this book?')) {
        app.books = app.books.filter(b => b.id !== bookId);
        saveToLocalStorage();
        showToast('Book deleted', 'success');
        displayMyBooks();
    }
}

// ==================== BOOK MODAL ====================
function openBookModal(bookId) {
    const book = app.books.find(b => b.id === bookId);
    if (!book) return;

    app.selectedBook = book;

    document.getElementById('modalBookImage').src = book.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"%3E%3Crect fill="%23667eea" width="200" height="300"/%3E%3Ctext x="50" y="150" font-size="80" fill="white" text-anchor="middle"%3E📖%3C/text%3E%3C/svg%3E';
    document.getElementById('modalBookTitle').textContent = book.title;
    document.getElementById('modalPrice').textContent = `${book.price} ILS`;
    document.getElementById('modalCondition').textContent = book.condition;
    document.getElementById('modalCondition').className = `badge ${book.condition === 'New' ? 'badge-new' : 'badge-used'}`;
    document.getElementById('modalOwner').textContent = book.ownerName;
    document.getElementById('modalDescription').textContent = book.description;

    document.getElementById('bookModal').classList.add('active');
}

document.getElementById('closeBookModal').addEventListener('click', () => {
    document.getElementById('bookModal').classList.remove('active');
});

document.getElementById('contactBtn').addEventListener('click', () => {
    document.getElementById('bookModal').classList.remove('active');
    document.getElementById('ownerName').textContent = app.selectedBook.ownerName;
    document.getElementById('contactModal').classList.add('active');
});

document.getElementById('closeContactModal').addEventListener('click', () => {
    document.getElementById('contactModal').classList.remove('active');
});

document.getElementById('closeContactBtn').addEventListener('click', () => {
    document.getElementById('contactModal').classList.remove('active');
});

// Close modals when clicking outside
document.getElementById('bookModal').addEventListener('click', (e) => {
    if (e.target.id === 'bookModal') {
        document.getElementById('bookModal').classList.remove('active');
    }
});

document.getElementById('contactModal').addEventListener('click', (e) => {
    if (e.target.id === 'contactModal') {
        document.getElementById('contactModal').classList.remove('active');
    }
});

document.getElementById('verificationModal').addEventListener('click', (e) => {
    if (e.target.id === 'verificationModal') {
        document.getElementById('verificationModal').classList.remove('active');
    }
});

// ==================== FILTERING & SEARCH ====================
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const conditionFilter = document.getElementById('conditionFilter');
    const priceFilter = document.getElementById('priceFilter');

    [searchInput, conditionFilter, priceFilter].forEach(input => {
        input.addEventListener('change', filterBooks);
        input.addEventListener('input', filterBooks);
    });
}

function filterBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const condition = document.getElementById('conditionFilter').value;
    const priceRange = document.getElementById('priceFilter').value;

    let filtered = app.books;

    // Search filter
    if (searchTerm) {
        filtered = filtered.filter(book =>
            book.title.toLowerCase().includes(searchTerm) ||
            book.description.toLowerCase().includes(searchTerm)
        );
    }

    // Condition filter
    if (condition) {
        filtered = filtered.filter(book => book.condition === condition);
    }

    // Price filter
    if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        filtered = filtered.filter(book => {
            if (max === 999) return book.price >= min;
            return book.price >= min && book.price <= max;
        });
    }

    displayBooks(filtered);
}

// Initialize filters when home page is shown
const homePage = document.getElementById('homePage');
if (homePage) {
    const observer = new MutationObserver(() => {
        if (homePage.classList.contains('active')) {
            setupFilters();
        }
    });
    observer.observe(homePage, { attributes: true });
    setupFilters();
}

// Reinitialize filters when showing home page
document.querySelectorAll('.nav-link[data-page="home"]').forEach(link => {
    link.addEventListener('click', () => {
        setTimeout(setupFilters, 100);
    });
});

// ==================== MY BOOKS PAGE ====================
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target.id === 'myBooksPage' && mutation.target.classList.contains('active')) {
            displayMyBooks();
        }
    });
});

observer.observe(document.getElementById('myBooksPage'), { attributes: true });

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('remove');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// ==================== UTILITY FUNCTIONS ====================
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

function initializeEventListeners() {
    // This function can be used to initialize other event listeners
}

// ==================== DEMO DATA (OPTIONAL) ====================
function loadDemoData() {
    if (window.users.length === 0) {
        window.users.push({
            id: 1,
            name: 'Ahmed Mohammed',
            email: 'ahmed@students.hebron.edu',
            password: 'password123'
        });

        app.books = [
            {
                id: 1,
                title: 'Introduction to Computer Science',
                description: 'A comprehensive guide to computer science fundamentals. Like new condition.',
                price: 45,
                condition: 'New',
                image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=600&fit=crop',
                ownerId: 1,
                ownerName: 'Ahmed Mohammed',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                title: 'Data Structures and Algorithms',
                description: 'Used textbook in excellent condition. Some highlights and notes.',
                price: 35,
                condition: 'Used',
                image: 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=400&h=600&fit=crop',
                ownerId: 1,
                ownerName: 'Ahmed Mohammed',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                title: 'Web Development Basics',
                description: 'Perfect condition. Never used. Includes CD with exercises.',
                price: 50,
                condition: 'New',
                image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
                ownerId: 1,
                ownerName: 'Ahmed Mohammed',
                createdAt: new Date().toISOString()
            }
        ];

        saveToLocalStorage();
    }
}

// Load demo data on first visit (uncomment to enable)
// loadDemoData();

// ==================== DEBUG: TEST VERIFICATION CODE ====================
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' && window.verificationCode) {
        console.log('Verification Code:', window.verificationCode);
    }
    
});
