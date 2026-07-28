document.querySelectorAll('link[rel="preload"][as="style"][data-swap]').forEach(function (link) {
  link.addEventListener('load', function () {
    link.rel = 'stylesheet';
  });
});
