(() => {
    'use strict';

    const STORAGE_KEY = 'aigrator-lang';
    const root = document.documentElement;
    const originalLang = root.lang;
    const browserLanguage = (navigator.language || 'ru').toLowerCase();
    const detectedLanguage = browserLanguage.startsWith('ru') ? 'ru' : 'en';

    const readPreference = () => {
        try {
            const value = localStorage.getItem(STORAGE_KEY);
            return value === 'ru' || value === 'en' ? value : null;
        } catch {
            return null;
        }
    };

    const language = readPreference() || detectedLanguage;

    const syncSwitches = value => {
        document.querySelectorAll('[data-lang-select]').forEach(select => {
            select.value = value;
        });
    };

    const syncSwitchesWhenReady = value => {
        if (document.readyState === 'loading') {
            addEventListener('DOMContentLoaded', () => syncSwitches(value), { once: true });
        } else {
            syncSwitches(value);
        }
    };

    document.addEventListener('change', event => {
        const select = event.target.closest('[data-lang-select]');
        if (!select) return;
        try {
            localStorage.setItem(STORAGE_KEY, select.value === 'en' ? 'en' : 'ru');
        } catch {}
        location.reload();
    });

    if (language === 'ru') {
        syncSwitchesWhenReady('ru');
        return;
    }

    const script = document.currentScript;
    if (!script) return;

    const dictionaryUrl = new URL('i18n/en.json', script.src);
    const normalize = value => value.replace(/\s+/g, ' ').trim();

    root.lang = 'en';
    // Keep the Russian markup hidden until the English dictionary is applied.
    root.style.visibility = 'hidden';

    let revealed = false;
    let settled = false;
    const reveal = () => {
        if (revealed) return;
        revealed = true;
        root.style.removeProperty('visibility');
    };

    const restore = error => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        root.lang = originalLang;
        reveal();
        syncSwitchesWhenReady('ru');
        if (error) console.warn('i18n: could not load English translations', error);
    };

    const timeout = setTimeout(restore, 5000);

    const apply = dictionary => {
        const translate = value => {
            const key = normalize(value);
            return Object.prototype.hasOwnProperty.call(dictionary, key) ? dictionary[key] : null;
        };

        const title = translate(document.title);
        if (title !== null) document.title = title;

        for (const meta of document.querySelectorAll('meta[name="description"]')) {
            const content = meta.getAttribute('content');
            const translated = content && translate(content);
            if (translated !== null) meta.setAttribute('content', translated);
        }

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const parent = node.parentElement;
                if (!parent || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(parent.tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            },
        });

        let node;
        while ((node = walker.nextNode())) {
            const raw = node.nodeValue;
            const value = raw.trim();
            if (!value) continue;
            const translated = translate(value);
            if (translated === null) continue;
            const start = raw.indexOf(value);
            node.nodeValue = raw.slice(0, start) + translated + raw.slice(start + value.length);
        }

        for (const element of document.querySelectorAll('[title], [alt], [aria-label], [placeholder]')) {
            for (const name of ['title', 'alt', 'aria-label', 'placeholder']) {
                const value = element.getAttribute(name);
                if (!value) continue;
                const translated = translate(value);
                if (translated !== null) element.setAttribute(name, translated);
            }
        }

        for (const link of document.querySelectorAll('a[href*="play.google.com"]')) {
            const url = new URL(link.href);
            if (url.searchParams.get('hl') === 'ru') {
                url.searchParams.set('hl', 'en');
                link.href = url.href;
            }
        }
    };

    const boot = async () => {
        try {
            const response = await fetch(dictionaryUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const dictionary = await response.json();
            if (document.readyState === 'loading') {
                await new Promise(resolve => addEventListener('DOMContentLoaded', resolve, { once: true }));
            }
            if (settled) return;
            settled = true;
            root.lang = 'en';
            apply(dictionary);
            syncSwitches('en');
            clearTimeout(timeout);
            reveal();
        } catch (error) {
            restore(error);
        }
    };

    boot();
})();
