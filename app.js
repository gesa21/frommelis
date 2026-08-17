/* Meli's. Everything on the page renders from menu.json. */

(function () {
  'use strict';

  document.body.classList.add('js');

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var params = new URLSearchParams(window.location.search);
  if (params.get('motion') === 'off') reducedMotion = true;
  var hasGsap = typeof window.gsap !== 'undefined';
  var animate = hasGsap && (reducedMotion === false);
  if (reducedMotion) document.body.classList.add('no-motion');
  if (hasGsap === false) document.body.classList.add('no-gsap');
  if (animate && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  var WHATSAPP = 'https://wa.me/447414962803';

  /* Europe/London time, whatever timezone the phone is in. */

  function londonOffsetMinutes(epochMs) {
    var dtf = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    var map = {};
    dtf.formatToParts(new Date(epochMs)).forEach(function (p) { map[p.type] = p.value; });
    var asUTC = Date.UTC(+map.year, +map.month - 1, +map.day, (+map.hour) % 24, +map.minute);
    return (asUTC - epochMs) / 60000;
  }

  function londonEpoch(iso) {
    if (/Z$|[+-]\d\d:\d\d$/.test(iso)) return Date.parse(iso);
    var parts = iso.split('T');
    var d = parts[0].split('-').map(Number);
    var t = (parts[1] || '00:00').split(':').map(Number);
    var guess = Date.UTC(d[0], d[1] - 1, d[2], t[0], t[1] || 0);
    var epoch = guess - londonOffsetMinutes(guess) * 60000;
    var check = londonOffsetMinutes(epoch);
    return guess - check * 60000;
  }

  function londonFormat(epochMs, opts) {
    opts.timeZone = 'Europe/London';
    return new Intl.DateTimeFormat('en-GB', opts).format(new Date(epochMs));
  }

  /* Live bar */

  function startLivebar(config) {
    var bar = document.getElementById('livebar');
    var label = document.getElementById('livebar-label');
    var count = document.getElementById('livebar-count');
    var delivery = document.getElementById('livebar-delivery');

    var closeIso = params.get('close') || config.orders_close;
    var closeAt = londonEpoch(closeIso);
    var closeDay = londonFormat(closeAt, { weekday: 'long' });
    var closeTime = londonFormat(closeAt, { hour: '2-digit', minute: '2-digit' });

    if (config.delivery_date) {
      var deliveryAt = londonEpoch(config.delivery_date + 'T12:00');
      delivery.textContent = 'Delivery ' + londonFormat(deliveryAt, { weekday: 'long', day: 'numeric', month: 'long' });
    }

    function slotsText() {
      if (typeof config.slots_left === 'number' && typeof config.slots_total === 'number') {
        return config.slots_left + ' of ' + config.slots_total + ' slots left. ';
      }
      return '';
    }

    function tick() {
      var left = closeAt - Date.now();
      if (left <= 0) {
        bar.classList.add('closed');
        label.textContent = 'Orders closed. New menu Thursday.';
        count.textContent = '';
        delivery.textContent = '';
        return false;
      }
      var mins = Math.floor(left / 60000);
      var days = Math.floor(mins / 1440);
      var hrs = Math.floor((mins % 1440) / 60);
      var m = mins % 60;
      var t = '';
      var hrWord = (hrs === 1 ? ' hr' : ' hrs');
      if (days > 0) t = days + (days === 1 ? ' day ' : ' days ') + hrs + hrWord;
      else if (hrs > 0) t = hrs + hrWord + ' ' + m + ' min';
      else t = m + ' min';
      label.textContent = 'Orders close ' + closeDay + ' ' + closeTime;
      count.textContent = slotsText() + t + ' to go';
      return true;
    }

    if (tick()) {
      var timer = setInterval(function () {
        if (tick() === false) clearInterval(timer);
      }, 30000);
    }
  }

  /* Photos: real photos drop in when the files exist, illustrations hold the space until then. */

  function tryPhoto(containerId, src, alt, eager) {
    var el = document.getElementById(containerId);
    if (el === null) return;
    var img = new Image();
    img.onload = function () {
      img.alt = alt;
      if (eager !== true) img.loading = 'lazy';
      el.innerHTML = '';
      el.appendChild(img);
      el.removeAttribute('aria-hidden');
    };
    img.src = src;
  }

  /* Menu */

  var SECTIONS = [
    { key: 'mains', title: 'Mains', note: 'Every main is also available as a kids portion.' },
    { key: 'kids', title: 'Kids', note: "5 vegetables in every kids' dish. None of them visible." },
    { key: 'pizza', title: 'Pizza', note: 'Par-baked base. You finish it in your own oven.' },
    { key: 'pudding', title: 'Pudding', note: '' },
    { key: 'breakfast', title: 'Breakfast', note: '' }
  ];

  function priceText(value) {
    if (typeof value === 'number') return '\u00a3' + (value % 1 === 0 ? value.toFixed(0) : value.toFixed(2));
    return null;
  }

  function renderDish(dish, config) {
    var card = document.createElement('article');
    card.className = 'dish' + (dish.sold_out ? ' soldout' : '');
    card.id = 'dish-' + dish.id;

    var head = document.createElement('button');
    head.className = 'dish-head';
    head.setAttribute('aria-expanded', 'false');

    var name = document.createElement('span');
    name.className = 'dish-name';
    name.textContent = dish.name;
    head.appendChild(name);

    var price = document.createElement('span');
    var p = priceText(dish.price);
    if (p === null) {
      price.className = 'dish-price tbc';
      price.textContent = "price on Thursday's menu";
    } else {
      price.className = 'dish-price';
      price.textContent = p;
    }
    head.appendChild(price);
    card.appendChild(head);

    if (dish.sold_out) {
      var stamp = document.createElement('span');
      stamp.className = 'stamp';
      stamp.textContent = 'Sold out';
      card.appendChild(stamp);
    }

    var body = document.createElement('div');
    body.className = 'dish-body';

    if (dish.photo) {
      var ph = document.createElement('div');
      ph.className = 'dish-photo';
      ph.id = 'photo-' + dish.id;
      body.appendChild(ph);
    }

    var desc = document.createElement('p');
    desc.className = 'dish-desc';
    desc.textContent = dish.description;
    body.appendChild(desc);

    var meta = document.createElement('p');
    meta.className = 'dish-meta';
    meta.textContent = (dish.allergens && dish.allergens.length > 0)
      ? 'Allergens: ' + dish.allergens.join(', ')
      : 'No major allergens in the recipe. Full list on the tub.';
    body.appendChild(meta);

    if (dish.kids_portion && dish.section === 'mains') {
      var kids = document.createElement('p');
      kids.className = 'dish-kids';
      var kp = priceText(config.kids_portion_price);
      kids.textContent = kp ? 'Also as a kids portion, ' + kp : 'Also as a kids portion';
      body.appendChild(kids);
    }

    card.appendChild(body);

    head.addEventListener('click', function () {
      var open = card.classList.toggle('open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && dish.photo) tryPhoto('photo-' + dish.id, dish.photo, dish.name);
    });

    return card;
  }

  function renderMenu(config) {
    var wrap = document.getElementById('menu-groups');
    document.getElementById('week-label').textContent = config.week_label || '';

    SECTIONS.forEach(function (section) {
      var dishes = config.dishes.filter(function (d) { return d.section === section.key; });
      if (dishes.length === 0) return;

      var group = document.createElement('div');
      group.className = 'menu-group';

      var h3 = document.createElement('h3');
      h3.className = 'menu-group-h3';
      h3.textContent = section.title;
      group.appendChild(h3);

      if (section.note) {
        var note = document.createElement('p');
        note.className = 'menu-group-note';
        note.textContent = section.note;
        group.appendChild(note);
      }

      var grid = document.createElement('div');
      grid.className = 'menu-grid';
      dishes.forEach(function (d) { grid.appendChild(renderDish(d, config)); });
      group.appendChild(grid);
      wrap.appendChild(group);
    });
  }

  function renderBoxes(config) {
    var grid = document.getElementById('boxes-grid');
    (config.boxes || []).forEach(function (box) {
      var el = document.createElement('div');
      el.className = 'box';

      if (box.tag) {
        var tag = document.createElement('span');
        tag.className = 'box-tag';
        tag.textContent = box.tag;
        el.appendChild(tag);
      }

      var name = document.createElement('h4');
      name.className = 'box-name';
      name.textContent = box.name;
      el.appendChild(name);

      var contents = document.createElement('p');
      contents.className = 'box-contents';
      contents.textContent = box.contents;
      el.appendChild(contents);

      var price = document.createElement('p');
      price.className = 'box-price';
      var p = priceText(box.price);
      if (p === null) {
        var span = document.createElement('span');
        span.className = 'tbc-note';
        span.textContent = "price on Thursday's menu";
        price.appendChild(span);
      } else {
        price.textContent = p;
      }
      el.appendChild(price);

      var btn = document.createElement('a');
      btn.className = 'btn btn-order';
      var hasStripe = box.stripe_url && box.stripe_url.indexOf('STRIPE_LINK_HERE') === -1;
      if (hasStripe) {
        btn.href = box.stripe_url;
        btn.textContent = 'Order the ' + box.name;
      } else {
        btn.href = WHATSAPP + '?text=' + encodeURIComponent("Hello Meli's, I would like the " + box.name + '.');
        btn.textContent = 'Order the ' + box.name + ' on WhatsApp';
      }
      el.appendChild(btn);

      grid.appendChild(el);
    });
  }

  /* Hidden veg reveal */

  function initVeg() {
    var bowl = document.getElementById('veg-bowl');
    var stage = bowl.closest('.veg-stage');
    var line = document.getElementById('veg-line');
    var revealed = false;

    bowl.addEventListener('click', function () {
      if (revealed) return;
      revealed = true;
      bowl.setAttribute('aria-expanded', 'true');
      if (animate) {
        gsap.to('.veg', {
          opacity: 1, y: 0, scale: 1,
          duration: 0.55, stagger: 0.13, ease: 'back.out(2.4)',
          onComplete: function () { line.classList.add('shown'); }
        });
      } else {
        stage.classList.add('revealed');
        line.classList.add('shown');
      }
    });
  }

  /* Your week */

  function initWeek() {
    var freezer = document.getElementById('freezer');
    document.querySelectorAll('.day').forEach(function (day) {
      day.addEventListener('click', function () {
        var stocked = day.classList.contains('stocked');
        if (stocked) {
          day.classList.remove('stocked');
          day.setAttribute('aria-pressed', 'false');
          return;
        }
        if (animate) {
          var from = freezer.getBoundingClientRect();
          var to = day.getBoundingClientRect();
          var fly = document.createElement('div');
          fly.className = 'meal-fly';
          fly.style.left = (from.left + from.width / 2 - 17) + 'px';
          fly.style.top = (from.top + from.height / 2 - 12) + 'px';
          document.body.appendChild(fly);
          gsap.to(fly, {
            x: to.left + to.width / 2 - (from.left + from.width / 2),
            y: to.top + to.height / 2 - (from.top + from.height / 2),
            duration: 0.55, ease: 'power2.inOut',
            onComplete: function () {
              fly.remove();
              day.classList.add('stocked');
              day.setAttribute('aria-pressed', 'true');
            }
          });
        } else {
          day.classList.add('stocked');
          day.setAttribute('aria-pressed', 'true');
        }
      });
    });
  }

  /* Scroll motion, all gated behind prefers-reduced-motion. */

  function initScrollMotion() {
    if (animate === false) return;

    gsap.from('.hero-h1', { y: 26, opacity: 0, duration: 0.9, ease: 'power2.out' });
    gsap.from('.hero-sub, .hero-line, .hero-cta', {
      y: 16, opacity: 0, duration: 0.7, stagger: 0.12, delay: 0.25, ease: 'power2.out'
    });

    if (window.ScrollTrigger) {
      document.querySelectorAll('.stamp').forEach(function (stamp) {
        gsap.from(stamp, {
          rotation: -24, scale: 1.5, opacity: 0, duration: 0.5, ease: 'back.out(1.8)',
          scrollTrigger: { trigger: stamp, start: 'top 85%' }
        });
      });

      var path = document.getElementById('how-path');
      if (path) {
        var len = path.getTotalLength();
        gsap.fromTo(path,
          { strokeDasharray: len, strokeDashoffset: len },
          {
            strokeDashoffset: 0,
            scrollTrigger: { trigger: '.how-wrap', start: 'top 75%', end: 'bottom 65%', scrub: true }
          });
      }
    }
  }

  /* Boot */

  tryPhoto('hero-visual', 'photos/hero.webp', 'A Meli\u2019s dish, cooked this weekend', true);
  tryPhoto('story-photo', 'photos/olsi.webp', 'Olsi in the kitchen');
  initVeg();
  initWeek();
  initScrollMotion();

  fetch('menu.json')
    .then(function (r) { return r.json(); })
    .then(function (config) {
      renderMenu(config);
      renderBoxes(config);
      startLivebar(config);
      if (animate && window.ScrollTrigger) {
        document.querySelectorAll('.stamp').forEach(function (stamp) {
          gsap.from(stamp, {
            rotation: -24, scale: 1.5, opacity: 0, duration: 0.5, ease: 'back.out(1.8)',
            scrollTrigger: { trigger: stamp, start: 'top 88%' }
          });
        });
        ScrollTrigger.refresh();
      }
    })
    .catch(function () {
      document.getElementById('week-label').textContent = 'The menu could not load. Message us on WhatsApp for this week.';
    });
})();
