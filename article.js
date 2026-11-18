/* =========================================================
   기사 본문 동작
   1) 화면에 들어오면 나타나는 그래프·일러스트 (.is-in)
   2) 그래프 ① 추이(막대+선) 그리기, 그래프 호버 툴팁
   3) 용어 풀이 툴팁 (원고 각주)
   4) 왼쪽 챕터 목차
   ========================================================= */
(function(){
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  const fmt = n => n.toLocaleString('ko-KR');

  /* ---------- 공용 툴팁 (그래프) ---------- */
  const tip = document.createElement('div'); tip.className = 'ch-tip'; tip.setAttribute('role','tooltip'); document.body.appendChild(tip);
  function showTip(html, x, y){
    tip.innerHTML = html; tip.style.display = 'block';
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let left = x + 14, top = y - h - 12;
    if (left + w > innerWidth - 8) left = x - w - 14;
    if (top < 8) top = y + 18;
    tip.style.left = Math.max(8, left) + 'px'; tip.style.top = top + 'px';
  }
  function hideTip(){ tip.style.display = 'none'; }
  addEventListener('scroll', hideTip, {passive:true});

  /* ---------- 그래프 ① 소규모학교 비율 + 학령인구 ---------- */
  const TREND = {
    years: [2016,2017,2018,2019,2020,2021,2022,2023,2024,2025],
    ratio: [23,23.8,24.3,25.2,26.4,26.7,27.4,28.7,30.1,31.3],      // 전체 학교 중 소규모학교 비율(%)
    pop:   [8672,8461,8263,8074,7888,7701,7497,7302,7147,6978]     // 학령인구(천 명)
  };
  function drawTrend(host){
    const W = Math.max(300, host.clientWidth), narrow = W < 560;
    const H = narrow ? 300 : 380, m = {t:34, r:6, b:30, l:6};
    const iw = W - m.l - m.r, ih = H - m.t - m.b, n = TREND.years.length, band = iw / n;
    const bw = band * (narrow ? .7 : .68);
    const yR = v => m.t + ih - v / 40 * ih;          // 비율 0~40%
    const yP = v => m.t + ih - v / 20000 * ih;       // 학령인구 0~2,000만 명(천 명 단위 20,000)
    const cx = i => m.l + band * i + band / 2;
    host.innerHTML = '';
    const svg = el('svg', {viewBox:`0 0 ${W} ${H}`, width:W, height:H, 'aria-hidden':'true'}, host);
    const fs = narrow ? 11 : 15;
    // 좁은 화면: 숫자가 겹치지 않게 3년 간격(2016·2019·2022·2025)만 표시, 나머지는 툴팁
    const showLbl = i => !narrow || i % 3 === 0;
    const cols = [];
    TREND.years.forEach((yr, i) => {
      const g = el('g', {class:'col'}, svg);
      el('rect', {class:'hl', x:cx(i)-band/2, y:m.t-30, width:band, height:ih+30}, g);
      const y0 = yP(TREND.pop[i]);
      const r = el('rect', {class:'bar', x:cx(i)-bw/2, y:y0, width:bw, height:m.t+ih-y0, rx:2}, g);
      const t = el('text', {class:'bar-v', x:cx(i), y:y0-7, 'font-size':fs}, g); t.textContent = showLbl(i) ? fmt(TREND.pop[i]) : '';
      const yl = el('text', {class:'yr', x:cx(i), y:H-9, 'font-size':narrow?10:12}, g); yl.textContent = narrow ? "'" + String(yr).slice(2) : yr;
      cols.push({g, r, t, y0});
    });
    el('line', {class:'base', x1:m.l, x2:W-m.r, y1:m.t+ih+.5, y2:m.t+ih+.5}, svg);
    const d = TREND.ratio.map((v,i) => (i?'L':'M') + cx(i).toFixed(1) + ' ' + yR(v).toFixed(1)).join(' ');
    const line = el('path', {class:'line', d}, svg);
    const dots = TREND.ratio.map((v,i) => {
      const c = el('circle', {class:'dot', cx:cx(i), cy:yR(v), r:narrow?4:5.5}, svg);
      const t = el('text', {class:'dot-v', x:cx(i), y:yR(v)-12, 'font-size':fs}, svg); t.textContent = showLbl(i) ? v + '%' : '';
      return [c, t];
    });
    // 호버: 연도별 툴팁
    TREND.years.forEach((yr, i) => {
      const hit = el('rect', {class:'hit', x:cx(i)-band/2, y:m.t-30, width:band, height:ih+30+m.b}, svg);
      const on = e => {
        cols.forEach((c,j) => c.g.classList.toggle('on', j === i));
        showTip(`<b>${yr}년</b><i style="background:#F2A04B"></i>소규모학교 비율 ${TREND.ratio[i]}%<br><i style="background:#E5FB8F"></i>학령인구 ${fmt(TREND.pop[i])}천 명`, e.clientX, e.clientY);
      };
      hit.addEventListener('pointermove', on); hit.addEventListener('pointerdown', on);
      hit.addEventListener('pointerleave', () => { cols.forEach(c => c.g.classList.remove('on')); hideTip(); });
    });
    // 등장: 막대가 차례로 자라고 → 선이 그어짐
    if (reduce || host.dataset.shown) return;
    const len = line.getTotalLength();
    cols.forEach((c, i) => {
      c.r.style.transformBox = 'fill-box'; c.r.style.transformOrigin = 'bottom';
      c.r.style.transform = 'scaleY(0)'; c.t.style.opacity = 0;
      c.r.style.transition = `transform .9s cubic-bezier(.2,.7,.2,1) ${i*60}ms`; c.t.style.transition = `opacity .4s ${600+i*60}ms`;
    });
    line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
    line.style.transition = 'stroke-dashoffset 1.4s ease-in-out 1s';
    dots.forEach(([c,t], i) => { c.style.opacity = t.style.opacity = 0; c.style.transition = t.style.transition = `opacity .35s ${1000 + i*140}ms`; });
    host._play = () => {
      host.dataset.shown = '1';
      cols.forEach(c => { c.r.style.transform = 'none'; c.t.style.opacity = 1; });
      line.style.strokeDashoffset = 0;
      dots.forEach(([c,t]) => { c.style.opacity = t.style.opacity = 1; });
    };
  }
  document.querySelectorAll('.g-trend__plot').forEach(host => {
    drawTrend(host);
    let lw = host.clientWidth;
    addEventListener('resize', () => { if (Math.abs(host.clientWidth - lw) > 20){ lw = host.clientWidth; drawTrend(host); } });
  });

  /* ---------- 그래프 ② 학교급별 비중: 막대 호버 툴팁 ---------- */
  document.querySelectorAll('[data-tip]').forEach(n => {
    const html = () => { const [a,b,c] = n.dataset.tip.split('|'); return `<b>${a}</b>${b}<br>${c}`; };
    n.addEventListener('pointermove', e => showTip(html(), e.clientX, e.clientY));
    n.addEventListener('pointerdown', e => showTip(html(), e.clientX, e.clientY));
    n.addEventListener('pointerleave', hideTip);
  });

  /* ---------- 강원도 와플: 인구감소지역 38곳 + 그 외 8곳 ---------- */
  document.querySelectorAll('.g-waffle .grid').forEach(w => {
    const dec = +w.dataset.dec, other = +w.dataset.other;
    for (let i = 0; i < dec + other; i++){
      const sq = document.createElement('i');
      if (i < dec) sq.className = 'dec';
      sq.style.transitionDelay = (i * 22) + 'ms';
      w.appendChild(sq);
    }
  });

  /* ---------- 화면에 들어오면 나타남 ---------- */
  const targets = document.querySelectorAll('.reveal, .g-share, .g-merge, .g-dist, .g-waffle, .g-pop, .g-fund, .g-trend');
  const play = t => { t.classList.add('is-in'); const p = t.querySelector('.g-trend__plot'); if (p && p._play) p._play(); };
  if ('IntersectionObserver' in window && !reduce){
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ play(e.target); io.unobserve(e.target); } }),
      {rootMargin:'0px 0px -18% 0px'});
    targets.forEach(t => io.observe(t));
  } else targets.forEach(play);

  /* ---------- 용어 풀이 툴팁 (원고 각주) ---------- */
  const gloss = document.createElement('div'); gloss.className = 'gloss'; gloss.setAttribute('role','tooltip'); gloss.id = 'gloss';
  document.body.appendChild(gloss);
  let glossOn = null;
  function showGloss(t){
    if (glossOn) glossOn.classList.remove('on');
    glossOn = t; t.classList.add('on');
    gloss.innerHTML = '';
    const b = document.createElement('b'); b.textContent = t.dataset.glossTitle || '';
    gloss.append(b, document.createTextNode(t.dataset.gloss || ''));
    gloss.classList.add('on');
    const r = t.getBoundingClientRect(), gw = gloss.offsetWidth, gh = gloss.offsetHeight;
    let x = r.left, y = r.top - gh - 8;
    if (y < 4) y = r.bottom + 8;                        // 위에 자리가 없으면 아래로
    x = Math.min(Math.max(8, x), innerWidth - gw - 8);
    gloss.style.left = x + 'px'; gloss.style.top = y + 'px';
    t.setAttribute('aria-describedby', 'gloss');
  }
  function hideGloss(){ if (glossOn){ glossOn.classList.remove('on'); glossOn.removeAttribute('aria-describedby'); } glossOn = null; gloss.classList.remove('on'); }
  document.querySelectorAll('.term').forEach(t => {
    t.addEventListener('mouseenter', () => showGloss(t));
    t.addEventListener('mouseleave', hideGloss);
    t.addEventListener('focus', () => showGloss(t));
    t.addEventListener('blur', hideGloss);
    t.addEventListener('click', e => { e.stopPropagation(); glossOn === t ? hideGloss() : showGloss(t); });
  });
  document.addEventListener('click', hideGloss);
  addEventListener('scroll', hideGloss, {passive:true});

  /* ---------- 왼쪽 챕터 목차 ---------- */
  const toc = document.querySelector('.toc');
  if (toc){
    const links = Array.from(toc.querySelectorAll('a'));
    const secs = links.map(a => document.querySelector(a.getAttribute('href')));
    const fill = toc.querySelector('.fill'), rail = toc.querySelector('.rail');
    const fulls = Array.from(document.querySelectorAll('.viz--full'));
    let ticking = false;
    function update(){
      ticking = false;
      const vh = innerHeight, mid = vh * .45;
      const first = secs[0].getBoundingClientRect();
      const last = secs[secs.length-1].getBoundingClientRect();
      toc.classList.toggle('show', first.top < vh * .6 && last.bottom > vh * .3);
      // 현재 챕터
      let cur = 0;
      secs.forEach((s, i) => { if (s.getBoundingClientRect().top <= mid) cur = i; });
      links.forEach((a, i) => a.setAttribute('aria-current', i === cur ? 'true' : 'false'));
      // 배경 밝기에 맞춘 글자색
      const light = secs[cur].classList.contains('sec--light');
      toc.classList.toggle('on-light', light);
      // 진행 선: 현재 챕터 항목까지 + 챕터 안에서 읽은 만큼 다음 항목 쪽으로
      const r = secs[cur].getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, r.height)));
      const railTop = rail.getBoundingClientRect().top;
      const yOf = i => { const a = links[i]; const b = a.getBoundingClientRect(); return b.top - railTop + 10; };
      const y0 = yOf(cur), y1 = cur < links.length - 1 ? yOf(cur + 1) : rail.offsetHeight;
      fill.style.height = (y0 + (y1 - y0) * p) + 'px';
      // 화면 전체 폭 지도 위에서는 글자를 접음
      const overFull = fulls.some(f => { const b = f.getBoundingClientRect(); return b.top < vh * .5 && b.bottom > vh * .5; });
      toc.classList.toggle('compact', overFull);
    }
    const req = () => { if (!ticking){ ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', req, {passive:true}); addEventListener('resize', req);
    update();
  }
})();
