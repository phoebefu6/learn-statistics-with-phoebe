/* learn-claude-with-phoebe - shared page behavior
   Accordions (expand/collapse all), copy-to-clipboard prompt boxes,
   lightbox zoom for figures, projector font-scale toggle. */

(function () {
  "use strict";

  /* ----- expand / collapse all accordions ----- */
  var toggleAllBtn = document.getElementById("toggle-all");
  if (toggleAllBtn) {
    toggleAllBtn.addEventListener("click", function () {
      var cards = document.querySelectorAll("details.card");
      var anyClosed = Array.prototype.some.call(cards, function (d) { return !d.open; });
      cards.forEach(function (d) { d.open = anyClosed; });
      toggleAllBtn.textContent = anyClosed ? "Collapse all" : "Expand all";
    });
  }

  /* ----- projector zoom: 100% -> 125% -> 150% -> 100% ----- */
  var zoomBtn = document.getElementById("zoom-toggle");
  var zoomLevels = ["", "zoom-125", "zoom-150"];
  var zoomLabels = ["Projector zoom: off", "Projector zoom: 125%", "Projector zoom: 150%"];
  var zoomIdx = 0;
  if (zoomBtn) {
    zoomBtn.addEventListener("click", function () {
      document.documentElement.classList.remove("zoom-125", "zoom-150");
      zoomIdx = (zoomIdx + 1) % zoomLevels.length;
      if (zoomLevels[zoomIdx]) document.documentElement.classList.add(zoomLevels[zoomIdx]);
      zoomBtn.textContent = zoomLabels[zoomIdx];
    });
  }

  /* ----- copy buttons on prompt boxes ----- */
  document.querySelectorAll(".prompt-box").forEach(function (box) {
    var btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.addEventListener("click", function () {
      var clone = box.cloneNode(true);
      clone.querySelectorAll(".copy-btn, .label").forEach(function (el) { el.remove(); });
      var text = clone.textContent.trim();
      function done() {
        btn.textContent = "Copied ✓";
        btn.classList.add("copied");
        setTimeout(function () {
          btn.textContent = "Copy";
          btn.classList.remove("copied");
        }, 1800);
      }
      function legacyCopy() {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        done();
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, legacyCopy);
      } else {
        legacyCopy();
      }
    });
    box.appendChild(btn);
  });

  /* ----- lightbox zoom for figures ----- */
  var lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = '<span class="close-hint">Click anywhere or press Esc to close</span><div class="inner"></div>';
  document.body.appendChild(lightbox);
  var lightboxInner = lightbox.querySelector(".inner");

  document.querySelectorAll("figure.zoomable").forEach(function (fig) {
    fig.addEventListener("click", function () {
      var media = fig.querySelector("svg, img");
      if (!media) return;
      lightboxInner.innerHTML = "";
      lightboxInner.appendChild(media.cloneNode(true));
      lightbox.classList.add("open");
    });
  });

  lightbox.addEventListener("click", function () { lightbox.classList.remove("open"); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") lightbox.classList.remove("open");
  });

  /* ----- micro-interactions (react-bits inspired, vanilla ports) ----- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* BlurText: staggered word reveal on the masthead headline */
  var h1 = document.querySelector(".masthead h1");
  if (h1 && !reduceMotion) {
    var wordIdx = 0;
    var wrapWords = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === Node.TEXT_NODE) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (/^\s+$/.test(part) || part === "") {
              frag.appendChild(document.createTextNode(part));
            } else {
              var span = document.createElement("span");
              span.className = "bw";
              span.style.setProperty("--bw-delay", (wordIdx * 0.07) + "s");
              span.textContent = part;
              frag.appendChild(span);
              wordIdx++;
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          wrapWords(child);
        }
      });
    };
    wrapWords(h1);
  }

  /* SpotlightCard: cursor-following highlight on accordion cards */
  document.querySelectorAll("details.card").forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* Journey strip: you-are-here across the sessions (leader track of 6, builder track of 10) */
  var crumb = document.querySelector(".toolbar .crumb");
  var mastheadWrap = document.querySelector(".masthead .wrap");
  if (crumb && mastheadWrap) {
    var mx = crumb.textContent.match(/Leader session (\d+) of 6/);
    var m = mx || crumb.textContent.match(/Builder session (\d+) of 10/);
    if (m) {
      var current = parseInt(m[1], 10);
      var pages = mx
        ? ["a1-reading-the-data.html", "a2-thinking-in-odds.html",
           "a3-the-bell-and-its-cousins.html", "a4-what-a-sample-can-say.html",
           "a5-the-number-and-its-error-bars.html", "a6-real-or-noise.html"]
        : ["b1-describe-the-data.html", "b2-probability-and-simulation.html", "b3-random-variables.html",
           "b4-distributions-in-scipy.html", "b5-sampling-and-clt.html", "b6-estimation-and-mle.html",
           "b7-confidence-intervals.html", "b8-hypothesis-testing.html",
           "b9-chi-square-anova.html", "b10-correlation-regression.html"];
      var journey = document.createElement("div");
      journey.className = "journey";
      var jl = document.createElement("span");
      jl.className = "jlabel";
      jl.textContent = "Your journey";
      journey.appendChild(jl);
      pages.forEach(function (href, i) {
        var a = document.createElement("a");
        a.href = href;
        a.textContent = i + 1;
        a.title = "Session " + (i + 1);
        if (i + 1 === current) a.className = "here";
        journey.appendChild(a);
      });
      mastheadWrap.appendChild(journey);
    }
  }

  /* Check-yourself quiz */
  var quizQs = document.querySelectorAll(".quiz-q");
  var quizCorrect = 0;
  quizQs.forEach(function (q) {
    var answer = parseInt(q.getAttribute("data-answer"), 10);
    var opts = q.querySelectorAll(".qopt");
    opts.forEach(function (opt, i) {
      opt.addEventListener("click", function () {
        if (q.classList.contains("answered")) return;
        if (i === answer) {
          opt.classList.add("correct");
          q.classList.add("answered");
          opts.forEach(function (o) { o.disabled = true; });
          quizCorrect++;
          var score = document.querySelector(".quiz-score");
          if (score && quizCorrect === quizQs.length) {
            score.textContent = "🎉 " + quizQs.length + "/" + quizQs.length + " - you're ready for the next session.";
          }
        } else {
          opt.classList.remove("wrong");
          void opt.offsetWidth; /* restart the shake */
          opt.classList.add("wrong");
        }
      });
    });
  });

  /* Reading progress bar */
  var pbar = document.createElement("div");
  pbar.id = "progress-bar";
  document.body.appendChild(pbar);
  var updateBar = function () {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    pbar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
  };
  window.addEventListener("scroll", updateBar, { passive: true });
  updateBar();

  /* Floating section-dot navigation (built from section kickers) */
  var navSections = Array.prototype.slice.call(document.querySelectorAll(".section[id]"));
  if (navSections.length >= 4) {
    var nav = document.createElement("nav");
    nav.className = "pagenav";
    nav.setAttribute("aria-label", "Page sections");
    navSections.forEach(function (sec) {
      var h2 = sec.querySelector(".section-kicker h2");
      var label = h2 ? h2.childNodes[0].textContent.trim() : sec.id;
      if (label.length > 34) label = label.slice(0, 32) + "…";
      var a = document.createElement("a");
      a.href = "#" + sec.id;
      var tip = document.createElement("span");
      tip.className = "nlabel";
      tip.textContent = label;
      a.appendChild(tip);
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
    var dots = nav.querySelectorAll("a");
    var updateDots = function () {
      var current = 0;
      navSections.forEach(function (sec, i) {
        if (sec.getBoundingClientRect().top <= 140) current = i;
      });
      dots.forEach(function (d, i) { d.classList.toggle("active", i === current); });
    };
    window.addEventListener("scroll", updateDots, { passive: true });
    updateDots();
  }

  /* CountUp: numbers with data-count tick up on load */
  var reduceMotionCU = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target) || reduceMotionCU) { el.textContent = target; return; }
    var start = null, dur = 900;
    var tick = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  /* ScrollReveal: sections rise in as they enter the viewport */
  if (!reduceMotion) {
    var toReveal = Array.prototype.slice.call(document.querySelectorAll(".section, .cheat"));
    if (toReveal.length) {
      document.documentElement.classList.add("js-reveal");
      var revealCheck = function () {
        var limit = window.innerHeight * 0.92;
        toReveal = toReveal.filter(function (sec) {
          if (sec.getBoundingClientRect().top < limit) {
            sec.classList.add("revealed");
            return false;
          }
          return true;
        });
        if (!toReveal.length) {
          window.removeEventListener("scroll", revealCheck);
          window.removeEventListener("resize", revealCheck);
        }
      };
      window.addEventListener("scroll", revealCheck, { passive: true });
      window.addEventListener("resize", revealCheck);
      revealCheck();
    }
  }
})();

/* === LWP-PATCH v2 === */
/* ============================================================
   v3 - phone legibility, reading modes, deep links, a11y
   Runs after the main IIFE. Adds behaviour, changes none.
   ============================================================ */
(function () {
  "use strict";

  var MODE_KEY = "lwp:study-mode";

  /* ----- skip link ----- */
  var main = document.querySelector("main.wrap, main");
  if (main) {
    if (!main.id) main.id = "content";
    var skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = "#" + main.id;
    skip.textContent = "Skip to content";
    document.body.insertBefore(skip, document.body.firstChild);
  }

  /* ----- diagrams scroll instead of shrinking below 820px ----- */
  var markScrollable = function () {
    document.querySelectorAll("figure.zoomable").forEach(function (f) {
      f.classList.add("figscroll");
      f.classList.toggle("can-scroll", f.scrollWidth > f.clientWidth + 2);
    });
  };
  markScrollable();
  window.addEventListener("resize", markScrollable);
  var mm = document.querySelector(".mindmap, #mindmap");
  if (mm) mm.classList.add("figscroll");

  /* ----- every table gets a scroll container ----- */
  document.querySelectorAll("table").forEach(function (t) {
    var p = t.parentElement;
    if (!p || p.classList.contains("tablescroll")) return;
    var w = document.createElement("div");
    w.className = "tablescroll";
    p.insertBefore(w, t);
    w.appendChild(t);
  });

  /* ----- accordion cards: stable ids + aria-expanded + deep links ----- */
  var slug = function (s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  };
  var used = {};
  var cards = Array.prototype.slice.call(document.querySelectorAll("details.card"));
  cards.forEach(function (d) {
    var sum = d.querySelector("summary");
    if (!sum) return;
    if (!d.id) {
      var txt = sum.cloneNode(true);
      txt.querySelectorAll(".mode, .mini, .caret").forEach(function (el) { el.remove(); });
      var base = "c-" + (slug(txt.textContent.trim()) || "card");
      var id = base, n = 2;
      while (used[id]) { id = base + "-" + n; n++; }
      used[id] = true;
      d.id = id;
    }
    sum.setAttribute("aria-expanded", d.open ? "true" : "false");
    d.addEventListener("toggle", function () {
      sum.setAttribute("aria-expanded", d.open ? "true" : "false");
    });
  });

  var openFromHash = function () {
    var h = decodeURIComponent(location.hash || "").slice(1);
    if (!h) return;
    var t = document.getElementById(h);
    if (t && t.tagName === "DETAILS") {
      t.open = true;
      t.classList.add("linked");
      setTimeout(function () { t.scrollIntoView({ block: "center" }); }, 40);
      setTimeout(function () { t.classList.remove("linked"); }, 2600);
    }
  };
  window.addEventListener("hashchange", openFromHash);
  openFromHash();

  /* ----- what is inside each section, before you open it ----- */
  document.querySelectorAll("section.section").forEach(function (sec) {
    var kicker = sec.querySelector(".section-kicker");
    var secCards = sec.querySelectorAll("details.card");
    if (!kicker || !secCards.length) return;
    var words = 0, mins = 0;
    secCards.forEach(function (d) {
      var body = d.querySelector(".body") || d;
      words += (body.textContent || "").trim().split(/\s+/).length;
      var mini = d.querySelector("summary .mini");
      var mm2 = mini && mini.textContent.match(/(\d+)/);
      if (mm2) mins += parseInt(mm2[1], 10);
    });
    var meta = document.createElement("span");
    meta.className = "sec-meta";
    meta.textContent = secCards.length + (secCards.length === 1 ? " card" : " cards")
      + (mins ? " · " + mins + " min" : "")
      + " · " + words.toLocaleString() + " words";
    kicker.appendChild(meta);
  });

  /* ----- reading modes: Session (default) / Study (remembered) ----- */
  var bar = document.querySelector(".toolbar .wrap");
  var toggleAll = document.getElementById("toggle-all");
  if (bar && cards.length) {
    var modeBtn = document.createElement("button");
    modeBtn.type = "button";
    modeBtn.className = "btn";
    modeBtn.id = "mode-toggle";

    var paint = function (on) {
      modeBtn.textContent = on ? "Study mode: on" : "Study mode: off";
      modeBtn.classList.toggle("mode-on", on);
      modeBtn.setAttribute("aria-pressed", on ? "true" : "false");
      modeBtn.title = on
        ? "Everything open, so the whole session is readable and searchable"
        : "Live cards open, self-study collapsed - the 45 minute view";
    };

    var apply = function (on) {
      cards.forEach(function (d) {
        if (on) { d.open = true; return; }
        var live = d.querySelector("summary .mode.live");
        d.open = !!live;
      });
      if (toggleAll) toggleAll.textContent = on ? "Collapse all" : "Expand all";
    };

    var stored = null;
    try { stored = localStorage.getItem(MODE_KEY); } catch (e) {}
    var on = stored === "1";
    paint(on);
    if (on) apply(true);

    modeBtn.addEventListener("click", function () {
      on = !on;
      paint(on);
      apply(on);
      try { localStorage.setItem(MODE_KEY, on ? "1" : "0"); } catch (e) {}
    });
    bar.insertBefore(modeBtn, toggleAll || null);
  }
})();
/* === /LWP-PATCH === */
