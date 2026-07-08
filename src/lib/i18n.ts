// Lightweight i18n: 7 languages, UI strings + localized reading content.
// Sign identifiers stay English internally; rendering localizes them.

import { hashString, mulberry32, seededPick } from './hash';

export type Lang = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'lt';

export const LANGS: Array<{ code: Lang; label: string; flag: string }> = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'lt', label: 'Lietuvių', flag: '🇱🇹' },
];

const STORAGE_KEY = 'mg_lang';
let current: Lang | null = null;

export function getLang(): Lang {
  if (current) return current;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGS.some((l) => l.code === stored)) {
      current = stored as Lang;
      return current;
    }
  } catch { /* ignore */ }
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  current = LANGS.some((l) => l.code === nav) ? (nav as Lang) : 'en';
  return current;
}

export function setLang(lang: Lang): void {
  current = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
}

type Element4 = 'fire' | 'earth' | 'air' | 'water';

const SIGN_ELEMENT: Record<string, Element4> = {
  Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
  Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
  Gemini: 'air', Libra: 'air', Aquarius: 'air',
  Cancer: 'water', Scorpio: 'water', Pisces: 'water',
};

export type UIKey =
  | 'landing_title_html' | 'landing_sub' | 'start_btn'
  | 'back' | 'birth_title' | 'birth_sub'
  | 'date_label' | 'req' | 'time_label' | 'time_opt' | 'place_label' | 'place_ph'
  | 'email_label' | 'continue' | 'err_date' | 'err_place' | 'err_email'
  | 'selfie_title' | 'optional_tag' | 'face_intro' | 'face_consent'
  | 'take_selfie' | 'skip' | 'see_reading' | 'scanning' | 'analyzed' | 'revoked'
  | 'face_traits_title' | 'revoke_btn'
  | 'your_reading' | 'test_mode' | 'sun' | 'moon' | 'rising'
  | 'face_read_title' | 'hidden_trait_title'
  | 'meaning_title' | 'actions_title' | 'pep_title' | 'final_title'
  | 'premium_soon'
  | 'share_title' | 'share_incentive' | 'share_card_btn'
  | 'referral_line' | 'restart'
  | 'preparing' | 'shared' | 'downloaded' | 'share_err' | 'copied_ig' | 'copied_tt'
  | 'share_text'
  | 'disclaimer' | 'ai_notice';

interface LangPack {
  ui: Record<UIKey, string>;
  signs: Record<string, string>;
  meaning: Record<Element4, string>;
  actions: Record<Element4, [string, string, string]>;
  pep: Record<Element4, string>;
  humor: Record<Element4, string[]>;
  hidden: string;
  finals: string[];
}

const SIGNS_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

function signMap(names: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  SIGNS_EN.forEach((en, i) => { map[en] = names[i]; });
  return map;
}

const PACKS: Record<Lang, LangPack> = {
  en: {
    ui: {
      landing_title_html: 'Discover your<br /><span class="accent">cosmic personality</span>',
      landing_sub: 'A premium, playful astrology & personality read, built from your birth details in under a minute.',
      start_btn: 'Begin your reading',
      back: '← Back',
      birth_title: 'Your birth details',
      birth_sub: 'We use these to calculate your sun, moon & rising signs.',
      date_label: 'Birth date', req: '(required)',
      time_label: 'Birth time', time_opt: '(optional, improves accuracy)',
      place_label: 'Birth place', place_ph: 'City, Country',
      email_label: 'Email', continue: 'Continue',
      err_date: 'Please enter your birth date.',
      err_place: 'Please enter your birth place.',
      err_email: 'Please enter a valid email address.',
      selfie_title: 'Add a face read?', optional_tag: 'Optional',
      face_intro: 'Add a selfie for a bonus personality flourish — completely optional, and you can skip this without missing anything.',
      face_consent: 'I separately consent to analysis of my facial features for a playful, non-identifying personality read. My photo is processed only in my browser, is never uploaded anywhere, and is deleted immediately after analysis. Only a few playful descriptive traits are kept — nothing about my identity, ethnicity, or any other protected characteristic.',
      take_selfie: 'Take or choose a selfie', skip: 'Skip this step', see_reading: 'See my reading',
      scanning: 'Scanning in your browser…',
      analyzed: 'Photo analyzed and deleted immediately — nothing was uploaded.',
      revoked: 'Consent revoked. Your face data has been deleted.',
      face_traits_title: 'Playful face traits',
      revoke_btn: 'Revoke consent & delete my face data',
      your_reading: 'Your reading', test_mode: 'Test mode',
      sun: 'Sun', moon: 'Moon', rising: 'Rising',
      face_read_title: 'Your playful face read',
      hidden_trait_title: '✨ Your hidden trait',
      meaning_title: 'What this means in real life',
      actions_title: 'Your 3 moves this week',
      pep_title: 'Cosmic pep talk',
      final_title: 'Final transmission',
      premium_soon: 'Premium readings coming soon ✨',
      share_title: 'Share your reading',
      share_incentive: 'Share with a friend — when they get their reading with your link, you unlock a bonus trait.',
      share_card_btn: 'Share / download my card',
      referral_line: 'Your referral link:',
      restart: 'Start a new reading',
      preparing: 'Preparing your share card…', shared: 'Shared!',
      downloaded: 'Image downloaded — share it anywhere you like.',
      share_err: 'Could not generate the image. Please try again.',
      copied_ig: 'Link copied! Paste it in your Instagram bio or story.',
      copied_tt: 'Link copied! Paste it in your TikTok bio or video caption.',
      share_text: 'I just got my cosmic personality read on Morrowglass — I\'m a {sun} sun / {moon} moon / {rising} rising, "{archetype}". Get yours:',
      disclaimer: 'For entertainment and self-reflection only — not scientific, medical, financial, or psychological advice.',
      ai_notice: 'Readings are AI-generated analysis.',
    },
    signs: signMap(SIGNS_EN),
    meaning: {
      fire: 'With a {sun} sun, your default setting is forward. In real life that means you\'re the one who starts things — projects, conversations, minor kitchen fires of enthusiasm. Your {moon} moon colors how you recharge, and your {rising} rising is the trailer people see before the movie: bold, warm, slightly unstoppable.',
      earth: 'A {sun} sun means you build things that last while everyone else is still talking about building them. In daily life you\'re the reliable engine: steady work, real results, excellent snacks. Your {moon} moon shapes your private weather, and your {rising} rising is the calm, competent first impression people quietly envy.',
      air: 'With a {sun} sun, your mind runs group chats the rest of us can only imagine. In real life you connect people and ideas effortlessly — you\'re the social API. Your {moon} moon sets your emotional tempo, and your {rising} rising makes strangers feel like they\'ve known you for years.',
      water: 'A {sun} sun means you feel the room before you enter it. In real life you\'re the emotional radar of your circle: friends call you first, and you always know why. Your {moon} moon deepens that intuition, and your {rising} rising wraps it all in quiet magnetism.',
    },
    actions: {
      fire: [
        'Pick the one task you\'ve been avoiding and finish it before noon — your energy rewards momentum, not queues.',
        'Say yes to one thing that slightly scares you this week. Slightly. Not skydiving-without-training scares you.',
        'Send that message you\'ve been drafting in your head. Fire signs regret silence more than typos.',
      ],
      earth: [
        'Block 30 minutes for the boring-but-important thing. Future you will send a thank-you note.',
        'Declutter one surface — desk, inbox, or that chair with the clothes. Your mind mirrors your space.',
        'Treat yourself to something small and high quality. You work hard; act like you\'ve noticed.',
      ],
      air: [
        'Turn one of your 47 ideas into a single concrete next step, today. Just one. We believe in you.',
        'Call — actually call — a friend you keep meaning to catch up with. Your words are your superpower.',
        'Write down your best idea before bed. Air-sign brains delete overnight like a strict browser cache.',
      ],
      water: [
        'Say what you actually need out loud to one person this week. Mind-reading is not a service they offer.',
        'Take a 20-minute walk near water or greenery — it resets you faster than any app.',
        'Set one small boundary and keep it. Your empathy is a gift, not a public utility.',
      ],
    },
    pep: {
      fire: 'Here\'s the truth: the spark you\'re waiting for is already in you — it always was. This week, stop asking for permission and start leaving evidence. The universe loves a first move, and nobody makes one like you.',
      earth: 'You underestimate how far you\'ve already come because you climb quietly. Look back once — see it? That\'s all you. Keep laying bricks; cathedrals don\'t apologize for taking time.',
      air: 'Your curiosity is not a distraction — it\'s a compass. Every idea you\'ve chased has stretched you. This week, trust that the connections you make, between people and between thoughts, are exactly the magic you bring.',
      water: 'Feeling deeply is not a weakness — it\'s high-resolution living. The empathy you give so freely is rarer than you think. This week, aim some of it at yourself. You have been your own hardest project; be your own kindest fan.',
    },
    humor: {
      fire: [
        'A {sun} sun means your patience has a loading screen of roughly 0.3 seconds.',
        'You don\'t have impulse purchases, you have "spontaneous investments in joy".',
      ],
      earth: [
        'A {sun} sun: you\'ve never met a spreadsheet you couldn\'t emotionally bond with.',
        'Your idea of chaos is a plan with only one backup plan.',
      ],
      air: [
        'A {sun} sun means you have 34 browser tabs open. Mentally. Right now.',
        'You\'ve started more hobbies than some people have had hot dinners — and you\'d defend every one of them.',
      ],
      water: [
        'A {sun} sun: you\'ve emotionally adopted at least three fictional characters this year.',
        'You don\'t hold grudges — you archive feelings with timestamps.',
      ],
    },
    hidden: 'Behind your {rising} first impression lives a {moon}-moon superpower: when someone you love is struggling, you instinctively know exactly what to say — a rarer gift than any of your {sun} headlines.',
    finals: [
      'Go be legendary — the stars did their part, the rest is deliciously up to you. 🌟',
      'Reading complete. Universe status: mildly obsessed with you. Act accordingly. ✨',
      'The cosmos has spoken, and honestly? It\'s a fan. Now go give it something to watch. 🚀',
    ],
  },

  es: {
    ui: {
      landing_title_html: 'Descubre tu<br /><span class="accent">personalidad cósmica</span>',
      landing_sub: 'Una lectura de astrología y personalidad, premium y divertida, creada con tus datos de nacimiento en menos de un minuto.',
      start_btn: 'Comenzar mi lectura',
      back: '← Atrás',
      birth_title: 'Tus datos de nacimiento',
      birth_sub: 'Los usamos para calcular tu signo solar, lunar y ascendente.',
      date_label: 'Fecha de nacimiento', req: '(obligatorio)',
      time_label: 'Hora de nacimiento', time_opt: '(opcional, mejora la precisión)',
      place_label: 'Lugar de nacimiento', place_ph: 'Ciudad, País',
      email_label: 'Correo electrónico', continue: 'Continuar',
      err_date: 'Introduce tu fecha de nacimiento.',
      err_place: 'Introduce tu lugar de nacimiento.',
      err_email: 'Introduce un correo electrónico válido.',
      selfie_title: '¿Añadir lectura facial?', optional_tag: 'Opcional',
      face_intro: 'Añade un selfie para un toque extra de personalidad — totalmente opcional; puedes saltarlo sin perderte nada.',
      face_consent: 'Doy mi consentimiento expreso al análisis de mis rasgos faciales para una lectura de personalidad lúdica y no identificativa. Mi foto se procesa solo en mi navegador, nunca se sube a ningún sitio y se elimina inmediatamente tras el análisis. Solo se conservan unos pocos rasgos descriptivos divertidos — nada sobre mi identidad, etnia u otra característica protegida.',
      take_selfie: 'Tomar o elegir un selfie', skip: 'Saltar este paso', see_reading: 'Ver mi lectura',
      scanning: 'Analizando en tu navegador…',
      analyzed: 'Foto analizada y eliminada de inmediato — no se subió nada.',
      revoked: 'Consentimiento revocado. Tus datos faciales han sido eliminados.',
      face_traits_title: 'Rasgos faciales divertidos',
      revoke_btn: 'Revocar consentimiento y borrar mis datos faciales',
      your_reading: 'Tu lectura', test_mode: 'Modo de prueba',
      sun: 'Sol', moon: 'Luna', rising: 'Ascendente',
      face_read_title: 'Tu lectura facial divertida',
      hidden_trait_title: '✨ Tu rasgo oculto',
      meaning_title: 'Qué significa en la vida real',
      actions_title: 'Tus 3 movimientos de esta semana',
      pep_title: 'Ánimo cósmico',
      final_title: 'Transmisión final',
      premium_soon: 'Lecturas premium muy pronto ✨',
      share_title: 'Comparte tu lectura',
      share_incentive: 'Comparte con un amigo — cuando reciba su lectura con tu enlace, desbloqueas un rasgo extra.',
      share_card_btn: 'Compartir / descargar mi tarjeta',
      referral_line: 'Tu enlace de referido:',
      restart: 'Empezar una nueva lectura',
      preparing: 'Preparando tu tarjeta…', shared: '¡Compartido!',
      downloaded: 'Imagen descargada — compártela donde quieras.',
      share_err: 'No se pudo generar la imagen. Inténtalo de nuevo.',
      copied_ig: '¡Enlace copiado! Pégalo en tu bio o historia de Instagram.',
      copied_tt: '¡Enlace copiado! Pégalo en tu bio o descripción de TikTok.',
      share_text: 'Acabo de recibir mi lectura cósmica en Morrowglass — soy sol {sun} / luna {moon} / ascendente {rising}, "{archetype}". Consigue la tuya:',
      disclaimer: 'Solo para entretenimiento y autorreflexión — no es consejo científico, médico, financiero ni psicológico.',
      ai_notice: 'Las lecturas son análisis generados por IA.',
    },
    signs: signMap(['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis']),
    meaning: {
      fire: 'Con un sol en {sun}, tu modo por defecto es avanzar. En la vida real eres quien inicia las cosas: proyectos, conversaciones, pequeños incendios de entusiasmo. Tu luna en {moon} define cómo recargas energía, y tu ascendente en {rising} es el tráiler que la gente ve antes de la película: audaz, cálido, un poco imparable.',
      earth: 'Un sol en {sun} significa que construyes cosas duraderas mientras los demás siguen hablando de construirlas. En el día a día eres el motor fiable: trabajo constante, resultados reales. Tu luna en {moon} moldea tu clima interior, y tu ascendente en {rising} es esa primera impresión serena y competente que otros envidian en silencio.',
      air: 'Con un sol en {sun}, tu mente gestiona chats grupales que el resto solo puede imaginar. En la vida real conectas personas e ideas sin esfuerzo. Tu luna en {moon} marca tu tempo emocional, y tu ascendente en {rising} hace que los desconocidos sientan que te conocen de años.',
      water: 'Un sol en {sun} significa que sientes la habitación antes de entrar. En la vida real eres el radar emocional de tu círculo: tus amigos te llaman primero, y siempre sabes por qué. Tu luna en {moon} profundiza esa intuición, y tu ascendente en {rising} lo envuelve todo en un magnetismo silencioso.',
    },
    actions: {
      fire: [
        'Elige la tarea que llevas evitando y termínala antes del mediodía — tu energía premia el impulso, no las colas.',
        'Di que sí a algo que te asuste un poco esta semana. Un poco. No "paracaidismo sin curso".',
        'Envía ese mensaje que llevas redactando mentalmente. Los signos de fuego lamentan más el silencio que las erratas.',
      ],
      earth: [
        'Reserva 30 minutos para eso aburrido pero importante. Tu yo del futuro te lo agradecerá.',
        'Despeja una superficie: escritorio, bandeja de entrada o esa silla con ropa. Tu mente refleja tu espacio.',
        'Regálate algo pequeño y de buena calidad. Trabajas duro; actúa como si lo hubieras notado.',
      ],
      air: [
        'Convierte una de tus 47 ideas en un paso concreto, hoy. Solo una. Creemos en ti.',
        'Llama — de verdad — a ese amigo con el que quieres ponerte al día. Tus palabras son tu superpoder.',
        'Anota tu mejor idea antes de dormir. El cerebro de aire borra por la noche como una caché estricta.',
      ],
      water: [
        'Di en voz alta lo que necesitas a una persona esta semana. La telepatía no es un servicio disponible.',
        'Camina 20 minutos cerca de agua o vegetación — te resetea más rápido que cualquier app.',
        'Pon un límite pequeño y mantenlo. Tu empatía es un regalo, no un servicio público.',
      ],
    },
    pep: {
      fire: 'La verdad: la chispa que esperas ya está en ti — siempre lo estuvo. Esta semana deja de pedir permiso y empieza a dejar pruebas. Al universo le encanta un primer movimiento, y nadie lo hace como tú.',
      earth: 'Subestimas lo lejos que has llegado porque escalas en silencio. Mira atrás una vez — ¿lo ves? Eso es todo tuyo. Sigue poniendo ladrillos; las catedrales no piden perdón por tardar.',
      air: 'Tu curiosidad no es una distracción — es una brújula. Cada idea que has perseguido te ha hecho crecer. Esta semana confía en que las conexiones que creas son exactamente tu magia.',
      water: 'Sentir profundamente no es debilidad — es vivir en alta resolución. La empatía que regalas es más rara de lo que crees. Esta semana dirige un poco hacia ti. Has sido tu proyecto más difícil; sé tu fan más amable.',
    },
    humor: {
      fire: [
        'Un sol en {sun} significa que tu paciencia tiene una pantalla de carga de 0,3 segundos.',
        'No tienes compras impulsivas, tienes "inversiones espontáneas en alegría".',
      ],
      earth: [
        'Un sol en {sun}: nunca has conocido una hoja de cálculo con la que no pudieras encariñarte.',
        'Tu idea del caos es un plan con un solo plan B.',
      ],
      air: [
        'Un sol en {sun} significa que tienes 34 pestañas abiertas. Mentalmente. Ahora mismo.',
        'Has empezado más hobbies que cenas calientes ha tenido alguna gente — y defenderías cada uno.',
      ],
      water: [
        'Un sol en {sun}: este año ya has adoptado emocionalmente al menos a tres personajes de ficción.',
        'No guardas rencores — archivas sentimientos con fecha y hora.',
      ],
    },
    hidden: 'Detrás de tu primera impresión de {rising} vive un superpoder de luna en {moon}: cuando alguien que quieres lo está pasando mal, sabes instintivamente qué decir — un don más raro que cualquier titular de tu sol en {sun}.',
    finals: [
      'Ve y sé legendario — las estrellas hicieron su parte, el resto depende deliciosamente de ti. 🌟',
      'Lectura completa. Estado del universo: ligeramente obsesionado contigo. Actúa en consecuencia. ✨',
      'El cosmos ha hablado y, sinceramente, es fan tuyo. Dale algo que mirar. 🚀',
    ],
  },

  fr: {
    ui: {
      landing_title_html: 'Découvrez votre<br /><span class="accent">personnalité cosmique</span>',
      landing_sub: 'Une lecture d\'astrologie et de personnalité, premium et ludique, créée à partir de vos données de naissance en moins d\'une minute.',
      start_btn: 'Commencer ma lecture',
      back: '← Retour',
      birth_title: 'Vos données de naissance',
      birth_sub: 'Elles servent à calculer vos signes solaire, lunaire et ascendant.',
      date_label: 'Date de naissance', req: '(obligatoire)',
      time_label: 'Heure de naissance', time_opt: '(optionnel, améliore la précision)',
      place_label: 'Lieu de naissance', place_ph: 'Ville, Pays',
      email_label: 'E-mail', continue: 'Continuer',
      err_date: 'Veuillez saisir votre date de naissance.',
      err_place: 'Veuillez saisir votre lieu de naissance.',
      err_email: 'Veuillez saisir une adresse e-mail valide.',
      selfie_title: 'Ajouter une lecture du visage ?', optional_tag: 'Optionnel',
      face_intro: 'Ajoutez un selfie pour une touche de personnalité bonus — totalement optionnel, vous pouvez passer sans rien manquer.',
      face_consent: 'Je consens expressément à l\'analyse de mes traits du visage pour une lecture de personnalité ludique et non identifiante. Ma photo est traitée uniquement dans mon navigateur, n\'est jamais téléversée et est supprimée immédiatement après l\'analyse. Seuls quelques traits descriptifs amusants sont conservés — rien sur mon identité, mon origine ethnique ou toute autre caractéristique protégée.',
      take_selfie: 'Prendre ou choisir un selfie', skip: 'Passer cette étape', see_reading: 'Voir ma lecture',
      scanning: 'Analyse dans votre navigateur…',
      analyzed: 'Photo analysée puis supprimée immédiatement — rien n\'a été envoyé.',
      revoked: 'Consentement révoqué. Vos données faciales ont été supprimées.',
      face_traits_title: 'Traits du visage amusants',
      revoke_btn: 'Révoquer le consentement et supprimer mes données faciales',
      your_reading: 'Votre lecture', test_mode: 'Mode test',
      sun: 'Soleil', moon: 'Lune', rising: 'Ascendant',
      face_read_title: 'Votre lecture du visage',
      hidden_trait_title: '✨ Votre trait caché',
      meaning_title: 'Ce que ça signifie dans la vraie vie',
      actions_title: 'Vos 3 actions de la semaine',
      pep_title: 'Encouragement cosmique',
      final_title: 'Transmission finale',
      premium_soon: 'Lectures premium bientôt disponibles ✨',
      share_title: 'Partagez votre lecture',
      share_incentive: 'Partagez avec un ami — quand il obtient sa lecture via votre lien, vous débloquez un trait bonus.',
      share_card_btn: 'Partager / télécharger ma carte',
      referral_line: 'Votre lien de parrainage :',
      restart: 'Commencer une nouvelle lecture',
      preparing: 'Préparation de votre carte…', shared: 'Partagé !',
      downloaded: 'Image téléchargée — partagez-la où vous voulez.',
      share_err: 'Impossible de générer l\'image. Veuillez réessayer.',
      copied_ig: 'Lien copié ! Collez-le dans votre bio ou story Instagram.',
      copied_tt: 'Lien copié ! Collez-le dans votre bio ou légende TikTok.',
      share_text: 'Je viens de recevoir ma lecture cosmique sur Morrowglass — soleil {sun} / lune {moon} / ascendant {rising}, « {archetype} ». Obtenez la vôtre :',
      disclaimer: 'À des fins de divertissement et d\'introspection uniquement — pas un avis scientifique, médical, financier ou psychologique.',
      ai_notice: 'Les lectures sont des analyses générées par IA.',
    },
    signs: signMap(['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons']),
    meaning: {
      fire: 'Avec un soleil en {sun}, votre réglage par défaut est « en avant ». Dans la vraie vie, c\'est vous qui lancez les choses : projets, conversations, petits incendies d\'enthousiasme. Votre lune en {moon} colore votre façon de recharger, et votre ascendant {rising} est la bande-annonce que les gens voient avant le film : audacieuse, chaleureuse, un peu inarrêtable.',
      earth: 'Un soleil en {sun} signifie que vous construisez du durable pendant que les autres en parlent encore. Au quotidien, vous êtes le moteur fiable : travail régulier, résultats concrets. Votre lune en {moon} façonne votre météo intérieure, et votre ascendant {rising} donne cette première impression calme et compétente que les autres envient en silence.',
      air: 'Avec un soleil en {sun}, votre esprit gère des conversations de groupe que nous ne pouvons qu\'imaginer. Dans la vraie vie, vous connectez les gens et les idées sans effort. Votre lune en {moon} donne votre tempo émotionnel, et votre ascendant {rising} fait que les inconnus ont l\'impression de vous connaître depuis des années.',
      water: 'Un soleil en {sun} signifie que vous sentez la pièce avant d\'y entrer. Dans la vraie vie, vous êtes le radar émotionnel de votre entourage : vos amis vous appellent en premier, et vous savez toujours pourquoi. Votre lune en {moon} approfondit cette intuition, et votre ascendant {rising} enveloppe le tout d\'un magnétisme discret.',
    },
    actions: {
      fire: [
        'Choisissez la tâche que vous évitez et terminez-la avant midi — votre énergie récompense l\'élan, pas les files d\'attente.',
        'Dites oui à une chose qui vous fait un peu peur cette semaine. Un peu. Pas « saut en parachute sans formation ».',
        'Envoyez ce message que vous rédigez dans votre tête. Les signes de feu regrettent plus le silence que les fautes de frappe.',
      ],
      earth: [
        'Bloquez 30 minutes pour la chose ennuyeuse mais importante. Votre futur vous enverra un mot de remerciement.',
        'Désencombrez une surface — bureau, boîte mail, ou cette chaise à vêtements. Votre esprit reflète votre espace.',
        'Offrez-vous quelque chose de petit et de grande qualité. Vous travaillez dur ; faites comme si vous l\'aviez remarqué.',
      ],
      air: [
        'Transformez une de vos 47 idées en une seule étape concrète, aujourd\'hui. Une seule. On croit en vous.',
        'Appelez — vraiment — cet ami que vous voulez retrouver. Vos mots sont votre superpouvoir.',
        'Notez votre meilleure idée avant de dormir. Le cerveau des signes d\'air efface la nuit, comme un cache strict.',
      ],
      water: [
        'Dites à voix haute ce dont vous avez besoin à une personne cette semaine. La télépathie n\'est pas un service proposé.',
        'Marchez 20 minutes près de l\'eau ou de la verdure — ça vous réinitialise plus vite que n\'importe quelle app.',
        'Posez une petite limite et tenez-la. Votre empathie est un cadeau, pas un service public.',
      ],
    },
    pep: {
      fire: 'La vérité : l\'étincelle que vous attendez est déjà en vous — elle l\'a toujours été. Cette semaine, arrêtez de demander la permission et commencez à laisser des preuves. L\'univers adore un premier pas, et personne ne le fait comme vous.',
      earth: 'Vous sous-estimez le chemin parcouru parce que vous grimpez en silence. Regardez en arrière une fois — vous voyez ? C\'est entièrement vous. Continuez à poser des briques ; les cathédrales ne s\'excusent pas de prendre leur temps.',
      air: 'Votre curiosité n\'est pas une distraction — c\'est une boussole. Chaque idée poursuivie vous a fait grandir. Cette semaine, faites confiance aux connexions que vous créez : c\'est exactement votre magie.',
      water: 'Ressentir profondément n\'est pas une faiblesse — c\'est vivre en haute résolution. L\'empathie que vous offrez est plus rare que vous ne le pensez. Cette semaine, dirigez-en un peu vers vous. Soyez votre fan le plus bienveillant.',
    },
    humor: {
      fire: [
        'Un soleil en {sun} : votre patience a un écran de chargement d\'environ 0,3 seconde.',
        'Vous ne faites pas d\'achats impulsifs, vous faites des « investissements spontanés dans la joie ».',
      ],
      earth: [
        'Un soleil en {sun} : vous n\'avez jamais rencontré de tableur avec lequel vous ne pouviez pas créer un lien émotionnel.',
        'Votre idée du chaos : un plan avec un seul plan B.',
      ],
      air: [
        'Un soleil en {sun} : vous avez 34 onglets ouverts. Mentalement. En ce moment même.',
        'Vous avez commencé plus de hobbies que certains n\'ont eu de dîners chauds — et vous les défendriez tous.',
      ],
      water: [
        'Un soleil en {sun} : vous avez adopté émotionnellement au moins trois personnages de fiction cette année.',
        'Vous ne gardez pas rancune — vous archivez vos émotions avec horodatage.',
      ],
    },
    hidden: 'Derrière votre première impression {rising} vit un superpouvoir de lune en {moon} : quand un proche traverse une épreuve, vous savez instinctivement quoi dire — un don plus rare que tous vos titres de soleil en {sun}.',
    finals: [
      'Allez, soyez légendaire — les étoiles ont fait leur part, le reste vous appartient délicieusement. 🌟',
      'Lecture terminée. État de l\'univers : légèrement obsédé par vous. Agissez en conséquence. ✨',
      'Le cosmos a parlé, et honnêtement ? Il est fan. Donnez-lui quelque chose à regarder. 🚀',
    ],
  },

  de: {
    ui: {
      landing_title_html: 'Entdecke deine<br /><span class="accent">kosmische Persönlichkeit</span>',
      landing_sub: 'Ein hochwertiges, verspieltes Astrologie- und Persönlichkeits-Reading, erstellt aus deinen Geburtsdaten in unter einer Minute.',
      start_btn: 'Reading starten',
      back: '← Zurück',
      birth_title: 'Deine Geburtsdaten',
      birth_sub: 'Damit berechnen wir dein Sonnen-, Mond- und Aszendentenzeichen.',
      date_label: 'Geburtsdatum', req: '(erforderlich)',
      time_label: 'Geburtszeit', time_opt: '(optional, erhöht die Genauigkeit)',
      place_label: 'Geburtsort', place_ph: 'Stadt, Land',
      email_label: 'E-Mail', continue: 'Weiter',
      err_date: 'Bitte gib dein Geburtsdatum ein.',
      err_place: 'Bitte gib deinen Geburtsort ein.',
      err_email: 'Bitte gib eine gültige E-Mail-Adresse ein.',
      selfie_title: 'Gesichtslesung hinzufügen?', optional_tag: 'Optional',
      face_intro: 'Füge ein Selfie für einen Bonus-Persönlichkeitsakzent hinzu — völlig optional, du verpasst nichts, wenn du diesen Schritt überspringst.',
      face_consent: 'Ich willige gesondert in die Analyse meiner Gesichtszüge für ein verspieltes, nicht identifizierendes Persönlichkeits-Reading ein. Mein Foto wird nur in meinem Browser verarbeitet, niemals hochgeladen und direkt nach der Analyse gelöscht. Es bleiben nur wenige verspielte Beschreibungen — nichts über meine Identität, Ethnie oder andere geschützte Merkmale.',
      take_selfie: 'Selfie aufnehmen oder wählen', skip: 'Schritt überspringen', see_reading: 'Mein Reading ansehen',
      scanning: 'Analyse in deinem Browser…',
      analyzed: 'Foto analysiert und sofort gelöscht — nichts wurde hochgeladen.',
      revoked: 'Einwilligung widerrufen. Deine Gesichtsdaten wurden gelöscht.',
      face_traits_title: 'Verspielte Gesichtszüge',
      revoke_btn: 'Einwilligung widerrufen & meine Gesichtsdaten löschen',
      your_reading: 'Dein Reading', test_mode: 'Testmodus',
      sun: 'Sonne', moon: 'Mond', rising: 'Aszendent',
      face_read_title: 'Deine verspielte Gesichtslesung',
      hidden_trait_title: '✨ Dein verborgener Zug',
      meaning_title: 'Was das im echten Leben bedeutet',
      actions_title: 'Deine 3 Schritte für diese Woche',
      pep_title: 'Kosmischer Mutmacher',
      final_title: 'Letzte Übertragung',
      premium_soon: 'Premium-Readings kommen bald ✨',
      share_title: 'Teile dein Reading',
      share_incentive: 'Teile mit Freunden — holt sich jemand über deinen Link ein Reading, schaltest du einen Bonus-Zug frei.',
      share_card_btn: 'Karte teilen / herunterladen',
      referral_line: 'Dein Empfehlungslink:',
      restart: 'Neues Reading starten',
      preparing: 'Deine Karte wird vorbereitet…', shared: 'Geteilt!',
      downloaded: 'Bild heruntergeladen — teile es, wo du willst.',
      share_err: 'Bild konnte nicht erstellt werden. Bitte erneut versuchen.',
      copied_ig: 'Link kopiert! Füge ihn in deine Instagram-Bio oder Story ein.',
      copied_tt: 'Link kopiert! Füge ihn in deine TikTok-Bio oder Videobeschreibung ein.',
      share_text: 'Ich habe gerade mein kosmisches Reading auf Morrowglass bekommen — Sonne {sun} / Mond {moon} / Aszendent {rising}, „{archetype}". Hol dir deins:',
      disclaimer: 'Nur zur Unterhaltung und Selbstreflexion — keine wissenschaftliche, medizinische, finanzielle oder psychologische Beratung.',
      ai_notice: 'Readings sind KI-generierte Analysen.',
    },
    signs: signMap(['Widder', 'Stier', 'Zwillinge', 'Krebs', 'Löwe', 'Jungfrau', 'Waage', 'Skorpion', 'Schütze', 'Steinbock', 'Wassermann', 'Fische']),
    meaning: {
      fire: 'Mit einer {sun}-Sonne ist „vorwärts" deine Grundeinstellung. Im echten Leben bist du, wer Dinge startet: Projekte, Gespräche, kleine Begeisterungsbrände. Dein {moon}-Mond färbt, wie du auftankst, und dein Aszendent {rising} ist der Trailer, den andere vor dem Film sehen: mutig, warm, leicht unaufhaltsam.',
      earth: 'Eine {sun}-Sonne heißt: Du baust Bleibendes, während andere noch übers Bauen reden. Im Alltag bist du der verlässliche Motor: stetige Arbeit, echte Ergebnisse. Dein {moon}-Mond formt dein Innenwetter, und dein Aszendent {rising} sorgt für den ruhigen, kompetenten ersten Eindruck, den andere still beneiden.',
      air: 'Mit einer {sun}-Sonne betreibt dein Kopf Gruppenchats, die wir uns nur vorstellen können. Im echten Leben verbindest du Menschen und Ideen mühelos. Dein {moon}-Mond gibt dein emotionales Tempo vor, und dein Aszendent {rising} lässt Fremde glauben, sie kennen dich seit Jahren.',
      water: 'Eine {sun}-Sonne heißt: Du spürst den Raum, bevor du ihn betrittst. Im echten Leben bist du das emotionale Radar deines Umfelds: Freunde rufen dich zuerst an, und du weißt immer, warum. Dein {moon}-Mond vertieft diese Intuition, und dein Aszendent {rising} hüllt alles in stille Anziehungskraft.',
    },
    actions: {
      fire: [
        'Nimm die eine Aufgabe, die du vermeidest, und erledige sie vor Mittag — deine Energie belohnt Schwung, keine Warteschlangen.',
        'Sag diese Woche zu einer Sache Ja, die dich ein bisschen erschreckt. Ein bisschen. Nicht „Fallschirmsprung ohne Kurs".',
        'Schick die Nachricht, die du im Kopf schon dreimal formuliert hast. Feuerzeichen bereuen Schweigen mehr als Tippfehler.',
      ],
      earth: [
        'Blocke 30 Minuten für die langweilige, aber wichtige Sache. Dein zukünftiges Ich schickt eine Dankeskarte.',
        'Räume eine Fläche frei — Schreibtisch, Posteingang oder den Kleiderstuhl. Dein Kopf spiegelt deinen Raum.',
        'Gönn dir etwas Kleines von hoher Qualität. Du arbeitest hart; tu so, als wäre es dir aufgefallen.',
      ],
      air: [
        'Mach aus einer deiner 47 Ideen heute einen einzigen konkreten Schritt. Nur einen. Wir glauben an dich.',
        'Ruf an — wirklich anrufen — bei dem Menschen, den du dauernd treffen willst. Deine Worte sind deine Superkraft.',
        'Schreib deine beste Idee vor dem Schlafen auf. Luftzeichen-Hirne löschen nachts wie ein strenger Browser-Cache.',
      ],
      water: [
        'Sag diese Woche einer Person laut, was du wirklich brauchst. Gedankenlesen bietet niemand als Service an.',
        'Geh 20 Minuten am Wasser oder im Grünen spazieren — das resettet dich schneller als jede App.',
        'Setz eine kleine Grenze und halte sie. Deine Empathie ist ein Geschenk, kein öffentlicher Dienst.',
      ],
    },
    pep: {
      fire: 'Die Wahrheit: Der Funke, auf den du wartest, ist längst in dir — war er immer. Hör diese Woche auf, um Erlaubnis zu fragen, und fang an, Beweise zu hinterlassen. Das Universum liebt den ersten Zug — und niemand macht ihn wie du.',
      earth: 'Du unterschätzt, wie weit du gekommen bist, weil du leise kletterst. Schau einmal zurück — siehst du? Alles du. Leg weiter Steine; Kathedralen entschuldigen sich nicht dafür, dass sie Zeit brauchen.',
      air: 'Deine Neugier ist keine Ablenkung — sie ist ein Kompass. Jede Idee, der du gefolgt bist, hat dich wachsen lassen. Vertraue dieser Woche darauf: Die Verbindungen, die du schaffst, sind genau deine Magie.',
      water: 'Tief zu fühlen ist keine Schwäche — es ist Leben in hoher Auflösung. Die Empathie, die du verschenkst, ist seltener, als du denkst. Richte diese Woche etwas davon auf dich selbst. Sei dein freundlichster Fan.',
    },
    humor: {
      fire: [
        'Eine {sun}-Sonne bedeutet: Deine Geduld hat einen Ladebildschirm von etwa 0,3 Sekunden.',
        'Du machst keine Impulskäufe, du machst „spontane Investitionen in Freude".',
      ],
      earth: [
        'Eine {sun}-Sonne: Du hast noch nie eine Tabelle getroffen, mit der du keine emotionale Bindung aufbauen konntest.',
        'Deine Vorstellung von Chaos: ein Plan mit nur einem Plan B.',
      ],
      air: [
        'Eine {sun}-Sonne bedeutet: Du hast 34 Tabs offen. Im Kopf. Genau jetzt.',
        'Du hast mehr Hobbys angefangen, als manche warme Abendessen hatten — und würdest jedes verteidigen.',
      ],
      water: [
        'Eine {sun}-Sonne: Du hast dieses Jahr mindestens drei fiktive Figuren emotional adoptiert.',
        'Du trägst nichts nach — du archivierst Gefühle mit Zeitstempel.',
      ],
    },
    hidden: 'Hinter deinem ersten {rising}-Eindruck wohnt eine {moon}-Mond-Superkraft: Wenn ein geliebter Mensch kämpft, weißt du instinktiv genau, was zu sagen ist — eine seltenere Gabe als jede deiner {sun}-Schlagzeilen.',
    finals: [
      'Geh und sei legendär — die Sterne haben ihren Teil erledigt, der Rest liegt herrlich bei dir. 🌟',
      'Reading abgeschlossen. Status des Universums: leicht besessen von dir. Handle entsprechend. ✨',
      'Der Kosmos hat gesprochen, und ehrlich? Er ist Fan. Gib ihm was zu schauen. 🚀',
    ],
  },

  pt: {
    ui: {
      landing_title_html: 'Descubra a sua<br /><span class="accent">personalidade cósmica</span>',
      landing_sub: 'Uma leitura de astrologia e personalidade, premium e divertida, criada a partir dos seus dados de nascimento em menos de um minuto.',
      start_btn: 'Começar a minha leitura',
      back: '← Voltar',
      birth_title: 'Os seus dados de nascimento',
      birth_sub: 'Usamos estes dados para calcular os seus signos solar, lunar e ascendente.',
      date_label: 'Data de nascimento', req: '(obrigatório)',
      time_label: 'Hora de nascimento', time_opt: '(opcional, melhora a precisão)',
      place_label: 'Local de nascimento', place_ph: 'Cidade, País',
      email_label: 'E-mail', continue: 'Continuar',
      err_date: 'Introduza a sua data de nascimento.',
      err_place: 'Introduza o seu local de nascimento.',
      err_email: 'Introduza um endereço de e-mail válido.',
      selfie_title: 'Adicionar leitura facial?', optional_tag: 'Opcional',
      face_intro: 'Adicione uma selfie para um toque extra de personalidade — totalmente opcional; pode saltar sem perder nada.',
      face_consent: 'Consinto expressamente na análise dos meus traços faciais para uma leitura de personalidade lúdica e não identificativa. A minha foto é processada apenas no meu navegador, nunca é enviada para lado nenhum e é eliminada imediatamente após a análise. Apenas alguns traços descritivos divertidos são guardados — nada sobre a minha identidade, etnia ou outra característica protegida.',
      take_selfie: 'Tirar ou escolher uma selfie', skip: 'Saltar este passo', see_reading: 'Ver a minha leitura',
      scanning: 'A analisar no seu navegador…',
      analyzed: 'Foto analisada e eliminada de imediato — nada foi enviado.',
      revoked: 'Consentimento revogado. Os seus dados faciais foram eliminados.',
      face_traits_title: 'Traços faciais divertidos',
      revoke_btn: 'Revogar consentimento e apagar os meus dados faciais',
      your_reading: 'A sua leitura', test_mode: 'Modo de teste',
      sun: 'Sol', moon: 'Lua', rising: 'Ascendente',
      face_read_title: 'A sua leitura facial divertida',
      hidden_trait_title: '✨ O seu traço oculto',
      meaning_title: 'O que isto significa na vida real',
      actions_title: 'As suas 3 jogadas desta semana',
      pep_title: 'Incentivo cósmico',
      final_title: 'Transmissão final',
      premium_soon: 'Leituras premium em breve ✨',
      share_title: 'Partilhe a sua leitura',
      share_incentive: 'Partilhe com um amigo — quando ele fizer a leitura com o seu link, desbloqueia um traço bónus.',
      share_card_btn: 'Partilhar / descarregar o meu cartão',
      referral_line: 'O seu link de convite:',
      restart: 'Começar uma nova leitura',
      preparing: 'A preparar o seu cartão…', shared: 'Partilhado!',
      downloaded: 'Imagem descarregada — partilhe onde quiser.',
      share_err: 'Não foi possível gerar a imagem. Tente novamente.',
      copied_ig: 'Link copiado! Cole na sua bio ou story do Instagram.',
      copied_tt: 'Link copiado! Cole na sua bio ou legenda do TikTok.',
      share_text: 'Acabei de receber a minha leitura cósmica no Morrowglass — sol {sun} / lua {moon} / ascendente {rising}, "{archetype}". Faça a sua:',
      disclaimer: 'Apenas para entretenimento e autorreflexão — não é aconselhamento científico, médico, financeiro ou psicológico.',
      ai_notice: 'As leituras são análises geradas por IA.',
    },
    signs: signMap(['Carneiro', 'Touro', 'Gémeos', 'Caranguejo', 'Leão', 'Virgem', 'Balança', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes']),
    meaning: {
      fire: 'Com um sol em {sun}, o seu modo padrão é avançar. Na vida real, é quem inicia as coisas: projetos, conversas, pequenos incêndios de entusiasmo. A sua lua em {moon} define como recarrega, e o ascendente em {rising} é o trailer que as pessoas veem antes do filme: ousado, caloroso, ligeiramente imparável.',
      earth: 'Um sol em {sun} significa que constrói coisas duradouras enquanto os outros ainda falam de construir. No dia a dia, é o motor fiável: trabalho constante, resultados reais. A sua lua em {moon} molda o seu clima interior, e o ascendente em {rising} dá aquela primeira impressão calma e competente que os outros invejam em silêncio.',
      air: 'Com um sol em {sun}, a sua mente gere conversas de grupo que os restantes só podem imaginar. Na vida real, liga pessoas e ideias sem esforço. A sua lua em {moon} marca o seu ritmo emocional, e o ascendente em {rising} faz com que estranhos sintam que o conhecem há anos.',
      water: 'Um sol em {sun} significa que sente a sala antes de entrar. Na vida real, é o radar emocional do seu círculo: os amigos ligam-lhe primeiro, e sabe sempre porquê. A sua lua em {moon} aprofunda essa intuição, e o ascendente em {rising} envolve tudo num magnetismo discreto.',
    },
    actions: {
      fire: [
        'Escolha a tarefa que anda a evitar e termine-a antes do meio-dia — a sua energia recompensa o impulso, não as filas.',
        'Diga sim a algo que o assuste um pouco esta semana. Um pouco. Não "paraquedismo sem formação".',
        'Envie aquela mensagem que anda a redigir mentalmente. Os signos de fogo arrependem-se mais do silêncio do que dos erros.',
      ],
      earth: [
        'Reserve 30 minutos para aquela coisa aborrecida mas importante. O seu eu do futuro agradecerá.',
        'Arrume uma superfície — secretária, caixa de entrada ou a cadeira das roupas. A sua mente espelha o seu espaço.',
        'Ofereça a si próprio algo pequeno e de qualidade. Trabalha muito; aja como se tivesse reparado.',
      ],
      air: [
        'Transforme uma das suas 47 ideias num único passo concreto, hoje. Só uma. Acreditamos em si.',
        'Ligue — mesmo — àquele amigo com quem quer pôr a conversa em dia. As suas palavras são o seu superpoder.',
        'Anote a sua melhor ideia antes de dormir. O cérebro de ar apaga durante a noite como uma cache rigorosa.',
      ],
      water: [
        'Diga em voz alta o que precisa a uma pessoa esta semana. Ler mentes não é um serviço disponível.',
        'Caminhe 20 minutos perto de água ou vegetação — reinicia-o mais depressa do que qualquer app.',
        'Estabeleça um pequeno limite e mantenha-o. A sua empatia é um dom, não um serviço público.',
      ],
    },
    pep: {
      fire: 'A verdade: a faísca que espera já está em si — sempre esteve. Esta semana, pare de pedir autorização e comece a deixar provas. O universo adora um primeiro passo, e ninguém o dá como você.',
      earth: 'Subestima o quão longe já chegou porque sobe em silêncio. Olhe para trás uma vez — está a ver? É tudo seu. Continue a assentar tijolos; as catedrais não pedem desculpa por demorar.',
      air: 'A sua curiosidade não é distração — é uma bússola. Cada ideia que perseguiu fê-lo crescer. Esta semana, confie: as ligações que cria são exatamente a sua magia.',
      water: 'Sentir profundamente não é fraqueza — é viver em alta resolução. A empatia que oferece é mais rara do que pensa. Esta semana, aponte um pouco dela para si. Seja o seu fã mais gentil.',
    },
    humor: {
      fire: [
        'Um sol em {sun} significa que a sua paciência tem um ecrã de carregamento de 0,3 segundos.',
        'Não faz compras por impulso, faz "investimentos espontâneos em alegria".',
      ],
      earth: [
        'Um sol em {sun}: nunca conheceu uma folha de cálculo com a qual não criasse laços emocionais.',
        'A sua ideia de caos é um plano com apenas um plano B.',
      ],
      air: [
        'Um sol em {sun} significa que tem 34 separadores abertos. Mentalmente. Agora mesmo.',
        'Já começou mais hobbies do que algumas pessoas tiveram jantares quentes — e defenderia todos.',
      ],
      water: [
        'Um sol em {sun}: este ano já adotou emocionalmente pelo menos três personagens de ficção.',
        'Não guarda rancores — arquiva sentimentos com data e hora.',
      ],
    },
    hidden: 'Atrás da sua primeira impressão de {rising} vive um superpoder de lua em {moon}: quando alguém que ama está em dificuldades, sabe instintivamente o que dizer — um dom mais raro do que qualquer manchete do seu sol em {sun}.',
    finals: [
      'Vá ser lendário — as estrelas fizeram a parte delas, o resto é deliciosamente consigo. 🌟',
      'Leitura concluída. Estado do universo: ligeiramente obcecado consigo. Aja em conformidade. ✨',
      'O cosmos falou e, sinceramente? É fã. Dê-lhe algo para ver. 🚀',
    ],
  },

  it: {
    ui: {
      landing_title_html: 'Scopri la tua<br /><span class="accent">personalità cosmica</span>',
      landing_sub: 'Una lettura di astrologia e personalità, premium e giocosa, creata dai tuoi dati di nascita in meno di un minuto.',
      start_btn: 'Inizia la mia lettura',
      back: '← Indietro',
      birth_title: 'I tuoi dati di nascita',
      birth_sub: 'Li usiamo per calcolare i tuoi segni solare, lunare e ascendente.',
      date_label: 'Data di nascita', req: '(obbligatorio)',
      time_label: 'Ora di nascita', time_opt: '(facoltativa, migliora la precisione)',
      place_label: 'Luogo di nascita', place_ph: 'Città, Paese',
      email_label: 'E-mail', continue: 'Continua',
      err_date: 'Inserisci la tua data di nascita.',
      err_place: 'Inserisci il tuo luogo di nascita.',
      err_email: 'Inserisci un indirizzo e-mail valido.',
      selfie_title: 'Aggiungere una lettura del viso?', optional_tag: 'Facoltativo',
      face_intro: 'Aggiungi un selfie per un tocco di personalità in più — del tutto facoltativo, puoi saltare senza perderti nulla.',
      face_consent: 'Acconsento espressamente all\'analisi dei miei tratti del viso per una lettura della personalità giocosa e non identificativa. La mia foto viene elaborata solo nel mio browser, non viene mai caricata da nessuna parte e viene eliminata subito dopo l\'analisi. Vengono conservati solo alcuni tratti descrittivi divertenti — nulla sulla mia identità, etnia o altre caratteristiche protette.',
      take_selfie: 'Scatta o scegli un selfie', skip: 'Salta questo passaggio', see_reading: 'Vedi la mia lettura',
      scanning: 'Analisi nel tuo browser…',
      analyzed: 'Foto analizzata ed eliminata subito — nulla è stato caricato.',
      revoked: 'Consenso revocato. I tuoi dati facciali sono stati eliminati.',
      face_traits_title: 'Tratti del viso divertenti',
      revoke_btn: 'Revoca il consenso ed elimina i miei dati facciali',
      your_reading: 'La tua lettura', test_mode: 'Modalità test',
      sun: 'Sole', moon: 'Luna', rising: 'Ascendente',
      face_read_title: 'La tua lettura del viso',
      hidden_trait_title: '✨ Il tuo tratto nascosto',
      meaning_title: 'Cosa significa nella vita reale',
      actions_title: 'Le tue 3 mosse della settimana',
      pep_title: 'Carica cosmica',
      final_title: 'Trasmissione finale',
      premium_soon: 'Letture premium in arrivo ✨',
      share_title: 'Condividi la tua lettura',
      share_incentive: 'Condividi con un amico — quando otterrà la sua lettura con il tuo link, sblocchi un tratto bonus.',
      share_card_btn: 'Condividi / scarica la mia card',
      referral_line: 'Il tuo link di invito:',
      restart: 'Inizia una nuova lettura',
      preparing: 'Preparazione della tua card…', shared: 'Condiviso!',
      downloaded: 'Immagine scaricata — condividila dove vuoi.',
      share_err: 'Impossibile generare l\'immagine. Riprova.',
      copied_ig: 'Link copiato! Incollalo nella tua bio o story di Instagram.',
      copied_tt: 'Link copiato! Incollalo nella tua bio o didascalia di TikTok.',
      share_text: 'Ho appena ricevuto la mia lettura cosmica su Morrowglass — sole {sun} / luna {moon} / ascendente {rising}, "{archetype}". Prendi la tua:',
      disclaimer: 'Solo per intrattenimento e riflessione personale — non è un consiglio scientifico, medico, finanziario o psicologico.',
      ai_notice: 'Le letture sono analisi generate dall\'IA.',
    },
    signs: signMap(['Ariete', 'Toro', 'Gemelli', 'Cancro', 'Leone', 'Vergine', 'Bilancia', 'Scorpione', 'Sagittario', 'Capricorno', 'Acquario', 'Pesci']),
    meaning: {
      fire: 'Con un sole in {sun}, la tua impostazione predefinita è "avanti". Nella vita reale sei chi dà il via alle cose: progetti, conversazioni, piccoli incendi di entusiasmo. La tua luna in {moon} colora il modo in cui ricarichi, e l\'ascendente in {rising} è il trailer che gli altri vedono prima del film: audace, caloroso, un po\' inarrestabile.',
      earth: 'Un sole in {sun} significa che costruisci cose durature mentre gli altri ne parlano ancora. Nel quotidiano sei il motore affidabile: lavoro costante, risultati reali. La tua luna in {moon} plasma il tuo clima interiore, e l\'ascendente in {rising} regala quella prima impressione calma e competente che gli altri invidiano in silenzio.',
      air: 'Con un sole in {sun}, la tua mente gestisce chat di gruppo che noi possiamo solo immaginare. Nella vita reale colleghi persone e idee senza sforzo. La tua luna in {moon} detta il tuo tempo emotivo, e l\'ascendente in {rising} fa sentire gli sconosciuti come se ti conoscessero da anni.',
      water: 'Un sole in {sun} significa che senti la stanza prima di entrarci. Nella vita reale sei il radar emotivo della tua cerchia: gli amici chiamano prima te, e sai sempre perché. La tua luna in {moon} approfondisce quell\'intuizione, e l\'ascendente in {rising} avvolge tutto in un magnetismo discreto.',
    },
    actions: {
      fire: [
        'Scegli il compito che stai evitando e finiscilo prima di mezzogiorno — la tua energia premia lo slancio, non le code.',
        'Di\' sì a una cosa che ti spaventa un po\' questa settimana. Un po\'. Non "paracadutismo senza corso".',
        'Manda quel messaggio che stai scrivendo mentalmente. I segni di fuoco rimpiangono il silenzio più dei refusi.',
      ],
      earth: [
        'Blocca 30 minuti per quella cosa noiosa ma importante. Il te del futuro manderà un biglietto di ringraziamento.',
        'Libera una superficie — scrivania, casella di posta o la sedia dei vestiti. La tua mente rispecchia il tuo spazio.',
        'Regalati qualcosa di piccolo e di qualità. Lavori sodo; comportati come se te ne fossi accorto.',
      ],
      air: [
        'Trasforma una delle tue 47 idee in un solo passo concreto, oggi. Solo uno. Crediamo in te.',
        'Chiama — davvero — quell\'amico che vuoi risentire. Le tue parole sono il tuo superpotere.',
        'Annota la tua idea migliore prima di dormire. Il cervello d\'aria cancella di notte come una cache severa.',
      ],
      water: [
        'Di\' ad alta voce ciò di cui hai bisogno a una persona questa settimana. Leggere nel pensiero non è un servizio attivo.',
        'Cammina 20 minuti vicino all\'acqua o al verde — ti resetta più in fretta di qualsiasi app.',
        'Metti un piccolo confine e mantienilo. La tua empatia è un dono, non un servizio pubblico.',
      ],
    },
    pep: {
      fire: 'La verità: la scintilla che aspetti è già in te — lo è sempre stata. Questa settimana smetti di chiedere permesso e inizia a lasciare prove. L\'universo adora una prima mossa, e nessuno la fa come te.',
      earth: 'Sottovaluti quanta strada hai fatto perché sali in silenzio. Guarda indietro una volta — visto? È tutto tuo. Continua a posare mattoni; le cattedrali non si scusano per il tempo che richiedono.',
      air: 'La tua curiosità non è una distrazione — è una bussola. Ogni idea che hai inseguito ti ha fatto crescere. Questa settimana fidati: le connessioni che crei sono esattamente la tua magia.',
      water: 'Sentire profondamente non è debolezza — è vivere in alta risoluzione. L\'empatia che regali è più rara di quanto pensi. Questa settimana puntane un po\' verso di te. Sii il tuo fan più gentile.',
    },
    humor: {
      fire: [
        'Un sole in {sun} significa che la tua pazienza ha una schermata di caricamento di circa 0,3 secondi.',
        'Non fai acquisti d\'impulso, fai "investimenti spontanei nella gioia".',
      ],
      earth: [
        'Un sole in {sun}: non hai mai incontrato un foglio di calcolo con cui non potessi legare emotivamente.',
        'La tua idea di caos è un piano con un solo piano B.',
      ],
      air: [
        'Un sole in {sun} significa che hai 34 schede aperte. Mentalmente. Proprio ora.',
        'Hai iniziato più hobby di quante cene calde abbiano avuto certe persone — e li difenderesti tutti.',
      ],
      water: [
        'Un sole in {sun}: quest\'anno hai già adottato emotivamente almeno tre personaggi di fantasia.',
        'Non porti rancore — archivi i sentimenti con data e ora.',
      ],
    },
    hidden: 'Dietro la tua prima impressione da {rising} vive un superpotere di luna in {moon}: quando una persona cara è in difficoltà, sai istintivamente cosa dire — un dono più raro di qualsiasi titolo del tuo sole in {sun}.',
    finals: [
      'Vai e sii leggendario — le stelle hanno fatto la loro parte, il resto è deliziosamente tuo. 🌟',
      'Lettura completata. Stato dell\'universo: leggermente ossessionato da te. Regolati di conseguenza. ✨',
      'Il cosmo ha parlato e, onestamente? È un tuo fan. Dagli qualcosa da guardare. 🚀',
    ],
  },

  lt: {
    ui: {
      landing_title_html: 'Atrask savo<br /><span class="accent">kosminę asmenybę</span>',
      landing_sub: 'Aukštos kokybės, žaisminga astrologijos ir asmenybės analizė, sukurta iš tavo gimimo duomenų per mažiau nei minutę.',
      start_btn: 'Pradėti skaitymą',
      back: '← Atgal',
      birth_title: 'Tavo gimimo duomenys',
      birth_sub: 'Pagal juos apskaičiuojame tavo Saulės, Mėnulio ir kylantį ženklą.',
      date_label: 'Gimimo data', req: '(privaloma)',
      time_label: 'Gimimo laikas', time_opt: '(neprivaloma, padidina tikslumą)',
      place_label: 'Gimimo vieta', place_ph: 'Miestas, Šalis',
      email_label: 'El. paštas', continue: 'Tęsti',
      err_date: 'Įvesk savo gimimo datą.',
      err_place: 'Įvesk savo gimimo vietą.',
      err_email: 'Įvesk galiojantį el. pašto adresą.',
      selfie_title: 'Pridėti veido skaitymą?', optional_tag: 'Neprivaloma',
      face_intro: 'Pridėk asmenukę papildomam asmenybės štrichui — visiškai neprivaloma, gali praleisti nieko neprarasdamas.',
      face_consent: 'Atskirai sutinku, kad mano veido bruožai būtų analizuojami žaismingam, tapatybės neatskleidžiančiam asmenybės skaitymui. Mano nuotrauka apdorojama tik mano naršyklėje, niekur neįkeliama ir iškart po analizės ištrinama. Išsaugomi tik keli žaismingi aprašomieji bruožai — nieko apie mano tapatybę, etninę kilmę ar kitą saugomą savybę.',
      take_selfie: 'Nufotografuoti ar pasirinkti asmenukę', skip: 'Praleisti šį žingsnį', see_reading: 'Rodyti mano skaitymą',
      scanning: 'Analizuojama tavo naršyklėje…',
      analyzed: 'Nuotrauka išanalizuota ir iškart ištrinta — niekas nebuvo įkelta.',
      revoked: 'Sutikimas atšauktas. Tavo veido duomenys ištrinti.',
      face_traits_title: 'Žaismingi veido bruožai',
      revoke_btn: 'Atšaukti sutikimą ir ištrinti mano veido duomenis',
      your_reading: 'Tavo skaitymas', test_mode: 'Bandomasis režimas',
      sun: 'Saulė', moon: 'Mėnulis', rising: 'Kylantis',
      face_read_title: 'Tavo žaismingas veido skaitymas',
      hidden_trait_title: '✨ Tavo paslėptas bruožas',
      meaning_title: 'Ką tai reiškia realiame gyvenime',
      actions_title: 'Tavo 3 šios savaitės žingsniai',
      pep_title: 'Kosminis padrąsinimas',
      final_title: 'Paskutinė transliacija',
      premium_soon: 'Premium skaitymai jau greitai ✨',
      share_title: 'Pasidalink savo skaitymu',
      share_incentive: 'Pasidalink su draugu — kai jis gaus skaitymą per tavo nuorodą, atrakinsi papildomą bruožą.',
      share_card_btn: 'Dalintis / atsisiųsti kortelę',
      referral_line: 'Tavo rekomendacijos nuoroda:',
      restart: 'Pradėti naują skaitymą',
      preparing: 'Ruošiama tavo kortelė…', shared: 'Pasidalinta!',
      downloaded: 'Paveikslėlis atsisiųstas — dalinkis kur nori.',
      share_err: 'Nepavyko sugeneruoti paveikslėlio. Bandyk dar kartą.',
      copied_ig: 'Nuoroda nukopijuota! Įklijuok į savo Instagram aprašymą ar istoriją.',
      copied_tt: 'Nuoroda nukopijuota! Įklijuok į savo TikTok aprašymą.',
      share_text: 'Ką tik gavau savo kosminį skaitymą Morrowglass — Saulė {sun} / Mėnulis {moon} / kylantis {rising}, „{archetype}". Gauk savo:',
      disclaimer: 'Tik pramogai ir savirefleksijai — tai nėra mokslinė, medicininė, finansinė ar psichologinė konsultacija.',
      ai_notice: 'Skaitymai — dirbtinio intelekto sugeneruota analizė.',
    },
    signs: signMap(['Avinas', 'Jautis', 'Dvyniai', 'Vėžys', 'Liūtas', 'Mergelė', 'Svarstyklės', 'Skorpionas', 'Šaulys', 'Ožiaragis', 'Vandenis', 'Žuvys']),
    meaning: {
      fire: 'Su Saule {sun} ženkle tavo numatytasis režimas — pirmyn. Realiame gyvenime tu tas, kuris viską pradeda: projektus, pokalbius, mažus entuziazmo gaisrus. Tavo Mėnulis {moon} ženkle nuspalvina, kaip atsigauni, o kylantis {rising} — tai anonsas, kurį žmonės mato prieš filmą: drąsus, šiltas, šiek tiek nesustabdomas.',
      earth: 'Saulė {sun} ženkle reiškia, kad statai ilgaamžius dalykus, kol kiti dar tik kalba apie statybas. Kasdienybėje esi patikimas variklis: nuoseklus darbas, tikri rezultatai. Tavo Mėnulis {moon} formuoja vidinį orą, o kylantis {rising} sukuria tą ramų, kompetentingą pirmą įspūdį, kurio kiti tyliai pavydi.',
      air: 'Su Saule {sun} ženkle tavo mintys valdo grupinius pokalbius, kokius kiti gali tik įsivaizduoti. Realiame gyvenime be pastangų jungi žmones ir idėjas. Tavo Mėnulis {moon} nustato emocinį tempą, o kylantis {rising} priverčia nepažįstamus jaustis taip, lyg tave pažinotų metų metus.',
      water: 'Saulė {sun} ženkle reiškia, kad pajunti kambarį dar prieš įeidamas. Realiame gyvenime esi savo rato emocinis radaras: draugai pirmiausia skambina tau, ir visada žinai kodėl. Tavo Mėnulis {moon} gilina tą intuiciją, o kylantis {rising} viską apgaubia tyliu magnetizmu.',
    },
    actions: {
      fire: [
        'Pasirink užduotį, kurios vengi, ir pabaik ją iki vidurdienio — tavo energija apdovanoja įsibėgėjimą, o ne eiles.',
        'Šią savaitę pasakyk „taip" vienam dalykui, kuris tave šiek tiek gąsdina. Šiek tiek. Ne „šuolis parašiutu be kurso".',
        'Išsiųsk tą žinutę, kurią mintyse rašai jau trečią dieną. Ugnies ženklai labiau gailisi tylos nei klaidų.',
      ],
      earth: [
        'Skirk 30 minučių nuobodžiam, bet svarbiam reikalui. Ateities tu atsiųs padėkos atviruką.',
        'Sutvarkyk vieną paviršių — stalą, pašto dėžutę ar tą kėdę su rūbais. Tavo mintys atspindi tavo erdvę.',
        'Padovanok sau ką nors mažo ir kokybiško. Sunkiai dirbi; elkis taip, lyg būtum tai pastebėjęs.',
      ],
      air: [
        'Paversk vieną iš savo 47 idėjų vienu konkrečiu žingsniu — šiandien. Tik vieną. Mes tavimi tikime.',
        'Paskambink — iš tikrųjų paskambink — draugui, su kuriuo vis žadi susitikti. Tavo žodžiai — tavo supergalia.',
        'Užsirašyk geriausią idėją prieš miegą. Oro ženklų smegenys naktį trina kaip griežta naršyklės talpykla.',
      ],
      water: [
        'Šią savaitę garsiai pasakyk vienam žmogui, ko iš tikrųjų tau reikia. Minčių skaitymas — ne jų teikiama paslauga.',
        'Pasivaikščiok 20 minučių prie vandens ar žalumos — tai perkrauna tave greičiau nei bet kokia programėlė.',
        'Nustatyk vieną mažą ribą ir jos laikykis. Tavo empatija — dovana, o ne viešoji paslauga.',
      ],
    },
    pep: {
      fire: 'Tiesa tokia: kibirkštis, kurios lauki, jau yra tavyje — visada buvo. Šią savaitę nustok prašyti leidimo ir pradėk palikti įrodymus. Visata dievina pirmą žingsnį — ir niekas jo nežengia taip, kaip tu.',
      earth: 'Nuvertini, kiek toli jau nuėjai, nes kopi tyliai. Atsigręžk vieną kartą — matai? Visa tai — tavo. Toliau dėk plytas; katedros neatsiprašinėja, kad užtrunka.',
      air: 'Tavo smalsumas — ne blaškymasis, o kompasas. Kiekviena idėja, kurią vijaisi, tave augino. Šią savaitę pasitikėk: ryšiai, kuriuos kuri tarp žmonių ir minčių, ir yra tavo magija.',
      water: 'Giliai jausti — ne silpnybė, o gyvenimas didele raiška. Empatija, kurią dalini, retesnė, nei manai. Šią savaitę nukreipk dalį jos į save. Būk sau maloniausias gerbėjas.',
    },
    humor: {
      fire: [
        'Saulė {sun} ženkle reiškia, kad tavo kantrybės įkrovimo ekranas trunka maždaug 0,3 sekundės.',
        'Tu ne impulsyviai perki — tu „spontaniškai investuoji į džiaugsmą".',
      ],
      earth: [
        'Saulė {sun} ženkle: dar nesutikai skaičiuoklės, prie kurios negalėtum emociškai prisirišti.',
        'Tavo chaoso samprata — planas su tik vienu atsarginiu planu.',
      ],
      air: [
        'Saulė {sun} ženkle reiškia, kad turi 34 atidarytas korteles. Mintyse. Būtent dabar.',
        'Esi pradėjęs daugiau hobių, nei kai kurie žmonės valgę šiltų vakarienių — ir apgintum kiekvieną.',
      ],
      water: [
        'Saulė {sun} ženkle: šiemet jau emociškai įsivaikinai bent tris išgalvotus personažus.',
        'Tu nelaikai pykčio — tu archyvuoji jausmus su laiko žymomis.',
      ],
    },
    hidden: 'Už tavo pirmojo {rising} įspūdžio slypi Mėnulio {moon} supergalia: kai mylimam žmogui sunku, instinktyviai žinai, ką pasakyti — retesnė dovana nei bet kuri tavo Saulės {sun} antraštė.',
    finals: [
      'Eik ir būk legenda — žvaigždės savo darbą atliko, visa kita skaniai priklauso nuo tavęs. 🌟',
      'Skaitymas baigtas. Visatos būsena: šiek tiek apsėsta tavęs. Elkis atitinkamai. ✨',
      'Kosmosas prabilo ir, atvirai? Jis tavo gerbėjas. Duok jam ką stebėti. 🚀',
    ],
  },
};

export function t(key: UIKey): string {
  return PACKS[getLang()].ui[key];
}

export function signName(signEn: string): string {
  return PACKS[getLang()].signs[signEn] ?? signEn;
}

function fill(template: string, sun: string, moon: string, rising: string): string {
  return template
    .replaceAll('{sun}', sun)
    .replaceAll('{moon}', moon)
    .replaceAll('{rising}', rising);
}

export interface LocalizedSections {
  hidden: string;
  meaning: string;
  actions: string[];
  pep: string;
  humor: string[];
  final: string;
}

export function buildLocalizedSections(
  sunSignEn: string,
  moonSignEn: string,
  risingSignEn: string,
  seed: string,
): LocalizedSections {
  const pack = PACKS[getLang()];
  const sunEl = SIGN_ELEMENT[sunSignEn] ?? 'fire';
  const sun = signName(sunSignEn);
  const moon = signName(moonSignEn);
  const rising = signName(risingSignEn);

  const finalRng = mulberry32(hashString(`${seed}|final`));
  return {
    hidden: fill(pack.hidden, sun, moon, rising),
    meaning: fill(pack.meaning[sunEl], sun, moon, rising),
    actions: pack.actions[sunEl].map((a) => fill(a, sun, moon, rising)),
    pep: fill(pack.pep[sunEl], sun, moon, rising),
    humor: pack.humor[sunEl].map((h) => fill(h, sun, moon, rising)),
    final: seededPick(finalRng, pack.finals),
  };
}
