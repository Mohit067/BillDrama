import type { Destination } from "@/types/trip";
import type { Language, Localized } from "@/lib/i18n/types";

/*
 * Copy only! Nothing in here is ever used for a financial calculation.
 * Variations are picked deterministically from the session seed so a trip keeps
 * the same jokes across refreshes, while a new trip gets fresh ones.
 *
 * Every list has the SAME LENGTH in each language and the entries line up, so
 * switching language shows the translation of the very same joke.
 */

/** Small deterministic hash (FNV-1a) – stable across browsers. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function pickIndex(length: number, seed: number, salt = ""): number {
  return hashString(`${seed}:${salt}`) % length;
}

export function pickBySeed<T>(items: readonly T[], seed: number, salt = ""): T {
  return items[pickIndex(items.length, seed, salt)];
}

/** Picks from a localized list using a language-independent index. */
function pickLocalized<T>(lists: Localized<readonly T[]>, language: Language, seed: number, salt: string): T {
  const list = lists[language] ?? lists.en;
  return list[pickIndex(lists.en.length, seed, salt)];
}

export function createSeed(): number {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 2 ** 32);
}

/* ------------------------------- CTA labels ------------------------------- */

export const CTA_LABELS: Localized<readonly string[]> = {
  en: [
    "REVEAL THE MONEY DRAMA 💸",
    "LET THE SETTLEMENT BEGIN 🔥",
    "WHO OWES WHOM? 👀",
    "CALCULATE THE DAMAGE 😂",
    "UNLOCK THE EXPENSE TRUTH 🚀",
    "TIME TO FACE THE BILLS 💰",
    "SPILL THE MONEY TEA ☕",
    "DROP THE BILL BOMB 💣",
  ],
  hinglish: [
    "PAISON KA DRAMA REVEAL KARO 💸",
    "SETTLEMENT SHURU KARO 🔥",
    "KAUN KISKO KITNA? 👀",
    "NUKSAAN CALCULATE KARO 😂",
    "KHARCHE KA SACH UNLOCK KARO 🚀",
    "AB BILLS KA SAAMNA KARO 💰",
    "PAISON KI CHAI SPILL KARO ☕",
    "BILL BOMB PHODO 💣",
  ],
};

/** The CTA label is fixed per trip session (derived from its seed). */
export function pickCtaLabel(seed: number, language: Language = "en"): string {
  return pickLocalized(CTA_LABELS, language, seed, "cta");
}

/* ------------------------------ Destinations ------------------------------ */

export interface DestinationPreset extends Destination {
  tagline: Localized<string>;
  greeting: Localized<string>;
  /** Tailwind gradient classes for the card. */
  gradient: string;
}

export const DESTINATION_PRESETS: DestinationPreset[] = [
  {
    id: "goa", name: "Goa", emoji: "🏖️", isCustom: false,
    gradient: "from-orange-400 via-pink-500 to-rose-600",
    tagline: { en: "Beaches & sunsets", hinglish: "Beach aur sunsets" },
    greeting: {
      en: "Goa memories unlocked! 🏖️ Hope the sunsets were beautiful. Now let's find out who paid for all those beach adventures!",
      hinglish: "Goa ki yaadein unlock! 🏖️ Umeed hai sunsets mast the. Ab dekhte hain beach adventures ka bill kisne bhara!",
    },
  },
  {
    id: "manali", name: "Manali", emoji: "🏔️", isCustom: false,
    gradient: "from-sky-500 via-blue-600 to-indigo-700",
    tagline: { en: "Snow & Maggi", hinglish: "Barf aur Maggi" },
    greeting: {
      en: "Mountain memories, endless adventures, and probably some expensive Maggi! 🏔️ Let's settle the expenses!",
      hinglish: "Pahadon ki yaadein, endless adventure, aur shayad thodi mehngi Maggi! 🏔️ Chalo hisaab karte hain!",
    },
  },
  {
    id: "jaipur", name: "Jaipur", emoji: "🏰", isCustom: false,
    gradient: "from-pink-500 via-rose-600 to-fuchsia-700",
    tagline: { en: "Forts & palaces", hinglish: "Qile aur mahal" },
    greeting: {
      en: "Royal adventures deserve royal memories! 🏰 Time to find out who was the real sponsor of this trip.",
      hinglish: "Royal adventure ki royal yaadein! 🏰 Ab pata karte hain is trip ka asli sponsor kaun tha.",
    },
  },
  {
    id: "mumbai", name: "Mumbai", emoji: "🌆", isCustom: false,
    gradient: "from-violet-500 via-purple-600 to-indigo-800",
    tagline: { en: "Lights & vada pav", hinglish: "Lights aur vada pav" },
    greeting: {
      en: "City of dreams, city of vada pav! 🌆 Those cab rides add up — let's see who was funding the Mumbai hustle.",
      hinglish: "Sapno ka sheher, vada pav ka sheher! 🌆 Cab rides ka kharcha judta hai — dekhte hain Mumbai hustle ka kharcha kisne uthaya.",
    },
  },
  {
    id: "rishikesh", name: "Rishikesh", emoji: "🌊", isCustom: false,
    gradient: "from-cyan-500 via-sky-600 to-blue-700",
    tagline: { en: "Rafting & calm", hinglish: "Rafting aur sukoon" },
    greeting: {
      en: "Rapids rafted, souls refreshed! 🌊 Now let's calmly — very calmly — split the bills.",
      hinglish: "Rapids paar, mann shaant! 🌊 Ab shaanti se — bilkul shaanti se — bill baant lete hain.",
    },
  },
  {
    id: "kerala", name: "Kerala", emoji: "🌴", isCustom: false,
    gradient: "from-emerald-500 via-teal-600 to-cyan-700",
    tagline: { en: "Backwaters & bliss", hinglish: "Backwaters ka sukoon" },
    greeting: {
      en: "Houseboats, backwaters and banana chips! 🌴 God's own country, now God's own settlement.",
      hinglish: "Houseboat, backwaters aur banana chips! 🌴 God's own country, ab God's own settlement.",
    },
  },
  {
    id: "shimla", name: "Shimla", emoji: "❄️", isCustom: false,
    gradient: "from-slate-500 via-sky-600 to-blue-800",
    tagline: { en: "Toy trains & chai", hinglish: "Toy train aur chai" },
    greeting: {
      en: "Snowy streets and endless chai ❄️ — it's time to thaw out the expense situation!",
      hinglish: "Barf wali galiyan aur endless chai ❄️ — ab kharchon ki barf pighlane ka time!",
    },
  },
  {
    id: "ladakh", name: "Ladakh", emoji: "🏍️", isCustom: false,
    gradient: "from-amber-500 via-orange-600 to-red-600",
    tagline: { en: "Passes & bikes", hinglish: "Passes aur bikes" },
    greeting: {
      en: "High passes, higher fuel bills! 🏍️ You conquered Khardung La — now conquer the settlement.",
      hinglish: "Oonche passes, usse bhi oonche fuel bills! 🏍️ Khardung La jeet liya — ab settlement bhi jeet lo.",
    },
  },
];

const CUSTOM_GREETINGS: Localized<ReadonlyArray<(name: string) => string>> = {
  en: [
    (name) => `${name} memories unlocked! ✨ Sounds like an epic adventure. Now let's see who funded it!`,
    (name) => `${name}?! What a pick! 🌍 The photos were great — let's make the bills just as pretty.`,
    (name) => `Ah, ${name}! 🧳 Great company, great food, and a pile of bills. Let's sort it out!`,
    (name) => `${name} — the trip everyone will talk about for years 🎒. Let's make sure the money talk is short!`,
  ],
  hinglish: [
    (name) => `${name} ki yaadein unlock! ✨ Epic adventure laga. Ab dekhte hain funding kisne ki!`,
    (name) => `${name}?! Kya choice hai! 🌍 Photos toh mast the — ab bills bhi utne hi pyaare bana dete hain.`,
    (name) => `Arre, ${name}! 🧳 Mast company, mast khaana, aur bills ka pahaad. Chalo sort karte hain!`,
    (name) => `${name} — woh trip jiski baatein saalon tak hongi 🎒. Paison ki baat jaldi khatam karte hain!`,
  ],
};

export function getDestinationPreset(destination: Destination | null): DestinationPreset | undefined {
  if (!destination || destination.isCustom) return undefined;
  return DESTINATION_PRESETS.find((d) => d.id === destination.id);
}

export function getDestinationGreeting(destination: Destination, seed: number, language: Language = "en"): string {
  const preset = getDestinationPreset(destination);
  if (preset) return preset.greeting[language];
  return pickLocalized(CUSTOM_GREETINGS, language, seed, destination.name.toLowerCase())(destination.name);
}

/* --------------------------------- Awards --------------------------------- */

export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

export interface AwardCopy {
  title: string;
  line: string;
  quip: string;
}

const MVP_TITLES: Localized<readonly string[]> = {
  en: ["THE REAL MVP OF THIS TRIP 🏆", "OFFICIAL TRIP SPONSOR 🏆", "THE GROUP'S UNOFFICIAL ATM 🏧", "CHIEF FINANCIAL HERO 🦸"],
  hinglish: ["IS TRIP KA ASLI MVP 🏆", "OFFICIAL TRIP SPONSOR 🏆", "GANG KA UNOFFICIAL ATM 🏧", "CHIEF FINANCIAL HERO 🦸"],
};

const MVP_QUIPS: Localized<readonly string[]> = {
  en: [
    "Everyone owes you a little gratitude... and apparently some money! 😂",
    "Legends say the card is still warm from all that swiping. 💳",
    "The squad's wallet had a name, and it was yours. 🫡",
    "Hero move. Now sit back and let the transfers roll in. 😎",
  ],
  hinglish: [
    "Sabpe tumhara thoda shukriya baaki hai... aur thode paise bhi! 😂",
    "Log kehte hain itni swiping ke baad card abhi tak garam hai. 💳",
    "Gang ke wallet ka ek naam tha, aur woh naam tumhara tha. 🫡",
    "Hero move. Ab aaram se baitho aur transfers aane do. 😎",
  ],
};

const MVP_LINES = {
  en: {
    single: (who: string, amount: string) => `${who} spent ${amount} and became the official sponsor of this adventure!`,
    tied: (who: string, amount: string) => `${who} each spent ${amount} and co-sponsored this adventure!`,
    tiedTitle: "JOINT TRIP SPONSORS 🏆",
  },
  hinglish: {
    single: (who: string, amount: string) => `${who} ne ${amount} kharch kiye — is adventure ke official sponsor yahi hain!`,
    tied: (who: string, amount: string) => `${who} ne ${amount}-${amount} kharch kiye — yeh hain is adventure ke joint sponsors!`,
    tiedTitle: "JOINT TRIP SPONSORS 🏆",
  },
} satisfies Localized<unknown>;

export function getMvpAward(names: readonly string[], amountLabel: string, seed: number, language: Language = "en"): AwardCopy {
  const who = joinNames(names);
  const tied = names.length > 1;
  const lines = MVP_LINES[language];
  return {
    title: tied ? lines.tiedTitle : pickLocalized(MVP_TITLES, language, seed, "mvp-title"),
    line: tied ? lines.tied(who, amountLabel) : lines.single(who, amountLabel),
    quip: pickLocalized(MVP_QUIPS, language, seed, "mvp-quip"),
  };
}

const BUDGET_TITLES: Localized<readonly string[]> = {
  en: ["THE BUDGET LEGEND AWARD 🥷", "MASTER OF FRUGAL ARTS 🧘", "THE SMART SAVER TROPHY 🪙", "WALLET-IN-HIBERNATION AWARD 🐻"],
  hinglish: ["BUDGET LEGEND AWARD 🥷", "BACHAT KI KALA KA MASTER 🧘", "SMART SAVER TROPHY 🪙", "WALLET HIBERNATION AWARD 🐻"],
};

const BUDGET_LINES: Localized<ReadonlyArray<(who: string, plural: boolean) => string>> = {
  en: [
    (who, plural) => `Everyone was spending money, but ${who} ${plural ? "were" : "was"} playing on professional survival mode!`,
    (who, plural) => `${who} ${plural ? "have" : "has"} unlocked the rare skill of enjoying the whole trip on a tiny budget. Respect!`,
    (who, plural) =>
      `While others were swiping cards, ${who} ${plural ? "were" : "was"} quietly mastering the art of the perfect timing. 🕵️`,
    (who, plural) => `${who} kept ${plural ? "their wallets" : "the wallet"} so safe, it may have forgotten it went on the trip at all!`,
  ],
  hinglish: [
    (who) => `Sab log paise uda rahe the, par ${who} ne professional survival mode on rakha!`,
    (who) => `${who} ne poora trip chhote se budget mein enjoy karne ki rare skill unlock kar li. Respect!`,
    (who) => `Jab sab card swipe kar rahe the, ${who} ne chupke se perfect timing ki kala master kar li. 🕵️`,
    (who) => `${who} ne wallet itna safe rakha ki shayad wallet ko pata hi nahi chala ki trip hua tha!`,
  ],
};

const BUDGET_QUIPS: Localized<readonly string[]> = {
  en: [
    "You didn't just save money. You gave the group some financial suspense! 😂",
    "Payback time is here — but hey, at least it's just one tap away. 📲",
    "Next trip, the first round of chai is on you. ☕",
    "Budget icon today, generous friend in about 30 seconds. 💸",
  ],
  hinglish: [
    "Tumne sirf paise nahi bachaye, group ko financial suspense bhi diya! 😂",
    "Payback time aa gaya — par chill, bas ek tap ki baat hai. 📲",
    "Agle trip pe chai ka pehla round tumhari taraf se. ☕",
    "Aaj budget icon, 30 second mein generous dost. 💸",
  ],
};

const BUDGET_TIED_TITLE: Localized<string> = { en: "THE BUDGET LEGENDS CLUB 🥷", hinglish: "BUDGET LEGENDS CLUB 🥷" };

export function getBudgetAward(names: readonly string[], seed: number, language: Language = "en"): AwardCopy {
  const who = joinNames(names);
  const tied = names.length > 1;
  return {
    title: tied ? BUDGET_TIED_TITLE[language] : pickLocalized(BUDGET_TITLES, language, seed, "budget-title"),
    line: pickLocalized(BUDGET_LINES, language, seed, "budget-line")(who, tied),
    quip: pickLocalized(BUDGET_QUIPS, language, seed, "budget-quip"),
  };
}

/* ------------------------------ Misc. copy -------------------------------- */

export const LOADING_MESSAGES: Localized<readonly string[]> = {
  en: [
    "Calculating friendships and financial damage...",
    "Counting every chai and cab ride...",
    "Asking the calculator to stay neutral...",
    "Matching debtors with their favourite creditors...",
    "Preparing the money drama...",
  ],
  hinglish: [
    "Dosti aur financial damage calculate ho raha hai...",
    "Har chai aur cab ride gin rahe hain...",
    "Calculator ko neutral rehne ko bol rahe hain...",
    "Dene walon aur lene walon ki jodi bana rahe hain...",
    "Paison ka drama ready ho raha hai...",
  ],
};

export const CLOSING_MESSAGES: Localized<readonly string[]> = {
  en: [
    "Money can divide bills, but memories bring friends together. ❤️",
    "Bills get paid. Memories stay forever. ❤️",
    "The best souvenir? Friends who still talk after the settlement. ❤️",
  ],
  hinglish: [
    "Paise bill baant sakte hain, par yaadein doston ko jodti hain. ❤️",
    "Bills chuk jaate hain. Yaadein hamesha rehti hain. ❤️",
    "Sabse best souvenir? Settlement ke baad bhi baat karne wale dost. ❤️",
  ],
};

export function getClosingMessage(seed: number, language: Language = "en"): string {
  return pickLocalized(CLOSING_MESSAGES, language, seed, "closing");
}
