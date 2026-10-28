(() => {
    const KEY = 'aigrator-theme';
    const root = document.documentElement;
    const media = matchMedia('(prefers-color-scheme: dark)');

    const read = () => {
        try { return localStorage.getItem(KEY); } catch { return null; }
    };
    const stored = read();
    if (stored === 'light' || stored === 'dark') root.dataset.theme = stored;

    const actual = () => root.dataset.theme || (media.matches ? 'dark' : 'light');

    const paintMeta = () => {
        const color = actual() === 'dark' ? '#151412' : '#f4f1ea';
        document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
            meta.content = color;
        });
    };

    const sync = () => {
        document.querySelectorAll('[data-theme-select]').forEach((select) => {
            select.value = root.dataset.theme || 'system';
        });
        paintMeta();
    };

    addEventListener('DOMContentLoaded', () => {
        sync();
        document.addEventListener('change', (event) => {
            const select = event.target.closest('[data-theme-select]');
            if (!select) return;
            if (select.value === 'light' || select.value === 'dark') {
                root.dataset.theme = select.value;
                try { localStorage.setItem(KEY, select.value); } catch {}
            } else {
                root.removeAttribute('data-theme');
                try { localStorage.removeItem(KEY); } catch {}
            }
            sync();
        });
    });

    if (media.addEventListener) media.addEventListener('change', paintMeta);
})();
