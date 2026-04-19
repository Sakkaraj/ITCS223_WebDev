/**
 * order-details.js
 * Handles fetching and rendering details for a specific order.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Get Order ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  const fromUser = urlParams.get('from') === 'user';

  if (!orderId) {
    window.location.href = fromUser ? 'my-orders.html' : 'admin-panel.html?tab=orders';
    return;
  }

  // 2. Fetch and render data
  try {
    const endpoint = fromUser ? `/api/orders/my/${orderId}` : `/api/admin/orders/${orderId}`;
    
    // Update UI based on context (user vs admin)
    const backBtn = document.querySelector('.back-link');
    const heroTitle = document.getElementById('hero-title');
    const heroEyebrow = document.getElementById('hero-eyebrow');

    if (fromUser) {
       if (backBtn) {
          backBtn.href = 'my-orders.html';
          backBtn.innerHTML = '<i data-lucide="arrow-left"></i> Back to My Orders';
       }
       if (heroEyebrow) heroEyebrow.textContent = 'Your Order';
       if (heroTitle) heroTitle.textContent = 'Order Details';

       const pageTitle = document.getElementById('page-title');
       if (pageTitle) pageTitle.textContent = 'Order Receipt | Furniture Store';

       if (window.lucide) lucide.createIcons();
    } else {
       // Admin view — override the default back-link to go to admin dashboard
       if (backBtn) {
          backBtn.href = 'admin-panel.html?tab=orders';
          backBtn.innerHTML = '<i data-lucide="arrow-left"></i> Back to Dashboard';
       }
       if (heroEyebrow) heroEyebrow.textContent = 'Admin Panel';
       if (heroTitle) heroTitle.textContent = 'Order Inspection';
    }

    const data = await BSC.apiFetch(endpoint);
    renderOrderDetails(data);

    // 3. Admin-only functionality
    if (!fromUser && BSC.isAdmin()) {
        initAdminControls(orderId, data.DeliveryStatus || data.deliverystatus || 'Pending');
    }

  } catch (err) {
    console.error('Error loading order details:', err);
    alert('Error loading order details: ' + err.message);
    window.location.href = urlParams.get('from') === 'user' ? 'my-orders.html' : 'admin-panel.html';
  }
});

function renderOrderDetails(data) {
  // Metadata
  const orderIdVal = data.OrderId || data.orderid || 'N/A';
  const firstName = data.FirstName || data.firstname || '';
  const lastName = data.LastName || data.lastname || '';
  const contactEmail = data.ContactEmail || data.contactemail || 'N/A';
  const phoneNumber = data.PhoneNumber || data.phonenumber || 'N/A';
  const addressDetail = data.AddressDetail || data.addressdetail || 'N/A';

  document.getElementById('detail-order-id').textContent = `#${orderIdVal}`;
  document.getElementById('detail-customer-name').textContent = `${firstName} ${lastName}`.trim() || 'Guest';
  document.getElementById('detail-customer-email').textContent = contactEmail;
  document.getElementById('detail-customer-phone').textContent = phoneNumber;
  document.getElementById('detail-address').textContent = addressDetail;
  
  const orderDate = new Date(data.OrderDate);
  document.getElementById('detail-order-date').textContent = orderDate.toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok'
  });

  const status = data.DeliveryStatus || 'Pending';
  const statusEl = document.getElementById('detail-order-status');
  statusEl.className = `status-badge status-badge--${status.toLowerCase()}`;
  statusEl.textContent = status;

  // Items Table
  const itemsBody = document.getElementById('detail-items-body');
  const itemsCountEl = document.getElementById('detail-items-count');
  
  if (data.items && data.items.length > 0) {
    if (itemsCountEl) itemsCountEl.textContent = `${data.items.length} Item${data.items.length > 1 ? 's' : ''}`;
    itemsBody.innerHTML = data.items.map(item => {
      let imgSrc = item.ImageUrl || '../assets/images/chair.avif';
      if (imgSrc.startsWith('assets/')) imgSrc = '../' + imgSrc;

      // Resilient field retrieval for production compatibility
      const qty = item.ItemQuantity || item.itemquantity || item.quantity || 0;
      const price = parseFloat(item.Price || item.price || 0);
      const subtotal = item.SubTotal || item.subtotal || (qty * price);

      return `
        <tr class="order-item-row">
          <td class="order-item-cell--image">
            <img src="${imgSrc}" alt="${item.ProductName}" 
                 class="order-item-image"
                 onerror="this.src='../assets/images/chair.avif'">
          </td>
          <td class="order-item-cell--info">
            <div class="order-item-info">
              <strong class="order-item-name">${item.ProductName || item.productname}</strong>
              <div class="order-item-meta">
                ID: #${item.ProductId || item.productid} | Material: ${item.MaterialName || item.materialname || 'Standard'} | Color: ${item.ColorName || item.colorname || 'Standard'}
              </div>
            </div>
          </td>
          <td class="order-item-cell--qty" data-label="Qty">${qty}</td>
          <td class="order-item-cell--price" data-label="Price">$${price.toFixed(2)}</td>
          <td class="order-item-cell--total" data-label="Total">$${parseFloat(subtotal || 0).toFixed(2)}</td>
        </tr>
      `;
    }).join('');
  } else {
    itemsBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">No items found in this order.</td></tr>';
  }

  // Summary Totals
  const summaryTotal = parseFloat(data.TotalAmount || data.totalamount || 0);
  const vatAmount = parseFloat(data.VatAmount || data.vatamount || 0);
  const shippingAmount = parseFloat(data.ShippingAmount || data.shippingamount || 0);
  const calculatedSubtotal = data.items.reduce((sum, item) => {
     const q = item.ItemQuantity || item.itemquantity || item.quantity || 0;
     const p = parseFloat(item.Price || item.price || 0);
     return sum + (q * p);
  }, 0);

  document.getElementById('summary-total').textContent = `$${summaryTotal.toFixed(2)}`;
  document.getElementById('detail-subtotal').textContent = `$${calculatedSubtotal.toFixed(2)}`;
  document.getElementById('detail-vat').textContent = `$${vatAmount.toFixed(2)}`;
  document.getElementById('detail-shipping').textContent = `$${shippingAmount.toFixed(2)}`;
  document.getElementById('detail-total').textContent = `$${summaryTotal.toFixed(2)}`;
}

/**
 * Admin Status Control Logic
 */
function initAdminControls(orderId, currentStatus) {
  const adminPanel = document.getElementById('admin-status-control');
  const statusSelect = document.getElementById('admin-status-select');
  const updateBtn = document.getElementById('admin-update-status-btn');

  if (!adminPanel) return;

  // Reveal the panel for admins
  adminPanel.style.display = 'block';
  statusSelect.value = currentStatus;

  updateBtn.addEventListener('click', async () => {
    const newStatus = statusSelect.value;
    updateBtn.disabled = true;
    updateBtn.textContent = 'Updating...';

    try {
      await BSC.apiFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      
      BSC.showToast(`Order #${orderId} set to "${newStatus}"`, 'success');
      
      // Hot-update the UI status badge
      const statusEl = document.getElementById('detail-order-status');
      if (statusEl) {
        statusEl.className = `status-badge status-badge--${newStatus.toLowerCase()}`;
        statusEl.textContent = newStatus;
      }
      
    } catch (err) {
      console.error('Status update failed:', err);
      BSC.showToast(err.message || 'Failed to update status', 'error');
    } finally {
      updateBtn.disabled = false;
      updateBtn.textContent = 'Update Status';
    }
  });

  // Re-init lucide icons for the newly shown panel
  if (window.lucide) lucide.createIcons();
}
