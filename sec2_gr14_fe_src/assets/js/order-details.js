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
  } catch (err) {
    console.error('Error loading order details:', err);
    alert('Error loading order details: ' + err.message);
    window.location.href = urlParams.get('from') === 'user' ? 'my-orders.html' : 'admin-panel.html';
  }
});

function renderOrderDetails(data) {
  // Metadata
  document.getElementById('detail-order-id').textContent = `#${data.OrderId}`;
  document.getElementById('detail-customer-name').textContent = `${data.FirstName} ${data.LastName}`;
  document.getElementById('detail-customer-email').textContent = data.ContactEmail;
  document.getElementById('detail-customer-phone').textContent = data.PhoneNumber || 'N/A';
  document.getElementById('detail-address').textContent = data.AddressDetail;
  
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

      return `
        <tr class="order-item-row">
          <td class="order-item-cell--image">
            <img src="${imgSrc}" alt="${item.ProductName}" 
                 class="order-item-image"
                 onerror="this.src='../assets/images/chair.avif'">
          </td>
          <td class="order-item-cell--info">
            <div class="order-item-info">
              <strong class="order-item-name">${item.ProductName}</strong>
              <div class="order-item-meta">
                ID: #${item.ProductId} | Material: ${item.MaterialName || 'Standard'} | Color: ${item.ColorName || 'Standard'}
              </div>
            </div>
          </td>
          <td class="order-item-cell--qty" data-label="Qty">${item.ItemQuantity}</td>
          <td class="order-item-cell--price" data-label="Price">$${parseFloat(item.Price).toFixed(2)}</td>
          <td class="order-item-cell--total" data-label="Total">$${parseFloat(item.SubTotal).toFixed(2)}</td>
        </tr>
      `;
    }).join('');
  } else {
    itemsBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">No items found in this order.</td></tr>';
  }

  // Summary Totals
  const subtotal = data.items.reduce((sum, item) => sum + item.SubTotal, 0);
  document.getElementById('summary-total').textContent = `$${parseFloat(data.TotalAmount).toFixed(2)}`;
  document.getElementById('detail-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('detail-vat').textContent = `$${parseFloat(data.VatAmount).toFixed(2)}`;
  document.getElementById('detail-shipping').textContent = `$${parseFloat(data.ShippingAmount || 0).toFixed(2)}`;
  document.getElementById('detail-total').textContent = `$${parseFloat(data.TotalAmount).toFixed(2)}`;
}
