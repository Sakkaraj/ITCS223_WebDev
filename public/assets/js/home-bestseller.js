// home-bestseller.js — Dynamically loads bestsellers for home.html
// Depends on api.js being loaded first.

document.addEventListener('DOMContentLoaded', async () => {
  const bestsellerGrid = document.querySelector('.bestseller-grid');
  if (!bestsellerGrid) return;

  try {
    // Fetch top 4 bestsellers (by rating count or sales, fallback to latest)
    const data = await BSC.apiFetch('/api/products?sort=latest&limit=4');
    const { products } = data;
    bestsellerGrid.innerHTML = products.map(renderBestsellerCard).join('');

    // Add click handlers for card and button
    bestsellerGrid.querySelectorAll('.bestseller-card').forEach((card, idx) => {
      const product = products[idx];
      // Card click (except wishlist and Add to Cart)
      card.addEventListener('click', (e) => {
        if (e.target.closest('.bestseller-card__wishlist') || e.target.closest('.bestseller-card__btn')) return;
        window.location.href = `product.html?id=${product.ProductId}`;
      });
      // Add to Cart button
      const btn = card.querySelector('.bestseller-card__btn');
      if (btn) {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          btn.disabled = true;
          btn.textContent = 'Adding…';
          try {
            await BSC.apiFetch('/api/cart', {
              method: 'POST',
              body: JSON.stringify({ productId: product.ProductId, quantity: 1 }),
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
      }
    });
  } catch (err) {
    bestsellerGrid.innerHTML = `<div style="color:#e44;padding:32px;">Failed to load bestsellers</div>`;
  }
});

function renderBestsellerCard(p) {
  const imgSrc = p.ImageUrl || 'assets/images/table.avif';
  // Swatches: show up to 3 color swatches if available
  let swatches = '';
  if (Array.isArray(p.colors) && p.colors.length > 0) {
    swatches = p.colors.slice(0, 3).map(c => `<span style="background: ${c.HexCode || '#ccc'}" title="${c.ColorName}"></span>`).join('');
  }
  return `
    <article class="bestseller-card" data-id="${p.ProductId}">
      <div class="bestseller-card__badge">Popular</div>
      <div class="bestseller-card__image-wrap">
        <img src="${imgSrc}" alt="${p.ProductName}" class="bestseller-card__image" />
        <button class="bestseller-card__wishlist">♡</button>
        <div class="bestseller-card__action-wrap">
          <button class="bestseller-card__btn">Add to Cart</button>
        </div>
      </div>
      <div class="bestseller-card__content">
        <h3 class="bestseller-card__title">${p.ProductName}</h3>
        <div class="bestseller-card__rating">
          <span class="bestseller-card__stars">★★★★★</span>
          <span class="bestseller-card__rating-count">(0)</span>
        </div>
        <p class="bestseller-card__price">$${parseFloat(p.Price).toFixed(2)}</p>
        <div class="bestseller-card__swatches">${swatches}</div>
      </div>
    </article>
  `;
}
