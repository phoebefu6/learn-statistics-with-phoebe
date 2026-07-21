/* mindmap.js - reusable knowledge-map layer for the learn-X-with-phoebe courses.
   Reads window.MINDMAP_DATA and renders a clickable LEFT-TO-RIGHT tree into #mindmap:
   root (course) on the left · sessions in a middle column · concepts fan out right.
   Curved edges, hover spotlights one session branch, every node is a link.
   Self-contained, no dependencies. Bump ?v= on change (Pages caches hard).

   Data shape:
   window.MINDMAP_DATA = {
     title: "Tech Project PMO",        // root label (wraps on \n)
     centerColor: "#0B2A45",
     sessions: [
       { label:"Frame & charter", href:"courses/01-...html", color:"#34D399",
         concepts:[ {label:"Interim vs final", href:"courses/01-...html"}, ... ] },
       ...
     ]
   };
*/
(function () {
  var host = document.getElementById("mindmap");
  var data = window.MINDMAP_DATA;
  if (!host || !data || !data.sessions || !data.sessions.length) return;

  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---- theme: read the site's own palette from CSS custom properties, so the map
     automatically matches whichever course theme style.css carries. Falls back to
     MINDMAP_DATA colors / neutral greys when a variable is absent. ---- */
  var rootCS = getComputedStyle(document.documentElement);
  function theme(name, fallback) {
    var v = rootCS.getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }
  var C_ACCENT = theme("--indigo", "#0E7490");        // session fill + trunk
  var C_DEEP   = theme("--indigo-deep", "#0B2A45");   // root fill
  var C_SOFT   = theme("--indigo-soft", "#93C5FD");   // concept border
  var C_TINT   = theme("--indigo-50", "#EEF2FF");     // concept fill
  var C_INK    = theme("--ink", "#16202B");           // concept text
  var C_FAINT  = theme("--faint", "#CBD5E1");         // twig edges

  /* ---- layout constants (left-to-right tree) ---- */
  var ROW = 46;          // vertical pitch of one concept row
  var GAP = 22;          // vertical gap between session blocks
  var PAD = 28;          // canvas padding
  var ROOT_W = 190, ROOT_H = 78;
  var SESS_W = 168, SESS_H = 52;
  var CONC_W = 190, CONC_H = 36;
  var X_ROOT = PAD + ROOT_W / 2;                        // root column (center x)
  var X_SESS = PAD + ROOT_W + 120 + SESS_W / 2;         // session column
  var X_CONC = X_SESS + SESS_W / 2 + 110 + CONC_W / 2;  // concept column
  var W = X_CONC + CONC_W / 2 + PAD;

  // block height per session = tallest of the session node / its concept stack
  var blocks = data.sessions.map(function (s) {
    var c = (s.concepts || []).length;
    return Math.max(SESS_H + 10, c * ROW);
  });
  var H = PAD * 2 + blocks.reduce(function (a, b) { return a + b; }, 0)
        + GAP * (data.sessions.length - 1);

  function el(name, attrs, text) {
    var e = document.createElementNS(SVGNS, name);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  // rounded-rect node with centered (multi-line) label, optionally wrapped in a link
  function node(opts) {
    var group = el("g", { "class": "mm-node" });
    group.appendChild(el("rect", {
      x: opts.x - opts.w / 2, y: opts.y - opts.h / 2, width: opts.w, height: opts.h,
      rx: opts.rx || 10, fill: opts.fill, stroke: opts.stroke || "none",
      "stroke-width": opts.strokeW || 0
    }));
    var lines = String(opts.label).split("\n");
    var lh = opts.fs + 3;
    var startY = opts.y - ((lines.length - 1) * lh) / 2 + opts.fs / 3;
    lines.forEach(function (ln, i) {
      group.appendChild(el("text", {
        x: opts.x, y: startY + i * lh, "text-anchor": "middle",
        "font-family": "Inter, sans-serif", "font-weight": opts.fw || 700,
        "font-size": opts.fs, fill: opts.color
      }, ln));
    });
    if (opts.href) {
      var a = el("a", { href: opts.href });
      a.setAttribute("class", "mm-link");
      a.appendChild(group);
      return a;
    }
    return group;
  }

  // smooth S-curve between two node edges (left-to-right)
  function curve(x1, y1, x2, y2, stroke, width) {
    var mx = (x1 + x2) / 2;
    return el("path", {
      d: "M " + x1 + " " + y1 + " C " + mx + " " + y1 + ", " + mx + " " + y2 + ", " + x2 + " " + y2,
      fill: "none", stroke: stroke, "stroke-width": width, "class": "mm-edge",
      "stroke-linecap": "round"
    });
  }

  var svg = el("svg", {
    viewBox: "0 0 " + W + " " + H, xmlns: SVGNS, role: "img",
    "class": "mm-svg", "aria-label": "Course knowledge map: " + data.title
  });
  var edgeLayer = el("g", { "class": "mm-edges" });
  var nodeLayer = el("g", { "class": "mm-nodes" });
  svg.appendChild(edgeLayer);
  svg.appendChild(nodeLayer);

  var rootY = H / 2;
  var sessionGroups = [];
  var y = PAD;

  data.sessions.forEach(function (s, i) {
    var bh = blocks[i];
    var sy = y + bh / 2;              // session node sits mid-block
    var edges = [];

    // trunk: root -> session, in the site accent
    var trunk = curve(X_ROOT + ROOT_W / 2, rootY, X_SESS - SESS_W / 2, sy, C_ACCENT, 2.5);
    trunk.style.opacity = 0.55;
    edgeLayer.appendChild(trunk);
    edges.push(trunk);

    // concepts: vertical stack, centered on the session node
    var cs = s.concepts || [];
    var conceptEls = [];
    var cy0 = sy - ((cs.length - 1) * ROW) / 2;
    cs.forEach(function (c, j) {
      var cyj = cy0 + j * ROW;
      var twig = curve(X_SESS + SESS_W / 2, sy, X_CONC - CONC_W / 2, cyj, C_FAINT, 1.5);
      edgeLayer.appendChild(twig);
      edges.push(twig);
      var cnode = node({
        x: X_CONC, y: cyj, w: CONC_W, h: CONC_H, rx: 8,
        fill: C_TINT, color: C_INK, fs: 12, fw: 600,
        stroke: C_SOFT, strokeW: 1.5,
        label: String(c.label).replace(/\n/g, " "), href: c.href
      });
      nodeLayer.appendChild(cnode);
      conceptEls.push(cnode);
    });

    var snode = node({
      x: X_SESS, y: sy, w: SESS_W, h: SESS_H, rx: 12,
      fill: C_ACCENT, color: "#FFFFFF", fs: 13, fw: 800,
      label: (i + 1) + " · " + s.label, href: s.href
    });
    nodeLayer.appendChild(snode);
    sessionGroups.push({ session: snode, concepts: conceptEls, edges: edges });
    y += bh + GAP;
  });

  // root node last (on top of trunk curves)
  nodeLayer.appendChild(node({
    x: X_ROOT, y: rootY, w: ROOT_W, h: ROOT_H, rx: 16,
    fill: C_DEEP || data.centerColor, color: "#FFFFFF", fs: 16, fw: 800,
    label: data.title
  }));

  host.appendChild(svg);

  // hover: spotlight one session branch, dim the rest
  function setFocus(idx) {
    sessionGroups.forEach(function (g, i) {
      var dim = (idx != null && i !== idx);
      g.session.style.opacity = dim ? 0.25 : 1;
      g.concepts.forEach(function (c) { c.style.opacity = dim ? 0.25 : 1; });
      g.edges.forEach(function (e, k) { e.style.opacity = dim ? 0.12 : (k === 0 ? 0.55 : 1); });
    });
  }
  sessionGroups.forEach(function (g, i) {
    [g.session].concat(g.concepts).forEach(function (nodeEl) {
      nodeEl.addEventListener("mouseenter", function () { setFocus(i); });
      nodeEl.addEventListener("mouseleave", function () { setFocus(null); });
    });
  });
})();
