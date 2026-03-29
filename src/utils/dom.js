/**
 * BYS.DOM — Güvenli DOM yardımcıları (dinamik SPA içeriği için)
 */
window.BYS = window.BYS || {};

window.BYS.DOM = (function () {
    return {
        /**
         * Selector ile eşleşen elementi bekle (MutationObserver tabanlı)
         * @param {string} selector
         * @param {number} timeout ms cinsinden
         * @returns {Promise<Element>}
         */
        waitForElement(selector, timeout = 10000) {
            return new Promise((resolve, reject) => {
                const existing = document.querySelector(selector);
                if (existing) return resolve(existing);

                const timer = setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`[BYS] Element bulunamadı: ${selector}`));
                }, timeout);

                const observer = new MutationObserver(() => {
                    const el = document.querySelector(selector);
                    if (el) {
                        clearTimeout(timer);
                        observer.disconnect();
                        resolve(el);
                    }
                });

                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true
                });
            });
        },

        /**
         * Birden fazla selector için waitForElement
         * @param {string[]} selectors
         * @param {number} timeout
         */
        waitForAny(selectors, timeout = 10000) {
            return Promise.race(selectors.map(s => this.waitForElement(s, timeout)));
        },

        /**
         * Shadow DOM dahil tüm ağaçta selector ara
         * @param {Element} root
         * @param {string} selector
         * @returns {Element[]}
         */
        deepQueryAll(root, selector) {
            const results = [];

            function search(node) {
                if (!node) return;
                try {
                    const found = node.querySelectorAll(selector);
                    found.forEach(el => results.push(el));
                } catch (e) { /* ignore */ }

                const children = node.querySelectorAll ? node.querySelectorAll('*') : [];
                children.forEach(child => {
                    if (child.shadowRoot) search(child.shadowRoot);
                });
            }

            search(root);
            if (root.shadowRoot) search(root.shadowRoot);
            return results;
        },

        /**
         * Fonksiyonu belirtilen gecikme ile debounce et
         * @param {Function} fn
         * @param {number} delay ms
         */
        debounce(fn, delay) {
            let timer;
            return function (...args) {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay);
            };
        },

        /**
         * HTML element oluştur
         * @param {string} tag
         * @param {object} attrs
         * @param {(string|Element)[]} children
         */
        createEl(tag, attrs = {}, children = []) {
            const el = document.createElement(tag);
            for (const [k, v] of Object.entries(attrs)) {
                if (k === 'class') el.className = v;
                else if (k === 'style') el.style.cssText = v;
                else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
                else el.setAttribute(k, v);
            }
            children.forEach(child => {
                if (child === null || child === undefined) return;
                if (typeof child === 'string') el.insertAdjacentHTML('beforeend', child);
                else el.appendChild(child);
            });
            return el;
        },

        /**
         * Element'in belgeye eklenip eklenmediğini kontrol et
         * @param {Element} el
         */
        isInDOM(el) {
            return el && document.contains(el);
        }
    };
})();
