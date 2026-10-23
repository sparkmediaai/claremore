(function () {
  document.documentElement.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  // ---------- Prepare elements for animation ----------

  // Section headlines reveal word by word
  var headings = document.querySelectorAll('.section-head h2, .split-me, .page-hero h1, .contact-intro h1, .cta-band h2, .offer-banner h2, .guarantee h2, main .split h2');
  headings.forEach(splitWords);
  function splitWords(el) {
    if (el.classList.contains('words')) return;
    var i = 0, frag = document.createDocumentFragment();
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          frag.appendChild(wrap(document.createTextNode(part)));
        });
      } else if (node.nodeName === 'BR') {
        frag.appendChild(node);
      } else {
        frag.appendChild(wrap(node));
      }
    });
    function wrap(content) {
      var outer = document.createElement('span'); outer.className = 'sw';
      var inner = document.createElement('span');
      if (content.nodeType === 1 && content.classList.contains('accent')) { inner = content; }
      else inner.appendChild(content);
      inner.style.setProperty('--i', i++);
      outer.appendChild(inner);
      return outer;
    }
    el.textContent = '';
    el.appendChild(frag);
    el.classList.add('words');
    if (el.closest('.page-hero, .contact-intro')) el.style.setProperty('--d', '250ms');
  }

  // Wrap feature images so they can wipe open and drift on scroll
  document.querySelectorAll('.media > img').forEach(function (img) {
    var frame = document.createElement('div'); frame.className = 'media-frame';
    img.parentNode.insertBefore(frame, img); frame.appendChild(img);
  });

  // Numbers that count up when they come into view
  document.querySelectorAll('.result .big, .seal strong, .price-row strong').forEach(function (el) {
    var m = el.textContent.trim().match(/^(\D*)([\d,]+)(.*)$/);
    if (!m) return;
    el.dataset.countTo = m[2].replace(/,/g, '');
    el.dataset.countPre = m[1]; el.dataset.countSuf = m[3];
    el.dataset.countCommas = m[2].indexOf(',') > -1 ? '1' : '';
  });

  // ---------- Scroll reveals ----------
  var targets = document.querySelectorAll('.reveal, .reveal-stagger, .words, .media, .section-head, .timeline, .steps, [data-count-to]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.dataset.countTo) countUp(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('in'); });
  }

  function countUp(el) {
    var to = +el.dataset.countTo, pre = el.dataset.countPre, suf = el.dataset.countSuf, commas = el.dataset.countCommas;
    var start = null, dur = 1800;
    (function tick(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      var v = Math.round(to * (1 - Math.pow(1 - p, 4)));
      el.textContent = pre + (commas ? v.toLocaleString('en-US') : v) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  }

  // ---------- Scroll-linked effects ----------
  var header = document.querySelector('.site-header');
  var bar = document.createElement('div'); bar.className = 'scroll-progress'; document.body.appendChild(bar);
  var frames = document.querySelectorAll('.media-frame img');
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY, docH = document.documentElement.scrollHeight - innerHeight;
    if (header) {
      header.classList.toggle('scrolled', y > 8);
      var navOpen = document.body.classList.contains('nav-open');
      if (!navOpen && y > 400 && y > lastY + 4) header.classList.add('tucked');
      else if (y < lastY - 4 || y < 400) header.classList.remove('tucked');
    }
    bar.style.transform = 'scaleX(' + (docH > 0 ? y / docH : 0) + ')';
    if (!reduceMotion) {
      frames.forEach(function (img) {
        var r = img.parentNode.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        var offset = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        img.style.setProperty('--py', Math.max(-14, Math.min(14, offset * -24)).toFixed(1) + 'px');
      });
    }
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // ---------- Pointer effects (mouse/trackpad only) ----------
  if (finePointer && !reduceMotion) {
    // 3D tilt + spotlight on cards
    document.querySelectorAll('.card, .steps li, .phase, .contact-card, .quote, .result, .post-card, .logo-grid .logo-tile, .price-tier:not(.is-popular), .seat:not(.seat-feature), .why-item, .vs-col').forEach(function (el) {
      if (el.closest('.hero-card')) return;
      var light = document.createElement('span'); light.className = 'spotlight'; el.prepend(light);
      el.classList.add('spot', 'tilt');
      var lift = el.matches('a') ? ' translateY(-6px)' : '';
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--sx', (x * 100) + '%'); el.style.setProperty('--sy', (y * 100) + '%');
        el.classList.add('tilting');
        el.style.transform = 'perspective(900px) rotateX(' + ((.5 - y) * 6).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 7).toFixed(2) + 'deg)' + lift;
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('tilting');
        el.style.transform = '';
      });
    });

    // Magnetic buttons
    document.querySelectorAll('.btn-primary, .btn-light, .btn-ghost').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px');
        btn.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px');
      });
      btn.addEventListener('pointerleave', function () { btn.style.removeProperty('--bx'); btn.style.removeProperty('--by'); });
    });

    // Cyan glow that follows the cursor across dark sections
    document.querySelectorAll('.dark, .offer-banner, .page-hero, .contact-hero, .site-footer, .guarantee').forEach(function (sec) {
      var g = document.createElement('div'); g.className = 'cursor-glow'; sec.prepend(g);
      sec.classList.add('glow-host');
      sec.addEventListener('pointermove', function (e) {
        var r = sec.getBoundingClientRect();
        sec.style.setProperty('--gx', (e.clientX - r.left) + 'px');
        sec.style.setProperty('--gy', (e.clientY - r.top) + 'px');
      });
    });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Homepage hero: count the stats up from zero as the card appears
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduceMotion) {
    counters.forEach(function (el, i) {
      var to = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
      el.textContent = pre + '0' + suf;
      setTimeout(function () {
        var start = null, dur = 1600;
        (function tick(t) {
          if (!start) start = t;
          var p = Math.min((t - start) / dur, 1);
          el.textContent = pre + Math.round(to * (1 - Math.pow(1 - p, 3))) + suf;
          if (p < 1) requestAnimationFrame(tick);
        })(performance.now());
      }, 1000 + i * 120);
    });
  }

  // Homepage hero: background and stats card drift gently with the pointer
  var parallax = document.querySelector('[data-parallax]');
  if (parallax && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    var raf = null;
    parallax.addEventListener('pointermove', function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        var r = parallax.getBoundingClientRect();
        parallax.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5) * 2);
        parallax.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5) * 2);
        raf = null;
      });
    });
    parallax.addEventListener('pointerleave', function () {
      parallax.style.setProperty('--mx', 0);
      parallax.style.setProperty('--my', 0);
    });
  }
  if (reduceMotion) {
    document.querySelectorAll('.hero-chart').forEach(function (svg) { svg.pauseAnimations && svg.pauseAnimations(); });
  }

  // Seat emblem leans toward the pointer
  var emblem = document.querySelector('[data-tilt-emblem]');
  if (emblem && finePointer && !reduceMotion) {
    var hero = emblem.closest('section');
    hero.addEventListener('pointermove', function (e) {
      var r = emblem.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) / innerWidth, y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      emblem.style.setProperty('--ex', (x * 18).toFixed(2) + 'deg');
      emblem.style.setProperty('--ey', (y * -18).toFixed(2) + 'deg');
    });
    hero.addEventListener('pointerleave', function () { emblem.style.setProperty('--ex', '0deg'); emblem.style.setProperty('--ey', '0deg'); });
  }

  // Seat switcher: keep the current seat visible on small screens
  var sw = document.querySelector('.seat-switch-inner'), cur = sw && sw.querySelector('.is-current');
  if (sw && cur) sw.scrollLeft = cur.offsetLeft - (sw.clientWidth - cur.clientWidth) / 2;

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

    // Coming from a pricing card (?package=Executive): note the package in the message
    var pkg = params.get('package'), seat = params.get('seat');
    if (form.elements.message && !form.elements.message.value) {
      if (pkg) form.elements.message.value = 'I’m interested in the ' + pkg + ' package.';
      else if (seat === 'executive team') form.elements.message.value = 'I’m interested in building a fractional executive team.';
      else if (seat) form.elements.message.value = 'I’m interested in a ' + seat + '.';
    }
    if (seat) {
      // Fractional CFO maps to its own chip; the other seats sit under the growth and people services
      var chipFor = { 'Fractional CFO': 'Fractional CFO', 'Fractional COO': 'Fractional CMO & CTO', 'Fractional CMO': 'Fractional CMO & CTO',
                      'Fractional CRO': 'Sales Coaching', 'Fractional CHRO': 'Recruiting & Staffing' }[seat];
      form.querySelectorAll('input[name="services"]').forEach(function (cb) { if (cb.value === chipFor) cb.checked = true; });
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
      package: params.get('package') || '',
      executive_seat: params.get('seat') || '',
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
