export const STICKER_CATEGORIES = [
  {
    label: '표정',
    items: ['😊', '😄', '😍', '🥺', '😎', '🤩', '😭', '🥰', '😜', '🤔', '😤', '🥳', '😏', '🤗', '🫶', '😘'],
  },
  {
    label: '사물',
    items: ['⭐', '🌙', '☀️', '🌸', '🍀', '🎵', '🎉', '💕', '✨', '🌈', '💫', '🔥', '🎀', '🎈', '💎', '🪄'],
  },
  {
    label: '동물',
    items: ['🐱', '🐶', '🐰', '🐻', '🦊', '🐸', '🐧', '🐼', '🐨', '🦁', '🐯', '🦄', '🐮', '🐷', '🐔', '🦋'],
  },
  {
    label: '음식',
    items: ['🍓', '🍕', '🍰', '☕', '🧁', '🍜', '🍦', '🎂', '🍩', '🧋', '🍒', '🍑', '🍎', '🫐', '🍫', '🍬'],
  },
]

// vite base URL — 배포 경로(/bammy/ 등)를 자동으로 prefix
const base = import.meta.env.BASE_URL.replace(/\/$/, '')
const p = (path) => `${base}${path}`

// 이미지 스티커 — public/stickers/ 에 PNG 추가 후 여기서 등록
export const IMAGE_STICKERS = [
  { id: 'item_01', label: '훈장',   src: p('/stickers/item_01.png') },
  { id: 'item_02', label: '고양이', src: p('/stickers/item_02.png') },
  { id: 'item_03', label: '강아지', src: p('/stickers/item_03.png') },
]

export const BACKGROUNDS = [
  // ── 밝은 계열 ──
  { id: 'white',    label: '화이트',   color: '#ffffff' },
  { id: 'cream',    label: '크림',     color: '#faf6f0' },
  { id: 'pink',     label: '핑크',     color: '#fce4ec' },
  { id: 'peach',    label: '피치',     color: '#fdebd0' },
  { id: 'yellow',   label: '노랑',     color: '#fff9c4' },
  { id: 'mint',     label: '민트',     color: '#dff5ef' },
  { id: 'sky',      label: '하늘',     color: '#ddeeff' },
  { id: 'lavender', label: '라벤더',   color: '#ede7f6' },
  // ── 어두운 계열 ──
  { id: 'gray',     label: '그레이',   color: '#eeeeee' },
  { id: 'charcoal', label: '차콜',     color: '#37474f' },
  { id: 'navy',     label: '네이비',   color: '#1a237e' },
  { id: 'black',    label: '블랙',     color: '#111111' },
  // ── 이미지 배경 — public/backgrounds/ 에 파일 추가 후 여기서 등록 ──
  { id: 'bg_01', label: '농장1', color: 'transparent', src: p('/backgrounds/bg_01.png') },
  { id: 'bg_02', label: '농장2', color: 'transparent', src: p('/backgrounds/bg_02.png') },
]
