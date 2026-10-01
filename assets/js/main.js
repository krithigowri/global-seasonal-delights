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
  renderFavs();renderComments();renderPaid();
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
      [NOTES_KEY,COLLS_KEY,MYREC_KEY,CMTS_KEY].forEach(function(k){
        var m=userMap(k);delete m[email];saveUserMap(k,m);});
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
  var paid=isPaidPreview(),notes=paid?myMap(NOTES_KEY):{};
  list.forEach(function(id){
    var r=data.filter(function(x){return x.id===id})[0];if(!r)return;
    var wrap=document.createElement('div');wrap.appendChild(recipeCard(r));
    if(paid){
      var d=document.createElement('details');d.className='note-box';
      d.innerHTML='<summary>'+(notes[id]?'\u270E Edit note':'\u270E Add a note (paid)')+'</summary>'+
        '<textarea data-note="'+id+'" rows="2" placeholder="e.g. halved the ghee next time, extra cardamom">'+escapeHtml(notes[id]||'')+'</textarea>'+
        '<button class="btn btn-outline btn-sm" data-savenote="'+id+'">Save note</button>';
      wrap.appendChild(d);
    }
    box.appendChild(wrap);
  });
  initHearts();
  if(paid)box.querySelectorAll('[data-savenote]').forEach(function(b){
    b.addEventListener('click',function(){
      var id=b.getAttribute('data-savenote'),
          v=box.querySelector('textarea[data-note="'+id+'"]').value.trim(),
          n=myMap(NOTES_KEY);
      if(v)n[id]=v;else delete n[id];
      setMyMap(NOTES_KEY,n);toast('Note saved.');renderFavs();});});
}

/* ---------- recipe cards (single click navigates; share opens ONLY from Share button) ---------- */

/* ---------- paid preview: notes, collections, my recipes, comments (demo, test account only) ---------- */
var NOTES_KEY='rasalaya_notes', COLLS_KEY='rasalaya_colls', MYREC_KEY='rasalaya_myrecipes', CMTS_KEY='rasalaya_comments';
function userMap(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch(e){return{}}}
function saveUserMap(key,m){try{localStorage.setItem(key,JSON.stringify(m))}catch(e){}}
function myMap(key){var u=currentUser();if(!u)return{};var m=userMap(key);return m[u.email]||{}}
function setMyMap(key,val){var u=currentUser();if(!u)return;var m=userMap(key);m[u.email]=val;saveUserMap(key,m)}
function isPaidPreview(){var u=currentUser();return !!(u&&u.email===SEED_EMAIL)}
function recipeName(id){
  var data=(window.RASALAYA_RECIPES||[]),r=data.filter(function(x){return x.id===id})[0];
  if(r)return r.name;
  var mine=myMap(MYREC_KEY),m=(Array.isArray(mine)?mine:[]).filter(function(x){return x.id===id})[0];
  return m?m.name:id;
}
function renderComments(){
  var box=$('#comment-list');if(!box)return;var l=myMap(CMTS_KEY);
  if(!l||!l.length){box.innerHTML='<p class="map-sub">No comments yet — open a recipe, tap the stars and tell us how it turned out.</p>';return;}
  box.innerHTML=l.map(function(c){
    return '<div class="info-card" style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center"><strong>'+
      escapeHtml(c.recipe)+'</strong><span style="color:var(--gold);font-size:15px;letter-spacing:2px">'+
      '★★★★★'.slice(0,c.rating)+'<span style="opacity:.25">'+'★★★★★'.slice(0,5-c.rating)+'</span></span></div>'+
      '<p style="margin:8px 0 4px">'+escapeHtml(c.comment)+'</p>'+
      '<p class="micro" style="color:var(--muted);margin:0">'+escapeHtml((c.at||'').slice(0,10))+'</p></div>';
  }).join('');
}
function renderPaid(){
  var box=$('#paid-section');if(!box)return;var u=currentUser();if(!u)return;
  if(!isPaidPreview()){
    box.innerHTML='<div class="empty-state"><h2>Under construction</h2>'+
      '<p>Collections — your own beautifully organized recipe books, personal notes on every dish, and space for your own recipes — will be a paid tier, launching once our free library proves itself. Favorites are free forever.</p>'+
      '<form class="news-form" id="paid-notify"><div class="field"><input type="email" id="paid-notify-email" placeholder="you@example.com" aria-label="Email for launch notification"></div>'+
      '<button class="btn btn-primary btn-sm" type="submit">Notify me at launch</button></form></div>';
    $('#paid-notify').addEventListener('submit',function(e){e.preventDefault();
      var em=$('#paid-notify-email').value.trim();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){toast('Please enter a valid email address.');return;}
      var n=getNewsletter();n[em]={ts:new Date().toISOString(),paidNotify:true};saveNewsletter(n);
      toast('Thanks! We\u2019ll email you when Collections launch.');$('#paid-notify').reset();});
    return;
  }
  box.innerHTML='<div class="demo-badge" style="margin-bottom:18px;border-color:#2c6e31">PAID PREVIEW — visible only on the test account. Everyone else sees \u201cunder construction\u201d.</div>'+
    '<div id="coll-list"></div>'+
    '<form id="new-coll" style="display:flex;gap:10px;margin:14px 0 34px;flex-wrap:wrap"><div class="field" style="flex:1;min-width:220px"><input type="text" id="new-coll-name" placeholder="New collection — e.g. Diwali 2026 menu" aria-label="New collection name"></div>'+
    '<button class="btn btn-primary btn-sm" type="submit">Create collection</button></form>'+
    '<h3 style="font-size:1.15rem;margin-bottom:10px">My recipes</h3>'+
    '<p class="map-sub" style="margin-bottom:10px">Your own recipes, kept in your account. Only you can see them.</p>'+
    '<div id="myrec-list"></div>'+
    '<form id="new-recipe" class="info-card" style="margin-top:14px"><h3 style="font-size:1.05rem;margin-bottom:12px">Add your own recipe</h3>'+
    '<div class="filter-row"><div class="field"><input type="text" id="mr-name" placeholder="Dish name" aria-label="Dish name"></div>'+
    '<div class="field"><input type="text" id="mr-region" placeholder="Region — e.g. Tamil Nadu" aria-label="Region"></div></div>'+
    '<div class="filter-row" style="margin-top:10px"><div class="field"><select id="mr-season" aria-label="Season"><option value="">Season</option><option>Spring</option><option>Summer</option><option>Autumn</option><option>Winter</option></select></div>'+
    '<div class="field"><select id="mr-cat" aria-label="Category"><option value="">Category</option><option value="food">Food</option><option value="snack">Snack</option><option value="drink">Drink</option></select></div></div>'+
    '<div class="field" style="margin-top:10px"><textarea id="mr-ing" rows="3" placeholder="Ingredients — one per line"></textarea></div>'+
    '<div class="field" style="margin-top:10px"><textarea id="mr-method" rows="3" placeholder="Method — one step per line"></textarea></div>'+
    '<div class="field" style="margin-top:10px"><textarea id="mr-note" rows="2" placeholder="Your note — e.g. halved the ghee, added extra cardamom (optional)"></textarea></div>'+
    '<button class="btn btn-primary btn-sm" type="submit" style="margin-top:12px">Save my recipe</button></form>';
  renderColls();renderMyRecipes();
  $('#new-coll').addEventListener('submit',function(e){e.preventDefault();
    var name=$('#new-coll-name').value.trim();
    if(name.length<2){toast('Give your collection a name.');return;}
    var c=myColls();c.push({id:'c'+Date.now(),name:name,items:[]});setMyMap(COLLS_KEY,c);
    $('#new-coll-name').value='';renderColls();toast('Collection created.');});
  $('#new-recipe').addEventListener('submit',function(e){e.preventDefault();
    var name=$('#mr-name').value.trim();
    if(name.length<2){toast('Give your recipe a name.');return;}
    var lines=function(id){return $('#'+id).value.split('\n').map(function(x){return x.trim()}).filter(Boolean)};
    var r={id:'my'+Date.now(),name:name,region:$('#mr-region').value.trim()||'My kitchen',
      season:$('#mr-season').value||'—',cat:$('#mr-cat').value||'food',
      ingredients:lines('mr-ing'),method:lines('mr-method'),note:$('#mr-note').value.trim(),mine:true,
      at:new Date().toISOString()};
    var l=myMyRecipes();l.unshift(r);setMyMap(MYREC_KEY,l);
    ['mr-name','mr-region','mr-ing','mr-method','mr-note'].forEach(function(id){$('#'+id).value=''});
    renderMyRecipes();toast('Recipe saved to My recipes.');});
}
function myColls(){var c=myMap(COLLS_KEY);return Array.isArray(c)?c:[]}
function myMyRecipes(){var l=myMap(MYREC_KEY);return Array.isArray(l)?l:[]}
function favOptions(exclude){
  var data=(window.RASALAYA_RECIPES||[]),mine=myMyRecipes(),opts=[];
  myFavs().forEach(function(id){var r=data.filter(function(x){return x.id===id})[0];
    if(r&&exclude.indexOf(id)<0)opts.push({id:id,name:r.name+' (library)'})});
  mine.forEach(function(r){if(exclude.indexOf(r.id)<0)opts.push({id:r.id,name:r.name+' (mine)'})});
  return opts;
}
function renderColls(){
  var box=$('#coll-list');if(!box)return;var colls=myColls();
  if(!colls.length){box.innerHTML='<p class="map-sub">No collections yet — create one above, then add recipes to it.</p>';return;}
  box.innerHTML='';
  colls.forEach(function(c){
    var d=document.createElement('div');d.className='info-card coll-card';
    var chips=c.items.map(function(id){
      return '<span class="chip-pick">'+escapeHtml(recipeName(id))+
        ' <button aria-label="Remove" data-unpick="'+c.id+'|'+id+'">×</button></span>'}).join('')||'<span class="map-sub">Empty — add recipes below.</span>';
    var opts=favOptions(c.items).map(function(o){
      return '<option value="'+o.id+'">'+escapeHtml(o.name)+'</option>'}).join('');
    d.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">'+
      '<h3 style="font-size:1.1rem;margin:0">'+escapeHtml(c.name)+'</h3>'+
      '<button class="btn btn-outline btn-sm" data-delcoll="'+c.id+'">Delete</button></div>'+
      '<div class="chip-row" style="margin:12px 0">'+chips+'</div>'+
      (opts?'<div style="display:flex;gap:10px;flex-wrap:wrap"><div class="field" style="flex:1;min-width:180px"><select data-addsel="'+c.id+'" aria-label="Add a recipe"><option value="">Add a recipe…</option>'+opts+'</select></div></div>'
           :'<p class="micro" style="color:var(--muted)">Save some favorites (or add your own recipes) to fill this collection.</p>');
    box.appendChild(d);
  });
  box.querySelectorAll('[data-unpick]').forEach(function(b){b.addEventListener('click',function(){
    var p=b.getAttribute('data-unpick').split('|'),colls=myColls(),
        c=colls.filter(function(x){return x.id===p[0]})[0];
    if(c){c.items=c.items.filter(function(i){return i!==p[1]});setMyMap(COLLS_KEY,colls);renderColls();}});});
  box.querySelectorAll('[data-delcoll]').forEach(function(b){b.addEventListener('click',function(){
    var colls=myColls().filter(function(x){return x.id!==b.getAttribute('data-delcoll')});
    setMyMap(COLLS_KEY,colls);renderColls();toast('Collection deleted.');});});
  box.querySelectorAll('[data-addsel]').forEach(function(s){s.addEventListener('change',function(){
    if(!s.value)return;var colls=myColls(),c=colls.filter(function(x){return x.id===s.getAttribute('data-addsel')})[0];
    if(c&&c.items.indexOf(s.value)<0){c.items.push(s.value);setMyMap(COLLS_KEY,colls);renderColls();toast('Added to '+c.name+'.');}});});
}
function renderMyRecipes(){
  var box=$('#myrec-list');if(!box)return;var l=myMyRecipes();
  if(!l.length){box.innerHTML='<p class="map-sub">No recipes yet — add your first below.</p>';return;}
  box.innerHTML='';
  l.forEach(function(r){
    var d=document.createElement('div');d.className='info-card';
    d.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">'+
      '<h3 style="font-size:1.1rem;margin:0">'+escapeHtml(r.name)+'</h3>'+
      '<button class="btn btn-outline btn-sm" data-delrec="'+r.id+'">Delete</button></div>'+
      '<p class="micro" style="color:var(--muted);margin:6px 0 0">'+escapeHtml(r.region)+' · '+escapeHtml(r.season)+
      (r.note?'<br><strong>Your note:</strong> '+escapeHtml(r.note):'')+'</p>';
    box.appendChild(d);
  });
  box.querySelectorAll('[data-delrec]').forEach(function(b){b.addEventListener('click',function(){
    var l=myMyRecipes().filter(function(x){return x.id!==b.getAttribute('data-delrec')});
    setMyMap(MYREC_KEY,l);
    var colls=myColls(),changed=false;
    colls.forEach(function(c){var n=c.items.filter(function(i){return i!==b.getAttribute('data-delrec')});
      if(n.length!==c.items.length){c.items=n;changed=true}});
    if(changed)setMyMap(COLLS_KEY,colls);
    renderMyRecipes();renderColls();toast('Recipe deleted.');});});
}

/* Diet taxonomy (2026-10-01): "Vegetarian on Rasalaya means no egg". New-schema
   packets carry `diet`; the original 98 carry the old `veg` bool. */
var DIET_LABELS={vegan:'Vegan',vegetarian:'Vegetarian','contains-egg':'Contains egg',
  pescatarian:'Pescatarian','meat-seafood':'Meat & Seafood'};
function dietLabel(r){return DIET_LABELS[r.diet]||(r.veg?'Vegetarian':null)}
function dietTag(r){var l=dietLabel(r);return l?'<span class="tag veg">'+escapeHtml(l)+'</span>':''}
function isVeg(r){return !!(r.veg||r.diet==='vegan'||r.diet==='vegetarian')}
function baseTag(r){return r.baseRecipe?'<span class="tag base">Base recipe</span>':''}
function metaLine(r){var b=[];if(r.calories)b.push(String.fromCharCode(8776)+r.calories+' kcal');
  if(r.prepTime)b.push(r.prepTime+' min prep');return b.join(' '+String.fromCharCode(183)+' ')}
function recipeCard(r){
  var a=document.createElement('article');a.className='recipe-card';
  var alias='';
  if(r.aliases&&r.aliases.length){var a0=r.aliases[0];
    alias='<div class="alias">Also known as '+escapeHtml(typeof a0==='string'?a0:a0.name)+
    (typeof a0==='string'?'':' in '+escapeHtml(a0.region))+'</div>';}
  var tags='<div class="tag-row"><span class="tag">'+escapeHtml(r.region)+'</span>'+
    '<span class="tag">'+escapeHtml(r.season)+'</span><span class="tag">'+escapeHtml(cap(r.category))+'</span>'+
    dietTag(r)+baseTag(r)+
    (r.festive?'<span class="tag festive">Festive · '+escapeHtml(r.festival||'seasonal')+'</span>':'')+
    (r.kidFriendly?'<span class="tag kid">Kids love it</span>':'')+'</div>';
  var meta=metaLine(r);
  var metaHtml=meta?'<div class="card-meta">'+escapeHtml(meta)+'</div>':'';
  a.innerHTML='<button class="fav-btn" data-recipe="'+r.id+'" aria-label="Save to favorites" aria-pressed="false">'+
    '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.9-10-9.5C.5 8 2.5 4.5 6 4.5c2.2 0 3.9 1.3 6 4 2.1-2.7 3.8-4 6-4 3.5 0 5.5 3.5 4 7-2.5 4.6-10 9.5-10 9.5z"/></svg></button>'+
    '<img class="dish" src="assets/img/'+r.id+'.jpg" alt="'+escapeHtml(r.name)+'" loading="lazy" onerror="this.onerror=null;this.src=\'assets/img/placeholder.svg\'">'+
    '<div class="card-body"><h3>'+escapeHtml(r.name)+'</h3>'+alias+metaHtml+tags+'</div>'+
    '<a class="card-hit" href="'+r.page+'" aria-label="Open '+escapeHtml(r.name)+' recipe"></a>';
  return a;
}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}

/* ---------- share dialog — opens ONLY from an explicit Share button click ---------- */
function initShare(){
  var veil=$('#share-veil');if(!veil)return;
  function open(recipeName){
    $('#share-recipe-name').textContent=recipeName||'';
    var rf=$('#share-recipe-field');if(rf)rf.value=recipeName||'';
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
    var f=$('#share-form');
    fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams(new FormData(f)).toString()})
    .then(function(){$('#share-done').classList.add('show');f.style.display='none';})
    .catch(function(){err.textContent='Something went wrong — please try again.';err.classList.add('show');});
  });
}

/* ---------- newsletter / contact / feedback (Netlify Forms capture) ---------- */
var NL_KEY='rasalaya_newsletter';
function getNewsletter(){try{return JSON.parse(localStorage.getItem(NL_KEY)||'{}')}catch(e){return{}}}
function saveNewsletter(n){try{localStorage.setItem(NL_KEY,JSON.stringify(n))}catch(e){}}
function netlifyPost(form){
  return fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams(new FormData(form)).toString()});
}
function initNewsletter(){
  $$('.news-form').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var input=f.querySelector('input[type=email]'),email=input.value.trim();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){toast('Please enter a valid email address.');return;}
      var age=f.querySelector('.nl-age');
      if(age&&!age.checked){toast('Please confirm you are 13 or older.');return;}
      netlifyPost(f).then(function(){
        toast('Thanks for subscribing!');
        input.value='';if(age)age.checked=false;
        var c=f.querySelector('.nl-consent');if(c)c.checked=false;
      }).catch(function(){toast('Something went wrong — please try again.');});
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
    var fr=$('#fb-rating');if(fr)fr.value=rating;
    stars.forEach(function(x,j){x.classList.toggle('lit',j<rating)})})});
  f.addEventListener('submit',function(e){
    e.preventDefault();var err=$('#form-err');err.classList.remove('show');
    var name=$('#fb-name').value.trim(),comment=$('#fb-comment').value.trim();
    function fail(m){err.textContent=m;err.classList.add('show')}
    if(name.length<2)return fail('Please enter your name.');
    if(!rating)return fail('Please tap a star rating.');
    if(comment.length<4)return fail('Please write a short comment.');
    if(!$('#fb-age').checked)return fail('Please confirm you are 13 or older.');
    netlifyPost(f).then(function(){
      $('#form-ok').textContent='Thanks, '+name+'! Your feedback was recorded. Reviews are read by our team before anything appears publicly.';
      $('#form-ok').classList.add('show');f.reset();
      stars.forEach(function(x){x.classList.remove('lit')});rating=0;
    }).catch(function(){fail('Something went wrong. Please try again.')});
  });
}

/* ---------- browse filters (sticky bar) ---------- */
function initBrowse(){
  var grid=$('#browse-grid');if(!grid)return;
  var data=(window.RASALAYA_RECIPES||[]).slice();
  var q=(new URLSearchParams(location.search).get('q')||'').toLowerCase();
  var rq=(new URLSearchParams(location.search).get('region')||'');
  var state={q:q,region:rq,season:'',cats:[],kid:false,veg:false,festive:false,sort:'loved'};
  var si=$('#f-search');if(si&&q)si.value=q;
  var fr0=$('#f-region');if(fr0&&rq)fr0.value=rq;
  function apply(){
    var list=data.filter(function(r){
      if(state.q){var hay=(r.name+' '+r.region+' '+r.season+' '+r.category+' '+
        r.ingredients.groups.map(function(g){return g.items.join(' ')}).join(' ')).toLowerCase();
        if(hay.indexOf(state.q)<0)return false;}
      if(state.region&&r.region!==state.region)return false;
      if(state.season&&r.season!==state.season)return false;
      if(state.cats.length&&state.cats.indexOf(r.category)<0)return false;
      if(state.kid&&!r.kidFriendly)return false;
      if(state.veg&&!isVeg(r))return false;
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
    if(state.kid)pill('Kids love it',function(){state.kid=false;$('#f-kid').checked=false;apply()});
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

/* ---------- kids-love-it toggle on recipe page ---------- */
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
  document.addEventListener('keydown',function(e){
    if(!(e.ctrlKey||e.metaKey)||e.key.toLowerCase()!=='c')return;
    var t=e.target&&e.target.closest?e.target.closest('.parchment'):null;
    if(t){e.preventDefault();
      toast('Sharing instead of copying keeps this library free \u2014 use the Share button.');}
  });
}

/* ---------- hero search ---------- */
function initHeroSearch(){
  var f=$('#hero-search');if(!f)return;
  f.addEventListener('submit',function(e){e.preventDefault();
    var q=f.querySelector('input').value.trim();
    location.href='browse.html'+(q?'?q='+encodeURIComponent(q):'');});
}


/* ---------- season map: pick a region for the season (her spec, refined 2026-10-01) ----------
   Flow is one-way: season card -> season page -> world map. Pin color = the season
   in that region right now (Spring green · Summer yellow · Autumn orange ·
   Winter white · Monsoon cloudy blue). Four states: sel = user-selected (glowing in
   its season color) · rel-same = has recipes in this season (full color) ·
   rel-diff = has recipes, different season (faded) · rel-none/grey = no recipes yet
   (tap notes the region's current season + logs interest). */

/* Season vs festival rule (her call 2026-10-01): festive dishes live under festival
   collections; season pages list everyday dishes only and cross-link the festivals. */
var FESTIVAL_PAGE={"Navratri":"festival-navratri.html","Dussehra":"festival-dussehra.html",
  "Mid-Autumn Festival":"festival-mid-autumn-festival.html","Diwali":"festival-diwali.html",
  "Thanksgiving":"festival-thanksgiving.html","Hanukkah":"festival-hanukkah.html",
  "Christmas":"festival-christmas.html"};

var REGION_META={
  'South India':{lat:13,lon:77,hemi:'N'},
  'India':{lat:22,lon:78,hemi:'N'},
  'Central Mexico':{lat:20,lon:-102,hemi:'N'},
  'Ethiopia':{lat:9,lon:40,hemi:'N'},
  'Nigeria':{lat:9,lon:8,hemi:'N',season:'Monsoon'},
  'Italy':{lat:42,lon:12,hemi:'N'},
  'Japan':{lat:36,lon:138,hemi:'N'},
  'Thailand':{lat:15,lon:101,hemi:'N'},
  'Middle East':{lat:25,lon:45,hemi:'N'},
  'Peru':{lat:-10,lon:-75,hemi:'S'},
  'Brazil':{lat:-12,lon:-52,hemi:'S'},
  'Australia':{lat:-25,lon:133,hemi:'S'},
  'Spain':{lat:40,lon:-4,hemi:'N'},
  'France':{lat:47,lon:2,hemi:'N'},
  'Poland':{lat:52,lon:19,hemi:'N'},
  'Korea':{lat:36.5,lon:128,hemi:'N'},
  'China':{lat:35,lon:104,hemi:'N'},
  'Vietnam':{lat:14,lon:108,hemi:'N'},
  'Indonesia':{lat:-7,lon:110,hemi:'N'},
  'Argentina':{lat:-35,lon:-65,hemi:'S'},
  'Chile':{lat:-33,lon:-71,hemi:'S'},
  'South Africa':{lat:-30,lon:25,hemi:'S'},
  'United Kingdom':{lat:53.5,lon:-2,hemi:'N'},
  'Ireland':{lat:53,lon:-8,hemi:'N'},
  'Germany':{lat:51,lon:10,hemi:'N'},
  'Austria':{lat:47.5,lon:14,hemi:'N'},
  'United States':{lat:39,lon:-98,hemi:'N'}
};
/* Recipe regions are fine-grained ("Maharashtra, India"); map pins are coarse
   ("India"). Exact or longest-substring match covers most; the rest is aliased. */
var REGION_PIN={
  'Oaxaca, Mexico':'Central Mexico','Andes, Peru':'Peru','Bahia, Brazil':'Brazil',
  'Victoria, Australia':'Australia','Mendoza, Argentina':'Argentina',
  'Salta & Jujuy, Argentina':'Argentina','Central Chile':'Chile',
  'Western Cape, South Africa':'South Africa','Southwest Nigeria (Yoruba)':'Nigeria',
  'Java, Indonesia':'Indonesia','China — particularly southern Chinese home cooking':'China',
  'Sichuan, China':'China','Japan — Miyazaki Prefecture (Miyazaki City), regional version':'Japan',
  'Kansai, Japan':'Japan','Korea (Chungcheongbuk-do, per Korean Traditional Local Food record)':'Korea',
  'North India':'India','North India / Indian subcontinent':'India',
  'North India / broader North and Central Indian festive cuisine':'India',
  'Maharashtra, India':'India','Punjab, India':'India',
  'Rajasthan and western Uttar Pradesh (documented vrat preparation)':'India',
  'North and western India (Maharashtra and Gujarat)':'India',
  'South India, especially Tamil Nadu':'South India',
  'Northern Italy — Lombardy (Mantua)':'Italy','Tuscany, Italy':'Italy',
  'Andalusia, Spain':'Spain','Seville, Andalusia, Spain':'Spain',
  'Provence, France':'France',
  'Bihar, India':'India','West Bengal, India':'India','Karnataka, India':'India',
  'Tamil Nadu, India':'India','Uttar Pradesh, India':'India','Rajasthan, India':'India',
  'Mithila region (Bihar, India & Nepal Terai)':'India',
  'Central Mexico, including Matlatzinca communities in Estado de México':'Central Mexico',
  'Central and southern Mexico':'Central Mexico','Jalisco, Mexico':'Central Mexico',
  'Mexico City / central Mexico':'Central Mexico','Mexico, especially central Mexico':'Central Mexico',
  'Puebla, Mexico':'Central Mexico',
  'England':'United Kingdom','England & Ireland':'United Kingdom','Lancashire, England':'United Kingdom',
  'Northern England':'United Kingdom','Yorkshire, England':'United Kingdom',
  'Ireland':'Ireland',
  'Germany':'Germany','Rhineland, Germany':'Germany',
  'Bavaria, Germany, and Austria':'Germany',
  'Germany (Rotkohl in the north, Blaukraut in Bavaria and the south)':'Germany',
  'Germany (the Poznań, Poland version, Rogale Świętomarcińskie, is a separate protected regional specialty)':'Germany',
  'Rhineland, Germany, and Vienna, Austria':'Germany',
  'United States':'United States','Midwest, USA':'United States',
  'New England / United States':'United States','New England, USA':'United States',
  'New England, United States':'United States','New Jersey, USA':'United States',
  'North America':'United States'
};
function pinForRegion(r){
  if(REGION_PIN[r])return REGION_PIN[r];
  var best=null;
  Object.keys(REGION_META).forEach(function(p){
    if(r.toLowerCase().indexOf(p.toLowerCase())>=0&&(!best||p.length>best.length))best=p;
  });
  return best;
}
function regionXY(m){return [((m.lon+180)/360*1000).toFixed(1),((90-m.lat)/180*500).toFixed(1)];}
var SEASON_COLORS={Spring:'#43a047',Summer:'#f2c230',Autumn:'#e8830c',Winter:'#ffffff',Monsoon:'#6fa8c9'};
function seasonForHemi(season,hemi){
  var map={Autumn:{N:'Autumn',S:'Spring'},Winter:{N:'Winter',S:'Summer'},
           Spring:{N:'Spring',S:'Autumn'},Summer:{N:'Summer',S:'Winter'}};
  return (map[season]||{})[hemi]||season;
}
function regionSeason(name,season){
  var m=REGION_META[name]||{};
  return m.season||seasonForHemi(season,m.hemi);
}
var WORLD_LAND='M33,67L111,56L194,47L264,60L300,50L375,42L389,83L340,110L306,125L292,153L275,178L250,169L231,178L208,194L225,205L264,217L278,228L250,220L236,206L222,195L194,183L167,153L153,117L125,89L83,78L42,83Z '+
'M365,45L390,40L395,60L375,70L360,60Z '+
'M278,228L292,250L306,278L319,306L333,333L319,361L306,389L297,397L319,403L333,375L347,347L361,319L375,292L389,264L375,250L347,236L319,222Z '+
'M472,150L475,131L494,111L514,97L528,89L550,83L569,56L597,61L611,83L583,97L569,111L556,125L542,139L528,144L500,144L486,150Z '+
'M488,108L496,104L498,96L490,92L484,100Z '+
'M472,153L500,153L528,147L556,158L589,164L611,208L633,219L617,250L606,278L597,306L583,328L561,344L542,333L533,306L528,278L522,250L500,236L478,236L458,217L453,194L467,172Z '+
'M610,290L618,285L620,300L612,315L606,305Z '+
'M597,61L639,56L694,50L778,42L861,50L944,61L994,69L972,83L939,106L889,125L861,144L839,167L819,189L800,217L778,228L764,206L750,189L736,194L722,208L717,228L708,217L694,194L681,181L661,178L644,172L633,167L617,153L597,144L583,139L578,125L589,111L611,97L611,83Z '+
'M880,140L890,135L895,150L885,160L878,150Z '+
'M814,311L839,297L867,283L894,281L917,306L925,328L911,356L883,347L861,339L833,344L814,328Z';
function initSeasonPage(){
  var season=document.body.getAttribute('data-season');if(!season)return;
  var mapBox=$('#season-map'),grid=$('#season-grid');if(!mapBox||!grid)return;
  var all=(window.RASALAYA_RECIPES||[]);
  /* Season vs festival rule (refined 2026-10-01, her video call): the DEFAULT grid
     lists everyday mains only — festive dishes live under festival collections.
     But the REGION view has no gap: festive dishes done in this season appear
     there too, tagged "Festive · <festival>", so Autumn + India shows Sabudana. */
  var data=all.filter(function(r){return r.season===season&&!r.festive;});
  var festThisSeason={};
  all.filter(function(r){return r.season===season&&r.festive&&r.festival;}).forEach(function(r){
    if(!festThisSeason[r.festival])festThisSeason[r.festival]=[];
    festThisSeason[r.festival].push(r);
  });
  var selected=null;
  function regionInfo(name){
    /* Recipe regions are fine-grained ("Maharashtra, India"); pins are coarse.
       Match through pinForRegion so India glows when its sub-regions have recipes. */
    var has=all.filter(function(r){return pinForRegion(r.region)===name;}).length>0;
    /* inSeason counts festive dishes too (Navratri sabudana IS an autumn dish). */
    var inSeason=all.filter(function(r){return pinForRegion(r.region)===name&&r.season===season;}).length>0;
    return {has:has,inSeason:inSeason,season:regionSeason(name,season)};
  }
  function regionSeasons(name){
    var s=[];all.forEach(function(r){
      if(pinForRegion(r.region)===name&&s.indexOf(r.season)<0)s.push(r.season);});
    return s;
  }
  function logInterest(name){
    try{
      var k='rasalaya_region_interest',l=JSON.parse(localStorage.getItem(k)||'[]');
      l.push({region:name,season:season,at:new Date().toISOString()});
      localStorage.setItem(k,JSON.stringify(l));
    }catch(e){}
  }
  function renderMap(){
    var pins=Object.keys(REGION_META).map(function(name){
      var xy=regionXY(REGION_META[name]),info=regionInfo(name);
      var rel=info.has?(info.inSeason?' rel-same':' rel-diff'):' rel-none';
      return '<g class="pin season-'+info.season+rel+(selected===name?' sel':'')+'" data-region="'+escapeHtml(name)+'" tabindex="0" role="button" aria-label="'+escapeHtml(name)+'">'+
        '<title>'+escapeHtml(name)+'</title><circle class="hit" cx="'+xy[0]+'" cy="'+xy[1]+'" r="18"/>'+
        '<circle class="dot" cx="'+xy[0]+'" cy="'+xy[1]+'" r="7"/></g>';
    }).join('');
    var pageColor=SEASON_COLORS[season]||'#e8830c';
    var key=['Spring','Summer','Autumn','Winter','Monsoon'].map(function(s){
      return '<span><i style="background:'+SEASON_COLORS[s]+'"></i>'+s+'</span>';
    }).join('');
    mapBox.innerHTML='<svg class="worldmap" viewBox="0 0 1000 500" role="img" aria-label="World map — pick a region for '+escapeHtml(season)+' recipes">'+
      '<path class="land" d="'+WORLD_LAND+'"/>'+pins+'</svg>'+
      '<div class="map-legend"><span><i class="legend-dot lg-sel"></i>Selected</span>'+
      '<span><i class="legend-dot" style="background:'+pageColor+'"></i>Has '+escapeHtml(season)+' recipes</span>'+
      '<span><i class="legend-dot" style="background:'+pageColor+';opacity:.38"></i>Recipes, different season</span>'+
      '<span><i class="legend-dot lg-grey"></i>Not yet — tap to request</span></div>'+
      '<div class="season-key"><span>Pin color = the season there now:</span>'+key+'</div>';
    mapBox.querySelectorAll('.pin').forEach(function(p){
      function go(){selectRegion(p.getAttribute('data-region'));}
      p.addEventListener('click',go);
      p.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
    });
    /* Tapping bare land (no pin) gets a gentle nudge, not silence. */
    var land=mapBox.querySelector('.land');
    if(land)land.addEventListener('click',function(){
      openPopup('Where to next?',
        'Tap a glowing pin for '+escapeHtml(season.toLowerCase())+' recipes from that region.',
        '<a class="btn btn-primary btn-sm" href="browse.html">Browse all recipes</a>'+
        '<button class="btn btn-outline btn-sm" data-act="close">Close</button>');
    });
  }
  function renderList(region){
    var chip=$('#active-selection'),empty=$('#season-empty'),count=$('#season-count');
    /* No season↔festival gap: the region view shows EVERYTHING cooked here this
       season — everyday mains first, festive dishes after, tagged "Festive · X". */
    var list=region?all.filter(function(r){return pinForRegion(r.region)===region&&r.season===season;}):data;
    list=list.slice().sort(function(a,b){return (a.festive?1:0)-(b.festive?1:0);});
    grid.innerHTML='';
    list.forEach(function(r){grid.appendChild(recipeCard(r));});
    initHearts();
    if(count)count.textContent=list.length+(list.length===1?' recipe':' recipes')+(region?' in '+region:' this '+season.toLowerCase());
    if(!list.length&&region){
      var their=regionSeason(region,season),seasons=regionSeasons(region);
      empty.innerHTML='<h3>No '+escapeHtml(season.toLowerCase())+' recipes from '+escapeHtml(region)+' yet</h3>'+
        '<p>It\u2019s '+escapeHtml(their.toLowerCase())+' there right now — but we do have '+
        escapeHtml(seasons.join(' & ').toLowerCase())+' recipes from '+escapeHtml(region)+
        '. <a href="browse.html?q='+encodeURIComponent(region)+'">See all '+escapeHtml(region)+' recipes &rarr;</a></p>';
      empty.hidden=false;
    }else{empty.hidden=true;empty.innerHTML='';}
    if(region){
      chip.hidden=false;
      chip.innerHTML='<span class="sel-chip">You\u2019ve selected <strong>'+escapeHtml(season)+' + '+escapeHtml(region)+'</strong></span>'+
        '<button class="btn btn-outline btn-sm" id="clear-region">Show all '+escapeHtml(season)+' recipes</button>';
      $('#clear-region').addEventListener('click',function(){selected=null;renderMap();renderList(null);});
    }else{chip.hidden=true;chip.innerHTML='';}
    /* Festival cross-link: festive dishes never appear as seasonal mains, but the
       season page points visitors at the festival collections (her rule 2026-10-01). */
    var fl=$('#season-fest-link');
    if(fl){
      var fests=Object.keys(festThisSeason);
      if(!region&&fests.length){
        var links=fests.map(function(fn){
          var n=festThisSeason[fn].length,h=FESTIVAL_PAGE[fn]||'festivals.html';
          return '<a class="chip" href="'+h+'">'+escapeHtml(fn)+' · '+n+' dish'+(n===1?'':'es')+' →</a>';
        }).join('');
        fl.innerHTML='<section class="section"><div class="wrap"><div class="section-head">'+
          '<div><p class="kicker">Celebrate with food</p><h2>Festival dishes this season</h2></div>'+
          '<p>Festive specials live in their festival collections — not in the seasonal mains.</p></div>'+
          '<div class="chips">'+links+'</div></div></section>';
      }else{fl.innerHTML='';}
    }
  }
  /* Region popup (her call 2026-10-01 video): tapping a pin with no in-season
     recipes opens a friendly popup — never a dead end, never a toast. */
  function openPopup(title,bodyHtml,actionsHtml){
    var veil=document.createElement('div');veil.className='modal-veil open';veil.id='region-veil';
    veil.innerHTML='<div class="modal" role="dialog" aria-label="'+escapeHtml(title)+'">'+
      '<button class="modal-close" aria-label="Close">&times;</button>'+
      '<h2>'+escapeHtml(title)+'</h2><p class="lede">'+bodyHtml+'</p>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-start">'+actionsHtml+'</div></div>';
    function close(){document.removeEventListener('keydown',onKey);veil.remove();}
    function onKey(e){if(e.key==='Escape')close();}
    veil.querySelector('.modal-close').addEventListener('click',close);
    veil.addEventListener('click',function(e){if(e.target===veil)close();});
    document.addEventListener('keydown',onKey);
    document.body.appendChild(veil);
    veil.querySelectorAll('[data-act="close"]').forEach(function(b){
      b.addEventListener('click',close);});
    var news=veil.querySelector('[data-act="news"]');
    if(news)news.addEventListener('click',function(){
      close();var n=document.querySelector('.news-band');
      if(n)n.scrollIntoView({behavior:'smooth',block:'center'});});
    return close;
  }
  function showRegionPopup(name,hasOther){
    if(!hasOther){
      openPopup('No recipes from '+name+' yet',
        'The library is growing every season — new regions arrive with our recipe waves. '+
        'Subscribe and we\u2019ll tell you when '+escapeHtml(name)+' lands, or share a family '+
        'recipe to help it get there.',
        '<button class="btn btn-primary btn-sm" data-act="news">Subscribe for updates</button>'+
        '<a class="btn btn-outline btn-sm" href="contact.html">Share a family recipe</a>'+
        '<button class="btn btn-sm" data-act="close" style="color:var(--muted)">Keep exploring</button>');
    }else{
      var their=regionSeason(name,season),seasons=regionSeasons(name);
      openPopup('No '+season.toLowerCase()+' recipes from '+name+' yet',
        'It\u2019s '+escapeHtml(their.toLowerCase())+' there right now — but we do have '+
        escapeHtml(seasons.join(' & ').toLowerCase())+' recipes from '+escapeHtml(name)+'.',
        '<a class="btn btn-primary btn-sm" href="browse.html?q='+encodeURIComponent(name)+'">See '+
        escapeHtml(name)+'\u2019s recipes</a>'+
        '<button class="btn btn-outline btn-sm" data-act="close">Close</button>');
    }
  }
  function selectRegion(name){
    var info=regionInfo(name);
    if(!info.has||!info.inSeason){showRegionPopup(name,info.has);logInterest(name);return;}
    selected=name;renderMap();renderList(name);
    $('#season-grid').scrollIntoView({behavior:'smooth',block:'start'});
  }
  renderMap();renderList(null);
}

/* ---------- recipe page: your note lives with the recipe (her spec 2026-10-01) ----------
   Notes were only visible on the favorites page — now the recipe detail page
   shows your note as part of the recipe itself (paid preview only). */
function initRecipeNote(){
  var favBtn=document.querySelector('.fav-btn-inline[data-recipe]');
  if(!favBtn||!isPaidPreview())return;
  var id=favBtn.getAttribute('data-recipe');
  var anchor=document.querySelector('.parchment');
  if(!anchor||document.getElementById('my-note-card'))return;
  var card=document.createElement('div');
  card.className='info-card';card.id='my-note-card';
  function render(){
    var notes=myMap(NOTES_KEY),note=notes[id];
    card.innerHTML='<h2>Your note</h2>'+
      (note?'<p class="note-text">&ldquo;'+escapeHtml(note)+'&rdquo;</p>'
           :'<p class="micro" style="color:var(--muted)">No note yet — jot down your tweaks and they\u2019ll be here every time you open this recipe.</p>')+
      '<div class="field" style="margin-top:10px"><textarea id="my-note-input" rows="2" placeholder="e.g. halved the sugar, extra ginger">'+escapeHtml(note||'')+'</textarea></div>'+
      '<button class="btn btn-outline btn-sm" id="my-note-save">'+(note?'Update note':'Save note')+'</button>';
    card.querySelector('#my-note-save').addEventListener('click',function(){
      var v=card.querySelector('#my-note-input').value.trim(),n=myMap(NOTES_KEY);
      if(v)n[id]=v;else delete n[id];
      setMyMap(NOTES_KEY,n);toast(v?'Note saved.':'Note removed.');render();
    });
  }
  render();
  anchor.insertAdjacentElement('afterend',card);
}

/* ---------- related recipes: show-more toggle ---------- */
function initRelatedToggle(){
  var btn=$('#related-toggle'),more=$('#related-more');
  if(!btn||!more)return;
  btn.addEventListener('click',function(){
    var opening=more.hidden;
    more.hidden=!opening;
    btn.innerHTML=opening?'Show fewer &uarr;':'Show '+btn.getAttribute('data-n')+' more &darr;';
  });
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded',function(){
  seed();initNav();initCookies();initCookiePage();refreshNavAuth();
  initSignup();initSignin();initAccount();initHearts();initShare();
  initNewsletter();initContact();initFeedback();initBrowse();initKidToggle();
  initCopyPrevention();initHeroSearch();initSeasonPage();initRecipeNote();initRelatedToggle();
});
})();
