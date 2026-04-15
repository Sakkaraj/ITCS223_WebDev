// shop-featured.js — Dynamically loads featured products for shop.html
// Depends on api.js being loaded first.

document.addEventListener('DOMContentLoaded', async () => {
  const featuredGrid = document.querySelector('.shop-featured__grid');
  if (!featuredGrid) return;

  try {
    // Fetch featured products only
    const data = await BSC.apiFetch('/api/products?featured=1&limit=3');
    const { products } = data;
    featuredGrid.innerHTML = products.map(renderFeaturedCard).join('');

    // Add click handlers for card and wishlist
    featuredGrid.querySelectorAll('.shop-featured-card').forEach((card, idx) => {
      const product = products[idx];
      card.addEventListener('click', (e) => {
        if (e.target.closest('.shop-featured-card__wishlist')) return;
        window.location.href = `product.html?id=${product.ProductId}`;
      });
    });
  } catch (err) {
    featuredGrid.innerHTML = `<div style=\"color:#e44;padding:32px;\">Failed to load featured products</div>`;
  }
});

function renderFeaturedCard(p) {
  const imgSrc = p.ImageUrl || 'assets/images/table.avif';
  let swatches = '';
  if (Array.isArray(p.colors) && p.colors.length > 0) {
    swatches = p.colors.slice(0, 3).map(c => `<span style="background: ${c.HexCode || '#ccc'}" title="${c.ColorName}"></span>`).join('');
  }
  return `
    <article class="shop-featured-card" data-id="${p.ProductId}" style="cursor: pointer;">
      <div class="shop-featured-card__image-wrap">
        <img src="${imgSrc}" alt="${p.ProductName}" class="shop-featured-card__image" onerror="this.src='assets/images/chair.avif'" />
        <button class="shop-featured-card__wishlist">♡</button>
      </div>
      <div class="shop-featured-card__info">
        <h3 class="shop-featured-card__title">${p.ProductName}</h3>
        <div class="shop-featured-card__swatches">${swatches}</div>
      </div>
    </article>
  `;
}
