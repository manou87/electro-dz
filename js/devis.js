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
  /** Saisie qty / prix avant ajout au devis (comme l'app) */
  const tableInputs = {};
  let catalogEventsBound = false;

  function getLang() {
    try {
      const s = localStorage.getItem('electrodz-site-lang');
      if (s === 'fr' || s === 'ar' || s === 'en') return s;
    } catch (_) { /* ignore */ }
    return 'ar';
  }

  function setLang(lang) {
    const next = window.ElectroDzDevisI18n?.normalizeLang
      ? window.ElectroDzDevisI18n.normalizeLang(lang)
      : lang === 'fr' || lang === 'en'
        ? lang
        : 'ar';
    try {
      localStorage.setItem('electrodz-site-lang', next);
    } catch (_) { /* ignore */ }
    document.querySelectorAll('.lang-btn[data-lang]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === next);
    });
    const legacy = document.getElementById('lang-toggle');
    if (legacy) legacy.textContent = next === 'fr' ? 'AR' : next === 'en' ? 'FR' : 'EN';
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
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
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

  function escAttr(s) {
    return escHtml(s).replace(/'/g, '&#39;');
  }

  function getCategoryCount(category) {
    const catalog = window.DEVIS_CATALOG || [];
    const q = searchQuery.trim().toLowerCase();
    return catalog.filter((row) => {
      if (category && row.category !== category) return false;
      if (q && !row.description.toLowerCase().includes(q) && !row.category.toLowerCase().includes(q)) return false;
      return true;
    }).length;
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

  /** Redimensionne une image en logo rond 80×80 (JPEG) pour le devis imprimé */
  function resizeLogoToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('img'));
        img.onload = () => {
          const size = 224;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          const min = Math.min(img.width, img.height);
          const sx = (img.width - min) / 2;
          const sy = (img.height - min) / 2;
          ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function updateCompanyLogoPreview(dataUrl) {
    const preview = document.getElementById('co-logo-preview');
    const removeBtn = document.getElementById('co-logo-remove');
    if (!preview) return;
    if (dataUrl) {
      preview.src = dataUrl;
      preview.classList.add('visible');
      if (removeBtn) removeBtn.classList.remove('hidden');
    } else {
      preview.removeAttribute('src');
      preview.classList.remove('visible');
      if (removeBtn) removeBtn.classList.add('hidden');
    }
  }

  function hasInstallerLogo(co) {
    return !!(co.showLogoOnDevis && co.logoDataUrl);
  }

  function installerSignaturePrintHtml(co) {
    const label = escHtml(tr('printSigInstaller'));
    const tall = hasInstallerLogo(co) ? ' print-signature-row--tall' : '';
    if (hasInstallerLogo(co)) {
      return `<div class="print-signature-installer">
<div class="print-signature-row${tall}">
<img src="${co.logoDataUrl}" class="print-signature-logo" alt=""/>
<div class="print-signature-line-inline"></div>
</div>
<div class="print-signature-label">${label}</div>
</div>`;
    }
    return `<div class="print-signature-installer">
<div class="print-signature-row${tall}">
<div class="print-signature-line-inline"></div>
</div>
<div class="print-signature-label">${label}</div>
</div>`;
  }

  function clientSignaturePrintHtml(co) {
    const label = escHtml(tr('printSigClient'));
    const tall = hasInstallerLogo(co) ? ' print-signature-row--tall' : '';
    return `<div class="print-signature-client">
<div class="print-signature-row${tall}">
<div class="print-signature-line-inline"></div>
</div>
<div class="print-signature-label">${label}</div>
</div>`;
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

  function catalogRowHtml(desc) {
    const inp = tableInputs[desc] || {};
    const q = inp.quantity != null && inp.quantity !== '' ? inp.quantity : '';
    const p = inp.price != null && inp.price !== '' ? inp.price : '';
    return `<div class="catalog-row" data-desc="${escAttr(desc)}">
      <div class="catalog-row-desc">${escHtml(desc)}</div>
      <input type="number" class="catalog-inp-qty" min="0" step="1" inputmode="numeric" placeholder="1" value="${escAttr(String(q))}" aria-label="${escAttr(tr('qty'))}"/>
      <input type="number" class="catalog-inp-price" min="0" step="1" inputmode="numeric" placeholder="0" value="${escAttr(String(p))}" aria-label="${escAttr(tr('unitPrice'))}"/>
      <button type="button" class="catalog-add-btn" title="${escAttr(tr('catalogColAdd'))}">+</button>
    </div>`;
  }

  function bindCatalogEvents() {
    const root = document.getElementById('catalog-root');
    if (!root || catalogEventsBound) return;
    catalogEventsBound = true;

    root.addEventListener('input', (e) => {
      const row = e.target.closest('.catalog-row');
      if (!row) return;
      const desc = row.getAttribute('data-desc');
      if (!desc) return;
      if (!tableInputs[desc]) tableInputs[desc] = {};
      if (e.target.classList.contains('catalog-inp-qty')) {
        tableInputs[desc].quantity = e.target.value;
      }
      if (e.target.classList.contains('catalog-inp-price')) {
        tableInputs[desc].price = e.target.value;
      }
    });

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.catalog-add-btn');
      if (!btn) return;
      const row = btn.closest('.catalog-row');
      if (!row) return;
      const desc = row.getAttribute('data-desc');
      const quantity = parseFloat(tableInputs[desc]?.quantity || '1') || 1;
      const unitPrice = parseFloat(tableInputs[desc]?.price || '0') || 0;
      addItem(desc, quantity, unitPrice);
      delete tableInputs[desc];
      renderCatalog();
    });

    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const row = e.target.closest('.catalog-row');
      if (!row) return;
      if (!e.target.classList.contains('catalog-inp-qty') && !e.target.classList.contains('catalog-inp-price')) return;
      e.preventDefault();
      row.querySelector('.catalog-add-btn')?.click();
    });
  }

  function renderCatalog() {
    const strip = document.getElementById('cat-strip');
    const root = document.getElementById('catalog-root');
    const meta = document.getElementById('catalog-meta');
    const hint = document.getElementById('cat-hint');
    if (!strip || !root) return;

    bindCatalogEvents();

    const cats = window.DEVIS_CATEGORIES || [];
    const countLabel = tr('articlesShown');

    strip.innerHTML =
      `<button type="button" class="cat-chip${selectedCategory === '' ? ' active' : ''}" data-cat="">
        <span>${escHtml(tr('catAll'))}</span>
        <span class="cat-chip-count">${getCategoryCount('')} ${escHtml(countLabel)}</span>
      </button>` +
      cats
        .map((c) => {
          const n = getCategoryCount(c);
          return `<button type="button" class="cat-chip${selectedCategory === c ? ' active' : ''}" data-cat="${escAttr(c)}">
            <span>${escHtml(catLabel(c))}</span>
            <span class="cat-chip-count">${n} ${escHtml(countLabel)}</span>
          </button>`;
        })
        .join('');

    strip.querySelectorAll('.cat-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        selectedCategory = chip.getAttribute('data-cat') || '';
        renderCatalog();
      });
    });

    catalogGrouped = buildCatalogGroups();
    const shown = catalogGrouped.reduce((s, g) => s + g.items.length, 0);
    if (meta) meta.textContent = `${shown} ${countLabel}`;
    if (hint) hint.classList.toggle('hidden', selectedCategory !== '' || !!searchQuery.trim());

    if (!catalogGrouped.length) {
      root.innerHTML = `<p class="empty" style="padding:20px">—</p>`;
      return;
    }

    if (selectedCategory) {
      const rows = [];
      catalogGrouped.forEach((g) => g.items.forEach((desc) => rows.push(catalogRowHtml(desc))));
      root.innerHTML = rows.join('');
    } else {
      root.innerHTML = catalogGrouped
        .map((g) => {
          const open = openCategories[g.cat] === true;
          return `<div class="cat-block${open ? ' open' : ''}" data-cat-block="${escAttr(g.cat)}">
            <div class="cat-head" role="button" tabindex="0" aria-expanded="${open}">
              <span class="cat-chevron" aria-hidden="true">▶</span>
              <span class="cat-title">${escHtml(catLabel(g.cat))}</span>
              <span class="cat-count">${g.items.length}</span>
            </div>
            <div class="cat-body">${g.items.map((desc) => catalogRowHtml(desc)).join('')}</div>
          </div>`;
        })
        .join('');

      root.querySelectorAll('.cat-head').forEach((head) => {
        const toggle = () => {
          const block = head.closest('.cat-block');
          const cat = block.getAttribute('data-cat-block');
          const isOpen = block.classList.toggle('open');
          openCategories[cat] = isOpen;
          head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        };
        head.addEventListener('click', toggle);
        head.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        });
      });
    }
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
      date: now.toLocaleDateString(
        getLang() === 'fr' ? 'fr-FR' : getLang() === 'en' ? 'en-GB' : 'ar-DZ'
      ),
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
.print-signatures-container{display:flex;justify-content:space-between;align-items:flex-end;margin-top:48px;gap:24px;flex-wrap:nowrap}
.print-signature-column{flex:1;min-width:0;display:flex;justify-content:center}
.print-signature-installer,.print-signature-client{display:flex;flex-direction:column;align-items:center;width:100%;max-width:360px}
.print-signature-row{display:flex;align-items:center;justify-content:center;gap:16px;width:100%}
.print-signature-row--tall{min-height:112px}
.print-signature-logo{width:112px;height:112px;border-radius:50%;object-fit:cover;flex-shrink:0}
.print-signature-line-inline{flex:1;min-width:80px;border-top:1px solid #000;height:0}
.print-signature-label{font-size:12px;font-weight:600;margin-top:8px;text-align:center}
.print-footer{margin-top:24px;text-align:center;font-size:12px;color:#000}
</style></head><body>
<div class="print-header-corner">
<img src="${iconUrl}" class="print-logo-corner" alt=""/>
<div style="font-size:10px;font-weight:600;max-width:100px;margin-top:4px">${escHtml(tr('printFooterApp'))}</div>
</div>
<div class="print-info-columns">
<div class="print-info-column">
<div class="print-section-title">${escHtml(tr('printCompany'))}</div>
<p><strong>${escHtml(tr('labelCompany'))}:</strong> ${escHtml(co.companyName || 'SwissDZ')}</p>
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
<div class="print-signature-column">
${installerSignaturePrintHtml(co)}
</div>
<div class="print-signature-column">
${clientSignaturePrintHtml(co)}
</div>
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
    const showLogo = document.getElementById('co-show-logo');
    if (showLogo) showLogo.checked = !!co.showLogoOnDevis;
    updateCompanyLogoPreview(co.logoDataUrl || '');
    document.getElementById('modal-company').dataset.logoDataUrl = co.logoDataUrl || '';
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

    document.querySelectorAll('.lang-btn[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
    });
    const legacyToggle = document.getElementById('lang-toggle');
    if (legacyToggle) {
      legacyToggle.addEventListener('click', () => {
        const cur = getLang();
        setLang(cur === 'fr' ? 'ar' : cur === 'ar' ? 'en' : 'fr');
      });
    }
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
      const modal = document.getElementById('modal-company');
      const logoDataUrl = modal?.dataset.logoDataUrl || '';
      const showLogoEl = document.getElementById('co-show-logo');
      saveCompany({
        companyName: document.getElementById('co-name').value.trim(),
        services: document.getElementById('co-services').value.trim(),
        phone: document.getElementById('co-phone').value.trim(),
        email: document.getElementById('co-email').value.trim(),
        logoDataUrl,
        showLogoOnDevis: !!(showLogoEl && showLogoEl.checked && logoDataUrl),
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

    const logoPick = document.getElementById('co-logo-pick');
    const logoFile = document.getElementById('co-logo-file');
    const logoRemove = document.getElementById('co-logo-remove');
    if (logoPick && logoFile) {
      logoPick.addEventListener('click', () => logoFile.click());
      logoFile.addEventListener('change', async () => {
        const file = logoFile.files && logoFile.files[0];
        logoFile.value = '';
        if (!file || !file.type.startsWith('image/')) return;
        try {
          const dataUrl = await resizeLogoToDataUrl(file);
          const modal = document.getElementById('modal-company');
          if (modal) modal.dataset.logoDataUrl = dataUrl;
          updateCompanyLogoPreview(dataUrl);
          const showLogo = document.getElementById('co-show-logo');
          if (showLogo) showLogo.checked = true;
        } catch (_) {
          alert(tr('companyLogo') + ' — erreur');
        }
      });
    }
    if (logoRemove) {
      logoRemove.addEventListener('click', () => {
        const modal = document.getElementById('modal-company');
        if (modal) delete modal.dataset.logoDataUrl;
        updateCompanyLogoPreview('');
        const showLogo = document.getElementById('co-show-logo');
        if (showLogo) showLogo.checked = false;
      });
    }

    document.querySelectorAll('.lang-btn[data-lang]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === getLang());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
