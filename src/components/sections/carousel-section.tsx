import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"
import { TRACKS_URL, COLS, ROWS, TOTAL, COLORS, EMOJIS, CellTrack, makeEmpty } from "./carousel-types"
import { PasswordModal, UploadFormModal, EditTrackModal, CellActionModal } from "./carousel-modals"
import { CarouselGrid } from "./carousel-grid"
import { NowPlayingPanel } from "./carousel-player"

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
        setPlayingIdx(flatIdx)
      }
    }
    setPlayingIdx(flatIdx)
   
  }, [cells, radioMode])

  // ── Radio: single click = seq, double = shuffle ─────────────────────────────
  const handleRadioClick = () => {
    radioClickCount.current += 1
    if (radioClickTimer.current) clearTimeout(radioClickTimer.current)
    radioClickTimer.current = setTimeout(() => {
      const clicks = radioClickCount.current
      radioClickCount.current = 0
      if (clicks >= 2) {
        setRadioMode(prev => prev === "shuffle" ? "off" : "shuffle")
      } else {
        setRadioMode(prev => (prev === "off" || prev === "shuffle") ? "seq" : "off")
      }
    }, 280)
  }

  useEffect(() => {
    if (radioMode !== "off" && playingIdx === null) {
      const nonEmpty = cells.map((c, i) => ({ c, i })).filter(x => !x.c.isEmpty && x.c.file_url)
      if (!nonEmpty.length) return
      const pick = radioMode === "shuffle" ? nonEmpty[Math.floor(Math.random() * nonEmpty.length)] : nonEmpty[0]
      playTrack(pick.i)
    }
    if (radioMode === "off") { audioRef.current?.pause(); setPlayingIdx(null) }
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

  // ── Cell interactions ───────────────────────────────────────────────────────
  const handleCellClick = (flatIdx: number) => {
    const cell = cells[flatIdx]
    if (cell.isEmpty) { if (isAdmin) triggerFileSelect(flatIdx); return }
    if (!cell.file_url) return
    if (playingIdx === flatIdx) { audioRef.current?.pause(); setPlayingIdx(null) }
    else playTrack(flatIdx)
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
      <CarouselGrid
        cells={cells}
        playingIdx={playingIdx}
        uploadingIdx={uploadingIdx}
        highlightIdx={highlightIdx}
        spinningRow={spinningRow}
        showSwipeHint={showSwipeHint}
        isAdmin={isAdmin}
        rowOffsets={rowOffsets}
        colOffsets={colOffsets}
        onCellClick={handleCellClick}
        onLongPress={handleLongPress}
        onShiftRow={shiftRow}
        onShiftCol={shiftCol}
        onRowSwipeStart={handleRowSwipeStart}
        onRowSwipeEnd={handleRowSwipeEnd}
        onColSwipeStart={handleColSwipeStart}
        onColSwipeEnd={handleColSwipeEnd}
      />

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
