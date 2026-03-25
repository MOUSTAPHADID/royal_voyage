/**
 * PayPal checkout and success page HTML generators.
 * Separated to avoid template literal nesting issues in index.ts.
 */

interface CheckoutParams {
  amount: string;
  currency: string;
  booking: string;
  name: string;
}

interface SuccessParams {
  tx: string;
  amount: string;
  currency: string;
  name: string;
}

export function buildCheckoutPage(p: CheckoutParams): string {
  const nameRow = p.name
    ? '<div class="info-row"><span class="label">\u0627\u0644\u0627\u0633\u0645</span><span class="value">' + escapeHtml(p.name) + "</span></div>"
    : "";
  const bookingRow = p.booking
    ? '<div class="info-row"><span class="label">\u0631\u0642\u0645 \u0627\u0644\u062d\u062c\u0632</span><span class="value">' + escapeHtml(p.booking) + "</span></div>"
    : "";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Royal Voyage - \u0627\u0644\u062f\u0641\u0639 \u0639\u0628\u0631 PayPal</title>
<script src="https://www.paypal.com/sdk/js?client-id=BAAe3HWztSL3qmFxXI2nVSKirPWH_KJhAUyU9OPRnVTQZ8kmmdeF5u2yYJkIYGlqBhOnQvyxhDpFF9qI90&components=hosted-buttons&disable-funding=venmo&currency=${escapeHtml(p.currency)}"><\/script>
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
.amount-box{background:#f0f7ff;border:2px solid #003087;border-radius:14px;padding:16px;text-align:center;margin:16px 0}
.amount-box .amount{font-size:32px;font-weight:800;color:#003087}
.amount-box .currency-label{font-size:13px;color:#687076;margin-top:4px}
#paypal-container-HS2AES3UYJHQA{margin-top:20px;min-height:150px}
#loading-msg{display:none;text-align:center;padding:20px;color:#003087;font-size:16px;font-weight:600}
.secure-note{text-align:center;font-size:11px;color:#9BA1A6;margin-top:16px}
.secure-note span{color:#22C55E}
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <h1>\u2708\uFE0F Royal Voyage</h1>
    <p>\u0627\u0644\u062f\u0641\u0639 \u0627\u0644\u0622\u0645\u0646 \u0639\u0628\u0631 PayPal</p>
  </div>
  <div class="divider"></div>
  ${nameRow}
  ${bookingRow}
  <div class="amount-box">
    <div class="amount">${escapeHtml(p.amount)} ${escapeHtml(p.currency)}</div>
    <div class="currency-label">\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u0637\u0644\u0648\u0628</div>
  </div>
  <div id="paypal-container-HS2AES3UYJHQA"></div>
  <div id="loading-msg">\u062c\u0627\u0631\u064d \u0645\u0639\u0627\u0644\u062c\u0629 \u0627\u0644\u062f\u0641\u0639...</div>
  <script>
    paypal.HostedButtons({
      hostedButtonId: "HS2AES3UYJHQA",
      onApprove: function(data) {
        document.getElementById('paypal-container-HS2AES3UYJHQA').style.display = 'none';
        document.getElementById('loading-msg').style.display = 'block';
        var txId = (data && data.orderID) || (data && data.paymentID) || 'N/A';
        fetch('/api/paypal-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txId: txId,
            amount: '${escapeHtml(p.amount)}',
            currency: '${escapeHtml(p.currency)}',
            name: '${escapeJs(p.name)}',
            booking: '${escapeJs(p.booking)}'
          })
        }).finally(function() {
          window.location.href = '/api/paypal-success?tx=' + encodeURIComponent(txId)
            + '&amount=' + encodeURIComponent('${escapeHtml(p.amount)}')
            + '&currency=' + encodeURIComponent('${escapeHtml(p.currency)}')
            + '&name=' + encodeURIComponent('${escapeJs(p.name)}');
        });
      }
    }).render("#paypal-container-HS2AES3UYJHQA");
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
<title>Royal Voyage - \u062a\u0645 \u0627\u0644\u062f\u0641\u0639 \u0628\u0646\u062c\u0627\u062d</title>
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
  <div class="note">
    <strong>\u0645\u0647\u0645:</strong> \u0627\u0646\u0633\u062e \u0631\u0642\u0645 \u0627\u0644\u0639\u0645\u0644\u064a\u0629 \u0648\u0623\u062f\u062e\u0644\u0647 \u0641\u064a \u062a\u0637\u0628\u064a\u0642 Royal Voyage \u0644\u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u062d\u062c\u0632.<br>
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
