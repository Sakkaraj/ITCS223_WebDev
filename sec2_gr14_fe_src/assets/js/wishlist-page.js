/**
 * wishlist-page.js — Renders products from window.BSC_Wishlist.get()
 */

document.addEventListener('DOMContentLoaded', () => {
    // Wait for wishlist.js and layout.js to be fully initialized via layoutLoaded event
    document.addEventListener('layoutLoaded', () => {
        renderWishlist();
    });

    // Also listen for toggle events to re-render if needed
    document.addEventListener('wishlistUpdated', () => {
        renderWishlist();
    });
});

/* ── UI Rendering ────────────────────────────────────────── */

function renderWishlist() {
    const grid = document.getElementById('wishlistGrid');
    if (!grid) return;

    const items = window.BSC_Wishlist.get();

    if (items.length === 0) {
        grid.innerHTML = `
            <div class="wishlist-empty">
                <i data-lucide="heart" class="wishlist-empty__icon"></i>
                <h2 class="wishlist-empty__title">Your wishlist is empty</h2>
                <p>Start adding items you love to find them here easily.</p>
                <a href="shop" class="button-shop-now" style="display:inline-block; margin-top:24px; padding: 12px 30px; background: #000; color: #fff; text-decoration:none;">Go to Shop</a>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    grid.innerHTML = items.map(item => renderWishlistCard(item)).join('');
    
    bindWishlistActions(items, grid);

    if (window.lucide) lucide.createIcons();
}

/* ── Action Handlers ───────────────────────────────────── */

function bindWishlistActions(items, grid) {
    // Add to Cart
    grid.querySelectorAll('.js-add-to-cart').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            try {
                await BSC.apiFetch('/api/cart', {
                    method: 'POST',
                    body: JSON.stringify({ productId: id, quantity: 1 }),
                });
                BSC.showToast('Added to cart!', 'success');
                if (BSC.refreshCartCount) BSC.refreshCartCount();
            } catch (err) {
                BSC.showToast(err.message, 'error');
            }
        });
    });

    // Wishlist Toggle (Removal)
    grid.querySelectorAll('.shop-product-card__fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const item = items.find(i => String(i.ProductId) === String(id));
            if (item) {
                window.BSC_Wishlist.toggle(item);
            }
        });
    });

    // Detailed Navigation
    grid.querySelectorAll('.shop-product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.js-add-to-cart') || e.target.closest('.shop-product-card__fav-btn')) return;
            window.location.href = `product?id=${card.dataset.id}`;
        });
    });
}

/* ── UI Templates ────────────────────────────────────────── */

function renderWishlistCard(p) {
    // Ensure pathing is correct (since we're in /pages/)
    let imgSrc = p.ImageUrl;
    if (imgSrc && imgSrc.startsWith('assets/')) {
        imgSrc = '../' + imgSrc;
    }

    return `
        <article class="shop-product-card" data-id="${p.ProductId}" style="cursor:pointer">
            <div class="shop-product-card__image-wrap">
                <button class="shop-product-card__fav-btn is-active" data-id="${p.ProductId}" title="Remove from Wishlist">
                    <i data-lucide="heart" class="shop-product-card__heart-icon"></i>
                </button>
                <img src="${imgSrc}" alt="${p.ProductName}" class="shop-product-card__image" onerror="this.src='../assets/images/chair.avif'" />
                <div class="shop-product-card__action-wrap">
                    <button class="shop-product-card__action js-add-to-cart" data-id="${p.ProductId}">
                        Add to Cart
                    </button>
                </div>
            </div>
            <h3 class="shop-product-card__title">${p.ProductName}</h3>
            <p class="shop-product-card__price">$${parseFloat(p.Price).toFixed(2)}</p>
            <p class="shop-product-card__category" style="font-size:12px;color:#888;margin-top:2px;">${p.Category || ''}</p>
        </article>
    `;
}
