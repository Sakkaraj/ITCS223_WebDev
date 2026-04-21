/**
 * layout.js — Core layout engine for BoonSonClon
 * Manages partial loading, navigation state, and global UI components.
 */

/* ── Global Broken-Image Fallback ────────────────────────── */

(function () {
    const FALLBACK = [
        "data:image/svg+xml,",
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">' +
            '<rect width="600" height="400" fill="#f3f4f6"/>' +
            '<text x="300" y="195" font-family="Inter,sans-serif" font-size="15" ' +
            'fill="#9ca3af" text-anchor="middle">Image unavailable</text>' +
            '<text x="300" y="218" font-family="Inter,sans-serif" font-size="12" ' +
            'fill="#d1d5db" text-anchor="middle">Could not load image</text>' +
            '</svg>'
        )
    ].join('');

    document.addEventListener('error', function (e) {
        const img = e.target;
        if (img.tagName !== 'IMG') return;
        if (img.dataset.errHandled) return;
        img.dataset.errHandled = '1';
        img.src = FALLBACK;
        img.style.objectFit = 'contain';
        img.style.background = '#f3f4f6';
    }, true);
}());

/* ── Component Loading ───────────────────────────────────── */

async function loadPartial(selector, filePath) {
    const target = document.querySelector(selector);
    if (!target) return;

    try {
        const response = await fetch(filePath);

        if (!response.ok) {
            throw new Error(`Failed to load: ${filePath}`);
        }

        target.innerHTML = await response.text();

        if (window.lucide) {
            lucide.createIcons();
        }
    } catch (error) {
        console.error(error);
    }
}

/* ── Routing Helpers ─────────────────────────────────────── */

function getCurrentFile() {
    const file = window.location.pathname.split("/").pop() || "home";
    return file.replace(".html", "");
}

function isAdminPage(fileName) {
    const adminPages = [
        "admin-panel",
        "add-product",
        "admin-login",
        "admin-signup"
    ];

    return adminPages.includes(fileName);
}

function setActiveNavLink() {
    const currentFile = getCurrentFile();

    const pageMap = {
        "home": "home",
        "shop": "shop",
        "product": "shop",
        "advance-search": "shop",
        "about-us": "about",
        "contact-us": "contact",
        "cart": "shop",
        "wishlist": "account",
        "sign-in": "account",
        "admin-panel": "admin-panel",
        "add-product": "add-product",
        "order-details": "admin-panel",
        "admin-login": "admin-panel",
        "admin-signup": "admin-panel"
    };

    const currentPage = pageMap[currentFile];
    if (!currentPage) return;

    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {
        link.classList.remove("nav-link--active");
    });

    navLinks.forEach((link) => {
        if (link.dataset.page === currentPage) {
            link.classList.add("nav-link--active");
        }
    });
}

/* ── Global Lifecycle ────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", async () => {
    const currentFile = getCurrentFile();

    // For order-details, choose header based on who is viewing
    let isAdmin = isAdminPage(currentFile);
    if (currentFile === 'order-details') {
        const urlParams = new URLSearchParams(window.location.search);
        isAdmin = urlParams.get('from') !== 'user';
    }
    const headerFile = isAdmin
        ? "../assets/partials/admin-header"
        : "../assets/partials/header";

    // For order-details page: dynamically inject the correct header CSS
    if (currentFile === 'order-details') {
        const cssHref = isAdmin
            ? '../assets/css/admin-header.css'
            : '../assets/css/header.css';
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssHref;
        document.head.appendChild(link);
    }

    const wishlistScript = document.createElement('script');
    wishlistScript.src = '../assets/js/wishlist.js';
    document.head.appendChild(wishlistScript);

    await loadPartial("#header-placeholder", headerFile);
    await loadPartial("#footer-placeholder", "../assets/partials/footer");

    if (window.BSC && window.BSC.updateNavAuth) {
        window.BSC.updateNavAuth();
    }

    setActiveNavLink();
    if (window.BSC) {
        window.BSC.refreshCartCount();
    }
    
    // Initialize Wishlist Count
    if (window.BSC_Wishlist) {
        if (window.BSC && window.BSC.refreshWishlistCount) {
            window.BSC.refreshWishlistCount();
        }
    } else {
        wishlistScript.onload = () => {
            if (window.BSC && window.BSC.refreshWishlistCount) {
                window.BSC.refreshWishlistCount();
            }
        };
    }

    // Global listener for wishlist updates
    document.addEventListener('wishlistUpdated', () => {
        if (window.BSC && window.BSC.refreshWishlistCount) {
            window.BSC.refreshWishlistCount();
        }
    });

    document.dispatchEvent(
        new CustomEvent("layoutLoaded", {
            detail: {
                refreshCartCount: window.BSC ? window.BSC.refreshCartCount : null
            }
})
    );

    // Initialize Header Search and Dropdown
    initHeaderSearch();
    // Initialize Global Newsletter
    initNewsletter();
    // Initialize Mobile Menu
    initMobileMenu();
    // Initialize Filter Sidebar (Shop & Admin Page)
    initFilterSidebar();
});

/* ── UI Components ───────────────────────────────────────── */

function initMobileMenu() {
    const burger = document.querySelector('.site-header__burger, .admin-header__burger');
    const nav = document.querySelector('.site-header__nav, .admin-header__nav');
    
    if (!burger || !nav) return;

    burger.addEventListener('click', () => {
        burger.classList.toggle('is-active');
        nav.classList.toggle('is-active');
        document.body.classList.toggle('no-scroll');
    });

    const navLinks = nav.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            burger.classList.remove('is-active');
            nav.classList.remove('is-active');
            document.body.classList.remove('no-scroll');
        });
    });

    document.addEventListener('click', (e) => {
        if (nav.classList.contains('is-active') && !nav.contains(e.target) && !burger.contains(e.target)) {
            burger.classList.remove('is-active');
            nav.classList.remove('is-active');
            document.body.classList.remove('no-scroll');
        }
    });
}

/* ── Search Mechanics ────────────────────────────────────── */

async function initHeaderSearch() {
    const selectNode  = document.querySelector('.site-header__category-select, .admin-header__category-select');
    const searchInput = document.querySelector('.site-header__search-input, .admin-header__search-input');
    const advBtn      = document.querySelector('.site-header__search-button, .admin-header__search-button');
    const searchIcon   = document.querySelector('.site-header__search-icon, .admin-header__search-icon');

    if (!searchInput) return;

    let resultsDropdown = null;

    const createDropdown = () => {
        if (resultsDropdown) return resultsDropdown;
        resultsDropdown = document.createElement('div');
        resultsDropdown.className = 'search-results-dropdown';
        const wrapper = searchInput.parentElement;
        if (wrapper) wrapper.appendChild(resultsDropdown);
        return resultsDropdown;
    };

    const closeDropdown = () => {
        if (resultsDropdown) {
            resultsDropdown.classList.remove('is-visible');
            setTimeout(() => resultsDropdown.innerHTML = '', 200);
        }
    };

    const renderResults = (products) => {
        const dropdown = createDropdown();
        if (products.length === 0) {
            dropdown.innerHTML = '<div class="search-results-dropdown__item search-results-dropdown__item--empty">No products found</div>';
        } else {
            dropdown.innerHTML = products.map(p => {
                let imgSrc = p.ImageUrl || '../assets/images/placeholder.avif';
                if (imgSrc.startsWith('assets/')) imgSrc = '../' + imgSrc;
                
                return `
                    <div class="search-results-dropdown__item" data-id="${p.ProductId}">
                        <img src="${imgSrc}" class="search-results-dropdown__image" onerror="this.src='../assets/images/chair.avif'" />
                        <div class="search-results-dropdown__info">
                            <div class="search-results-dropdown__name">${p.ProductName}</div>
                            <div class="search-results-dropdown__meta">${p.Category} — $${parseFloat(p.Price).toFixed(2)}</div>
                        </div>
                    </div>
                `;
            }).join('');

            dropdown.querySelectorAll('.search-results-dropdown__item').forEach(item => {
                item.addEventListener('mousedown', () => {
                    const id = item.dataset.id;
                    window.location.href = `../pages/product?id=${id}`;
                });
            });
        }
        dropdown.classList.add('is-visible');
    };

    let debounceTimeout;

    const performLiveSearch = async () => {
        const query = searchInput.value.trim();
        
        if (query.length < 2) {
            closeDropdown();
            return;
        }

        try {
            const bscFetch = window.BSC ? window.BSC.apiFetch : fetch;
            const data = await bscFetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`);
            const products = data.products || (Array.isArray(data) ? data : []);
            renderResults(products);
        } catch (err) {
            console.error('Live search failed:', err);
        }
    };

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(performLiveSearch, 300);
    });

    searchInput.addEventListener('blur', () => setTimeout(closeDropdown, 200));

    const triggerSearch = () => {
        const query = searchInput.value.trim();
        const cat = selectNode ? selectNode.value : '';
        
        const url = '../pages/shop';
        const params = new URLSearchParams();
        if (cat && cat !== 'All Categories') params.set('category', cat);
        if (query) params.set('search', query);
        
        const queryString = params.toString();
        window.location.href = queryString ? `${url}?${queryString}` : url;
    };

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') triggerSearch();
    });

    if (searchIcon) {
        searchIcon.style.cursor = 'pointer';
        searchIcon.addEventListener('click', (e) => {
            e.preventDefault();
            triggerSearch();
        });
    }

    if (advBtn) {
        advBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '../pages/advance-search';
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const currentCatFromUrl = urlParams.get('category');

    if (selectNode) {
        selectNode.addEventListener('change', () => {
            const cat = selectNode.value;
            const query = searchInput.value.trim();
            
            if (!query) {
                const params = new URLSearchParams();
                if (cat && cat !== 'All Categories') {
                    params.set('category', cat);
                }
                const target = `../pages/shop${params.toString() ? '?' + params.toString() : ''}`;
                window.location.href = target;
            }
        });

        try {
            const bscFetch = window.BSC ? window.BSC.apiFetch : fetch;
            const data = await bscFetch('/api/products/meta/categories').then(r => r.json ? r.json() : r);
            if (Array.isArray(data)) {
                selectNode.innerHTML = '<option value="All Categories">All Categories</option>' + 
                    data.map(c => `<option value="${c.Category}">${c.Category}</option>`).join('');
                
                if (currentCatFromUrl) {
                    selectNode.value = currentCatFromUrl;
                }
            }
        } catch(e) {
            console.warn("Failed to load categories for header", e);
        }
    }

    if (searchInput) {
        const parent = searchInput.closest('.site-header__search-input-wrap, .admin-header__search-input-wrap, .site-header__search-box, .admin-header__search-box');
        searchInput.addEventListener('focus', () => {
            if (parent) parent.classList.add('is-focused');
        });
        searchInput.addEventListener('blur', () => {
            if (parent) parent.classList.remove('is-focused');
        });
    }
}

/* ── Interactive Elements ────────────────────────────────── */

async function initNewsletter() {
    const form = document.querySelector('.site-footer__newsletter-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = form.querySelector('.site-footer__newsletter-input');
        const button = form.querySelector('.site-footer__newsletter-button');
        const email = input ? input.value.trim() : '';

        if (!email) {
            if (window.BSC) BSC.showToast('Please enter your email', 'info');
            return;
        }

        if (button) {
            button.disabled = true;
            button.textContent = '...';
        }

        try {
            const bscFetch = window.BSC ? window.BSC.apiFetch : fetch;
            const response = await bscFetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await (response.json ? response.json() : response);

            if (response.ok || (data && !data.error)) {
                if (window.BSC) BSC.showToast(data.message || 'Subscribed successfully!', 'success');
                if (input) input.value = '';
            } else {
                const errorMsg = data.error || data.message || 'Subscription failed';
                if (window.BSC) BSC.showToast(errorMsg, response.status === 409 ? 'info' : 'error');
            }
        } catch (err) {
            console.error('Newsletter error:', err);
            if (window.BSC) BSC.showToast('Failed to subscribe. Try again later.', 'error');
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = 'Subscribe';
            }
        }
    });
}

function initFilterSidebar() {
    const shopToggle = document.querySelector('#filterToggle');
    const shopSidebar = document.querySelector('.shop-sidebar');
    
    if (shopToggle && shopSidebar) {
        let overlay = document.querySelector('.shop-sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'shop-sidebar-overlay';
            document.body.appendChild(overlay);
        }

        const toggleSidebar = () => {
            shopSidebar.classList.toggle('is-active');
            overlay.classList.toggle('is-active');
            document.body.classList.toggle('no-scroll');
        };

        const closeBtn = document.querySelector('#sidebarClose');
        if (closeBtn) closeBtn.addEventListener('click', toggleSidebar);

        shopToggle.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', toggleSidebar);
    }

    const adminToggle = document.querySelector('#adminFilterToggle');
    const adminSidebar = document.querySelector('.admin-panel-sidebar');
    
    if (adminToggle && adminSidebar) {
        let adminOverlay = document.querySelector('.admin-sidebar-overlay');
        if (!adminOverlay) {
            adminOverlay = document.createElement('div');
            adminOverlay.className = 'admin-sidebar-overlay';
            document.body.appendChild(adminOverlay);
        }
        
        const toggleAdminSidebar = () => {
            adminSidebar.classList.toggle('is-active');
            adminOverlay.classList.toggle('is-active');
            document.body.classList.toggle('no-scroll');
        };
        
        adminToggle.addEventListener('click', toggleAdminSidebar);
        adminOverlay.addEventListener('click', toggleAdminSidebar);
        
        const adminClose = document.querySelector('#adminSidebarClose');
        if (adminClose) adminClose.addEventListener('click', toggleAdminSidebar);
    }
}
