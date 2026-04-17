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

  const materialEl = document.getElementById('productMaterial');
  if (materialEl) {
    if (product.MaterialName) {
      materialEl.querySelector('span').textContent = product.MaterialName;
      materialEl.style.display = 'block';
    } else {
      materialEl.style.display = 'none';
    }
  }

  // ─── Gallery ──────────────────────────────────────────────
  const mainImg = document.querySelector('.product-gallery__main-image');
  const thumbsWrap = document.querySelector('.product-gallery__thumbnails');

  const fallbackImg = '../assets/images/sofa.avif';
  const resolvePath = (path) => {
    if (!path) return fallbackImg;
    if (path.startsWith('http')) return path;
    if (path.startsWith('assets/')) return '../' + path;
    return path;
  };

  if (product.images && product.images.length > 0) {
    if (mainImg) {
      const imgObj = product.images[0];
      const firstImg = typeof imgObj === 'string' ? imgObj : imgObj.ImageUrl;
      mainImg.src = resolvePath(firstImg);
      mainImg.alt = product.ProductName;
    }

    if (thumbsWrap) {
      thumbsWrap.innerHTML = product.images.map((img, i) => {
        const path = typeof img === 'string' ? img : img.ImageUrl;
        const src = resolvePath(path);
        return `
        <img
          src="${src}"
          alt="${product.ProductName}"
          class="product-gallery__thumbnail${i === 0 ? ' product-gallery__thumbnail--active' : ''}"
        />`;
      }).join('');

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
  let selectedColor = null;
  const colorBlock = document.querySelector('.product-info__color-options');
  const colorLabel = document.querySelector('.product-info__color-label');
  
  if (product.colors && product.colors.length > 0 && product.images && product.images.length > 1) {
    if (colorBlock) {
      colorBlock.style.display = '';
      colorBlock.innerHTML = product.colors.map((c, idx) => `
        <button
          class="product-info__color-swatch${idx === 0 ? ' product-info__color-swatch--active' : ''}"
          title="${c.ColorName}"
          style="background-color: ${c.HexCode || '#ccc'}; border: ${idx === 0 ? '2px solid #000' : '2px solid transparent'};"
          data-color-name="${c.ColorName}"
          data-color-id="${c.ColorId}"
          data-color-hex="${c.HexCode}"
          aria-label="Select color: ${c.ColorName}"
        ></button>
      `).join('');

      // Store initial selected color
      selectedColor = {
        id: product.colors[0].ColorId,
        name: product.colors[0].ColorName,
        hex: product.colors[0].HexCode
      };

      // ─── Handle color swatch clicks ─────────────────────
      const colorSwatches = colorBlock.querySelectorAll('.product-info__color-swatch');
      colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Remove active styling from all swatches
          colorSwatches.forEach(s => {
            s.classList.remove('product-info__color-swatch--active');
            s.style.border = '2px solid transparent';
          });
          
          // Add active styling to clicked swatch
          swatch.classList.add('product-info__color-swatch--active');
          swatch.style.border = '2px solid #000';
          
          // Store selected color
          selectedColor = {
            id: swatch.dataset.colorId,
            name: swatch.dataset.colorName,
            hex: swatch.dataset.colorHex
          };
          
          // Update color label with visual feedback
          if (colorLabel) {
            colorLabel.textContent = `Color : ${swatch.dataset.colorName}`;
            colorLabel.style.fontWeight = '600';
          }
          
          // Prefer using the product's actual images by index
          const colorIndex = Array.from(colorSwatches).indexOf(swatch);
          let newImageSrc = '';

          if (product.images && product.images.length > colorIndex) {
            const imgObj = product.images[colorIndex];
            newImageSrc = resolvePath(typeof imgObj === 'string' ? imgObj : imgObj.ImageUrl);
          } else {
            // Fallback for hardcoded demo products
            const colorName = swatch.dataset.colorName.toLowerCase();
            const productName = (product.ProductName || '').toLowerCase();
            const colorMap = { 'green': '-green', 'gray': '-grey', 'grey': '-grey', 'blue': '-blue', 'brown': '-brown' };
            let colorSuffix = colorMap[colorName] || '';
            
            if (productName.includes('chair')) {
              newImageSrc = colorName === 'grey' ? '../assets/images/new-product/chair1.avif' : `../assets/images/new-product/chair${colorSuffix}.jpeg`;
            } else if (productName.includes('sofa')) {
              newImageSrc = `../assets/images/new-product/sofa${colorSuffix}.jpeg`;
            }
          }
          
          if (newImageSrc && mainImg) {
             const testImg = new Image();
             testImg.onload = () => { mainImg.src = newImageSrc; };
             testImg.src = newImageSrc;
          }
        });
      });
    }
    if (colorLabel) {
      colorLabel.style.display = '';
      colorLabel.textContent = `Color : ${product.colors[0].ColorName}`;
    }
  } else {
    // Hide color selection elements if there's only 1 image or no colors
    if (colorLabel) colorLabel.style.display = 'none';
    if (colorBlock) colorBlock.style.display = 'none';
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
        const cartData = {
          productId: parseInt(productId),
          quantity
        };
        
        // Include selected color if available
        if (selectedColor) {
          cartData.colorId = selectedColor.id;
          cartData.colorName = selectedColor.name;
        }

        await BSC.apiFetch('/api/cart', {
          method : 'POST',
          body   : JSON.stringify(cartData),
        });
        BSC.showToast(`Item added to cart! ${selectedColor ? `(${selectedColor.name})` : ''}`, 'success');
        BSC.refreshCartCount();
      } catch (err) {
        if (err.status === 401) {
          BSC.showToast('Please sign in to add items to your cart.', 'error');
          setTimeout(() => { window.location.href = 'sign-in'; }, 1500);
        } else {
          BSC.showToast(err.message || 'Failed to add to cart.', 'error');
        }
      } finally {
        addToCartBtn.disabled    = false;
        addToCartBtn.textContent = 'Add to Cart';
      }
    });
  }

  // ─── Wishlist Toggle ──────────────────────────────────────
  const wishlistBtn = document.getElementById('wishlistToggleBtn');
  if (wishlistBtn) {
    // Initial state
    const updateWishlistUI = () => {
      const isFav = window.BSC_Wishlist && window.BSC_Wishlist.has(productId);
      wishlistBtn.classList.toggle('is-active', isFav);
    };

    if (window.BSC_Wishlist) {
      updateWishlistUI();
    } else {
      document.addEventListener('layoutLoaded', updateWishlistUI);
    }

    wishlistBtn.addEventListener('click', () => {
      if (!window.BSC_Wishlist) return;

      const added = window.BSC_Wishlist.toggle({
        ProductId: productId,
        ProductName: product.ProductName,
        Price: product.Price,
        ImageUrl: product.images && product.images.length > 0 ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].ImageUrl) : '../assets/images/sofa.avif',
        Category: product.Category
      });
      
      updateWishlistUI();
      BSC.showToast(added ? 'Added to wishlist' : 'Removed from wishlist', added ? 'success' : 'info');
    });
  }

});
