/**
 * animations.js — Add interactive animations and effects to the website
 */

document.addEventListener('DOMContentLoaded', () => {
    /* ── Button Effects ─────────────────────────────────────── */

    const buttons = document.querySelectorAll('button, a[role="button"], .shop-featured__button');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Don't apply ripple to add-to-cart or wishlist buttons that already have animations
            if (this.classList.contains('js-add-to-cart') || 
                this.classList.contains('shop-featured-card__wishlist') ||
                this.classList.contains('shop-product-card__action')) {
                return;
            }

            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            // Remove any existing ripple
            const existingRipple = this.querySelector('.ripple');
            if (existingRipple) existingRipple.remove();

            this.appendChild(ripple);

            // Remove ripple after animation
            setTimeout(() => ripple.remove(), 600);
        });
    });

    /* ── Navigation Mechanics ────────────────────────────────── */

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    /* ── Form Interactions ───────────────────────────────────── */

    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.transition = 'all 0.3s ease';
        });

        input.addEventListener('blur', function() {
            // Animation handled by CSS
        });
    });

    /* ── Badge Animations ────────────────────────────────────── */

    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class' || mutation.attributeName === 'textContent') {
                const badge = document.querySelector('.site-header__cart-badge');
                if (badge && !badge.classList.contains('is-hidden')) {
                    badge.style.animation = 'none';
                    // Trigger reflow to restart animation
                    void badge.offsetWidth;
                    badge.style.animation = 'badgePulse 2s ease-in-out infinite';
                }
            }
        });
    });

    const cartBadge = document.querySelector('.site-header__cart-badge');
    if (cartBadge) {
        observer.observe(cartBadge, {
            attributes: true,
            subtree: true,
            characterData: true
        });
    }

    /* ── Visual Transitions ──────────────────────────────────── */

    const listItems = document.querySelectorAll('.shop-filter-list__item');
    listItems.forEach((item, index) => {
        item.style.animation = `fadeIn 0.4s ease-out ${index * 0.05}s both`;
    });

    const categoryPills = document.querySelectorAll('.shop-category-pill');
    categoryPills.forEach(pill => {
        pill.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.shop-category-pill__icon-box');
            if (icon) {
                icon.style.transform = 'scale(1.15)';
            }
        });

        pill.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.shop-category-pill__icon-box');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
    });

    /* ── Page Initialization ─────────────────────────────────── */

    document.body.style.opacity = '1';

    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.style.animation = 'fadeIn 0.6s ease-out';
    }
});

/* ── Dynamic Layout Styles ──────────────────────────────────── */

const style = document.createElement('style');
style.textContent = `
    button, a[role="button"], .shop-featured__button {
        position: relative;
        overflow: hidden;
    }

    .ripple {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }

    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    body {
        opacity: 1;
        transition: opacity 0.3s ease;
    }
`;

document.head.appendChild(style);
