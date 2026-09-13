/* Meli's launch list. Plain JavaScript, no build step, no libraries. */

/* CONFIG. Orgesa: replace the 5 values marked HERE with your Google Form details.
   The steps are in README.md. Until they are filled in, every visitor gets the WhatsApp button. */
var CONFIG = {
  FORM_ID: "FORM_ID_HERE",
  ENTRY_NAME: "ENTRY_ID_HERE",
  ENTRY_EMAIL: "ENTRY_ID_HERE",
  ENTRY_PHONE: "ENTRY_ID_HERE",
  ENTRY_AREA: "ENTRY_ID_HERE",
  WHATSAPP: "447414962803"
};

(function () {
  "use strict";

  window.melisReady = true;

  var STORE_KEY = "melis_leads";
  var FIELDS = ["name", "email", "phone", "area"];
  var root = document.documentElement;
  var reduceMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  function byId(id) { return document.getElementById(id); }
  function clean(v) { return String(v == null ? "" : v).trim(); }

  /* Google Form settings. Accepts the bare code, or a whole pasted link. */

  function formId() {
    var raw = clean(CONFIG.FORM_ID);
    var m = raw.match(/\/d\/e\/([A-Za-z0-9_-]+)/);
    if (m) { raw = m[1]; }
    if (raw.indexOf("HERE") > -1) { return ""; }
    return /^[A-Za-z0-9_-]{25,}$/.test(raw) ? raw : "";
  }

  function entryId(v) {
    var m = clean(v).match(/(\d{5,})/);
    return m ? m[1] : "";
  }

  function entryIds() {
    return [CONFIG.ENTRY_NAME, CONFIG.ENTRY_EMAIL, CONFIG.ENTRY_PHONE, CONFIG.ENTRY_AREA].map(entryId);
  }

  function formReady() {
    if (formId() === "") { return false; }
    var ids = entryIds();
    var filled = ids.filter(function (id) { return id.length > 0; });
    var unique = ids.filter(function (id, i) { return ids.indexOf(id) === i; });
    return filled.length === 4 && unique.length === 4;
  }

  /* Every submission is mirrored on the device, so nothing typed is lost. */

  function loadLeads() {
    try {
      var list = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveLeads(list) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(list));
    } catch (e) {
      /* Storage can be blocked in some private browsing modes. The form still works. */
    }
  }

  function addLead(data) {
    var lead = {
      id: String(Date.now()),
      saved: new Date().toISOString(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      area: data.area,
      status: "Saving"
    };
    var list = loadLeads();
    list.push(lead);
    saveLeads(list);
    return lead;
  }

  function setStatus(id, status) {
    var list = loadLeads();
    list.forEach(function (lead) {
      if (lead.id === id) { lead.status = status; }
    });
    saveLeads(list);
  }

  /* WhatsApp */

  function waUrl(text) {
    return "https://wa.me/" + CONFIG.WHATSAPP + "?text=" + encodeURIComponent(text);
  }

  function waText(data) {
    return "Hello Meli’s. Please add me to the launch list.\n\n" +
      "Name: " + data.name + "\n" +
      "Email: " + data.email + "\n" +
      "Phone: " + data.phone + "\n" +
      "Area: " + data.area;
  }

  /* Validation */

  var RULES = {
    name: function (v) {
      if (v.length === 0) { return "Please enter your name."; }
      if (v.length < 2) { return "Please enter your full name."; }
      return "";
    },
    email: function (v) {
      if (v.length === 0) { return "Please enter your email."; }
      if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) === false) { return "Please check your email address."; }
      return "";
    },
    phone: function (v) {
      if (v.length === 0) { return "Please enter your phone number."; }
      var digits = v.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15 || /[^\d\s()+.\-]/.test(v)) { return "Please check your phone number."; }
      return "";
    },
    area: function (v) {
      if (v.length === 0) { return "Please tell us your area."; }
      return "";
    }
  };

  var form = byId("interest-form");
  var submitBtn = byId("submit");
  var success = byId("success");
  var fallback = byId("fallback");
  var waLink = byId("wa-link");
  var firstNameEl = byId("first-name");
  var inputs = {};
  var errors = {};
  var touched = {};
  var busy = false;
  var done = false;

  function showError(f, msg) {
    var wrap = inputs[f].parentNode;
    if (msg) {
      wrap.classList.add("has-error");
      inputs[f].setAttribute("aria-invalid", "true");
      errors[f].textContent = msg;
    } else {
      wrap.classList.remove("has-error");
      inputs[f].removeAttribute("aria-invalid");
      errors[f].textContent = "";
    }
  }

  function check(f) {
    var msg = RULES[f](clean(inputs[f].value));
    showError(f, msg);
    return msg === "";
  }

  FIELDS.forEach(function (f, i) {
    inputs[f] = byId("f-" + f);
    errors[f] = byId("e-" + f);
    touched[f] = false;

    inputs[f].addEventListener("blur", function () {
      if (clean(inputs[f].value).length > 0) { touched[f] = true; }
      if (touched[f]) { check(f); }
    });

    inputs[f].addEventListener("input", function () {
      if (inputs[f].parentNode.classList.contains("has-error") && RULES[f](clean(inputs[f].value)) === "") {
        showError(f, "");
      }
    });

    inputs[f].addEventListener("keydown", function (e) {
      if (e.key === "Enter" && i < FIELDS.length - 1) {
        e.preventDefault();
        inputs[FIELDS[i + 1]].focus();
      }
    });
  });

  function readForm() {
    return {
      name: clean(inputs.name.value),
      email: clean(inputs.email.value),
      phone: clean(inputs.phone.value),
      area: clean(inputs.area.value)
    };
  }

  /* Send to Google Forms. Resolves true if the request went out, false if it failed or is not set up. */

  function send(data) {
    try {
      if (formReady() === false) { return Promise.resolve(false); }
      if (navigator.onLine === false) { return Promise.resolve(false); }
      var ids = entryIds();
      var body = new URLSearchParams();
      body.append("entry." + ids[0], data.name);
      body.append("entry." + ids[1], data.email);
      body.append("entry." + ids[2], data.phone);
      body.append("entry." + ids[3], data.area);
      var url = "https://docs.google.com/forms/d/e/" + formId() + "/formResponse";
      var post = fetch(url, { method: "POST", mode: "no-cors", body: body }).then(
        function () { return true; },
        function () { return false; }
      );
      var timeout = new Promise(function (resolve) {
        setTimeout(function () { resolve(false); }, 9000);
      });
      return Promise.race([post, timeout]);
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  function firstName(full) {
    var word = clean(full).split(/\s+/)[0] || "";
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  /* Jump, rather than glide, so the thank-you panel is always in view even if smooth scrolling stalls. */
  function bringIntoView(el) {
    var rect = el.getBoundingClientRect();
    if (rect.top >= 0 && rect.top <= window.innerHeight * 0.5) { return; }
    var y = Math.max(0, (window.pageYOffset || 0) + rect.top - Math.max(16, (window.innerHeight - rect.height) / 2));
    try {
      window.scrollTo({ top: y, behavior: "instant" });
    } catch (e) {
      window.scrollTo(0, y);
    }
  }

  function showSuccess(data, sent) {
    firstNameEl.textContent = firstName(data.name);
    fallback.hidden = sent;
    if (sent === false) { waLink.href = waUrl(waText(data)); }
    done = true;
    updateDock();

    if (document.activeElement && document.activeElement.blur) { document.activeElement.blur(); }

    function swap() {
      form.hidden = true;
      form.classList.remove("is-leaving");
      success.hidden = false;
      success.classList.remove("is-showing");
      void success.offsetWidth;
      success.classList.add("is-showing");
      busy = false;
      submitBtn.classList.remove("is-busy");
      submitBtn.removeAttribute("aria-busy");
      try { success.focus({ preventScroll: true }); } catch (e) { success.focus(); }
      bringIntoView(success);
    }

    if (reduceMotion) {
      swap();
    } else {
      form.classList.add("is-leaving");
      setTimeout(swap, 280);
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) { return; }

    var firstBad = "";
    FIELDS.forEach(function (f) {
      touched[f] = true;
      if (check(f) === false && firstBad === "") { firstBad = f; }
    });
    if (firstBad) {
      inputs[firstBad].focus();
      return;
    }

    var data = readForm();
    busy = true;
    submitBtn.classList.add("is-busy");
    submitBtn.setAttribute("aria-busy", "true");

    var lead = addLead(data);
    send(data).then(function (sent) {
      setStatus(lead.id, sent ? "Sent to Google Form" : "Not sent to Google Form, WhatsApp button shown");
      showSuccess(data, sent);
    });
  });

  byId("again").addEventListener("click", function () {
    form.reset();
    FIELDS.forEach(function (f) {
      touched[f] = false;
      showError(f, "");
    });
    success.hidden = true;
    success.classList.remove("is-showing");
    fallback.hidden = true;
    form.hidden = false;
    done = false;
    updateDock();
    inputs.name.focus();
  });

  /* How it works: reveal the steps and draw the line when they scroll into view. */

  var steps = byId("steps");
  if ("IntersectionObserver" in window) {
    var stepWatch = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          steps.classList.add("is-in");
          stepWatch.disconnect();
        }
      });
    }, { threshold: 0.25 });
    stepWatch.observe(steps);
  } else {
    steps.classList.add("is-in");
  }

  /* Sticky button on phones: shows once the hero button has scrolled away, hides at the form. */

  var dock = byId("dock");
  var heroGone = false;
  var registerInView = false;

  function updateDock() {
    var on = heroGone && registerInView === false && done === false && root.classList.contains("view-leads") === false;
    dock.classList.toggle("is-on", on);
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        heroGone = entry.isIntersecting === false && entry.boundingClientRect.top < 0;
      });
      updateDock();
    }).observe(byId("hero-cta"));

    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        registerInView = entry.isIntersecting;
      });
      updateDock();
    }, { rootMargin: "0px 0px -12% 0px" }).observe(byId("register"));
  }

  /* Hidden route at #leads lists everything saved on this device. */

  var leadsView = byId("leads");

  function when(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) { return ""; }
    return d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function leadText(lead) {
    return [
      lead.name,
      lead.email,
      lead.phone,
      lead.area,
      "Saved " + when(lead.saved) + ". " + (lead.status || "")
    ].join("\n");
  }

  function renderLeads() {
    var list = loadLeads().slice().reverse();
    var ol = byId("leads-list");
    var count = list.length;

    byId("leads-count").textContent = count === 0 ? "Nothing saved on this phone yet." :
      (count === 1 ? "1 registration saved on this phone." : count + " registrations saved on this phone.");

    ol.textContent = "";
    list.forEach(function (lead) {
      var li = document.createElement("li");
      var name = document.createElement("strong");
      name.textContent = lead.name || "";
      li.appendChild(name);
      [lead.email, lead.phone, lead.area].forEach(function (value) {
        var line = document.createElement("span");
        line.style.display = "block";
        line.textContent = value || "";
        li.appendChild(line);
      });
      var meta = document.createElement("span");
      meta.className = "leads-meta";
      meta.textContent = "Saved " + when(lead.saved) + ". " + (lead.status || "");
      li.appendChild(meta);
      ol.appendChild(li);
    });

    var text = list.map(leadText).join("\n\n");
    byId("leads-raw").value = text;
    byId("leads-wa").href = waUrl("Meli’s launch list, saved on my phone.\n\n" + text);
    leadsView.classList.toggle("is-empty", count === 0);
  }

  byId("leads-copy").addEventListener("click", function () {
    var btn = this;
    var raw = byId("leads-raw");
    function copied() {
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = "Copy all"; }, 2000);
    }
    function manual() {
      raw.focus();
      raw.select();
      try { document.execCommand("copy"); } catch (e) { /* the text stays selected for a manual copy */ }
      copied();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(raw.value).then(copied, manual);
    } else {
      manual();
    }
  });

  function route() {
    var isLeads = window.location.hash === "#leads";
    root.classList.toggle("view-leads", isLeads);
    leadsView.hidden = isLeads === false;
    if (isLeads) {
      renderLeads();
      window.scrollTo(0, 0);
    }
    updateDock();
  }

  window.addEventListener("hashchange", route);
  route();
})();
