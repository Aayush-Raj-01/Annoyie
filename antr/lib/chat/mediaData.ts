// ─── Curated Animated Stickers and GIFs Catalog for Annoyms ───────────────────

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  category: string;
  type: "sticker" | "gif";
  previewUrl?: string;
  tags?: string[];
}

// ─── High-Resolution Official Google Noto Animated Stickers (512px WebP/GIF) ──
export const STICKERS: MediaItem[] = [
  // ── Vibes & Smiles
  {
    id: "st-smile",
    name: "Grin",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.gif",
    category: "Vibes",
    type: "sticker",
  },
  {
    id: "st-laugh-cry",
    name: "Joy Laugh",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.gif",
    category: "Vibes",
    type: "sticker",
  },
  {
    id: "st-rofl",
    name: "ROFL",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f923/512.gif",
    category: "Vibes",
    type: "sticker",
  },
  {
    id: "st-cool",
    name: "Cool Sunglasses",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.gif",
    category: "Vibes",
    type: "sticker",
  },
  {
    id: "st-party",
    name: "Party Time",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.gif",
    category: "Vibes",
    type: "sticker",
  },
  {
    id: "st-love-eyes",
    name: "Heart Eyes",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f970/512.gif",
    category: "Vibes",
    type: "sticker",
  },
  {
    id: "st-mind-blown",
    name: "Mind Blown",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.gif",
    category: "Vibes",
    type: "sticker",
  },
  {
    id: "st-wink",
    name: "Wink",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f609/512.gif",
    category: "Vibes",
    type: "sticker",
  },

  // ── Cyber & Anonymous
  {
    id: "st-ghost",
    name: "Stealth Ghost",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f47b/512.gif",
    category: "Cyber",
    type: "sticker",
  },
  {
    id: "st-skull",
    name: "Cyber Skull",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f480/512.gif",
    category: "Cyber",
    type: "sticker",
  },
  {
    id: "st-alien",
    name: "Invader",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f47e/512.gif",
    category: "Cyber",
    type: "sticker",
  },
  {
    id: "st-robot",
    name: "Bot Operative",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f916/512.gif",
    category: "Cyber",
    type: "sticker",
  },
  {
    id: "st-laptop",
    name: "Terminal Coder",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4bb/512.gif",
    category: "Cyber",
    type: "sticker",
  },
  {
    id: "st-ninja",
    name: "Shadow Ninja",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f977/512.gif",
    category: "Cyber",
    type: "sticker",
  },
  {
    id: "st-detective",
    name: "Spy Anon",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f575_fe0f/512.gif",
    category: "Cyber",
    type: "sticker",
  },

  // ── Action & Hype
  {
    id: "st-fire",
    name: "Fire",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif",
    category: "Hype",
    type: "sticker",
  },
  {
    id: "st-rocket",
    name: "Rocket",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif",
    category: "Hype",
    type: "sticker",
  },
  {
    id: "st-hundred",
    name: "100 Percent",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.gif",
    category: "Hype",
    type: "sticker",
  },
  {
    id: "st-sparkles",
    name: "Sparkles",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.gif",
    category: "Hype",
    type: "sticker",
  },
  {
    id: "st-clapping",
    name: "Applause",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.gif",
    category: "Hype",
    type: "sticker",
  },
  {
    id: "st-poppers",
    name: "Party Popper",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif",
    category: "Hype",
    type: "sticker",
  },

  // ── Reactions & Memes
  {
    id: "st-eyes",
    name: "Looking",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f440/512.gif",
    category: "Reactions",
    type: "sticker",
  },
  {
    id: "st-shrug",
    name: "Shrug",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f937/512.gif",
    category: "Reactions",
    type: "sticker",
  },
  {
    id: "st-facepalm",
    name: "Facepalm",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f926/512.gif",
    category: "Reactions",
    type: "sticker",
  },
  {
    id: "st-thinking",
    name: "Hmm Thinking",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif",
    category: "Reactions",
    type: "sticker",
  },
  {
    id: "st-popcorn",
    name: "Popcorn Drama",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f37f/512.gif",
    category: "Reactions",
    type: "sticker",
  },
  {
    id: "st-coffee",
    name: "Coffee Fuel",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/2615/512.gif",
    category: "Reactions",
    type: "sticker",
  },
];

// ─── Curated GIPHY Reaction Library (CDN Direct i.giphy.com URLs) ────────────
export const CURATED_GIFS: MediaItem[] = [
  // ── Hacker & Tech
  {
    id: "3oriO0OEd9QIDdllqo",
    name: "Cat Typing Keyboard",
    url: "https://i.giphy.com/3oriO0OEd9QIDdllqo.gif",
    category: "Hacker",
    type: "gif",
    tags: ["cat", "code", "coder", "programming", "typing", "work", "hacker"],
  },
  {
    id: "eIm624c8nnNbiG0V3g",
    name: "Matrix Code Stream",
    url: "https://i.giphy.com/eIm624c8nnNbiG0V3g.gif",
    category: "Hacker",
    type: "gif",
    tags: ["matrix", "green", "code", "cyber", "hacker", "terminal"],
  },
  {
    id: "unQ3IJU2RG7DO",
    name: "Furious Hacker",
    url: "https://i.giphy.com/unQ3IJU2RG7DO.gif",
    category: "Hacker",
    type: "gif",
    tags: ["hacker", "speed", "fast", "typing", "anonymous"],
  },
  {
    id: "LmN8OYiY4m0X85K0Zz",
    name: "Retro Synthwave Drive",
    url: "https://i.giphy.com/LmN8OYiY4m0X85K0Zz.gif",
    category: "Hacker",
    type: "gif",
    tags: ["retro", "neon", "synthwave", "cyberpunk", "drive"],
  },

  // ── Celebrations & Hype
  {
    id: "blSTtZehjAZ8I",
    name: "Party Cat Dance",
    url: "https://i.giphy.com/blSTtZehjAZ8I.gif",
    category: "Celebration",
    type: "gif",
    tags: ["party", "dance", "cat", "celebrate", "hype", "happy"],
  },
  {
    id: "GeimqsH0TLDt4tScGw",
    name: "Vibing Groovy Dance",
    url: "https://i.giphy.com/GeimqsH0TLDt4tScGw.gif",
    category: "Celebration",
    type: "gif",
    tags: ["vibing", "dance", "happy", "groove", "celebration"],
  },
  {
    id: "GCLlQnV7dXZ2E",
    name: "Gatsby Cheers",
    url: "https://i.giphy.com/GCLlQnV7dXZ2E.gif",
    category: "Celebration",
    type: "gif",
    tags: ["cheers", "leonardo", "champagne", "toast", "win", "congrats"],
  },
  {
    id: "artj92V8o75VPL7AeQ",
    name: "Excited Confetti",
    url: "https://i.giphy.com/artj92V8o75VPL7AeQ.gif",
    category: "Celebration",
    type: "gif",
    tags: ["confetti", "excited", "yes", "woo", "win"],
  },

  // ── Reactions & Memes
  {
    id: "9M5jK4GXmD5o1irGrF",
    name: "This Is Fine",
    url: "https://i.giphy.com/9M5jK4GXmD5o1irGrF.gif",
    category: "Reactions",
    type: "gif",
    tags: ["fine", "fire", "dog", "chaos", "bugs", "coffee"],
  },
  {
    id: "gl0mkIZOW6Nwc",
    name: "Popcorn Watching",
    url: "https://i.giphy.com/gl0mkIZOW6Nwc.gif",
    category: "Reactions",
    type: "gif",
    tags: ["popcorn", "drama", "watching", "eat", "snack", "michael"],
  },
  {
    id: "26ufdipQqU2lhNA4g",
    name: "Mind Blown Galaxy",
    url: "https://i.giphy.com/26ufdipQqU2lhNA4g.gif",
    category: "Reactions",
    type: "gif",
    tags: ["mindblown", "galaxy", "wow", "insane", "space", "tim"],
  },
  {
    id: "NEvPzZ8bdvbe8",
    name: "Nod Of Approval",
    url: "https://i.giphy.com/NEvPzZ8bdvbe8.gif",
    category: "Reactions",
    type: "gif",
    tags: ["nod", "agree", "yes", "approval", "bearded", "proud"],
  },
  {
    id: "a93jwI0wkWTQs",
    name: "Homer In The Bushes",
    url: "https://i.giphy.com/a93jwI0wkWTQs.gif",
    category: "Reactions",
    type: "gif",
    tags: ["bye", "disappear", "homer", "bush", "leave", "awkward"],
  },
  {
    id: "14uQ3cOFteDaU",
    name: "Pop Dog Bouncing",
    url: "https://i.giphy.com/14uQ3cOFteDaU.gif",
    category: "Reactions",
    type: "gif",
    tags: ["dog", "happy", "bounce", "cute", "pet"],
  },
  {
    id: "ISOckXUybVfQ4",
    name: "Seal Spinning",
    url: "https://i.giphy.com/ISOckXUybVfQ4.gif",
    category: "Reactions",
    type: "gif",
    tags: ["spin", "seal", "funny", "meme", "vibe"],
  },
  {
    id: "d2Z4NRCUxsrZBJWg",
    name: "Surprised Pikachu",
    url: "https://i.giphy.com/d2Z4NRCUxsrZBJWg.gif",
    category: "Reactions",
    type: "gif",
    tags: ["shock", "pikachu", "surprised", "meme", "what"],
  },
  {
    id: "QMHoU66sBXCAU",
    name: "Dog Drinking Coffee",
    url: "https://i.giphy.com/QMHoU66sBXCAU.gif",
    category: "Reactions",
    type: "gif",
    tags: ["coffee", "morning", "chill", "sip"],
  },
  {
    id: "l0MYt5jPR6QX5pnqM",
    name: "Applause Clapping",
    url: "https://i.giphy.com/l0MYt5jPR6QX5pnqM.gif",
    category: "Celebration",
    type: "gif",
    tags: ["clapping", "applause", "bravo", "great", "job"],
  },
];

// ─── Comprehensive Categorized Unicode Emoji Dataset ──────────────────────────
export interface EmojiCategory {
  name: string;
  icon: string;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: "Smileys",
    icon: "😀",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "🥹", "😊", "😇", "🙂", "🙃", "😉", "😌",
      "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸",
      "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢",
      "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔",
      "🫣", "🤭", "🫢", "🫡", "🤫", "🫠", "🤥", "😶", "😐", "😑", "😬", "🫨", "🙄", "😯", "😦", "😧",
      "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "😵‍💫", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕",
      "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃"
    ],
  },
  {
    name: "Gestures",
    icon: "👋",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟",
      "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏",
      "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻",
      "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄", "🫦"
    ],
  },
  {
    name: "Hearts",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓",
      "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️"
    ],
  },
  {
    name: "Animals",
    icon: "🐱",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵",
      "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋",
      "🐌", "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷️", "🦂", "🐢", "🐍", "🦎", "🐙", "🦑", "🦐",
      "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🦣", "🐘",
      "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🦬", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐"
    ],
  },
  {
    name: "Food",
    icon: "🍕",
    emojis: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥",
      "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠",
      "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴",
      "🌭", "🍔", "🍟", "🍕", "🫓", "🥪", "🥙", "🧆", "🌮", "🌯", "🫔", "🥗", "🥘", "🫕", "🥫", "🍝",
      "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡",
      "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜",
      "🍯", "🥛", "🍼", "☕️", "🫖", "🍵", "🧃", "🥤", "🧋", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸",
      "🍹", "🧉", "🍾", "🧊"
    ],
  },
  {
    name: "Activities",
    icon: "⚽",
    emojis: [
      "⚽️", "🏀", "🏈", "⚾️", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍",
      "🏏", "🪃", "🥅", "⛳️", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌",
      "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "🤺", "⛹️", "🤾", "🧗", "🧘", "🏄", "🏊", "🤽", "🚣",
      "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️", "🎫", "🎟️", "🎪", "🤹", "🎭", "🩰", "🎨", "🎬",
      "🎤", "🎧", "🎼", "🎹", "🥁", "🪘", "🎷", "🎺", "🪗", "🎸", "🪕", "🎻", "🎲", "♟️", "🎯", "🎳",
      "🎮", "🎰", "🧩"
    ],
  },
  {
    name: "Travel",
    icon: "🚀",
    emojis: [
      "🚗", "🚕", "🚙", "🚌", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵", "🚲",
      "🛴", "🚨", "🚔", "🚀", "🛸", "🚁", "✈️", "🛳️", "⛵️", "⚓️", "⛽️", "🗺️", "🗿", "🗽", "🗼", "🏰",
      "🏝️", "🏔️", "🌋", "🏕️", "⛺️", "🌅", "🌄", "🏙️", "🌉"
    ],
  },
  {
    name: "Objects",
    icon: "💡",
    emojis: [
      "⌚️", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "💽", "💾", "💿", "📀", "📷", "📸",
      "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️",
      "⏰", "🕰️", "⌛️", "⏳", "📡", "🔋", "🪫", "🔌", "💡", "🔦", "🕯️", "🧯", "💸", "💵", "💴", "💶",
      "💷", "🪙", "💰", "💳", "💎", "⚖️", "🪜", "🧰", "🪛", "🔧", "🔨", "⚒️", "🛠️", "⛏️", "🪚", "🔩",
      "⚙️", "🧱", "⛓️", "🧲", "🔫", "💣", "🧨", "🪓", "🔪", "🗡️", "⚔️", "🛡️", "🚬", "🔮", "🧿", "🪬",
      "💊", "💉", "🩸", "🧬", "🦠", "🧫", "🧪", "🔭", "🔬"
    ],
  },
  {
    name: "Symbols",
    icon: "💯",
    emojis: [
      "💯", "💢", "💬", "💭", "💤", "♨️", "🛑", "⛔️", "📛", "🚫", "❗️", "❕", "❓", "❔", "‼️", "⁉️",
      "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅", "❇️", "✳️", "❎", "🌐", "🌀", "🆗", "🆙", "🆒", "🆕",
      "🆓", "0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "▶️", "⏸️", "⏯️",
      "⏹️", "⏺️", "⏭️", "⏮️", "⏩", "⏪", "⏫", "⏬", "◀️", "🔼", "🔽", "➡️", "⬅️", "⬆️", "⬇️", "↗️",
      "↘️", "↙️", "↖️", "↕️", "↔️", "🔄", "🔃", "🎵", "🎶", "➕", "➖", "➗", "✖️", "🟰", "♾️", "💲",
      "™️", "©️", "®️", "✔️", "☑️", "🔘", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫️", "⚪️", "🟤", "🔺",
      "🔻", "🔸", "🔹", "🔶", "🔷", "⭐", "🌟", "✨", "⚡️", "☄️", "💥", "🔥"
    ],
  },
];

export const ALL_EMOJIS: string[] = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
export const QUICK_EMOJIS = ALL_EMOJIS;

export const EMOJI_KEYWORD_MAP: Record<string, string[]> = {
  smile: ["😀", "😃", "😄", "😁", "😊", "🙂", "😉", "😌", "😇"],
  happy: ["😀", "😃", "😄", "😁", "😆", "😊", "🥰", "😍", "🥳", "✨"],
  laugh: ["😂", "🤣", "😆", "😅"],
  cry: ["😭", "😢", "😥", "🥺", "😿", "💧"],
  sad: ["😞", "😔", "😟", "😕", "🙁", "☹️", "🥺", "😢", "😭"],
  love: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "🥰", "😍", "😘", "🫶"],
  heart: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
  fire: ["🔥", "⚡️", "💥", "❤️‍🔥"],
  cool: ["😎", "🕶️", "🤙", "🤘"],
  cat: ["🐱", "🐈", "🦁", "🐯", "🐆"],
  dog: ["🐶", "🐕", "🐩", "🐺", "🦊"],
  food: ["🍕", "🍔", "🍟", "🌭", "🥪", "🌮", "🌯", "🥗", "🍝", "🍜", "🍣", "🍱", "🍛", "🍙"],
  pizza: ["🍕"],
  burger: ["🍔"],
  beer: ["🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🍾"],
  coffee: ["☕️", "🫖"],
  check: ["✅", "✔️", "☑️"],
  star: ["⭐", "🌟", "✨", "💫"],
  money: ["💸", "💵", "💴", "💶", "💷", "🪙", "💰", "💳", "💎", "🤑"],
  car: ["🚗", "🚕", "🚙", "🏎️", "🚓"],
  music: ["🎵", "🎶", "🎤", "🎧", "🎸", "🎹", "🥁"],
  clap: ["👏", "🙌"],
  thumbs: ["👍", "👎"],
  hand: ["👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏"],
  ok: ["👌", "🆗", "👍"],
  party: ["🥳", "🎉", "🍾", "🥂"],
  rocket: ["🚀"],
  skull: ["💀", "☠️"],
};

export function searchEmojis(query: string, categoryName: string = "All"): string[] {
  let baseList: string[] = ALL_EMOJIS;
  if (categoryName !== "All") {
    const found = EMOJI_CATEGORIES.find((c) => c.name === categoryName);
    if (found) baseList = found.emojis;
  }

  const q = query.toLowerCase().trim();
  if (!q) return baseList;

  // Direct emoji match
  if (ALL_EMOJIS.includes(q)) return [q];

  // Category name match
  const catMatch = EMOJI_CATEGORIES.filter((c) => c.name.toLowerCase().includes(q));
  if (catMatch.length > 0) {
    return Array.from(new Set(catMatch.flatMap((c) => c.emojis)));
  }

  // Keyword match
  const matched = new Set<string>();
  for (const [kw, emojis] of Object.entries(EMOJI_KEYWORD_MAP)) {
    if (kw.includes(q) || q.includes(kw)) {
      emojis.forEach((e) => matched.add(e));
    }
  }

  if (matched.size > 0) {
    if (categoryName === "All") return Array.from(matched);
    const categorySet = new Set(baseList);
    const filtered = Array.from(matched).filter((e) => categorySet.has(e));
    return filtered.length > 0 ? filtered : Array.from(matched);
  }

  return baseList;
}

// ─── GIPHY URL Resolver ──────────────────────────────────────────────────────
/**
 * Automatically converts any GIPHY web link or ID into a clean direct GIF image URL.
 * e.g. "https://giphy.com/gifs/cat-cute-3oriO0OEd9QIDdllqo" -> "https://i.giphy.com/3oriO0OEd9QIDdllqo.gif"
 */
export function resolveGiphyUrl(input: string): string {
  if (!input) return input;
  const trimmed = input.trim();

  // If already an i.giphy.com or direct gif URL
  if (/^https?:\/\/i\.giphy\.com\/[^ ]+\.gif$/i.test(trimmed)) {
    return trimmed;
  }

  // Matches https://giphy.com/gifs/...-{id} or https://giphy.com/gifs/{id}
  const giphyWebMatch = trimmed.match(/giphy\.com\/gifs\/(?:[a-zA-Z0-9_-]+-)?([a-zA-Z0-9]+)(?:\/|$|\?)/i);
  if (giphyWebMatch && giphyWebMatch[1]) {
    return `https://i.giphy.com/${giphyWebMatch[1]}.gif`;
  }

  // Matches https://media.giphy.com/media/{id}/...
  const mediaMatch = trimmed.match(/media\.giphy\.com\/media\/([a-zA-Z0-9]+)\//i);
  if (mediaMatch && mediaMatch[1]) {
    return `https://i.giphy.com/${mediaMatch[1]}.gif`;
  }

  return trimmed;
}

// ─── Message Media Parsing Helpers ───────────────────────────────────────────

export interface ParsedMediaMessage {
  isMedia: boolean;
  type: "sticker" | "gif" | "image" | "text";
  url?: string;
  name?: string;
  rawText: string;
}

export function parseMessageContent(content: string): ParsedMediaMessage {
  if (!content) {
    return { isMedia: false, type: "text", rawText: "" };
  }

  const trimmed = content.trim();

  // Sticker format: [sticker:STICKER_NAME:URL]
  const stickerMatch = trimmed.match(/^\[sticker:([^:]*):(https?:\/\/[^\]]+)\]$/i);
  if (stickerMatch) {
    return {
      isMedia: true,
      type: "sticker",
      name: stickerMatch[1] || "Sticker",
      url: stickerMatch[2],
      rawText: trimmed,
    };
  }

  // GIF format: [gif:URL]
  const gifTagMatch = trimmed.match(/^\[gif:(https?:\/\/[^\]]+)\]$/i);
  if (gifTagMatch) {
    return {
      isMedia: true,
      type: "gif",
      url: resolveGiphyUrl(gifTagMatch[1]),
      rawText: trimmed,
    };
  }

  // Direct Giphy web link (e.g. pasted directly in input)
  if (/^https?:\/\/(www\.)?giphy\.com\/gifs\//i.test(trimmed)) {
    return {
      isMedia: true,
      type: "gif",
      url: resolveGiphyUrl(trimmed),
      rawText: trimmed,
    };
  }

  // Direct image/GIF URL format
  if (/^https?:\/\/\S+\.(gif|webp|png|jpe?g)(\?[^ ]*)?$/i.test(trimmed)) {
    const isGif = /\.gif(\?|$)/i.test(trimmed);
    return {
      isMedia: true,
      type: isGif ? "gif" : "image",
      url: resolveGiphyUrl(trimmed),
      rawText: trimmed,
    };
  }

  return {
    isMedia: false,
    type: "text",
    rawText: content,
  };
}
