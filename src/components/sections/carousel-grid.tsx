import { useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"
import { CellTrack, COLS, ROWS } from "./carousel-types"

// ─── Wave bars ────────────────────────────────────────────────────────────────
function WaveBar({ playing }: { playing: boolean }) {
  if (!playing) return null
  return (
    <div className="absolute top-2 right-2 flex items-end gap-[2px]">
      {[1,2,3].map(b => (
        <motion.div key={b} className="w-[3px] bg-white rounded-full"
          animate={{ height: ["4px","12px","4px"] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: b*0.13, ease: "easeInOut" }} />
      ))}
    </div>
  )
}

// ─── Track card ───────────────────────────────────────────────────────────────
export function TrackCard({ cell, isPlaying, uploading, isAdmin, isHighlighted, onClick, onLongPress }: {
  cell: CellTrack; isPlaying: boolean; uploading: boolean; isAdmin: boolean
  isHighlighted: boolean; onClick: () => void; onLongPress: () => void
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onStart = () => { if (!cell.isEmpty) timer.current = setTimeout(onLongPress, 600) }
  const onEnd = () => { if (timer.current) clearTimeout(timer.current) }

  return (
    <motion.div
      className={`relative bg-gradient-to-br ${cell.color} rounded-2xl overflow-hidden cursor-pointer select-none w-full h-full`}
      whileHover={{ scale: cell.isEmpty ? 1.02 : 1.05 }} whileTap={{ scale: 0.95 }}
      animate={isHighlighted
        ? { boxShadow: ["0 0 0px rgba(255,220,50,0)", "0 0 36px rgba(255,220,50,0.9)", "0 0 0px rgba(255,220,50,0)"] }
        : isPlaying
          ? { boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 28px rgba(255,255,255,0.45)", "0 0 0px rgba(255,255,255,0)"] }
          : {}}
      transition={(isHighlighted || isPlaying) ? { duration: isHighlighted ? 0.8 : 1.4, repeat: isHighlighted ? 3 : Infinity } : { duration: 0.2 }}
      onClick={onClick} onMouseDown={onStart} onMouseUp={onEnd}
      onTouchStart={onStart} onTouchEnd={onEnd} data-clickable>
      {uploading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <motion.div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
        </div>
      ) : (
        <>
          {cell.cover_url ? (
            <img src={cell.cover_url} alt={cell.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cell.isEmpty ? "text-4xl opacity-40" : "text-5xl md:text-6xl"}>
                {cell.isEmpty && isAdmin ? "+" : cell.emoji}
              </span>
            </div>
          )}
          <WaveBar playing={isPlaying} />
          {isAdmin && !cell.isEmpty && (
            <div className="absolute top-2 left-2 bg-black/50 rounded-full p-1">
              <Icon name="Pencil" size={10} className="text-white/70" />
            </div>
          )}
          {cell.isEmpty && isAdmin && (
            <div className="absolute inset-3 border-2 border-dashed border-white/30 rounded-xl flex items-center justify-center">
              <Icon name="Plus" size={20} className="text-white/40" />
            </div>
          )}
          {cell.isEmpty && !isAdmin && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <Icon name="Music" size={28} className="text-white" />
            </div>
          )}
          <motion.div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2"
            initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}>
            <p className="text-white font-medium text-[11px] truncate">{cell.title}</p>
            {cell.artist && <p className="text-white/60 text-[9px] truncate">{cell.artist}</p>}
          </motion.div>
        </>
      )}
    </motion.div>
  )
}

// ─── Carousel grid ────────────────────────────────────────────────────────────
export interface CarouselGridProps {
  cells: CellTrack[]
  playingIdx: number | null
  uploadingIdx: number | null
  highlightIdx: number | null
  spinningRow: number | null
  showSwipeHint: boolean
  isAdmin: boolean
  rowOffsets: number[]
  colOffsets: number[]
  onCellClick: (flatIdx: number) => void
  onLongPress: (flatIdx: number) => void
  onShiftRow: (rowIdx: number, dir: 1 | -1) => void
  onShiftCol: (colIdx: number, dir: 1 | -1) => void
  onRowSwipeStart: (e: React.TouchEvent) => void
  onRowSwipeEnd: (rowIdx: number, e: React.TouchEvent) => void
  onColSwipeStart: (e: React.TouchEvent) => void
  onColSwipeEnd: (colIdx: number, e: React.TouchEvent) => void
}

export function CarouselGrid({
  cells, playingIdx, uploadingIdx, highlightIdx, spinningRow, showSwipeHint,
  isAdmin, rowOffsets, colOffsets,
  onCellClick, onLongPress, onShiftRow, onShiftCol,
  onRowSwipeStart, onRowSwipeEnd, onColSwipeStart, onColSwipeEnd,
}: CarouselGridProps) {
  const TOTAL = ROWS * COLS

  const getCell = (row: number, col: number) => {
    const flatIdx = ((row * COLS + col + rowOffsets[row] + colOffsets[col]) % TOTAL + TOTAL) % TOTAL
    return { cell: cells[flatIdx], flatIdx }
  }

  return (
    <div className="flex justify-center px-6">
      <div className="relative">
        {/* Col up buttons */}
        <div className="flex gap-3 mb-3 justify-center">
          {Array.from({ length: COLS }).map((_, ci) => (
            <button key={ci} style={{ width: "clamp(90px, 18vw, 140px)" }}
              className="flex justify-center items-center py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
              onClick={() => onShiftCol(ci, -1)} onTouchStart={onColSwipeStart} onTouchEnd={(e) => onColSwipeEnd(ci, e)} data-clickable>
              <Icon name="ChevronUp" size={14} />
            </button>
          ))}
        </div>

        <div className="flex gap-3 items-center">
          {/* Row left buttons */}
          <div className="flex flex-col gap-3">
            {Array.from({ length: ROWS }).map((_, ri) => (
              <button key={ri} style={{ height: "clamp(90px, 18vw, 140px)" }}
                className="flex items-center justify-center w-7 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                onClick={() => onShiftRow(ri, -1)} data-clickable>
                <Icon name="ChevronLeft" size={14} />
              </button>
            ))}
          </div>

          {/* Cells */}
          <div className="flex flex-col gap-3 relative">
            <AnimatePresence>
              {showSwipeHint && (
                <motion.div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none rounded-2xl overflow-hidden"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-5 py-3 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-white text-sm font-medium">
                      <motion.div animate={{ x: [-6, 6, -6] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
                        <Icon name="ArrowLeftRight" size={18} className="text-white" />
                      </motion.div>
                      <span>Свайп — листать</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-xs">
                      <Icon name="Zap" size={13} className="text-yellow-400" />
                      <span>Резкий свайп — случайный трек</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {Array.from({ length: ROWS }).map((_, row) => (
              <div key={row} className="flex gap-3 relative"
                onTouchStart={onRowSwipeStart} onTouchEnd={(e) => onRowSwipeEnd(row, e)}
                style={{ touchAction: "pan-y" }}>
                <AnimatePresence>
                  {spinningRow === row && (
                    <motion.div className="absolute inset-0 z-10 rounded-2xl bg-white/10 backdrop-blur-[2px] flex items-center justify-center pointer-events-none"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}>
                        <Icon name="Shuffle" size={22} className="text-white/80" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {Array.from({ length: COLS }).map((_, col) => {
                  const { cell, flatIdx } = getCell(row, col)
                  return (
                    <div key={col} style={{ width: "clamp(90px, 18vw, 140px)", height: "clamp(90px, 18vw, 140px)" }}>
                      <TrackCard cell={cell} isPlaying={playingIdx === flatIdx} uploading={uploadingIdx === flatIdx}
                        isAdmin={isAdmin} isHighlighted={highlightIdx === flatIdx}
                        onClick={() => onCellClick(flatIdx)} onLongPress={() => onLongPress(flatIdx)} />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Row right buttons */}
          <div className="flex flex-col gap-3">
            {Array.from({ length: ROWS }).map((_, ri) => (
              <button key={ri} style={{ height: "clamp(90px, 18vw, 140px)" }}
                className="flex items-center justify-center w-7 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                onClick={() => onShiftRow(ri, 1)} data-clickable>
                <Icon name="ChevronRight" size={14} />
              </button>
            ))}
          </div>
        </div>

        {/* Col down buttons */}
        <div className="flex gap-3 mt-3 justify-center">
          {Array.from({ length: COLS }).map((_, ci) => (
            <button key={ci} style={{ width: "clamp(90px, 18vw, 140px)" }}
              className="flex justify-center items-center py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
              onClick={() => onShiftCol(ci, 1)} onTouchStart={onColSwipeStart} onTouchEnd={(e) => onColSwipeEnd(ci, e)} data-clickable>
              <Icon name="ChevronDown" size={14} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
