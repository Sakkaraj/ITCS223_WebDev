/**
 * product-similar.js — Dynamically loads similar products for product
 * Depends on api.js being loaded first.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const similarGrid = document.querySelector('.similar-products__grid');
    if (!similarGrid) return;

    // Try to get current product id from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    /* ── Data Fetching ───────────────────────────────────────── */

    try {
        // Fetch products, exclude current product, limit 3
        const data = await BSC.apiFetch('/api/products?limit=4');
        let products = data.products || [];
        if (productId) {
            products = products.filter(p => String(p.ProductId) !== String(productId));
        }
        products = products.slice(0, 3);
        similarGrid.innerHTML = products.map(renderSimilarCard).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
        similarGrid.innerHTML = `<div style="color:#e44;padding:32px;">Failed to load similar products</div>`;
    }
});

/* ── UI Templates ────────────────────────────────────────── */

function renderSimilarCard(p) {
    let imgSrc = p.ImageUrl || 'assets/images/table.avif';
    if (imgSrc.startsWith('assets/')) {
        imgSrc = '../' + imgSrc;
    }
    return `
        <article class="similar-product-card">
            <img src="${imgSrc}" alt="${p.ProductName}" class="similar-product-card__image" />
            <div class="similar-product-card__header">
                <h3 class="similar-product-card__title">${p.ProductName}</h3>
                <span class="similar-product-card__price">$${parseFloat(p.Price).toFixed(2)}</span>
            </div>
            <p class="similar-product-card__description">${p.ProductDescription || ''}</p>
            <a href="product?id=${p.ProductId}" class="similar-product-card__link">Shop Now</a>
        </article>
    `;
}
