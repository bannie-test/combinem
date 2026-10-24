/*
 * PaymentService — real-money top-ups. NOT LIVE YET: config/payment.js has enabled:false.
 *
 * Flow (identical for every provider):
 *   purchase(sku)
 *     -> adapter.createOrder(product)       server creates an order id
 *     -> adapter.pay(order, product)        store SDK / web checkout
 *     -> adapter.verify(receipt)            server validates the receipt (never trust the client)
 *     -> grant(product, transactionId)      idempotent: a transaction is granted once (ledger)
 *
 * Adding a provider = implementing createOrder / pay / verify / restore in an adapter below.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const P = () => NOA.PAYMENT;
  const S = () => NOA.state;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  const adapters = {
    /* Default: nothing leaves the device. */
    disabled: {
      async createOrder() { const e = new Error('disabled'); e.code = 'disabled'; throw e; }
    },

    /* Dev only: simulates the whole round-trip so the grant / ledger logic can be tested. */
    mock: {
      async createOrder(product) {
        await wait(P().mockDelayMs / 3);
        return { orderId: 'mock_' + Date.now().toString(36), sku: product.sku };
      },
      async pay(order) {
        await wait(P().mockDelayMs / 3);
        if (Math.random() > P().mockSuccessRate) { const e = new Error('cancelled'); e.code = 'cancelled'; throw e; }
        return { orderId: order.orderId, receipt: 'mock-receipt-' + order.orderId };
      },
      async verify(receipt) {
        await wait(P().mockDelayMs / 3);
        return { ok: true, transactionId: 'tx_' + receipt.orderId };
      },
      async restore() { return []; }
    },

    /* Google Play Billing — wire through a Capacitor / Cordova billing plugin when the game ships as an app. */
    googlePlay: {
      async createOrder(product) {
        return postJSON(P().endpoints.createOrder, { sku: product.sku, store: 'googlePlay', productId: product.storeIds.googlePlay });
      },
      async pay(order, product) {
        // TODO: call the billing plugin, e.g. await Billing.purchase({ productId: product.storeIds.googlePlay })
        const e = new Error('not implemented'); e.code = 'not_implemented'; throw e;
      },
      async verify(receipt) { return postJSON(P().endpoints.verifyReceipt, { store: 'googlePlay', receipt }); },
      async restore() { return postJSON(P().endpoints.restore, { store: 'googlePlay' }); }
    },

    /* Apple StoreKit */
    appStore: {
      async createOrder(product) {
        return postJSON(P().endpoints.createOrder, { sku: product.sku, store: 'appStore', productId: product.storeIds.appStore });
      },
      async pay(order, product) {
        // TODO: StoreKit purchase via plugin, e.g. await InAppPurchase.purchase(product.storeIds.appStore)
        const e = new Error('not implemented'); e.code = 'not_implemented'; throw e;
      },
      async verify(receipt) { return postJSON(P().endpoints.verifyReceipt, { store: 'appStore', receipt }); },
      async restore() { return postJSON(P().endpoints.restore, { store: 'appStore' }); }
    },

    /* Web checkout (MoMo / ZaloPay / VNPay / Stripe...) handled by your server */
    web: {
      async createOrder(product) {
        return postJSON(P().endpoints.createOrder, { sku: product.sku, store: 'web', currency: 'VND', amount: product.priceVND });
      },
      async pay(order) {
        // TODO: open order.checkoutUrl (P().links.webCheckout + '?order=' + order.orderId) in a new tab,
        // then poll your server or listen for the return URL before calling verify().
        const e = new Error('not implemented'); e.code = 'not_implemented'; throw e;
      },
      async verify(receipt) { return postJSON(P().endpoints.verifyReceipt, { store: 'web', receipt }); },
      async restore() { return []; }
    }
  };

  const PAY = NOA.payment = {
    adapters,
    provider() {
      const dev = S() && S().dev && S().dev.payProvider;
      return dev || P().provider;
    },
    isLive() {
      const p = PAY.provider();
      return p === 'mock' || (P().enabled && p !== 'disabled');
    },
    products() { return P().products; },
    find(sku) { return P().products.find((p) => p.sku === sku) || null; },
    priceText(product) {
      const lang = NOA.i18n.lang;
      const cur = P().displayCurrency[lang] || 'VND';
      if (cur === 'USD') return '$' + product.priceUSD.toFixed(2);
      return product.priceVND.toLocaleString('vi-VN') + ' ₫';
    },
    owned(sku) { return !!S().purchases.owned[sku]; },
    available(product) {
      if (product.type === 'one_time' && PAY.owned(product.sku)) return false;
      if (product.type === 'subscription' && S().purchases.monthlyUntil > NOA.time.now()) return false;
      return true;
    },
    async purchase(sku) {
      const product = PAY.find(sku);
      if (!product) return { ok: false, code: 'unknown_sku' };
      if (!PAY.available(product)) return { ok: false, code: 'owned' };
      const adapter = adapters[PAY.isLive() ? PAY.provider() : 'disabled'];
      NOA.events.emit('payment.started', { sku });
      try {
        const order = await adapter.createOrder(product);
        const receipt = await adapter.pay(order, product);
        const verified = await adapter.verify(receipt);
        if (!verified || !verified.ok) return PAY.fail(sku, 'verify_failed');
        return PAY.grant(product, verified.transactionId);
      } catch (e) {
        return PAY.fail(sku, e.code || 'error', e);
      }
    },
    fail(sku, code, err) {
      if (err && code !== 'disabled') console.warn('[NOA payment]', err);
      NOA.events.emit('payment.failed', { sku, code });
      return { ok: false, code };
    },
    /** Idempotent grant keyed by transaction id */
    grant(product, transactionId) {
      const s = S();
      if (s.ledger.some((t) => t.tx === transactionId)) return { ok: true, duplicate: true };
      s.ledger.push({ tx: transactionId, sku: product.sku, at: NOA.time.now(), provider: PAY.provider() });
      const reward = Object.assign({}, product.grant);
      if (product.bonus) reward.gems = (reward.gems || 0) + product.bonus;
      if (product.type === 'one_time') s.purchases.owned[product.sku] = true;
      if (product.type === 'subscription') s.purchases.monthlyUntil = NOA.time.now() + product.durationDays * NOA.time.DAY;
      const granted = NOA.rewards.grant(reward, 'payment');
      NOA.events.emit('payment.completed', { sku: product.sku, granted });
      NOA.save.schedule();
      return { ok: true, granted };
    },
    /** Monthly card daily claim */
    monthly: {
      active() { return S().purchases.monthlyUntil > NOA.time.now(); },
      canClaim() { return PAY.monthly.active() && S().purchases.monthlyLastDay !== NOA.time.dayKey(); },
      claim() {
        if (!PAY.monthly.canClaim()) return null;
        const p = P().products.find((x) => x.type === 'subscription');
        S().purchases.monthlyLastDay = NOA.time.dayKey();
        return NOA.rewards.grant(p.daily, 'monthly');
      }
    },
    async restore() {
      const adapter = adapters[PAY.isLive() ? PAY.provider() : 'disabled'];
      if (!adapter.restore) return { ok: false, code: 'disabled' };
      try { return { ok: true, items: await adapter.restore() }; } catch (e) { return { ok: false, code: e.code || 'error' }; }
    }
  };
})();
