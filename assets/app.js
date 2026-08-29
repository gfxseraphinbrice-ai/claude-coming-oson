// ── PAUSE GLOBALE QUAND L'ONGLET N'EST PAS VISIBLE ──
  // Coupe toutes les animations CSS ET les <animate> SMIL du SVG dès que
  // l'onglet passe en arrière-plan (changement d'onglet, fenêtre réduite) :
  // aucune perte visuelle (la page n'est de toute façon pas à l'écran),
  // mais ça évite de faire tourner le CPU pour rien pendant ce temps-là.
  (function() {
    const styleEl = document.createElement('style');
    styleEl.textContent =
      '.anim-paused, .anim-paused *, .anim-paused *::before, .anim-paused *::after {' +
      '  animation-play-state: paused !important;' +
      '}';
    document.head.appendChild(styleEl);

    const svgs = [document.getElementById('cableSvg')].filter(Boolean)
      .concat(Array.from(document.querySelectorAll('.graph-hr-svg')));

    function applyState() {
      const hidden = document.hidden;
      document.documentElement.classList.toggle('anim-paused', hidden);
      svgs.forEach(svg => {
        try { hidden ? svg.pauseAnimations() : svg.unpauseAnimations(); } catch (e) {}
      });
    }
    document.addEventListener('visibilitychange', applyState);
    applyState();
  })();

  // ── LOADER INTRO ──
  (function() {
    const loader = document.getElementById('siteLoader');
    const bar    = document.getElementById('siteLoaderBar');
    const label  = document.getElementById('siteLoaderLabel');
    const root   = document.documentElement;
    if (!loader || !bar || !label) return;

    const msgs = ['Chargement...', 'Initialisation...', 'Prêt !'];
    let progress = 0;
    let msgIndex = 0;
    let finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(interval);
      bar.style.width = '100%';
      label.textContent = 'Prêt !';
      label.style.color = '#ffffff';
      setTimeout(function() {
        loader.classList.add('hiding');
        root.classList.add('page-loader-done');
        setTimeout(function() {
          loader.remove();
        }, 320);
      }, 200);
    }

    const interval = setInterval(function() {
      progress += Math.random() * 26 + 14;
      if (progress > 100) progress = 100;
      bar.style.width = progress + '%';

      const newIdx = progress < 40 ? 0 : progress < 80 ? 1 : 2;
      if (newIdx !== msgIndex) {
        msgIndex = newIdx;
        label.textContent = msgs[msgIndex];
        if (msgIndex === 2) label.style.color = '#ffffff';
      }

      if (progress >= 100) finish();
    }, 36);

    setTimeout(finish, 1100);
  })();

  // ── ENTRY OVERLAY CLEANUP ──
  // Le voile d'entrée se termine en opacity:0 puis déclenche l'arrivée
  // progressive du contenu. On le retire ensuite du DOM.
  (function() {
    const overlay = document.getElementById('entryOverlay');
    if (!overlay) return;
    const root = document.documentElement;
    const remove = () => {
      overlay.style.display = 'none';
      root.classList.add('page-intro-ready');
    };
    overlay.addEventListener('animationend', remove, { once: true });
    setTimeout(remove, 1200); // filet de sécurité si l'event ne se déclenche pas
  })();

  // ── ENTRY CASCADE ── 
  (function() {
    const root = document.documentElement;
    const wrap = document.querySelector('.wrap');
    if (!wrap) return;

    const ordered = Array.from(wrap.children).filter(function(el) {
      return !el.classList.contains('glass-squares');
    });
    const glass = wrap.querySelector('.glass-squares');
    let delay = 0.01;

    ordered.forEach(function(el) {
      el.classList.add('intro-seq');
      el.style.transitionDelay = delay.toFixed(2) + 's';
      delay += 0.02;
    });

    if (glass) {
      glass.classList.add('intro-seq');
      glass.style.transitionDelay = (delay + 0.03).toFixed(2) + 's';

      const squares = Array.from(glass.querySelectorAll('.gsq')).filter(function(el) {
        return !el.classList.contains('gsq-0');
      });

      squares.sort(function(a, b) {
        const aStyle = getComputedStyle(a);
        const bStyle = getComputedStyle(b);
        const aArea = parseFloat(aStyle.width) * parseFloat(aStyle.height);
        const bArea = parseFloat(bStyle.width) * parseFloat(bStyle.height);
        return aArea - bArea;
      });

      let sqDelay = delay + 0.14;
      squares.forEach(function(square, index) {
        square.classList.add('intro-seq');
        square.style.transitionDelay = (sqDelay + index * 0.16).toFixed(2) + 's';
      });
    }
  })();

  // ── DROPDOWN "portfolio" : index de stagger + ripple au clic ──
  (function() {
    const items = document.querySelectorAll('.status-dd-item');
    items.forEach((item, i) => {
      item.style.setProperty('--i', i);
      item.addEventListener('click', (e) => {
        const rect = item.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.6;
        const ripple = document.createElement('span');
        ripple.className = 'dd-ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top  = (e.clientY - rect.top  - size / 2) + 'px';
        item.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  })();

  // ── CTA "Devis gratuit" : micro-interaction magnétique au survol ──
  (function() {
    const ctas = [].slice.call(document.querySelectorAll('.status-header-cta, .status-dd-item.dd-cta'));
    if (!ctas.length || !window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    ctas.forEach(function(cta) {
      let rect = null;

      function updateFromEvent(e) {
        rect = rect || cta.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const nx = (x / rect.width) - 0.5;
        const ny = (y / rect.height) - 0.5;
        const mx = clamp(nx * 10, -8, 8);
        const my = clamp(ny * 6, -5, 5);

        cta.style.setProperty('--cta-x', mx.toFixed(2) + 'px');
        cta.style.setProperty('--cta-y', my.toFixed(2) + 'px');
        cta.style.setProperty('--cta-rx', Math.round((x / rect.width) * 100) + '%');
        cta.style.setProperty('--cta-ry', Math.round((y / rect.height) * 100) + '%');
      }

      cta.addEventListener('pointerenter', function(e) {
        rect = cta.getBoundingClientRect();
        cta.classList.add('is-hovering');
        updateFromEvent(e);
      });

      cta.addEventListener('pointermove', function(e) {
        updateFromEvent(e);
      });

      cta.addEventListener('pointerleave', function() {
        rect = null;
        cta.classList.remove('is-hovering', 'is-pressing');
        cta.style.setProperty('--cta-x', '0px');
        cta.style.setProperty('--cta-y', '0px');
        cta.style.setProperty('--cta-rx', '50%');
        cta.style.setProperty('--cta-ry', '50%');
      });

      cta.addEventListener('pointerdown', function() {
        cta.classList.add('is-pressing');
      });

      cta.addEventListener('pointerup', function() {
        cta.classList.remove('is-pressing');
      });

      cta.addEventListener('blur', function() {
        cta.classList.remove('is-hovering', 'is-pressing');
      });
    });
  })();

  // ── DIAMOND CLICK FLUO BOUNCE ──
  (function() {
    const d = document.getElementById('diamondEl');
    if (!d) return;
    d.addEventListener('click', () => {
      d.classList.remove('fluo');
      void d.offsetWidth;
      d.classList.add('fluo');
      setTimeout(() => d.classList.remove('fluo'), 900);
    });
  })();

  // ── GRAPH LINE TRACKER (fusionné + optimisé) ──
  // Avant : 2 boucles requestAnimationFrame séparées interrogeaient chacune
  // getTotalLength()/getPointAtLength() sur le MÊME <path id="graphLine">
  // (jusqu'à ~204 requêtes de géométrie SVG par frame, ~12 000/s à 60fps).
  // Ici : une seule boucle, un seul getTotalLength() par frame, partagé,
  // et une recherche du pic en 2 passes (balayage grossier + affinage local)
  // au lieu d'un balayage brut à 201 points — position du pic identique à
  // l'œil, pour ~4x moins d'appels getPointAtLength() et moins de garbage
  // collection (chaque appel alloue un point).
  (function() {
    const path     = document.getElementById('graphLine');
    const dotOuter = document.getElementById('tipDotOuter');
    const dotInner = document.getElementById('tipDotInner');
    const tipLine  = document.getElementById('tipLine');
    const tipCard  = document.getElementById('tipCard');
    const countEl  = document.getElementById('tipVisitorCount');
    const pctPill  = document.getElementById('tipPctPill');
    const pctText  = document.getElementById('tipPctText');
    const CARD_W   = 110;
    const SVG_W    = 520;
    // La courbe (#graphLine) est statique : son `d` n'est jamais modifié en JS.
    // getTotalLength() était pourtant rappelé à chaque frame dans tick() (60x/s,
    // pour la durée de vie de la page) — un calcul de géométrie SVG coûteux et
    // strictement redondant. Calculé une seule fois ici et réutilisé partout.
    const PATH_LEN = path.getTotalLength();

    // Le nombre de visiteurs suit la hauteur de la courbe à l'endroit du
    // bullet — plus il est haut sur la courbe, plus le chiffre est élevé.
    // Se met à jour en continu, en même temps que le bullet glisse.
    const V_MAX = 950, V_MIN = 560; // plage de chiffres affichés
    function yToVisitorCount(y) {
      const Y_MIN = -10, Y_MAX = 60;   // plage verticale approx. de la courbe
      const t = Math.min(1, Math.max(0, (y - Y_MIN) / (Y_MAX - Y_MIN)));
      return Math.round(V_MAX - t * (V_MAX - V_MIN));
    }

    // ── Pill % : suit le sens de variation du chiffre visiteurs ──
    // Référence = milieu de la plage affichée. Quand le bullet (donc le
    // chiffre) monte au-dessus → % positif (vert) ; quand il descend
    // en-dessous → % négatif (rouge). Le texte/couleur ne sont réécrits
    // que si le pourcentage entier change, pour éviter du travail DOM inutile.
    const PCT_REF = (V_MIN + V_MAX) / 2;
    let lastPct = null;
    function updatePctPill(visitorValue) {
      const pct = Math.round(((visitorValue - PCT_REF) / PCT_REF) * 100);
      if (pct === lastPct) return;
      lastPct = pct;
      const up = pct >= 0;
      pctText.textContent = (up ? '+' : '') + pct + '%';
      pctText.setAttribute('fill', up ? '#88cc33' : '#ff6b6b');
      pctPill.setAttribute('fill', up ? 'rgba(100,200,60,0.18)' : 'rgba(255,90,90,0.18)');
      pctPill.setAttribute('stroke', up ? 'rgba(100,200,60,0.35)' : 'rgba(255,90,90,0.4)');
    }

    const shock     = document.getElementById('electricShock');
    const halo      = document.getElementById('elecHalo');
    const halo2     = document.getElementById('elecHalo2');
    const DURATION  = 2013; // ms, identique au dur de l'animateMotion
    const THRESHOLD = 18;   // px de proximité pour déclencher l'étincelle
    let elecPhase   = 0;    // 0 = idle, 1 = étincelle en cours
    let elecT       = 0;

    const COARSE_N = 26; // balayage grossier sur toute la courbe
    const FINE_N   = 10; // affinage local autour du meilleur point trouvé

    function findPeak(len) {
      let bestI = 0, minY = Infinity, bx = 0, by = 0;
      for (let i = 0; i <= COARSE_N; i++) {
        const pt = path.getPointAtLength((i / COARSE_N) * len);
        if (pt.y < minY) { minY = pt.y; bestI = i; bx = pt.x; by = pt.y; }
      }
      const lo = Math.max(0, bestI - 1) / COARSE_N * len;
      const hi = Math.min(COARSE_N, bestI + 1) / COARSE_N * len;
      let bl = lo;
      for (let j = 0; j <= FINE_N; j++) {
        const l = lo + (j / FINE_N) * (hi - lo);
        const pt = path.getPointAtLength(l);
        if (pt.y < by) { by = pt.y; bx = pt.x; bl = l; }
      }
      return { x: bx, y: by, len: bl };
    }

    // ── DRAG DU BULLET — déplaçable librement sur toute la courbe ──
    // Une fois saisi et lâché quelque part sur la ligne, il reste à cette
    // position (n'accroche plus automatiquement le pic de la courbe).
    const handle = document.getElementById('tipDotHandle');
    let manualPoint = null;
    let isDragging  = false;

    function clientToSvgPoint(clientX, clientY) {
      const svgEl = path.ownerSVGElement;
      const pt = svgEl.createSVGPoint();
      pt.x = clientX; pt.y = clientY;
      const ctm = svgEl.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const p = pt.matrixTransform(ctm.inverse());
      return { x: p.x, y: p.y };
    }

    function findClosestPoint(px, py, len) {
      const N = 120;
      let bestDist = Infinity, bx = 0, by = 0, bestI = 0;
      for (let i = 0; i <= N; i++) {
        const l = (i / N) * len;
        const pt = path.getPointAtLength(l);
        const d = Math.hypot(pt.x - px, pt.y - py);
        if (d < bestDist) { bestDist = d; bx = pt.x; by = pt.y; bestI = i; }
      }
      const lo = Math.max(0, bestI - 1) / N * len;
      const hi = Math.min(N, bestI + 1) / N * len;
      const FN = 20;
      for (let j = 0; j <= FN; j++) {
        const l = lo + (j / FN) * (hi - lo);
        const pt = path.getPointAtLength(l);
        const d = Math.hypot(pt.x - px, pt.y - py);
        if (d < bestDist) { bestDist = d; bx = pt.x; by = pt.y; }
      }
      return { x: bx, y: by };
    }

    handle.addEventListener('pointerdown', (e) => {
      isDragging = true;
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
      handle.style.cursor = 'grabbing';
      e.preventDefault();
    });
    handle.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const svgPt = clientToSvgPoint(e.clientX, e.clientY);
      manualPoint = findClosestPoint(svgPt.x, svgPt.y, PATH_LEN);
    });
    function endDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      handle.style.cursor = 'grab';
      try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
    // Filet de sécurité : si le relâchement se produit hors de la zone de
    // préhension (ou que le focus quitte la fenêtre pendant le drag), on
    // force quand même la fin du drag — sinon la capture du pointeur peut
    // rester "collée" sur le handle et gêner les clics/survols ailleurs
    // sur la page tant qu'on n'a pas relâché.
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('blur', () => { isDragging = false; handle.style.cursor = 'grab'; });

    function setShockPos(x, y) {
      shock.setAttribute('transform', `translate(${x - 160}, ${y - 12})`);
    }

    function fireShock(x, y) {
      setShockPos(x, y);
      elecPhase = 1;
      elecT = 0;
    }

    function stepShock() {
      elecT += 16;
      const progress = elecT / 600; // 600ms au total
      if (progress >= 1) {
        shock.setAttribute('opacity', 0);
        elecPhase = 0;
        return;
      }
      // Flicker intense : pulses d'opacité aléatoires
      const flicker = progress < 0.15 ? 1
        : progress < 0.3  ? (Math.random() > 0.3 ? 1 : 0.2)
        : progress < 0.55 ? (Math.random() > 0.4 ? 0.9 : 0.1)
        : progress < 0.75 ? (Math.random() > 0.5 ? 0.6 : 0)
        : (1 - progress) * 2;
      shock.setAttribute('opacity', Math.max(0, flicker));
      const scale = 1 + progress * 0.8;
      halo.setAttribute('r',  7  * scale);
      halo2.setAttribute('r', 12 * scale);
      halo.setAttribute('stroke-width',  Math.max(0.1, 1   * (1 - progress)));
      halo2.setAttribute('stroke-width', Math.max(0.1, 0.6 * (1 - progress)));
    }

    let cachedRawPeak = null;
    let peakFrameCount = 0;
    let shockFrameCount = 0;
    const PEAK_REFRESH_EVERY = 3; // le pic ne bouge que sur un souffle de 14s :
    // pas besoin de le recalculer à 60fps — 1 frame sur 3 suffit (-66% de
    // getPointAtLength() pour findPeak, le plus gros poste JS par frame).

    function tick() {
      if (document.hidden) { requestAnimationFrame(tick); return; } // onglet en fond : on ne calcule rien
      const len = PATH_LEN; // mis en cache une fois (courbe statique) au lieu d'un appel/frame

      // Pic de la courbe → tooltip + point blanc (ou position saisie à la main).
      // En mode auto (pas de manualPoint), léger va-et-vient gauche→droite,
      // assez lent, en glissant le long de la courbe autour du pic.
      let peak;
      if (manualPoint) {
        peak = manualPoint;
      } else {
        if (!cachedRawPeak || peakFrameCount % PEAK_REFRESH_EVERY === 0) {
          cachedRawPeak = findPeak(len);
        }
        peakFrameCount++;
        const DRIFT_MOVE = 5500;    // ms pour un aller simple (gauche→droite ou droite→gauche), même vitesse qu'avant
        const DRIFT_HOLD = 1500;    // ms de pause à chaque extrémité avant de repartir dans l'autre sens
        const DRIFT_AMP = 105;      // largeur totale de parcours +100px (55 -> 105, soit +50 de chaque côté = +100 au total)
        const DRIFT_OFFSET = 100;   // position remise comme avant (pas de déplacement, juste extension de la largeur)
        const DRIFT_CYCLE = (DRIFT_MOVE + DRIFT_HOLD) * 2;
        const dCycle = Date.now() % DRIFT_CYCLE;
        let driftLen;
        if (dCycle < DRIFT_MOVE) {
          // gauche -> droite, easing doux (comme avant)
          const p = dCycle / DRIFT_MOVE;
          const eased = 0.5 - 0.5 * Math.cos(p * Math.PI);
          driftLen = -DRIFT_AMP + eased * (2 * DRIFT_AMP);
        } else if (dCycle < DRIFT_MOVE + DRIFT_HOLD) {
          // pause de 1.5s à droite
          driftLen = DRIFT_AMP;
        } else if (dCycle < DRIFT_MOVE * 2 + DRIFT_HOLD) {
          // droite -> gauche, easing doux
          const p = (dCycle - DRIFT_MOVE - DRIFT_HOLD) / DRIFT_MOVE;
          const eased = 0.5 - 0.5 * Math.cos(p * Math.PI);
          driftLen = DRIFT_AMP - eased * (2 * DRIFT_AMP);
        } else {
          // pause de 1.5s à gauche
          driftLen = -DRIFT_AMP;
        }
        const targetLen = Math.min(len, Math.max(0, cachedRawPeak.len + DRIFT_OFFSET + driftLen));
        const dp = path.getPointAtLength(targetLen);
        peak = { x: dp.x, y: dp.y };
      }
      const liveVisitorValue = yToVisitorCount(peak.y);
      window.__currentVisitorValue = liveVisitorValue;
      if (countEl && !window.__visitorCountUpActive) {
        countEl.textContent = liveVisitorValue;
      }
      updatePctPill(liveVisitorValue);
      dotOuter.setAttribute('cx', peak.x);
      dotOuter.setAttribute('cy', peak.y);
      dotInner.setAttribute('cx', peak.x);
      dotInner.setAttribute('cy', peak.y);
      handle.setAttribute('cx', peak.x);
      handle.setAttribute('cy', peak.y);
      tipLine.setAttribute('x1', peak.x);
      tipLine.setAttribute('x2', peak.x);
      const cx = (peak.x + 12 + CARD_W > SVG_W) ? peak.x - CARD_W - 12 : peak.x + 12;
      const floatY = Math.sin(Date.now() / 600) * 4.5; // flottement au repos ×1.5 encore plus intense (3px → 4.5px)
      tipCard.setAttribute('transform', `translate(${cx},${peak.y - 60 + floatY})`);

      // Point vert qui voyage sur la courbe → étincelle au contact du point blanc.
      // Vérifié 1 frame sur 2 (~30fps) : getPointAtLength() force un reflow SVG,
      // et la marge de detection (THRESHOLD=18px) absorbe largement cette baisse
      // d'échantillonnage — invisible à l'œil, moitié moins de reflows.
      shockFrameCount++;
      if (shockFrameCount % 2 === 0) {
        const t  = (performance.now() % DURATION) / DURATION;
        const pt = path.getPointAtLength(t * len);
        const dist = Math.hypot(pt.x - peak.x, pt.y - peak.y);
        if (dist < THRESHOLD && elecPhase === 0) fireShock(peak.x, peak.y);
      }
      if (elecPhase === 1) stepShock();

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();
  (function() {
    const dotsBg = document.getElementById('dotsBg');
    // Profilage réel (trace Chrome) : ce système d'anneaux 3D (rotateX +
    // preserve-3d + perspective, répété sur 8 contextes 3D indépendants)
    // est de loin le plus coûteux de la page — largement devant les flous.
    // On passe de 8 à 5 anneaux (on retire les 3 plus grands/plus discrets,
    // souvent hors-cadre) et on réduit encore les points par anneau :
    // ~490 nœuds animés à l'origine → ~93 ici, et 3 contextes 3D en moins.
    // Nouvelle passe d'allègement CPU (2026-08) : ~93 → ~60 points animés
    // (-35%), densité visuelle compensée par une taille de point légèrement
    // plus grande — l'anneau reste plein à l'œil avec ~1/3 de nœuds en moins.
    const rings = [
      { r: 336,  dots: 8,  size: 3.2, color: 'rgba(168,85,247,0.9)',  glow: 'rgba(168,85,247,0.6)',  dur: 18, delay: 0    },
      { r: 416,  dots: 10, size: 3.2, color: 'rgba(139,92,246,0.75)', glow: 'rgba(139,92,246,0.45)', dur: 25, delay: -3   },
      { r: 504,  dots: 12, size: 2.7, color: 'rgba(99,102,241,0.65)', glow: 'rgba(99,102,241,0.35)', dur: 33, delay: -7   },
      { r: 600,  dots: 14, size: 2.2, color: 'rgba(79,70,229,0.55)',  glow: 'rgba(79,70,229,0.28)',  dur: 42, delay: -12  },
      { r: 704,  dots: 16, size: 2.2, color: 'rgba(59,130,246,0.45)', glow: 'rgba(59,130,246,0.22)', dur: 52, delay: -18  },
    ];
    const ringsWrap = document.createElement('div');
    ringsWrap.style.cssText = 'position:absolute;top:calc(50% - 80px);left:50%;transform:translate(-50%,-50%);width:0;height:0;';
    dotsBg.appendChild(ringsWrap);
    rings.forEach(ring => {
      const ringEl = document.createElement('div');
      ringEl.className = 'dot-ring';
      ringEl.style.cssText = `width:${ring.r*2}px;height:${ring.r*2}px;left:${-ring.r}px;top:${-ring.r}px;animation-duration:${ring.dur}s;animation-delay:${ring.delay}s;`;
      for (let i = 0; i < ring.dots; i++) {
        const angle = (i / ring.dots) * 2 * Math.PI;
        const x = ring.r + ring.r * Math.cos(angle);
        const y = ring.r + ring.r * Math.sin(angle);
        const dot = document.createElement('div');
        dot.className = 'dot-point';
        const pulseDur  = 2.2 + Math.random() * 2.5;
        const pulseDelay = -(Math.random() * pulseDur);
        dot.style.cssText = `width:${ring.size*2}px;height:${ring.size*2}px;left:${x}px;top:${y}px;background:${ring.color};box-shadow:0 0 ${ring.size*3}px ${ring.glow},0 0 ${ring.size*7}px ${ring.glow};animation-duration:${pulseDur}s;animation-delay:${pulseDelay}s;`;
        ringEl.appendChild(dot);
      }
      ringsWrap.appendChild(ringEl);
    });
  })();

  // ── PARTICLES ── (13 au lieu de 20 : même effet d'ambiance, nœuds animés
  // réduits encore, densité compensée par des délais plus resserrés)
  (function() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 13; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      // Cycle un peu plus court + délais resserrés : compense la densité
      // visuelle malgré 2x moins de particules (moins de nœuds animés en
      // permanence, sensation de "pluie" de particules quasi identique).
      p.style.cssText = `left:${Math.random()*100}%;width:${Math.random()*2+1}px;height:${Math.random()*2+1}px;animation-duration:${Math.random()*7+6}s;animation-delay:${Math.random()*5}s;background:${Math.random()>0.5?'rgba(168,85,247,0.6)':'rgba(59,130,246,0.6)'};box-shadow:0 0 ${Math.random()*4+2}px ${Math.random()>0.5?'rgba(168,85,247,0.8)':'rgba(59,130,246,0.8)'};`;
      container.appendChild(p);
    }
  })();

  // (L'effet "étincelle électrique" est désormais géré dans la boucle
  // GRAPH LINE TRACKER ci-dessus — fusionné pour éviter une 2e boucle rAF
  // qui recalculait la même géométrie SVG.)

  const hit = document.getElementById('circleHit');
  const svg = document.getElementById('cableSvg');

  hit.addEventListener('mouseenter', () => {
    svg.classList.add('hovered');
  });
  hit.addEventListener('mouseleave', () => {
    svg.classList.remove('hovered');
  });

  hit.addEventListener('click', () => {
    svg.classList.remove('bouncing');
    void svg.offsetWidth; // reflow to restart animation
    svg.classList.add('bouncing');
    svg.addEventListener('animationend', (e) => {
      if (e.animationName === 'bounce-circle') {
        svg.classList.remove('bouncing');
      }
    }, { once: true });
  });

  // ── COMPTEUR VISITEURS — count-up 0 → valeur courante (suit le bullet) ──
  // Le reste du temps, le chiffre est mis à jour en continu par le GRAPH
  // LINE TRACKER (il suit la hauteur de la courbe sous le bullet). Ici, on
  // rejoue juste un petit count-up 0→valeur à chaque hover, clic, et
  // automatiquement toutes les 10s — vers la valeur ACTUELLE du bullet,
  // plus une valeur fixe.
  (function() {
    const countEl = document.getElementById('tipVisitorCount');
    const cardEl  = document.querySelector('.tip-card-inner');
    if (!countEl || !cardEl) return;

    window.__visitorCountUpActive = false;
    const DURATION = 900; // ms
    let raf = null;

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function runCountUp() {
      const target = window.__currentVisitorValue || 852;
      window.__visitorCountUpActive = true;
      if (raf) cancelAnimationFrame(raf);
      const start = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - start) / DURATION);
        const eased = easeOutExpo(t);
        countEl.textContent = Math.round(eased * target);
        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          countEl.textContent = target;
          raf = null;
          window.__visitorCountUpActive = false; // rend la main au tracker continu
        }
      }
      raf = requestAnimationFrame(tick);
    }

    cardEl.addEventListener('mouseenter', runCountUp);
    cardEl.addEventListener('click', runCountUp);

    setInterval(() => {
      if (document.hidden) return;
      runCountUp();
    }, 10000);
  })();

  // ── CUSTOM CURSOR (injecté depuis cursorcustomfinal.html) ──
  // Actif uniquement si l'appareil a un vrai pointeur fin (souris) —
  // matchMedia évite de casser l'usage tactile (pas de curseur natif caché
  // sans remplacement si personne ne bouge de souris).
  (function() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    document.documentElement.classList.add('custom-cursor-active');

    const blur = document.getElementById('sk-cursor-blur');
    const ring = document.getElementById('skCursorRing');
    const dot  = document.getElementById('skCursorDot');

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let trailTimer = null;

    // Le mousemove ne fait plus QUE mémoriser mx/my (peut arriver à >120Hz
    // sur certaines souris/trackpads) : plus aucune écriture de style ici,
    // donc plus aucun layout forcé par event. Tout l'affichage (dot, blur,
    // ring) est appliqué une seule fois par frame dans la boucle rAF
    // ci-dessous, avec transform (compositor GPU) plutôt que left/top.
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;

      clearTimeout(trailTimer);
      trailTimer = setTimeout(() => {
        const t = document.createElement('div');
        t.className = 'sk-cursor-trail';
        const sz = 6 + Math.random() * 8;
        t.style.cssText = `width:${sz}px;height:${sz}px;left:${mx}px;top:${my}px;`;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 550);
      }, 40);
    });

    function animRing() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      // Le ring garde left/top : son transform est déjà occupé par
      // l'animation CSS skCursorPulse (translate + scale), donc on ne peut
      // pas y superposer un translate3d de position sans conflit de cascade.
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      // dot / blur n'ont aucune animation CSS sur `transform` : libres de
      // l'utiliser pour la position (compositor GPU, pas de layout).
      dot.style.transform   = `translate3d(${mx}px, ${my}px, 0) translate(-50%,-50%)`;
      blur.style.transform  = `translate3d(${mx}px, ${my}px, 0) translate(-50%,-50%)`;
      requestAnimationFrame(animRing);
    }
    animRing();

    document.addEventListener('mousedown', () => ring.classList.add('is-clicking'));
    document.addEventListener('mouseup',   () => ring.classList.remove('is-clicking'));

    // Grossit le curseur au survol des éléments interactifs de la page
    const HOVER_SELECTOR = 'a, button, .status-dd-item, .status-center, ' +
      '.tip-card-inner, #tipDotHandle, #circleHit, .status-live, ' +
      '.status-dd-home-label, [style*="cursor:pointer"], [style*="cursor: pointer"]';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(HOVER_SELECTOR)) {
        ring.classList.add('is-hovered');
        dot.classList.add('is-hovered');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(HOVER_SELECTOR)) {
        ring.classList.remove('is-hovered');
        dot.classList.remove('is-hovered');
      }
    });
  })();

  // ── LIVE badge : rejoue l'effet de hover automatiquement au repos, toutes les 3.5s ──
  (function() {
    const liveEl = document.querySelector('.status-live');
    if (!liveEl) return;

    let isRealHover = false;
    liveEl.addEventListener('mouseenter', () => { isRealHover = true; });
    liveEl.addEventListener('mouseleave', () => { isRealHover = false; });

    setInterval(() => {
      if (document.hidden) return;
      if (isRealHover) return; // pas de cumul si un vrai survol est en cours
      liveEl.classList.add('auto-burst');
      setTimeout(() => liveEl.classList.remove('auto-burst'), 550);
    }, 3500);
  })();

  // ── TOAST "nouvelle version bientôt" — s'affiche à chaque visite, 10s ──
  (function() {
    const toast = document.getElementById('launchToast');
    const bar   = document.getElementById('launchToastBar');
    const closeBtn = document.getElementById('launchToastClose');
    if (!toast || !bar || !closeBtn) return;

    let dismissTimer = null;

    function dismiss() {
      if (toast.classList.contains('hide')) return;
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 500);
    }

    requestAnimationFrame(() => {
      bar.classList.add('running');
    });

  dismissTimer = setTimeout(dismiss, 10000);
    closeBtn.addEventListener('click', () => {
      clearTimeout(dismissTimer);
      dismiss();
    });
  })();

  // ── Cookies tooltip ──
  (function() {
    var tip = document.getElementById('cookieTip');
    var accept = document.getElementById('cookieAccept');
    var reject = document.getElementById('cookieReject');
    if (!tip || !accept || !reject) return;

    var KEY = 'sb-cookie-consent';

    function setPref(value) {
      try { localStorage.setItem(KEY, value); } catch (e) {}
      tip.classList.remove('show');
      setTimeout(function() { tip.remove(); }, 300);
    }

    try {
      if (localStorage.getItem(KEY)) return;
    } catch (e) {}

    requestAnimationFrame(function() {
      tip.classList.add('show');
    });

    accept.addEventListener('click', function() { setPref('accepted'); });
    reject.addEventListener('click', function() { setPref('rejected'); });
  })();

// ── Mini-funnel "Devis gratuit" ──
  (function() {
    var back = document.getElementById('sbqBack');
    var openBtns = [].slice.call(document.querySelectorAll('.status-header-cta, .status-dd-item.dd-cta'));
    if (!back || !openBtns.length) return;

    var card = back.querySelector('.sbq-card');
    var bar = document.getElementById('sbqBar');
    var stepName = document.getElementById('sbqStepName');
    var stepNum = document.getElementById('sbqStepNum');
    var closeBtn = document.getElementById('sbqClose');
    var backBtn = document.getElementById('sbqBackBtn');
    var email = document.getElementById('sbqEmail');
    var checkOk = document.getElementById('sbqCheckOk');
    var submit = document.getElementById('sbqSubmit');
    var recap = document.getElementById('sbqRecap');
    var doneSub = document.getElementById('sbqDoneSub');
    var steps = [].slice.call(back.querySelectorAll('.sbq-step'));
    var NAMES = ['Type de mission', 'Budget', 'Deadline', 'Email'];
    var TOTAL = 4;
    var cur = 0, data = {};
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var doneTimer = null;

    function setBar() {
      var pct = (cur >= TOTAL) ? 100 : Math.min(100, Math.round((cur / TOTAL) * 100) + 12);
      if (bar) bar.style.width = pct + '%';
      if (cur < TOTAL) {
        if (stepName) stepName.textContent = NAMES[cur];
        if (stepNum) stepNum.textContent = (cur + 1) + '/' + TOTAL;
      } else {
        if (stepName) stepName.textContent = 'Terminé';
        if (stepNum) stepNum.textContent = '4/4';
      }
    }
    function show(i) {
      cur = i;
      steps.forEach(function(s) { s.classList.toggle('is-active', (+s.getAttribute('data-step')) === i); });
      setBar();
      if (backBtn) backBtn.style.visibility = (i > 0 && i < TOTAL) ? 'visible' : 'hidden';
      if (i === 3 && email) { setTimeout(function() { email.focus(); }, 320); }
    }
    function reset() {
      data = {};
      back.querySelectorAll('.sbq-chip.sel').forEach(function(c) { c.classList.remove('sel'); });
      if (email) email.value = '';
      if (checkOk) checkOk.classList.remove('show');
      if (submit) submit.disabled = true;
      show(0);
    }
    function open() {
      reset();
      back.classList.add('open');
      back.setAttribute('aria-hidden', 'false');
      document.body.classList.add('sbq-no-scroll');
    }
    function close() {
      back.classList.remove('open');
      back.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('sbq-no-scroll');
      if (doneTimer) { clearTimeout(doneTimer); doneTimer = null; }
    }

    openBtns.forEach(function(openBtn) {
      openBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); open(); });
    });
    if (closeBtn) closeBtn.addEventListener('click', close);
    back.addEventListener('click', function(e) { if (e.target === back) close(); });
    if (backBtn) backBtn.addEventListener('click', function() { if (cur > 0 && cur < TOTAL) show(cur - 1); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && back.classList.contains('open')) close(); });

    back.querySelectorAll('.sbq-chips').forEach(function(group) {
      group.addEventListener('click', function(e) {
        var chip = e.target.closest('.sbq-chip'); if (!chip) return;
        group.querySelectorAll('.sbq-chip').forEach(function(c) { c.classList.remove('sel'); });
        chip.classList.add('sel');
        data[group.getAttribute('data-key')] = chip.getAttribute('data-val');
        setTimeout(function() { if (cur < 3) show(cur + 1); }, 280);
      });
    });

    if (email && submit) {
      email.addEventListener('input', function() {
        var ok = EMAIL_RE.test(email.value.trim());
        submit.disabled = !ok;
        if (checkOk) checkOk.classList.toggle('show', ok);
      });
      email.addEventListener('keydown', function(e) { if (e.key === 'Enter' && !submit.disabled) submit.click(); });
      submit.addEventListener('click', function() {
        if (!EMAIL_RE.test(email.value.trim())) return;
        data.email = email.value.trim();
        if (doneSub) {
          doneSub.innerHTML = 'Mission : <b>' + (data.mission || '&mdash;') + '</b>'
            + '<br>Budget : <b>' + (data.budget || '&mdash;') + '</b> &middot; <b>' + (data.deadline || '&mdash;') + '</b>'
            + '<br>Votre devis a &eacute;t&eacute; envoy&eacute; vers <b>' + data.email + '</b>.';
        }
        show(4);
        doneTimer = setTimeout(close, 15000);
      });
    }
  })();
