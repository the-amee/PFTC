// main.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Header Scroll Effect
    const header = document.querySelector('.header');
    
    const handleScroll = () => {
        if (!header) return;
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    // Initial check and event listener
    handleScroll();
    window.addEventListener('scroll', handleScroll);

    // 2. Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navRight = document.querySelector('.nav-right');

    const closeMobileMenu = () => {
        if (!navRight || !menuToggle) return;
        navRight.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.style.overflow = '';
    };

    // 3. Desktop language link — toggle from *current* lang (href alone is wrong after in-place switches)
    document.querySelectorAll('a.lang-toggle').forEach((link) => {
        link.addEventListener('click', (e) => {
            if (e.defaultPrevented) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            const cur = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
            const isAr = cur.startsWith('ar');
            const next = isAr ? 'en' : 'ar';
            closeMobileMenu();
            if (typeof window.applySiteLanguage === 'function') {
                window.applySiteLanguage(next).catch((err) => console.error(err));
            }
        });
    });

    // 4. Mobile language switch (icon-only)
    const langMobile = document.querySelector('.lang-switch-mobile');
    if (langMobile && typeof window.applySiteLanguage === 'function') {
        langMobile.addEventListener('click', () => {
            const cur = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
            const isAr = cur.startsWith('ar');
            const next = isAr ? 'en' : 'ar';
            closeMobileMenu();
            window.applySiteLanguage(next).catch((err) => console.error(err));
        });
    }

    if (menuToggle && navRight) {
        menuToggle.addEventListener('click', () => {
            navRight.classList.toggle('active');
            menuToggle.classList.toggle('active');
            
            // Prevent scrolling on body when menu is open
            if (navRight.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close menu when clicking a link
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });
    }

    // 5. Category → subcategory (products) modal — delegation, a11y, focus trap
    const productsModal = document.getElementById('products-modal');
    const productsGrid = document.getElementById('products-grid');
    const productsModalTitle = document.getElementById('products-modal-title');
    const productsEmptyState = document.getElementById('products-empty');
    const categoriesSection = document.getElementById('categories');
    const modalCloseTriggers = document.querySelectorAll('[data-modal-close]');
    const MODAL_CLOSE_MS = 280;
    const MODAL_DISABLED_CATEGORIES = new Set(['household', 'footwear']);
    let productsDataCache = null;
    const translationCache = {};
    let activeCategory = null;
    let closeTimer = null;
    let modalPreviouslyFocused = null;
    let categoryModalCooldownUntil = 0;
    const CATEGORY_OPEN_DEBOUNCE_MS = 200;

    const getCurrentLang = () => {
        const htmlLang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
        return htmlLang.startsWith('ar') ? 'ar' : 'en';
    };

    const fetchJson = async (relativePath) => {
        const url = new URL(relativePath, window.location.href).href;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}`);
        }
        return response.json();
    };

    const getProductsData = async () => {
        if (!productsDataCache) {
            productsDataCache = await fetchJson('data/products.json');
        }
        return productsDataCache;
    };

    const getTranslations = async (lang) => {
        if (!translationCache[lang]) {
            translationCache[lang] = await fetchJson(`data/${lang}.json`);
        }
        return translationCache[lang];
    };

    /** Resolve catalog image paths (e.g. assets/images/...) against the current page URL */
    const resolveAssetUrl = (path) => {
        if (!path) return '';
        try {
            return new URL(path.replace(/^\//, ''), window.location.href).href;
        } catch {
            return path;
        }
    };

    const escapeHtml = (str) => {
        const el = document.createElement('div');
        el.textContent = str;
        return el.innerHTML;
    };

    const buildProductCard = (productName, imageSrc, fallbackAlt = productName) => {
        const safeName = escapeHtml(productName);
        const safeAlt = escapeHtml(fallbackAlt);
        return `
            <article class="product-card" role="listitem">
                <div class="product-card__image-wrap">
                    <img src="${imageSrc}" alt="${safeAlt}" loading="lazy" class="product-card__image" decoding="async">
                </div>
                <h4 class="product-card__name">${safeName}</h4>
            </article>
        `;
    };

    const getFocusableElements = (root) => {
        if (!root) return [];
        const sel = [
            'button:not([disabled])',
            '[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ].join(', ');
        return Array.from(root.querySelectorAll(sel)).filter((el) => {
            const style = window.getComputedStyle(el);
            return style.visibility !== 'hidden' && style.display !== 'none';
        });
    };

    const renderProductsModal = async () => {
        if (!activeCategory || !productsModal || !productsGrid || !productsModalTitle) return;
        const currentLang = getCurrentLang();
        const [productsData, translations] = await Promise.all([
            getProductsData(),
            getTranslations(currentLang),
        ]);

        const categoryLabel = activeCategory.labelKey
            ? (translations[activeCategory.labelKey] || activeCategory.fallbackLabel)
            : activeCategory.fallbackLabel;
        productsModalTitle.textContent = categoryLabel || 'Products';

        const categoryProducts = productsData[activeCategory.key] || [];
        const cardsMarkup = categoryProducts
            .map((product) => {
                const productName = translations[product.nameKey] || product.nameKey;
                const imgSrc = resolveAssetUrl(product.image);
                return buildProductCard(productName, imgSrc, productName);
            })
            .join('');

        productsGrid.innerHTML = cardsMarkup;
        if (productsEmptyState) {
            productsEmptyState.hidden = categoryProducts.length > 0;
        }
    };

    const restoreModalFocus = () => {
        if (modalPreviouslyFocused && typeof modalPreviouslyFocused.focus === 'function') {
            try {
                modalPreviouslyFocused.focus();
            } catch {
                /* ignore */
            }
        }
        modalPreviouslyFocused = null;
    };

    const openProductsModal = async () => {
        if (!productsModal) return;
        clearTimeout(closeTimer);
        modalPreviouslyFocused = document.activeElement;

        productsModal.classList.remove('is-closing');
        productsModal.classList.add('is-visible');
        productsModal.setAttribute('aria-hidden', 'false');
        // #region agent log
        fetch('http://127.0.0.1:7547/ingest/7f96b885-a692-499a-8f03-6bebaf38ccd5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6f5c2d'},body:JSON.stringify({sessionId:'6f5c2d',location:'main.js:openProductsModal-visible',message:'modal is-visible set',data:{hypothesisId:'H4',activeKey:activeCategory&&activeCategory.key,hasIsVisible:productsModal.classList.contains('is-visible')},timestamp:Date.now(),runId:'direct-bind'})}).catch(()=>{});
        // #endregion

        document.body.dataset.modalPrevOverflow = document.body.style.overflow || '';
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            productsModal.classList.add('is-active');
            requestAnimationFrame(() => {
                const closeBtn = document.getElementById('products-modal-close');
                if (closeBtn) closeBtn.focus();
            });
        });

        try {
            await renderProductsModal();
        } catch (error) {
            console.error('Unable to render products modal:', error);
            if (productsGrid) productsGrid.innerHTML = '';
            if (productsEmptyState) productsEmptyState.hidden = false;
        }
    };

    const closeProductsModal = () => {
        if (!productsModal || !productsModal.classList.contains('is-visible')) return;
        clearTimeout(closeTimer);
        productsModal.classList.remove('is-active');
        productsModal.classList.add('is-closing');
        productsModal.setAttribute('aria-hidden', 'true');

        document.body.style.overflow = document.body.dataset.modalPrevOverflow || '';
        delete document.body.dataset.modalPrevOverflow;

        closeTimer = window.setTimeout(() => {
            productsModal.classList.remove('is-visible', 'is-closing');
            if (productsGrid) productsGrid.innerHTML = '';
            restoreModalFocus();
        }, MODAL_CLOSE_MS);
    };

    const openCategoryModalFromCard = (card) => {
        const categoryKey = card.getAttribute('data-category-key') || '';
        if (MODAL_DISABLED_CATEGORIES.has(categoryKey)) {
            return;
        }

        try {
            localStorage.setItem(
                'pfs_debug_category_open',
                `${Date.now()}:${categoryKey}`
            );
        } catch {
            /* ignore private mode */
        }
        const labelElement = card.querySelector('.category-title');
        activeCategory = {
            key: categoryKey,
            labelKey: labelElement?.getAttribute('data-i18n') || '',
            fallbackLabel: labelElement?.textContent?.trim() || 'Products',
        };
        openProductsModal();
    };

    /** Collapse touchend + click pairs so we do not open twice in one gesture */
    const requestCategoryModalOpen = (card) => {
        const now = Date.now();
        if (now < categoryModalCooldownUntil) return;
        categoryModalCooldownUntil = now + CATEGORY_OPEN_DEBOUNCE_MS;
        openCategoryModalFromCard(card);
    };

    const handleModalKeydown = (event) => {
        if (!productsModal || !productsModal.classList.contains('is-visible')) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            closeProductsModal();
            return;
        }

        if (event.key !== 'Tab') return;

        const dialog = productsModal.querySelector('.products-modal__dialog');
        const focusables = getFocusableElements(dialog);
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (focusables.length === 1) {
            event.preventDefault();
            first.focus();
            return;
        }

        if (!dialog.contains(active)) {
            event.preventDefault();
            first.focus();
            return;
        }

        if (event.shiftKey) {
            if (active === first) {
                event.preventDefault();
                last.focus();
            }
        } else if (active === last) {
            event.preventDefault();
            first.focus();
        }
    };

    document.addEventListener('keydown', handleModalKeydown);

    const resolveCategoryCardFromEventTarget = (target) => {
        if (!categoriesSection || !target) return null;
        let el = target;
        if (el.nodeType === Node.TEXT_NODE) {
            el = el.parentElement;
        }
        if (!(el instanceof Element)) return null;
        const card = el.closest('.category-card[data-category-key]');
        return card && categoriesSection.contains(card) ? card : null;
    };

    if (!productsModal || !categoriesSection) {
        // #region agent log
        fetch('http://127.0.0.1:7547/ingest/7f96b885-a692-499a-8f03-6bebaf38ccd5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6f5c2d'},body:JSON.stringify({sessionId:'6f5c2d',location:'main.js:category-modal-missing-dom',message:'modal or categories section missing',data:{hypothesisId:'A',hasProductsModal:!!productsModal,hasCategoriesSection:!!categoriesSection},timestamp:Date.now(),runId:'capture-delegate'})}).catch(()=>{});
        // #endregion
    }

    if (productsModal && categoriesSection) {
        const onCategoryTouchEnd = (event) => {
            const card = resolveCategoryCardFromEventTarget(event.target);
            if (!card) return;
            // #region agent log
            fetch('http://127.0.0.1:7547/ingest/7f96b885-a692-499a-8f03-6bebaf38ccd5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6f5c2d'},body:JSON.stringify({sessionId:'6f5c2d',location:'main.js:category-touchend-capture',message:'document capture touchend',data:{hypothesisId:'H5',key:card.getAttribute('data-category-key'),cancelable:event.cancelable},timestamp:Date.now(),runId:'capture-delegate'})}).catch(()=>{});
            // #endregion
            if (event.cancelable) {
                event.preventDefault();
            }
            requestCategoryModalOpen(card);
        };

        const onCategoryClick = (event) => {
            const card = resolveCategoryCardFromEventTarget(event.target);
            if (!card) return;
            // #region agent log
            fetch('http://127.0.0.1:7547/ingest/7f96b885-a692-499a-8f03-6bebaf38ccd5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6f5c2d'},body:JSON.stringify({sessionId:'6f5c2d',location:'main.js:category-click-capture',message:'document capture click',data:{hypothesisId:'H6',key:card.getAttribute('data-category-key')},timestamp:Date.now(),runId:'capture-delegate'})}).catch(()=>{});
            // #endregion
            requestCategoryModalOpen(card);
        };

        document.addEventListener('touchend', onCategoryTouchEnd, { capture: true, passive: false });
        document.addEventListener('click', onCategoryClick, true);

        const exploreMoreBtn = document.getElementById('products-modal-explore');
        if (exploreMoreBtn) {
            exploreMoreBtn.addEventListener('click', (e) => {
                e.preventDefault();
                closeProductsModal();
                window.setTimeout(() => {
                    categoriesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, MODAL_CLOSE_MS);
            });
        }

        modalCloseTriggers.forEach((trigger) => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                closeProductsModal();
            });
        });

        const modalDialogEl = productsModal.querySelector('.products-modal__dialog');
        if (modalDialogEl) {
            modalDialogEl.addEventListener('click', (e) => e.stopPropagation());
        }

        window.addEventListener('sitelanguagechanged', () => {
            if (productsModal.classList.contains('is-visible')) {
                renderProductsModal().catch((error) => {
                    console.error('Failed to update modal language:', error);
                });
            }
        });
    }

    // 6. FAQ accordion (single open, smooth expand)
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
        const btn = item.querySelector('.faq-question');
        const panel = item.querySelector('.faq-answer-panel');
        if (!btn || !panel) return;

        btn.addEventListener('click', () => {
            const opening = !item.classList.contains('is-open');

            faqItems.forEach((other) => {
                other.classList.remove('is-open');
                const b = other.querySelector('.faq-question');
                const p = other.querySelector('.faq-answer-panel');
                if (b) b.setAttribute('aria-expanded', 'false');
                if (p) p.setAttribute('aria-hidden', 'true');
            });

            if (opening) {
                item.classList.add('is-open');
                btn.setAttribute('aria-expanded', 'true');
                panel.setAttribute('aria-hidden', 'false');
            }
        });
    });
});
