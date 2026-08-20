/**
 * EACE.ai — "The Daily Audit Tasting" — homepage popup controller
 *
 * Behaviour:
 *  - Picks today's dish via dayIndex = date.getDate() % michelinMenu.length
 *    (40 entries → never repeats within a calendar month).
 *  - Renders once the visitor has scrolled ~35% into the page — never on
 *    page load, so it never blocks the hero or first impression.
 *  - Shows at most once per calendar day (localStorage), and never blocks
 *    the page (no overlay, no scroll lock) — it's a corner card, dismissible.
 *  - Wave's line is a SEPARATE reveal: hidden until the visitor explicitly
 *    clicks "What does this mean for me?" — it never renders automatically
 *    alongside Alba/Kai, and never merges into their text.
 *
 * Requires daily-tasting-data.js (michelinMenu, waveBridgeLines) loaded first.
 */
(function(){
  if(typeof michelinMenu==='undefined'||!michelinMenu.length) return;

  var STORAGE_KEY='eace_tasting_seen_v1';
  var SCROLL_THRESHOLD=0.35; // fraction of scrollable page height
  var DWELL_MS=4000; // card must stay visible this long before counting as "seen"

  function todayStamp(d){
    d=d||new Date();
    return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
  }

  function alreadyShownToday(){
    try{
      var v=localStorage.getItem(STORAGE_KEY);
      return v===todayStamp();
    }catch(e){ return false; }
  }

  function markShownToday(){
    try{ localStorage.setItem(STORAGE_KEY, todayStamp()); }catch(e){}
  }

  function buildCard(dish, waveLine, dayIndex){
    var card=document.createElement('div');
    card.className='tasting-card';
    card.id='tasting-card';
    card.setAttribute('role','complementary');
    card.setAttribute('aria-label','Daily Audit Tasting — '+dish.title);

    function esc(s){
      var d=document.createElement('div');
      d.textContent=s;
      return d.innerHTML;
    }

    card.innerHTML=
      '<div class="tasting-head">'+
        '<span class="tasting-eyebrow">Today&rsquo;s Audit Tasting</span>'+
        '<button type="button" class="tasting-close" aria-label="Dismiss today\'s tasting">&times;</button>'+
      '</div>'+
      '<p class="tasting-title">'+esc(dish.title)+'</p>'+
      '<p class="tasting-meta">'+esc(dish.meta)+'</p>'+
      '<div class="tasting-persona">'+
        '<div class="tasting-avatar is-alba" aria-hidden="true">A</div>'+
        '<div class="tasting-say">'+
          '<p class="tasting-name is-alba">Alba</p>'+
          '<p class="tasting-text is-alba">'+esc(dish.alba)+'</p>'+
        '</div>'+
      '</div>'+
      '<div class="tasting-persona">'+
        '<div class="tasting-avatar is-kai" aria-hidden="true">K</div>'+
        '<div class="tasting-say">'+
          '<p class="tasting-name is-kai">Kai</p>'+
          '<p class="tasting-text is-kai">'+esc(dish.kai)+'</p>'+
        '</div>'+
      '</div>'+
      '<div class="tasting-action"><b>Action:</b> '+esc(dish.action)+'</div>'+
      '<div class="tasting-wave" id="tasting-wave">'+
        '<div class="tasting-avatar is-wave" aria-hidden="true">W</div>'+
        '<div class="tasting-say">'+
          '<p class="tasting-name is-wave">Wave</p>'+
          '<p class="tasting-text">'+esc(waveLine)+'</p>'+
        '</div>'+
      '</div>'+
      '<div class="tasting-foot">'+
        '<button type="button" class="tasting-wave-btn" id="tasting-wave-btn" aria-expanded="false" aria-controls="tasting-wave">What does this mean for me?</button>'+
        '<span class="tasting-count">Dish '+(dayIndex+1)+' / '+michelinMenu.length+'</span>'+
      '</div>';

    return card;
  }

  function dismiss(card, dwellTimer){
    clearTimeout(dwellTimer);
    card.classList.remove('show');
    markShownToday();
    setTimeout(function(){ if(card.parentNode) card.parentNode.removeChild(card); }, 400);
  }

  function showTastingCard(){
    if(document.getElementById('tasting-card')) return;

    var dayIndex=new Date().getDate() % michelinMenu.length;
    var dish=michelinMenu[dayIndex];
    var waveLine=(typeof waveBridgeLines!=='undefined'&&waveBridgeLines[dayIndex])
      ? waveBridgeLines[dayIndex]
      : '';

    var card=buildCard(dish, waveLine, dayIndex);
    document.body.appendChild(card);

    var dwellTimer=setTimeout(markShownToday, DWELL_MS);

    card.querySelector('.tasting-close').addEventListener('click', function(){ dismiss(card, dwellTimer); });

    var waveBtn=card.querySelector('#tasting-wave-btn');
    var wavePanel=card.querySelector('#tasting-wave');
    if(waveBtn&&wavePanel&&waveLine){
      waveBtn.addEventListener('click', function(){
        var open=wavePanel.classList.toggle('open');
        waveBtn.setAttribute('aria-expanded', open?'true':'false');
        waveBtn.textContent=open?'Hide':'What does this mean for me?';
      });
    } else if(waveBtn){
      waveBtn.style.display='none';
    }

    // Force reflow so the enter transition runs, then show.
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ card.classList.add('show'); });
    });
  }

  function scrollFraction(){
    var doc=document.documentElement;
    var scrollable=(doc.scrollHeight - doc.clientHeight);
    if(scrollable<=0) return 1;
    return window.scrollY / scrollable;
  }

  function initTasting(){
    if(alreadyShownToday()) return;

    var triggered=false;
    function onScroll(){
      if(triggered) return;
      if(scrollFraction() >= SCROLL_THRESHOLD){
        triggered=true;
        window.removeEventListener('scroll', onScroll);
        showTastingCard();
      }
    }
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll(); // covers the case where the page loads already scrolled
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', initTasting);
  } else {
    initTasting();
  }
})();
