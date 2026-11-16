(function(){
"use strict";
var D=window.PRAGUE, H=D.hotel;
var CATS={
  xmas:{l:"שווקי חג המולד",e:"🎄",c:"#1f8a4c"},
  food:{l:"אוכל",e:"🍽️",c:"#e4572e"},
  cafe:{l:"קפה ומאפים",e:"☕",c:"#a86b32"},
  sights:{l:"אטרקציות ותצפיות",e:"📸",c:"#2a7fbd"},
  bars:{l:"ברים",e:"🍸",c:"#c2255c"},
  shop:{l:"קניות ושווקים",e:"🛍️",c:"#8e44ad"},
  other:{l:"אחר",e:"📍",c:"#6b6b6b"}
};
var ORDER=["xmas","food","cafe","sights","bars","shop","other"];
var LS="prague26-visited";
var visited={}; try{visited=JSON.parse(localStorage.getItem(LS)||"{}")||{};}catch(e){visited={};}
var state={cat:"all",sort:"cat",hideV:false,sel:null};
function enc(s){return encodeURIComponent(s);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function hav(a,b,c,d){var R=6371000,r=Math.PI/180,x=(c-a)*r,y=(d-b)*r;var h=Math.sin(x/2)*Math.sin(x/2)+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)*Math.sin(y/2);return 2*R*Math.asin(Math.sqrt(h));}
function walk(p){var m=hav(H.lat,H.lng,p.lat,p.lng)*1.3;return {m:m,min:Math.max(1,Math.round(m/80))};}
function distTxt(w){
  var km=w.m>=1000?(w.m/1000).toFixed(1)+" ק״מ":(Math.round(w.m/10)*10)+" מ׳";
  var t=w.min<60?w.min+" דק׳":(Math.floor(w.min/60)+" ש׳ "+(w.min%60?w.min%60+" דק׳":""));
  return "🚶 ≈ "+t+" הליכה מהמלון · "+km+" (משוער)";
}
function gUrl(p){
  if(p.pid) return "https://www.google.com/maps/search/?api=1&query="+enc(p.g)+"&query_place_id="+p.pid;
  return "https://www.google.com/maps/search/?api=1&query="+enc(p.q||(p.g+(p.a?" "+p.a:"")));
}
function dirUrl(p){
  var u="https://www.google.com/maps/dir/?api=1&origin="+enc(H.g)+"&origin_place_id="+H.pid;
  if(p.pid) u+="&destination="+enc(p.g)+"&destination_place_id="+p.pid; else u+="&destination="+p.lat+","+p.lng;
  return u+"&travelmode=walking";
}
var all=D.places.map(function(p){p.w=walk(p);p.key=String(p.id);return p;});
var extras=D.extras.map(function(p){p.w=walk(p);p.key=String(p.id);p.extra=true;return p;});
function byKey(k){for(var i=0;i<all.length;i++)if(all[i].key===k)return all[i];for(i=0;i<extras.length;i++)if(extras[i].key===k)return extras[i];return null;}

/* map */
var map=L.map("map",{zoomControl:true,tap:true}).setView([H.lat,H.lng],14);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
var hotelM=L.marker([H.lat,H.lng],{icon:L.divIcon({className:"",html:'<div class="hotel-pin" aria-label="המלון">🏨</div>',iconSize:[46,46],iconAnchor:[23,23],popupAnchor:[0,-22]}),zIndexOffset:2000,title:"המלון"}).addTo(map);
hotelM.bindPopup('<div class="pp-n">🏨 המלון שלך – '+esc(H.n)+'</div><div class="meta">'+esc(H.a)+(H.r?' · <span class="star">★</span> '+H.r:'')+'</div><div class="acts"><a class="btn g" target="_blank" rel="noopener" href="'+gUrl(H)+'">פתח בגוגל מפות</a></div>');
var markers={};
function pinIcon(p){
  var c=CATS[p.c]||CATS.other, cls="pin"+(visited[p.key]?" vis":"")+(state.sel===p.key?" sel":"")+(p.extra?" extra":"");
  return L.divIcon({className:"",html:'<div class="'+cls+'" style="--c:'+c.c+'"><span>'+c.e+'</span></div>',iconSize:[30,30],iconAnchor:[15,30],popupAnchor:[0,-28]});
}
function popupHtml(p){
  var c=CATS[p.c]||CATS.other;
  return '<div class="pp-n">'+c.e+' '+esc(p.n)+'</div>'+(p.note?'<div class="meta">📝 '+esc(p.note)+'</div>':'')+'<div class="pp-d">'+esc(distTxt(p.w))+'</div><div class="acts"><a class="btn g" target="_blank" rel="noopener" href="'+gUrl(p)+'">פתח בגוגל מפות</a><a class="btn nav" target="_blank" rel="noopener" href="'+dirUrl(p)+'">ניווט מהמלון</a></div>';
}
function addMarker(p){
  var m=L.marker([p.lat,p.lng],{icon:pinIcon(p),title:p.n,riseOnHover:true});
  m.bindPopup(popupHtml(p),{autoPanPaddingTopLeft:[10,60]});
  m.on("click",function(){select(p.key,true);});
  markers[p.key]=m; return m;
}
all.forEach(addMarker); extras.forEach(addMarker);
function refreshIcon(k){var p=byKey(k);if(p&&markers[k])markers[k].setIcon(pinIcon(p));}
function visible(p){
  if(state.cat!=="all"&&p.c!==state.cat)return false;
  if(state.hideV&&visited[p.key])return false;
  return true;
}
var extrasOpen=false;
function syncMarkers(){
  all.forEach(function(p){var m=markers[p.key];if(visible(p)){if(!map.hasLayer(m))m.addTo(map);}else if(map.hasLayer(m))map.removeLayer(m);});
  extras.forEach(function(p){var m=markers[p.key];if(extrasOpen&&visible(p)){if(!map.hasLayer(m))m.addTo(map);}else if(map.hasLayer(m))map.removeLayer(m);});
}
function fitAll(){
  var pts=[[H.lat,H.lng]];all.forEach(function(p){if(visible(p))pts.push([p.lat,p.lng]);});
  if(pts.length>1)map.fitBounds(pts,{padding:[30,30],maxZoom:16});else map.setView([H.lat,H.lng],15);
}

/* list */
function cardHtml(p){
  var c=CATS[p.c]||CATS.other, v=!!visited[p.key];
  var meta=[];
  if(p.gc)meta.push(esc(p.gc));
  if(p.r)meta.push('<span class="star">★</span> '+p.r+(p.rv?' ('+Number(p.rv).toLocaleString("he-IL")+')':''));
  if(p.k>1)meta.push("שמור אצלך "+p.k+" פעמים");
  return '<article class="card'+(v?' visited':'')+(state.sel===p.key?' sel':'')+'" id="c-'+p.key+'" data-k="'+p.key+'">'+
   '<span class="dot" style="--c:'+c.c+'" aria-hidden="true">'+c.e+'</span><div class="body">'+
   '<h3 class="nm" tabindex="0" role="button" aria-label="הצג על המפה: '+esc(p.n)+'">'+esc(p.n)+'</h3>'+
   (meta.length?'<div class="meta">'+meta.join(" · ")+'</div>':'')+
   '<p class="desc">'+esc(p.d)+'</p>'+
   (p.note?'<div class="note">📝 ההערה שלך: '+esc(p.note)+'</div>':'')+
   '<div class="dist">'+esc(distTxt(p.w))+'</div>'+
   '<div class="acts"><a class="btn g" target="_blank" rel="noopener" href="'+gUrl(p)+'">פתח בגוגל מפות</a>'+
   '<a class="btn nav" target="_blank" rel="noopener" href="'+dirUrl(p)+'">ניווט מהמלון</a>'+
   '<button type="button" class="btn v'+(v?' on':'')+'" data-v="'+p.key+'" aria-pressed="'+v+'">'+(v?'✓ ביקרתי':'○ ביקרתי')+'</button></div>'+
   '</div></article>';
}
var listEl=document.getElementById("list");
function renderList(){
  var items=all.filter(visible), h="";
  if(!items.length)h='<div class="empty">אין כאן מקומות להצגה</div>';
  else if(state.sort==="near"){
    items.sort(function(a,b){return a.w.m-b.w.m;});
    h=items.map(cardHtml).join("");
  } else {
    ORDER.forEach(function(k){
      var g=items.filter(function(p){return p.c===k;}).sort(function(a,b){return a.w.m-b.w.m;});
      if(!g.length)return;
      h+='<h2 class="grp"><span class="dot" style="--c:'+CATS[k].c+'" aria-hidden="true">'+CATS[k].e+'</span>'+CATS[k].l+' <span class="n">'+g.length+'</span></h2>'+g.map(cardHtml).join("");
    });
  }
  listEl.innerHTML=h;
  document.getElementById("extrasList").innerHTML=extras.map(cardHtml).join("");
  var nv=Object.keys(visited).filter(function(k){return visited[k]&&byKey(k);}).length;
  document.getElementById("visitedCount").textContent="✓ ביקרתי ב-"+nv+" מתוך "+all.length;
}
function renderChips(){
  var h='<button type="button" class="chip'+(state.cat==="all"?" on":"")+'" data-c="all" aria-pressed="'+(state.cat==="all")+'">הכול '+all.length+'</button>';
  ORDER.forEach(function(k){var n=all.filter(function(p){return p.c===k;}).length;if(!n)return;
    h+='<button type="button" class="chip'+(state.cat===k?" on":"")+'" data-c="'+k+'" aria-pressed="'+(state.cat===k)+'">'+CATS[k].e+" "+CATS[k].l+" "+n+'</button>';});
  document.getElementById("chips").innerHTML=h;
}
document.getElementById("placesCount").textContent=all.length+" מקומות מהרשימה שלך";

function select(k,fromMap){
  var prev=state.sel; state.sel=k;
  if(prev&&prev!==k){refreshIcon(prev);var pc=document.getElementById("c-"+prev);if(pc)pc.classList.remove("sel");}
  refreshIcon(k);
  var card=document.getElementById("c-"+k); if(card)card.classList.add("sel");
  var m=markers[k], p=byKey(k);
  if(fromMap){ if(card)card.scrollIntoView({behavior:"smooth",block:"start"}); }
  else if(m&&p){
    if(!map.hasLayer(m))m.addTo(map);
    map.setView([p.lat,p.lng],Math.max(map.getZoom(),16),{animate:true});
    setTimeout(function(){m.openPopup();},250);
  }
}
listEl.addEventListener("click",onListClick); document.getElementById("extrasList").addEventListener("click",onListClick);
function onListClick(e){
  var vb=e.target.closest("[data-v]");
  if(vb){var k=vb.getAttribute("data-v");if(visited[k])delete visited[k];else visited[k]=Date.now();
    try{localStorage.setItem(LS,JSON.stringify(visited));}catch(_){}
    refreshIcon(k); renderList(); syncMarkers(); return;}
  if(e.target.closest("a"))return;
  var c=e.target.closest(".card"); if(c)select(c.getAttribute("data-k"),false);
}
listEl.addEventListener("keydown",function(e){if((e.key==="Enter"||e.key===" ")&&e.target.classList.contains("nm")){e.preventDefault();var c=e.target.closest(".card");select(c.getAttribute("data-k"),false);}});
document.getElementById("chips").addEventListener("click",function(e){var b=e.target.closest("[data-c]");if(!b)return;state.cat=b.getAttribute("data-c");renderChips();renderList();syncMarkers();fitAll();});
document.querySelectorAll(".seg button").forEach(function(b){b.addEventListener("click",function(){state.sort=b.getAttribute("data-sort");document.querySelectorAll(".seg button").forEach(function(x){x.classList.toggle("on",x===b);});renderList();});});
document.getElementById("hideVisited").addEventListener("change",function(e){state.hideV=e.target.checked;renderList();syncMarkers();});
document.getElementById("extras").addEventListener("toggle",function(e){extrasOpen=e.target.open;syncMarkers();});
document.getElementById("btnHotel").addEventListener("click",function(){map.setView([H.lat,H.lng],16);hotelM.openPopup();});
document.getElementById("btnFit").addEventListener("click",fitAll);
var meM=null;
document.getElementById("btnMe").addEventListener("click",function(){
  if(!navigator.geolocation){alert("המכשיר לא תומך במיקום");return;}
  navigator.geolocation.getCurrentPosition(function(pos){
    var ll=[pos.coords.latitude,pos.coords.longitude];
    if(!meM)meM=L.marker(ll,{icon:L.divIcon({className:"",html:'<div class="me-dot"></div>',iconSize:[18,18],iconAnchor:[9,9]}),zIndexOffset:3000}).addTo(map).bindPopup("את כאן");
    else meM.setLatLng(ll);
    map.setView(ll,16);
  },function(){alert("לא הצלחתי לקבל מיקום – צריך לאשר גישה למיקום");},{enableHighAccuracy:true,timeout:10000});
});
function setHH(){var t=document.querySelector(".top");document.documentElement.style.setProperty("--hh",t.offsetHeight+"px");map.invalidateSize();}
window.addEventListener("resize",setHH);
renderChips(); renderList(); syncMarkers(); setHH(); if(window.innerWidth<900)map.setView([50.0852,14.4215],14); else fitAll();
window.__prague={all:all,extras:extras,select:select,state:state};
})();
