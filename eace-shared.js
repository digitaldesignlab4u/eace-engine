/* ═══════════════════════════════════════════════════
   EACE SHARED JS — eace-shared.js
   Includes: favicon, nav scroll, P1 check,
   scroll-to-top, cookie consent system
═══════════════════════════════════════════════════ */

/* ── FAVICON — 9 dots SVG, all gold, transparent bg (best for browser tabs) ── */
(function(){
  var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="4" fill="#0c0c0a"/><g vector-effect="non-scaling-stroke"><circle cx="8" cy="8" r="2.8" fill="#b8995a"/><circle cx="16" cy="8" r="2.8" fill="#b8995a"/><circle cx="24" cy="8" r="2.8" fill="#b8995a"/><circle cx="8" cy="16" r="2.8" fill="#b8995a"/><circle cx="16" cy="16" r="2.8" fill="#b8995a"/><circle cx="24" cy="16" r="2.8" fill="#b8995a"/><circle cx="8" cy="24" r="2.8" fill="#b8995a"/><circle cx="16" cy="24" r="2.8" fill="#b8995a"/><circle cx="24" cy="24" r="2.8" fill="#b8995a"/></g></svg>';
  var link=document.createElement('link');
  link.rel='icon';link.type='image/svg+xml';
  link.href='data:image/svg+xml,'+encodeURIComponent(svg);
  document.head.appendChild(link);
})();

/* ── SCROLL TO TOP (function only — listener in page inline script) ── */
function scrollTop(){window.scrollTo({top:0,behavior:'smooth'});}

/* ── P1 SCOPE CHECK — stays in section, processing effect ── */
function runP1Check(){
  var q1=document.getElementById('p1-q1');
  var q2=document.getElementById('p1-q2');
  var q3=document.getElementById('p1-q3');
  if(!q1)return;
  [q1,q2,q3].forEach(function(s){
    if(s&&s.value)s.classList.add('has-value');
    else if(s)s.classList.remove('has-value');
  });
  var v1=q1.value,v2=q2?q2.value:'',v3=q3?q3.value:'';
  if(!v1)return;
  var result=document.getElementById('p1-result');
  var eng=document.getElementById('p1-engine');
  var desc=document.getElementById('p1-desc');
  var light=document.getElementById('p1-traffic');
  var note=document.getElementById('p1-note');
  if(!result)return;

  // Show processing state
  result.style.display='block';
  if(light)light.style.background='var(--line2)';
  if(eng)eng.textContent='Running P1 classification…';
  if(desc)desc.textContent='';
  if(note)note.style.opacity='0.3';
  result.scrollIntoView({behavior:'smooth',block:'nearest'});

  // 0.6s processing delay — feels like engine is working
  setTimeout(function(){
    if(note)note.style.opacity='1';
    var color,title,text;
    if(v1==='no'){
      color='#6b8f71';
      title='EU AI Act likely does not apply';
      text='If your system does not operate in, or affect persons in, the EU, the EU AI Act territorial scope (Art. 2) is not triggered. P1 confirms this with a full territorial scope analysis including provider location, deployer location, and output jurisdiction — and identifies whether GDPR or ePrivacy still apply independently.';
    } else if(v1==='unsure'){
      color='#b8995a';
      title='Run P1 — Territorial Scope & Risk Classification first';
      text='Territorial scope is the first determination P1 makes. It analyses your system\'s connection to the EU market across provider, deployer, and affected-person dimensions before any risk classification begins. Unsure inputs receive a conservative (broad) scope assessment.';
    } else if(v3==='yes'){
      color='#c0392b';
      title='High-risk pathway — Annex III classification required';
      text='Operating in a regulated sector triggers full Annex III classification. P1 performs a point-by-point analysis across 8 Annex III categories (including biometrics, critical infrastructure, employment, education, law enforcement, migration, justice, and GPAI dependency), runs Art. 5 prohibited practices clearance across all 8 prohibited practice screens, assesses GDPR/ePrivacy alignment, maps national authorities, and generates the implementation timeline and regulatory delta — before routing to the high-risk obligation stack (Arts. 9–17, 43) or the Art. 6(3) exception pathway.';
    } else if(v2==='yes'){
      color='#b8995a';
      title='Limited-risk pathway — Art. 50/52 transparency obligations';
      text='Transparency triggers (user interaction, emotion recognition, biometric categorisation, synthetic content, GPAI dependency) activate Art. 50 and/or Art. 52 obligations. P1 confirms which specific triggers apply across 16 trigger modules, checks for Art. 6(3) exception eligibility, and routes to the limited-risk and transparency part of the engine.';
    } else if(v2==='no'&&v3==='no'){
      color='#6b8f71';
      title='Minimal-risk pathway — Art. 95 general duties';
      text='If no Annex III category and no Art. 50/52 triggers are confirmed, P1 routes to the minimal-risk pathway. Art. 95 applies — no specific EU AI Act obligations. The engine generates the minimal-risk documentation package, GDPR/ePrivacy mini-analysis, voluntary code of conduct recommendations, and a national overlay report.';
    } else {
      color='#b8995a';
      title='Full P1 classification required';
      text='Your system\'s inputs require P1\'s complete 19-output classification sequence — territorial scope, Art. 5 clearance (8 screens), Annex III analysis (8 categories), GPAI dependency check, GDPR/ePrivacy alignment, national authority mapping, standards guidance, implementation timeline, and regulatory delta.';
    }
    if(light){light.style.background=color;light.style.transition='background 0.3s';}
    if(eng)eng.textContent=title;
    if(desc)desc.textContent=text;
  },600);
}

/* ═══════════════════════════════════════════════════
   COOKIE CONSENT SYSTEM
   Scanned cookies/embeds:
   ESSENTIAL: None set by this site (static HTML)
   ANALYTICS: Plausible (cookieless, opt-in)
   EMBEDDED MEDIA: YouTube (youtube-nocookie.com)
   EXTERNAL LINKS: Gumroad, social media (no cookies set by us)
═══════════════════════════════════════════════════ */
var EACE_CONSENT_KEY='eace_consent_v1';
var consent={essential:true,analytics:false,media:false};

function loadConsent(){
  try{
    var s=localStorage.getItem(EACE_CONSENT_KEY);
    if(s){var p=JSON.parse(s);consent.analytics=!!p.analytics;consent.media=!!p.media;return true;}
  }catch(e){}
  return false;
}

function saveConsent(){
  try{localStorage.setItem(EACE_CONSENT_KEY,JSON.stringify(consent));}catch(e){}
  applyConsent();
}

function applyConsent(){
  // Analytics: enable/disable Plausible
  if(consent.analytics){
    if(!document.getElementById('plausible-script')){
      // Plausible is cookieless — safe to load when user opts in
      // Uncomment and set domain when deployed:
      // var s=document.createElement('script');s.id='plausible-script';
      // s.defer=true;s.setAttribute('data-domain','your-domain.vercel.app');
      // s.src='https://plausible.io/js/script.js';document.head.appendChild(s);
    }
  }
  // Media: YouTube embeds — swap src
  document.querySelectorAll('[data-yt-src]').forEach(function(el){
    if(consent.media){
      if(!el.src||el.src.indexOf('youtube')===-1)el.src=el.getAttribute('data-yt-src');
    } else {
      el.removeAttribute('src');
    }
  });
}

function showBanner(){
  var b=document.getElementById('cookie-banner');
  if(!b)return;
  b.removeAttribute('hidden');
  b.style.display='block';
  setTimeout(function(){b.classList.add('show');},800);
}

function hideBanner(){
  var b=document.getElementById('cookie-banner');
  if(!b)return;
  b.classList.remove('show');
  setTimeout(function(){b.style.display='none';},450);
}

function acceptAll(){
  consent.analytics=true;consent.media=true;
  saveConsent();hideBanner();
  updatePanelToggles();
}

function rejectNonEssential(){
  consent.analytics=false;consent.media=false;
  saveConsent();hideBanner();
  updatePanelToggles();
}

function openPanel(){
  hideBanner();
  var p=document.getElementById('cookie-panel');
  if(p)p.classList.add('show');
  document.body.style.overflow='hidden';
  updatePanelToggles();
}

function closePanel(){
  var p=document.getElementById('cookie-panel');
  if(p)p.classList.remove('show');
  document.body.style.overflow='';
}

function savePanel(){
  var ta=document.getElementById('toggle-analytics');
  var tm=document.getElementById('toggle-media');
  if(ta)consent.analytics=ta.checked;
  if(tm)consent.media=tm.checked;
  saveConsent();closePanel();
}

function updatePanelToggles(){
  var ta=document.getElementById('toggle-analytics');
  var tm=document.getElementById('toggle-media');
  if(ta)ta.checked=consent.analytics;
  if(tm)tm.checked=consent.media;
}

function toggleCcItem(el){
  var item=el.closest('.cc-item');
  if(item)item.classList.toggle('open');
}

// Init — handle both DOMContentLoaded and already-loaded state
function initCookieConsent(){
  var known=loadConsent();
  applyConsent();
  if(!known)showBanner();
  updatePanelToggles();
  var panel=document.getElementById('cookie-panel');
  if(panel)panel.addEventListener('click',function(e){
    if(e.target===panel)closePanel();
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape')closePanel();
  });
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',initCookieConsent);
} else {
  // DOM already ready (script at end of body, DOMContentLoaded already fired)
  initCookieConsent();
}

/* ── SCROLL TO TOP ── */
(function(){
  var btn = document.getElementById('scroll-top');
  if(!btn) return;
  window.addEventListener('scroll', function(){
    btn.classList.toggle('visible', window.scrollY > 400);
  }, {passive:true});
  btn.addEventListener('click', function(){
    window.scrollTo({top:0, behavior:'smooth'});
  });
  // Run once on load
  btn.classList.toggle('visible', window.scrollY > 400);
})();
