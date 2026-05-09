/* ================================================================
   GLOWBOOK — animations.js
   Smooth scroll animations, intersection observers, and utilities
   ================================================================ */

'use strict';

/**
 * ScrollAnimation Manager
 * Handles fade-in animations on scroll
 */
class ScrollAnimationManager {
    constructor(options = {}) {
        this.options = {
            threshold: 0.15,
            rootMargin: '0px 0px -100px 0px',
            ...options
        };
        this.observer = null;
        this.init();
    }

    init() {
        const observerOptions = {
            threshold: this.options.threshold,
            rootMargin: this.options.rootMargin
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scroll-fade-in');
                    this.observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
    }

    observe(elements) {
        if (typeof elements === 'string') {
            elements = document.querySelectorAll(elements);
        } else if (elements instanceof Element) {
            elements = [elements];
        }

        elements.forEach(el => {
            this.observer.observe(el);
        });
    }

    unobserveAll() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

/**
 * Smooth Scroll Utility
 */
const SmoothScroll = {
    to(element, options = {}) {
        const defaultOptions = {
            behavior: 'smooth',
            block: 'start',
        };
        
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            element.scrollIntoView({ ...defaultOptions, ...options });
        }
    },

    toTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

/**
 * Debounce utility for resize/scroll events
 */
function debounce(func, delay = 300) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Throttle utility for frequent events
 */
function throttle(func, limit = 1000) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Stagger Animation Helper
 * Apply staggered animation to multiple elements
 */
function staggerElements(selector, animationClass = 'slide-up', delayMs = 50) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * delayMs}ms`;
        el.classList.add(animationClass);
    });
}

/**
 * Count Animation
 * Animate numbers counting up
 */
function animateCounter(element, target, duration = 1000) {
    const increment = target / (duration / 16);
    let current = 0;

    const counter = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(counter);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

/**
 * Enhanced Toast Notifications
 */
class ToastNotification {
    constructor() {
        this.toastContainer = document.getElementById('toast');
    }

    show(message, type = 'info', duration = 3000) {
        if (!this.toastContainer) return;

        this.toastContainer.textContent = message;
        this.toastContainer.className = `gb-toast ${type}`;

        setTimeout(() => {
            this.toastContainer.classList.remove('success', 'error', 'info');
        }, duration);

        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
}

/**
 * Skeleton Loader Utility
 */
class SkeletonLoader {
    static createCardSkeleton() {
        return `
            <div class="card skeleton-card" style="animation: shimmer 2s infinite;">
                <div class="skeleton-title"></div>
                <div class="skeleton-line" style="width: 70%"></div>
                <div class="skeleton-line" style="width: 85%"></div>
                <div class="skeleton-line" style="width: 60%"></div>
            </div>
        `;
    }

    static createTableRowSkeleton(columns = 5) {
        let cells = '';
        for (let i = 0; i < columns; i++) {
            cells += `<td><div class="skeleton-line" style="width: ${60 + Math.random() * 30}%"></div></td>`;
        }
        return `<tr>${cells}</tr>`;
    }

    static createListItemSkeleton() {
        return `
            <div style="display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--pink-light);">
                <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%;"></div>
                <div style="flex: 1;">
                    <div class="skeleton-line" style="width: 60%;"></div>
                    <div class="skeleton-line" style="width: 40%; margin-top: 8px;"></div>
                </div>
            </div>
        `;
    }
}

/**
 * Loading State Manager
 */
class LoadingStateManager {
    static setLoading(button, isLoading = true, loadingText = 'Duke u ngarkuar...') {
        if (isLoading) {
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${loadingText}`;
            button.disabled = true;
        } else {
            button.innerHTML = button.dataset.originalText || 'Ruaj';
            button.disabled = false;
        }
    }

    static restoreButton(button) {
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
            button.disabled = false;
        }
    }
}

/**
 * Form Validation Helper
 */
class FormValidator {
    static validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    static validatePhone(phone) {
        const regex = /^[\d\s\-\+\(\)]{7,}$/;
        return regex.test(phone);
    }

    static validatePassword(password) {
        return password && password.length >= 4;
    }

    static markFieldError(field, message = '') {
        field.classList.add('is-err');
        if (message) {
            let errorEl = field.parentNode.querySelector('.field-error');
            if (!errorEl) {
                errorEl = document.createElement('span');
                errorEl.className = 'field-error';
                field.parentNode.appendChild(errorEl);
            }
            errorEl.textContent = message;
        }
    }

    static clearFieldError(field) {
        field.classList.remove('is-err');
        const errorEl = field.parentNode.querySelector('.field-error');
        if (errorEl) errorEl.remove();
    }
}

/**
 * Ripple Effect for Buttons
 */
function addRippleEffect(element) {
    element.addEventListener('click', function(e) {
        if (this.classList.contains('btn-primary') || this.classList.contains('btn-secondary')) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255,255,255,0.5)';
            ripple.style.animation = 'ripple .6s ease-out';
            ripple.style.pointerEvents = 'none';

            this.style.position = 'relative';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        }
    });
}

/**
 * Initialize Global Animations
 */
function initializeGlobalAnimations() {
    // Add scroll animations to cards
    const scrollAnimator = new ScrollAnimationManager({
        threshold: 0.15
    });

    // Observe cards for scroll animation
    scrollAnimator.observe('.card');
    scrollAnimator.observe('.stat-card');
    scrollAnimator.observe('.gallery-stat');
    scrollAnimator.observe('.design-card');
    scrollAnimator.observe('.admin-action-card');

    // Add ripple effects to primary buttons
    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
        addRippleEffect(btn);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                SmoothScroll.to(target);
            }
        });
    });
}

/**
 * Mobile Navigation Handler
 */
function initializeMobileNav() {
    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!hamburger) return;

    hamburger.addEventListener('click', () => {
        sidebar?.classList.toggle('open');
        overlay?.classList.toggle('open');
        hamburger.classList.toggle('open');
    });

    overlay?.addEventListener('click', () => {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('open');
        hamburger?.classList.remove('open');
    });

    // Close on nav item click
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            sidebar?.classList.remove('open');
            overlay?.classList.remove('open');
            hamburger?.classList.remove('open');
        });
    });
}

/**
 * Initialize on DOM Ready
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeGlobalAnimations();
    initializeMobileNav();
});

// Export for use in other modules
window.ScrollAnimationManager = ScrollAnimationManager;
window.SmoothScroll = SmoothScroll;
window.debounce = debounce;
window.throttle = throttle;
window.staggerElements = staggerElements;
window.animateCounter = animateCounter;
window.ToastNotification = ToastNotification;
window.SkeletonLoader = SkeletonLoader;
window.LoadingStateManager = LoadingStateManager;
window.FormValidator = FormValidator;
