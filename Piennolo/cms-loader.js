var _isPreview=new URLSearchParams(window.location.search).get('preview')==='1';
var _dir=_isPreview?'./content/preview/':'./content/';

var _hashData=null;
try{var _m=window.location.hash.match(/^#cms=(.+)/);if(_m)_hashData=JSON.parse(decodeURIComponent(escape(atob(_m[1]))));}catch(e){}

if(_isPreview){document.title='[PREPROD] '+document.title;}

window.addEventListener('message',function(e){
  if(e.data&&e.data.type==='cms-preview'){
    var d=e.data.data;
    _applyAll(d.modale,d.hero,d.bienvenue,d.menu,d.infos,d.chef,d.galerie,d.restaurateurs,d.footer);
  }
  if(e.data&&e.data.type==='cms-scroll-to'){
    var el=document.querySelector(e.data.selector);
    if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
  }
});

var _mainPromise=_hashData
  ?Promise.resolve([_hashData.modale,_hashData.hero,_hashData.bienvenue,_hashData.menu,_hashData.infos,_hashData.chef,_hashData.galerie,_hashData.restaurateurs,_hashData.footer])
  :Promise.all([
    fetch(_dir+'modale.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
    fetch(_dir+'hero.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
    fetch(_dir+'bienvenue.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
    fetch(_dir+'menu.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
    fetch(_dir+'infos.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
    fetch(_dir+'chef.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
    fetch(_dir+'galerie.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
    fetch(_dir+'restaurateurs.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
    fetch(_dir+'footer.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
  ]);

function _badgeHTML(badge){
  if(!badge)return '';
  var icons={vege:'icon-vege.svg',poisson:'icon-poisson.svg',piquant:'icon-picante.svg'};
  var labels={vege:'Végé',poisson:'Poisson',piquant:'Piquante'};
  var icon=icons[badge],label=labels[badge];
  if(!icon)return '';
  return '<span class="badge badge-'+badge+'"><img src="./piennolo-assets/'+icon+'" alt="" width="16" height="16"> '+label+'</span>';
}

function _menuItemsHTML(items){
  return items.map(function(item){
    return '<li class="menu-item"><div class="menu-item-top"><span class="menu-item-name">'+item.nom+'</span>'+_badgeHTML(item.badge)+'</div></li>';
  }).join('');
}

function _applyAll(modale,hero,bienvenue,menu,infos,chef,galerie,restaurateurs,footer){

  // Modale (hero-card)
  if(modale){
    var card=document.getElementById('hero-card');
    var reopen=document.getElementById('hero-card-reopen');
    if(card){
      if(!modale.active){
        card.style.display='none';
        if(reopen)reopen.style.display='none';
      } else {
        var score=card.querySelector('.hero-card-score');
        if(score&&modale.note){
          var parts=modale.note.split(',');
          score.innerHTML='<span class="big">'+parts[0]+'</span>'+(parts[1]?','+parts[1]:'')+'<span class="small"> /'+modale.note_max+'</span>';
        }
        var labelTitle=card.querySelector('.hero-card-label-title');
        if(labelTitle&&modale.label_qualite)labelTitle.textContent=modale.label_qualite;
        var labelSub=card.querySelector('.hero-card-label-sub');
        if(labelSub&&modale.label_avis)labelSub.textContent=modale.label_avis;
        var btn=card.querySelector('.hero-card-btn');
        if(btn){
          if(modale.bouton_label){var sp=btn.querySelector('span');if(sp)sp.textContent=modale.bouton_label;else btn.textContent=modale.bouton_label;}
          if(modale.bouton_lien)btn.href=modale.bouton_lien;
        }
      }
    }
  }

  // Hero
  if(hero){
    if(hero.image_header){
      var img=document.querySelector('.hero-photo-wrap picture img');
      if(img)img.src='./'+hero.image_header;
    }
  }

  // Bienvenue
  if(bienvenue){
    if(bienvenue.titre){var e=document.querySelector('.benv-title');if(e)e.textContent=bienvenue.titre;}
    var ps=document.querySelectorAll('.benv-body p');
    if(bienvenue.texte_1&&ps[0])ps[0].textContent=bienvenue.texte_1;
    if(bienvenue.texte_2&&ps[1])ps[1].textContent=bienvenue.texte_2;
    if(bienvenue.image_1){var e=document.querySelector('.benv-card-main img');if(e)e.src='./'+bienvenue.image_1;}
    if(bienvenue.image_2){var e=document.querySelector('.benv-photo-right img');if(e)e.src='./'+bienvenue.image_2;}
    if(bienvenue.image_3){var e=document.querySelector('.benv-photo-left img');if(e)e.src='./'+bienvenue.image_3;}
  }

  // Menu
  if(menu){
    if(menu.titre){var e=document.querySelector('.menu-card-title');if(e)e.textContent=menu.titre;}
    if(menu.antipasti){var ul=document.querySelector('[data-cms="antipasti"]');if(ul)ul.innerHTML=_menuItemsHTML(menu.antipasti);}
    if(menu.pizzas){var ul=document.querySelector('[data-cms="pizzas"]');if(ul)ul.innerHTML=_menuItemsHTML(menu.pizzas);}
    if(menu.desserts){var ul=document.querySelector('[data-cms="desserts"]');if(ul)ul.innerHTML=_menuItemsHTML(menu.desserts);}
    var menuBtn=document.querySelector('.menu-btn');
    if(menuBtn){
      if(menu.bouton_label)menuBtn.textContent=menu.bouton_label;
      if(menu.bouton_type==='pdf'&&menu.bouton_pdf){menuBtn.href='./'+menu.bouton_pdf;}
      else if(menu.bouton_type==='lien'&&menu.bouton_lien){menuBtn.href=menu.bouton_lien;}
    }
  }

  // Infos & horaires
  if(infos){
    // Barre ouverture dynamique
    var dot=document.querySelector('.info-bar-dot');
    var txt=document.querySelector('.info-bar-text');
    if(dot&&txt&&infos.horaires_machine){
      var now=new Date();
      var parisStr=now.toLocaleString('en-US',{timeZone:'Europe/Paris'});
      var paris=new Date(parisStr);
      var day=paris.getDay();
      var mins=paris.getHours()*60+paris.getMinutes();
      var isOpen=false;
      for(var i=0;i<infos.horaires_machine.length;i++){
        var p=infos.horaires_machine[i];
        if(p.jours.indexOf(day)===-1)continue;
        var dp=p.debut.split(':'),fp=p.fin.split(':');
        var d=parseInt(dp[0])*60+parseInt(dp[1]);
        var f=parseInt(fp[0])*60+parseInt(fp[1]);
        if(mins>=d&&mins<f){isOpen=true;break;}
      }
      dot.classList.toggle('is-open',isOpen);
      dot.classList.toggle('is-closed',!isOpen);
      txt.textContent=isOpen?(infos.msg_ouvert||'Nous sommes ouverts !'):(infos.msg_ferme||'Nous sommes actuellement fermés !');
    }

    // Horaires display
    if(infos.horaires_display){
      var wrap=document.querySelector('[data-cms="horaires"]');
      if(wrap){
        wrap.innerHTML=infos.horaires_display.map(function(h){
          return '<div class="info-horaire-row"><span class="info-horaire-jours">'+h.jours+'</span><span class="info-horaire-heures">'+h.heures+'</span></div>';
        }).join('');
      }
    }
    if(infos.adresse){var e=document.querySelector('[data-cms="adresse"]');if(e)e.textContent=infos.adresse;}
    if(infos.ville){var e=document.querySelector('[data-cms="ville"]');if(e)e.textContent=infos.ville;}
    if(infos.telephone){var e=document.querySelector('[data-cms="telephone"]');if(e)e.textContent=infos.telephone;}
    if(infos.bouton_reservation&&infos.bouton_reservation.lien){
      document.querySelectorAll('a.nav-btn, a.info-bar-btn').forEach(function(el){el.href=infos.bouton_reservation.lien;});
    }
  }

  // Chef
  if(chef){
    if(chef.titre){var e=document.querySelector('.chef-title');if(e)e.textContent=chef.titre;}
    if(chef.texte){var e=document.querySelector('.chef-body p:first-child');if(e)e.textContent=chef.texte;}
    if(chef.sous_texte){var e=document.querySelector('.chef-body p:last-child');if(e)e.textContent=chef.sous_texte;}
    if(chef.image_bg){var e=document.querySelector('.chef-bg');if(e)e.src='./'+chef.image_bg;}
    var videoWrap=document.querySelector('.chef-video-wrap');
    var muteBtn=document.querySelector('.chef-mute-btn');
    if(chef.media_type==='photo'){
      if(videoWrap){
        var video=videoWrap.querySelector('video');
        if(video)video.pause();
        videoWrap.innerHTML='<img class="chef-video" src="./'+(chef.media_photo||'')+'" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" alt="">';
      }
      if(muteBtn)muteBtn.style.display='none';
    } else {
      if(videoWrap&&chef.media_video){
        var video=videoWrap.querySelector('video');
        if(video){var source=video.querySelector('source');if(source)source.src='./'+chef.media_video;video.load();}
      }
      if(muteBtn)muteBtn.style.display='';
    }
  }

  // Galerie
  if(galerie&&galerie.photos&&galerie.photos.length){
    var slider=document.getElementById('piennolo-slider');
    if(slider){
      slider.innerHTML=galerie.photos.map(function(p){
        return '<div class="photoSlide" style="width:550px"><img alt="'+(p.alt||'Photo Piennolo')+'" src="./'+p.image+'" loading="lazy" /></div>';
      }).join('');
      Array.from(slider.children).forEach(function(slide){
        slider.appendChild(slide.cloneNode(true));
      });
      slider.scrollLeft=0;
    }
  }

  // Restaurateurs (La Suite & Le Grand Pan)
  if(restaurateurs){
    var cols=document.querySelectorAll('.promo-col');
    if(cols[0]&&restaurateurs.lasuite){
      var ls=restaurateurs.lasuite;
      var img=cols[0].querySelector('.promo-photo');if(img&&ls.image)img.src='./'+ls.image;
      var tag=cols[0].querySelector('.promo-eyebrow');if(tag&&ls.tag)tag.textContent=ls.tag;
      var titre=cols[0].querySelector('.promo-title');if(titre&&ls.titre)titre.textContent=ls.titre;
      var desc=cols[0].querySelector('.promo-body');if(desc&&ls.texte)desc.textContent=ls.texte;
      var btn=cols[0].querySelector('.promo-btn');
      if(btn){if(ls.bouton_label)btn.textContent=ls.bouton_label;if(ls.bouton_lien)btn.href=ls.bouton_lien;}
    }
    if(cols[1]&&restaurateurs.legrandpan){
      var gp=restaurateurs.legrandpan;
      var img=cols[1].querySelector('.promo-photo');if(img&&gp.image)img.src='./'+gp.image;
      var tag=cols[1].querySelector('.promo-eyebrow');if(tag&&gp.tag)tag.textContent=gp.tag;
      var titre=cols[1].querySelector('.promo-title');if(titre&&gp.titre)titre.textContent=gp.titre;
      var desc=cols[1].querySelector('.promo-body');if(desc&&gp.texte)desc.textContent=gp.texte;
      var btn=cols[1].querySelector('.promo-btn');
      if(btn){if(gp.bouton_label)btn.textContent=gp.bouton_label;if(gp.bouton_lien)btn.href=gp.bouton_lien;}
    }
  }

  // Footer
  if(footer){
    if(footer.titre){var e=document.querySelector('.footer-title');if(e)e.textContent=footer.titre;}
    if(footer.instagram){var e=document.querySelector('.footer-insta-btn');if(e)e.href=footer.instagram;}
    if(footer.image){var e=document.querySelector('.footer-bg img');if(e)e.src='./'+footer.image;}
  }
}

_mainPromise.then(function(r){_applyAll(r[0],r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8]);});
