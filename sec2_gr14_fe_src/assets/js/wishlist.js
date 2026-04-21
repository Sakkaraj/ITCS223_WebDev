/**
 * wishlist.js — Centralizes Wishlist logic (localStorage)
 */

(function() {
    const WISHLIST_KEY = 'bsc_wishlist';

    /* ── Wishlist Engine ─────────────────────────────────────── */

    const Wishlist = {
        /**
         * Get all wishlist items
         */
        get: function() {
            try {
                const raw = localStorage.getItem(WISHLIST_KEY);
                return raw ? JSON.parse(raw) : [];
            } catch (err) {
                console.error('Failed to parse wishlist:', err);
                return [];
            }
        },

        /**
         * Check if a product is in wishlist
         */
        has: function(productId) {
            const list = this.get();
            return list.some(p => String(p.ProductId) === String(productId));
        },

        /**
         * Toggle product in wishlist
         * @param {Object} product - The product object
         * @returns {boolean} - true if added, false if removed
         */
        toggle: function(product) {
            let list = this.get();
            const existingIdx = list.findIndex(p => String(p.ProductId) === String(product.ProductId));

            let added = false;
            if (existingIdx > -1) {
                list.splice(existingIdx, 1);
                added = false;
            } else {
                list.push(product);
                added = true;
            }

            localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
            
            // Notify layout and other components
            document.dispatchEvent(new CustomEvent('wishlistUpdated', { 
                detail: { added, product, count: list.length } 
            }));
            
            return added;
        },

        /**
         * Get item count
         */
        count: function() {
            return this.get().length;
        }
    };

    /* ── Global Exports ──────────────────────────────────────── */

    // Expose globally
    window.BSC_Wishlist = Wishlist;

    // Add to window.BSC if it exists
    if (window.BSC) {
        window.BSC.Wishlist = Wishlist;
        
        window.BSC.refreshWishlistCount = function() {
            const badges = document.querySelectorAll('.wishlist-count-badge');
            const count = Wishlist.count();
            badges.forEach(el => {
                el.textContent = count;
                el.style.display = count > 0 ? 'flex' : 'none';
            });
        };
    }
})();
