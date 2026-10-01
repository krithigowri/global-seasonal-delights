/* Rasalaya v2 — shared frontend logic (static demo; no backend).
   Demo auth lives ONLY in localStorage and NEVER stores passwords.
   Real accounts (hashed passwords via Supabase Auth) arrive with the backend. */
(function(){
"use strict";
var $=function(s,c){return (c||document).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};

/* ---------- toast ---------- */
function toast(msg){
  var w=$('.toast-wrap');
  if(!w){w=document.createElement('div');w.className='toast-wrap';document.body.appendChild(w);}
  var t=document.createElement('div');t.className='toast';t.textContent=msg;w.appendChild(t);
  setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .4s';setTimeout(function(){t.remove()},450)},3200);
}
window.rasalayaToast=toast;

/* ---------- cookie consent ---------- */
var CONSENT_KEY='rasalaya_consent', CONSENT_VERSION='2026-10-01-v2';
function getConsent(){try{return JSON.parse(localStorage.getItem(CONSENT_KEY)||'null')}catch(e){return null}}
function setConsent(c){c.v=CONSENT_VERSION;c.ts=new Date().toISOString();
  try{localStorage.setItem(CONSENT_KEY,JSON.stringify(c))}catch(e){}}
function showBanner(){$('#cookie-banner').classList.add('show')}
function hideBanner(){$('#cookie-banner').classList.remove('show')}
function initCookies(){
  var b=$('#cookie-banner');if(!b)return;
  if(!getConsent())showBanner();
  $('#cookie-accept').addEventListener('click',function(){
    setConsent({necessary:true,analytics:true,marketing:true,method:'banner-accept'});
    hideBanner();toast('Cookie preferences saved.');syncCookiePage();});
  $('#cookie-reject').addEventListener('click',function(){
    setConsent({necessary:true,analytics:false,marketing:false,method:'banner-reject'});
    hideBanner();toast('Only necessary cookies will be used.');syncCookiePage();});
  var s=$('[data-cookie-settings]');if(s)s.addEventListener('click',function(){location.href='cookies.html'});
  $$('[data-cookie-settings]').forEach(function(el){el.addEventListener('click',function(){location.href='cookies.html'})});
}
function syncCookiePage(){
  var c=getConsent()||{necessary:true,analytics:false,marketing:false};
  var a=$('#ck-analytics'),m=$('#ck-marketing');
  if(a)a.checked=!!c.analytics; if(m)m.checked=!!c.marketing;
  var st=$('#cookie-current');if(st)st.textContent=c.ts?('Saved '+c.ts.slice(0,10)+' via '+c.method):'Not set yet';
}
function initCookiePage(){
  if(!$('#cookie-save'))return;
  syncCookiePage();
  $('#cookie-save').addEventListener('click',function(){
    setConsent({necessary:true,
      analytics:$('#ck-analytics').checked,marketing:$('#ck-marketing').checked,method:'settings-page'});
    syncCookiePage();toast('Cookie preferences saved.');});
}

/* ---------- mobile nav ---------- */
function initNav(){
  var h=$('.hamburger'),l=$('.nav-links');
  if(h&&l)h.addEventListener('click',function(){l.classList.toggle('open')});
  var y=$('[data-year]');if(y)y.textContent=new Date().getFullYear();
}

/* ---------- demo auth (localStorage only; passwords NEVER stored) ---------- */
var USERS_KEY='rasalaya_users', SESSION_KEY='rasalaya_session';
var SEED_EMAIL='taster@rasalaya.org', SEED_PASS='taste1234';
function getUsers(){try{return JSON.parse(localStorage.getItem(USERS_KEY)||'[]')}catch(e){return[]}}
function saveUsers(u){try{localStorage.setItem(USERS_KEY,JSON.stringify(u))}catch(e){}}
function seed(){var u=getUsers();
  if(!u.some(function(x){return x.email===SEED_EMAIL})){
    u.push({name:'Taster',email:SEED_EMAIL,demoSeed:true,createdAt:new Date().toISOString()});saveUsers(u);}}
function currentUser(){try{var e=localStorage.getItem(SESSION_KEY);if(!e)return null;
  return getUsers().filter(function(u){return u.email===e})[0]||null}catch(e){return null}}
function signIn(email){try{localStorage.setItem(SESSION_KEY,email)}catch(e){}}
function signOut(){try{localStorage.removeItem(SESSION_KEY)}catch(e){}}
function refreshNavAuth(){
  var slot=$('#nav-auth');if(!slot)return;var u=currentUser();
  if(u){var initial=(u.name||u.email||'R').charAt(0).toUpperCase();
    slot.innerHTML='<a class="acct-chip" href="account.html" title="Your account">'+
      '<span class="acct-avatar">'+initial+'</span><span>'+escapeHtml(u.name||'Account')+'</span></a>';
  }else{slot.innerHTML='<a class="btn btn-outline btn-sm" href="signin.html">Sign in</a>';}
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ageOn(dob){var d=new Date(dob),n=new Date(),a=n.getFullYear()-d.getFullYear();
  var m=n.getMonth()-d.getMonth();if(m<0||(m===0&&n.getDate()<d.getDate()))a--;return a}

/* signup */
function initSignup(){
  var f=$('#signup-form');if(!f)return;seed();
  f.addEventListener('submit',function(e){
    e.preventDefault();var err=$('#form-err');err.classList.remove('show');
    var name=$('#su-name').value.trim(),email=$('#su-email').value.trim().toLowerCase(),
        pw=$('#su-pass').value,dob=$('#su-dob').value,agree=$('#su-agree').checked;
    function fail(m){err.textContent=m;err.classList.add('show');err.scrollIntoView({block:'center'})}
    if(name.length<2)return fail('Please enter your name.');
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return fail('Please enter a valid email address.');
    if(pw.length<8)return fail('Password must be at least 8 characters.');
    if(!dob)return fail('Please enter your date of birth.');
    if(ageOn(dob)<13)return fail('You must be at least 13 years old to create an account.');
    if(!agree)return fail('Please check the "I agree" box to accept the Terms of Service and Privacy Policy.');
    var users=getUsers();
    if(users.some(function(u){return u.email===email}))return fail('An account with this email already exists in demo mode. Try signing in.');
    users.push({name:name,email:email,dob:dob,agreedTerms:'2026-10-01-v2',
      agreedAt:new Date().toISOString(),createdAt:new Date().toISOString()});
    saveUsers(users);signIn(email);refreshNavAuth();
    $('#form-ok').textContent='Account created — welcome, '+name+'! Demo mode: no confirmation email is actually sent. Real double opt-in arrives with the backend.';
    $('#form-ok').classList.add('show');
    setTimeout(function(){location.href='account.html'},1400);
  });
}
/* signin */
function initSignin(){
  var f=$('#signin-form');if(!f)return;seed();
  var fill=$('#demo-fill');
  if(fill)fill.addEventListener('click',function(){$('#si-email').value=SEED_EMAIL;$('#si-pass').value=SEED_PASS;});
  f.addEventListener('submit',function(e){
    e.preventDefault();var err=$('#form-err');err.classList.remove('show');
    var email=$('#si-email').value.trim().toLowerCase(),pw=$('#si-pass').value;
    function fail(m){err.textContent=m;err.classList.add('show')}
    if(email===SEED_EMAIL){ if(pw!==SEED_PASS)return fail('Incorrect password for the demo account.');
      signIn(email);refreshNavAuth();location.href='account.html';return;}
    var u=getUsers().filter(function(x){return x.email===email})[0];
    if(!u)return fail('No demo account found for this email. Create one on the signup page first.');
    /* demo: registered demo users sign in by email; passwords are not stored in demo mode */
    signIn(email);refreshNavAuth();location.href='account.html';
  });
}
/* account page + delete flow */
function initAccount(){
  if(!$('#account-page'))return;
  var u=currentUser();
  if(!u){toast('Please sign in first.');location.href='signin.html';return;}
  $('#acct-name').textContent=u.name||'Member';
  $('#acct-email').textContent=u.email;
  $('#acct-since').textContent=(u.createdAt||'').slice(0,10);
  renderFavs();
  var nl=$('#acct-newsletter');
  if(nl){var prefs=getNewsletter();nl.checked=!!prefs[u.email];
    nl.addEventListener('change',function(){var p=getNewsletter();
      if(nl.checked){p[u.email]={ts:new Date().toISOString()}}else{delete p[u.email]}
      saveNewsletter(p);toast(nl.checked?'Subscribed to the newsletter.':'Unsubscribed from the newsletter.');});}
  $('#signout-btn').addEventListener('click',function(){signOut();refreshNavAuth();
    toast('Signed out.');setTimeout(function(){location.href='index.html'},600);});
  var dz=$('#delete-btn'),cb=$('#delete-confirm');
  dz.addEventListener('click',function(){cb.classList.add('show');dz.disabled=true;});
  $('#delete-cancel').addEventListener('click',function(){cb.classList.remove('show');dz.disabled=false;});
  $('#delete-yes').addEventListener('click',function(){
    var email=u.email;
    try{[USERS_KEY,SESSION_KEY].forEach(function(k){localStorage.removeItem(k)});
      var f=getFavs();delete f[email];saveFavs(f);
      var p=getNewsletter();delete p[email];saveNewsletter(p);
    }catch(e){}
    seed(); /* keep the seeded tester available */
    toast('Your demo account and all local data were deleted.');
    setTimeout(function(){location.href='index.html'},900);
  });
}

/* ---------- favorites ---------- */
var FAVS_KEY='rasalaya_favs';
function getFavs(){try{return JSON.parse(localStorage.getItem(FAVS_KEY)||'{}')}catch(e){return{}}}
function saveFavs(f){try{localStorage.setItem(FAVS_KEY,JSON.stringify(f))}catch(e){}}
function myFavs(){var u=currentUser();if(!u)return[];return getFavs()[u.email]||[]}
function isFav(id){return myFavs().indexOf(id)>-1}
function toggleFav(id,btn){
  var u=currentUser();
  if(!u){toast('Sign in to save favorites.');setTimeout(function(){location.href='signin.html'},900);return;}
  var f=getFavs(),list=f[u.email]||[],i=list.indexOf(id);
  if(i>-1){list.splice(i,1);toast('Removed from favorites.')}else{list.push(id);toast('Saved to favorites.')}
  f[u.email]=list;saveFavs(f);paintHearts();
  if($('#account-page'))renderFavs();
}
function paintHearts(){
  $$('.fav-btn').forEach(function(b){
    b.classList.toggle('active',isFav(b.getAttribute('data-recipe')));
    b.setAttribute('aria-pressed',isFav(b.getAttribute('data-recipe'))?'true':'false');});
  $$('.fav-btn-inline').forEach(function(b){
    var on=isFav(b.getAttribute('data-recipe'));
    b.classList.toggle('btn-leaf',on);b.classList.toggle('btn-outline',!on);
    b.textContent=on?'Saved to favorites':'Save to favorites';});
}
function initHearts(){
  /* Hearts are their own control: stopPropagation so a heart tap NEVER follows the card link. */
  $$('.fav-btn, .fav-btn-inline').forEach(function(b){
    if(b.dataset.bound)return;b.dataset.bound='1';
    b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();
      toggleFav(b.getAttribute('data-recipe'),b);});
  });
  paintHearts();
}
function renderFavs(){
  var box=$('#fav-list');if(!box)return;var list=myFavs(),data=window.RASALAYA_RECIPES||[];
  if(!list.length){box.innerHTML='<div class="empty-state"><h2>No favorites yet</h2>'+
    '<p>Tap the heart on any recipe to save it here.</p><a class="btn btn-primary" href="browse.html">Browse recipes</a></div>';return;}
  box.innerHTML='';
  list.forEach(function(id){
    var r=data.filter(function(x){return x.id===id})[0];if(!r)return;
    box.appendChild(recipeCard(r));
  });
  initHearts();
}

/* ---------- recipe cards (single click navigates; share opens ONLY from Share button) ---------- */
function recipeCard(r){
  var a=document.createElement('article');a.className='recipe-card';
  var alias=r.aliases&&r.aliases.length?'<div class="alias">Also known as '+escapeHtml(r.aliases[0].name)+
    ' in '+escapeHtml(r.aliases[0].region)+'</div>':'';
  var tags='<div class="tag-row"><span class="tag">'+escapeHtml(r.region)+'</span>'+
    '<span class="tag">'+escapeHtml(r.season)+'</span><span class="tag">'+escapeHtml(cap(r.category))+'</span>'+
    (r.veg?'<span class="tag veg">Vegetarian</span>':'')+
    (r.festive?'<span class="tag festive">Festive</span>':'')+
    (r.kidFriendly?'<span class="tag kid">Kid-friendly</span>':'')+'</div>';
  a.innerHTML='<button class="fav-btn" data-recipe="'+r.id+'" aria-label="Save to favorites" aria-pressed="false">'+
    '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.9-10-9.5C.5 8 2.5 4.5 6 4.5c2.2 0 3.9 1.3 6 4 2.1-2.7 3.8-4 6-4 3.5 0 5.5 3.5 4 7-2.5 4.6-10 9.5-10 9.5z"/></svg></button>'+
    '<img class="dish" src="assets/img/'+r.id+'.jpg" alt="'+escapeHtml(r.name)+'" loading="lazy">'+
    '<div class="card-body"><h3>'+escapeHtml(r.name)+'</h3>'+alias+tags+'</div>'+
    '<a class="card-hit" href="'+r.page+'" aria-label="Open '+escapeHtml(r.name)+' recipe"></a>';
  return a;
}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}

/* ---------- share dialog — opens ONLY from an explicit Share button click ---------- */
function initShare(){
  var veil=$('#share-veil');if(!veil)return;
  function open(recipeName){
    $('#share-recipe-name').textContent=recipeName||'';
    veil.classList.add('open');document.body.style.overflow='hidden';
    setTimeout(function(){$('#share-email').focus()},80);
  }
  function close(){veil.classList.remove('open');document.body.style.overflow='';}
  $$('[data-share-open]').forEach(function(b){
    b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();
      open(b.getAttribute('data-share-open'));});
  });
  veil.addEventListener('click',function(e){if(e.target===veil)close()});
  $('#share-close').addEventListener('click',close);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
  $('#share-form').addEventListener('submit',function(e){
    e.preventDefault();var err=$('#share-err');err.classList.remove('show');
    var email=$('#share-email').value.trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){err.textContent='Please enter a valid email address.';err.classList.add('show');return;}
    if(!$('#share-age').checked){err.textContent='Please confirm you are 13 or older.';err.classList.add('show');return;}
    $('#share-done').classList.add('show');$('#share-form').style.display='none';
  });
}

/* ---------- newsletter / contact / feedback (demo confirmations) ---------- */
var NL_KEY='rasalaya_newsletter';
function getNewsletter(){try{return JSON.parse(localStorage.getItem(NL_KEY)||'{}')}catch(e){return{}}}
function saveNewsletter(n){try{localStorage.setItem(NL_KEY,JSON.stringify(n))}catch(e){}}
function initNewsletter(){
  $$('.news-form').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var input=f.querySelector('input[type=email]'),email=input.value.trim();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){toast('Please enter a valid email address.');return;}
      var age=f.parentElement.querySelector('.nl-age');
      if(age&&!age.checked){toast('Please confirm you are 13 or older.');return;}
      var n=getNewsletter();n[email]={ts:new Date().toISOString()};saveNewsletter(n);
      var ok=f.parentElement.querySelector('.form-ok')||f.nextElementSibling;
      toast('Thanks! Demo mode: no email is actually sent. Real double opt-in arrives with the backend.');
      input.value='';
    });
  });
}
function initContact(){
  var f=$('#contact-form');if(!f)return;
  f.addEventListener('submit',function(e){
    e.preventDefault();var err=$('#form-err');err.classList.remove('show');
    var topic=$('#c-topic').value,name=$('#c-name').value.trim(),
        email=$('#c-email').value.trim(),msg=$('#c-message').value.trim();
    function fail(m){err.textContent=m;err.classList.add('show')}
    if(!topic)return fail('Please choose a topic.');
    if(name.length<2)return fail('Please enter your name.');
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return fail('Please enter a valid email address.');
    if(msg.length<10)return fail('Please write a message of at least 10 characters.');
    $('#form-ok').textContent='Message received — thank you, '+name+'. Demo mode: this stays in your browser; real delivery to our inbox arrives with the backend.';
    $('#form-ok').classList.add('show');f.reset();
  });
}
function initFeedback(){
  var f=$('#feedback-form');if(!f)return;
  var stars=$$('#fb-stars span'),rating=0;
  stars.forEach(function(s,i){s.addEventListener('click',function(){rating=i+1;
    stars.forEach(function(x,j){x.classList.toggle('lit',j<rating)})})});
  f.addEventListener('submit',function(e){
    e.preventDefault();var err=$('#form-err');err.classList.remove('show');
    var name=$('#fb-name').value.trim(),comment=$('#fb-comment').value.trim();
    function fail(m){err.textContent=m;err.classList.add('show')}
    if(name.length<2)return fail('Please enter your name.');
    if(!rating)return fail('Please tap a star rating.');
    if(comment.length<4)return fail('Please write a short comment.');
    if(!$('#fb-age').checked)return fail('Please confirm you are 13 or older.');
    $('#form-ok').textContent='Thanks, '+name+'! Your feedback was recorded. Demo mode: reviews are read by our team before anything appears publicly.';
    $('#form-ok').classList.add('show');f.reset();
    stars.forEach(function(x){x.classList.remove('lit')});rating=0;
  });
}

/* ---------- browse filters (sticky bar) ---------- */
function initBrowse(){
  var grid=$('#browse-grid');if(!grid)return;
  var data=(window.RASALAYA_RECIPES||[]).slice();
  var q=(new URLSearchParams(location.search).get('q')||'').toLowerCase();
  var state={q:q,region:'',season:'',cats:[],kid:false,veg:false,festive:false,sort:'loved'};
  var si=$('#f-search');if(si&&q)si.value=q;
  function apply(){
    var list=data.filter(function(r){
      if(state.q){var hay=(r.name+' '+r.region+' '+r.season+' '+r.category+' '+
        r.ingredients.groups.map(function(g){return g.items.join(' ')}).join(' ')).toLowerCase();
        if(hay.indexOf(state.q)<0)return false;}
      if(state.region&&r.region!==state.region)return false;
      if(state.season&&r.season!==state.season)return false;
      if(state.cats.length&&state.cats.indexOf(r.category)<0)return false;
      if(state.kid&&!r.kidFriendly)return false;
      if(state.veg&&!r.veg)return false;
      if(state.festive&&!r.festive)return false;
      return true;});
    list.sort(function(a,b){if(state.sort==='az')return a.name.localeCompare(b.name);
      if(state.sort==='season')return a.season.localeCompare(b.season);
      return (b.loves||0)-(a.loves||0);});
    grid.innerHTML='';
    $('#result-count').textContent=list.length+(list.length===1?' recipe':' recipes');
    if(!list.length){$('#empty-state').style.display='block';}
    else{$('#empty-state').style.display='none';list.forEach(function(r){grid.appendChild(recipeCard(r))});}
    paintPills();initHearts();
  }
  function paintPills(){
    var box=$('#active-pills');box.innerHTML='';
    function pill(label,clear){var p=document.createElement('span');p.className='pill';
      p.innerHTML=escapeHtml(label)+'<button aria-label="Remove filter">&times;</button>';
      p.querySelector('button').addEventListener('click',clear);box.appendChild(p);}
    if(state.q)pill('Search: '+state.q,function(){state.q='';si.value='';apply()});
    if(state.region)pill(state.region,function(){state.region='';$('#f-region').value='';apply()});
    if(state.season)pill(state.season,function(){state.season='';$('#f-season').value='';apply()});
    state.cats.forEach(function(c){pill(cap(c),function(){
      state.cats=state.cats.filter(function(x){return x!==c});
      $$('.chip[data-cat]').forEach(function(ch){if(ch.getAttribute('data-cat')===c)ch.classList.remove('on')});apply()})});
    if(state.kid)pill('Kid-friendly',function(){state.kid=false;$('#f-kid').checked=false;apply()});
    if(state.veg)pill('Vegetarian',function(){state.veg=false;$('#f-veg').checked=false;apply()});
    if(state.festive)pill('Festive',function(){state.festive=false;$('#f-festive').checked=false;apply()});
  }
  if(si)si.addEventListener('input',function(){state.q=si.value.trim().toLowerCase();apply()});
  $('#f-region').addEventListener('change',function(e){state.region=e.target.value;apply()});
  $('#f-season').addEventListener('change',function(e){state.season=e.target.value;apply()});
  $('#f-sort').addEventListener('change',function(e){state.sort=e.target.value;apply()});
  $$('.chip[data-cat]').forEach(function(ch){ch.addEventListener('click',function(){
    var c=ch.getAttribute('data-cat'),i=state.cats.indexOf(c);
    if(i>-1){state.cats.splice(i,1);ch.classList.remove('on')}else{state.cats.push(c);ch.classList.add('on')}
    apply()})});
  $('#f-kid').addEventListener('change',function(e){state.kid=e.target.checked;apply()});
  $('#f-veg').addEventListener('change',function(e){state.veg=e.target.checked;apply()});
  $('#f-festive').addEventListener('change',function(e){state.festive=e.target.checked;apply()});
  apply();
}

/* ---------- kid-friendly toggle on recipe page ---------- */
function initKidToggle(){
  var t=$('#kid-toggle');if(!t)return;
  t.addEventListener('change',function(){
    $('#kid-card').style.display=t.checked?'block':'none';
    if(t.checked)$('#kid-card').scrollIntoView({behavior:'smooth',block:'center'});});
}

/* ---------- COPY-PREVENTION: recipe card text is non-selectable; copy/cut/context-menu blocked ---------- */
function initCopyPrevention(){
  $$('.parchment').forEach(function(card){
    ['copy','cut'].forEach(function(ev){
      card.addEventListener(ev,function(e){e.preventDefault();
        toast('Sharing instead of copying keeps this library free — use the Share button.');});});
    card.addEventListener('contextmenu',function(e){e.preventDefault();
      toast('Right-click is disabled on recipes — use Share to send this recipe.');});
    card.addEventListener('dragstart',function(e){e.preventDefault()});
  });
}

/* ---------- hero search ---------- */
function initHeroSearch(){
  var f=$('#hero-search');if(!f)return;
  f.addEventListener('submit',function(e){e.preventDefault();
    var q=f.querySelector('input').value.trim();
    location.href='browse.html'+(q?'?q='+encodeURIComponent(q):'');});
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded',function(){
  seed();initNav();initCookies();initCookiePage();refreshNavAuth();
  initSignup();initSignin();initAccount();initHearts();initShare();
  initNewsletter();initContact();initFeedback();initBrowse();initKidToggle();
  initCopyPrevention();initHeroSearch();
});
})();
