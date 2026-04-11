var _isPreview=new URLSearchParams(window.location.search).get('preview')==='1';
var _dir=_isPreview?'./content/preview/':'./content/';

// Instant preview: parse inline data from URL hash (#cms=base64)
var _hashData=null;
try{var _m=window.location.hash.match(/^#cms=(.+)/);if(_m)_hashData=JSON.parse(decodeURIComponent(escape(atob(_m[1]))));}catch(e){}

if(_isPreview){document.title='[PREPROD] '+document.title;var bar=document.createElement('div');bar.style.cssText='position:fixed;top:0;left:0;right:0;background:#c06336;color:#fff;text-align:center;padding:8px 16px;font-size:13px;z-index:9999;font-family:sans-serif;display:flex;align-items:center;justify-content:center;gap:16px;';bar.innerHTML='<span>⚠ Mode préprod — modifications non publiées</span><a href="'+window.location.pathname+'" style="color:#fff;font-size:12px;border:1px solid rgba(255,255,255,0.5);border-radius:4px;padding:2px 10px;text-decoration:none;">Voir la prod</a>';document.body.appendChild(bar);document.body.style.paddingTop='36px';}

// Live update via postMessage (depuis l'admin CMS)
window.addEventListener('message',function(e){
  if(e.data&&e.data.type==='cms-preview'){
    var d=e.data.data;
    _applyMain(d.hero,d.menu,d.galerie,d.infos,d.restaurateurs,d.modale);
    _applyFooter(d.footer,d.mentions);
  }
});

var _mainPromise=_hashData
  ?Promise.resolve([_hashData.hero,_hashData.menu,_hashData.galerie,_hashData.infos,_hashData.restaurateurs,_hashData.modale])
  :Promise.all([
    fetch(_dir+'hero.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
    fetch(_dir+'menu.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
    fetch(_dir+'galerie.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
    fetch(_dir+'infos.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
    fetch(_dir+'restaurateurs.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
    fetch(_dir+'modale.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
  ]);

function _applyMain(hero,menu,galerie,infos,restau,modale){

  // Hero image
  if(hero&&hero.image_header){var e=document.querySelector('.header__hero img');if(e)e.src='./'+hero.image_header;}
  if(hero&&hero.image_header_mobile){var e=document.querySelector('.header__hero source');if(e)e.srcset='./'+hero.image_header_mobile;}

  // Bienvenue textes
  if(hero&&hero.titre){
    var pts=hero.titre.split(' '),mid=Math.ceil(pts.length/2);
    var l1=document.querySelector('.welcome__heading .line1');
    var l2=document.querySelector('.welcome__heading .line2');
    if(l1)l1.textContent=pts.slice(0,mid).join(' ');
    if(l2)l2.textContent=pts.slice(mid).join(' ');
  }
  if(hero&&hero.texte_subtitle){var e=document.querySelector('.welcome__text .subtitle');if(e)e.innerHTML=hero.texte_subtitle;}
  if(hero&&hero.texte_body){var e=document.querySelector('.welcome__text .body-p');if(e)e.innerHTML=hero.texte_body;}
  if(hero&&hero.image_bienvenue){var e=document.querySelector('.welcome__photo');if(e)e.src='./'+hero.image_bienvenue;}
  if(hero&&hero.bouton_reservation&&hero.bouton_reservation.lien){
    document.querySelectorAll('a.nav-cta,a.infos__reserverBtn').forEach(function(el){el.href=hero.bouton_reservation.lien;});
  }

  // Menu image
  if(menu&&menu.image_menu){var e=document.querySelector('.menuPage__imgWrap img');if(e)e.src='./'+menu.image_menu;}

  // Titres de sections
  if(menu&&menu.titre_midi){var els=document.querySelectorAll('.menuTab');if(els[0])els[0].textContent=menu.titre_midi;}
  if(menu&&menu.titre_soir){var els=document.querySelectorAll('.menuTab');if(els[1])els[1].textContent=menu.titre_soir;}
  if(menu&&menu.titre_formules){var els=document.querySelectorAll('.menuBlock__heading');if(els[0])els[0].textContent=menu.titre_formules;}
  if(menu&&menu.titre_suggestion){var els=document.querySelectorAll('.menuBlock__heading');if(els[1])els[1].textContent=menu.titre_suggestion;if(els[3])els[3].textContent=menu.titre_suggestion;}
  if(menu&&menu.titre_classiques){var els=document.querySelectorAll('.menuBlock__heading');if(els[2])els[2].textContent=menu.titre_classiques;if(els[4])els[4].textContent=menu.titre_classiques;}

  // Menu midi formules
  if(menu&&menu.midi&&menu.midi.formules){
    var wrap=document.querySelector('.formulasWrap');
    if(wrap)wrap.innerHTML=menu.midi.formules.map(function(f){
      var p=f.texte.indexOf('—')>-1?f.texte.split('—'):f.texte.split('--');
      return '<div class="formulaRow"><span>'+p[0].trim()+'</span><span>'+(p[1]?'— '+p[1].trim():'')+'</span></div>';
    }).join('');
  }
  if(menu&&menu.midi&&menu.midi.suggestion){var els=document.querySelectorAll('.menuBlock__text');if(els[0])els[0].textContent=menu.midi.suggestion;}
  if(menu&&menu.midi&&menu.midi.classiques){var ul=document.querySelectorAll('.menuList')[0];if(ul)ul.innerHTML=menu.midi.classiques.map(function(p){return '<li>'+p.nom+'</li>';}).join('');}
  if(menu&&menu.soir&&menu.soir.suggestion){var els=document.querySelectorAll('.menuBlock__text');if(els[2])els[2].textContent=menu.soir.suggestion;}
  if(menu&&menu.soir&&menu.soir.classiques){var ul=document.querySelectorAll('.menuList')[1];if(ul)ul.innerHTML=menu.soir.classiques.map(function(p){return '<li>'+p.nom+'</li>';}).join('');}

  // Galerie — reconstruit le slider et relance l'animation
  if(galerie&&galerie.photos&&galerie.photos.length){
    var slider=document.querySelector('.photoSlider');
    if(slider){
      var photos=galerie.photos;
      slider.innerHTML=photos.map(function(p){
        return '<div class="photoSlide" style="width:550px"><img alt="Photo du restaurant" src="./'+p.image+'"/></div>';
      }).join('');
      Array.from(slider.children).forEach(function(slide){
        slider.appendChild(slide.cloneNode(true));
      });
      slider.scrollLeft=0;
    }
  }

  // Barre ouverture dynamique
  (function(){
    var bar=document.getElementById('open-bar');
    var dot=document.getElementById('open-bar-dot');
    var txt=document.getElementById('open-bar-text');
    if(!bar||!txt)return;
    var plages=infos&&infos.horaires_machine;
    var open=false;
    if(plages&&plages.length){
      var now=new Date();
      var parisStr=now.toLocaleString('en-US',{timeZone:'Europe/Paris'});
      var paris=new Date(parisStr);
      var day=paris.getDay();
      var mins=paris.getHours()*60+paris.getMinutes();
      for(var i=0;i<plages.length;i++){
        var p=plages[i];
        if(p.jours.indexOf(day)===-1)continue;
        var dp=p.debut.split(':'),fp=p.fin.split(':');
        var d=parseInt(dp[0])*60+parseInt(dp[1]);
        var f=parseInt(fp[0])*60+parseInt(fp[1]);
        if(mins>=d&&mins<f){open=true;break;}
      }
    }
    if(open){
      txt.textContent=(infos&&infos.msg_ouvert)||'Nous sommes ouverts !';
      bar.classList.remove('openBar--closed');
      if(dot)dot.style.background='#4caf50';
    }else{
      txt.textContent=(infos&&infos.msg_ferme)||'Nous sommes actuellement fermés ! Prenez le temps de réserver pour plus tard';
      bar.classList.add('openBar--closed');
      if(dot)dot.style.background='#b04040';
    }
  })();
  if(infos&&infos.horaires_semaine){
    var smalls=document.querySelectorAll('.infoCard .small');
    if(smalls[0])smalls[0].textContent=infos.horaires_semaine.jours;
    var big=document.querySelector('.infoCard .big');
    if(big)big.innerHTML=infos.horaires_semaine.heures;
  }
  if(infos&&infos.horaires_weekend){
    var smalls=document.querySelectorAll('.infoCard .small');
    if(smalls[1])smalls[1].textContent=infos.horaires_weekend.jours+' - '+infos.horaires_weekend.statut;
  }
  if(infos&&infos.adresse){var e=document.querySelector('.infoCard--address .small');if(e)e.innerHTML=infos.adresse;}
  if(infos&&infos.telephone){
    var big=document.querySelectorAll('.infoCard .big')[1];if(big)big.textContent=infos.telephone;
    var tel=document.querySelector('a[href^="tel:"]');
    if(tel)tel.href='tel:+33'+infos.telephone.replace(/[^0-9]/g,'').substring(1);
  }

  // La Suite
  if(restau&&restau.lasuite){
    var ls=restau.lasuite,panel=document.querySelectorAll('.privPanel')[0];
    if(panel){
      var img=panel.querySelector('.privPanel__imgBox > img');if(img&&ls.image)img.src='./'+ls.image;
      var kicker=panel.querySelector('.privPanel__kicker');if(kicker&&ls.tag)kicker.textContent=ls.tag;
      var titre=panel.querySelector('.privPanel__title');if(titre&&ls.titre)titre.textContent=ls.titre;
      var desc=panel.querySelector('.privPanel__desc');if(desc&&ls.texte)desc.textContent=ls.texte;
      var cta=panel.querySelector('.privPanel__cta');
      if(cta){if(ls.bouton_lien)cta.href=ls.bouton_lien;var s=cta.querySelector('span');if(s&&ls.bouton_label)s.textContent=ls.bouton_label;}
    }
  }

  // Piennolo
  if(restau&&restau.piennolo){
    var pi=restau.piennolo,panel=document.querySelectorAll('.privPanel')[1];
    if(panel){
      var img=panel.querySelector('.privPanel__imgBox > img');if(img&&pi.image)img.src='./'+pi.image;
      var kicker=panel.querySelector('.privPanel__kicker');if(kicker&&pi.tag)kicker.textContent=pi.tag;
      var titre=panel.querySelector('.privPanel__title');if(titre&&pi.titre)titre.textContent=pi.titre;
      var desc=panel.querySelector('.privPanel__desc');if(desc&&pi.texte)desc.textContent=pi.texte;
      var cta=panel.querySelector('.privPanel__cta');
      if(cta){if(pi.bouton_lien)cta.href=pi.bouton_lien;var s=cta.querySelector('span');if(s&&pi.bouton_label)s.textContent=pi.bouton_label;}
    }
  }

  // Modale
  var alertEl=document.querySelector('.alert');
  if(alertEl&&modale){
    if(!modale.active){
      alertEl.style.display='none';
      var rb=document.querySelector('.alert__reopen');if(rb)rb.style.display='none';
    } else {
      if(modale.titre){var e=alertEl.querySelector('.alert__text');if(e)e.textContent=modale.titre;}
      if(modale.contenu){
        var e=alertEl.querySelector('.alert__list');
        if(e){
          e.innerHTML=modale.contenu.split('\n').filter(function(l){return l.trim();}).map(function(l){return '<p>'+l+'</p>';}).join('');
          if(modale.sous_texte)e.innerHTML+='<p>&nbsp;</p><p>'+modale.sous_texte+'</p>';
        }
      }
      var cta=alertEl.querySelector('.alert__cta');
      if(cta){
        if(modale.bouton_lien)cta.href=modale.bouton_lien;
        var s=cta.querySelector('span');if(s&&modale.bouton_label)s.textContent=modale.bouton_label;
      }
    }
  }

}

_mainPromise.then(function(r){_applyMain(r[0],r[1],r[2],r[3],r[4],r[5]);});

// Footer
var _footerPromise=_hashData
  ?Promise.resolve([_hashData.footer,_hashData.mentions])
  :Promise.all([
    fetch(_dir+'footer.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
    fetch(_dir+'mentions.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
  ]);

function _applyFooter(footer,mentions){

  if(footer&&footer.image){
    var e=document.querySelector('.follow__bg');if(e)e.src='./'+footer.image;
  }
  if(footer&&footer.suivez){
    var e=document.querySelector('.follow__title');if(e)e.textContent=footer.suivez;
  }
  if(footer&&footer.instagram){
    var e=document.querySelector('.follow__cta');if(e)e.href=footer.instagram;
  }

  if(mentions&&mentions.sections&&mentions.sections.length){
    var main=document.querySelector('main');
    if(main&&window.location.pathname.includes('mentions-legales')){
      main.innerHTML=mentions.sections.map(function(s){
        return '<section class="ml-section"><h2>'+s.titre+'</h2><div>'+s.contenu+'</div></section>';
      }).join('');
    }
  }
}

_footerPromise.then(function(r){_applyFooter(r[0],r[1]);});
