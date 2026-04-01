/**
 * PayPal checkout and success page HTML generators.
 * Uses PayPal JS SDK with createOrder to pre-fill the amount automatically.
 * The customer sees the exact amount and can pay directly without manual entry.
 */

interface CheckoutParams {
  amount: string;
  currency: string;
  booking: string;
  name: string;
  scheme: string;
}

interface SuccessParams {
  tx: string;
  amount: string;
  currency: string;
  name: string;
  scheme: string;
}

export function buildCheckoutPage(p: CheckoutParams): string {
  const nameRow = p.name
    ? '<div class="info-row"><span class="label">\u0627\u0644\u0627\u0633\u0645</span><span class="value">' + escapeHtml(p.name) + "</span></div>"
    : "";
  const bookingRow = p.booking
    ? '<div class="info-row"><span class="label">\u0631\u0642\u0645 \u0627\u0644\u062d\u062c\u0632</span><span class="value">' + escapeHtml(p.booking) + "</span></div>"
    : "";

  // Use the standard PayPal JS SDK with buttons (not hosted buttons)
  // This allows us to set the amount programmatically via createOrder
  const clientId = "BAAe3HWztSL3qmFxXI2nVSKirPWH_KJhAUyU9OPRnVTQZ8kmmdeF5u2yYJkIYGlqBhOnQvyxhDpFF9qI90";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Royal Service - \u0627\u0644\u062f\u0641\u0639 \u0639\u0628\u0631 PayPal</title>
<script src="https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${escapeHtml(p.currency)}&disable-funding=venmo"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#001f4d 0%,#003087 50%,#0070ba 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#fff;border-radius:20px;padding:32px 24px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.logo{text-align:center;margin-bottom:20px}
.logo h1{font-size:22px;color:#003087;margin-bottom:4px}
.logo p{font-size:13px;color:#687076}
.divider{height:1px;background:#E5E7EB;margin:16px 0}
.info-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;font-size:15px;color:#333}
.info-row .label{color:#687076;font-size:13px}
.info-row .value{font-weight:600;color:#11181C}
.amount-box{background:#f0f7ff;border:2px solid #003087;border-radius:14px;padding:20px;text-align:center;margin:16px 0}
.amount-box .amount{font-size:36px;font-weight:800;color:#003087}
.amount-box .currency-label{font-size:13px;color:#687076;margin-top:4px}
.amount-box .ready-badge{display:inline-block;background:#22C55E;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;margin-top:8px}
#paypal-button-container{margin-top:20px;min-height:150px}
#loading-msg{display:none;text-align:center;padding:20px;color:#003087;font-size:16px;font-weight:600}
#error-msg{display:none;text-align:center;padding:16px;color:#EF4444;font-size:14px;font-weight:600;background:#FEF2F2;border-radius:10px;margin-top:12px}
.secure-note{text-align:center;font-size:11px;color:#9BA1A6;margin-top:16px}
.secure-note span{color:#22C55E}
.info-note{background:#f0f7ff;border:1px solid #003087;border-radius:10px;padding:12px;text-align:center;margin-top:12px;font-size:12px;color:#003087;line-height:1.5}
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <h1>\u2708\uFE0F Royal Service</h1>
    <p>\u0627\u0644\u062f\u0641\u0639 \u0627\u0644\u0622\u0645\u0646 \u0639\u0628\u0631 PayPal</p>
  </div>
  <div class="divider"></div>
  ${nameRow}
  ${bookingRow}
  <div class="amount-box">
    <div class="amount">${escapeHtml(p.currency)} ${escapeHtml(p.amount)}</div>
    <div class="currency-label">\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u0637\u0644\u0648\u0628</div>
    <div class="ready-badge">\u2713 \u062c\u0627\u0647\u0632 \u0644\u0644\u062f\u0641\u0639 \u0645\u0628\u0627\u0634\u0631\u0629</div>
  </div>
  <div class="info-note">
    \u0627\u0644\u0645\u0628\u0644\u063a \u0645\u0639\u0628\u0623 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b \u2014 \u0627\u0636\u063a\u0637 \u0639\u0644\u0649 \u0632\u0631 PayPal \u0623\u0648 Checkout \u0644\u0644\u062f\u0641\u0639 \u0645\u0628\u0627\u0634\u0631\u0629
  </div>
  <div id="paypal-button-container"></div>
  <div id="loading-msg">\u062c\u0627\u0631\u064d \u0645\u0639\u0627\u0644\u062c\u0629 \u0627\u0644\u062f\u0641\u0639...</div>
  <div id="error-msg"></div>
  <script>
    var AMOUNT = '${escapeJs(p.amount)}';
    var CURRENCY = '${escapeJs(p.currency)}';
    var CUSTOMER_NAME = '${escapeJs(p.name)}';
    var BOOKING_REF = '${escapeJs(p.booking)}';
    var APP_SCHEME = '${escapeJs(p.scheme)}';

    paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'checkout',
        height: 50
      },
      createOrder: function(data, actions) {
        return actions.order.create({
          purchase_units: [{
            description: 'Royal Service - ' + BOOKING_REF,
            amount: {
              currency_code: CURRENCY,
              value: AMOUNT
            }
          }]
        });
      },
      onApprove: function(data, actions) {
        document.getElementById('paypal-button-container').style.display = 'none';
        document.getElementById('loading-msg').style.display = 'block';
        document.getElementById('error-msg').style.display = 'none';

        return actions.order.capture().then(function(details) {
          var txId = details.id || data.orderID || 'N/A';

          // Notify server
          fetch('/api/paypal-notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              txId: txId,
              amount: AMOUNT,
              currency: CURRENCY,
              name: CUSTOMER_NAME,
              booking: BOOKING_REF
            })
          }).finally(function() {
            window.location.href = '/api/paypal-success?tx=' + encodeURIComponent(txId)
              + '&amount=' + encodeURIComponent(AMOUNT)
              + '&currency=' + encodeURIComponent(CURRENCY)
              + '&name=' + encodeURIComponent(CUSTOMER_NAME)
              + '&scheme=' + encodeURIComponent(APP_SCHEME);
          });
        });
      },
      onCancel: function() {
        document.getElementById('error-msg').textContent = '\u062a\u0645 \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062f\u0641\u0639. \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.';
        document.getElementById('error-msg').style.display = 'block';
      },
      onError: function(err) {
        document.getElementById('loading-msg').style.display = 'none';
        document.getElementById('paypal-button-container').style.display = 'block';
        document.getElementById('error-msg').textContent = '\u062d\u062f\u062b \u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u062f\u0641\u0639. \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.';
        document.getElementById('error-msg').style.display = 'block';
        console.error('PayPal Error:', err);
      }
    }).render('#paypal-button-container');
  <\/script>
  <div class="secure-note">
    <span>&#x1F512;</span> \u062f\u0641\u0639 \u0622\u0645\u0646 \u0639\u0628\u0631 PayPal - \u0644\u0627 \u0646\u062d\u0641\u0638 \u0628\u064a\u0627\u0646\u0627\u062a \u0628\u0637\u0627\u0642\u062a\u0643
  </div>
</div>
</body>
</html>`;
}

export function buildSuccessPage(p: SuccessParams): string {
  const greeting = p.name ? ", " + escapeHtml(p.name) : "";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Royal Service - \u062a\u0645 \u0627\u0644\u062f\u0641\u0639 \u0628\u0646\u062c\u0627\u062d</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#064e3b 0%,#065f46 50%,#047857 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#fff;border-radius:20px;padding:32px 24px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3);text-align:center}
.check-circle{width:80px;height:80px;background:#22C55E;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;animation:scaleIn .5s ease}
@keyframes scaleIn{0%{transform:scale(0)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
.check-circle svg{width:40px;height:40px;fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
h1{font-size:24px;color:#065f46;margin-bottom:8px}
.subtitle{font-size:14px;color:#687076;margin-bottom:24px}
.detail-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:16px;margin-bottom:16px;text-align:right}
.detail-row{display:flex;justify-content:space-between;padding:8px 0;font-size:14px}
.detail-row .label{color:#687076}
.detail-row .value{font-weight:600;color:#11181C}
.tx-box{background:#f8fafc;border:2px dashed #003087;border-radius:12px;padding:14px;margin:16px 0}
.tx-label{font-size:12px;color:#687076;margin-bottom:6px}
.tx-value{font-size:18px;font-weight:700;color:#003087;font-family:monospace;letter-spacing:1px;word-break:break-all}
.copy-btn{background:#003087;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;cursor:pointer;margin-top:8px}
.copy-btn:active{opacity:.8}
.note{font-size:12px;color:#9BA1A6;margin-top:20px;line-height:1.6}
.note strong{color:#065f46}
.back-btn{display:block;width:100%;background:linear-gradient(135deg,#065f46,#047857);color:#fff;border:none;border-radius:14px;padding:16px;font-size:16px;font-weight:700;cursor:pointer;margin-top:20px;text-decoration:none;text-align:center}
.back-btn:active{opacity:.85}
.back-btn-secondary{display:block;width:100%;background:#f0f7ff;color:#003087;border:2px solid #003087;border-radius:14px;padding:14px;font-size:14px;font-weight:600;cursor:pointer;margin-top:10px;text-decoration:none;text-align:center}
.back-btn-secondary:active{opacity:.85}
</style>
</head>
<body>
<div class="card">
  <div class="check-circle">
    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
  </div>
  <h1>\u062a\u0645 \u0627\u0644\u062f\u0641\u0639 \u0628\u0646\u062c\u0627\u062d!</h1>
  <p class="subtitle">\u0634\u0643\u0631\u0627\u064b \u0644\u0643${greeting}. \u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u062f\u0641\u0639\u062a\u0643 \u0639\u0628\u0631 PayPal.</p>
  <div class="detail-box">
    <div class="detail-row">
      <span class="label">\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u062f\u0641\u0648\u0639</span>
      <span class="value">${escapeHtml(p.amount)} ${escapeHtml(p.currency)}</span>
    </div>
    <div class="detail-row">
      <span class="label">\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062f\u0641\u0639</span>
      <span class="value">PayPal</span>
    </div>
    <div class="detail-row">
      <span class="label">\u0627\u0644\u062d\u0627\u0644\u0629</span>
      <span class="value" style="color:#22C55E;">&#x2705; \u0645\u0643\u062a\u0645\u0644</span>
    </div>
  </div>
  <div class="tx-box">
    <div class="tx-label">\u0631\u0642\u0645 \u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0639\u0645\u0644\u064a\u0629 (Transaction ID)</div>
    <div class="tx-value" id="txId">${escapeHtml(p.tx)}</div>
    <button class="copy-btn" onclick="copyTx(this)">\u{1F4CB} \u0646\u0633\u062e \u0631\u0642\u0645 \u0627\u0644\u0639\u0645\u0644\u064a\u0629</button>
  </div>
  <script>
    function copyTx(btn) {
      var t = document.getElementById('txId').textContent;
      navigator.clipboard.writeText(t).then(function() {
        btn.textContent = '\\u2705 \\u062a\\u0645 \\u0627\\u0644\\u0646\\u0633\\u062e';
        setTimeout(function(){ btn.textContent = '\\u{1F4CB} \\u0646\\u0633\\u062e \\u0631\\u0642\\u0645 \\u0627\\u0644\\u0639\\u0645\\u0644\\u064a\\u0629'; }, 2500);
      });
    }
  <\/script>
  <a class="back-btn" href="${p.scheme}://paypal-success?tx=${escapeHtml(p.tx)}" onclick="tryDeepLink(event)">
    \u2708\uFE0F \u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 Royal Service
  </a>
  <a class="back-btn-secondary" href="javascript:void(0)" onclick="window.close(); return false;">
    \u0625\u063a\u0644\u0627\u0642 \u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062d\u0629
  </a>
  <script>
    function tryDeepLink(e) {
      e.preventDefault();
      var deepLink = '${p.scheme}://paypal-success?tx=' + encodeURIComponent('${escapeJs(p.tx)}');
      window.location.href = deepLink;
      setTimeout(function() {
        // If still here after 1.5s, deep link didn't work
      }, 1500);
    }
  <\/script>
  <div class="note">
    <strong>\u0645\u0647\u0645:</strong> \u0627\u0646\u0633\u062e \u0631\u0642\u0645 \u0627\u0644\u0639\u0645\u0644\u064a\u0629 \u0648\u0623\u062f\u062e\u0644\u0647 \u0641\u064a \u062a\u0637\u0628\u064a\u0642 Royal Service \u0644\u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u062d\u062c\u0632.<br>
    \u0633\u064a\u062a\u0645 \u062a\u0623\u0643\u064a\u062f \u062d\u062c\u0632\u0643 \u062e\u0644\u0627\u0644 24 \u0633\u0627\u0639\u0629 \u0643\u062d\u062f \u0623\u0642\u0635\u0649.
  </div>
</div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeJs(s: string): string {
  return String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"');
}
