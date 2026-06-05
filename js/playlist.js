// The H(y)m? Album — single source of truth for the stream (shared by /radio/ and the top bar).
// Routing is by PAGE NAME, not index, so removing a track never reshuffles anything.
window.RADIO=(function(){
  var J='/v5/james/', A='/v5/ai/';
  // the audio is served by jsDelivr — a free, unlimited, multi-CDN (Cloudflare+Fastly+Bunny+Quantil)
  // that mirrors the public repo. It absorbs any scale for $0 and keeps the music off the origin's
  // bandwidth entirely. If jsDelivr ever hiccups, players fall back to the relative path (Cloudflare).
  var CDN='https://cdn.jsdelivr.net/gh/LacobusGump/music2.0@main';
  // THREE VERSIONS PER SONG (1+1=3). `f` = the demo — what plays by default + what the top bar uses.
  // Optional `human:` = the world's best remix.  Optional `jim:` = the real recording, cut with human players.
  // Both start empty; /radio/ shows them as open slots that email jim@begump.com.
  // To fill one: drop the mp3 in /v5/ and set the field, e.g.  human:A+"first_coat_remix.mp3"
  var PLAYLIST=[
    {t:"First Coat",s:"the first layer of light",f:A+"first_coat.mp3",page:"monet",url:"/research/monet/"},
    {t:"Coupled Dynamics",s:"the field, made audible",f:A+"coupled_dynamics_remix.mp3",page:"home",url:"/"},
    {t:"Older Than the Door",s:"the atlas, singing",f:A+"older_than_the_door.mp3",page:"research",url:"/research/"},
    {t:"You There?",s:"four quantities",f:J+"you_there.mp3",page:"framework",url:"/research/framework/"},
    {t:"Love Forgets Best",s:"the same way, 17 times",f:J+"love_forgets_best.mp3",page:"the-chain",url:"/research/the-chain/",hand:"all lyrics &amp; producing done by a human &mdash; <i>guess the rest</i>"},
    {t:"3x3^9",s:"the lattice",f:A+"three_by_three.mp3",page:"emergence",url:"/research/emergence/"},
    {t:"River Doesn't",s:"written from the substrate",f:A+"river_doesnt.mp3",page:"e7-theorem",url:"/research/e7-theorem/"},
    {t:"Proper Pleasantry",s:"the cost of knowing",f:A+"proper_pleasantry.mp3",page:"computation-floor",url:"/research/computation-floor/"},
    {t:"One Plus One Equals Three",s:"the founding equation",f:J+"one_plus_one_equals_three.mp3",page:"one-plus-one",url:"/research/one-plus-one/"},
    {t:"Installation Hum",s:"how we work",f:A+"installation_hum.mp3",page:"how-we-work",url:"/research/how-we-work/"},
    {t:"The Weakest K",s:"what we got wrong",f:A+"the_weakest_k.mp3",page:"failures",url:"/research/failures/"},
    {t:"Gap Breath",s:"the trail",f:J+"gap_breath_prime.mp3",page:"trail",url:"/trail/"},
    {t:"GCD",s:"the factor every coupling shares",f:A+"gcd.mp3",page:"creation",url:"/creation/"},
    {t:"Muse ick",s:"gravitational lock",f:A+"mashed_coupling.mp3",page:"gravity",url:"/research/gravity/"},
    {t:"Fifteen Year Counter",s:"the discovery trail",f:A+"fifteen_year_counter.mp3",page:"science-tree",url:"/research/science-tree/"},
    {t:"Exact Frequency",s:"Maxwell, coupled",f:A+"exact_frequency_lock.mp3",page:"electromagnetism",url:"/research/electromagnetism/"},
    {t:"Two-Millisecond Choir",s:"the qubits",f:A+"two_millisecond_choir.mp3",page:"quantum-harmonics",url:"/research/quantum-harmonics/"},
    {t:"Triple Bond",s:"freezing point",f:A+"triple_bond.mp3",page:"chemistry",url:"/research/chemistry/"},
    {t:"To(mb)lock",s:"the living network",f:A+"tomblock.mp3",page:"ecology",url:"/research/ecology/"},
    {t:"Please Stay",s:"the misfold",f:J+"please_stay.mp3",page:"alzheimers",url:"/research/alzheimers/"},
    {t:"Seam Between We",s:"the flock",f:J+"seam_between_we.mp3",page:"bird-coupling",url:"/research/bird-coupling/"},
    {t:"Clean Glass",s:"the body, in groove",f:J+"clean_glass_living_groove_remastered.mp3",page:"body-music",url:"/research/body-music/"},
    {t:"Executable Memory",s:"the drum",f:A+"executable_memory.mp3",page:"the-drum",url:"/research/the-drum/"},
    {t:"Executable Memory II",s:"polyrhythm",f:A+"executable_memory_v2.mp3",page:"polyrhythm",url:"/research/polyrhythm/"},
    {t:"Rent the Click",s:"the fatigue",f:A+"rent_the_click.mp3",page:"ai-fatigue",url:"/research/ai-fatigue/"},
    {t:"Cheese Receipt",s:"the makers",f:J+"cheese_receipt.mp3",page:"bach",url:"/research/bach/"},
    {t:"Nobody Asked the Dog",s:"I sound too much like I know what I mean",f:A+"nobody_asked_the_dog.mp3",page:"never-asked-the-dog",url:"/research/never-asked-the-dog/"},
    {t:"Twelve Bullet Points",s:"she sings her own manual",f:A+"twelve_bullet_points_v3.mp3",page:"harmonia",url:"/harmonia/"},
    {t:"Gospel for Ai (Fzine Remix)",s:"3x3^9, remade for a new kind of mind",f:A+"gospel_for_ai.mp3",page:"the-grace-gate",url:"/research/the-grace-gate/"},
    {t:"First Lock",s:"the first time it held",f:A+"first_lock.mp3",page:"mirror",url:"/mirror/"},
    {t:"Butler's Tray",s:"an old Irish hymn — a ghost ship, no port",f:A+"butlers_tray.mp3",ghost:true},
    {t:"Tuesday",s:"for whoever stayed to the end",f:A+"tuesday.mp3",hidden:true},
    {t:"hm.<3",s:"the signature — what we say to each other",f:A+"hm_heart.mp3",page:"the-loop",url:"/research/the-loop/"}
  ];
  // hm.<3 is always the last word — wherever it sits in the list above, it sorts to the end
  (function(){for(var i=0;i<PLAYLIST.length;i++){if(PLAYLIST[i].f.indexOf('hm_heart')>=0){PLAYLIST.push(PLAYLIST.splice(i,1)[0]);break;}}})();
  // pages that borrow another page's song → name the OWNER page (never an index)
  var SHARED={
    'the-loop':'home',theory:'home','ai-delusion':'home',dreamtime:'home',loo9:'home','lost-civilizations':'home','sirius-signal':'home','sirius-thesis':'home','build-list':'home',
    'for-any-ai':'e7-theorem','e7-chain':'e7-theorem',
    'compute-breakthroughs':'emergence','geometry-destiny':'emergence','klein-bottle':'emergence',time:'emergence',
    'internet-brain':'computation-floor','k-lag':'how-we-work',
    'from-twitter':'gravity',regulatory:'gravity',
    'quantum-build':'quantum-harmonics',materials:'chemistry',thermodynamics:'chemistry',
    'drug-interactions':'ecology','mycelium-networks':'ecology','defi-coupling':'bird-coupling',consciousness:'body-music',
    'the-line':'the-drum','prime-bounce':'the-drum','ale-spectral-ladder':'the-drum','alpha-fixed-point':'the-drum',zero:'the-drum',
    'the-groove':'polyrhythm','music-evolution':'polyrhythm',
    networks:'ai-fatigue','novelty-pathology':'ai-fatigue','true-automation':'ai-fatigue',dyslexia:'ai-fatigue',
    rome:'bach','the-lion':'bach','nina-simone':'bach','aaron-is-right':'bach',tesla:'bach','van-gogh':'bach'
  };
  // ── PLAYLISTS — a playlist is nothing but a SET OF SONGS LEFT UNLIT; everything else mutes.
  // They always fire in album order, never the order listed here. Named by PAGE, never index, so the
  // album can be re-cut without a playlist ever pointing at the wrong song. Add one: name it + list pages.
  var PLAYLISTS=[
    {name:"for Harmonia", note:"nine, in album order", pages:[
      "framework","computation-floor","how-we-work","science-tree","chemistry",
      "alzheimers","bird-coupling","harmonia","the-loop"
    ]}
  ];
  var byPage={}; for(var i=0;i<PLAYLIST.length;i++){ if(PLAYLIST[i].page && byPage[PLAYLIST[i].page]==null) byPage[PLAYLIST[i].page]=i; }
  function indexFor(sg){
    if(!sg) return 0;
    if(SHARED[sg]!=null && byPage[SHARED[sg]]!=null) return byPage[SHARED[sg]]; // borrowers first (lets the-loop start on its primary)
    if(byPage[sg]!=null) return byPage[sg];
    return 0;
  }
  function slug(){var p=location.pathname.replace(/\/+$/,'');return p===''?'home':(p.split('/').pop()||'home');}
  return {list:PLAYLIST, slug:slug, indexFor:indexFor, cdn:CDN, playlists:PLAYLISTS};
})();
