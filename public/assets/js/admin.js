/**
 * admin.js — Admin panel & add-product page logic.
 * Depends on api.js being loaded first.
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ─── Guard: Admin only ────────────────────────────────────
  if (!BSC.isLoggedIn() || !BSC.isAdmin()) {
    BSC.showToast('Admin access required. Redirecting…', 'error');
    setTimeout(() => { window.location.href = 'admin-login.html'; }, 1500);
    return;
  }

  // ─── Admin Panel Page (admin-panel.html) ──────────────────
  const adminTableBody = document.querySelector('.admin-panel-table__body');
  if (adminTableBody) {
    await loadAdminProducts();
  }

  // ─── Add Product Page (add-product.html) ─────────────────
  const addProductForm = document.querySelector('.add-product-form');
  if (addProductForm) {
    await populateCategoryDropdown();
    bindAddProductForm();
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
      const params = new URLSearchParams({ limit: 50, ...filters });
      const data   = await BSC.apiFetch(`/api/products?${params}`);
      const { products } = data;

      // Update result count in header
      const titleEl = document.querySelector('.admin-panel-content__title');
      if (titleEl) titleEl.textContent = `Admin Panel (${products.length} products)`;

      if (products.length === 0) {
        adminTableBody.innerHTML = `
          <tr><td colspan="8" style="text-align:center;padding:60px;color:#888;">
            No products found. <a href="add-product.html" style="color:#333;text-decoration:underline;">Add one?</a>
          </td></tr>
        `;
        return;
      }

      adminTableBody.innerHTML = products.map(p => {
        const imgSrc = p.ImageUrl ||
          'assets/images/chair.avif';
        return `
          <tr class="admin-panel-table__row" data-id="${p.ProductId}">
            <td class="admin-panel-table__product-cell">
              <img src="${imgSrc}" alt="${p.ProductName}" class="admin-panel-table__product-image"
                   onerror="this.src='assets/images/chair.avif'" />
              <span class="admin-panel-table__product-name">${p.ProductName}</span>
            </td>
            <td class="admin-panel-table__muted">${p.Category}</td>
            <td class="admin-panel-table__price">$${parseFloat(p.Price).toFixed(2)}</td>
            <td class="admin-panel-table__stacked">
              <span><b>Stock:</b> ${p.QuantityLeft}</span>
            </td>
            <td class="admin-panel-table__stacked">
              <span>${p.ProductDescription ? p.ProductDescription.substring(0, 60) + '…' : '—'}</span>
            </td>
            <td class="admin-panel-table__description" style="font-size:12px;color:#666;">
              ${p.ProductDescription ? p.ProductDescription.substring(0, 80) + '…' : '—'}
            </td>
            <td class="admin-panel-table__featured">
              <span style="color:${p.Featured ? '#22c55e' : '#999'};font-weight:600;">
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
      adminTableBody.innerHTML = `
        <tr><td colspan="8" style="text-align:center;padding:40px;color:#e44;">
          Failed to load: ${err.message}
        </td></tr>
      `;
    }
  }

  function bindAdminActions() {
    // Edit buttons → redirect to add-product.html?edit=<id>
    adminTableBody.querySelectorAll('.js-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = `add-product.html?edit=${btn.dataset.id}`;
      });
    });

    // Delete buttons → show modal
    adminTableBody.querySelectorAll('.js-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id   = btn.dataset.id;
        const name = btn.dataset.name;
        openDeleteModal(id, name);
      });
    });

    // Add Product button in header
    document.querySelector('.admin-panel-content__add-button, .admin-panel-hero__add-button')
      ?.addEventListener('click', () => {
        window.location.href = 'add-product.html';
      });
  }

  // ─── Delete Modal ─────────────────────────────────────────
  let pendingDeleteId = null;

  function openDeleteModal(id, name) {
    pendingDeleteId = id;
    const modal = document.getElementById('deleteModal');
    const titleEl = modal?.querySelector('.admin-panel-modal__title');
    if (titleEl) titleEl.textContent = `Delete "${name}"?`;
    modal?.classList.remove('is-hidden');
  }

  // Close modal buttons
  document.querySelectorAll('[onclick="closeModal()"]').forEach(el => {
    el.removeAttribute('onclick');
    el.addEventListener('click', () => {
      document.getElementById('deleteModal')?.classList.add('is-hidden');
      pendingDeleteId = null;
    });
  });
  document.querySelector('.admin-panel-modal__backdrop')?.addEventListener('click', () => {
    document.getElementById('deleteModal')?.classList.add('is-hidden');
    pendingDeleteId = null;
  });

  // Confirm delete
  document.querySelector('.admin-panel-modal__button--delete')?.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    const btn = document.querySelector('.admin-panel-modal__button--delete');
    btn.disabled = true;
    btn.textContent = 'Deleting…';

    try {
      await BSC.apiFetch(`/api/products/${pendingDeleteId}`, { method: 'DELETE' });
      document.getElementById('deleteModal')?.classList.add('is-hidden');
      BSC.showToast('Product deleted successfully.', 'success');
      pendingDeleteId = null;
      await loadAdminProducts();
    } catch (err) {
      BSC.showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  });

  // ─── Admin Filter (sidebar checkboxes) ───────────────────
  document.querySelectorAll('.admin-panel-filter-list__checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const checked = [...document.querySelectorAll('.admin-panel-filter-list__checkbox:checked')]
        .map(el => el.parentElement.querySelector('span')?.textContent.trim());
      if (checked.length > 0) {
        loadAdminProducts({ category: checked[0] });
      } else {
        loadAdminProducts();
      }
    });
  });


  // ══════════════════════════════════════════════════════════
  //  ADD / EDIT PRODUCT FORM
  // ══════════════════════════════════════════════════════════

  async function populateCategoryDropdown() {
    const select = addProductForm.querySelector('.add-product-form__select');
    if (!select) return;

    try {
      const categories = await BSC.apiFetch('/api/products/meta/categories');
      select.innerHTML = `<option value="">— Select Category —</option>` +
        categories.map(c => `<option value="${c.CategoryId}">${c.Category}</option>`).join('');
    } catch {
      select.innerHTML = '<option value="">Failed to load categories</option>';
    }
  }

  function bindAddProductForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId    = urlParams.get('edit');
    const titleEl   = document.querySelector('.add-product-form-panel__title');
    const addBtn    = addProductForm.querySelector('.add-product-form__action-button--primary');

    if (editId) {
      if (titleEl) titleEl.textContent = 'Edit Product';
      if (addBtn)  addBtn.textContent  = 'Update Product';
      prefillEditForm(editId);
    }

    // Name input → live preview
    const nameInput = addProductForm.querySelector('input[placeholder="Enter Name"]');
    nameInput?.addEventListener('input', () => {
      document.querySelector('.add-product-preview__title')?.textContent === undefined ||
      (document.querySelector('.add-product-preview__title') &&
        (document.querySelector('.add-product-preview__title').textContent = nameInput.value || 'Product Name'));
    });

    // Add/Update button
    addBtn?.addEventListener('click', async () => {
      const nameEl  = addProductForm.querySelector('input[placeholder="Enter Name"]');
      const priceEl = addProductForm.querySelector('input[placeholder="250 $"]');
      const catEl   = addProductForm.querySelector('.add-product-form__select');
      const imgEl   = addProductForm.querySelector('.add-product-form__image-url');
      const detailEl = addProductForm.querySelectorAll('.add-product-form__textarea')[0];
      const descEl   = addProductForm.querySelectorAll('.add-product-form__textarea')[1];
      const lengthEl = addProductForm.querySelector('[placeholder="50 cm"]:nth-of-type(1)');

      const allInputs = addProductForm.querySelectorAll('.add-product-form__input');
      const dimInputs = addProductForm.querySelectorAll('.add-product-dimension-card__input');

      const body = {
        productName:         nameEl?.value.trim(),
        price:               parseFloat(priceEl?.value) || 0,
        categoryId:          parseInt(catEl?.value) || null,
        productDetail:       detailEl?.value.trim() || 'N/A',
        productDescription:  descEl?.value.trim()   || 'N/A',
        lengthDimension:     parseFloat(dimInputs[0]?.value) || 0,
        widthDimension:      parseFloat(dimInputs[1]?.value) || 0,
        heightDimension:     parseFloat(dimInputs[2]?.value) || 0,
        weight:              parseFloat(dimInputs[3]?.value) || 0,
        imageUrl:            allInputs[allInputs.length - 1]?.value.trim() || null,
        featured:            addProductForm.querySelector('.add-product-form__toggle-track')
                               ?.classList.contains('active') || false,
      };

      if (!body.productName || !body.categoryId || !body.price) {
        BSC.showToast('Name, category, and price are required.', 'error');
        return;
      }

      addBtn.disabled = true;
      addBtn.textContent = editId ? 'Updating…' : 'Adding…';

      try {
        if (editId) {
          await BSC.apiFetch(`/api/products/${editId}`, {
            method: 'PUT',
            body: JSON.stringify(body),
          });
          BSC.showToast('Product updated successfully!', 'success');
        } else {
          await BSC.apiFetch('/api/products', {
            method: 'POST',
            body: JSON.stringify(body),
          });
          BSC.showToast('Product added successfully!', 'success');
          addProductForm.reset();
        }
        setTimeout(() => { window.location.href = 'admin-panel.html'; }, 1500);
      } catch (err) {
        BSC.showToast(err.message, 'error');
      } finally {
        addBtn.disabled = false;
        addBtn.textContent = editId ? 'Update Product' : 'Add Product';
      }
    });

    // Featured toggle
    const toggleTrack = addProductForm.querySelector('.add-product-form__toggle-track');
    const toggleThumb = addProductForm.querySelector('.add-product-form__toggle-thumb');
    if (toggleTrack) {
      toggleTrack.style.cursor = 'pointer';
      toggleTrack.addEventListener('click', () => {
        toggleTrack.classList.toggle('active');
        if (toggleTrack.classList.contains('active')) {
          toggleTrack.style.background = '#22c55e';
          if (toggleThumb) toggleThumb.style.transform = 'translateX(20px)';
        } else {
          toggleTrack.style.background = '';
          if (toggleThumb) toggleThumb.style.transform = '';
        }
      });
    }
  }

  async function prefillEditForm(id) {
    try {
      const product = await BSC.apiFetch(`/api/products/${id}`);

      const inputs = addProductForm.querySelectorAll('.add-product-form__input');
      const textareas = addProductForm.querySelectorAll('.add-product-form__textarea');
      const catSelect = addProductForm.querySelector('.add-product-form__select');
      const dimInputs = addProductForm.querySelectorAll('.add-product-dimension-card__input');

      if (inputs[0]) inputs[0].value = product.ProductName || '';
      if (inputs[1]) inputs[1].value = product.Price || '';
      if (catSelect) catSelect.value = product.CategoryId || '';
      if (textareas[0]) textareas[0].value = product.ProductDetail || '';
      if (textareas[1]) textareas[1].value = product.ProductDescription || '';
      if (dimInputs[0]) dimInputs[0].value = product.LengthDimension || '';
      if (dimInputs[1]) dimInputs[1].value = product.WidthDimension || '';
      if (dimInputs[2]) dimInputs[2].value = product.HeightDimension || '';
      if (dimInputs[3]) dimInputs[3].value = product.Weight || '';
      if (inputs[inputs.length - 1] && product.images?.[0]?.ImageUrl) {
        inputs[inputs.length - 1].value = product.images[0].ImageUrl;
      }
    } catch (err) {
      BSC.showToast('Failed to load product for editing.', 'error');
    }
  }

  // Spin animation
  if (!document.getElementById('spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }';
    document.head.appendChild(s);
  }

});
