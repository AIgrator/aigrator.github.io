(() => {
    'use strict';

    const root = document.querySelector('[data-app-index]');
    if (!root) return;

    const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
    const panels = Array.from(root.querySelectorAll('[role="tabpanel"]'));
    if (!tabs.length || tabs.length !== panels.length) return;

    let current = tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');
    if (current < 0) current = 0;

    const select = (index, moveFocus) => {
        current = (index + tabs.length) % tabs.length;

        tabs.forEach((tab, i) => {
            const active = i === current;
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
            tab.tabIndex = active ? 0 : -1;
            panels[i].setAttribute('aria-hidden', active ? 'false' : 'true');
        });

        if (moveFocus) tabs[current].focus();
    };

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => select(index, false));

        tab.addEventListener('keydown', event => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                select(index + 1, true);
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                select(index - 1, true);
            } else if (event.key === 'Home') {
                event.preventDefault();
                select(0, true);
            } else if (event.key === 'End') {
                event.preventDefault();
                select(tabs.length - 1, true);
            }
        });
    });

    select(current, false);
})();
