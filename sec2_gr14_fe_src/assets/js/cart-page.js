/**
 * cart-api.js — Loads and manages the cart page dynamically.
 * Depends on api.js being loaded first.
 */

document.addEventListener('DOMContentLoaded', async () => {

  const itemsContainer = document.getElementById('cart-items-container');
  const summarySection = document.querySelector('.cart-summary');
  const checkoutBtn  = document.querySelector('.cart-summary__checkout-button');

  if (!itemsContainer) return; // Only run on cart

  // ─── Render Cart ──────────────────────────────────────────
  async function renderCart() {
    itemsContainer.innerHTML = `
      <div style="text-align:center;padding:40px;color:#888;">
        <div style="font-size:28px;animation:spin 1s linear infinite;display:inline-block;">⟳</div>
        <p style="margin-top:10px;">Curating your collection…</p>
      </div>
    `;

    try {
      const data = await BSC.apiFetch('/api/cart');
      const { items } = data;

      if (items.length === 0) {
        itemsContainer.innerHTML = `
          <div style="text-align:center;padding:100px 20px;color:#888;grid-column:1/-1;background:var(--bg-light);border-radius:8px;">
            <p style="font-size:64px;margin-bottom:20px;">🛒</p>
            <h2 style="color:var(--text-main);font-size:24px;margin-bottom:10px;">Your cart is empty</h2>
            <p style="margin-bottom:30px;">It looks like you haven't added any pieces to your collection yet.</p>
            <a href="shop" class="cart-summary__checkout-button" style="text-decoration:none;display:inline-block;width:auto;">Explore Our Collection</a>
          </div>
        `;
        updateSummary([]);
        return;
      }

      itemsContainer.innerHTML = items.map(item => {
        let imgSrc = item.ImageUrl || 'assets/images/chair.avif';
        if (imgSrc.startsWith('assets/')) {
          imgSrc = '../' + imgSrc;
        }
        const productLink = `product?id=${item.ProductId}`;
        
        return `
          <div class="cart-item-card" data-product-id="${item.ProductId}">
            <a href="${productLink}">
              <img src="${imgSrc}" alt="${item.ProductName}" class="cart-item-image"
                   onerror="this.src='../assets/images/chair.avif'" />
            </a>
            
            <div class="cart-item-content">
              <div class="cart-item-header">
                <a href="${productLink}" class="cart-item-title">${item.ProductName}</a>
                <span class="cart-item-price">$${parseFloat(item.Price).toFixed(2)}</span>
              </div>
              
              <div class="cart-item-category">${item.Category}</div>
              
              <div class="cart-item-details">
                <div class="cart-item-spec">
                  <b>Material & Color</b>
                  <span>${item.MaterialName || '—'} / ${item.colorName || '—'}</span>
                </div>
                <div class="cart-item-spec">
                  <b>Dimensions</b>
                  <span>${item.LengthDimension || 0}x${item.WidthDimension || 0}x${item.HeightDimension || 0} cm</span>
                </div>
                <div class="cart-item-spec">
                  <b>Technical Info</b>
                  <span>Weight: ${item.Weight || 0} kg</span>
                </div>
              </div>

              <div class="cart-item-utils">
                <div class="cart-item-qty">
                  <button class="cart-item-qty-btn js-qty-btn" data-action="dec" data-id="${item.ProductId}">−</button>
                  <span class="cart-item-qty-val js-qty-display">${item.quantity}</span>
                  <button class="cart-item-qty-btn js-qty-btn" data-action="inc" data-id="${item.ProductId}">+</button>
                </div>
                
                <button class="cart-item-remove js-remove-item" data-id="${item.ProductId}" title="Remove item">
                  <i data-lucide="trash-2" style="width:18px;height:18px;"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      if (typeof lucide !== 'undefined') lucide.createIcons();

      updateSummary(items);
      bindCartActions(items);

    } catch (err) {
      itemsContainer.innerHTML = `<div style="padding:40px;color:var(--red);text-align:center;">Failed to load cart: ${err.message}</div>`;
    }
  }

  // ─── Update Summary Section ───────────────────────────────
  function updateSummary(items) {
    if (!summarySection) return;

    const subTotal = items.reduce((s, item) => s + item.Price * item.quantity, 0);
    const vat      = subTotal * 0.07;
    
    // Tiered Logistics Logic
    let logistics = 15.00;
    let shippingInfo = '';

    if (subTotal === 0) {
      logistics = 0;
    } else if (subTotal >= 1000) {
      logistics = 0;
      shippingInfo = '<span style="color:#16a34a; font-weight:700;">✓ FREE SHIPPING APPLIED</span>';
    } else if (subTotal >= 500) {
      logistics = 10;
      const amountToFree = 1000 - subTotal;
      shippingInfo = `Add <strong>$${amountToFree.toFixed(2)}</strong> more for <strong>FREE SHIPPING</strong>`;
    } else {
      logistics = 15;
      const amountToDiscount = 500 - subTotal;
      shippingInfo = `Add <strong>$${amountToDiscount.toFixed(2)}</strong> more for lower shipping cost!`;
    }

    const grandTotal = subTotal + vat + logistics;

    const subEl   = summarySection.querySelector('.js-subtotal');
    const vatEl   = summarySection.querySelector('.js-vat');
    const logEl   = summarySection.querySelector('.js-logistic');
    const infoEl  = summarySection.querySelector('.js-shipping-info');
    const totalEl = summarySection.querySelector('.js-grand-total');

    if (subEl)   subEl.textContent   = `$${subTotal.toFixed(2)}`;
    if (vatEl)   vatEl.textContent   = `$${vat.toFixed(2)} (7%)`;
    if (logEl)   logEl.textContent   = `$${logistics.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${grandTotal.toFixed(2)}`;

    // Update Premium Shipping UI
    const barEl = document.getElementById('shipping-bar');
    const msgEl = document.getElementById('shipping-message');
    const markers = document.querySelectorAll('.shipping-progress__marker');

    if (barEl && msgEl) {
      // Calculate bar percentage (capped at 100)
      const percentage = Math.min((subTotal / 1000) * 100, 100);
      barEl.style.width = `${percentage}%`;
      msgEl.innerHTML = shippingInfo;

      // Update markers state
      markers.forEach((m, idx) => {
        const threshold = idx === 0 ? 500 : 1000;
        if (subTotal >= threshold) {
          m.classList.add('is-reached');
        } else {
          m.classList.remove('is-reached');
        }
      });
      
      // Update color based on tier
      if (subTotal >= 1000) {
        barEl.style.background = '#16a34a'; // Green for free
      } else {
        barEl.style.background = 'var(--brand-brown)';
      }
    }
  }

  // ─── Bind Actions: Remove, Qty ────────────────────────────
  function bindCartActions(items) {
    // Remove buttons
    itemsContainer.querySelectorAll('.js-remove-item').forEach(btn => {
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
    itemsContainer.querySelectorAll('.js-qty-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        const action = btn.dataset.action;
        const card = itemsContainer.querySelector(`.cart-item-card[data-product-id="${id}"]`);
        const qtyDisplay = card?.querySelector('.js-qty-display');
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
        setTimeout(() => { window.location.href = 'sign-in'; }, 1500);
        return;
      }

      const addressInput = document.getElementById('delivery-address');
      const addressError = document.getElementById('address-error');
      const addressDetail = addressInput?.value.trim() || '';

      if (!addressDetail) {
        if (addressError) addressError.classList.remove('is-hidden');
        if (addressInput) addressInput.style.borderColor = 'var(--red)';
        BSC.showToast('Please provide a delivery address.', 'error');
        return;
      }

      if (addressError) addressError.classList.add('is-hidden');
      if (addressInput) addressInput.style.borderColor = '';

      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Processing…';

      try {
        const data = await BSC.apiFetch('/api/orders', {
          method: 'POST',
          body: JSON.stringify({ addressDetail }),
        });
        BSC.showToast(`Order #${data.orderId} placed! Total: $${data.totalAmount}`, 'success');
        BSC.refreshCartCount();

        // Clear input
        if (addressInput) addressInput.value = '';

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
