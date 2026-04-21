/**
 * home-new-products.js — Dynamically loads new products on home
 * with category filtering (All, Chairs, Tables, Armchairs)
 * Depends on api.js being loaded first.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const productGrid = document.querySelector('.product-grid');
    const tabsContainer = document.querySelector('.product-tabs');

    if (!productGrid || !tabsContainer) return;

    let allProducts = [];
    let currentCategory = 'All';

    /* ── Data Initialization ────────────────────────────────── */

    async function loadAllProducts() {
        try {
            // 1. Load Categories
            try {
                const categories = await BSC.apiFetch('/api/products/meta/categories');
                if (categories && categories.length > 0) {
                    const catHtml = categories.map(c => `<a href="#" class="product-tabs__link">${c.Category}</a>`).join('');
                    tabsContainer.innerHTML = `<a href="#" class="product-tabs__link product-tabs__link--active">All</a>` + catHtml;
                }
            } catch (catErr) {
                console.error('Failed to load categories:', catErr);
                tabsContainer.innerHTML = `<a href="#" class="product-tabs__link product-tabs__link--active">All</a>`;
            }

            // 2. Load Products
            const data = await BSC.apiFetch('/api/products?limit=100&sort=latest');
            const { products } = data;
            allProducts = products || [];
            renderProducts('All');
        } catch (err) {
            console.error('Failed to load new products:', err);
            productGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#e44;">Failed to load products</div>`;
        }
    }

    /* ── Product Rendering ─────────────────────────────────── */

    function renderProducts(category) {
        currentCategory = category;
        let filtered = allProducts;

        // Filter by category if not "All"
        if (category !== 'All') {
            filtered = allProducts.filter(p => p.Category?.toLowerCase() === category.toLowerCase());
        }

        // Limit to first 3 products
        filtered = filtered.slice(0, 3);

        if (filtered.length === 0) {
            productGrid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">
                    <p>No products found in ${category}</p>
                </div>
            `;
            return;
        }

        productGrid.innerHTML = filtered.map(renderProductCard).join('');

        // Layout normalization for sparse rows
        if (filtered.length > 0 && filtered.length < 3) {
            productGrid.style.display = 'flex';
            productGrid.style.justifyContent = 'center';
            
            productGrid.querySelectorAll('.product-card').forEach(card => {
                card.style.width = 'calc((100% - 4rem) / 3)';
                card.style.minWidth = '280px';
            });
        } else {
            productGrid.style.display = '';
            productGrid.style.justifyContent = '';
        }

        bindProductActions(filtered);
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    /* ── Action Handlers ───────────────────────────────────── */

    function bindProductActions(filtered) {
        // Color swatches
        productGrid.querySelectorAll('.product-color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = swatch.closest('.product-card');
                const container = swatch.closest('.product-color-swatches-container');

                if (!card || !container) return;

                container.querySelectorAll('.product-color-swatch').forEach(s => {
                    s.classList.remove('product-color-swatch--active');
                });

                swatch.classList.add('product-color-swatch--active');

                const colorIndex = parseInt(swatch.dataset.colorIndex) || 0;
                const images = JSON.parse(card.dataset.images || '[]');
                const card_img = card.querySelector('.product-card-image');

                const resolvePath = (path) => {
                    if (!path) return 'assets/images/table.avif';
                    if (path.startsWith('http')) return path;
                    return path;
                };

                let newImageSrc = '';
                if (images.length > colorIndex) {
                    const imgObj = images[colorIndex];
                    newImageSrc = resolvePath(typeof imgObj === 'string' ? imgObj : imgObj.ImageUrl);
                }

                if (card_img && newImageSrc) {
                    const testImg = new Image();
                    testImg.onload = () => { card_img.src = newImageSrc; };
                    testImg.src = newImageSrc;
                }
            });
        });

        // Card navigation
        productGrid.querySelectorAll('.product-card').forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                if (e.target.closest('.product-card__wishlist') || e.target.closest('.product-color-swatch')) {
                    return;
                }
                const productId = card.dataset.id;
                if (productId) {
                    window.location.href = `product?id=${productId}`;
                }
            });
        });

        // Add to Cart
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
                    if (BSC.refreshCartCount) BSC.refreshCartCount();
                } catch (err) {
                    if (BSC.showToast) BSC.showToast(err.message || 'Failed to add to cart.', 'error');
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Add to Cart';
                }
            });
        });

        // Wishlist
        productGrid.querySelectorAll('.product-card__wishlist').forEach((btn, idx) => {
            const product = filtered[idx];
            if (window.BSC_Wishlist && window.BSC_Wishlist.has(product.ProductId)) {
                btn.classList.add('is-active');
            }

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const added = window.BSC_Wishlist.toggle({
                    ProductId: product.ProductId,
                    ProductName: product.ProductName,
                    Price: product.Price,
                    ImageUrl: product.ImageUrl,
                    Category: product.Category
                });
                btn.classList.toggle('is-active', added);
                BSC.showToast(added ? 'Added to wishlist' : 'Removed from wishlist', added ? 'success' : 'info');
            });
        });
    }

    /* ── Tab Mechanics ─────────────────────────────────────── */

    function setupTabs() {
        const tabs = tabsContainer.querySelectorAll('.product-tabs__link');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const category = tab.textContent.trim();

                tabs.forEach(t => t.classList.remove('product-tabs__link--active'));
                tab.classList.add('product-tabs__link--active');

                renderProducts(category);
            });
        });
    }

    /* ── UI Templates ──────────────────────────────────────── */

    function renderProductCard(p) {
        const imgSrc = p.ImageUrl || 'assets/images/table.avif';

        let colorSwatches = '';
        if (Array.isArray(p.colors) && p.colors.length > 0) {
            const swatchesHTML = p.colors.slice(0, 5).map((c, idx) => {
                const isActive = idx === 0 ? ' product-color-swatch--active' : '';
                return `<button class="product-color-swatch${isActive}" style="background-color: ${c.HexCode};" title="${c.ColorName}" data-color-index="${idx}" data-color-name="${c.ColorName}"></button>`;
            }).join('');
            colorSwatches = `<div class="product-color-swatches-container">${swatchesHTML}</div>`;
        }

        return `
            <article class="product-card" data-id="${p.ProductId}" data-product-name="${p.ProductName}" data-images='${JSON.stringify(p.images || [])}'>
                <button class="product-card__wishlist" title="Add to Wishlist">
                    <i data-lucide="heart" class="shop-product-card__heart-icon"></i>
                </button>
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

    /* ── Initialise ────────────────────────────────────────── */

    await loadAllProducts();
    setupTabs();
});
