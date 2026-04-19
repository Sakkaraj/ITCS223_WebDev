// home-bestseller.js — Dynamically loads bestsellers for home
// Depends on api.js being loaded first.

document.addEventListener('DOMContentLoaded', async () => {
  const bestsellerGrid = document.querySelector('.bestseller-grid');
  if (!bestsellerGrid) return;

  try {
    // Fetch top 4 bestsellers (by rating count or sales, fallback to latest)
    const data = await BSC.apiFetch('/api/products?sort=bestsellers&limit=4');
    const { products } = data;
    bestsellerGrid.innerHTML = products.map(renderBestsellerCard).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();

    bestsellerGrid.querySelectorAll('.bestseller-card').forEach((card, idx) => {
      const product = products[idx];
      
      // Card click (except wishlist and Add to Cart)
      card.addEventListener('click', (e) => {
        if (e.target.closest('.bestseller-card__wishlist') || e.target.closest('.bestseller-card__btn')) return;
        window.location.href = `product?id=${product.ProductId}`;
      });

      // Wishlist button
      const wishlistBtn = card.querySelector('.bestseller-card__wishlist');
      if (wishlistBtn) {
        if (window.BSC_Wishlist && window.BSC_Wishlist.has(product.ProductId)) {
          wishlistBtn.classList.add('is-active');
        }

        wishlistBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const added = window.BSC_Wishlist.toggle({
            ProductId: product.ProductId,
            ProductName: product.ProductName,
            Price: product.Price,
            ImageUrl: product.ImageUrl,
            Category: product.Category
          });
          wishlistBtn.classList.toggle('is-active', added);
          BSC.showToast(added ? 'Added to wishlist' : 'Removed from wishlist', added ? 'success' : 'info');
        });
      }

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
    swatches = p.colors.slice(0, 5).map((c, idx) => {
      return `<button class="bestseller-color-swatch" 
                      style="width:12px; height:12px; border-radius:50%; border:1px solid #ddd; background:${c.HexCode}; cursor:pointer;"
                      title="${c.ColorName}" data-color-index="${idx}"></button>`;
    }).join('');
  }
  return `
    <article class="bestseller-card" data-id="${p.ProductId}" data-images='${JSON.stringify(p.images || [])}'>
      <div class="bestseller-card__badge">Popular</div>
      <div class="bestseller-card__image-wrap">
        <img src="${imgSrc}" alt="${p.ProductName}" class="bestseller-card__image bestseller-card-image" />
        <button class="bestseller-card__wishlist" title="Add to Wishlist">
          <i data-lucide="heart" class="shop-product-card__heart-icon"></i>
        </button>
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
        <div class="bestseller-card__swatches" style="display:flex; gap:6px; margin-top:8px;">${swatches}</div>
      </div>
    </article>
  `;
}

// Add event delegation for swatches in bestseller grid
document.addEventListener('click', (e) => {
  const swatch = e.target.closest('.bestseller-color-swatch');
  if (!swatch) return;
  
  e.stopPropagation();
  const card = swatch.closest('.bestseller-card');
  const cardImg = card?.querySelector('.bestseller-card-image');
  const index = parseInt(swatch.dataset.colorIndex) || 0;
  
  if (card && cardImg) {
    const images = JSON.parse(card.dataset.images || '[]');
    const index = parseInt(swatch.dataset.colorIndex) || 0;
    
    if (images.length > index) {
      const imgObj = images[index];
      let path = typeof imgObj === 'string' ? imgObj : imgObj.ImageUrl;
      // Handle absolute vs relative
      if (path && path.startsWith('http')) {
        cardImg.src = path;
      } else if (path) {
        cardImg.src = path; // on home page, assets/ is fine
      }
    }
  }
});
