/* =========================================================
   시각화 끼우기 (embed)
   - <figure class="viz" data-src="viz/폴더/index.html"> 자리에
     독자가 근처까지 스크롤하면 iframe을 만들어 불러옵니다(지연 로딩).
   - 같은 사이트에서 열리면 iframe 높이를 내용에 맞게 자동 조정합니다.
   - 기사 모드: 지도 위에서 마우스 휠·한 손가락 스와이프가 페이지 스크롤이 되도록
     시각화 파일을 고치지 않고 바깥에서 보정합니다.
     (확대는 +/− 버튼, Ctrl+휠, 두 손가락 핀치로 가능)
     특정 시각화에서 끄려면 figure에 data-article-mode="off".
     휠 확대만 켜려면 figure에 data-wheel-zoom="on" (지도 위에서 휠을 굴리면 확대·축소, 터치 보정은 그대로).
   ========================================================= */
(function(){
  const figures = Array.from(document.querySelectorAll('.viz[data-src]'));

  function articleMode(doc, fig){
    // 휠: Ctrl/⌘ 없이 굴리면 지도 확대 대신 페이지가 스크롤되게 (data-wheel-zoom="on"이면 휠로 지도 확대)
    if(!(fig && fig.dataset.wheelZoom === 'on')) doc.addEventListener('wheel', e => {
      if(!e.ctrlKey && !e.metaKey) e.stopPropagation();
    }, {capture:true});
    // 터치: 한 손가락은 스크롤, 두 손가락부터 지도 조작
    doc.addEventListener('touchstart', e => {
      if(e.touches.length < 2) e.stopPropagation();
    }, {capture:true, passive:true});
    const st = doc.createElement('style');
    st.textContent = '[class$="-stage"],[class$="-stage"] svg{touch-action:pan-y!important}';
    doc.head.appendChild(st);
  }

  function fit(fig, iframe){
    let doc;
    try{ doc = iframe.contentDocument; if(!doc || !doc.body) return; }
    catch(e){ return; } // 다른 출처: 자동 높이 불가 → CSS 최소 높이 사용
    // 기사 웹폰트를 시각화 안에도 연결 (iframe은 바깥 폰트를 물려받지 못함)
    if (!doc.querySelector('link[data-article-fonts]')) {
      const link = doc.createElement('link');
      link.rel = 'stylesheet'; link.dataset.articleFonts = '1';
      link.href = new URL('css/fonts.css', document.baseURI).href;
      doc.head.appendChild(link);
    }
    iframe.style.minHeight = '0'; // 자동 높이가 되면 자리 확보용 최소 높이 해제
    if (fig.classList.contains('viz--full')) { pin(fig, iframe, doc); if(fig.dataset.articleMode !== 'off') articleMode(doc, fig); return; }
    const resize = () => {
      const h = Math.ceil(doc.documentElement.scrollHeight);
      if(h > 0) iframe.style.height = h + 'px';
    };
    resize();
    if('ResizeObserver' in window){
      new ResizeObserver(resize).observe(doc.documentElement);
    }
    iframe.contentWindow.addEventListener('resize', resize);
    if(fig.dataset.articleMode !== 'off') articleMode(doc, fig);
  }

  // 스크롤 지도(②⑤): iframe을 화면 높이로 만들어 기사 페이지에서 고정(sticky)하고,
  // 기사를 스크롤한 만큼 iframe 안쪽을 같은 양만큼 스크롤 → 지도는 브라우저가 직접 고정해 흔들리지 않음
  function pin(fig, iframe, doc){
    doc.documentElement.classList.add('pinned');
    iframe.style.position = 'sticky';
    // 위쪽 고정 탭 막대(.page-tabs) 높이만큼 내려서 고정
    // 막대가 마우스로 잠깐 펼쳐져도 지도는 움직이지 않도록, 접힘 여부에 따른 '기본 높이'를 씀
    const barH = () => {
      if (!document.querySelector('.page-tabs')) return 0;
      const root = document.documentElement, cs = getComputedStyle(root);
      return parseFloat(cs.getPropertyValue(root.classList.contains('tabs-mini') ? '--tabs-mini' : '--tabs-h')) || 0;
    };
    iframe.style.top = barH() + 'px';
    const win = iframe.contentWindow;
    const sync = () => {
      const vh = window.innerHeight - barH(), H = doc.documentElement.scrollHeight;
      const off = Math.min(Math.max(barH() - fig.getBoundingClientRect().top, 0), Math.max(0, H - vh));
      if (Math.abs(win.scrollY - off) > .5) win.scrollTo(0, off);
    };
    const size = () => {
      const vh = window.innerHeight - barH();
      iframe.style.top = barH() + 'px';
      iframe.style.height = vh + 'px';
      fig.style.height = doc.documentElement.scrollHeight + 'px';
      sync();
    };
    size();
    window.addEventListener('scroll', sync, {passive:true});
    window.addEventListener('resize', size);
    if('ResizeObserver' in window) new ResizeObserver(size).observe(doc.body);
  }

  function load(fig){
    if(fig.dataset.loaded) return;
    fig.dataset.loaded = '1';
    const iframe = document.createElement('iframe');
    iframe.title = fig.dataset.title || '인터랙티브 시각화';
    iframe.setAttribute('scrolling','no');
    iframe.addEventListener('load', () => { fig.classList.add('is-loaded'); fit(fig, iframe); });
    iframe.src = fig.dataset.src;
    fig.appendChild(iframe);
  }

  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if(en.isIntersecting){ load(en.target); io.unobserve(en.target); } });
    }, {rootMargin:'800px 0px'});
    figures.forEach(f => io.observe(f));
  } else {
    figures.forEach(load);
  }
})();
