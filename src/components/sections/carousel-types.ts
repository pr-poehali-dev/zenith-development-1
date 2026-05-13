export const TRACKS_URL = "https://functions.poehali.dev/36cc0561-b248-4cd8-b195-d1d5ef5c5a83"
export const COLS = 3
export const ROWS = 3
export const TOTAL = ROWS * COLS

export const COLORS = [
  "from-purple-900 to-indigo-900", "from-red-900 to-pink-900",
  "from-violet-900 to-fuchsia-900", "from-amber-900 to-orange-900",
  "from-green-900 to-teal-900", "from-rose-900 to-red-900",
  "from-blue-900 to-cyan-900", "from-yellow-900 to-amber-900",
  "from-pink-900 to-rose-900",
]
export const EMOJIS = ["🎵", "🎶", "🎸", "🎹", "🎺", "🎻", "🥁", "🎤", "🎧"]

export interface CellTrack {
  id?: number
  title: string; artist: string; file_url?: string
  file_type: "audio" | "video"; duration: string
  color: string; emoji: string; lyrics: string
  cover_url: string; isEmpty?: boolean
}

export function makeEmpty(row: number, col: number): CellTrack {
  const idx = row * COLS + col
  return { title: "Добавить трек", artist: "", file_type: "audio", duration: "", color: COLORS[idx % COLORS.length], emoji: "+", lyrics: "", cover_url: "", isEmpty: true }
}
