import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"

const TRACKS_URL = "https://functions.poehali.dev/36cc0561-b248-4cd8-b195-d1d5ef5c5a83"
const COLS = 3
const ROWS = 3
const TOTAL = ROWS * COLS

const COLORS = [
  "from-purple-900 to-indigo-900", "from-red-900 to-pink-900",
  "from-violet-900 to-fuchsia-900", "from-amber-900 to-orange-900",
  "from-green-900 to-teal-900", "from-rose-900 to-red-900",
  "from-blue-900 to-cyan-900", "from-yellow-900 to-amber-900",
  "from-pink-900 to-rose-900",
]
const EMOJIS = ["🎵", "🎶", "🎸", "🎹", "🎺", "🎻", "🥁", "🎤", "🎧"]

interface CellTrack {
  id?: number
  title: string; artist: string; file_url?: string
  file_type: "audio" | "video"; duration: string
  color: string; emoji: string; lyrics: string
  cover_url: string; isEmpty?: boolean
}

function makeEmpty(row: number, col: number): CellTrack {
  const idx = row * COLS + col
  return { title: "Добавить трек", artist: "", file_type: "audio", duration: "", color: COLORS[idx % COLORS.length], emoji: "+", lyrics: "", cover_url: "", isEmpty: true }
}

// ─── Wave bars ───────────────────────────────────────────────────────────────
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
function TrackCard({ cell, isPlaying, uploading, isAdmin, isHighlighted, onClick, onLongPress }: {
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

// ─── Password modal ───────────────────────────────────────────────────────────
function PasswordModal({ onSuccess, onClose }: { onSuccess: (p: string) => void; onClose: () => void }) {
  const [password, setPassword] = useState(""); const [error, setError] = useState(false); const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { setTimeout(() => ref.current?.focus(), 100) }, [])
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(false)
    try {
      const r = await fetch(`${TRACKS_URL}/verify-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) })
      const d = await r.json()
      if (d.ok) onSuccess(password); else { setError(true); setPassword("") }
    } catch { setError(true) } finally { setLoading(false) }
  }
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="bg-background rounded-2xl p-8 w-full max-w-sm shadow-2xl"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Icon name="Lock" size={18} className="text-primary" /></div>
          <div><h3 className="font-serif text-lg text-foreground">Режим администратора</h3><p className="text-muted-foreground text-xs">Введи пароль для управления треками</p></div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <input ref={ref} type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(false) }} placeholder="Пароль"
              className={`w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${error ? "ring-2 ring-destructive" : "focus:ring-primary"}`} />
            {error && <motion.p className="text-destructive text-xs mt-2 ml-1" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>Неверный пароль</motion.p>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-sm">Отмена</button>
            <button type="submit" disabled={loading || !password} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm disabled:opacity-50" data-clickable>{loading ? "..." : "Войти"}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Cover picker ─────────────────────────────────────────────────────────────
function CoverPicker({ preview, onFile }: { preview: string; onFile: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1.5">Обложка</p>
      <div className="flex items-center gap-3">
        <div className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ${preview ? "" : "bg-secondary flex items-center justify-center"}`}>
          {preview ? <img src={preview} alt="cover" className="w-full h-full object-cover" /> : <Icon name="Image" size={22} className="text-muted-foreground" />}
        </div>
        <button type="button" onClick={() => ref.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm text-foreground transition-colors" data-clickable>
          <Icon name="Upload" size={14} className="text-primary" /> {preview ? "Заменить" : "Загрузить фото"}
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = "" }} />
      </div>
    </div>
  )
}

// ─── Upload form ──────────────────────────────────────────────────────────────
function UploadFormModal({ fileName, onConfirm, onClose }: {
  fileName: string
  onConfirm: (title: string, artist: string, lyrics: string, coverFile: File | null) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(fileName.replace(/\.[^.]+$/, ""))
  const [artist, setArtist] = useState("")
  const [lyrics, setLyrics] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState("")
  const lyricsRef = useRef<HTMLInputElement>(null)

  const handleLyricsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = (ev) => setLyrics(ev.target?.result as string || ""); r.readAsText(f); e.target.value = ""
  }
  const handleCover = (f: File) => {
    setCoverFile(f)
    const r = new FileReader(); r.onload = (ev) => setCoverPreview(ev.target?.result as string || ""); r.readAsDataURL(f)
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto"
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><Icon name="Music" size={16} className="text-primary" /></div>
          <div><h3 className="font-serif text-base text-foreground">Новый трек</h3><p className="text-muted-foreground text-xs truncate max-w-[200px]">{fileName}</p></div>
        </div>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название трека"
            className="w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Исполнитель"
            className="w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          <CoverPicker preview={coverPreview} onFile={handleCover} />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Текст песни</span>
              <button type="button" onClick={() => lyricsRef.current?.click()} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors" data-clickable>
                <Icon name="FileText" size={12} /> Загрузить .txt
              </button>
              <input ref={lyricsRef} type="file" accept=".txt,text/plain" className="hidden" onChange={handleLyricsFile} />
            </div>
            <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder="Вставь текст или загрузи .txt файл..." rows={4}
              className="w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-sm">Отмена</button>
          <button onClick={() => onConfirm(title, artist, lyrics, coverFile)} disabled={!title.trim()}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm disabled:opacity-50" data-clickable>Загрузить</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Edit track modal ─────────────────────────────────────────────────────────
function EditTrackModal({ cell, adminPassword, onSave, onClose }: {
  cell: CellTrack; adminPassword: string
  onSave: (title: string, artist: string, lyrics: string, coverUrl: string) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(cell.title)
  const [artist, setArtist] = useState(cell.artist)
  const [lyrics, setLyrics] = useState(cell.lyrics)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState(cell.cover_url)
  const [saving, setSaving] = useState(false)
  const lyricsRef = useRef<HTMLInputElement>(null)

  const handleLyricsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = (ev) => setLyrics(ev.target?.result as string || ""); r.readAsText(f); e.target.value = ""
  }
  const handleCover = (f: File) => {
    setCoverFile(f)
    const r = new FileReader(); r.onload = (ev) => setCoverPreview(ev.target?.result as string || ""); r.readAsDataURL(f)
  }

  const handleSave = async () => {
    if (!title.trim() || !cell.id) return
    setSaving(true)
    try {
      let coverB64 = ""; let coverName = ""
      if (coverFile) {
        coverB64 = await new Promise<string>((res) => {
          const r = new FileReader(); r.onload = (ev) => res((ev.target?.result as string).split(",")[1]); r.readAsDataURL(coverFile)
        })
        coverName = coverFile.name
      }
      const resp = await fetch(TRACKS_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Admin-Password": adminPassword },
        body: JSON.stringify({ id: cell.id, title, artist, lyrics, cover_data: coverB64, cover_name: coverName, cover_url: cell.cover_url }),
      })
      const d = await resp.json()
      onSave(title, artist, lyrics, d.cover_url || coverPreview)
    } finally { setSaving(false) }
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto"
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">{cell.emoji}</span>
          <h3 className="font-serif text-base text-foreground">Редактировать трек</h3>
        </div>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название"
            className="w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Исполнитель"
            className="w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          <CoverPicker preview={coverPreview} onFile={handleCover} />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Текст песни</span>
              <button type="button" onClick={() => lyricsRef.current?.click()} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors" data-clickable>
                <Icon name="FileText" size={12} /> Загрузить .txt
              </button>
              <input ref={lyricsRef} type="file" accept=".txt,text/plain" className="hidden" onChange={handleLyricsFile} />
            </div>
            <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder="Текст песни..." rows={5}
              className="w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-sm">Отмена</button>
          <button onClick={handleSave} disabled={saving || !title.trim()}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm disabled:opacity-50" data-clickable>
            {saving ? "Сохраняю..." : "Сохранить"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Cell action modal ────────────────────────────────────────────────────────
function CellActionModal({ cell, onEdit, onReplace, onDelete, onClose }: {
  cell: CellTrack; onEdit: () => void; onReplace: () => void; onDelete: () => void; onClose: () => void
}) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-8"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          {cell.cover_url
            ? <img src={cell.cover_url} alt={cell.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            : <span className="text-3xl">{cell.emoji}</span>}
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{cell.title}</p>
            {cell.artist && <p className="text-muted-foreground text-sm truncate">{cell.artist}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <button onClick={onEdit} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-foreground" data-clickable>
            <Icon name="Pencil" size={16} className="text-primary" /><span className="text-sm">Редактировать</span>
          </button>
          <button onClick={onReplace} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-foreground" data-clickable>
            <Icon name="RefreshCw" size={16} className="text-primary" /><span className="text-sm">Заменить файл</span>
          </button>
          <button onClick={onDelete} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors text-destructive" data-clickable>
            <Icon name="Trash2" size={16} /><span className="text-sm">Удалить трек</span>
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-3 py-3 rounded-xl bg-secondary/50 text-muted-foreground hover:bg-secondary transition-colors text-sm">Отмена</button>
      </motion.div>
    </motion.div>
  )
}

// ─── Now playing panel ────────────────────────────────────────────────────────
function NowPlayingPanel({ cell, radioMode, onClose }: { cell: CellTrack; radioMode: "off" | "seq" | "shuffle"; onClose: () => void }) {
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

// ─── Main component ───────────────────────────────────────────────────────────
export function CarouselSection() {
  const [cells, setCells] = useState<CellTrack[]>(() =>
    Array.from({ length: TOTAL }, (_, i) => makeEmpty(Math.floor(i / COLS), i % COLS))
  )
  const [playingIdx, setPlayingIdx] = useState<number | null>(null)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null)
  const [rowOffsets, setRowOffsets] = useState([0, 0, 0])
  const [colOffsets, setColOffsets] = useState([0, 0, 0])
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [cellActionIdx, setCellActionIdx] = useState<number | null>(null)
  const [editCellIdx, setEditCellIdx] = useState<number | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingCellIdx, setPendingCellIdx] = useState<number | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [showSwipeHint, setShowSwipeHint] = useState(() => !localStorage.getItem("swipeHintSeen"))
  const [spinningRow, setSpinningRow] = useState<number | null>(null)
  // Radio: "off" | "seq" | "shuffle"
  const [radioMode, setRadioMode] = useState<"off" | "seq" | "shuffle">("off")
  const radioClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const radioClickCount = useRef(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load tracks
  useEffect(() => {
    fetch(TRACKS_URL).then(r => r.json()).then(data => {
      if (!data.tracks?.length) return
      setCells(prev => {
        const next = [...prev]
        data.tracks.forEach((t: Record<string, string | number>) => {
          const fi = Number(t.cell_row) * COLS + Number(t.cell_col)
          if (fi >= 0 && fi < TOTAL) {
            next[fi] = {
              id: Number(t.id), title: String(t.title), artist: String(t.artist || ""),
              file_url: String(t.file_url), file_type: t.file_type === "video" ? "video" : "audio",
              duration: String(t.duration || ""), color: String(t.color || COLORS[fi % COLORS.length]),
              emoji: String(t.emoji || EMOJIS[fi % EMOJIS.length]),
              lyrics: String(t.lyrics || ""), cover_url: String(t.cover_url || ""), isEmpty: false,
            }
          }
        })
        return next
      })
    }).catch(() => {})
  }, [])

  // ── Play a track by flat index ──────────────────────────────────────────────
  const playTrack = useCallback((flatIdx: number) => {
    const cell = cells[flatIdx]
    if (!cell?.file_url) return
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(cell.file_url)
    audioRef.current = audio
    audio.play().catch(() => {})
    audio.onended = () => {
      if (radioMode === "seq") {
        // next non-empty track
        const nonEmpty = cells.map((c, i) => ({ c, i })).filter(x => !x.c.isEmpty && x.c.file_url)
        const cur = nonEmpty.findIndex(x => x.i === flatIdx)
        const next = nonEmpty[(cur + 1) % nonEmpty.length]
        if (next) { setPlayingIdx(next.i); playTrack(next.i) }
        else setPlayingIdx(null)
      } else if (radioMode === "shuffle") {
        const nonEmpty = cells.map((c, i) => ({ c, i })).filter(x => !x.c.isEmpty && x.c.file_url && x.i !== flatIdx)
        if (!nonEmpty.length) { setPlayingIdx(null); return }
        const pick = nonEmpty[Math.floor(Math.random() * nonEmpty.length)]
        setPlayingIdx(pick.i); playTrack(pick.i)
      } else {
        // no auto — stay, let user swipe
        setPlayingIdx(flatIdx) // keep highlight
      }
    }
    setPlayingIdx(flatIdx)
   
  }, [cells, radioMode])

  // ── Radio button: single click = seq, double = shuffle ─────────────────────
  const handleRadioClick = () => {
    radioClickCount.current += 1
    if (radioClickTimer.current) clearTimeout(radioClickTimer.current)
    radioClickTimer.current = setTimeout(() => {
      const clicks = radioClickCount.current
      radioClickCount.current = 0
      if (clicks >= 2) {
        // double → shuffle or off if already shuffle
        setRadioMode(prev => prev === "shuffle" ? "off" : "shuffle")
      } else {
        // single → seq or off if already seq
        setRadioMode(prev => {
          if (prev === "off" || prev === "shuffle") {
            // start playing first track if nothing playing
            return "seq"
          }
          return "off"
        })
      }
    }, 280)
  }

  // Auto-start first track when radio turns on
  useEffect(() => {
    if (radioMode !== "off" && playingIdx === null) {
      const nonEmpty = cells.map((c, i) => ({ c, i })).filter(x => !x.c.isEmpty && x.c.file_url)
      if (!nonEmpty.length) return
      const pick = radioMode === "shuffle"
        ? nonEmpty[Math.floor(Math.random() * nonEmpty.length)]
        : nonEmpty[0]
      playTrack(pick.i)
    }
    if (radioMode === "off") {
      audioRef.current?.pause(); setPlayingIdx(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radioMode])

  // ── File upload ─────────────────────────────────────────────────────────────
  const triggerFileSelect = (idx: number) => { setPendingCellIdx(idx); fileInputRef.current?.click() }
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f && pendingCellIdx !== null) { setPendingFile(f); setShowUploadForm(true) }
    e.target.value = ""
  }

  const handleUploadConfirm = async (title: string, artist: string, lyrics: string, coverFile: File | null) => {
    if (!pendingFile || pendingCellIdx === null) return
    const idx = pendingCellIdx; const file = pendingFile
    setShowUploadForm(false); setPendingFile(null); setPendingCellIdx(null); setUploadingIdx(idx)
    const row = Math.floor(idx / COLS); const col = idx % COLS
    const isVideo = file.type.startsWith("video/")
    const color = COLORS[idx % COLORS.length]; const emoji = isVideo ? "🎬" : EMOJIS[idx % EMOJIS.length]

    const toB64 = (f: File) => new Promise<string>((res) => {
      const r = new FileReader(); r.onload = (ev) => res((ev.target?.result as string).split(",")[1]); r.readAsDataURL(f)
    })
    try {
      const fileB64 = await toB64(file)
      let coverB64 = ""; let coverName = ""
      if (coverFile) { coverB64 = await toB64(coverFile); coverName = coverFile.name }
      const res = await fetch(TRACKS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": adminPassword },
        body: JSON.stringify({ file_data: fileB64, file_name: file.name, file_type: isVideo ? "video" : "audio", title, artist, lyrics, cover_data: coverB64, cover_name: coverName, cell_row: row, cell_col: col, color, emoji }),
      })
      const saved = await res.json()
      setCells(prev => {
        const next = [...prev]
        next[idx] = { id: saved.id, title: saved.title, artist: saved.artist || "", file_url: saved.file_url, file_type: isVideo ? "video" : "audio", duration: "", color, emoji, lyrics: saved.lyrics || "", cover_url: saved.cover_url || "", isEmpty: false }
        return next
      })
    } catch {
      setCells(prev => { const next = [...prev]; next[idx] = makeEmpty(row, col); return next })
    } finally { setUploadingIdx(null) }
  }

  // ── Cell click ──────────────────────────────────────────────────────────────
  const handleCellClick = (flatIdx: number) => {
    const cell = cells[flatIdx]
    if (cell.isEmpty) { if (isAdmin) triggerFileSelect(flatIdx); return }
    if (!cell.file_url) return
    if (playingIdx === flatIdx) {
      audioRef.current?.pause(); setPlayingIdx(null)
    } else {
      playTrack(flatIdx)
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
    setCells(prev => { const next = [...prev]; next[idx] = makeEmpty(row, col); return next })
    if (playingIdx === idx) { audioRef.current?.pause(); setPlayingIdx(null) }
  }

  const handleReplaceTrack = () => { if (cellActionIdx === null) return; const idx = cellActionIdx; setCellActionIdx(null); triggerFileSelect(idx) }
  const handleEditTrack = () => { if (cellActionIdx === null) return; setEditCellIdx(cellActionIdx); setCellActionIdx(null) }
  const handleEditSave = (title: string, artist: string, lyrics: string, coverUrl: string) => {
    if (editCellIdx === null) return
    setCells(prev => { const next = [...prev]; next[editCellIdx] = { ...next[editCellIdx], title, artist, lyrics, cover_url: coverUrl }; return next })
    setEditCellIdx(null)
  }

  // ── Grid helpers ────────────────────────────────────────────────────────────
  const shiftRow = (rowIdx: number, dir: 1 | -1) =>
    setRowOffsets(prev => { const next = [...prev]; next[rowIdx] = ((next[rowIdx] + dir + TOTAL) % TOTAL); return next })
  const shiftCol = (colIdx: number, dir: 1 | -1) =>
    setColOffsets(prev => { const next = [...prev]; next[colIdx] = ((next[colIdx] + dir + TOTAL) % TOTAL); return next })

  const getCell = (row: number, col: number) => {
    const flatIdx = ((row * COLS + col + rowOffsets[row] + colOffsets[col]) % TOTAL + TOTAL) % TOTAL
    return { cell: cells[flatIdx], flatIdx }
  }

  // ── Swipe ───────────────────────────────────────────────────────────────────
  const rowSwipeStart = useRef<{ x: number; y: number; t: number } | null>(null)
  const colSwipeStart = useRef<{ x: number; y: number; t: number } | null>(null)

  const dismissHint = () => { setShowSwipeHint(false); localStorage.setItem("swipeHintSeen", "1") }

  const animateShiftRow = (rowIdx: number, dir: 1 | -1, steps: number) => {
    let i = 0; setSpinningRow(rowIdx)
    const tick = () => { if (i >= steps) { setSpinningRow(null); return }; shiftRow(rowIdx, dir); i++; setTimeout(tick, i < steps - 1 ? 60 : 120) }
    tick()
  }

  const spinToRandom = (rowIdx: number, dir: 1 | -1) => {
    const total = 5 + Math.floor(Math.random() * 7); let i = 0; setSpinningRow(rowIdx)
    const tick = () => {
      if (i >= total) {
        setSpinningRow(null)
        const rowCells = Array.from({ length: COLS }, (_, col) => {
          const fi = ((rowIdx * COLS + col + rowOffsets[rowIdx] + colOffsets[col]) % TOTAL + TOTAL) % TOTAL
          return { cell: cells[fi], flatIdx: fi }
        }).filter(x => !x.cell.isEmpty && x.cell.file_url)
        if (!rowCells.length) return
        const pick = rowCells[Math.floor(Math.random() * rowCells.length)]
        setHighlightIdx(pick.flatIdx)
        setTimeout(() => setHighlightIdx(null), 2400)
        playTrack(pick.flatIdx)
        return
      }
      shiftRow(rowIdx, dir); i++; setTimeout(tick, 40 + i * 8)
    }
    tick()
  }

  const handleRowSwipeStart = (e: React.TouchEvent) => { rowSwipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() } }
  const handleRowSwipeEnd = (rowIdx: number, e: React.TouchEvent) => {
    if (!rowSwipeStart.current) return; dismissHint()
    const dx = e.changedTouches[0].clientX - rowSwipeStart.current.x
    const dy = Math.abs(e.changedTouches[0].clientY - rowSwipeStart.current.y)
    const speed = Math.abs(dx) / Math.max(Date.now() - rowSwipeStart.current.t, 1)
    rowSwipeStart.current = null
    if (Math.abs(dx) < 30 || Math.abs(dx) < dy) return
    const dir = dx < 0 ? 1 : -1 as 1 | -1
    if (speed > 1.2 || Math.abs(dx) > 220) spinToRandom(rowIdx, dir)
    else { const steps = Math.max(1, Math.min(5, Math.round(Math.abs(dx) / 55))); if (steps === 1) shiftRow(rowIdx, dir); else animateShiftRow(rowIdx, dir, steps) }
  }
  const handleColSwipeStart = (e: React.TouchEvent) => { colSwipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() } }
  const handleColSwipeEnd = (colIdx: number, e: React.TouchEvent) => {
    if (!colSwipeStart.current) return; dismissHint()
    const dy = e.changedTouches[0].clientY - colSwipeStart.current.y
    const dx = Math.abs(e.changedTouches[0].clientX - colSwipeStart.current.x)
    const speed = Math.abs(dy) / Math.max(Date.now() - colSwipeStart.current.t, 1)
    colSwipeStart.current = null
    if (Math.abs(dy) < 30 || Math.abs(dy) < dx) return
    const dir: 1 | -1 = dy < 0 ? -1 : 1
    if (speed > 1.2 || Math.abs(dy) > 220) { const s = 5 + Math.floor(Math.random() * 7); let i = 0; const t = () => { if (i >= s) return; shiftCol(colIdx, dir); i++; setTimeout(t, 40 + i * 8) }; t() }
    else { const steps = Math.max(1, Math.min(5, Math.round(Math.abs(dy) / 55))); if (steps === 1) shiftCol(colIdx, dir); else { let i = 0; const t = () => { if (i >= steps) return; shiftCol(colIdx, dir); i++; setTimeout(t, 60) }; t() } }
  }

  const playingCell = playingIdx !== null ? cells[playingIdx] : null

  return (
    <section className="bg-primary py-24 overflow-hidden">
      <input ref={fileInputRef} type="file" accept="audio/*,video/*" className="hidden" onChange={handleFileSelected} />

      <AnimatePresence>
        {showPasswordModal && <PasswordModal onSuccess={(pwd) => { setIsAdmin(true); setAdminPassword(pwd); setShowPasswordModal(false) }} onClose={() => setShowPasswordModal(false)} />}
        {showUploadForm && pendingFile && <UploadFormModal fileName={pendingFile.name} onConfirm={handleUploadConfirm} onClose={() => { setShowUploadForm(false); setPendingFile(null); setPendingCellIdx(null) }} />}
        {cellActionIdx !== null && <CellActionModal cell={cells[cellActionIdx]} onEdit={handleEditTrack} onReplace={handleReplaceTrack} onDelete={handleDeleteTrack} onClose={() => setCellActionIdx(null)} />}
        {editCellIdx !== null && <EditTrackModal cell={cells[editCellIdx]} adminPassword={adminPassword} onSave={handleEditSave} onClose={() => setEditCellIdx(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <div className="flex items-start justify-between">
          <div>
            <motion.h2 className="text-3xl md:text-4xl font-serif text-primary-foreground mb-2"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              Твоя музыка, под рукой.
            </motion.h2>
            <motion.p className="text-primary-foreground/60 text-sm"
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              {isAdmin ? "Режим администратора: нажми на ячейку, чтобы добавить. Зажми — управление." : "Нажми на трек, чтобы включить. Свайп — листать."}
            </motion.p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {/* Radio button */}
            <motion.button
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
                radioMode === "shuffle" ? "bg-yellow-400/30 text-yellow-300" :
                radioMode === "seq" ? "bg-white/25 text-white" :
                "bg-white/10 text-white/50 hover:bg-white/15 hover:text-white/70"
              }`}
              onClick={handleRadioClick} whileTap={{ scale: 0.92 }} data-clickable>
              <Icon name={radioMode === "shuffle" ? "Shuffle" : "Radio"} size={14} />
              <span>{radioMode === "shuffle" ? "Произвол." : radioMode === "seq" ? "Радио" : "Радио"}</span>
            </motion.button>
            {/* Admin button */}
            <motion.button
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${isAdmin ? "bg-white/20 text-white" : "bg-white/10 text-white/50 hover:bg-white/15 hover:text-white/70"}`}
              onClick={() => isAdmin ? setIsAdmin(false) : setShowPasswordModal(true)}
              whileTap={{ scale: 0.95 }} data-clickable>
              <Icon name={isAdmin ? "ShieldCheck" : "Shield"} size={14} />
              <span>{isAdmin ? "Выйти" : "Админ"}</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex justify-center px-6">
        <div className="relative">
          {/* Col up buttons */}
          <div className="flex gap-3 mb-3 justify-center">
            {Array.from({ length: COLS }).map((_, ci) => (
              <button key={ci} style={{ width: "clamp(90px, 18vw, 140px)" }}
                className="flex justify-center items-center py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                onClick={() => shiftCol(ci, -1)} onTouchStart={handleColSwipeStart} onTouchEnd={(e) => handleColSwipeEnd(ci, e)} data-clickable>
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
                  onClick={() => shiftRow(ri, -1)} data-clickable>
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
                  onTouchStart={handleRowSwipeStart} onTouchEnd={(e) => handleRowSwipeEnd(row, e)}
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
                          onClick={() => handleCellClick(flatIdx)} onLongPress={() => handleLongPress(flatIdx)} />
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
                  onClick={() => shiftRow(ri, 1)} data-clickable>
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
                onClick={() => shiftCol(ci, 1)} onTouchStart={handleColSwipeStart} onTouchEnd={(e) => handleColSwipeEnd(ci, e)} data-clickable>
                <Icon name="ChevronDown" size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Now playing panel */}
      <AnimatePresence>
        {playingCell && (
          <NowPlayingPanel cell={playingCell} radioMode={radioMode}
            onClose={() => { audioRef.current?.pause(); setPlayingIdx(null); setRadioMode("off") }} />
        )}
      </AnimatePresence>
    </section>
  )
}
