/**
 * Module devis web — même stockage et catalogue que l'app (electro_devis).
 */
(function () {
  'use strict';

  const STORAGE = 'electro_devis';
  const COMPANY_KEY = 'user_company_info';

  let savedList = [];
  let editingId = null;
  let items = [];
  let selectedCategory = '';
  let searchQuery = '';
  let openCategories = {};
  let catalogGrouped = null;

  function getLang() {
    try {
      return localStorage.getItem('electrodz-site-lang') === 'fr' ? 'fr' : 'ar';
    } catch (_) {
      return 'ar';
    }
  }

  function setLang(lang) {
    try {
      localStorage.setItem('electrodz-site-lang', lang);
    } catch (_) { /* ignore */ }
    const btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = lang === 'fr' ? 'AR' : 'FR';
    applyI18n();
    renderList();
    renderCatalog();
    if (editingId !== null || document.getElementById('view-edit') && !document.getElementById('view-edit').classList.contains('hidden')) {
      renderItems();
    }
  }

  function tr(key) {
    const I = window.ElectroDzDevisI18n;
    return I ? I.t(getLang(), key) : key;
  }

  function catLabel(cat) {
    const I = window.ElectroDzDevisI18n;
    return I ? I.catLabel(getLang(), cat) : cat;
  }

  function applyI18n() {
    const lang = getLang();
    document.documentElement.lang = lang === 'fr' ? 'fr' : 'ar';
    document.documentElement.dir = lang === 'fr' ? 'ltr' : 'rtl';
    document.title = tr('pageTitle');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', tr('metaDescription'));
    const brandTag = document.getElementById('brand-tagline');
    if (brandTag) brandTag.textContent = tr('brandTagline');
    document.getElementById('hero-title').textContent = tr('heroTitle');
    document.getElementById('hero-sub').textContent = tr('heroSub');
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = tr(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.placeholder = tr(key);
    });
    updateSavedCount();
  }

  function uid() {
    return Date.now().toString() + Math.random().toString(36).slice(2, 7);
  }

  function formatDzd(n) {
    if (!Number.isFinite(n)) return '0';
    return String(Math.round(n));
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadList() {
    try {
      const raw = localStorage.getItem(STORAGE);
      savedList = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(savedList)) savedList = [];
    } catch (_) {
      savedList = [];
    }
  }

  function persistList() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(savedList));
    } catch (e) {
      alert(e.message || 'Storage error');
    }
    updateSavedCount();
  }

  function updateSavedCount() {
    const el = document.getElementById('saved-count');
    if (el) el.textContent = `${savedList.length} ${tr('savedCount')}`;
  }

  function calcTotals(lineItems) {
    const subtotal = lineItems.reduce((s, it) => s + (Number(it.total) || 0), 0);
    return { subtotal, tva: 0, total: subtotal };
  }

  function recalcItem(item) {
    const q = Math.max(0, Number(item.quantity) || 0);
    const p = Math.max(0, Number(item.unitPrice) || 0);
    item.quantity = q;
    item.unitPrice = p;
    item.total = Math.round(q * p);
  }

  function loadCompany() {
    try {
      const raw = localStorage.getItem(COMPANY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveCompany(data) {
    try {
      localStorage.setItem(COMPANY_KEY, JSON.stringify(data));
    } catch (_) { /* ignore */ }
  }

  function showView(name) {
    document.getElementById('view-list').classList.toggle('hidden', name !== 'list');
    document.getElementById('view-edit').classList.toggle('hidden', name !== 'edit');
    document.getElementById('btn-delete').style.display = editingId ? '' : 'none';
  }

  function renderList() {
    const root = document.getElementById('devis-list');
    if (!root) return;
    if (!savedList.length) {
      root.innerHTML = `<p class="empty">${escHtml(tr('emptyList'))}</p>`;
      return;
    }
    root.innerHTML = savedList
      .slice()
      .reverse()
      .map((d) => {
        const num = (d.devisNumber || d.id.slice(-6)).toUpperCase();
        return `<article class="devis-card" data-id="${escHtml(d.id)}">
          <div>
            <strong>${escHtml(d.clientName)}</strong>
            <small>${escHtml(num)} · ${escHtml(d.date || '')}</small>
          </div>
          <span class="amount">${formatDzd(d.total)} DZD</span>
        </article>`;
      })
      .join('');

    root.querySelectorAll('.devis-card').forEach((card) => {
      card.addEventListener('click', () => openEdit(card.getAttribute('data-id')));
    });
  }

  function openNew() {
    editingId = null;
    items = [];
    document.getElementById('client-name').value = '';
    document.getElementById('client-phone').value = '';
    document.getElementById('client-address').value = '';
    showView('edit');
    renderItems();
    renderCatalog();
  }

  function openEdit(id) {
    const d = savedList.find((x) => x.id === id);
    if (!d) return;
    editingId = id;
    items = (d.items || []).map((it) => ({ ...it }));
    document.getElementById('client-name').value = d.clientName || '';
    document.getElementById('client-phone').value = d.clientPhone || '';
    document.getElementById('client-address').value = d.clientAddress || '';
    showView('edit');
    renderItems();
    renderCatalog();
  }

  function renderItems() {
    const tbody = document.getElementById('items-tbody');
    if (!tbody) return;
    tbody.innerHTML = items
      .map(
        (it, idx) => `<tr data-idx="${idx}">
        <td><input type="text" class="it-desc" value="${escHtml(it.description)}" /></td>
        <td><input type="number" class="it-qty col-qty" min="0" step="1" value="${it.quantity}" /></td>
        <td><input type="number" class="it-price col-price" min="0" step="1" value="${it.unitPrice > 0 ? it.unitPrice : ''}" /></td>
        <td class="col-total">${formatDzd(it.total)}</td>
        <td><button type="button" class="btn-row it-del" title="×">×</button></td>
      </tr>`
      )
      .join('');

    tbody.querySelectorAll('.it-desc').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const i = Number(e.target.closest('tr').dataset.idx);
        items[i].description = e.target.value;
      });
    });
    tbody.querySelectorAll('.it-qty').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const i = Number(e.target.closest('tr').dataset.idx);
        items[i].quantity = e.target.value;
        recalcItem(items[i]);
        renderItems();
      });
    });
    tbody.querySelectorAll('.it-price').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const i = Number(e.target.closest('tr').dataset.idx);
        items[i].unitPrice = e.target.value;
        recalcItem(items[i]);
        renderItems();
      });
    });
    tbody.querySelectorAll('.it-del').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const i = Number(e.target.closest('tr').dataset.idx);
        items.splice(i, 1);
        renderItems();
      });
    });

    const { total } = calcTotals(items);
    document.getElementById('edit-total').textContent = `${formatDzd(total)} DZD`;
  }

  function addItem(description, qty, price) {
    const item = {
      id: uid(),
      description: description || tr('customDesc'),
      quantity: qty != null ? qty : 1,
      unitPrice: price != null ? price : 0,
      total: 0,
    };
    recalcItem(item);
    items.push(item);
    renderItems();
  }

  function buildCatalogGroups() {
    const catalog = window.DEVIS_CATALOG || [];
    const q = searchQuery.trim().toLowerCase();
    const byCat = {};
    catalog.forEach((row) => {
      if (selectedCategory && row.category !== selectedCategory) return;
      if (q && !row.description.toLowerCase().includes(q) && !row.category.toLowerCase().includes(q)) return;
      if (!byCat[row.category]) byCat[row.category] = [];
      byCat[row.category].push(row.description);
    });
    return Object.keys(byCat)
      .sort((a, b) => a.localeCompare(b, 'fr'))
      .map((cat) => ({ cat, items: byCat[cat] }));
  }

  function renderCatalog() {
    const strip = document.getElementById('cat-strip');
    const root = document.getElementById('catalog-root');
    if (!strip || !root) return;

    const cats = window.DEVIS_CATEGORIES || [];
    strip.innerHTML =
      `<button type="button" class="cat-chip${selectedCategory === '' ? ' active' : ''}" data-cat="">${escHtml(tr('catAll'))}</button>` +
      cats
        .map(
          (c) =>
            `<button type="button" class="cat-chip${selectedCategory === c ? ' active' : ''}" data-cat="${escHtml(c)}">${escHtml(catLabel(c))}</button>`
        )
        .join('');

    strip.querySelectorAll('.cat-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        selectedCategory = chip.getAttribute('data-cat') || '';
        renderCatalog();
      });
    });

    catalogGrouped = buildCatalogGroups();
    if (!catalogGrouped.length) {
      root.innerHTML = `<p class="empty" style="padding:16px">—</p>`;
      return;
    }

    root.innerHTML = catalogGrouped
      .map((g) => {
        const open = openCategories[g.cat] !== false;
        return `<div class="cat-block${open ? ' open' : ''}" data-cat-block="${escHtml(g.cat)}">
          <div class="cat-head"><span>${escHtml(catLabel(g.cat))}</span><span>${g.items.length}</span></div>
          <div class="cat-body">${g.items
            .map(
              (desc) =>
                `<button type="button" class="catalog-item" data-desc="${escHtml(desc)}">${escHtml(desc)}</button>`
            )
            .join('')}</div>
        </div>`;
      })
      .join('');

    root.querySelectorAll('.cat-head').forEach((head) => {
      head.addEventListener('click', () => {
        const block = head.closest('.cat-block');
        const cat = block.getAttribute('data-cat-block');
        const isOpen = block.classList.toggle('open');
        openCategories[cat] = isOpen;
      });
    });

    root.querySelectorAll('.catalog-item').forEach((btn) => {
      btn.addEventListener('click', () => addItem(btn.getAttribute('data-desc'), 1, 0));
    });
  }

  function saveCurrent(silent) {
    const clientName = document.getElementById('client-name').value.trim();
    if (!clientName) {
      alert(tr('errClient'));
      return false;
    }
    if (!items.length) {
      alert(tr('errItems'));
      return false;
    }
    items.forEach(recalcItem);
    const totals = calcTotals(items);
    const now = new Date();
    const autoNum = `DEV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    const payload = {
      id: editingId || uid(),
      clientName,
      clientPhone: document.getElementById('client-phone').value.trim(),
      clientAddress: document.getElementById('client-address').value.trim(),
      items: items.map((it) => ({ ...it })),
      subtotal: totals.subtotal,
      tva: totals.tva,
      total: totals.total,
      date: now.toLocaleDateString(getLang() === 'fr' ? 'fr-FR' : 'ar-DZ'),
      devisNumber: autoNum,
    };

    const idx = savedList.findIndex((d) => d.id === payload.id);
    if (idx >= 0) {
      payload.devisNumber = savedList[idx].devisNumber || payload.devisNumber;
      savedList[idx] = payload;
    } else {
      savedList.push(payload);
    }
    editingId = payload.id;
    persistList();
    if (!silent) alert(tr('savedOk'));
    renderList();
    return true;
  }

  function deleteCurrent() {
    if (!editingId) return;
    if (!confirm(tr('confirmDelete'))) return;
    savedList = savedList.filter((d) => d.id !== editingId);
    persistList();
    editingId = null;
    showView('list');
    renderList();
  }

  function printDevis() {
    if (!saveCurrent(true)) return;
    const d = savedList.find((x) => x.id === editingId);
    if (!d) return;
    const co = loadCompany();
    const lang = getLang();
    const iconUrl = new URL('assets/app-icon.png', window.location.href).href;
    const num = (d.devisNumber || d.id.slice(-6)).toUpperCase();
    const rows = (d.items || [])
      .map(
        (item, index) => `<tr>
        <td style="text-align:center;padding:10px;border-bottom:1px solid #E5E7EB">${String(index + 1).padStart(2, '0')}</td>
        <td style="padding:10px;border-bottom:1px solid #E5E7EB">${escHtml(item.description)}</td>
        <td style="text-align:center;padding:10px;border-bottom:1px solid #E5E7EB">${item.quantity}</td>
        <td style="text-align:right;padding:10px;border-bottom:1px solid #E5E7EB">${formatDzd(item.unitPrice)} DZD</td>
        <td style="text-align:right;padding:10px;border-bottom:1px solid #E5E7EB;font-weight:600">${formatDzd(item.total)} DZD</td>
      </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escHtml(tr('devisNo'))}${escHtml(num)}</title>
<style>
@media print{body{margin:0;padding:20px}}
body{font-family:Segoe UI,Arial,sans-serif;padding:20px;color:#000;background:#fff;line-height:1.5}
.print-header-corner{position:absolute;top:10px;right:10px;text-align:right}
.print-logo-corner{width:80px;height:80px;border-radius:50%;object-fit:cover}
.print-info-columns{display:flex;gap:40px;margin:80px 0 25px;padding-bottom:20px;border-bottom:1px solid #E5E7EB}
.print-info-column{flex:1}
.print-section-title{font-size:16px;font-weight:700;margin-bottom:12px}
.print-items-table{width:100%;border-collapse:collapse;margin:20px 0;font-size:13px}
.print-items-table thead{background:#E5E7EB}
.print-items-table th,.print-items-table td{padding:10px;text-align:left}
.print-totals-table{margin-left:auto;border-collapse:collapse}
.print-totals-table td{padding:12px;font-size:18px;font-weight:700}
.print-signatures-container{display:flex;justify-content:space-between;margin-top:60px;gap:40px}
.print-signature-line{border-top:1px solid #000;height:60px;margin-bottom:8px}
.print-footer{margin-top:40px;text-align:center;font-size:12px;border-top:1px solid #E5E7EB;padding-top:15px}
</style></head><body>
<div class="print-header-corner">
<img src="${iconUrl}" class="print-logo-corner" alt=""/>
<div style="font-size:10px;font-weight:600;max-width:100px;margin-top:4px">${escHtml(tr('printFooterApp'))}</div>
</div>
<div class="print-info-columns">
<div class="print-info-column">
<div class="print-section-title">${escHtml(tr('printCompany'))}</div>
<p><strong>${escHtml(tr('labelCompany'))}:</strong> ${escHtml(co.companyName || 'DZSWISS ELEC')}</p>
${co.services ? `<p><strong>${escHtml(tr('labelServices'))}:</strong> ${escHtml(co.services)}</p>` : ''}
<p><strong>${escHtml(tr('labelPhone'))}:</strong> ${escHtml(co.phone || '+213 555 123 456')}</p>
<p><strong>${escHtml(tr('labelEmail'))}:</strong> ${escHtml(co.email || 'contact@electrodz.dz')}</p>
</div>
<div class="print-info-column">
<div class="print-section-title">${escHtml(tr('printClient'))}</div>
<p><strong>${escHtml(tr('devisNo'))}${escHtml(num)}</strong></p>
<p><strong>${escHtml(tr('date'))}:</strong> ${escHtml(d.date)}</p>
<p><strong>${escHtml(tr('labelName'))}:</strong> ${escHtml(d.clientName)}</p>
${d.clientPhone ? `<p><strong>${escHtml(tr('labelPhone'))}:</strong> ${escHtml(d.clientPhone)}</p>` : ''}
${d.clientAddress ? `<p><strong>${escHtml(tr('labelAddress'))}:</strong> ${escHtml(d.clientAddress)}</p>` : ''}
</div>
</div>
<div class="print-section-title">${escHtml(tr('printDetail'))}</div>
<table class="print-items-table"><thead><tr>
<th>${escHtml(tr('printColNo'))}</th><th>${escHtml(tr('printColDesc'))}</th><th>${escHtml(tr('printColQty'))}</th>
<th>${escHtml(tr('printColUnit'))}</th><th>${escHtml(tr('printColTotal'))}</th>
</tr></thead><tbody>${rows}</tbody></table>
<table class="print-totals-table"><tr><td>${escHtml(tr('printTotal'))}</td><td>${formatDzd(d.total)} DZD</td></tr></table>
<div class="print-signatures-container">
<div style="flex:1;text-align:center"><div class="print-signature-line"></div><div>${escHtml(tr('printSigInstaller'))}</div></div>
<div style="flex:1;text-align:center"><div class="print-signature-line"></div><div>${escHtml(tr('printSigClient'))}</div></div>
</div>
<div class="print-footer">${escHtml(tr('printValidity'))}</div>
</body></html>`

    const w = window.open('', '_blank');
    if (!w) {
      alert('Popup blocked');
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
    }, 400);
  }

  function openCompanyModal() {
    const co = loadCompany();
    document.getElementById('co-name').value = co.companyName || '';
    document.getElementById('co-services').value = co.services || '';
    document.getElementById('co-phone').value = co.phone || '';
    document.getElementById('co-email').value = co.email || '';
    document.getElementById('modal-company').classList.add('show');
  }

  function closeCompanyModal() {
    document.getElementById('modal-company').classList.remove('show');
  }

  function init() {
    loadList();
    applyI18n();
    renderList();
    showView('list');

    document.getElementById('lang-toggle').addEventListener('click', () => {
      setLang(getLang() === 'fr' ? 'ar' : 'fr');
    });
    document.getElementById('btn-new').addEventListener('click', openNew);
    document.getElementById('btn-back').addEventListener('click', () => {
      showView('list');
      renderList();
    });
    document.getElementById('btn-save').addEventListener('click', saveCurrent);
    document.getElementById('btn-print').addEventListener('click', printDevis);
    document.getElementById('btn-delete').addEventListener('click', deleteCurrent);
    document.getElementById('btn-custom').addEventListener('click', () => addItem(tr('customDesc'), 1, 0));
    document.getElementById('btn-company').addEventListener('click', openCompanyModal);
    document.getElementById('co-close').addEventListener('click', closeCompanyModal);
    document.getElementById('co-save').addEventListener('click', () => {
      saveCompany({
        companyName: document.getElementById('co-name').value.trim(),
        services: document.getElementById('co-services').value.trim(),
        phone: document.getElementById('co-phone').value.trim(),
        email: document.getElementById('co-email').value.trim(),
      });
      closeCompanyModal();
    });
    document.getElementById('catalog-search').addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderCatalog();
    });
    document.getElementById('modal-company').addEventListener('click', (e) => {
      if (e.target.id === 'modal-company') closeCompanyModal();
    });

    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) langBtn.textContent = getLang() === 'fr' ? 'AR' : 'FR';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
