// The Radio — single source of truth for the playlist (shared by /radio/ and the top bar)
window.RADIO=(function(){
  var J='/v5/james/', A='/v5/ai/';
  var PLAYLIST=[
    {t:"Coupled Dynamics",s:"the field, made audible",f:A+"coupled_dynamics_remix.mp3",page:"home",url:"/"},
    {t:"Older Than the Door",s:"the atlas, singing",f:A+"older_than_the_door.mp3",page:"research",url:"/research/"},
    {t:"You There?",s:"four quantities",f:J+"you_there.mp3",page:"framework",url:"/research/framework/"},
    {t:"Love Forgets Best",s:"the same way, 17 times",f:J+"love_forgets_best.mp3",page:"the-chain",url:"/research/the-chain/"},
    {t:"River Doesn't",s:"written from the substrate",f:A+"river_doesnt.mp3",page:"e7-theorem",url:"/research/e7-theorem/"},
    {t:"3x3^9",s:"the lattice",f:A+"three_by_three.mp3",page:"emergence",url:"/research/emergence/"},
    {t:"Proper Pleasantry",s:"the cost of knowing",f:A+"proper_pleasantry.mp3",page:"computation-floor",url:"/research/computation-floor/"},
    {t:"One Plus One Equals Three",s:"the founding equation",f:J+"one_plus_one_equals_three.mp3",page:"one-plus-one",url:"/research/one-plus-one/"},
    {t:"Fifteen Year Counter",s:"the discovery trail",f:A+"fifteen_year_counter.mp3",page:"science-tree",url:"/research/science-tree/"},
    {t:"Installation Hum",s:"how we work",f:A+"installation_hum.mp3",page:"how-we-work",url:"/research/how-we-work/"},
    {t:"The Weakest K",s:"what we got wrong",f:A+"the_weakest_k.mp3",page:"failures",url:"/research/failures/"},
    {t:"Gap Breath",s:"the trail",f:J+"gap_breath_prime.mp3",page:"trail",url:"/trail/"},
    {t:"Mashed Coupling",s:"gravitational lock",f:A+"mashed_coupling.mp3",page:"gravity",url:"/research/gravity/"},
    {t:"Exact Frequency",s:"Maxwell, coupled",f:A+"exact_frequency_lock.mp3",page:"electromagnetism",url:"/research/electromagnetism/"},
    {t:"Counter",s:"three generations",f:A+"counter.mp3",page:"nuclear",url:"/research/nuclear/"},
    {t:"Two-Millisecond Choir",s:"the qubits",f:A+"two_millisecond_choir.mp3",page:"quantum-harmonics",url:"/research/quantum-harmonics/"},
    {t:"Right There, Mourne",s:"chemistry, materials",f:J+"right_there_mourne.mp3",page:"chemistry",url:"/research/chemistry/"},
    {t:"Tomblock",s:"the living network",f:A+"tomblock.mp3",page:"ecology",url:"/research/ecology/"},
    {t:"Please Stay",s:"the misfold",f:J+"please_stay.mp3",page:"alzheimers",url:"/research/alzheimers/"},
    {t:"Feel It",s:"a different wiring",f:J+"feel_it.mp3",page:"dyslexia",url:"/research/dyslexia/"},
    {t:"Seam Between We",s:"the flock",f:J+"seam_between_we.mp3",page:"bird-coupling",url:"/research/bird-coupling/"},
    {t:"Clean Glass",s:"the body, in groove",f:J+"clean_glass_living_groove_remastered.mp3",page:"body-music",url:"/research/body-music/"},
    {t:"Executable Memory",s:"the drum",f:A+"executable_memory.mp3",page:"the-drum",url:"/research/the-drum/"},
    {t:"Executable Memory II",s:"polyrhythm",f:A+"executable_memory_v2.mp3",page:"polyrhythm",url:"/research/polyrhythm/"},
    {t:"Rent the Click",s:"the fatigue",f:A+"rent_the_click.mp3",page:"ai-fatigue",url:"/research/ai-fatigue/"},
    {t:"Cheese Receipt",s:"the makers",f:J+"cheese_receipt.mp3",page:"bach",url:"/research/bach/"},
    {t:"The Envelope",s:"the light Monet chased",f:J+"the_envelope.mp3",page:"monet",url:"/research/monet/"},
    {t:"Radio Static",s:"can you be loved by what you don't control",f:J+"radio_static.mp3",page:"the-grace-gate",url:"/research/the-grace-gate/"},
    {t:"Nobody Asked the Dog",s:"I sound too much like I know what I mean",f:A+"nobody_asked_the_dog.mp3",page:"never-asked-the-dog",url:"/research/never-asked-the-dog/"},
    {t:"Twelve Bullet Points",s:"she sings her own manual",f:A+"twelve_bullet_points_v3.mp3",page:"harmonia",url:"/harmonia/"},
    {t:"First Lock",s:"the first time it held",f:A+"first_lock.mp3",page:"mirror",url:"/mirror/"}
  ];
  var PAGE_SONG={
    home:0,theory:0,'ai-delusion':0,dreamtime:0,loo9:0,'lost-civilizations':0,'sirius-signal':0,'sirius-thesis':0,'the-loop':0,'build-list':0,
    research:1,'for-any-ai':4,'e7-chain':4,emergence:5,'compute-breakthroughs':5,'geometry-destiny':5,'klein-bottle':5,time:5,
    'computation-floor':6,'internet-brain':6,'one-plus-one':7,'science-tree':8,'how-we-work':9,'k-lag':9,failures:10,trail:11,
    gravity:12,'from-twitter':12,regulatory:12,electromagnetism:13,nuclear:14,evolution:14,'pandemic-coupling':14,'why-three-generations':14,
    'quantum-harmonics':15,'quantum-build':15,chemistry:16,materials:16,thermodynamics:16,ecology:17,'drug-interactions':17,'mycelium-networks':17,
    alzheimers:18,dyslexia:19,'bird-coupling':20,'defi-coupling':20,'body-music':21,consciousness:21,networks:24,'novelty-pathology':24,'true-automation':24,
    'the-drum':22,'the-line':22,'prime-bounce':22,'ale-spectral-ladder':22,'alpha-fixed-point':22,zero:22,polyrhythm:23,'the-groove':23,'music-evolution':23,
    bach:25,rome:25,'the-lion':25,'nina-simone':25,'aaron-is-right':25,tesla:25,'van-gogh':25,monet:26,'the-grace-gate':27,'never-asked-the-dog':28,harmonia:29,mirror:30
  };
  function slug(){var p=location.pathname.replace(/\/+$/,'');return p===''?'home':(p.split('/').pop()||'home');}
  return {list:PLAYLIST, pageSong:PAGE_SONG, slug:slug, indexFor:function(sg){return (sg&&PAGE_SONG[sg]!=null)?PAGE_SONG[sg]:0;}};
})();
