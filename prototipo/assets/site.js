/* GEEK SWIN · comportamento compartilhado por todas as páginas.
   Tudo roda no navegador: a bag fica no localStorage (chave "gs-cart"). */
(function () {
  var C = window.GS_CATALOG;
  var bySlug = {};
  C.products.forEach(function (p) { bySlug[p.slug] = p; });
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var brl = function (n) { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); };
  var inst = function (n) { return brl(Math.floor(Math.round(n * 100) / C.installments) / 100); };
  var store = {
    get: function (k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- Bag ---------- */
  var cart = {
    items: function () { return store.get('gs-cart', []).filter(function (i) { return bySlug[i.slug]; }); },
    save: function (items) { store.set('gs-cart', items); cart.badge(true); },
    count: function () { return cart.items().reduce(function (s, i) { return s + i.qty; }, 0); },
    subtotal: function () { return cart.items().reduce(function (s, i) { return s + bySlug[i.slug].price * i.qty; }, 0); },
    add: function (slug, size, qty) {
      var items = cart.items(), hit = items.find(function (i) { return i.slug === slug && i.size === size; });
      if (hit) hit.qty = Math.min(hit.qty + (qty || 1), 10); else items.push({ slug: slug, size: size, qty: qty || 1 });
      cart.save(items);
    },
    setQty: function (slug, size, qty) {
      var items = cart.items().map(function (i) { if (i.slug === slug && i.size === size) i.qty = qty; return i; }).filter(function (i) { return i.qty > 0; });
      cart.save(items);
    },
    badge: function (bump) {
      var n = cart.count();
      $$('.bag-count').forEach(function (el) {
        el.textContent = n;
        if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
      });
    }
  };
  cart.badge(false);
  window.GS_CART = cart;

  var toastTimer;
  function toast(p, size) {
    var el = $('#toast');
    if (!el) return;
    $('#toast-img').src = 'products/' + p.image;
    $('#toast-name').textContent = p.name;
    $('#toast-meta').textContent = 'Tamanho ' + size + ' · ' + brl(p.price);
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 4200);
  }

  /* ---------- Menu fixo + menu mobile ---------- */
  var bar = $('#topbar');
  if (bar) {
    var onScroll = function () { bar.classList.toggle('is-scrolled', window.scrollY > 40); };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  var mBtn = $('#menu-btn'), mNav = $('#mobile-nav');
  if (mBtn && mNav) mBtn.addEventListener('click', function () {
    var open = mNav.classList.toggle('open');
    mNav.inert = !open; // fechado, os links não recebem foco pelo Tab
    mBtn.setAttribute('aria-expanded', open); mBtn.textContent = open ? 'Fechar' : 'Menu';
  });

  /* ---------- Contagem regressiva (popup e página de drops) ---------- */
  var END = Date.parse(C.drop.opensAtUTC);
  function tick() {
    var t = Math.max(0, END - Date.now()), v = { d: t / 864e5, h: t / 36e5 % 24, m: t / 6e4 % 60, s: t / 1e3 % 60 };
    $$('[data-cd]').forEach(function (el) { el.textContent = String(Math.floor(v[el.dataset.cd])).padStart(2, '0'); });
    // leitor de tela: um resumo que muda pouco, em vez de anunciar cada segundo
    $$('[data-cd-summary]').forEach(function (el) { el.setAttribute('aria-label', 'Faltam ' + Math.floor(v.d) + ' dias e ' + Math.floor(v.h) + ' horas para o drop'); });
  }
  if ($('[data-cd]')) { tick(); setInterval(tick, 1000); }

  /* ---------- Formulários de e-mail (popup, rodapé, drops) ----------
     Só validação no navegador. NENHUM e-mail é salvo ainda (ver guia). */
  $$('form[data-signup]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('input[type=email]', form), err = $('[data-error]', form), ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      if (!ok) { if (err) err.hidden = false; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      if (err) err.hidden = true; input.removeAttribute('aria-invalid');
      var success = document.getElementById(form.dataset.success);
      if (success) { form.hidden = true; success.hidden = false; var f = $('[data-focus]', success); if (f) f.focus(); }
      if (form.dataset.signup === 'popup') store.set('gs-drop-popup', { joined: true, at: Date.now() });
    });
  });

  /* ---------- Popup do drop: 1.2s depois de abrir, uma vez por visitante ---------- */
  var modal = $('#drop-modal');
  if (modal && typeof modal.showModal === 'function') {
    var st = store.get('gs-drop-popup', null);
    var show = !st || (!st.joined && Date.now() - st.at > 864e5);
    modal.addEventListener('close', function () { var s = store.get('gs-drop-popup', null); if (!s || !s.joined) store.set('gs-drop-popup', { joined: false, at: Date.now() }); });
    modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('[data-close]')) modal.close(); });
    if (show && !document.body.dataset.noPopup) setTimeout(function () { if (!document.querySelector('dialog[open]')) modal.showModal(); }, 1200);
  }

  /* ---------- Página de produto ---------- */
  var pdp = $('#pdp');
  if (pdp) {
    var p = bySlug[pdp.dataset.slug], chosen = null;
    // galeria
    $$('.thumb', pdp).forEach(function (t) {
      t.addEventListener('click', function () {
        $$('.thumb', pdp).forEach(function (o) { o.setAttribute('aria-pressed', o === t); });
        $$('.gallery-main .photo', pdp).forEach(function (img) { img.classList.toggle('is-active', img.dataset.view === t.dataset.view); });
      });
    });
    // tamanhos (radiogroup)
    var sizeBtns = $$('.size-btn:not(:disabled)', pdp), sizeErr = $('#size-error'), sizeLabel = $('#size-chosen');
    function pick(btn) {
      chosen = btn.dataset.size;
      $$('.size-btn', pdp).forEach(function (b) { b.setAttribute('aria-checked', b === btn); b.tabIndex = b === btn ? 0 : -1; });
      sizeErr.hidden = true; sizeLabel.textContent = chosen;
    }
    sizeBtns.forEach(function (b, i) {
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return; e.preventDefault(); var n = sizeBtns[(i + d + sizeBtns.length) % sizeBtns.length]; pick(n); n.focus();
      });
    });
    if (sizeBtns.length === 1) pick(sizeBtns[0]); // tamanho único já vem escolhido
    function requireSize() {
      if (chosen) return true;
      sizeErr.hidden = false; $('#sizes').scrollIntoView({ behavior: 'smooth', block: 'center' }); (sizeBtns[0] || {}).focus && sizeBtns[0].focus();
      return false;
    }
    $$('[data-add]').forEach(function (b) { b.addEventListener('click', function () { if (!requireSize()) return; cart.add(p.slug, chosen, 1); toast(p, chosen); }); });
    $$('[data-buy]').forEach(function (b) { b.addEventListener('click', function () {
      if (!requireSize()) return;
      var inBag = cart.items().some(function (i) { return i.slug === p.slug && i.size === chosen; });
      if (!inBag) cart.add(p.slug, chosen, 1); // não duplica se a pessoa já adicionou
      location.href = 'carrinho.html';
    }); });
    // barra de compra fixa no celular quando o botão principal sai da tela
    var buyBar = $('#buy-bar'), mainAdd = $('#main-add');
    if (buyBar && mainAdd && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { buyBar.classList.toggle('show', !en[0].isIntersecting && en[0].boundingClientRect.top < 0); }).observe(mainAdd);
    }
  }

  /* ---------- Loja: filtros e ordenação ---------- */
  var grid = $('#shop-grid');
  if (grid) {
    var chips = $$('.chip'), sortSel = $('#sort'), countEl = $('#shop-count');
    function apply(cat) {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.cat === cat); });
      var n = 0;
      $$('.card', grid).forEach(function (c) { var hide = cat !== 'todos' && c.dataset.cat !== cat; c.classList.toggle('is-hidden', hide); if (!hide) n++; });
      countEl.textContent = n + (n === 1 ? ' peça' : ' peças');
    }
    function sort() {
      var cards = $$('.card', grid), v = sortSel.value;
      cards.sort(function (a, b) {
        if (v === 'menor') return a.dataset.price - b.dataset.price;
        if (v === 'maior') return b.dataset.price - a.dataset.price;
        return a.dataset.order - b.dataset.order;
      }).forEach(function (c) { grid.appendChild(c); });
    }
    chips.forEach(function (c) { c.addEventListener('click', function () { apply(c.dataset.cat); try { history.replaceState(null, '', c.dataset.cat === 'todos' ? location.pathname : '#' + c.dataset.cat); } catch (e) {} }); });
    sortSel.addEventListener('change', sort);
    var h = location.hash.slice(1);
    apply(chips.some(function (c) { return c.dataset.cat === h; }) ? h : 'todos');
  }

  /* ---------- Página da bag ---------- */
  var bagList = $('#bag-list');
  if (bagList) {
    function renderBag() {
      var items = cart.items(), sub = cart.subtotal(), free = C.freeShippingFrom, missing = Math.max(0, free - sub);
      $('#bag-empty').hidden = items.length > 0;
      $('#bag-full').hidden = items.length === 0;
      bagList.innerHTML = items.map(function (i) {
        var p = bySlug[i.slug];
        return '<li class="grid grid-cols-[6rem_1fr_auto] gap-4 border-b border-line py-5 sm:grid-cols-[8rem_1fr_auto]">' +
          '<a href="produto-' + p.slug + '.html" class="studio block aspect-[4/5] rounded-2xl" aria-hidden="true" tabindex="-1"><img src="products/' + p.image + '" alt=""></a>' +
          '<div class="min-w-0"><a href="produto-' + p.slug + '.html" class="font-display text-lg font-bold leading-tight hover:text-acid-ink">' + p.name + '</a>' +
          '<p class="mt-1 font-mono text-micro uppercase tracking-[0.14em] text-muted">Tamanho ' + i.size + (p.drop && p.edition ? ' · Nº ' + p.number + ' / ' + p.edition : '') + '</p>' +
          '<div class="mt-4 inline-flex items-center rounded-full border border-line">' +
          '<button type="button" class="grid size-9 place-items-center" data-q="-1" data-slug="' + p.slug + '" data-size="' + i.size + '" aria-label="Diminuir quantidade">−</button>' +
          '<span class="tick w-8 text-center font-mono text-sm" aria-live="polite">' + i.qty + '</span>' +
          '<button type="button" class="grid size-9 place-items-center" data-q="1" data-slug="' + p.slug + '" data-size="' + i.size + '" aria-label="Aumentar quantidade">+</button></div>' +
          '<button type="button" aria-label="Remover ' + p.name + ', tamanho ' + i.size + '" class="ml-4 py-3 font-mono text-micro uppercase tracking-[0.14em] text-muted underline underline-offset-4 hover:text-ink" data-remove data-slug="' + p.slug + '" data-size="' + i.size + '">Remover</button></div>' +
          '<div class="tick text-right font-display text-lg font-bold">' + brl(p.price * i.qty) + '</div></li>';
      }).join('');
      $('#bag-sub').textContent = brl(sub);
      $('#bag-ship').textContent = missing === 0 ? 'Grátis' : 'Calculado no checkout';
      $('#bag-total').textContent = brl(sub);
      $('#bag-inst').textContent = 'ou ' + C.installments + 'x de ' + inst(sub) + ' sem juros';
      $('#bag-pix').textContent = brl(sub * (1 - C.pixDiscount)) + ' no Pix (5% off)';
      $('#free-msg').textContent = missing === 0 ? 'Você ganhou frete grátis ✓' : 'Faltam ' + brl(missing) + ' para o frete grátis';
      $('#free-bar').style.width = Math.min(100, sub / free * 100) + '%';
      $('#bag-count-title').textContent = cart.count() + (cart.count() === 1 ? ' item' : ' itens');
    }
    bagList.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var cur = cart.items().find(function (i) { return i.slug === b.dataset.slug && i.size === b.dataset.size; });
      if (!cur) return;
      if (b.hasAttribute('data-remove')) cart.setQty(cur.slug, cur.size, 0);
      else cart.setQty(cur.slug, cur.size, Math.max(0, Math.min(10, cur.qty + Number(b.dataset.q))));
      renderBag();
    });
    $('#checkout').addEventListener('click', function () { $('#checkout-note').hidden = false; });
    renderBag();
  }

  /* ---------- Cursor: ponto que segue com atraso e vira disco verde "VER" ---------- */
  var cur = $('#cursor');
  if (cur && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.add('has-cursor');
    var x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, EASE = reduce ? 1 : 0.16;
    addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; cur.classList.add('ready'); });
    document.addEventListener('mouseleave', function () { cur.classList.remove('ready'); });
    document.addEventListener('mouseover', function (e) { cur.classList.toggle('is-view', !!e.target.closest('[data-cursor="view"]')); });
    (function loop() { cx += (x - cx) * EASE; cy += (y - cy) * EASE; cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)'; requestAnimationFrame(loop); })();
  }
})();
