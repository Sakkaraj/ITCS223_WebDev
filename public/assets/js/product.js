/**
 * product.js — Dynamic product detail page.
 * Reads ?id=<ProductId> from the URL, fetches data from the API,
 * and populates all page elements. Falls back to static HTML if no id param.
 * Depends on api.js being loaded first.
 */

document.addEventListener('DOMContentLoaded', async () => {

  const urlParams  = new URLSearchParams(window.location.search);
  const productId  = urlParams.get('id');

  // ─── No ID provided: keep static demo content ─────────────
  if (!productId) return;

  // ─── Fetch product from server ─────────────────────────────
  let product;
  try {
    product = await BSC.apiFetch(`/api/products/${productId}`);
  } catch (err) {
    BSC.showToast('Failed to load product details.', 'error');
    console.error('[product.js]', err);
    return;
  }

  // ─── Populate page title & meta ───────────────────────────
  document.title = `${product.ProductName} | Furniture Store`;

  // ─── Product Info ─────────────────────────────────────────
  const titleEl = document.querySelector('.product-info__title');
  if (titleEl) titleEl.textContent = product.ProductName || 'Product';

  const priceEl = document.querySelector('.product-info__price');
  if (priceEl) priceEl.textContent = `$${parseFloat(product.Price).toFixed(2)}`;

  const descEl = document.querySelector('.product-info__description');
  if (descEl) descEl.textContent = product.ProductDescription || '';

  // ─── Gallery ──────────────────────────────────────────────
  const mainImg = document.querySelector('.product-gallery__main-image');
  const thumbsWrap = document.querySelector('.product-gallery__thumbnails');

  const fallbackImg = 'assets/images/sofa.avif';

  if (product.images && product.images.length > 0) {
    if (mainImg) {
      mainImg.src = product.images[0].ImageUrl;
      mainImg.alt = product.ProductName;
    }

    if (thumbsWrap) {
      thumbsWrap.innerHTML = product.images.map((img, i) => `
        <img
          src="${img.ImageUrl}"
          alt="${product.ProductName}"
          class="product-gallery__thumbnail${i === 0 ? ' product-gallery__thumbnail--active' : ''}"
        />
      `).join('');

      // Thumbnail click → swap main image
      thumbsWrap.addEventListener('click', (e) => {
        const thumb = e.target.closest('.product-gallery__thumbnail');
        if (!thumb) return;
        if (mainImg) mainImg.src = thumb.src;
        thumbsWrap.querySelectorAll('.product-gallery__thumbnail')
          .forEach(t => t.classList.remove('product-gallery__thumbnail--active'));
        thumb.classList.add('product-gallery__thumbnail--active');
      });
    }
  } else if (mainImg) {
    mainImg.src = fallbackImg;
  }

  // ─── Dimensions ───────────────────────────────────────────
  const dimList = document.querySelector('.product-info__dimension-list');
  if (dimList) {
    dimList.innerHTML = `
      <p><span>Width:</span>  ${product.WidthDimension  || '—'} cm</p>
      <p><span>Length:</span> ${product.LengthDimension || '—'} cm</p>
      <p><span>Height:</span> ${product.HeightDimension || '—'} cm</p>
      <p><span>Weight:</span> ${product.Weight          || '—'} kg</p>
    `;
  }

  // ─── Color swatches from API ──────────────────────────────
  if (product.colors && product.colors.length > 0) {
    const colorBlock = document.querySelector('.product-info__color-options');
    if (colorBlock) {
      colorBlock.innerHTML = product.colors.map((c, idx) => `
        <button
          class="product-info__color-swatch${idx === 0 ? ' product-info__color-swatch--active' : ''}"
          title="${c.ColorName}"
          style="background-color: ${c.HexCode || '#ccc'};"
          data-color-name="${c.ColorName}"
          data-color-hex="${c.HexCode}"
        ></button>
      `).join('');

      // ─── Handle color swatch clicks ─────────────────────
      const colorSwatches = colorBlock.querySelectorAll('.product-info__color-swatch');
      colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Remove active from all swatches
          colorSwatches.forEach(s => s.classList.remove('product-info__color-swatch--active'));
          
          // Add active to clicked swatch
          swatch.classList.add('product-info__color-swatch--active');
          
          // Update color label
          const colorLabel = document.querySelector('.product-info__color-label');
          if (colorLabel) {
            colorLabel.textContent = `Color : ${swatch.dataset.colorName}`;
          }
          
          // Update main image based on color (cycle through available images)
          const colorIndex = Array.from(colorSwatches).indexOf(swatch);
          if (product.images && product.images.length > colorIndex) {
            mainImg.src = product.images[colorIndex].ImageUrl;
          }
        });
      });
    }
    const colorLabel = document.querySelector('.product-info__color-label');
    if (colorLabel) colorLabel.textContent = `Color : ${product.colors[0].ColorName}`;
  }

  // ─── Add to Cart ──────────────────────────────────────────
  const addToCartBtn   = document.getElementById('addToCartBtn');
  const quantitySelect = document.getElementById('productQuantity');

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', async () => {
      const quantity = parseInt(quantitySelect?.value) || 1;

      addToCartBtn.disabled    = true;
      addToCartBtn.textContent = 'Adding…';

      try {
        await BSC.apiFetch('/api/cart', {
          method : 'POST',
          body   : JSON.stringify({ productId: parseInt(productId), quantity }),
        });
        BSC.showToast('Item added to cart!', 'success');
        BSC.refreshCartCount();
      } catch (err) {
        if (err.status === 401) {
          BSC.showToast('Please sign in to add items to your cart.', 'error');
          setTimeout(() => { window.location.href = 'sign-in.html'; }, 1500);
        } else {
          BSC.showToast(err.message || 'Failed to add to cart.', 'error');
        }
      } finally {
        addToCartBtn.disabled    = false;
        addToCartBtn.textContent = 'Add to Cart';
      }
    });
  }

});