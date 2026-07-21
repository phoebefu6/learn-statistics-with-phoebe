/* ============================================================================
   stat-live.js - the live statistics playground for learn-statistics-with-phoebe.
   Three tools, zero dependencies, theme-aware (reads the site CSS vars):

     1. sampler - draw samples from Normal / Binomial / Poisson, drag the
        parameters, and watch the sample histogram sit under the theoretical
        curve. Live sample mean/SD vs the theoretical mean/SD.
     2. clt     - the Central Limit Theorem. A deliberately right-skewed
        population (Lumen order values). Pick a sample size n, draw many sample
        means, and watch their distribution go normal and narrow as n grows -
        even though the raw data never stops being skewed. SE = sigma/sqrt(n).
     3. test    - a two-proportion test + CI sandbox. Control 3.2% vs a variant
        you set, at an n-per-arm you set. Watch the z-stat, p-value, and 95% CIs
        move, with a significant? verdict. The bridge to the experimentation course.

   Drop <div class="stat-live" data-tool="sampler|clt|test"></div> on any page.
   Defaults seeded from the Lumen canon.
   ==========================================================================*/
(function () {
  "use strict";

  /* ---------- math helpers (no libraries) ---------- */

  function invNorm(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
             1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
             6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
             3.754408661907416e+00];
    var plow = 0.02425, phigh = 1 - plow, q, r;
    if (p < plow) { q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
    if (p <= phigh) { q = p - 0.5; r = q*q;
      return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1); }
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
  function normCdf(x) {
    var t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
    var y = 1 - (((((1.061405429*t - 1.453152027)*t) + 1.421413741)*t - 0.284496736)*t + 0.254829592)*t * Math.exp(-x*x/2);
    return 0.5 * (1 + (x < 0 ? -y : y));
  }
  function normPdf(x, mu, sd) { var z = (x - mu) / sd; return Math.exp(-0.5*z*z) / (sd * Math.sqrt(2*Math.PI)); }
  function randNorm() { var u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function poissonSample(lam) { // Knuth
    var L = Math.exp(-lam), k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  }
  function binomSample(n, p) { var k = 0; for (var i = 0; i < n; i++) if (Math.random() < p) k++; return k; }
  function factLn(n) { var s = 0; for (var i = 2; i <= n; i++) s += Math.log(i); return s; }
  function binomPmf(k, n, p) { if (k < 0 || k > n) return 0;
    return Math.exp(factLn(n) - factLn(k) - factLn(n-k) + k*Math.log(p) + (n-k)*Math.log(1-p)); }
  function poissonPmf(k, lam) { if (k < 0) return 0; return Math.exp(-lam + k*Math.log(lam) - factLn(k)); }
  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
  function sd(a, m) { if (m === undefined) m = mean(a); var s = 0;
    for (var i = 0; i < a.length; i++) s += (a[i]-m)*(a[i]-m); return Math.sqrt(s / a.length); }
  function fmt(n) { if (!isFinite(n)) return "infinite"; return n.toLocaleString("en-US"); }
  function set(root, key, val) { var el = root.querySelector('[data-o="' + key + '"]'); if (el) el.textContent = val; }

  /* ---------- shared SVG histogram ---------- */
  // data = array of samples; curve = fn(x)->density (already scaled to sample space) or null
  function drawChart(bins, curvePts, xmin, xmax, opts) {
    opts = opts || {};
    var W = 560, H = 210, padL = 34, padR = 12, padT = 12, padB = 26;
    var maxCount = 0, i;
    for (i = 0; i < bins.length; i++) if (bins[i].c > maxCount) maxCount = bins[i].c;
    if (curvePts) for (i = 0; i < curvePts.length; i++) if (curvePts[i].y > maxCount) maxCount = curvePts[i].y;
    if (maxCount <= 0) maxCount = 1;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    function sx(x) { return padL + (x - xmin) / (xmax - xmin) * plotW; }
    function sy(c) { return padT + plotH - (c / maxCount) * plotH; }
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="sl-svg" role="img" aria-label="' + (opts.aria || 'distribution chart') + '">';
    // baseline
    svg += '<line x1="' + padL + '" y1="' + (padT+plotH) + '" x2="' + (W-padR) + '" y2="' + (padT+plotH) + '" class="sl-axis"/>';
    // bars
    var bw = plotW / bins.length;
    for (i = 0; i < bins.length; i++) {
      var h = (bins[i].c / maxCount) * plotH;
      if (h < 0.4 && bins[i].c > 0) h = 0.8;
      svg += '<rect class="sl-bar" x="' + (padL + i*bw + 0.6).toFixed(1) + '" y="' + (padT+plotH-h).toFixed(1) +
             '" width="' + Math.max(0.5, bw-1.2).toFixed(1) + '" height="' + h.toFixed(1) + '"/>';
    }
    // theoretical curve
    if (curvePts && curvePts.length) {
      var pts = "";
      for (i = 0; i < curvePts.length; i++) pts += sx(curvePts[i].x).toFixed(1) + "," + sy(curvePts[i].y).toFixed(1) + " ";
      svg += '<polyline class="sl-curve" points="' + pts.trim() + '"/>';
    }
    // markers (vertical lines, e.g. means)
    if (opts.marks) for (i = 0; i < opts.marks.length; i++) {
      var mk = opts.marks[i];
      svg += '<line class="sl-mark" x1="' + sx(mk.x).toFixed(1) + '" y1="' + padT + '" x2="' + sx(mk.x).toFixed(1) +
             '" y2="' + (padT+plotH) + '" style="stroke:' + (mk.color || 'var(--amber)') + '"/>';
    }
    // x labels
    svg += '<text class="sl-tick" x="' + padL + '" y="' + (H-8) + '">' + (opts.xlab0 !== undefined ? opts.xlab0 : xmin.toFixed(0)) + '</text>';
    svg += '<text class="sl-tick" x="' + (W-padR) + '" y="' + (H-8) + '" text-anchor="end">' + (opts.xlab1 !== undefined ? opts.xlab1 : xmax.toFixed(0)) + '</text>';
    svg += '</svg>';
    return svg;
  }

  function histBins(data, xmin, xmax, nbins) {
    var bins = [], i;
    for (i = 0; i < nbins; i++) bins.push({ c: 0 });
    var w = (xmax - xmin) / nbins;
    for (i = 0; i < data.length; i++) {
      var b = Math.floor((data[i] - xmin) / w);
      if (b < 0) b = 0; if (b >= nbins) b = nbins - 1;
      bins[b].c++;
    }
    return { bins: bins, w: w };
  }

  function row(key, label, val, unit, min, max, step) {
    return '<label class="sl-row"><span class="sl-rl">' + label + '</span>' +
      '<input type="range" data-k="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '">' +
      '<output data-ov="' + key + '">' + val + unit + '</output></label>';
  }

  /* ---------- tool 1: distribution sampler ---------- */
  function buildSampler(root) {
    var st = { dist: "normal", n: 1500, mu: 74, sigma: 38, bn: 25, bp: 0.3, lam: 5 };
    function controls() {
      var c = '<div class="sl-tabs">' +
        tab("normal", "Normal") + tab("binomial", "Binomial") + tab("poisson", "Poisson") + '</div><div class="sl-grid">';
      if (st.dist === "normal") c += row("mu", "Mean (mu)", st.mu, "", 0, 150, 1) + row("sigma", "Std dev (sigma)", st.sigma, "", 5, 60, 1);
      else if (st.dist === "binomial") c += row("bn", "Trials (n)", st.bn, "", 1, 60, 1) + row("bp", "P(success)", st.bp, "", 0.02, 0.98, 0.01);
      else c += row("lam", "Rate (lambda)", st.lam, "", 1, 30, 1);
      c += row("n", "Sample size drawn", st.n, "", 100, 5000, 100) + '</div>';
      return c;
    }
    function tab(id, lab) { return '<button class="sl-tab' + (st.dist===id?' on':'') + '" type="button" data-dist="' + id + '">' + lab + '</button>'; }

    function render() {
      root.querySelector(".sl-body").innerHTML = controls() +
        '<div class="sl-chart" data-o="chart"></div>' +
        '<div class="sl-out">' +
          '<div class="sl-stat"><span class="sl-num" data-o="smean">-</span><span class="sl-lab">sample mean</span></div>' +
          '<div class="sl-stat"><span class="sl-num" data-o="ssd">-</span><span class="sl-lab">sample SD</span></div>' +
          '<div class="sl-stat sl-theo"><span class="sl-num" data-o="tmean">-</span><span class="sl-lab">theoretical mean</span></div>' +
          '<div class="sl-stat sl-theo"><span class="sl-num" data-o="tsd">-</span><span class="sl-lab">theoretical SD</span></div>' +
        '</div><p class="sl-note" data-o="note"></p>';
      wire();
      recompute();
    }
    function wire() {
      root.querySelectorAll(".sl-tab").forEach(function (t) {
        t.addEventListener("click", function () { st.dist = t.dataset.dist; render(); });
      });
      root.querySelectorAll("input[type=range]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          st[inp.dataset.k] = parseFloat(inp.value);
          var ov = root.querySelector('[data-ov="' + inp.dataset.k + '"]');
          if (ov) ov.textContent = inp.value;
          recompute();
        });
      });
    }
    function recompute() {
      var data = [], i, xmin, xmax, tmean, tsd, curve = [], nb, note;
      if (st.dist === "normal") {
        for (i = 0; i < st.n; i++) data.push(st.mu + st.sigma * randNorm());
        xmin = st.mu - 4*st.sigma; xmax = st.mu + 4*st.sigma; tmean = st.mu; tsd = st.sigma; nb = 40;
        var hb = histBins(data, xmin, xmax, nb);
        for (i = 0; i <= 80; i++) { var x = xmin + (xmax-xmin)*i/80; curve.push({ x: x, y: normPdf(x, st.mu, st.sigma) * st.n * hb.w }); }
        note = "The bell you know. ~68% of draws land within 1 SD of the mean, ~95% within 2. Lumen's order values are roughly this shape (mean ~$74) - though real money is right-skewed (see the CLT tool).";
        root.querySelector('[data-o="chart"]').innerHTML = drawChart(hb.bins, curve, xmin, xmax, { aria: "normal histogram vs bell curve", xlab0: xmin.toFixed(0), xlab1: xmax.toFixed(0), marks:[{x:tmean}] });
      } else if (st.dist === "binomial") {
        for (i = 0; i < st.n; i++) data.push(binomSample(st.bn, st.bp));
        xmin = -0.5; xmax = st.bn + 0.5; tmean = st.bn*st.bp; tsd = Math.sqrt(st.bn*st.bp*(1-st.bp)); nb = st.bn + 1;
        var hb2 = histBins(data, xmin, xmax, nb);
        for (i = 0; i <= st.bn; i++) curve.push({ x: i, y: binomPmf(i, st.bn, st.bp) * st.n });
        note = "Count of successes in " + st.bn + " independent yes/no trials, each with P=" + st.bp.toFixed(2) +
          ". Lumen: out of " + st.bn + " checkout sessions, how many convert? Mean = n*p, SD = sqrt(n*p*(1-p)).";
        root.querySelector('[data-o="chart"]').innerHTML = drawChart(hb2.bins, curve, xmin, xmax, { aria: "binomial histogram vs pmf", xlab0: "0", xlab1: String(st.bn), marks:[{x:tmean}] });
      } else {
        for (i = 0; i < st.n; i++) data.push(poissonSample(st.lam));
        var hi = Math.max(10, Math.ceil(st.lam + 4*Math.sqrt(st.lam)));
        xmin = -0.5; xmax = hi + 0.5; tmean = st.lam; tsd = Math.sqrt(st.lam); nb = hi + 1;
        var hb3 = histBins(data, xmin, xmax, nb);
        for (i = 0; i <= hi; i++) curve.push({ x: i, y: poissonPmf(i, st.lam) * st.n });
        note = "Count of events in a fixed window when they happen at an average rate of " + st.lam +
          ". Lumen: support tickets per hour, or (with lambda~128) orders per day. For Poisson, mean = variance = lambda.";
        root.querySelector('[data-o="chart"]').innerHTML = drawChart(hb3.bins, curve, xmin, xmax, { aria: "poisson histogram vs pmf", xlab0: "0", xlab1: String(hi), marks:[{x:tmean}] });
      }
      set(root, "smean", mean(data).toFixed(2));
      set(root, "ssd", sd(data).toFixed(2));
      set(root, "tmean", tmean.toFixed(2));
      set(root, "tsd", tsd.toFixed(2));
      set(root, "note", note);
    }

    root.innerHTML = '<div class="sl-head"><span class="sl-badge">▶ Live</span><b>Distribution sampler</b>' +
      '<span class="sl-sub">draw real samples, watch them fill the theoretical curve</span></div><div class="sl-body"></div>';
    render();
  }

  /* ---------- tool 2: CLT convergence ---------- */
  function buildCLT(root) {
    // fixed right-skewed "population" of Lumen order values (~lognormal, mean ~74)
    var POP = [], i;
    (function () {
      for (i = 0; i < 20000; i++) { var v = Math.exp(4.0 + 0.55 * randNorm()); POP.push(Math.min(v, 400)); }
    })();
    var popMean = mean(POP), popSD = sd(POP, popMean);
    var st = { n: 5, reps: 2000 };

    root.innerHTML = '<div class="sl-head"><span class="sl-badge">▶ Live</span><b>The Central Limit Theorem</b>' +
      '<span class="sl-sub">skewed data in, normal sample-means out</span></div>' +
      '<div class="sl-grid">' + row("n", "Sample size n (per mean)", st.n, "", 1, 200, 1) +
      row("reps", "Number of samples", st.reps, "", 200, 5000, 200) + '</div>' +
      '<div class="sl-twin"><div><div class="sl-cap">The population (order values) - always skewed</div><div class="sl-chart" data-o="pop"></div></div>' +
      '<div><div class="sl-cap">Distribution of the <b>sample mean</b></div><div class="sl-chart" data-o="means"></div></div></div>' +
      '<div class="sl-out">' +
        '<div class="sl-stat"><span class="sl-num" data-o="pmean">-</span><span class="sl-lab">population mean</span></div>' +
        '<div class="sl-stat"><span class="sl-num" data-o="se">-</span><span class="sl-lab">SE = sigma/sqrt(n)</span></div>' +
        '<div class="sl-stat"><span class="sl-num" data-o="obssd">-</span><span class="sl-lab">observed SD of means</span></div>' +
      '</div><p class="sl-note" data-o="note"></p>';

    // population histogram (drawn once)
    var phb = histBins(POP, 0, 300, 40);
    root.querySelector('[data-o="pop"]').innerHTML = drawChart(phb.bins, null, 0, 300, { aria: "skewed population", xlab0: "$0", xlab1: "$300", marks:[{x:popMean}] });
    set(root, "pmean", "$" + popMean.toFixed(1));

    function recompute() {
      var means = [], i, j, s;
      for (i = 0; i < st.reps; i++) { s = 0; for (j = 0; j < st.n; j++) s += POP[(Math.random()*POP.length)|0]; means.push(s / st.n); }
      var mm = mean(means), msd = sd(means, mm), se = popSD / Math.sqrt(st.n);
      var lo = popMean - 3.5*se, hi = popMean + 3.5*se;
      var hb = histBins(means, lo, hi, 40), curve = [];
      for (i = 0; i <= 80; i++) { var x = lo + (hi-lo)*i/80; curve.push({ x: x, y: normPdf(x, popMean, se) * st.reps * hb.w }); }
      root.querySelector('[data-o="means"]').innerHTML = drawChart(hb.bins, curve, lo, hi, { aria: "sampling distribution of the mean", xlab0: "$"+lo.toFixed(0), xlab1: "$"+hi.toFixed(0), marks:[{x:popMean}] });
      set(root, "se", "$" + se.toFixed(2));
      set(root, "obssd", "$" + msd.toFixed(2));
      set(root, "note", "Each sample of n=" + st.n + " order values gets averaged to ONE number; we did that " + st.reps +
        " times. The population stays skewed forever, but the sample means pile into a normal centered on the true mean ($" +
        popMean.toFixed(1) + "). Their spread is the standard error, sigma/sqrt(n) = $" + se.toFixed(2) +
        ". Push n up and watch the normal tighten - that is why bigger samples give more trustworthy averages.");
    }
    root.querySelectorAll("input[type=range]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        st[inp.dataset.k] = parseInt(inp.value, 10);
        var ov = root.querySelector('[data-ov="' + inp.dataset.k + '"]'); if (ov) ov.textContent = inp.value;
        recompute();
      });
    });
    recompute();
  }

  /* ---------- tool 3: test & CI sandbox ---------- */
  function buildTest(root) {
    var st = { ctrl: 3.2, var_: 3.6, n: 5000 };
    root.innerHTML = '<div class="sl-head"><span class="sl-badge">▶ Live</span><b>Test &amp; confidence-interval sandbox</b>' +
      '<span class="sl-sub">Lumen control 3.2% vs your variant - is the gap real?</span></div>' +
      '<div class="sl-grid">' +
        row("ctrl", "Control conversion", st.ctrl, "%", 1, 10, 0.1) +
        row("var_", "Variant conversion", st.var_, "%", 1, 10, 0.1) +
        row("n", "Users per arm", st.n, "", 500, 60000, 500) + '</div>' +
      '<div class="sl-verdict" data-o="verdict"></div>' +
      '<div class="sl-out">' +
        '<div class="sl-stat"><span class="sl-num" data-o="z">-</span><span class="sl-lab">z statistic</span></div>' +
        '<div class="sl-stat"><span class="sl-num" data-o="p">-</span><span class="sl-lab">p-value (two-sided)</span></div>' +
        '<div class="sl-stat"><span class="sl-num" data-o="ci">-</span><span class="sl-lab">95% CI on the lift (pp)</span></div>' +
      '</div><p class="sl-note" data-o="note"></p>';

    function recompute() {
      var p1 = st.ctrl/100, p2 = st.var_/100, n = st.n;
      var pool = (p1 + p2) / 2;
      var se = Math.sqrt(pool*(1-pool)*(2/n));
      var z = se > 0 ? (p2 - p1) / se : 0;
      var pval = 2 * (1 - normCdf(Math.abs(z)));
      // Wald CI on the difference (unpooled)
      var seDiff = Math.sqrt(p1*(1-p1)/n + p2*(1-p2)/n);
      var d = (p2 - p1) * 100, half = 1.96 * seDiff * 100;
      var sig = pval < 0.05;
      set(root, "z", z.toFixed(2));
      set(root, "p", pval < 0.0001 ? "<0.0001" : pval.toFixed(4));
      set(root, "ci", "[" + (d-half).toFixed(2) + ", " + (d+half).toFixed(2) + "]");
      var v = root.querySelector('[data-o="verdict"]');
      v.className = "sl-verdict " + (sig ? "sl-sig" : "sl-nsig");
      v.innerHTML = sig
        ? "✓ Significant at 5% - the CI on the lift excludes zero. You would ship the variant (if guardrails hold)."
        : "— Not significant - the CI on the lift still straddles zero. This n cannot tell the gap from noise.";
      var note;
      if (Math.abs(st.var_-3.6) < 0.001 && Math.abs(st.ctrl-3.2) < 0.001) {
        note = "The Lumen flagship test: 3.2% -> 3.6% (+0.4pp, +12.5% relative). At n=5,000/arm it is NOT significant (p~0.25). Slide n up: around ~32,000/arm it crosses p<0.05. Same true effect, different n, different verdict - which is exactly why the experimentation course computes the sample size BEFORE launching.";
      } else {
        note = "Same effect, more users = more certainty. A p-value is P(a gap this big | the two rates are truly equal), NOT the probability the variant is better. Pair it with the CI: if the interval excludes 0, the gap is distinguishable from noise at this n.";
      }
      set(root, "note", note);
    }
    root.querySelectorAll("input[type=range]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        st[inp.dataset.k] = parseFloat(inp.value);
        var ov = root.querySelector('[data-ov="' + inp.dataset.k + '"]');
        if (ov) ov.textContent = (inp.dataset.k === "n") ? fmt(parseFloat(inp.value)) : inp.value;
        recompute();
      });
    });
    var no = root.querySelector('[data-ov="n"]'); if (no) no.textContent = fmt(st.n);
    recompute();
  }

  /* ---------- scoped, theme-aware styles ---------- */
  function injectCss() {
    if (document.getElementById("sl-css")) return;
    var s = document.createElement("style");
    s.id = "sl-css";
    s.textContent =
      ".stat-live{border:1px solid var(--hairline);border-radius:16px;padding:1.4rem 1.5rem;margin:1.6rem 0;background:linear-gradient(180deg,var(--indigo-50),#fff);box-shadow:0 10px 30px rgba(14,124,144,.08)}" +
      ".sl-head{display:flex;align-items:baseline;gap:.6rem;flex-wrap:wrap;margin-bottom:1.1rem}" +
      ".sl-head b{font-size:1.15rem;color:var(--ink)}" +
      ".sl-badge{background:var(--amber);color:var(--amber-ink);font-weight:800;font-size:.7rem;padding:.15rem .55rem;border-radius:999px;letter-spacing:.03em}" +
      ".sl-sub{color:var(--muted);font-size:.85rem}" +
      ".sl-tabs{display:flex;gap:.4rem;margin-bottom:.9rem;flex-wrap:wrap}" +
      ".sl-tab{background:#fff;border:1px solid var(--hairline);color:var(--muted);font-weight:700;font-size:.85rem;padding:.4rem .9rem;border-radius:999px;cursor:pointer}" +
      ".sl-tab.on{background:var(--indigo);color:#fff;border-color:var(--indigo)}" +
      ".sl-grid{display:grid;gap:.55rem;margin-bottom:1rem}" +
      ".sl-row{display:grid;grid-template-columns:13rem 1fr 5rem;align-items:center;gap:.8rem}" +
      ".sl-rl{color:var(--ink);font-weight:600;font-size:.9rem}" +
      ".sl-row input[type=range]{width:100%;accent-color:var(--indigo)}" +
      ".sl-row output{font-variant-numeric:tabular-nums;font-weight:700;color:var(--indigo);text-align:right}" +
      ".sl-chart{margin:.4rem 0}" +
      ".sl-svg{width:100%;height:auto;display:block}" +
      ".sl-bar{fill:var(--indigo-soft)}" +
      ".sl-curve{fill:none;stroke:var(--amber);stroke-width:2.4}" +
      ".sl-axis{stroke:var(--faint);stroke-width:1}" +
      ".sl-mark{stroke-width:2;stroke-dasharray:4 3;opacity:.85}" +
      ".sl-tick{font:600 11px Inter,sans-serif;fill:var(--muted)}" +
      ".sl-twin{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:.4rem 0}" +
      ".sl-cap{font-size:.8rem;color:var(--muted);font-weight:600;margin-bottom:.2rem}" +
      ".sl-out{display:flex;gap:.7rem;flex-wrap:wrap;margin:1rem 0 .4rem}" +
      ".sl-stat{flex:1;min-width:7rem;background:#fff;border:1px solid var(--hairline);border-radius:12px;padding:.85rem 1rem;text-align:center}" +
      ".sl-theo{background:var(--indigo-50)}" +
      ".sl-num{display:block;font-size:1.5rem;font-weight:800;color:var(--indigo);font-variant-numeric:tabular-nums;line-height:1.1}" +
      ".sl-lab{display:block;color:var(--muted);font-size:.76rem;margin-top:.25rem}" +
      ".sl-note{color:var(--muted);font-size:.85rem;margin-top:.5rem;line-height:1.6}" +
      ".sl-verdict{border-radius:12px;padding:.7rem 1rem;font-weight:700;font-size:.92rem;margin:.2rem 0}" +
      ".sl-sig{background:var(--indigo-50);color:var(--indigo-deep);border:1px solid var(--indigo-soft)}" +
      ".sl-nsig{background:#FEF2F2;color:#991B1B;border:1px solid #FCA5A5}" +
      "@media(max-width:640px){.sl-row{grid-template-columns:1fr;gap:.2rem}.sl-row output{text-align:left}.sl-twin{grid-template-columns:1fr}}";
    document.head.appendChild(s);
  }

  function init() {
    var roots = document.querySelectorAll(".stat-live");
    if (!roots.length) return;
    injectCss();
    roots.forEach(function (root) {
      if (root.dataset.built) return;
      root.dataset.built = "1";
      var t = root.dataset.tool;
      if (t === "clt") buildCLT(root);
      else if (t === "test") buildTest(root);
      else buildSampler(root);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
