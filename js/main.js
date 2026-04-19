// main.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Header Scroll Effect
    const header = document.querySelector('.header');
    
    const handleScroll = () => {
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

    // 5. FAQ accordion (single open, smooth expand)
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
