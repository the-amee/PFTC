// lang.js

document.addEventListener('DOMContentLoaded', () => {
    // Detect current language from HTML tag
    const currentLang = document.documentElement.lang || 'en';
    
    // Path to the appropriate JSON file
    const jsonPath = currentLang === 'ar' ? './data/ar.json' : './data/en.json';

    // Fetch and apply translations
    fetch(jsonPath)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            // Find all elements with data-i18n attribute
            const elements = document.querySelectorAll('[data-i18n]');
            
            elements.forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (data[key]) {
                    // Make text changes smooth if needed, basic replacing here
                    el.textContent = data[key];
                }
            });
        })
        .catch(err => console.error('Error loading language file:', err));
});
