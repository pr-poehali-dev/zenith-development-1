import { useRef } from "react"
import { motion } from "framer-motion"
import Icon from "@/components/ui/icon"
import { CellTrack } from "./carousel-types"

export function NowPlayingPanel({ cell, radioMode, onClose }: {
  cell: CellTrack
  radioMode: "off" | "seq" | "shuffle"
  onClose: () => void
}) {
  const lyricsRef = useRef<HTMLDivElement>(null)
  return (
    <motion.div className="max-w-6xl mx-auto px-6 mt-8"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}>
      <div className={`bg-gradient-to-br ${cell.color} rounded-2xl overflow-hidden`}>
        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
          <div className="flex items-end gap-[3px]">
            {[1,2,3,4].map(b => (
              <motion.div key={b} className="w-1 bg-white/80 rounded-full"
                animate={{ height: ["4px","16px","4px"] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: b*0.12, ease: "easeInOut" }} />
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate text-sm">{cell.title}</p>
            {cell.artist && <p className="text-white/60 text-xs truncate">{cell.artist}</p>}
          </div>
          {radioMode !== "off" && (
            <div className="flex items-center gap-1 bg-white/20 rounded-lg px-2 py-1">
              <Icon name={radioMode === "shuffle" ? "Shuffle" : "ListMusic"} size={12} className="text-white" />
              <span className="text-white text-xs">{radioMode === "shuffle" ? "Произвольно" : "По порядку"}</span>
            </div>
          )}
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors ml-1" data-clickable>
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Body: cover + lyrics */}
        <div className="flex gap-0 min-h-[220px] max-h-[340px]">
          {/* Cover */}
          <div className="w-[180px] flex-shrink-0 hidden sm:block">
            {cell.cover_url
              ? <img src={cell.cover_url} alt={cell.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center opacity-30">
                  <span className="text-7xl">{cell.emoji}</span>
                </div>}
          </div>
          {/* Lyrics */}
          <div ref={lyricsRef} className="flex-1 p-5 overflow-y-auto">
            {cell.lyrics ? (
              <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{cell.lyrics}</p>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2 opacity-30">
                <Icon name="FileText" size={32} className="text-white" />
                <p className="text-white text-sm">Текст не добавлен</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
