/**
 * admin.js — Admin panel & add-product page logic.
 * Depends on api.js being loaded first.
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ─── Guard: Admin only ────────────────────────────────────
  if (!BSC.isLoggedIn() || !BSC.isAdmin()) {
    BSC.showToast('Admin access required. Redirecting…', 'error');
    setTimeout(() => { window.location.href = 'admin-login'; }, 1500);
    return;
  }

  // ─── Admin Panel Page (admin-panel) ──────────────────
  const adminTableBody = document.querySelector('.admin-panel-table__body');
  if (adminTableBody) {
    loadAdminProducts();
    initAdminFilters();
    loadDashboardStats();
    initAdminBestsellers();
    initAdminTabs();
    bindSyncButton();

    // POLLED UPDATES: Keep stock and stats fresh every 10s (Faster for testing)
    setInterval(() => {
      refreshAdminData();
    }, 10000);
  }

  function bindSyncButton() {
    const syncBtn = document.getElementById('manualSync');
    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        const icon = syncBtn.querySelector('i');
        if (icon) icon.style.animation = 'spin 1s linear infinite';
        await refreshAdminData();
        if (icon) icon.style.animation = '';
        BSC.showToast('Inventory Synced', 'success');
      });
    }
  }

  async function refreshAdminData() {
    const activeTab = document.querySelector('.admin-tab.is-active');
    const updateTimeEl = document.getElementById('lastUpdated');
    
    try {
      if (activeTab && activeTab.dataset.tab === 'products') {
        await loadAdminProducts(collectFilters());
      }
      await loadDashboardStats();
      await initAdminBestsellers();
      
      if (updateTimeEl) {
        const now = new Date();
        updateTimeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  }

  // ─── Add Product Page (add-product) ─────────────────
  const addProductForm = document.querySelector('.add-product-form');
  if (addProductForm) {
    await populateCategoryDropdown();
    await populateMaterialDropdown();
    await populateColorsList();
    await bindAddProductForm(); // Await this to allow pre-filling
  }


  // ══════════════════════════════════════════════════════════
  //  ADMIN PANEL: Load & render products table
  // ══════════════════════════════════════════════════════════

  async function loadAdminProducts(filters = {}) {
    adminTableBody.innerHTML = `
      <tr><td colspan="8" style="text-align:center;padding:40px;color:#888;">
        <div style="font-size:28px;animation:spin 1s linear infinite;display:inline-block;">⟳</div>
        <p style="margin-top:10px;">Loading products…</p>
      </td></tr>
    `;

    try {
      const params = new URLSearchParams({ limit: 50, showAll: true, ...filters });
      const data = await BSC.apiFetch(`/api/products?${params}`);
      const { products } = data;

      // Update result count in header
      const titleEl = document.querySelector('.admin-panel-content__title');
      if (titleEl) titleEl.textContent = `Admin Panel (${products.length} products)`;

      if (products.length === 0) {
        adminTableBody.innerHTML = `
          <tr><td colspan="8" style="text-align:center;padding:60px;color:#888;">
            No products found. <a href="add-product" style="color:#333;text-decoration:underline;">Add one?</a>
          </td></tr>
        `;
        return;
      }

      adminTableBody.innerHTML = products.map(p => {
        let imgSrc = p.ImageUrl || 'assets/images/chair.avif';
        if (imgSrc.startsWith('assets/')) {
          imgSrc = '../' + imgSrc;
        }
        const cmf = `
          <div style="font-size:11px;line-height:1.4;">
            <div style="font-weight:600;color:#333;margin-bottom:2px;">${p.MaterialName || '—'}</div>
            <div style="display:flex;gap:3px;">
              ${(p.colors || []).slice(0, 3).map(c => `<span style="width:8px;height:8px;border-radius:50%;background:${c.HexCode || '#ccc'};border:1px solid #ddd;"></span>`).join('')}
              ${p.colors && p.colors.length > 3 ? `<span style="font-size:9px;color:#888;">+${p.colors.length - 3}</span>` : ''}
            </div>
          </div>
        `;
        const dims = `
          <div style="font-size:11px;">
            <div>${p.LengthDimension || p.lengthDimension || 0}x${p.WidthDimension || p.widthDimension || 0}x${p.HeightDimension || p.heightDimension || 0} cm</div>
            <div style="color:#888; margin-top:2px;">${p.Weight || p.weight || 0} kg</div>
          </div>
        `;
        const stockVal = parseInt(p.QuantityLeft) || 0;
        const stockColor = stockVal < 5 ? '#e11d48' : '#6b7280'; // Red if low
        const stockWeight = stockVal < 5 ? '800' : '600';
        
        return `
          <tr class="admin-panel-table__row" data-id="${p.ProductId}">
            <td class="admin-panel-table__product-cell">
              <img src="${imgSrc}" alt="${p.ProductName}" class="admin-panel-table__product-image"
                   onerror="this.src='../assets/images/chair.avif'" />
              <div style="display:flex; flex-direction:column; gap:2px;">
                <span class="admin-panel-table__product-name" style="font-weight:600;">${p.ProductName}</span>
                <span style="font-size:11px; color:#888;">
                  ID: #${p.ProductId} | 
                  <span style="color:${stockColor}; font-weight:${stockWeight};">Stock: ${stockVal}</span> | 
                  Status: <span style="font-weight:700; color:${p.Status === 'Active' ? '#166534' : p.Status === 'Draft' ? '#854d0e' : '#991b1b'}">${p.Status || 'Active'}</span>
                </span>
              </div>
            </td>
            <td class="admin-panel-table__muted">${p.Category}</td>
            <td class="admin-panel-table__price">$${parseFloat(p.Price).toFixed(2)}</td>
            <td>${cmf}</td>
            <td style="font-size:12px;color:#666;">${dims}</td>
            <td class="admin-panel-table__description" style="font-size:12px;color:#666; max-width:150px;">
              ${p.ProductDescription ? p.ProductDescription.substring(0, 50) + '…' : '—'}
            </td>
            <td class="admin-panel-table__featured">
              <span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:10px; text-transform:uppercase; background:${p.Featured ? '#dcfce7' : '#f3f4f6'}; color:${p.Featured ? '#166534' : '#6b7280'}; font-weight:700;">
                ${p.Featured ? 'Yes' : 'No'}
              </span>
            </td>
            <td class="admin-panel-table__actions">
              <div class="admin-panel-table__action-group">
                <button class="admin-panel-table__action-button admin-panel-table__action-button--edit js-edit-btn" data-id="${p.ProductId}" title="Edit">
                  <i data-lucide="edit-3" class="admin-panel-table__action-icon"></i>
                </button>
                <button class="admin-panel-table__action-button admin-panel-table__action-button--delete js-delete-btn" data-id="${p.ProductId}" data-name="${p.ProductName}" title="Delete">
                  <i data-lucide="trash-2" class="admin-panel-table__action-icon"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      if (typeof lucide !== 'undefined') lucide.createIcons();
      bindAdminActions();

    } catch (err) {
      console.error('Error loading products:', err);
      adminTableBody.innerHTML = `
        <tr><td colspan="8" style="text-align:center;padding:40px;background:#fdd;border:2px solid #e44;">
          <strong style="color:#c00;font-size:16px;">⚠ Error loading products</strong><br>
          <div style="color:#e44;font-weight:bold;margin:10px 0;">${err.message}</div>
          <small style="color:#666;display:block;margin:10px 0;">Status: ${err.status || 'unknown'}</small>
          <small style="color:#666;">Check browser console (F12) for full error details.</small>
        </td></tr>
      `;
    }
  }

  // ══════════════════════════════════════════════════════════
  //  ADMIN PANEL: Filter Logic
  // ══════════════════════════════════════════════════════════

  async function initAdminFilters() {
    const catList = document.getElementById('categoryFilterList');
    const colorList = document.getElementById('colorFilterList');
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const priceSlider = document.getElementById('priceSlider');
    const applyBtn = document.getElementById('applyFilters');
    const clearBtn = document.getElementById('clearFilters');

    if (!catList || !colorList) return;

    try {
      const { categories, colors, priceRange } = await BSC.apiFetch('/api/products/filter-meta');

      // Populate Categories
      catList.innerHTML = categories.map(c => `
        <li class="admin-panel-filter-list__item">
          <label class="admin-panel-filter-list__label">
            <input type="checkbox" class="admin-panel-filter-list__checkbox js-cat-filter" value="${c.Category}">
            <span>${c.Category}</span>
          </label>
          <span class="admin-panel-filter-list__count">${c.ProductCount}</span>
        </li>
      `).join('');

      // Populate Colors
      colorList.innerHTML = colors.map(c => `
        <li class="admin-panel-color-list__item">
          <label class="admin-panel-color-list__label">
            <input type="checkbox" class="admin-panel-filter-list__checkbox js-color-filter" value="${c.ColorId}">
            <span class="admin-panel-color-list__swatch" style="background:${c.HexCode || '#ccc'}; border:1px solid #ddd;"></span>
            <span>${c.ColorName}</span>
          </label>
          <span class="admin-panel-filter-list__count">${c.ProductCount}</span>
        </li>
      `).join('');

      // Setup Price
      if (priceRange) {
        priceSlider.min = Math.floor(priceRange.MinPrice || 0);
        priceSlider.max = Math.ceil(priceRange.MaxPrice || 10000);
        priceSlider.value = priceSlider.max;
        priceMin.value = priceSlider.min;
        priceMax.value = priceSlider.max;
      }

      // Sync Slider to Input
      priceSlider.addEventListener('input', () => {
        priceMax.value = priceSlider.value;
      });
      priceMax.addEventListener('input', () => {
        priceSlider.value = priceMax.value;
      });

      // Apply
      applyBtn.addEventListener('click', () => {
        const filters = collectFilters();
        loadAdminProducts(filters);
      });

      // Clear
      clearBtn.addEventListener('click', () => {
        document.querySelectorAll('.js-cat-filter, .js-color-filter').forEach(cb => cb.checked = false);
        priceMin.value = priceSlider.min;
        priceMax.value = priceSlider.max;
        priceSlider.value = priceSlider.max;
        loadAdminProducts();
      });

    } catch (err) {
      console.error('Error initializing filters:', err);
    }
  }

  function collectFilters() {
    const categories = Array.from(document.querySelectorAll('.js-cat-filter:checked')).map(cb => cb.value);
    const colors = Array.from(document.querySelectorAll('.js-color-filter:checked')).map(cb => cb.value);
    const minPrice = document.getElementById('priceMin').value;
    const maxPrice = document.getElementById('priceMax').value;

    const filters = {};
    if (categories.length > 0) filters.category = categories[0]; // Current API supports single category
    if (colors.length > 0) filters.colorId = colors[0]; // Current API supports single color
    if (minPrice) filters.minPrice = minPrice;
    if (maxPrice) filters.maxPrice = maxPrice;

    return filters;
  }

  function bindAdminActions() {
    adminTableBody.querySelectorAll('.js-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = `add-product?edit=${btn.dataset.id}`;
      });
    });

    adminTableBody.querySelectorAll('.js-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        openDeleteModal(id, name);
      });
    });

    document.querySelector('.admin-panel-content__add-button')
      ?.addEventListener('click', () => {
        window.location.href = 'add-product';
      });
  }

  let pendingDeleteId = null;

  function openDeleteModal(id, name) {
    pendingDeleteId = id;
    const modal = document.getElementById('deleteModal');
    const titleEl = modal?.querySelector('.admin-panel-modal__title');
    if (titleEl) titleEl.textContent = `Delete "${name}"?`;
    modal?.classList.remove('is-hidden');
  }

  function closeModal() {
    document.getElementById('deleteModal')?.classList.add('is-hidden');
    pendingDeleteId = null;
  }

  document.querySelectorAll('[onclick="closeModal()"]').forEach(el => {
    el.removeAttribute('onclick');
    el.addEventListener('click', closeModal);
  });
  document.querySelector('.admin-panel-modal__backdrop')?.addEventListener('click', closeModal);

  document.querySelector('.admin-panel-modal__button--delete')?.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    const btn = document.querySelector('.admin-panel-modal__button--delete');
    btn.disabled = true;
    btn.textContent = 'Deleting…';

    try {
      await BSC.apiFetch(`/api/products/${pendingDeleteId}`, { method: 'DELETE' });
      closeModal();
      BSC.showToast('Product deleted successfully.', 'success');
      await loadAdminProducts();
    } catch (err) {
      BSC.showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  });

  // ══════════════════════════════════════════════════════════
  //  META MANAGEMENT MODAL LOGIC
  // ══════════════════════════════════════════════════════════
  const metaModal = document.getElementById('metaModal');
  const metaModalTitle = document.getElementById('metaModalTitle');
  const metaModalInputs = document.getElementById('metaModalInputs');
  const metaModalSubmit = document.getElementById('metaModalSubmit');
  const metaModalCancel = document.getElementById('metaModalCancel');
  let currentMetaType = null;

  document.querySelectorAll('.add-meta-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentMetaType = btn.dataset.type;
      openMetaModal(currentMetaType);
    });
  });

  function openMetaModal(type) {
    metaModal.classList.remove('is-hidden');
    metaModalInputs.innerHTML = '';
    
    if (type === 'category') {
      metaModalTitle.textContent = 'Add New Category';
      metaModalInputs.innerHTML = `
        <div class="add-product-form__group">
          <label class="add-product-form__label">Category Name</label>
          <input type="text" id="newMetaName" class="add-product-form__input" placeholder="e.g. Office Furniture">
        </div>
      `;
    } else if (type === 'color') {
      metaModalTitle.textContent = 'Add New Color';
      metaModalInputs.innerHTML = `
        <div class="add-product-form__group">
          <label class="add-product-form__label">Color Name</label>
          <input type="text" id="newMetaName" class="add-product-form__input" placeholder="e.g. Crimson">
        </div>
        <div class="add-product-form__group">
          <label class="add-product-form__label">Color Value (Hex)</label>
          <input type="color" id="newMetaValue" class="add-product-form__input" style="height:45px; padding:5px;" value="#7c3aed">
        </div>
      `;
    } else if (type === 'material') {
      metaModalTitle.textContent = 'Add New Material';
      metaModalInputs.innerHTML = `
        <div class="add-product-form__group">
          <label class="add-product-form__label">Material Name</label>
          <input type="text" id="newMetaName" class="add-product-form__input" placeholder="e.g. Bamboo">
        </div>
        <div class="add-product-form__group">
          <label class="add-product-form__label">Material Type</label>
          <select id="newMetaValue" class="add-product-form__input">
            <option value="Natural">Natural</option>
            <option value="Industrial">Industrial</option>
            <option value="Soft">Soft</option>
            <option value="Hard">Hard</option>
            <option value="Engineered">Engineered</option>
          </select>
        </div>
      `;
    }
  }

  function closeMetaModal() {
    metaModal.classList.add('is-hidden');
  }

  metaModalCancel?.addEventListener('click', closeMetaModal);
  metaModal.querySelector('.admin-panel-modal__backdrop')?.addEventListener('click', closeMetaModal);

  metaModalSubmit?.addEventListener('click', async () => {
    const name = document.getElementById('newMetaName')?.value.trim();
    const value = document.getElementById('newMetaValue')?.value;

    if (!name) {
      BSC.showToast('Please enter a name', 'error');
      return;
    }

    metaModalSubmit.disabled = true;
    metaModalSubmit.textContent = 'Creating...';

    try {
      let endpoint = '';
      let body = {};

      if (currentMetaType === 'category') {
        endpoint = '/api/products/meta/categories';
        body = { category: name };
      } else if (currentMetaType === 'color') {
        endpoint = '/api/products/meta/colors';
        body = { colorName: name, hexCode: value };
      } else if (currentMetaType === 'material') {
        endpoint = '/api/products/meta/materials';
        body = { materialName: name, materialType: value };
      }

      await BSC.apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      BSC.showToast(`${currentMetaType.charAt(0).toUpperCase() + currentMetaType.slice(1)} added successfully!`, 'success');
      closeMetaModal();

      // Refresh dropdowns/lists
      if (currentMetaType === 'category') await populateCategoryDropdown();
      else if (currentMetaType === 'color') await populateColorsList();
      else if (currentMetaType === 'material') await populateMaterialDropdown();

    } catch (err) {
      BSC.showToast(err.message, 'error');
    } finally {
      metaModalSubmit.disabled = false;
      metaModalSubmit.textContent = 'Create';
    }
  });

  // ══════════════════════════════════════════════════════════
  //  SIDEBAR FILTERS
  // ══════════════════════════════════════════════════════════
  async function loadSidebarFilters() {
    const categoryList = document.querySelector('.admin-panel-filter-list');
    const colorList = document.querySelector('.admin-panel-color-list');
    
    try {
      // Load Categories
      const categories = await BSC.apiFetch('/api/products/meta/categories');
      if (categoryList && categories.length > 0) {
        categoryList.innerHTML = categories.map(c => `
          <li class="admin-panel-filter-list__item">
            <label class="admin-panel-filter-list__label">
              <input type="checkbox" class="admin-panel-filter-list__checkbox" data-cat="${c.Category}" />
              <span>${c.Category}</span>
            </label>
          </li>
        `).join('');
        
        // Bind category filters
        categoryList.querySelectorAll('.admin-panel-filter-list__checkbox').forEach(cb => {
          cb.addEventListener('change', () => {
            const checked = [...categoryList.querySelectorAll('.admin-panel-filter-list__checkbox:checked')]
              .map(el => el.dataset.cat);
            loadAdminProducts(checked.length > 0 ? { category: checked[0] } : {});
            // Uncheck others to simulate single filter for now as backend handles one
            categoryList.querySelectorAll('.admin-panel-filter-list__checkbox').forEach(other => {
              if (other !== cb) other.checked = false;
            });
          });
        });
      }

      // Load Colors
      const colors = await BSC.apiFetch('/api/products/meta/colors');
      if (colorList && colors.length > 0) {
        colorList.innerHTML = colors.map(c => `
          <li class="admin-panel-color-list__item" style="cursor:pointer;" data-color="${c.ColorName}">
            <div class="admin-panel-color-list__label">
              <span class="admin-panel-color-list__swatch" style="background-color: ${c.HexCode}; border: 1px solid #ddd;"></span>
              <span>${c.ColorName}</span>
            </div>
          </li>
        `).join('');

        // Bind color filters
        colorList.querySelectorAll('.admin-panel-color-list__item').forEach(item => {
          item.addEventListener('click', () => {
            const colorName = item.dataset.color;
            loadAdminProducts({ color: colorName });
          });
        });
      }

    } catch (err) {
      console.error('Error loading sidebar filters:', err);
    }
  }

  // ══════════════════════════════════════════════════════════
  //  SIDEBAR BEST SELLERS
  // ══════════════════════════════════════════════════════════
  async function initAdminBestsellers() {
    const listContainer = document.getElementById('adminBestsellerList');
    if (!listContainer) return;

    try {
      const data = await BSC.apiFetch('/api/products?sort=bestsellers&limit=3');
      const { products } = data;

      if (!products || products.length === 0) {
        listContainer.innerHTML = '<div style="padding:10px;color:#aaa;font-size:12px;text-align:center;">No best sellers found.</div>';
        return;
      }

      listContainer.innerHTML = products.map(p => {
        let imgSrc = p.ImageUrl || 'assets/images/chair.avif';
        if (imgSrc.startsWith('assets/')) {
           imgSrc = '../' + imgSrc;
        }
        return `
          <article class="admin-panel-best-seller-card">
            <div class="admin-panel-best-seller-card__image-wrap">
              <img src="${imgSrc}" alt="${p.ProductName}" class="admin-panel-best-seller-card__image" onerror="this.src='../assets/images/chair.avif'" />
            </div>
            <div class="admin-panel-best-seller-card__content">
              <h4 class="admin-panel-best-seller-card__name" style="margin-bottom:2px; font-weight:600; font-size:14px; color:#1f2937;">${p.ProductName}</h4>
              <p class="admin-panel-best-seller-card__price" style="font-weight:700; color:#a6866a; font-size:13px;">$${parseFloat(p.Price).toFixed(2)}</p>
            </div>
          </article>
        `;
      }).join('');
    } catch (err) {
      console.error('Error loading admin best sellers:', err);
      listContainer.innerHTML = '<div style="padding:10px;color:#e44;font-size:12px;text-align:center;">Failed to load.</div>';
    }
  }

  // ══════════════════════════════════════════════════════════
  //  ADD / EDIT PRODUCT FORM
  // ══════════════════════════════════════════════════════════

  async function populateCategoryDropdown() {
    const select = addProductForm?.querySelector('.add-product-form__category-select');
    if (!select) return;

    try {
      const categories = await BSC.apiFetch('/api/products/meta/categories');
      select.innerHTML = `<option value="">— Select Category —</option>` +
        categories.map(c => `<option value="${c.CategoryId}">${c.Category}</option>`).join('');
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }

  async function populateMaterialDropdown() {
    const select = addProductForm?.querySelector('.add-product-form__material-select');
    if (!select) return;

    try {
      const materials = await BSC.apiFetch('/api/products/meta/materials');
      select.innerHTML = `<option value="">— Select Material —</option>` +
        materials.map(m => `<option value="${m.MaterialId}">${m.MaterialName}</option>`).join('');
    } catch (err) {
      console.error('Error loading materials:', err);
    }
  }

  async function populateColorsList() {
    const colorList = addProductForm?.querySelector('.add-product-form__color-list');
    if (!colorList) return;

    try {
      const colors = await BSC.apiFetch('/api/products/meta/colors');
      if (!Array.isArray(colors) || colors.length === 0) {
        colorList.innerHTML = '<p>No colors available</p>';
        return;
      }

      colorList.innerHTML = colors.map(c => {
        const hexCode = c.HexCode && c.HexCode.startsWith('#') ? c.HexCode : '#' + c.HexCode;
        return `
          <div class="color-selection-item" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 8px; background: white; border: 1px solid #eee; margin-bottom: 2px; transition: all 0.2s ease;">
            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; flex: 1; min-width: 0;">
              <input type="checkbox" name="color" value="${c.ColorId}" class="color-checkbox" />
              <span style="width: 24px; height: 24px; flex-shrink: 0; background-color: ${hexCode}; border: 1px solid rgba(0,0,0,0.1); border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"></span>
              <span style="font-size: 14px; font-weight: 500; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.ColorName}</span>
            </label>
            <div class="index-wrapper" style="display: flex; align-items: center; gap: 8px; padding-left: 12px; border-left: 1px solid #f0f0f0; margin-left: 8px;">
              <span style="font-size: 10px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Idx:</span>
              <input type="number" class="color-index-input" data-color-id="${c.ColorId}" min="1" max="50" value="1" 
                     style="width: 44px; height: 28px; padding: 2px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; font-weight: 600; text-align: center; background: #fff;" />
            </div>
          </div>
        `;
      }).join('');

      // Add listener to toggle index input enabled state
      colorList.querySelectorAll('.color-checkbox').forEach(cb => {
        const item = cb.closest('.color-selection-item');
        const indexInput = item?.querySelector('.color-index-input');
        
        // Initial state
        if (indexInput) {
          indexInput.disabled = !cb.checked;
          indexInput.style.opacity = cb.checked ? '1' : '0.5';
        }

        cb.addEventListener('change', () => {
          if (indexInput) {
            indexInput.disabled = !cb.checked;
            indexInput.style.opacity = cb.checked ? '1' : '0.5';
            if (cb.checked) indexInput.focus();
          }
        });
      });
    } catch (err) {
      console.error('Error loading colors:', err);
    }
  }

  async function bindAddProductForm() {
    if (!addProductForm) return;

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    // ─── Image URL management (accessible throughout this scope) ────
    const imageUrlInput = document.getElementById('image-url-input');
    const addImageBtn = document.getElementById('add-image-btn');
    const imagesList = document.getElementById('images-list');
    let imageUrls = [];

    // ─── Button references by ID ────
    const addBtn = document.getElementById('btn-add-product');
    const updateBtn = document.getElementById('btn-update-product');

    if (editId) {
      const titleEl = document.querySelector('.add-product-form-panel__title');
      if (titleEl) titleEl.textContent = 'Edit Product';
      // Show Update, hide Add
      if (addBtn) addBtn.style.display = 'none';
      if (updateBtn) updateBtn.style.display = '';
      await prefillEditForm(editId);
    } else {
      // Show Add, hide Update
      if (addBtn) addBtn.style.display = '';
      if (updateBtn) updateBtn.style.display = 'none';
    }

    // Wire up Add Product button
    if (addBtn) {
      addBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await handleAddProductSubmit(null);
      });
    }

    // Wire up Update Product button
    if (updateBtn) {
      updateBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await handleAddProductSubmit(editId);
      });
    }

    if (addImageBtn) {
      addImageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = imageUrlInput?.value.trim();
        if (!url) {
          BSC.showToast('Please enter an image URL', 'error');
          return;
        }
        if (imageUrls.includes(url)) {
          BSC.showToast('URL already added', 'error');
          return;
        }
        imageUrls.push(url);
        renderImagesList();
        updatePreviewImages();
        if (imageUrlInput) imageUrlInput.value = '';
      });
    }

    function renderImagesList() {
      if (!imagesList) return;
      imagesList.innerHTML = imageUrls.map((url, idx) => `
        <div style="background: #f0f0f0; padding: 8px; border-radius: 4px; display: flex; align-items: center; gap: 8px; font-size: 12px;">
          <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${url}</span>
          <button type="button" class="remove-image-btn" data-idx="${idx}" style="background: #e44; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer;">✕</button>
        </div>
      `).join('');

      imagesList.querySelectorAll('.remove-image-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          imageUrls.splice(parseInt(btn.dataset.idx), 1);
          renderImagesList();
          updatePreviewImages();
        });
      });
    }

    async function handleAddProductSubmit(editId) {
      // Get all inputs by class since they don't have name attributes
      const inputs = addProductForm.querySelectorAll('.add-product-form__input');
      const dimensions = addProductForm.querySelectorAll('.add-product-dimension-card__input');
      const textareas = addProductForm.querySelectorAll('.add-product-form__textarea');
      
      // Validate required fields
      if (!inputs[0]?.value.trim()) {
        BSC.showToast('Product name is required', 'error');
        return;
      }
      const categoryId = parseInt(addProductForm.querySelector('.add-product-form__category-select')?.value) || 0;
      if (!categoryId) {
        BSC.showToast('Please select a category', 'error');
        return;
      }
      const materialId = parseInt(addProductForm.querySelector('.add-product-form__material-select')?.value) || 0;
      const price = parseFloat(inputs[1]?.value) || 0;
      if (!price || price <= 0) {
        BSC.showToast('Price must be greater than 0', 'error');
        return;
      }
      if (!textareas[0]?.value.trim()) {
        BSC.showToast('Product detail is required', 'error');
        return;
      }
      if (!textareas[1]?.value.trim()) {
        BSC.showToast('Product description is required', 'error');
        return;
      }
      
      const formData = {
        productName: inputs[0]?.value || '',
        price: price,
        quantityLeft: parseInt(inputs[2]?.value) || 0,
        categoryId: categoryId,
        materialId: materialId || null,
        lengthDimension: parseFloat(dimensions[0]?.value) || 0,
        widthDimension: parseFloat(dimensions[1]?.value) || 0,
        heightDimension: parseFloat(dimensions[2]?.value) || 0,
        weight: parseFloat(dimensions[3]?.value) || 0,
        productDetail: textareas[0]?.value || '',
        productDescription: textareas[1]?.value || '',
        imageUrls: imageUrls,
        colorIds: [...addProductForm.querySelectorAll('.color-checkbox:checked')].map(checkbox => {
          const colorId = parseInt(checkbox.value);
          const item = checkbox.closest('.color-selection-item');
          const indexInput = item?.querySelector('.color-index-input');
          const index = parseInt(indexInput?.value) || 0;
          return { id: colorId, index: index };
        }), // Send the full objects to stay consistent with backend updates
        featured: addProductForm.querySelector('.add-product-form__toggle-track')?.classList.contains('active') || false,
        status: addProductForm.querySelector('.add-product-form__status-select')?.value || 'Active',
      };

      const btn = editId
        ? document.getElementById('btn-update-product')
        : document.getElementById('btn-add-product');
      btn.disabled = true;
      btn.textContent = editId ? 'Updating…' : 'Adding…';

      try {
        if (editId) {
          await BSC.apiFetch(`/api/products/${editId}`, {
            method: 'PUT',
            body: JSON.stringify(formData),
          });
          BSC.showToast('Product updated!', 'success');
        } else {
          await BSC.apiFetch('/api/products', {
            method: 'POST',
            body: JSON.stringify(formData),
          });
          BSC.showToast('Product added!', 'success');
        }
        setTimeout(() => window.location.href = 'admin-panel', 1000);
      } catch (err) {
        const errorMsg = err.data?.message || err.data?.error || err.message;
        console.error('Submission failed:', err);
        BSC.showToast(`Error: ${errorMsg}`, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = editId ? 'Update Product' : 'Add Product';
      }
    }

    async function prefillEditForm(id) {
      console.log('Fetching product details for ID:', id);
      try {
        const product = await BSC.apiFetch(`/api/products/${id}`);
        console.log('Product fetched for prefill:', product);
        
        // Get all inputs by class since they don't have name attributes
        const inputs = addProductForm.querySelectorAll('.add-product-form__input');
        const dimensions = addProductForm.querySelectorAll('.add-product-dimension-card__input');
        const textareas = addProductForm.querySelectorAll('.add-product-form__textarea');
        
        // Set basic fields by index
        if (inputs[0]) inputs[0].value = product.ProductName || ''; // Name
        if (inputs[1]) inputs[1].value = product.Price || ''; // Price
        if (inputs[2]) inputs[2].value = product.QuantityLeft || 0; // Quantity
        
        // Set category and material selects
        const categorySelect = addProductForm.querySelector('.add-product-form__category-select');
        if (categorySelect) categorySelect.value = product.CategoryId || '';
        
        const materialSelect = addProductForm.querySelector('.add-product-form__material-select');
        if (materialSelect) materialSelect.value = product.MaterialId || '';
        
        // Set dimensions (4 inputs: length, width, height, weight)
        if (dimensions[0]) dimensions[0].value = product.LengthDimension || product.LengthCM || 0; // Length
        if (dimensions[1]) dimensions[1].value = product.WidthDimension || product.WidthCM || 0; // Width
        if (dimensions[2]) dimensions[2].value = product.HeightDimension || product.HeightCM || 0; // Height
        if (dimensions[3]) dimensions[3].value = product.Weight || product.WeightKG || 0; // Weight
        
        // Set textareas (Details and Description)
        if (textareas[0]) textareas[0].value = product.ProductDetail || ''; // Details
        if (textareas[1]) textareas[1].value = product.ProductDescription || ''; // Description
        
        // Set Status
        const statusSelect = addProductForm.querySelector('.add-product-form__status-select');
        if (statusSelect) statusSelect.value = product.Status || 'Active';
        
        // Set colors based on stored SortOrder
        if (product.colors && product.colors.length > 0) {
          console.log('Setting colors:', product.colors);
          product.colors.forEach((pc) => {
            const checkbox = addProductForm.querySelector(`.color-checkbox[value="${pc.ColorId}"]`);
            if (checkbox) {
              checkbox.checked = true;
              const item = checkbox.closest('.color-selection-item');
              const indexInput = item?.querySelector('.color-index-input');
              if (indexInput) {
                indexInput.value = pc.SortOrder || 0;
                indexInput.disabled = false;
                indexInput.style.opacity = '1';
              }
            }
          });
        }
        
        // Set images
        if (product.images && product.images.length > 0) {
          console.log('Setting images:', product.images);
          imageUrls = product.images.map(i => i.ImageUrl);
          renderImagesList();
          updatePreviewImages();
        }
        
        // Set featured toggle
        if (product.Featured) {
          const toggleTrack = addProductForm.querySelector('.add-product-form__toggle-track');
          if (toggleTrack) {
            toggleTrack.classList.add('active');
            toggleTrack.style.background = '#22c55e';
            const toggleThumb = addProductForm.querySelector('.add-product-form__toggle-thumb');
            if (toggleThumb) toggleThumb.style.transform = 'translateX(20px)';
          }
        }
        
        console.log('Form prefilled successfully. Image URLs:', imageUrls);
      } catch (err) {
        console.error('Error in prefillEditForm:', err);
        BSC.showToast('Failed to load product: ' + err.message, 'error');
      }
    }

    function updatePreviewImages() {
      const previewImages = document.querySelectorAll('.add-product-preview__image');
      if (!previewImages.length) return;

      const firstImage = imageUrls[0] || '';

      previewImages.forEach((img, idx) => {
        if (imageUrls[idx]) {
          img.src = imageUrls[idx];
          img.style.opacity = '1';
        } else if (firstImage) {
          // If at least one image is uploaded, repeat it in the other slots but slightly faded
          img.src = firstImage;
          img.style.opacity = '0.4';
        } else {
          // Use the placeholder we set in the HTML as the ultimate fallback
          // But ensure we clear any leftover hardcoded images if they somehow persist
          if (!img.src || img.src.includes('assets/images/best-seller')) {
            img.src = 'https://placehold.co/600x400/eae3db/999?text=Product+Image';
          }
          img.style.opacity = '1';
        }
        img.style.objectFit = 'cover';
      });
    }

    // Initialize preview on load
    updatePreviewImages();
  }

  // ══════════════════════════════════════════════════════════
  //  ADMIN DASHBOARD: Stats & Global Management
  // ══════════════════════════════════════════════════════════

  async function loadDashboardStats() {
    try {
      const stats = await BSC.apiFetch('/api/admin/stats');
      const revenueEl = document.querySelector('.js-stat-revenue');
      const membersEl = document.querySelector('.js-stat-members');
      const ordersEl = document.querySelector('.js-stat-orders');

      if (revenueEl) revenueEl.textContent = `$${parseFloat(stats.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      if (membersEl) membersEl.textContent = stats.memberCount.toLocaleString();
      if (ordersEl) ordersEl.textContent = stats.orderCount.toLocaleString();
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  }

  function initAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetView = tab.dataset.tab;
        
        // Update tab active state
        tabs.forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');

        // Show/Hide views
        document.querySelectorAll('.admin-view').forEach(view => {
          view.classList.add('is-hidden');
        });
        document.getElementById(`${targetView}-view`)?.classList.remove('is-hidden');

        // Hide sidebar and actions if not on products
        const sidebar = document.querySelector('.admin-panel-sidebar');
        const actions = document.querySelector('.admin-panel-content__actions');
        const headerTitle = document.querySelector('.admin-panel-content__title');

        if (targetView === 'products') {
          if (sidebar) sidebar.style.display = '';
          if (actions) actions.style.display = '';
          if (headerTitle) headerTitle.textContent = 'Products Management';
          loadAdminProducts();
        } else if (targetView === 'orders') {
          if (sidebar) sidebar.style.display = 'none';
          if (actions) actions.style.display = 'none';
          if (headerTitle) headerTitle.textContent = 'Global Orders History';
          loadGlobalOrders();
        } else if (targetView === 'members') {
          if (sidebar) sidebar.style.display = 'none';
          if (actions) actions.style.display = 'none';
          if (headerTitle) headerTitle.textContent = 'Registered Members';
          loadAdminMembers();
        } else if (targetView === 'contacts') {
          if (sidebar) sidebar.style.display = 'none';
          if (actions) actions.style.display = 'none';
          if (headerTitle) headerTitle.textContent = 'User Inquiries (Contact Form)';
          loadAdminContacts();
        }
      });
    });

    // Handle URL parameter ?tab=orders
    const urlParams = new URLSearchParams(window.location.search);
    const requestedTab = urlParams.get('tab');
    if (requestedTab) {
      const tabToClick = document.querySelector(`.admin-tab[data-tab="${requestedTab}"]`);
      if (tabToClick) tabToClick.click();
    }
  }

  async function loadGlobalOrders() {
    const tableBody = document.getElementById('orders-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">Loading orders...</td></tr>';
    
    try {
      const orders = await BSC.apiFetch('/api/admin/orders');
      if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">No orders found.</td></tr>';
        return;
      }

      tableBody.innerHTML = orders.map(o => {
        const orderDate = new Date(o.OrderDate);
        const isValidDate = !isNaN(orderDate.getTime());
        
        const dateStr = isValidDate 
          ? orderDate.toLocaleString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
              timeZone: 'Asia/Bangkok'
            })
          : '—';
        
        const statusClass = o.DeliveryStatus?.toLowerCase() || 'pending';
        
        return `
          <tr class="admin-panel-table__row">
            <td><strong>#${o.OrderId}</strong></td>
            <td>${o.FirstName} ${o.LastName}</td>
            <td style="font-size:11px;color:#666;">${o.ContactEmail}</td>
            <td class="admin-panel-table__price">$${parseFloat(o.TotalAmount).toFixed(2)}</td>
            <td><span class="status-badge status-badge--${statusClass}">${o.DeliveryStatus}</span></td>
            <td style="font-size:11px;color:#666;max-width:200px;white-space:normal;">${o.AddressDetail}</td>
            <td style="font-size:11px;">${dateStr}</td>
            <td class="u-text-center">
              <button class="order-view-btn" onclick="window.location.href='order-details.html?id=${o.OrderId}'">
                View
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Error loading global orders:', err);
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:red;">Error: ${err.message}</td></tr>`;
    }
  }

  async function loadAdminMembers() {
    const tableBody = document.getElementById('members-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">Loading members...</td></tr>';

    try {
      const members = await BSC.apiFetch('/api/admin/members');
      if (members.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">No members registered.</td></tr>';
        return;
      }

      tableBody.innerHTML = members.map(m => `
        <tr class="admin-panel-table__row">
          <td><strong>#${m.MemberId}</strong></td>
          <td>${m.FirstName}</td>
          <td>${m.LastName}</td>
          <td>${m.MemberEmail}</td>
          <td>${m.PhoneNumber}</td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error loading members:', err);
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:red;">Error: ${err.message}</td></tr>`;
    }
  }

  async function loadAdminContacts() {
    const tableBody = document.getElementById('contacts-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">Loading messages...</td></tr>';

    try {
      const contacts = await BSC.apiFetch('/api/admin/contacts');
      if (contacts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">No messages received yet.</td></tr>';
        return;
      }

      tableBody.innerHTML = contacts.map(c => {
        // Handle cases where CreatedAt might be missing in local SQLite
        let dateStr = 'New Request';
        if (c.CreatedAt) {
          const date = new Date(c.CreatedAt);
          if (!isNaN(date.getTime())) {
            dateStr = date.toLocaleString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            });
          }
        }

        return `
          <tr class="admin-panel-table__row">
            <td><strong>#${c.ContactorId || c.contactorid || '?'}</strong></td>
            <td>${c.FirstName || ''} ${c.LastName || ''}</td>
            <td style="font-size:11px;color:#666;">${c.Email || 'No Email'}</td>
            <td style="font-size:11px;color:#333;max-width:300px;white-space:normal;line-height:1.4;word-break:break-all;word-wrap:break-word;">${c.Message || ''}</td>
            <td style="font-size:11px;">${dateStr}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Error loading contact messages:', err);
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:red;">Error: ${err.message}</td></tr>`;
    }
  }

  // Legacy modal logic removed in favor of dedicated order-details.html redirection.

});
