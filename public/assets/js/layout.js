// ── Global broken-image fallback ─────────────────────────────
// Fires in the capture phase so it catches ALL <img> elements on
// every page, including statically-written ones with no onerror attr.
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
    if (img.tagName !== 'IMG') return;       // only handle <img>
    if (img.dataset.errHandled) return;       // prevent infinite loop
    img.dataset.errHandled = '1';
    img.src = FALLBACK;
    img.style.objectFit = 'contain';
    img.style.background = '#f3f4f6';
  }, true /* capture phase — fires before the element's own onerror */);
}());

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

function getCurrentFile() {
  return window.location.pathname.split("/").pop() || "home.html";
}

function isAdminPage(fileName) {
  const adminPages = [
    "admin-panel.html",
    "add-product.html",
    "admin-login.html"
  ];

  return adminPages.includes(fileName);
}

function setActiveNavLink() {
  const currentFile = getCurrentFile();

    const pageMap = {
      "home.html": "home",
      "shop.html": "shop",
      "product.html": "shop",
      "advance-search.html": "shop",
      "about-us.html": "about",
      "contact-us.html": "contact",
      "cart.html": "shop",
      "sign-in.html": "account",
      "admin-panel.html": "admin-panel",
      "add-product.html": "add-product",
      "admin-login.html": "admin-panel"
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

function getCartItems() {
  try {
    const raw = localStorage.getItem("cartItems");
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to read cartItems:", error);
    return [];
  }
}

function getCartCount() {
  const cartItems = getCartItems();
  return cartItems.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
}

function updateCartBadge() {
  const cartBadge = document.getElementById("cartBadge");
  if (!cartBadge) return;

  const cartCount = getCartCount();

  if (cartCount > 0) {
    cartBadge.textContent = String(cartCount);
    cartBadge.classList.remove("is-hidden");
  } else {
    cartBadge.textContent = "0";
    cartBadge.classList.add("is-hidden");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const currentFile = getCurrentFile();

  const headerFile = isAdminPage(currentFile)
    ? "../assets/partials/admin-header.html"
    : "../assets/partials/header.html";

  await loadPartial("#header-placeholder", headerFile);
  await loadPartial("#footer-placeholder", "../assets/partials/footer.html");

  setActiveNavLink();
  updateCartBadge();

  document.dispatchEvent(
    new CustomEvent("layoutLoaded", {
      detail: {
        updateCartBadge,
        getCartItems
      }
    })
  );

  // Initialize Header Search and Dropdown
  initHeaderSearch();
});

async function initHeaderSearch() {
  const selectNode = document.querySelector('.site-header__category-select');
  const searchInput = document.querySelector('.site-header__search-input');
  const advBtn = document.querySelector('.site-header__search-button');

  if (advBtn) {
    advBtn.addEventListener('click', () => {
      window.location.href = 'advance-search.html';
    });
  }

  // Handle simple 'Enter' search from header
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const cat = selectNode ? selectNode.value : '';
        let url = '../pages/shop.html';
        if (cat && cat !== 'All Categories') {
          url += `?category=${encodeURIComponent(cat)}`;
        }
        // Assuming your backend handles 'q' or 'title' for search string.
        // Actually the backend products.js doesn't have a specific text search currently,
        // but we'll add the parameter 'search' just in case.
        if (searchInput.value.trim()) {
          url += url.includes('?') ? '&' : '?';
          url += `search=${encodeURIComponent(searchInput.value.trim())}`;
        }
        window.location.href = url;
      }
    });
  }

  // Populate categories dynamically
  if (selectNode) {
    try {
      const bscFetch = window.BSC ? window.BSC.apiFetch : fetch;
      const data = await bscFetch('/api/products/meta/categories').then(r => r.json ? r.json() : r);
      if (Array.isArray(data)) {
        selectNode.innerHTML = '<option>All Categories</option>' + 
          data.map(c => `<option value="${c.Category}">${c.Category}</option>`).join('');
      }
    } catch(e) {
       console.error("Failed to load categories for header", e);
    }
  }
}
