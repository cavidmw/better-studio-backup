/**
 * BYS.Tooltip — USD → AZN dönüştürücü
 * YouTube Studio'daki tüm USD tutarlarının üzerine gelindiğinde
 * sabit 1.7 kur ile AZN karşılığını tooltip olarak gösterir.
 * Grafik hovercard (.aplos-hovercard) içine de AZN satırı ekler.
 */
window.BYS = window.BYS || {};

window.BYS.Tooltip = (function () {
    'use strict';

    const RATE = 1.7;
    const USD_REGEX_ONE =
        /\$\s*([0-9]{1,3}(?:[.,\s][0-9]{3})*(?:[.,][0-9]{1,2})?|[0-9]+(?:[.,][0-9]{1,2})?)/;
    const AZN_LINE_CLASS = 'azn-under-usd-line';

    let tooltipEl = null;
    let active = null;
    let lastTick = 0;
    let initialized = false;

    // ── Bound handler refs (for removeEventListener) ──────────────────────────
    let _onMouseover, _onMousemove, _onMouseout, _onMousemoveChart;

    // ── Parse / Format ────────────────────────────────────────────────────────

    function parseUsdNumber(raw) {
        let s = String(raw).trim().replace(/\s+/g, '');
        const hasComma = s.includes(',');
        const hasDot = s.includes('.');
        if (hasComma && hasDot) {
            const decimalIsComma = s.lastIndexOf(',') > s.lastIndexOf('.');
            s = decimalIsComma ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
        } else if (hasComma && !hasDot) {
            const parts = s.split(',');
            s = (parts.length === 2 && parts[1].length <= 2)
                ? parts[0].replace(/,/g, '') + '.' + parts[1]
                : s.replace(/,/g, '');
        } else if (hasDot && !hasComma) {
            const parts = s.split('.');
            if (parts.length === 2 && parts[1].length === 3) s = parts[0] + parts[1];
        }
        const num = Number(s);
        return Number.isFinite(num) ? num : null;
    }

    function formatAzn(azn) {
        const rounded = Math.round(azn * 10) / 10;
        const str = rounded.toFixed(1);
        return `${str.endsWith('.0') ? str.slice(0, -2) : str} ₼`;
    }

    function usdTextToAzn(text) {
        const m = text.match(USD_REGEX_ONE);
        if (!m) return null;
        const usd = parseUsdNumber(m[1]);
        return usd == null ? null : formatAzn(usd * RATE);
    }

    // ── Tooltip DOM ───────────────────────────────────────────────────────────

    function ensureTooltipEl() {
        if (document.getElementById('azn-hover-tooltip')) {
            tooltipEl = document.getElementById('azn-hover-tooltip');
            return;
        }
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'azn-hover-tooltip';
        Object.assign(tooltipEl.style, {
            position: 'fixed', zIndex: '999999', pointerEvents: 'none',
            display: 'none', padding: '10px 12px', borderRadius: '10px',
            background: 'rgba(20,20,20,0.95)', color: '#fff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)', fontSize: '16px',
            fontWeight: '400', whiteSpace: 'nowrap',
            border: '1px solid rgba(255,255,255,0.12)',
            fontFamily: 'inherit', fontStyle: 'normal', letterSpacing: 'normal'
        });
        document.documentElement.appendChild(tooltipEl);
    }

    function showTooltip(text, x, y) {
        if (!tooltipEl) return;
        tooltipEl.textContent = text;
        tooltipEl.style.display = 'block';
        positionTooltip(x, y);
    }

    function hideTooltip() {
        if (tooltipEl) tooltipEl.style.display = 'none';
    }

    function positionTooltip(clientX, clientY) {
        if (!tooltipEl) return;
        const margin = 14;
        tooltipEl.style.left = '0px';
        tooltipEl.style.top = '0px';
        const rect = tooltipEl.getBoundingClientRect();
        let x = clientX + margin;
        let y = clientY + margin;
        if (x + rect.width > window.innerWidth - margin) x = clientX - rect.width - margin;
        if (y + rect.height > window.innerHeight - margin) y = clientY - rect.height - margin;
        tooltipEl.style.left = `${Math.max(margin, x)}px`;
        tooltipEl.style.top = `${Math.max(margin, y)}px`;
    }

    // ── Hover logic ───────────────────────────────────────────────────────────

    function isBadTag(el) {
        const tag = el.tagName?.toLowerCase();
        return !tag || ['script', 'style', 'textarea', 'input', 'svg', 'path'].includes(tag);
    }

    function pickHoverElement(startEl) {
        let el = startEl;
        for (let i = 0; i < 10 && el; i++) {
            if (!(el instanceof Element)) break;
            if (!isBadTag(el)) {
                const text = (el.textContent || '').trim();
                if (text.length > 0 && text.length <= 60 && text.includes('$')) {
                    const azn = usdTextToAzn(text);
                    if (azn) return { el, azn };
                }
            }
            el = el.parentElement;
        }
        return null;
    }

    // ── Hovercard AZN line ────────────────────────────────────────────────────

    function getOrCreateAznLine(hovercard) {
        let line = hovercard.querySelector(`.${AZN_LINE_CLASS}`);
        if (!line) {
            line = document.createElement('div');
            line.className = AZN_LINE_CLASS;
            Object.assign(line.style, {
                marginTop: '6px', fontSize: '13.5px', fontWeight: '400',
                opacity: '0.95', lineHeight: '1.2', fontFamily: 'inherit',
                fontStyle: 'normal', letterSpacing: 'normal',
                color: 'rgba(220,220,220,0.95)'
            });
        }
        return line;
    }

    function updateHovercardAznLine() {
        const hovercard = document.querySelector('.aplos-hovercard');
        if (!hovercard) return;
        const text = hovercard.textContent || '';
        if (!text.includes('$')) {
            hovercard.querySelector(`.${AZN_LINE_CLASS}`)?.remove();
            return;
        }
        const moneyNode = Array.from(hovercard.querySelectorAll('*'))
            .map(el => ({ el, t: (el.textContent || '').trim() }))
            .filter(x => x.t.includes('$') && x.t.length <= 20)
            .sort((a, b) => a.t.length - b.t.length)[0];
        const anchor = moneyNode?.el || hovercard;
        const azn = usdTextToAzn(moneyNode?.t || text);
        if (!azn) return;
        const line = getOrCreateAznLine(hovercard);
        line.textContent = azn;
        const parent = anchor.parentElement || hovercard;
        if (!line.parentElement) {
            parent.insertBefore(line, anchor.nextSibling);
        } else if (line.parentElement !== parent) {
            line.remove();
            parent.insertBefore(line, anchor.nextSibling);
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    return {
        init() {
            if (initialized) return;
            initialized = true;

            ensureTooltipEl();

            _onMouseover = (e) => {
                const target = e.target;
                if (!(target instanceof Element)) return;
                if (target.closest && target.closest('.aplos-hovercard')) return;
                const picked = pickHoverElement(target);
                if (!picked) return;
                active = picked;
                showTooltip(picked.azn, e.clientX, e.clientY);
            };

            _onMousemove = (e) => {
                if (active) positionTooltip(e.clientX, e.clientY);
            };

            _onMouseout = (e) => {
                if (!active) return;
                const toEl = e.relatedTarget;
                if (toEl && active.el.contains(toEl)) return;
                active = null;
                hideTooltip();
            };

            _onMousemoveChart = (e) => {
                const now = Date.now();
                if (now - lastTick < 120) return;
                lastTick = now;
                if (document.querySelector('.aplos-hovercard')) updateHovercardAznLine();
            };

            document.addEventListener('mouseover', _onMouseover);
            document.addEventListener('mousemove', _onMousemove);
            document.addEventListener('mouseout', _onMouseout);
            document.addEventListener('mousemove', _onMousemoveChart);
        },

        cleanup() {
            if (!initialized) return;
            initialized = false;
            active = null;

            document.removeEventListener('mouseover', _onMouseover);
            document.removeEventListener('mousemove', _onMousemove);
            document.removeEventListener('mouseout', _onMouseout);
            document.removeEventListener('mousemove', _onMousemoveChart);

            hideTooltip();
            document.querySelectorAll(`.${AZN_LINE_CLASS}`).forEach(el => el.remove());
        }
    };
})();
