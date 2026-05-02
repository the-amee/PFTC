// about-reveal.js — scroll-driven progressive text reveal for the About section

(function () {
    'use strict';

    const EASE = (t) => t * t * (3 - 2 * t);
    const smoothstep = (a, b, t) => a + (b - a) * EASE(Math.min(1, Math.max(0, t)));

    /**
     * Split translation into lines (paragraphs → sentences) for EN/AR.
     * @param {string} text
     * @returns {string[]}
     */
    function splitAboutIntoLines(text) {
        if (!text || !text.trim()) return [];
        const blocks = text
            .split(/\n\n+/)
            .map((b) => b.trim())
            .filter(Boolean);
        const out = [];
        const sentenceSplit = /(?<=[.!?؟۔])\s+/;
        for (const block of blocks) {
            const parts = block.split(sentenceSplit).map((s) => s.trim()).filter(Boolean);
            if (parts.length) {
                out.push(...parts);
            } else {
                out.push(block);
            }
        }
        return out;
    }

    /**
     * @param {HTMLElement} stage
     * @param {number} lineCount
     */
    function setStageHeight(stage, lineCount) {
        const n = Math.max(lineCount, 1);
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const vhPerLine = isMobile ? 32 : 42;
        const extraVh = n * vhPerLine;
        stage.style.setProperty('--about-stage-extra', `${extraVh}vh`);
    }

    let rafId = 0;
    const state = { stage: null, lines: [] };

    function updateLineFills() {
        const { stage, lines } = state;
        if (!stage || !lines.length) return;

        const start = stage.offsetTop;
        const end = start + stage.offsetHeight - window.innerHeight;
        const range = end - start;
        let p = range > 0 ? (window.scrollY - start) / range : 1;
        p = Math.min(1, Math.max(0, p));

        const n = lines.length;
        for (let i = 0; i < n; i++) {
            const segStart = i / n;
            const segEnd = (i + 1) / n;
            let t = (p - segStart) / (segEnd - segStart);
            t = smoothstep(0, 1, Math.min(1, Math.max(0, t)));
            const pct = (t * 100).toFixed(2);
            lines[i].style.setProperty('--line-pct', `${pct}%`);
        }

    }

    function onScrollOrResize() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            rafId = 0;
            if (state.stage && state.lines.length) {
                setStageHeight(state.stage, state.lines.length);
            }
            updateLineFills();
        });
    }

    /**
     * @param {HTMLElement} container
     * @param {string[]} lineTexts
     * @returns {HTMLElement[]}
     */
    function renderLines(container, lineTexts) {
        container.textContent = '';
        container.hidden = false;
        lineTexts.forEach((txt, i) => {
            const line = document.createElement('p');
            line.className = 'about-line';
            line.style.setProperty('--line-pct', '0%');
            line.setAttribute('data-line-index', String(i));
            line.textContent = txt;
            container.appendChild(line);
        });
        return Array.from(container.querySelectorAll('.about-line'));
    }

    /**
     * @param {'en'|'ar'} lang
     */
    async function fetchAboutText(lang) {
        const clean = lang === 'ar' ? 'ar' : 'en';
        const jsonPath = new URL(`data/${clean}.json`, window.location.href).href;
        const res = await fetch(jsonPath);
        if (!res.ok) return null;
        const data = await res.json();
        return typeof data.about_text === 'string' ? data.about_text : null;
    }

    function getLang() {
        const d = document.documentElement.getAttribute('dir');
        return d === 'rtl' ? 'ar' : 'en';
    }

    /**
     * @param {'en'|'ar'|undefined} overrideLang
     */
    async function initAboutReveal(overrideLang) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            await initReducedMotion(overrideLang);
            return;
        }

        const stage = document.querySelector('[data-about-stage]');
        const mount = document.querySelector('[data-about-reveal]');
        const fallback = document.querySelector('.about-reveal-fallback');
        if (!stage || !mount) return;

        const lang =
            overrideLang === 'en' || overrideLang === 'ar' ? overrideLang : getLang();
        let text = await fetchAboutText(lang);
        if (!text && fallback) {
            text = fallback.textContent || '';
        }
        const lineTexts = splitAboutIntoLines(text);
        if (!lineTexts.length) return;

        const lineEls = renderLines(mount, lineTexts);
        state.stage = stage;
        state.lines = lineEls;

        setStageHeight(stage, lineTexts.length);
        stage.classList.add('js-ready');

        if (fallback) {
            fallback.setAttribute('hidden', '');
        }

        updateLineFills();
        window.addEventListener('scroll', onScrollOrResize, { passive: true });
        window.addEventListener('resize', onScrollOrResize, { passive: true });
    }

    /**
     * @param {'en'|'ar'|undefined} overrideLang
     */
    async function initReducedMotion(overrideLang) {
        const stage = document.querySelector('[data-about-stage]');
        const mount = document.querySelector('[data-about-reveal]');
        const fallback = document.querySelector('.about-reveal-fallback');
        if (!stage || !mount) return;

        const langRm =
            overrideLang === 'en' || overrideLang === 'ar' ? overrideLang : getLang();
        let text = await fetchAboutText(langRm);
        if (!text && fallback) {
            text = fallback.textContent || '';
        }

        stage.classList.add('js-ready', 'about-reduced-motion');
        mount.className = 'about-text about-text--static';
        mount.textContent = text || '';
        mount.style.whiteSpace = 'pre-line';
        mount.hidden = false;
        if (fallback) {
            fallback.setAttribute('hidden', '');
        }
    }

    function teardownAboutReveal() {
        window.removeEventListener('scroll', onScrollOrResize);
        window.removeEventListener('resize', onScrollOrResize);
        state.stage = null;
        state.lines = [];
        const stage = document.querySelector('[data-about-stage]');
        const fallback = document.querySelector('.about-reveal-fallback');
        if (stage) {
            stage.classList.remove('js-ready', 'about-reduced-motion');
            stage.style.removeProperty('--about-stage-extra');
        }
        if (fallback) {
            fallback.removeAttribute('hidden');
        }
        const mount = document.querySelector('[data-about-reveal]');
        if (mount) {
            mount.innerHTML = '';
            mount.hidden = true;
            mount.className = 'about-reveal';
        }
    }

    /**
     * Built after i18n applies — lang.js dispatches `sitelanguagechanged` when data/*.json is loaded.
     */
    window.addEventListener('sitelanguagechanged', (e) => {
        const lang = e.detail && (e.detail.lang === 'ar' || e.detail.lang === 'en') ? e.detail.lang : undefined;
        teardownAboutReveal();
        initAboutReveal(lang).catch((err) => console.error('about-reveal:', err));
    });
})();
