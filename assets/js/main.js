(function () {
  document.documentElement.classList.add('js');

  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  // Header shadow once the page scrolls
  var header = document.querySelector('.site-header');
  function onScroll() { header && header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Fade sections in as they scroll into view
  var els = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  // Lead form: posts to the CRM webhook (GoHighLevel) when one is configured,
  // otherwise opens the visitor's email app with everything filled in.
  var form = document.getElementById('lead-form');
  if (form) initLeadForm(form);

  function initLeadForm(form) {
    var params = new URLSearchParams(location.search);

    // Preselect a service when linked from a service page (?interest=Tax%20Strategy)
    var want = (params.get('interest') || '').toLowerCase();
    if (want) {
      form.querySelectorAll('input[name="services"]').forEach(function (cb) {
        if (cb.value.toLowerCase().indexOf(want) === 0) cb.checked = true;
      });
    }

    // Clear an error as soon as the visitor fixes the field
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field');
      if (f && e.target.checkValidity()) f.classList.remove('invalid');
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var errorEl = form.querySelector('.form-error');
      errorEl.hidden = true;

      // Validate required fields and highlight the ones that need attention
      var firstBad = null;
      form.querySelectorAll('[required]').forEach(function (input) {
        var ok = input.checkValidity();
        input.closest('.field').classList.toggle('invalid', !ok);
        if (!ok && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }

      var data = collect(form, params);
      if (form.elements.website.value) { showSuccess(form, data); return; } // spam trap filled: pretend it worked

      var webhook = form.dataset.webhook;
      if (!webhook) {
        openEmail(form.dataset.fallbackEmail, data);
        showSuccess(form, data, 'Your email app should open with your request ready to send. Just hit send, and we’ll be in touch to schedule your consultation.');
        return;
      }

      form.classList.add('is-sending');
      send(webhook, data)
        .then(function () { showSuccess(form, data); })
        .catch(function () { errorEl.hidden = false; })
        .then(function () { form.classList.remove('is-sending'); });
    });
  }

  function collect(form, params) {
    var f = form.elements;
    var services = Array.prototype.filter.call(form.querySelectorAll('input[name="services"]'), function (c) { return c.checked; })
      .map(function (c) { return c.value; });
    return {
      first_name: f.first_name.value.trim(),
      last_name: f.last_name.value.trim(),
      full_name: (f.first_name.value + ' ' + f.last_name.value).trim(),
      email: f.email.value.trim(),
      phone: f.phone.value.trim(),
      company_name: f.company_name.value.trim(),
      annual_revenue: f.annual_revenue.value,
      services: services.join(', '),
      message: f.message.value.trim(),
      sms_consent: f.sms_consent.checked ? 'yes' : 'no',
      source: 'Website contact form',
      page_url: location.href,
      referrer: document.referrer,
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_term: params.get('utm_term') || '',
      utm_content: params.get('utm_content') || '',
      submitted_at: new Date().toISOString()
    };
  }

  // Try a normal JSON POST first. If the browser blocks it (CORS), resend as a
  // simple form post, which webhooks accept without CORS headers.
  function send(url, data) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
    }, function () {
      return fetch(url, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) });
    });
  }

  function openEmail(to, d) {
    var subject = 'Consultation request' + (d.full_name ? ' from ' + d.full_name : '') + (d.services ? ' – ' + d.services : '');
    var lines = [d.message, '', d.full_name, d.company_name, d.email, d.phone,
      d.services ? 'Interested in: ' + d.services : '', d.annual_revenue ? 'Annual revenue: ' + d.annual_revenue : ''];
    location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.filter(function (l, i) { return l || i < 2; }).join('\n'));
  }

  function showSuccess(form, data, text) {
    var box = document.getElementById('form-success');
    box.querySelector('[data-success-name]').textContent = data.first_name ? ', ' + data.first_name : '';
    if (text) box.querySelector('[data-success-text]').textContent = text;
    form.hidden = true;
    box.hidden = false;
    box.focus();
  }
})();
