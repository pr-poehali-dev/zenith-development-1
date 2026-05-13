import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import Icon from "@/components/ui/icon"
import { TRACKS_URL, CellTrack } from "./carousel-types"

// ─── Password modal ───────────────────────────────────────────────────────────
export function PasswordModal({ onSuccess, onClose }: { onSuccess: (p: string) => void; onClose: () => void }) {
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
export function CoverPicker({ preview, onFile }: { preview: string; onFile: (file: File) => void }) {
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
export function UploadFormModal({ fileName, onConfirm, onClose }: {
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
export function EditTrackModal({ cell, adminPassword, onSave, onClose }: {
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
export function CellActionModal({ cell, onEdit, onReplace, onDelete, onClose }: {
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
