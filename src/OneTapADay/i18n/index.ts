// One Tap a Day — 8-language i18n.
// Locales: en, zh, es, pt, ru, ja, ko, fr
// Fallback chain: detected locale → en. No external lib.

export type Locale = 'en' | 'zh' | 'es' | 'pt' | 'ru' | 'ja' | 'ko' | 'fr';
const SUPPORTED: Locale[] = ['en', 'zh', 'es', 'pt', 'ru', 'ja', 'ko', 'fr'];

function detectLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const override = localStorage.getItem('game_locale');
    if (override && SUPPORTED.includes(override as Locale)) return override as Locale;
  }
  const lang = (navigator.language || 'en').toLowerCase();
  // map browser tag → our 8
  if (lang.startsWith('zh')) return 'zh';
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('pt')) return 'pt';
  if (lang.startsWith('ru')) return 'ru';
  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('ko')) return 'ko';
  if (lang.startsWith('fr')) return 'fr';
  return 'en';
}

type Dict = Record<string, string>;
const en: Dict = {
  onboard_line1: 'Tap once a day.',
  onboard_line2: "That's the whole game.",
  onboard_cta: 'OK',
  tap_label: 'TAP',
  tapped: 'TAPPED',
  hint: 'tap once · then wait a day',
  streak: 'Day {n} streak',
  streak_zero: 'No streak yet',
  today_others: '{n} others today',
  today_total: '{n} today',
  to_totem: '{n} to totem',
  totem_summoning: "Summoning today's totem…",
  totem_summoning_hint: 'this can take a few moments',
  totem_summoning_context: '{n} of you tapped today — the totem awakens',
  totem_summoning_reached_in: 'reached in {hh}h {mm}m {ss}s',
  totem_title: "TODAY'S TOTEM",
  totem_summoning_title: 'summoning',
  totem_subtitle: 'summoned by {n} of you',
  totem_archive: 'Archive',
  totem_save: 'Save',
  totem_close: 'Close',
  next_tap: 'Next tap in {hh}h {mm}m',
  streak_broken_title: 'Yesterday slipped by.',
  streak_broken_lead: 'The bell tolled without you.',
  streak_broken_sub: 'Start again?',
  streak_broken_cta: 'Light it again',
  tombstone: '{n} days stood',
  tombstone_since: '{n} days silent',
  tombstone_since_one: '1 day silent',
  tombstone_dates: '{from} — {to}',
  archive_title: 'Totem Archive',
  archive_subtitle: 'Days you were there.',
  archive_count: '{n} totems witnessed',
  archive_link: 'Archive',
  archive_empty: "You haven't met a totem yet.",
  back: 'Back',
};

const zh: Dict = {
  onboard_line1: '每天点一下。',
  onboard_line2: '就这一下。',
  onboard_cta: '好',
  tap_label: '点',
  tapped: '已点',
  hint: '点一下 · 然后等一天',
  streak: '连续 {n} 天',
  streak_zero: '还没开始',
  today_others: '今天还有 {n} 人',
  today_total: '今天 {n} 人',
  to_totem: '还差 {n} 人解锁图腾',
  totem_summoning: '正在召唤今日图腾…',
  totem_summoning_hint: '需要几分钟',
  totem_summoning_context: '今天 {n} 人按下了 — 图腾醒了',
  totem_summoning_reached_in: '在 {hh}时 {mm}分 {ss}秒 内达成',
  totem_title: '今日图腾',
  totem_summoning_title: '召唤中',
  totem_subtitle: '由 {n} 人共同召唤',
  totem_archive: '历代',
  totem_save: '保存',
  totem_close: '关闭',
  next_tap: '下次还能点：{hh} 小时 {mm} 分钟后',
  streak_broken_title: '昨天溜走了。',
  streak_broken_lead: '那一下钟响过了 你没在。',
  streak_broken_sub: '从头来过？',
  streak_broken_cta: '重新点亮',
  tombstone: '曾连续 {n} 天',
  tombstone_since: '已沉默 {n} 天',
  tombstone_since_one: '已沉默 1 天',
  tombstone_dates: '{from} — {to}',
  archive_title: '图腾档案',
  archive_subtitle: '你来过的那些日子。',
  archive_count: '共见证 {n} 次',
  archive_link: '档案',
  archive_empty: '还没遇见过图腾。',
  back: '返回',
};

const es: Dict = {
  onboard_line1: 'Un toque al día.',
  onboard_line2: 'Eso es todo el juego.',
  onboard_cta: 'OK',
  tap_label: 'TOCA',
  tapped: 'TOCADO',
  hint: 'toca una vez · luego espera un día',
  streak: 'Racha de {n} días',
  streak_zero: 'Sin racha aún',
  today_others: '{n} más hoy',
  today_total: '{n} hoy',
  to_totem: 'faltan {n} para el tótem',
  totem_summoning: 'Invocando el tótem de hoy…',
  totem_title: 'TÓTEM DE HOY',
  totem_subtitle: 'invocado por {n} de ustedes',
  totem_archive: 'Archivo',
  totem_save: 'Guardar',
  totem_close: 'Cerrar',
  next_tap: 'Próximo toque en {hh}h {mm}m',
  streak_broken_title: 'El ayer se escapó.',
  streak_broken_sub: '¿Empezar de nuevo?',
  tombstone: 'racha más larga — {n} días',
  archive_title: 'ARCHIVO DE TÓTEMS',
  archive_empty: 'aún no hay tótems.',
};

const pt: Dict = {
  onboard_line1: 'Um toque por dia.',
  onboard_line2: 'É o jogo inteiro.',
  onboard_cta: 'OK',
  tap_label: 'TOQUE',
  tapped: 'TOCADO',
  hint: 'toque uma vez · depois espere um dia',
  streak: 'Sequência de {n} dias',
  streak_zero: 'Sem sequência ainda',
  today_others: 'mais {n} hoje',
  today_total: '{n} hoje',
  to_totem: 'faltam {n} para o totem',
  totem_summoning: 'Invocando o totem de hoje…',
  totem_title: 'TOTEM DE HOJE',
  totem_subtitle: 'invocado por {n} de vocês',
  totem_archive: 'Arquivo',
  totem_save: 'Salvar',
  totem_close: 'Fechar',
  next_tap: 'Próximo toque em {hh}h {mm}m',
  streak_broken_title: 'Ontem escapou.',
  streak_broken_sub: 'Começar de novo?',
  tombstone: 'sequência mais longa — {n} dias',
  archive_title: 'ARQUIVO DE TOTENS',
  archive_empty: 'ainda não há totens.',
};

const ru: Dict = {
  onboard_line1: 'Касайся раз в день.',
  onboard_line2: 'Это вся игра.',
  onboard_cta: 'OK',
  tap_label: 'КАСАЙСЯ',
  tapped: 'ОТМЕЧЕНО',
  hint: 'коснись один раз · затем подожди день',
  streak: 'Серия {n} дней',
  streak_zero: 'Серии ещё нет',
  today_others: 'ещё {n} сегодня',
  today_total: '{n} сегодня',
  to_totem: '{n} до тотема',
  totem_summoning: 'Призываем сегодняшний тотем…',
  totem_title: 'ТОТЕМ ДНЯ',
  totem_subtitle: 'призван {n} из вас',
  totem_archive: 'Архив',
  totem_save: 'Сохранить',
  totem_close: 'Закрыть',
  next_tap: 'Следующее касание через {hh}ч {mm}м',
  streak_broken_title: 'Вчера ускользнуло.',
  streak_broken_sub: 'Начать заново?',
  tombstone: 'самая длинная серия — {n} дней',
  archive_title: 'АРХИВ ТОТЕМОВ',
  archive_empty: 'тотемов пока нет.',
};

const ja: Dict = {
  onboard_line1: '1日1タップ。',
  onboard_line2: 'それがゲームのすべて。',
  onboard_cta: 'OK',
  tap_label: 'タップ',
  tapped: '完了',
  hint: '1回タップ · そして1日待つ',
  streak: '連続 {n} 日',
  streak_zero: '記録なし',
  today_others: '今日 他 {n} 人',
  today_total: '今日 {n} 人',
  to_totem: 'トーテムまで残り {n} 人',
  totem_summoning: '今日のトーテムを召喚中…',
  totem_title: '今日のトーテム',
  totem_subtitle: '{n} 人によって召喚された',
  totem_archive: '歴代',
  totem_save: '保存',
  totem_close: '閉じる',
  next_tap: '次のタップまで {hh}時間 {mm}分',
  streak_broken_title: '昨日は過ぎ去った。',
  streak_broken_sub: 'もう一度始める？',
  tombstone: '最長連続 — {n} 日',
  archive_title: 'トーテム記録',
  archive_empty: 'まだトーテムなし。',
};

const ko: Dict = {
  onboard_line1: '하루에 한 번 탭.',
  onboard_line2: '그게 게임 전부.',
  onboard_cta: '확인',
  tap_label: '탭',
  tapped: '완료',
  hint: '한 번 탭 · 그리고 하루 기다림',
  streak: '연속 {n} 일',
  streak_zero: '아직 기록 없음',
  today_others: '오늘 {n} 명 더',
  today_total: '오늘 {n} 명',
  to_totem: '토템까지 {n} 명',
  totem_summoning: '오늘의 토템을 소환 중…',
  totem_title: '오늘의 토템',
  totem_subtitle: '{n} 명이 함께 소환',
  totem_archive: '아카이브',
  totem_save: '저장',
  totem_close: '닫기',
  next_tap: '다음 탭까지 {hh}시간 {mm}분',
  streak_broken_title: '어제가 지나갔다.',
  streak_broken_sub: '다시 시작할까?',
  tombstone: '최장 연속 — {n} 일',
  archive_title: '토템 기록',
  archive_empty: '아직 토템이 없습니다.',
};

const fr: Dict = {
  onboard_line1: 'Une tape par jour.',
  onboard_line2: "C'est tout le jeu.",
  onboard_cta: 'OK',
  tap_label: 'TAPE',
  tapped: 'FAIT',
  hint: 'tape une fois · puis attends un jour',
  streak: 'Série de {n} jours',
  streak_zero: 'Pas encore de série',
  today_others: '{n} autres aujourd’hui',
  today_total: '{n} aujourd’hui',
  to_totem: 'plus que {n} pour le totem',
  totem_summoning: 'Invocation du totem du jour…',
  totem_title: "TOTEM DU JOUR",
  totem_subtitle: 'invoqué par {n} d’entre vous',
  totem_archive: 'Archives',
  totem_save: 'Enregistrer',
  totem_close: 'Fermer',
  next_tap: 'Prochaine tape dans {hh}h {mm}m',
  streak_broken_title: 'Hier s’est échappé.',
  streak_broken_sub: 'Recommencer ?',
  tombstone: 'série la plus longue — {n} jours',
  archive_title: 'ARCHIVES DES TOTEMS',
  archive_empty: 'pas encore de totem.',
};

// For the other 6 locales, fall back to English copy for the new keys until
// I add full translations. Existing keys stay localized.
[es, pt, ru, ja, ko, fr].forEach(d => {
  if (!d.streak_broken_lead)      d.streak_broken_lead      = en.streak_broken_lead;
  if (!d.streak_broken_cta)       d.streak_broken_cta       = en.streak_broken_cta;
  if (!d.archive_title)           d.archive_title           = en.archive_title;
  if (!d.archive_subtitle)        d.archive_subtitle        = en.archive_subtitle;
  if (!d.archive_link)            d.archive_link            = en.archive_link;
  if (!d.archive_empty)           d.archive_empty           = en.archive_empty;
  if (!d.back)                    d.back                    = en.back;
  if (!d.totem_summoning_title)      d.totem_summoning_title      = en.totem_summoning_title;
  if (!d.totem_summoning_hint)       d.totem_summoning_hint       = en.totem_summoning_hint;
  if (!d.totem_summoning_context)    d.totem_summoning_context    = en.totem_summoning_context;
  if (!d.totem_summoning_reached_in) d.totem_summoning_reached_in = en.totem_summoning_reached_in;
  if (!d.tombstone_since)            d.tombstone_since            = en.tombstone_since;
  if (!d.tombstone_since_one)        d.tombstone_since_one        = en.tombstone_since_one;
  if (!d.tombstone_dates)            d.tombstone_dates            = en.tombstone_dates;
  if (!d.archive_count)              d.archive_count              = en.archive_count;
});

// Mystical lines rotated under the spinner while the AI is generating the
// totem image. ~5s per line, fade in/out. Each locale has 8 lines; cycle.
const poetry: Record<Locale, string[]> = {
  en: [
    'the kettle remembers your hand',
    "a small bell is being cast",
    'the river is choosing its color',
    'the moth that forgot where it was going',
    'a feather is deciding how to fall',
    'the smoke is finding its shape',
    "today's stone has not landed yet",
    'the candle has not picked its flame',
  ],
  zh: [
    '茶壶记得你的手',
    '一只小钟正在被铸成',
    '河流在挑自己的颜色',
    '一只忘了去处的飞蛾',
    '羽毛在决定怎么落下',
    '烟在找它的形状',
    '今天的那块石头还没落地',
    '蜡烛还没认领它的火焰',
  ],
  es: [
    'la tetera recuerda tu mano',
    'se está fundiendo una pequeña campana',
    'el río está eligiendo su color',
    'una polilla que olvidó hacia dónde iba',
    'una pluma decide cómo caer',
    'el humo está encontrando su forma',
    'la piedra de hoy aún no ha caído',
    'la vela aún no ha elegido su llama',
  ],
  pt: [
    'a chaleira lembra de sua mão',
    'um pequeno sino está sendo fundido',
    'o rio está escolhendo sua cor',
    'uma mariposa que esqueceu para onde ia',
    'uma pena decide como cair',
    'a fumaça está encontrando sua forma',
    'a pedra de hoje ainda não caiu',
    'a vela ainda não escolheu sua chama',
  ],
  ru: [
    'чайник помнит твою руку',
    'льётся маленький колокол',
    'река выбирает свой цвет',
    'мотылёк, забывший куда летел',
    'перо решает, как падать',
    'дым ищет свою форму',
    'сегодняшний камень ещё не упал',
    'свеча ещё не выбрала пламя',
  ],
  ja: [
    '湯沸かしは君の手を覚えている',
    '小さな鐘が鋳られている',
    '川が色を選んでいる',
    'どこへ向かうのか忘れた蛾',
    '羽根が落ち方を決めている',
    '煙が形を探している',
    '今日の石はまだ落ちていない',
    '蝋燭はまだ炎を選んでいない',
  ],
  ko: [
    '주전자가 너의 손을 기억한다',
    '작은 종이 주조되고 있다',
    '강이 자기 색을 고르고 있다',
    '어디로 가는지 잊은 나방',
    '깃털이 어떻게 떨어질지 정한다',
    '연기가 모양을 찾고 있다',
    "오늘의 돌은 아직 떨어지지 않았다",
    '촛불은 아직 불꽃을 고르지 않았다',
  ],
  fr: [
    'la bouilloire se souvient de ta main',
    'on coule une petite cloche',
    'la rivière choisit sa couleur',
    'un papillon de nuit qui a oublié où il allait',
    "une plume décide comment tomber",
    'la fumée cherche sa forme',
    "la pierre d'aujourd'hui n'est pas encore tombée",
    "la bougie n'a pas encore choisi sa flamme",
  ],
};

const dict: Record<Locale, Dict> = { en, zh, es, pt, ru, ja, ko, fr };
const locale: Locale = detectLocale();

export function poetryLines(): string[] {
  return poetry[locale] || poetry.en;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  let s: string = dict[locale][key] || dict.en[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v));
    }
  }
  return s;
}

export function getLocale(): Locale {
  return locale;
}

export function supportedLocales(): Locale[] {
  return [...SUPPORTED];
}
