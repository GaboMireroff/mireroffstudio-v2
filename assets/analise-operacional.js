(function () {
  'use strict';

  function pushDL(data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  }

  function firstInvalid(list) {
    for (var i = 0; i < list.length; i++) {
      if (!list[i].checkValidity()) return list[i];
    }
    return null;
  }

  // Menu mobile (hamburguer)
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  // Formulário em duas etapas
  var step1 = document.getElementById('form-step-1');
  var step2 = document.getElementById('form-step-2');
  var form = document.getElementById('form-analise');
  var btnAvancar = document.getElementById('btn-avancar');
  var btnVoltar = document.getElementById('btn-voltar');
  var formWrap = document.getElementById('form-wrap');
  var confirmBox = document.getElementById('form-confirmacao');
  var waLinkEl = document.getElementById('wa-confirmacao-link');

  var stepsIndicator = document.querySelectorAll('.steps-indicator span');

  function setActiveStep(index) {
    stepsIndicator.forEach(function (el, i) {
      el.classList.toggle('active', i <= index);
    });
  }

  function goToStep2() {
    var required = step1.querySelectorAll('[required]');
    var invalid = firstInvalid(required);
    if (invalid) {
      invalid.reportValidity();
      invalid.focus();
      return false;
    }
    step1.hidden = true;
    step2.hidden = false;
    setActiveStep(1);
    pushDL({ event: 'form_step2_analise_operacional' });
    var firstField = step2.querySelector('input, select, textarea');
    if (firstField) firstField.focus();
    if (formWrap) {
      var top = formWrap.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
    return true;
  }

  if (btnAvancar && step1 && step2) {
    btnAvancar.addEventListener('click', goToStep2);
  }

  // Enter no teclado dentro da etapa 1 avança em vez de tentar submeter o form
  if (step1) {
    step1.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        goToStep2();
      }
    });
  }

  if (btnVoltar && step1 && step2) {
    btnVoltar.addEventListener('click', function () {
      step2.hidden = true;
      step1.hidden = false;
      setActiveStep(0);
      var firstField = step1.querySelector('input, select, textarea');
      if (firstField) firstField.focus();
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Submissão implícita (Enter) disparada enquanto a etapa 1 ainda está visível:
      // avança para a etapa 2 em vez de validar campos que o usuário ainda não viu.
      if (step2.hidden) {
        goToStep2();
        return;
      }

      var required2 = step2.querySelectorAll('[required]');
      var invalid2 = firstInvalid(required2);
      if (invalid2) {
        invalid2.reportValidity();
        invalid2.focus();
        return;
      }

      var data = new FormData(form);
      var get = function (k) { return (data.get(k) || '').toString().trim(); };

      var nome = get('nome');
      var empresa = get('empresa');
      var segmento = get('segmento');
      var cidade = get('cidade');
      var faturamento = get('faturamento');
      var investimento = get('investimento');
      var problema = get('problema');
      var objetivo = get('objetivo');

      pushDL({
        event: 'lead_analise_operacional',
        lead_segmento: segmento,
        lead_cidade: cidade,
        lead_faturamento: faturamento,
        lead_problema: problema
      });

      var msg = 'Oi! Sou ' + nome + ', da ' + empresa + ' (' + segmento + ', ' + cidade + '). ' +
        'Preenchi o formulário de Análise Operacional (MIRA) e quero entender onde vale colocar dinheiro na minha operação. ' +
        'Faturamento mensal: ' + faturamento + '. Investimento atual em anúncios: ' + investimento + '. ' +
        'Principal problema hoje: ' + problema + '.' +
        (objetivo ? ' Objetivo para os próximos 90 dias: ' + objetivo + '.' : '');

      var waLink = 'https://wa.me/5599981008588?text=' + encodeURIComponent(msg);
      if (waLinkEl) waLinkEl.setAttribute('href', waLink);

      if (formWrap) formWrap.hidden = true;
      if (confirmBox) {
        confirmBox.hidden = false;
        confirmBox.setAttribute('tabindex', '-1');
        confirmBox.focus();
      }
    });
  }
})();
