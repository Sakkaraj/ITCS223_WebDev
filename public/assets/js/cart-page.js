/**
 * cart-api.js — Loads and manages the cart page dynamically.
 * Depends on api.js being loaded first.
 */

document.addEventListener('DOMContentLoaded', async () => {

  const tableBody    = document.querySelector('.cart-table__body');
  const summarySection = document.querySelector('.cart-summary');
  const checkoutBtn  = document.querySelector('.cart-summary__checkout-button');

  if (!tableBody) return; // Only run on cart.html

  // ─── Render Cart ──────────────────────────────────────────
  async function renderCart() {
    tableBody.innerHTML = `
      <tr><td colspan="7" style="text-align:center;padding:40px;color:#888;">
        <div style="font-size:28px;animation:spin 1s linear infinite;display:inline-block;">⟳</div>
        <p style="margin-top:10px;">Loading your cart…</p>
      </td></tr>
    `;

    try {
      const data = await BSC.apiFetch('/api/cart');
      const { items, total } = data;

      if (items.length === 0) {
        tableBody.innerHTML = `
          <tr><td colspan="7" style="text-align:center;padding:60px;color:#888;">
            <p style="font-size:48px;">🛒</p>
            <p style="font-size:18px;font-weight:600;margin-top:12px;">Your cart is empty</p>
            <p style="font-size:14px;margin-top:6px;"><a href="shop.html" style="color:#333;text-decoration:underline;">Continue Shopping</a></p>
          </td></tr>
        `;
        updateSummary([]);
        return;
      }

      tableBody.innerHTML = items.map(item => {
        const imgSrc = item.ImageUrl || 'assets/images/chair.avif';
        // Correct path for images in subpages is often tricky, but cart.html is in /pages/
        // and images are in /assets/images/. So ../assets/images/... is correct.
        const productLink = `product.html?id=${item.ProductId}`;
        
        return `
          <tr class="cart-table__row" data-product-id="${item.ProductId}">
            <td class="cart-table__product-cell">
              <a href="${productLink}">
                <img src="${imgSrc}" alt="${item.ProductName}" class="cart-table__product-image"
                     onerror="this.src='../assets/images/chair.avif'" style="cursor:pointer;" />
              </a>
              <div class="cart-table__product-info">
                <a href="${productLink}" style="color:inherit; text-decoration:none; font-weight:600;">${item.ProductName}</a>
                <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
                  <button class="js-qty-btn" data-action="dec" data-id="${item.ProductId}"
                    style="width:24px;height:24px;border:1px solid #ddd;background:#f9f9f9;border-radius:4px;cursor:pointer;font-size:14px;">−</button>
                  <span class="cart-table__quantity js-qty-display">${item.quantity}</span>
                  <button class="js-qty-btn" data-action="inc" data-id="${item.ProductId}"
                    style="width:24px;height:24px;border:1px solid #ddd;background:#f9f9f9;border-radius:4px;cursor:pointer;font-size:14px;">+</button>
                </div>
              </div>
            </td>
            <td class="cart-table__category">${item.Category}</td>
            <td class="cart-table__price">$${parseFloat(item.Price).toFixed(2)}</td>
            <td class="cart-table__cmf">
              <div style="font-size:12px;">
                <div style="margin-bottom:4px;"><b>Mat:</b> ${item.MaterialName || '—'}</div>
                <div><b>Color:</b> ${item.colorName || '—'}</div>
              </div>
            </td>
            <td class="cart-table__dimension">
              <div style="font-size:12px;">
                <div style="margin-bottom:4px;">${item.LengthDimension || 0}x${item.WidthDimension || 0}x${item.HeightDimension || 0} cm</div>
                <div style="color:#666;">${item.Weight || 0} kg</div>
              </div>
            </td>
            <td class="cart-table__description" style="font-size:12px; color:#666; max-width:200px;">
              ${item.ProductDescription || '—'}
            </td>
            <td class="cart-table__actions">
              <button class="cart-table__delete-button js-remove-item" data-id="${item.ProductId}">
                <i data-lucide="trash-2" class="cart-table__delete-icon"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');

      // Re-init lucide icons for dynamically rendered trash icons
      if (typeof lucide !== 'undefined') lucide.createIcons();

      updateSummary(items);
      bindCartActions(items);

    } catch (err) {
      tableBody.innerHTML = `
        <tr><td colspan="7" style="text-align:center;padding:40px;color:#e44;">
          <p>Failed to load cart: ${err.message}</p>
        </td></tr>
      `;
    }
  }

  // ─── Update Summary Section ───────────────────────────────
  function updateSummary(items) {
    if (!summarySection) return;

    const subTotal = items.reduce((s, item) => s + item.Price * item.quantity, 0);
    const vat      = subTotal * 0.07;
    const logistics = items.length > 0 ? 500 : 0;
    const grandTotal = subTotal + vat + logistics;

    const subEl   = summarySection.querySelector('.js-subtotal');
    const vatEl   = summarySection.querySelector('.js-vat');
    const totalEl = summarySection.querySelector('.js-grand-total');

    if (subEl)   subEl.textContent   = `$${subTotal.toFixed(2)}`;
    if (vatEl)   vatEl.textContent   = `$${vat.toFixed(2)} (7%)`;
    if (totalEl) totalEl.textContent = `$${grandTotal.toFixed(2)}`;
  }

  // ─── Bind Actions: Remove, Qty ────────────────────────────
  function bindCartActions(items) {
    // Remove buttons
    tableBody.querySelectorAll('.js-remove-item').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        btn.disabled = true;
        try {
          await BSC.apiFetch(`/api/cart/${id}`, { method: 'DELETE' });
          BSC.showToast('Item removed from cart.', 'success');
          BSC.refreshCartCount();
          renderCart();
        } catch (err) {
          BSC.showToast(err.message, 'error');
          btn.disabled = false;
        }
      });
    });

    // Quantity buttons
    tableBody.querySelectorAll('.js-qty-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        const action = btn.dataset.action;
        const row = tableBody.querySelector(`tr[data-product-id="${id}"]`);
        const qtyDisplay = row?.querySelector('.js-qty-display');
        const item = items.find(i => i.ProductId === id);
        if (!item || !qtyDisplay) return;

        let newQty = item.quantity + (action === 'inc' ? 1 : -1);
        if (newQty < 1) {
          // Remove item instead
          await BSC.apiFetch(`/api/cart/${id}`, { method: 'DELETE' });
          BSC.showToast('Item removed from cart.', 'success');
          BSC.refreshCartCount();
          renderCart();
          return;
        }

        try {
          await BSC.apiFetch(`/api/cart/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity: newQty }),
          });
          item.quantity = newQty;
          qtyDisplay.textContent = newQty;
          updateSummary(items);
        } catch (err) {
          BSC.showToast(err.message, 'error');
        }
      });
    });
  }

  // ─── Checkout ─────────────────────────────────────────────
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      if (!BSC.isLoggedIn()) {
        BSC.showToast('Please sign in to checkout.', 'info');
        setTimeout(() => { window.location.href = 'sign-in.html'; }, 1500);
        return;
      }

      const address = prompt('Please enter your delivery address:');
      if (!address) return;

      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Processing…';

      try {
        const data = await BSC.apiFetch('/api/orders', {
          method: 'POST',
          body: JSON.stringify({ addressDetail: address }),
        });
        BSC.showToast(`Order #${data.orderId} placed! Total: $${data.totalAmount}`, 'success');
        BSC.refreshCartCount();
        setTimeout(() => renderCart(), 1200);
      } catch (err) {
        BSC.showToast(err.message, 'error');
      } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Check Out';
      }
    });
  }

  // ─── Initialise ────────────────────────────────────────────
  renderCart();

  // Spin animation
  if (!document.getElementById('spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }';
    document.head.appendChild(s);
  }
});
