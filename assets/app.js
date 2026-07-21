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
