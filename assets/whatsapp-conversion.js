document.addEventListener('click', function (e) {
  var link = e.target.closest('a[data-cta]');
  if (!link) return;
  window.dataLayer = window.dataLayer || [];
  dataLayer.push({
    event: 'whatsapp_click',
    value: 1.0,
    currency: 'BRL'
  });
});
