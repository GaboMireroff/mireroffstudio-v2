(function () {
  'use strict';

  function pushDL(data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  }

  // Mini CRM (Supabase) -- chave publicável/anon, segura de expor no frontend:
  // a tabela "leads" só aceita INSERT para essa chave (RLS), nunca leitura.
  var SUPABASE_URL = 'https://pytuifwlcwswigzdrnsn.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_a87W2-94MAnQTw_DcQsJog_Bar0mkLX';
  var supabaseClient = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  function getUTMs() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term')
    };
  }

  function mapBoolean(value, trueValue, falseValue) {
    if (value === trueValue) return true;
    if (value === falseValue) return false;
    return null;
  }

  // "acesso_dados" e uma unica pergunta combinada (Sim/Parcialmente/Nao) na
  // landing, mas o schema do CRM guarda custo/estoque/vendas separados --
  // aplica a mesma resposta aos tres; "Parcialmente" fica null (nao concede
  // pontuacao cheia nem nega, o trigger de score exige as tres = true).
  function saveLead(fields) {
    if (!supabaseClient) return;
    var utms = getUTMs();
    var acessoBool = mapBoolean(fields.acesso_dados, 'Sim', 'Não');

    supabaseClient.from('leads').insert({
      nome: fields.nome,
      empresa: fields.empresa,
      whatsapp: fields.whatsapp,
      email: fields.email || null,
      cidade: fields.cidade,
      segmento: fields.segmento,
      faturamento_mensal: fields.faturamento,
      investimento_ads: fields.investimento,
      possui_erp: mapBoolean(fields.erp, 'Sim', 'Não'),
      acessa_custo: acessoBool,
      acessa_estoque: acessoBool,
      acessa_vendas: acessoBool,
      principal_problema: fields.problema,
      objetivo_90_dias: fields.objetivo || null,
      utm_source: utms.utm_source,
      utm_medium: utms.utm_medium,
      utm_campaign: utms.utm_campaign,
      utm_content: utms.utm_content,
      utm_term: utms.utm_term,
      landing_page: window.location.pathname,
      referrer: document.referrer || null
    }).then(function (res) {
      if (res.error) console.error('Falha ao salvar lead no CRM:', res.error);
    });
    // Falha aqui nao trava o fluxo do usuario -- o WhatsApp continua
    // funcionando como canal de contato mesmo se o CRM falhar.
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
      var whatsapp = get('whatsapp');
      var email = get('email');
      var segmento = get('segmento');
      var cidade = get('cidade');
      var faturamento = get('faturamento');
      var investimento = get('investimento');
      var erp = get('erp');
      var acessoDados = get('acesso_dados');
      var problema = get('problema');
      var objetivo = get('objetivo');

      pushDL({
        event: 'lead_analise_operacional',
        lead_segmento: segmento,
        lead_cidade: cidade,
        lead_faturamento: faturamento,
        lead_problema: problema
      });

      saveLead({
        nome: nome,
        empresa: empresa,
        whatsapp: whatsapp,
        email: email,
        segmento: segmento,
        cidade: cidade,
        faturamento: faturamento,
        investimento: investimento,
        erp: erp,
        acesso_dados: acessoDados,
        problema: problema,
        objetivo: objetivo
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
