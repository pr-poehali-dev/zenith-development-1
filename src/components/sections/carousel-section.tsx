import { useState, useRef, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import Icon from "@/components/ui/icon"

interface Track {
  id: number
  title: string
  artist: string
  color: string
  emoji: string
  duration: string
}

const tracks: Track[] = [
  { id: 1, title: "Night Drive", artist: "The Midnight", color: "from-purple-900 to-indigo-900", emoji: "🌃", duration: "4:23" },
  { id: 2, title: "Blinding Lights", artist: "The Weeknd", color: "from-red-900 to-pink-900", emoji: "🔴", duration: "3:20" },
  { id: 3, title: "Levitating", artist: "Dua Lipa", color: "from-violet-900 to-fuchsia-900", emoji: "🪐", duration: "3:23" },
  { id: 4, title: "Golden Hour", artist: "JVKE", color: "from-amber-900 to-orange-900", emoji: "🌅", duration: "3:23" },
  { id: 5, title: "Bad Guy", artist: "Billie Eilish", color: "from-green-900 to-teal-900", emoji: "🖤", duration: "3:14" },
  { id: 6, title: "Flowers", artist: "Miley Cyrus", color: "from-rose-900 to-red-900", emoji: "🌸", duration: "3:21" },
  { id: 7, title: "As It Was", artist: "Harry Styles", color: "from-blue-900 to-cyan-900", emoji: "💙", duration: "2:37" },
  { id: 8, title: "Cruel Summer", artist: "Taylor Swift", color: "from-yellow-900 to-amber-900", emoji: "☀️", duration: "2:58" },
  { id: 9, title: "Watermelon Sugar", artist: "Harry Styles", color: "from-pink-900 to-rose-900", emoji: "🍉", duration: "2:54" },
]

// 3 rows × 3 cols grid
const COLS = 3
const ROWS = 3

function TrackCard({ track, isPlaying, onClick }: { track: Track; isPlaying: boolean; onClick: () => void }) {
  return (
    <motion.div
      className={`relative bg-gradient-to-br ${track.color} rounded-2xl overflow-hidden cursor-pointer select-none aspect-square`}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.95 }}
      animate={isPlaying ? { boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 30px rgba(255,255,255,0.4)", "0 0 0px rgba(255,255,255,0)"] } : {}}
      transition={isPlaying ? { duration: 1.5, repeat: Infinity } : { duration: 0.2 }}
      onClick={onClick}
      data-clickable
    >
      {/* Album art emoji */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-5xl md:text-6xl">{track.emoji}</span>
      </div>

      {/* Playing indicator */}
      {isPlaying && (
        <div className="absolute top-2 right-2 flex items-center gap-[2px]">
          {[1, 2, 3].map((bar) => (
            <motion.div
              key={bar}
              className="w-[3px] bg-white rounded-full"
              animate={{ height: ["6px", "14px", "6px"] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: bar * 0.15, ease: "easeInOut" }}
            />
          ))}
        </div>
      )}

      {/* Track info on hover */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3"
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <p className="text-white font-medium text-xs truncate">{track.title}</p>
        <p className="text-white/60 text-[10px] truncate">{track.artist}</p>
      </motion.div>
    </motion.div>
  )
}

export function CarouselSection() {
  const [playingId, setPlayingId] = useState<number | null>(null)
  // Each row has an offset (which track index starts that row), draggable horizontally
  const [rowOffsets, setRowOffsets] = useState([0, 1, 2])
  // Each col has an offset for vertical dragging
  const [colOffsets, setColOffsets] = useState([0, 0, 0])

  const dragStartRef = useRef<{ x: number; y: number; row?: number; col?: number } | null>(null)

  const handleTrackClick = (trackId: number) => {
    setPlayingId((prev) => (prev === trackId ? null : trackId))
  }

  // Shift row left/right
  const shiftRow = (rowIdx: number, dir: 1 | -1) => {
    setRowOffsets((prev) => {
      const next = [...prev]
      next[rowIdx] = ((next[rowIdx] + dir) % tracks.length + tracks.length) % tracks.length
      return next
    })
  }

  // Shift col up/down
  const shiftCol = (colIdx: number, dir: 1 | -1) => {
    setColOffsets((prev) => {
      const next = [...prev]
      next[colIdx] = ((next[colIdx] + dir * COLS) % tracks.length + tracks.length) % tracks.length
      return next
    })
  }

  // Get track for cell (row, col) considering both row and col offsets
  const getTrack = (row: number, col: number): Track => {
    const base = (rowOffsets[row] + col + colOffsets[col] * COLS) % tracks.length
    return tracks[((base % tracks.length) + tracks.length) % tracks.length]
  }

  return (
    <section className="bg-primary py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <motion.h2
          className="text-3xl md:text-4xl font-serif text-primary-foreground mb-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Твоя музыка, под рукой.
        </motion.h2>
        <motion.p
          className="text-primary-foreground/60 text-sm"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Двигай ряды и колонки — как кубик Рубика. Нажми на трек, чтобы включить.
        </motion.p>
      </div>

      <div className="flex justify-center px-6">
        <div className="relative">
          {/* Column shift buttons (top) */}
          <div className="flex gap-3 mb-3 justify-center">
            {Array.from({ length: COLS }).map((_, colIdx) => (
              <div key={colIdx} className="flex gap-1" style={{ width: "clamp(90px, 18vw, 140px)" }}>
                <button
                  className="flex-1 flex justify-center items-center py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                  onClick={() => shiftCol(colIdx, -1)}
                  data-clickable
                >
                  <Icon name="ChevronUp" size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 items-center">
            {/* Left row shift buttons */}
            <div className="flex flex-col gap-3">
              {Array.from({ length: ROWS }).map((_, rowIdx) => (
                <button
                  key={rowIdx}
                  className="flex items-center justify-center w-7 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                  style={{ height: "clamp(90px, 18vw, 140px)" }}
                  onClick={() => shiftRow(rowIdx, -1)}
                  data-clickable
                >
                  <Icon name="ChevronLeft" size={14} />
                </button>
              ))}
            </div>

            {/* Grid */}
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${COLS}, clamp(90px, 18vw, 140px))`,
                gridTemplateRows: `repeat(${ROWS}, clamp(90px, 18vw, 140px))`,
              }}
            >
              {Array.from({ length: ROWS }).map((_, row) =>
                Array.from({ length: COLS }).map((_, col) => {
                  const track = getTrack(row, col)
                  return (
                    <TrackCard
                      key={`${row}-${col}`}
                      track={track}
                      isPlaying={playingId === track.id}
                      onClick={() => handleTrackClick(track.id)}
                    />
                  )
                })
              )}
            </div>

            {/* Right row shift buttons */}
            <div className="flex flex-col gap-3">
              {Array.from({ length: ROWS }).map((_, rowIdx) => (
                <button
                  key={rowIdx}
                  className="flex items-center justify-center w-7 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                  style={{ height: "clamp(90px, 18vw, 140px)" }}
                  onClick={() => shiftRow(rowIdx, 1)}
                  data-clickable
                >
                  <Icon name="ChevronRight" size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Column shift buttons (bottom) */}
          <div className="flex gap-3 mt-3 justify-center">
            {Array.from({ length: COLS }).map((_, colIdx) => (
              <div key={colIdx} className="flex gap-1" style={{ width: "clamp(90px, 18vw, 140px)" }}>
                <button
                  className="flex-1 flex justify-center items-center py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                  onClick={() => shiftCol(colIdx, 1)}
                  data-clickable
                >
                  <Icon name="ChevronDown" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Now playing bar */}
      <motion.div
        className="max-w-6xl mx-auto px-6 mt-10"
        initial={false}
        animate={playingId ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        {playingId && (() => {
          const t = tracks.find((tr) => tr.id === playingId)!
          return (
            <div className={`bg-gradient-to-r ${t.color} rounded-2xl px-6 py-4 flex items-center gap-4`}>
              <span className="text-3xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{t.title}</p>
                <p className="text-white/60 text-sm truncate">{t.artist}</p>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <div className="flex items-center gap-[3px]">
                  {[1, 2, 3, 4].map((bar) => (
                    <motion.div
                      key={bar}
                      className="w-1 bg-white/80 rounded-full"
                      animate={{ height: ["6px", "18px", "6px"] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: bar * 0.12, ease: "easeInOut" }}
                    />
                  ))}
                </div>
                <span className="text-white text-sm ml-2">{t.duration}</span>
              </div>
              <button
                className="text-white/60 hover:text-white transition-colors"
                onClick={() => setPlayingId(null)}
                data-clickable
              >
                <Icon name="X" size={18} />
              </button>
            </div>
          )
        })()}
      </motion.div>
    </section>
  )
}
