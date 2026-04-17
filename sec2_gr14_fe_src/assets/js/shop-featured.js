// shop-featured.js — Dynamically loads featured products for shop
// Depends on api.js being loaded first.

document.addEventListener('DOMContentLoaded', async () => {
  const featuredGrid = document.querySelector('.shop-featured__grid');
  if (!featuredGrid) return;

  try {
    // Fetch featured products only
    const data = await BSC.apiFetch('/api/products?featured=1&limit=3');
    const { products } = data;
    featuredGrid.innerHTML = products.map(renderFeaturedCard).join('');

    // Add click handlers for card, wishlist, and swatches
    featuredGrid.querySelectorAll('.shop-featured-card').forEach((card, idx) => {
      const product = products[idx];
      
      // Handle swatch clicks specifically
      const swatches = card.querySelectorAll('.shop-featured-swatch');
      swatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation(); // prevent card click
          
          const productName = (product.ProductName || '').toLowerCase();
          const colorName = (swatch.dataset.colorName || '').toLowerCase();
          const imgEl = card.querySelector('.shop-featured-card__image');
          
          const colorMap = {
            'green': '-green',
            'gray': '-grey',
            'grey': '-grey',
            'blue': '-blue',
            'brown': '-brown',
          };
          
          let colorSuffix = colorMap[colorName] || '';
          let newImageSrc = '';
          
          if (productName.includes('chair')) {
            if (colorName === 'grey' || colorName === 'gray') {
              newImageSrc = '../assets/images/new-product/chair1.avif';
            } else {
              newImageSrc = `../assets/images/new-product/chair${colorSuffix}.jpeg`;
            }
          } else if (productName.includes('sofa')) {
            let ext = 'jpeg';
            if (colorName === 'brown') ext = 'png';
            if (colorName === 'green') ext = 'jpg';
            newImageSrc = `../assets/images/new-product/sofa${colorSuffix}.${ext}`;
          } else if (productName.includes('table')) {
            if (colorName === 'brown') newImageSrc = '../assets/images/new-product/table.jpg';
            else if (colorName === 'white') newImageSrc = '../assets/images/new-product/table1.jpeg';
            else if (colorName === 'black') newImageSrc = '../assets/images/new-product/table2.jpeg';
          }

          if (imgEl && newImageSrc) {
            imgEl.src = newImageSrc;
          }
        });
      });

      // Handle card click
      card.addEventListener('click', (e) => {
        if (e.target.closest('.shop-featured-card__wishlist')) return;
        window.location.href = `product?id=${product.ProductId}`;
      });

      // Handle wishlist toggle
      const wishlistBtn = card.querySelector('.shop-featured-card__wishlist');
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
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    featuredGrid.innerHTML = `<div style="color:#e44;padding:32px;">Failed to load featured products</div>`;
  }
});

function renderFeaturedCard(p) {
  let imgSrc = p.ImageUrl || 'assets/images/table.avif';
  if (imgSrc.startsWith('assets/')) {
    imgSrc = '../' + imgSrc;
  }
  
  let swatches = '';
  if (Array.isArray(p.colors) && p.colors.length > 0 && p.ImageCount > 1) {
    swatches = p.colors.slice(0, 3).map(c => 
      `<span class="shop-featured-swatch" style="background: ${c.HexCode || '#ccc'}; display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin: 0 2px;" data-color-name="${c.ColorName}" title="${c.ColorName}"></span>`
    ).join('');
  }
  return `
    <article class="shop-featured-card" data-id="${p.ProductId}" style="cursor: pointer;">
      <div class="shop-featured-card__image-wrap">
        <img src="${imgSrc}" alt="${p.ProductName}" class="shop-featured-card__image" onerror="this.src='../assets/images/chair.avif'" />
        <button class="shop-featured-card__wishlist" title="Add to Wishlist">
          <i data-lucide="heart" class="shop-product-card__heart-icon"></i>
        </button>
      </div>
      <div class="shop-featured-card__info">
        <h3 class="shop-featured-card__title">${p.ProductName}</h3>
        <div class="shop-featured-card__swatches">${swatches}</div>
      </div>
    </article>
  `;
}
