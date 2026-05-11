import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"

const TRACKS_URL = "https://functions.poehali.dev/36cc0561-b248-4cd8-b195-d1d5ef5c5a83"

const COLS = 3
const ROWS = 3
const TOTAL = ROWS * COLS

const COLORS = [
  "from-purple-900 to-indigo-900",
  "from-red-900 to-pink-900",
  "from-violet-900 to-fuchsia-900",
  "from-amber-900 to-orange-900",
  "from-green-900 to-teal-900",
  "from-rose-900 to-red-900",
  "from-blue-900 to-cyan-900",
  "from-yellow-900 to-amber-900",
  "from-pink-900 to-rose-900",
]
const EMOJIS = ["🎵", "🎶", "🎸", "🎹", "🎺", "🎻", "🥁", "🎤", "🎧"]

interface CellTrack {
  id?: number
  title: string
  artist: string
  file_url?: string
  file_type: "audio" | "video"
  duration: string
  color: string
  emoji: string
  lyrics: string
  isEmpty?: boolean
}

function makeEmpty(row: number, col: number): CellTrack {
  const idx = row * COLS + col
  return {
    title: "Добавить трек", artist: "", file_type: "audio",
    duration: "", color: COLORS[idx % COLORS.length],
    emoji: "+", lyrics: "", isEmpty: true,
  }
}

function WaveBar({ playing }: { playing: boolean }) {
  if (!playing) return null
  return (
    <div className="absolute top-2 right-2 flex items-end gap-[2px]">
      {[1, 2, 3].map((bar) => (
        <motion.div key={bar} className="w-[3px] bg-white rounded-full"
          animate={{ height: ["4px", "12px", "4px"] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: bar * 0.13, ease: "easeInOut" }} />
      ))}
    </div>
  )
}

interface TrackCardProps {
  cell: CellTrack
  isPlaying: boolean
  uploading: boolean
  isAdmin: boolean
  onClick: () => void
  onLongPress: () => void
}

function TrackCard({ cell, isPlaying, uploading, isAdmin, onClick, onLongPress }: TrackCardProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handlePressStart = () => {
    if (!cell.isEmpty) longPressTimer.current = setTimeout(() => onLongPress(), 600)
  }
  const handlePressEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current) }

  return (
    <motion.div
      className={`relative bg-gradient-to-br ${cell.color} rounded-2xl overflow-hidden cursor-pointer select-none aspect-square`}
      whileHover={{ scale: cell.isEmpty ? 1.02 : 1.05 }} whileTap={{ scale: 0.95 }}
      animate={isPlaying ? { boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 28px rgba(255,255,255,0.45)", "0 0 0px rgba(255,255,255,0)"] } : {}}
      transition={isPlaying ? { duration: 1.4, repeat: Infinity } : { duration: 0.2 }}
      onClick={onClick} onMouseDown={handlePressStart} onMouseUp={handlePressEnd}
      onTouchStart={handlePressStart} onTouchEnd={handlePressEnd} data-clickable>
      {uploading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <motion.div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
        </div>
      ) : (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`${cell.isEmpty ? "text-4xl opacity-40" : "text-5xl md:text-6xl"}`}>
              {cell.isEmpty && isAdmin ? "+" : cell.emoji}
            </span>
          </div>
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

function PasswordModal({ onSuccess, onClose }: { onSuccess: (pwd: string) => void; onClose: () => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(false)
    try {
      const res = await fetch(`${TRACKS_URL}/verify-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.ok) { onSuccess(password) } else { setError(true); setPassword("") }
    } catch { setError(true) } finally { setLoading(false) }
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="bg-background rounded-2xl p-8 w-full max-w-sm shadow-2xl"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="Lock" size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-serif text-lg text-foreground">Режим администратора</h3>
            <p className="text-muted-foreground text-xs">Введи пароль для управления треками</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input ref={inputRef} type="password" value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }} placeholder="Пароль"
              className={`w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${error ? "ring-2 ring-destructive" : "focus:ring-primary"}`} />
            {error && (
              <motion.p className="text-destructive text-xs mt-2 ml-1"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                Неверный пароль
              </motion.p>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-sm">Отмена</button>
            <button type="submit" disabled={loading || !password}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm disabled:opacity-50" data-clickable>
              {loading ? "..." : "Войти"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function UploadFormModal({ fileName, onConfirm, onClose }: {
  fileName: string; onConfirm: (title: string, artist: string, lyrics: string) => void; onClose: () => void
}) {
  const [title, setTitle] = useState(fileName.replace(/\.[^.]+$/, ""))
  const [artist, setArtist] = useState("")
  const [lyrics, setLyrics] = useState("")
  const lyricsFileRef = useRef<HTMLInputElement>(null)

  const handleLyricsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setLyrics(ev.target?.result as string || "")
    reader.readAsText(file); e.target.value = ""
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="Music" size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="font-serif text-base text-foreground">Новый трек</h3>
            <p className="text-muted-foreground text-xs truncate max-w-[200px]">{fileName}</p>
          </div>
        </div>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название трека"
            className="w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Исполнитель (необязательно)"
            className="w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Текст песни</span>
              <button type="button" onClick={() => lyricsFileRef.current?.click()}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors" data-clickable>
                <Icon name="FileText" size={12} /> Загрузить .txt
              </button>
              <input ref={lyricsFileRef} type="file" accept=".txt,text/plain" className="hidden" onChange={handleLyricsFile} />
            </div>
            <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)}
              placeholder="Вставь текст или загрузи .txt файл..." rows={4}
              className="w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-sm">Отмена</button>
          <button onClick={() => onConfirm(title, artist, lyrics)} disabled={!title.trim()}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm disabled:opacity-50" data-clickable>
            Загрузить
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function CellActionModal({ cell, onEdit, onReplace, onDelete, onClose }: {
  cell: CellTrack; onEdit: () => void; onReplace: () => void; onDelete: () => void; onClose: () => void
}) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-8"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{cell.emoji}</span>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{cell.title}</p>
            {cell.artist && <p className="text-muted-foreground text-sm truncate">{cell.artist}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <button onClick={onEdit}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-foreground" data-clickable>
            <Icon name="Pencil" size={16} className="text-primary" />
            <span className="text-sm">Редактировать</span>
          </button>
          <button onClick={onReplace}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-foreground" data-clickable>
            <Icon name="RefreshCw" size={16} className="text-primary" />
            <span className="text-sm">Заменить файл</span>
          </button>
          <button onClick={onDelete}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors text-destructive" data-clickable>
            <Icon name="Trash2" size={16} />
            <span className="text-sm">Удалить трек</span>
          </button>
        </div>
        <button onClick={onClose}
          className="w-full mt-3 py-3 rounded-xl bg-secondary/50 text-muted-foreground hover:bg-secondary transition-colors text-sm">
          Отмена
        </button>
      </motion.div>
    </motion.div>
  )
}

function EditTrackModal({ cell, adminPassword, onSave, onClose }: {
  cell: CellTrack; adminPassword: string; onSave: (title: string, artist: string, lyrics: string) => void; onClose: () => void
}) {
  const [title, setTitle] = useState(cell.title)
  const [artist, setArtist] = useState(cell.artist)
  const [lyrics, setLyrics] = useState(cell.lyrics)
  const [saving, setSaving] = useState(false)
  const lyricsFileRef = useRef<HTMLInputElement>(null)

  const handleLyricsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setLyrics(ev.target?.result as string || "")
    reader.readAsText(file); e.target.value = ""
  }

  const handleSave = async () => {
    if (!title.trim() || !cell.id) return
    setSaving(true)
    try {
      await fetch(TRACKS_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Admin-Password": adminPassword },
        body: JSON.stringify({ id: cell.id, title, artist, lyrics }),
      })
      onSave(title, artist, lyrics)
    } finally { setSaving(false) }
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">{cell.emoji}</span>
          <h3 className="font-serif text-base text-foreground">Редактировать трек</h3>
        </div>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название трека"
            className="w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Исполнитель"
            className="w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Текст песни</span>
              <button type="button" onClick={() => lyricsFileRef.current?.click()}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors" data-clickable>
                <Icon name="FileText" size={12} /> Загрузить .txt
              </button>
              <input ref={lyricsFileRef} type="file" accept=".txt,text/plain" className="hidden" onChange={handleLyricsFile} />
            </div>
            <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)}
              placeholder="Текст песни..." rows={5}
              className="w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-sm">Отмена</button>
          <button onClick={handleSave} disabled={saving || !title.trim()}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm disabled:opacity-50" data-clickable>
            {saving ? "Сохраняю..." : "Сохранить"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function LyricsPanel({ cell, onClose }: { cell: CellTrack; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-4 pb-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className={`bg-gradient-to-b ${cell.color} rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden`}
        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}>
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <span className="text-3xl">{cell.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{cell.title}</p>
            {cell.artist && <p className="text-white/60 text-sm truncate">{cell.artist}</p>}
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors" data-clickable>
            <Icon name="ChevronDown" size={20} />
          </button>
        </div>
        <div className="p-5 max-h-[55vh] overflow-y-auto">
          {cell.lyrics ? (
            <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{cell.lyrics}</p>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-40">
              <Icon name="FileText" size={32} className="text-white" />
              <p className="text-white text-sm">Текст не добавлен</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function CarouselSection() {
  const [cells, setCells] = useState<CellTrack[]>(() =>
    Array.from({ length: TOTAL }, (_, i) => makeEmpty(Math.floor(i / COLS), i % COLS))
  )
  const [playingIdx, setPlayingIdx] = useState<number | null>(null)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [rowOffsets, setRowOffsets] = useState([0, 0, 0])
  const [colOffsets, setColOffsets] = useState([0, 0, 0])
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [cellActionIdx, setCellActionIdx] = useState<number | null>(null)
  const [editCellIdx, setEditCellIdx] = useState<number | null>(null)
  const [showLyrics, setShowLyrics] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingCellIdx, setPendingCellIdx] = useState<number | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(TRACKS_URL).then((r) => r.json()).then((data) => {
      if (!data.tracks?.length) return
      setCells((prev) => {
        const next = [...prev]
        data.tracks.forEach((t: Record<string, string | number>) => {
          const flatIdx = Number(t.cell_row) * COLS + Number(t.cell_col)
          if (flatIdx >= 0 && flatIdx < TOTAL) {
            next[flatIdx] = {
              id: Number(t.id), title: String(t.title), artist: String(t.artist || ""),
              file_url: String(t.file_url), file_type: t.file_type === "video" ? "video" : "audio",
              duration: String(t.duration || ""), color: String(t.color || COLORS[flatIdx % COLORS.length]),
              emoji: String(t.emoji || EMOJIS[flatIdx % EMOJIS.length]),
              lyrics: String(t.lyrics || ""), isEmpty: false,
            }
          }
        })
        return next
      })
    }).catch(() => {})
  }, [])

  const triggerFileSelect = (cellIdx: number) => {
    setPendingCellIdx(cellIdx)
    fileInputRef.current?.click()
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && pendingCellIdx !== null) { setPendingFile(file); setShowUploadForm(true) }
    e.target.value = ""
  }

  const handleUploadConfirm = async (title: string, artist: string, lyrics: string) => {
    if (!pendingFile || pendingCellIdx === null) return
    const idx = pendingCellIdx; const file = pendingFile
    setShowUploadForm(false); setPendingFile(null); setPendingCellIdx(null); setUploadingIdx(idx)

    const row = Math.floor(idx / COLS); const col = idx % COLS
    const isVideo = file.type.startsWith("video/")
    const color = COLORS[idx % COLORS.length]
    const emoji = isVideo ? "🎬" : EMOJIS[idx % EMOJIS.length]

    const reader = new FileReader()
    reader.onload = async (e) => {
      const b64 = (e.target?.result as string).split(",")[1]
      try {
        const res = await fetch(TRACKS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Admin-Password": adminPassword },
          body: JSON.stringify({ file_data: b64, file_name: file.name, file_type: isVideo ? "video" : "audio", title, artist, lyrics, cell_row: row, cell_col: col, color, emoji }),
        })
        const saved = await res.json()
        setCells((prev) => {
          const next = [...prev]
          next[idx] = { id: saved.id, title: saved.title, artist: saved.artist || "", file_url: saved.file_url, file_type: isVideo ? "video" : "audio", duration: "", color, emoji, lyrics: saved.lyrics || "", isEmpty: false }
          return next
        })
      } catch {
        setCells((prev) => { const next = [...prev]; next[idx] = makeEmpty(row, col); return next })
      } finally { setUploadingIdx(null) }
    }
    reader.readAsDataURL(file)
  }

  const handleCellClick = (flatIdx: number) => {
    const cell = cells[flatIdx]
    if (cell.isEmpty) { if (isAdmin) triggerFileSelect(flatIdx); return }
    if (!cell.file_url) return
    if (playingIdx === flatIdx) { audioRef.current?.pause(); setPlayingIdx(null) }
    else {
      if (audioRef.current) audioRef.current.pause()
      const audio = new Audio(cell.file_url)
      audioRef.current = audio; audio.play().catch(() => {}); audio.onended = () => setPlayingIdx(null)
      setPlayingIdx(flatIdx)
    }
  }

  const handleLongPress = (flatIdx: number) => {
    if (!isAdmin) { setShowPasswordModal(true); return }
    setCellActionIdx(flatIdx)
  }

  const handleDeleteTrack = async () => {
    if (cellActionIdx === null) return
    const cell = cells[cellActionIdx]; const idx = cellActionIdx; setCellActionIdx(null)
    if (!cell.id) return
    await fetch(`${TRACKS_URL}?id=${cell.id}`, { method: "DELETE", headers: { "X-Admin-Password": adminPassword } })
    const row = Math.floor(idx / COLS); const col = idx % COLS
    setCells((prev) => { const next = [...prev]; next[idx] = makeEmpty(row, col); return next })
    if (playingIdx === idx) { audioRef.current?.pause(); setPlayingIdx(null) }
  }

  const handleReplaceTrack = () => {
    if (cellActionIdx === null) return
    const idx = cellActionIdx; setCellActionIdx(null); triggerFileSelect(idx)
  }

  const handleEditTrack = () => {
    if (cellActionIdx === null) return
    setEditCellIdx(cellActionIdx); setCellActionIdx(null)
  }

  const handleEditSave = (title: string, artist: string, lyrics: string) => {
    if (editCellIdx === null) return
    setCells((prev) => {
      const next = [...prev]
      next[editCellIdx] = { ...next[editCellIdx], title, artist, lyrics }
      return next
    })
    setEditCellIdx(null)
  }

  const shiftRow = (rowIdx: number, dir: 1 | -1) =>
    setRowOffsets((prev) => { const next = [...prev]; next[rowIdx] = ((next[rowIdx] + dir + TOTAL) % TOTAL); return next })

  const shiftCol = (colIdx: number, dir: 1 | -1) =>
    setColOffsets((prev) => { const next = [...prev]; next[colIdx] = ((next[colIdx] + dir + TOTAL) % TOTAL); return next })

  const getCell = (row: number, col: number) => {
    const flatIdx = ((row * COLS + col + rowOffsets[row] + colOffsets[col]) % TOTAL + TOTAL) % TOTAL
    return { cell: cells[flatIdx], flatIdx }
  }

  const playingCell = playingIdx !== null ? cells[playingIdx] : null

  return (
    <section className="bg-primary py-24 overflow-hidden">
      <input ref={fileInputRef} type="file" accept="audio/*,video/*" className="hidden" onChange={handleFileSelected} />

      <AnimatePresence>
        {showPasswordModal && (
          <PasswordModal onSuccess={(pwd) => { setIsAdmin(true); setAdminPassword(pwd); setShowPasswordModal(false) }}
            onClose={() => setShowPasswordModal(false)} />
        )}
        {showUploadForm && pendingFile && (
          <UploadFormModal fileName={pendingFile.name} onConfirm={handleUploadConfirm}
            onClose={() => { setShowUploadForm(false); setPendingFile(null); setPendingCellIdx(null) }} />
        )}
        {cellActionIdx !== null && (
          <CellActionModal cell={cells[cellActionIdx]} onEdit={handleEditTrack}
            onReplace={handleReplaceTrack} onDelete={handleDeleteTrack} onClose={() => setCellActionIdx(null)} />
        )}
        {editCellIdx !== null && (
          <EditTrackModal cell={cells[editCellIdx]} adminPassword={adminPassword}
            onSave={handleEditSave} onClose={() => setEditCellIdx(null)} />
        )}
        {showLyrics && playingCell && (
          <LyricsPanel cell={playingCell} onClose={() => setShowLyrics(false)} />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-6 mb-12">
        <div className="flex items-start justify-between">
          <div>
            <motion.h2 className="text-3xl md:text-4xl font-serif text-primary-foreground mb-2"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              Твоя музыка, под рукой.
            </motion.h2>
            <motion.p className="text-primary-foreground/60 text-sm"
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              {isAdmin ? "Режим администратора: нажми на ячейку, чтобы добавить. Зажми — удалить или заменить." : "Нажми на трек, чтобы включить. Двигай ряды стрелками."}
            </motion.p>
          </div>
          <motion.button
            className={`mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${isAdmin ? "bg-white/20 text-white" : "bg-white/10 text-white/50 hover:bg-white/15 hover:text-white/70"}`}
            onClick={() => isAdmin ? setIsAdmin(false) : setShowPasswordModal(true)}
            whileTap={{ scale: 0.95 }} data-clickable>
            <Icon name={isAdmin ? "ShieldCheck" : "Shield"} size={14} />
            <span>{isAdmin ? "Выйти" : "Админ"}</span>
          </motion.button>
        </div>
      </div>

      <div className="flex justify-center px-6">
        <div className="relative">
          <div className="flex gap-3 mb-3 justify-center">
            {Array.from({ length: COLS }).map((_, colIdx) => (
              <button key={colIdx} style={{ width: "clamp(90px, 18vw, 140px)" }}
                className="flex justify-center items-center py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                onClick={() => shiftCol(colIdx, -1)} data-clickable>
                <Icon name="ChevronUp" size={14} />
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-center">
            <div className="flex flex-col gap-3">
              {Array.from({ length: ROWS }).map((_, rowIdx) => (
                <button key={rowIdx} style={{ height: "clamp(90px, 18vw, 140px)" }}
                  className="flex items-center justify-center w-7 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                  onClick={() => shiftRow(rowIdx, -1)} data-clickable>
                  <Icon name="ChevronLeft" size={14} />
                </button>
              ))}
            </div>

            <div className="grid gap-3" style={{
              gridTemplateColumns: `repeat(${COLS}, clamp(90px, 18vw, 140px))`,
              gridTemplateRows: `repeat(${ROWS}, clamp(90px, 18vw, 140px))`,
            }}>
              {Array.from({ length: ROWS }).map((_, row) =>
                Array.from({ length: COLS }).map((_, col) => {
                  const { cell, flatIdx } = getCell(row, col)
                  return (
                    <TrackCard key={`${row}-${col}`} cell={cell}
                      isPlaying={playingIdx === flatIdx} uploading={uploadingIdx === flatIdx}
                      isAdmin={isAdmin} onClick={() => handleCellClick(flatIdx)}
                      onLongPress={() => handleLongPress(flatIdx)} />
                  )
                })
              )}
            </div>

            <div className="flex flex-col gap-3">
              {Array.from({ length: ROWS }).map((_, rowIdx) => (
                <button key={rowIdx} style={{ height: "clamp(90px, 18vw, 140px)" }}
                  className="flex items-center justify-center w-7 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                  onClick={() => shiftRow(rowIdx, 1)} data-clickable>
                  <Icon name="ChevronRight" size={14} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-3 justify-center">
            {Array.from({ length: COLS }).map((_, colIdx) => (
              <button key={colIdx} style={{ width: "clamp(90px, 18vw, 140px)" }}
                className="flex justify-center items-center py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                onClick={() => shiftCol(colIdx, 1)} data-clickable>
                <Icon name="ChevronDown" size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Now playing bar */}
      <AnimatePresence>
        {playingCell && (
          <motion.div className="max-w-6xl mx-auto px-6 mt-10"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
            <div className={`bg-gradient-to-r ${playingCell.color} rounded-2xl px-5 py-4 flex items-center gap-4`}>
              <span className="text-3xl">{playingCell.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{playingCell.title}</p>
                {playingCell.artist && <p className="text-white/60 text-sm truncate">{playingCell.artist}</p>}
              </div>
              <div className="flex items-end gap-[3px]">
                {[1, 2, 3, 4].map((bar) => (
                  <motion.div key={bar} className="w-1 bg-white/80 rounded-full"
                    animate={{ height: ["4px", "16px", "4px"] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: bar * 0.12, ease: "easeInOut" }} />
                ))}
              </div>
              <button
                className={`ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${playingCell.lyrics ? "bg-white/20 text-white hover:bg-white/30" : "bg-white/10 text-white/30"}`}
                onClick={() => playingCell.lyrics && setShowLyrics(true)}
                disabled={!playingCell.lyrics} data-clickable>
                <Icon name="FileText" size={13} />
                <span className="hidden sm:inline">Текст</span>
              </button>
              <button className="text-white/60 hover:text-white transition-colors ml-1"
                onClick={() => { audioRef.current?.pause(); setPlayingIdx(null) }} data-clickable>
                <Icon name="X" size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}