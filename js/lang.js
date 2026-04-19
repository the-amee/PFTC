// lang.js — client-side i18n + localStorage persistence

const LANG_STORAGE_KEY = 'sitePreferredLang';

/** Guards against out-of-order completion when language is switched quickly */
let applyLangGeneration = 0;

/**
 * @param {'en'|'ar'} lang
 */
function updateMobileLangButton(lang) {
    const btn = document.querySelector('.lang-switch-mobile');
    if (!btn) return;
    const icon = lang === 'en' ? '🇸🇦' : '🇬🇧';
    btn.innerHTML = `<span class="lang-switch-mobile__icon" aria-hidden="true">${icon}</span>`;
    btn.setAttribute('aria-label', 'Switch Language');
}

/**
 * @param {'en'|'ar'} lang
 */
async function applySiteLanguage(lang) {
    const clean = lang === 'ar' ? 'ar' : 'en';
    const myGen = ++applyLangGeneration;
    const jsonPath = `./data/${clean}.json`;

    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error('Failed to load translations');
    const data = await response.json();

    if (myGen !== applyLangGeneration) {
        return;
    }

    document.documentElement.setAttribute('lang', clean);
    document.documentElement.setAttribute('dir', clean === 'ar' ? 'rtl' : 'ltr');

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (data[key]) {
            el.textContent = data[key];
        }
    });

    document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
        const key = el.getAttribute('data-i18n-alt');
        if (data[key]) {
            el.setAttribute('alt', data[key]);
        }
    });

    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
        const key = el.getAttribute('data-i18n-aria');
        if (data[key]) {
            el.setAttribute('aria-label', data[key]);
        }
    });

    if (data.page_title) {
        document.title = data.page_title;
    }

    try {
        localStorage.setItem(LANG_STORAGE_KEY, clean);
    } catch (e) {
        /* ignore quota / private mode */
    }

    updateMobileLangButton(clean);
    window.dispatchEvent(new CustomEvent('sitelanguagechanged', { detail: { lang: clean } }));
}

/**
 * Prefer last user choice from localStorage on both index and ar pages.
 * If unset: index defaults to English, ar.html defaults to Arabic.
 */
function resolveInitialLang() {
    const path = window.location.pathname || '';
    const isArPage = /ar\.html$/i.test(path);

    let stored = null;
    try {
        stored = localStorage.getItem(LANG_STORAGE_KEY);
    } catch (e) {
        /* ignore */
    }

    const validStored = stored === 'en' || stored === 'ar' ? stored : null;

    if (validStored) {
        return validStored;
    }

    return isArPage ? 'ar' : 'en';
}

document.addEventListener('DOMContentLoaded', () => {
    const htmlLangGuess = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().startsWith('ar')
        ? 'ar'
        : 'en';
    updateMobileLangButton(htmlLangGuess);

    const targetLang = resolveInitialLang();
    applySiteLanguage(targetLang).catch((err) => {
        console.error('Error applying language:', err);
    });
});

window.applySiteLanguage = applySiteLanguage;
window.LANG_STORAGE_KEY = LANG_STORAGE_KEY;
