/**
 * home-new-products.js — Dynamically loads new products on home.html
 * with category filtering (All, Chairs, Tables, Armchairs)
 * Depends on api.js being loaded first.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const productGrid = document.querySelector('.product-grid');
  const tabsContainer = document.querySelector('.product-tabs');

  if (!productGrid || !tabsContainer) return;

  let allProducts = [];
  let currentCategory = 'All';

  // ─── Load all new products ─────────────────────────────────
  async function loadAllProducts() {
    try {
      const data = await BSC.apiFetch('/api/products?limit=100&sort=latest');
      const { products } = data;
      allProducts = products || [];
      renderProducts('All');
    } catch (err) {
      console.error('Failed to load new products:', err);
      productGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#e44;">Failed to load products</div>`;
    }
  }

  // ─── Filter and render products ────────────────────────────
  function renderProducts(category) {
    currentCategory = category;
    let filtered = allProducts;

    // Filter by category if not "All"
    if (category !== 'All') {
      filtered = allProducts.filter(p => p.Category?.toLowerCase() === category.toLowerCase());
    }

    // Limit to first 3 products
    filtered = filtered.slice(0, 3);

    // Render product cards
    if (filtered.length === 0) {
      productGrid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">
          <p>No products found in ${category}</p>
        </div>
      `;
      return;
    }

    productGrid.innerHTML = filtered.map(renderProductCard).join('');

    // Add color swatch event listeners
    productGrid.querySelectorAll('.product-color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = swatch.closest('.product-card');
        const container = swatch.closest('.product-color-swatches-container');

        if (!card || !container) return;

        // Remove active from all swatches in this card
        container.querySelectorAll('.product-color-swatch').forEach(s => {
          s.classList.remove('product-color-swatch--active');
        });

        // Add active to clicked swatch
        swatch.classList.add('product-color-swatch--active');

        // Update the product image
        const productName = card.dataset.productName?.toLowerCase() || '';
        const colorName = swatch.dataset.colorName?.toLowerCase() || '';

        const colorMap = {
          'green': '-green',
          'gray': '-grey',
          'grey': '-grey',
          'blue': '-blue',
          'brown': '-brown',
          'pink': '-pink',
          'red': '-red',
        };

        const colorSuffix = colorMap[colorName] || '';
        const newImageSrc = `assets/images/new-product/${productName}${colorSuffix}.jpeg`;
        const card_img = card.querySelector('.product-card-image');

        if (card_img) {
          const testImg = new Image();
          testImg.onload = () => {
            card_img.src = newImageSrc;
          };
          testImg.onerror = () => {
            // Fallback if image doesn't exist
            console.log('Color image not found:', newImageSrc);
          };
          testImg.src = newImageSrc;
        }
      });
    });

    // Add card click handlers
    productGrid.querySelectorAll('.product-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('.product-card__wishlist') || e.target.closest('.product-color-swatch')) {
          return;
        }
        const productId = card.dataset.id;
        if (productId) {
          window.location.href = `product.html?id=${productId}`;
        }
      });
    });

    // Add to Cart buttons
    productGrid.querySelectorAll('.product-card__add-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const card = btn.closest('.product-card');
        const productId = card.dataset.id;

        btn.disabled = true;
        btn.textContent = 'Adding…';

        try {
          await BSC.apiFetch('/api/cart', {
            method: 'POST',
            body: JSON.stringify({ productId: parseInt(productId), quantity: 1 }),
          });
          BSC.showToast('Item added to cart!', 'success');
          BSC.refreshCartCount && BSC.refreshCartCount();
        } catch (err) {
          BSC.showToast && BSC.showToast(err.message || 'Failed to add to cart.', 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Add to Cart';
        }
      });
    });
  }

  // ─── Set up category tabs ──────────────────────────────────
  function setupTabs() {
    const tabs = tabsContainer.querySelectorAll('.product-tabs__link');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const category = tab.textContent.trim();

        // Update active state
        tabs.forEach(t => t.classList.remove('product-tabs__link--active'));
        tab.classList.add('product-tabs__link--active');

        // Render products for this category
        renderProducts(category);
      });
    });
  }

  // ─── Render a product card ────────────────────────────────
  function renderProductCard(p) {
    const imgSrc = p.ImageUrl || 'assets/images/table.avif';

    // Render color swatches if product has colors
    let colorSwatches = '';
    if (Array.isArray(p.colors) && p.colors.length > 0) {
      const swatchesHTML = p.colors.slice(0, 5).map((c, idx) => {
        const isActive = idx === 0 ? ' product-color-swatch--active' : '';
        return `<button class="product-color-swatch${isActive}" style="background-color: ${c.HexCode};" title="${c.ColorName}" data-color-index="${idx}" data-color-name="${c.ColorName}"></button>`;
      }).join('');
      colorSwatches = `<div class="product-color-swatches-container">${swatchesHTML}</div>`;
    }

    return `
      <article class="product-card" data-id="${p.ProductId}" data-product-name="${p.ProductName}">
        <button class="product-card__wishlist">♡</button>
        <img
          src="${imgSrc}"
          alt="${p.ProductName}"
          class="product-card__image product-card-image"
          onerror="this.src='assets/images/table.avif'"
        />
        <h3 class="product-card__title">${p.ProductName}</h3>
        <p class="product-card__price">$${parseFloat(p.Price).toFixed(2)}</p>
        ${colorSwatches}
        <button class="product-card__add-btn">Add to Cart</button>
      </article>
    `;
  }

  // ─── Initialize ────────────────────────────────────────────
  await loadAllProducts();
  setupTabs();
});
