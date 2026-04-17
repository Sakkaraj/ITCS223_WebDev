/**
 * home-categories.js — Dynamically loads category product counts on home
 */

document.addEventListener('DOMContentLoaded', async () => {
  const categoryGrid = document.getElementById('homeCategoryGrid');
  if (!categoryGrid) return;

  // Image mapping for categories
  const categoryImages = {
    'Tables': '../assets/images/table.avif',
    'Chairs': '../assets/images/chair.avif',
    'Armchairs': '../assets/images/chair1.avif',
    'Sofas': '../assets/images/sofa.avif',
    'Beds': '../assets/images/bed.webp',
    'Cabinets': '../assets/images/best-seller/img4.avif',
    'Decor': '../assets/images/best-seller/img6.avif'
  };

  async function loadHomeCategories() {
    try {
      // Use the existing global BSC object if available, otherwise fetch directly
      const categories = typeof BSC !== 'undefined' 
        ? await BSC.apiFetch('/api/products/meta/categories')
        : await fetch('/api/products/meta/categories').then(res => res.json());

      if (!Array.isArray(categories)) return;

      // We only show the top 4 for the main grid as per original design
      // but you can adjust this if more categories are needed.
      const displayCategories = categories.slice(0, 4);

      categoryGrid.innerHTML = displayCategories.map(cat => {
        const imgSrc = categoryImages[cat.Category] || '../assets/images/table.avif';
        return `
          <article class="category-card" style="cursor:pointer" onclick="window.location.href='shop?category=${encodeURIComponent(cat.Category)}'">
            <img src="${imgSrc}" alt="${cat.Category}" class="category-card__image" />
            <h3 class="category-card__title">${cat.Category}</h3>
            <span class="category-card__meta">${cat.ProductCount} products</span>
          </article>
        `;
      }).join('');

    } catch (err) {
      console.error('Failed to load categories:', err);
      // Fallback is already handled by static HTML if this fails before clear
    }
  }

  loadHomeCategories();
});
