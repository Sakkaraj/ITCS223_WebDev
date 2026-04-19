/**
 * shop.js — Dynamically loads products for shop
 * Depends on api.js being loaded first.
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ─── State ────────────────────────────────────────────────
  const urlParams        = new URLSearchParams(window.location.search);
  let currentPage        = 1;
  let currentSort        = 'latest';
  let currentSearch      = urlParams.get('search') || '';
  let selectedCategories = urlParams.getAll('category');
  let selectedColors     = [];
  let maxPriceFilter     = 9999; // Will be updated dynamically
  let totalPages         = 1;


  // ─── DOM References ───────────────────────────────────────
  const productGrid    = document.querySelector('.shop-products__grid');
  const resultText     = document.querySelector('.shop-products__result-text');
  const sortSelect     = document.querySelector('.shop-products__sort');
  const priceRange     = document.querySelector('.shop-filter-group__range');
  const paginationWrap = document.querySelector('.shop-pagination');
  const categoryList   = document.querySelector('#categoryFilterList');
  const colorFilterList = document.querySelector('#colorFilterList');
  const categoryStrip  = document.querySelector('.shop-category-strip__grid');

  // ─── Load Categories into Sidebar & Strip ─────────────────
  async function loadCategories() {
    try {
      const categories = await BSC.apiFetch('/api/products/meta/categories');

      if (categoryList) {
        categoryList.innerHTML = categories.map(cat => `
          <li class="shop-filter-list__item">
            <label class="shop-filter-list__label">
              <input type="checkbox" class="shop-filter-list__checkbox" value="${cat.Category}" />
              <span>${cat.Category}</span>
            </label>
            <span class="shop-filter-list__count">${cat.ProductCount}</span>
          </li>
        `).join('');

        // Bind category checkboxes & set initial state
        categoryList.querySelectorAll('.shop-filter-list__checkbox').forEach(cb => {
          if (selectedCategories.includes(cb.value)) {
            cb.checked = true;
          }
          cb.addEventListener('change', () => {
            selectedCategories = [...categoryList.querySelectorAll('.shop-filter-list__checkbox:checked')]
              .map(el => el.value);
            currentPage = 1;
            loadProducts();
          });
        });
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
      console.error('Failed to load categories:', err.message);
    }
  }

  // ─── Load Colors into Sidebar ─────────────────────────────
  async function loadColors() {
    try {
      const colors = await BSC.apiFetch('/api/products/meta/colors');
      if (colorFilterList) {
        colorFilterList.innerHTML = colors.map(col => `
          <li class="shop-color-filter-item">
            <label class="shop-color-filter-label" title="${col.ColorName}">
              <input type="checkbox" class="shop-color-checkbox" value="${col.ColorId}" />
              <span class="shop-color-swatch-circle" style="background-color: ${col.HexCode}; border: 1px solid #eee;"></span>
              <span class="shop-color-name">${col.ColorName}</span>
            </label>
          </li>
        `).join('');

        colorFilterList.querySelectorAll('.shop-color-checkbox').forEach(cb => {
          cb.addEventListener('change', () => {
            selectedColors = [...colorFilterList.querySelectorAll('.shop-color-checkbox:checked')]
              .map(el => el.value);
            currentPage = 1;
            loadProducts();
          });
        });
      }
    } catch (err) {
      console.error('Failed to load colors:', err.message);
    }
  }

  // ─── Load Price Range ─────────────────────────────────────
  async function loadPriceRange() {
    try {
      const data = await BSC.apiFetch('/api/products/filter-meta');
      const metaRange = data.priceRange;
      
      if (priceRange && metaRange) {
        // Ensure values are numbers and have sensible defaults if DB is empty
        const minVal = Math.floor(metaRange.MinPrice || 0);
        const maxVal = Math.ceil(metaRange.MaxPrice || 1000);
        
        // Update range input attributes
        priceRange.min = minVal;
        priceRange.max = maxVal;
        priceRange.value = maxVal;
        
        // Update state
        maxPriceFilter = maxVal;

        // Update UI labels
        const rangeLabels = document.querySelectorAll('.shop-filter-group__range-values span');
        if (rangeLabels[0]) rangeLabels[0].textContent = `$${minVal.toLocaleString()}`;
        if (rangeLabels[1]) rangeLabels[1].textContent = `$${maxVal.toLocaleString()}`;
        
        console.log(`Price range updated: ${minVal} - ${maxVal}`);
      }
    } catch (err) {
      console.error('Failed to load price range:', err.message);
    }
  }

  // ─── Render a single product card ─────────────────────────
  function renderProductCard(p) {
    let imgSrc = p.ImageUrl || 'assets/images/table.avif';
    if (imgSrc.startsWith('assets/')) {
      imgSrc = '../' + imgSrc;
    }

    // Render color swatches if product has colors and multiple images
    let colorSwatches = '';
    if (Array.isArray(p.colors) && p.colors.length > 0 && p.ImageCount > 1) {
      const swatchesHTML = p.colors.slice(0, 5).map((c, idx) => {
        const isActive = idx === 0 ? ' product-color-swatch--active' : '';
        return `<button class="product-color-swatch${isActive}" style="background-color: ${c.HexCode};" title="${c.ColorName}" data-color-index="${idx}" data-color-name="${c.ColorName}"></button>`;
      }).join('');
      colorSwatches = `<div class="product-color-swatches-container">${swatchesHTML}</div>`;
    }

    const isFav = window.BSC_Wishlist && window.BSC_Wishlist.has(p.ProductId) ? ' is-active' : '';

    return `
      <article class="shop-product-card" data-id="${p.ProductId}" data-product-name="${p.ProductName}" data-images='${JSON.stringify(p.images || [])}'>
        <div class="shop-product-card__image-wrap">
          ${p.Featured ? '<span class="shop-product-card__badge">Featured</span>' : ''}
          <button class="shop-product-card__fav-btn${isFav}" data-id="${p.ProductId}" title="Add to Wishlist">
            <i data-lucide="heart" class="shop-product-card__heart-icon"></i>
          </button>
          <img src="${imgSrc}" alt="${p.ProductName}" class="shop-product-card__image product-card-image"
               onerror="this.src='../assets/images/chair.avif'" />
          <div class="shop-product-card__action-wrap">
            <button class="shop-product-card__action js-add-to-cart" data-id="${p.ProductId}">
              Add to Cart
            </button>
          </div>
        </div>
        <h3 class="shop-product-card__title">${p.ProductName}</h3>
        <p class="shop-product-card__price">$${parseFloat(p.Price).toFixed(2)}</p>
        <p class="shop-product-card__category" style="font-size:12px;color:#888;margin-top:2px;">${p.Category}</p>
        ${colorSwatches}
      </article>
    `;
  }

  // ─── Load Products ─────────────────────────────────────────
  async function loadProducts() {
    if (!productGrid) return;

    productGrid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:#888;">
        <div style="font-size:32px;animation:spin 1s linear infinite;display:inline-block;">⟳</div>
        <p style="margin-top:12px;">Loading products…</p>
      </div>
    `;

    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 9,
        sort: currentSort,
        maxPrice: maxPriceFilter,
        ...(currentSearch ? { search: currentSearch } : {}),
      });
      selectedCategories.forEach(cat => params.append('category', cat));
      if (selectedColors.length > 0) {
        params.append('colors', selectedColors.join(','));
      }

      const data = await BSC.apiFetch(`/api/products?${params}`);
      const { products, pagination } = data;
      totalPages = pagination.totalPages;

      if (resultText) {
        const start = (pagination.page - 1) * pagination.limit + 1;
        const end   = Math.min(pagination.page * pagination.limit, pagination.total);
        resultText.textContent = `Showing ${products.length > 0 ? start : 0}–${end} of ${pagination.total} results`;
      }

      if (products.length === 0) {
        productGrid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:80px 0;color:#888;">
            <p style="font-size:48px;">🪑</p>
            <p style="font-size:18px;font-weight:600;margin-top:12px;">No products found</p>
            <p style="font-size:14px;margin-top:6px;">Try adjusting your filters</p>
          </div>
        `;
        return;
      }

      productGrid.innerHTML = products.map(renderProductCard).join('');

      if (typeof lucide !== 'undefined') lucide.createIcons();

      // Bind Wishlist buttons
      productGrid.querySelectorAll('.shop-product-card__fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const card = btn.closest('.shop-product-card');
          const id = btn.dataset.id;
          
          // Get product data for wishlist
          const product = {
            ProductId: id,
            ProductName: card.dataset.productName,
            Price: card.querySelector('.shop-product-card__price').textContent.replace('$', ''),
            ImageUrl: card.querySelector('.shop-product-card__image').src,
            Category: card.querySelector('.shop-product-card__category').textContent
          };

          const added = window.BSC_Wishlist.toggle(product);
          btn.classList.toggle('is-active', added);
          
          BSC.showToast(added ? 'Added to wishlist' : 'Removed from wishlist', added ? 'success' : 'info');
        });
      });

      // Bind Add to Cart buttons
      productGrid.querySelectorAll('.js-add-to-cart').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          btn.disabled = true;
          btn.textContent = 'Adding…';
          try {
            await BSC.apiFetch('/api/cart', {
              method: 'POST',
              body: JSON.stringify({ productId: id, quantity: 1 }),
            });
            BSC.showToast('Item added to cart!', 'success');
            BSC.refreshCartCount();
          } catch (err) {
            BSC.showToast(err.message, 'error');
          } finally {
            btn.disabled = false;
            btn.textContent = 'Add to Cart';
          }
        });
      });

      // ─── Color swatch selection ────────────────────────────
      productGrid.querySelectorAll('.product-color-swatch').forEach(swatch => {
        swatch.addEventListener('click', (e) => {
          e.stopPropagation();
          const card = swatch.closest('.shop-product-card');
          const container = swatch.closest('.product-color-swatches-container');
          
          if (!card || !container) return;
          
          // Remove active from all swatches in this card
          container.querySelectorAll('.product-color-swatch').forEach(s => {
            s.classList.remove('product-color-swatch--active');
          });
          
          // Add active to clicked swatch
          swatch.classList.add('product-color-swatch--active');
          
          // Update the product image (cycle through available images)
          const colorIndex = parseInt(swatch.dataset.colorIndex) || 0;
          const card_img = card.querySelector('.product-card-image');
          if (card_img) {
            const productName = card.dataset.productName?.toLowerCase() || '';
            const colorName = swatch.dataset.colorName?.toLowerCase() || '';
            
            const colorMap = {
              'green': '-green',
              'gray': '-grey',
              'grey': '-grey',
              'blue': '-blue',
              'brown': '-brown',
            };
            
            let colorSuffix = colorMap[colorName] || '';
            const images = JSON.parse(card.dataset.images || '[]');
            let newImageSrc = '';
            
            // Helper to resolve image path correctly
            const resolvePath = (path) => {
              if (!path) return '../assets/images/chair.avif';
              if (path.startsWith('http')) return path;
              if (path.startsWith('assets/')) return '../' + path;
              return path;
            };

            // Try to use actual images from the database first
            if (images.length > colorIndex) {
              const imgObj = images[colorIndex];
              newImageSrc = resolvePath(typeof imgObj === 'string' ? imgObj : imgObj.ImageUrl);
            } else {
              // Legacy fallback logic for demo categories if no DB images found
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
            }
            
            if (newImageSrc) {
              const testImg = new Image();
              testImg.onload = () => {
                card_img.src = newImageSrc;
              };
              testImg.onerror = () => {
                // If color variant doesn't exist, cycle through thumbnails
                const thumbnails = card.querySelectorAll('.product-gallery__thumbnail');
                if (thumbnails.length > colorIndex) {
                  card_img.src = thumbnails[colorIndex]?.src || card_img.src;
                }
              };
              testImg.src = newImageSrc;
            }
          }
        });
      });

      renderPagination(pagination);

      // ─── Click product card → go to detail page ────────────
      productGrid.querySelectorAll('.shop-product-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
          // Don't navigate if they clicked the Add-to-Cart button or color swatch
          if (e.target.closest('.js-add-to-cart') || e.target.closest('.product-color-swatch')) return;
          window.location.href = `product?id=${card.dataset.id}`;
        });
      });

    } catch (err) {
      productGrid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:80px 0;color:#e44;">
          <p style="font-size:18px;font-weight:600;">Failed to load products</p>
          <p style="font-size:13px;margin-top:6px;">${err.message}</p>
          <button onclick="location.reload()" style="margin-top:16px;padding:8px 20px;border:1px solid #e44;background:none;color:#e44;border-radius:6px;cursor:pointer;">Retry</button>
        </div>
      `;
    }
  }

  // ─── Render Pagination ─────────────────────────────────────
  function renderPagination(pagination) {
    if (!paginationWrap) return;
    paginationWrap.innerHTML = '';

    if (pagination.page > 1) {
      const prev = document.createElement('button');
      prev.className = 'shop-pagination__button';
      prev.textContent = '← Prev';
      prev.onclick = () => { currentPage--; loadProducts(); window.scrollTo(0, 0); };
      paginationWrap.appendChild(prev);
    }

    for (let p = 1; p <= pagination.totalPages; p++) {
      const btn = document.createElement('button');
      btn.className = `shop-pagination__button${p === pagination.page ? ' shop-pagination__button--active' : ''}`;
      btn.textContent = p;
      btn.onclick = () => { currentPage = p; loadProducts(); window.scrollTo(0, 0); };
      paginationWrap.appendChild(btn);
    }

    if (pagination.page < pagination.totalPages) {
      const next = document.createElement('button');
      next.className = 'shop-pagination__button shop-pagination__button--next';
      next.textContent = 'Next →';
      next.onclick = () => { currentPage++; loadProducts(); window.scrollTo(0, 0); };
      paginationWrap.appendChild(next);
    }
  }

  // ─── Sort ─────────────────────────────────────────────────
  if (sortSelect) {
    sortSelect.innerHTML = `
      <option value="latest">Sort by latest</option>
      <option value="bestsellers">Best Sellers</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    `;
    sortSelect.addEventListener('change', () => {
      currentSort = sortSelect.value;
      currentPage = 1;
      loadProducts();
    });
  }

  // ─── Price Range ───────────────────────────────────────────
  if (priceRange) {
    const rangeValues = document.querySelectorAll('.shop-filter-group__range-values span');
    priceRange.addEventListener('input', () => {
      maxPriceFilter = priceRange.value;
      if (rangeValues[1]) rangeValues[1].textContent = `$${parseInt(priceRange.value).toLocaleString()}`;
    });
    priceRange.addEventListener('change', () => {
      currentPage = 1;
      loadProducts();
    });
  }

  // ─── Initialise ────────────────────────────────────────────
  await loadCategories();
  await loadColors();
  await loadPriceRange();
  await loadProducts();

  // Inject spin animation
  if (!document.getElementById('spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }';
    document.head.appendChild(s);
  }
});
