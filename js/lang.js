// lang.js — client-side i18n (initial language from URL: / = English, ar.html = Arabic)

/** Production origin (HTTPS, no trailing slash). Update if the primary domain changes. */
const SITE_ORIGIN = 'https://www.perfectfamilytc.com';

/** Guards against out-of-order completion when language is switched quickly */
let applyLangGeneration = 0;

/**
 * @param {'en'|'ar'} lang
 */
/**
 * Absolute URL for same-origin assets (OG image, JSON-LD).
 * @param {string} relativePath e.g. './assets/logo/logo.png'
 */
function absoluteAssetUrl(relativePath) {
    try {
        return new URL(relativePath, window.location.href).href;
    } catch {
        return relativePath;
    }
}

/**
 * Meta tags, Open Graph, Twitter, hreflang, canonical, JSON-LD — driven by data/*.json (extend keys anytime).
 * @param {Record<string, string>} data
 * @param {'en'|'ar'} clean
 */
function applySeoFromData(data, clean) {
    const title = data.page_title || document.title;
    const desc = data.seo_meta_description || '';
    const keywords = data.seo_meta_keywords || '';
    const siteName = data.seo_og_site_name || title;
    const phone = data.seo_business_phone || '+966502890356';

    const enPageUrl = `${SITE_ORIGIN}/`;
    const arPageUrl = `${SITE_ORIGIN}/ar.html`;
    const path = window.location.pathname || '/';
    const isArHtml = /ar\.html$/i.test(path);
    /** Canonical matches this HTML file (language toggle does not change URL). */
    const canonicalUrl = isArHtml ? arPageUrl : enPageUrl;
    const ogImage = `${SITE_ORIGIN}/assets/logo/logo.png`;

    const setMetaName = (name, content) => {
        const el = document.querySelector(`meta[name="${name}"]`);
        if (el && content) el.setAttribute('content', content);
    };
    const setMetaProperty = (prop, content) => {
        const el = document.querySelector(`meta[property="${prop}"]`);
        if (el && content !== undefined && content !== null) el.setAttribute('content', content);
    };

    setMetaName('description', desc);
    setMetaName('keywords', keywords);
    setMetaProperty('og:title', title);
    setMetaProperty('og:description', desc);
    setMetaProperty('og:site_name', siteName);
    setMetaProperty('og:url', canonicalUrl);
    setMetaProperty('og:image', ogImage);
    setMetaProperty('og:locale', clean === 'ar' ? 'ar_SA' : 'en_SA');
    setMetaName('twitter:title', title);
    setMetaName('twitter:description', desc);
    setMetaName('twitter:image', ogImage);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', canonicalUrl);

    const hlEn = document.querySelector('link[hreflang="en-SA"]');
    const hlAr = document.querySelector('link[hreflang="ar-SA"]');
    const hlDef = document.querySelector('link[hreflang="x-default"]');
    if (hlEn) hlEn.setAttribute('href', enPageUrl);
    if (hlAr) hlAr.setAttribute('href', arPageUrl);
    if (hlDef) hlDef.setAttribute('href', enPageUrl);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'GroceryStore',
        name: title,
        description: desc,
        url: canonicalUrl,
        telephone: phone,
        image: ogImage,
        address: {
            '@type': 'PostalAddress',
            streetAddress: data.address || '',
            addressLocality: 'Riyadh',
            addressRegion: 'Riyadh',
            addressCountry: 'SA',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 24.630962,
            longitude: 46.692184,
        },
        openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: '08:00',
            closes: '23:00',
        },
    };

    const ldEl = document.getElementById('seo-jsonld');
    if (ldEl) {
        ldEl.textContent = JSON.stringify(jsonLd);
    }
}

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
    const jsonPath = new URL(`data/${clean}.json`, window.location.href).href;

    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error('Failed to load translations');
    const data = await response.json();

    if (myGen !== applyLangGeneration) {
        return;
    }

    /* BCP 47: Saudi locale (primary audience) — storage/API still use "en" / "ar" */
    document.documentElement.setAttribute('lang', clean === 'ar' ? 'ar-SA' : 'en-SA');
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

    applySeoFromData(data, clean);

    updateMobileLangButton(clean);
    window.dispatchEvent(new CustomEvent('sitelanguagechanged', { detail: { lang: clean } }));
}

/**
 * Initial language from the page URL only (each full load / refresh).
 * English site (/) always starts in English; ar.html starts in Arabic.
 * In-page toggles last until the next navigation or refresh.
 */
function resolveInitialLang() {
    const path = window.location.pathname || '';
    const isArPage = /ar\.html$/i.test(path);
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
window.SITE_ORIGIN = SITE_ORIGIN;
