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
});