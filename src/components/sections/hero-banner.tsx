import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"

const SETTINGS_URL = "https://functions.poehali.dev/469c309d-3e62-4876-9bcb-411cdd9b4dc4"
const TRACKS_URL = "https://functions.poehali.dev/36cc0561-b248-4cd8-b195-d1d5ef5c5a83"

interface SiteSettings {
  hero_gif_url: string
  hero_banner_url: string
  hero_title: string
  hero_subtitle: string
}

// ─── Password prompt ──────────────────────────────────────────────────────────
function PasswordPrompt({ onSuccess, onClose }: { onSuccess: (p: string) => void; onClose: () => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { setTimeout(() => ref.current?.focus(), 100) }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(false)
    try {
      const r = await fetch(`${TRACKS_URL}/verify-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }),
      })
      const d = await r.json()
      if (d.ok) onSuccess(password); else { setError(true); setPassword("") }
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
            <h3 className="font-serif text-lg text-foreground">Редактирование баннера</h3>
            <p className="text-muted-foreground text-xs">Введи пароль администратора</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <input ref={ref} type="password" value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }} placeholder="Пароль"
              className={`w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${error ? "ring-2 ring-destructive" : "focus:ring-primary"}`} />
            {error && <motion.p className="text-destructive text-xs mt-2 ml-1" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>Неверный пароль</motion.p>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-sm">Отмена</button>
            <button type="submit" disabled={loading || !password} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm disabled:opacity-50" data-clickable>
              {loading ? "..." : "Войти"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Admin upload panel ───────────────────────────────────────────────────────
function HeroBannerAdmin({ settings, adminPassword, onSaved, onClose }: {
  settings: SiteSettings
  adminPassword: string
  onSaved: (s: Partial<SiteSettings>) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(settings.hero_title)
  const [subtitle, setSubtitle] = useState(settings.hero_subtitle)
  const [gifPreview, setGifPreview] = useState(settings.hero_gif_url)
  const [bannerPreview, setBannerPreview] = useState(settings.hero_banner_url)
  const [gifFile, setGifFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const gifRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File, setFile: (f: File) => void, setPreview: (s: string) => void) => {
    setFile(file)
    const r = new FileReader()
    r.onload = (e) => setPreview(e.target?.result as string)
    r.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    const toB64 = (f: File) => new Promise<string>((res) => {
      const r = new FileReader()
      r.onload = (e) => res((e.target?.result as string).split(",")[1])
      r.readAsDataURL(f)
    })
    try {
      const body: Record<string, string> = { hero_title: title, hero_subtitle: subtitle }
      if (gifFile) { body.gif_data = await toB64(gifFile); body.gif_name = gifFile.name }
      if (bannerFile) { body.banner_data = await toB64(bannerFile); body.banner_name = bannerFile.name }
      const res = await fetch(SETTINGS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": adminPassword },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      onSaved({
        hero_title: title,
        hero_subtitle: subtitle,
        ...(data.hero_gif_url ? { hero_gif_url: data.hero_gif_url } : {}),
        ...(data.hero_banner_url ? { hero_banner_url: data.hero_banner_url } : {}),
      })
    } finally { setSaving(false) }
  }

  return (
    <motion.div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="bg-background rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-lg text-foreground">Редактировать баннер</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" data-clickable>
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="space-y-4">
          {/* GIF upload */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">GIF / фото слева (формат 9:16)</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-[86px] rounded-xl overflow-hidden flex-shrink-0 bg-secondary flex items-center justify-center">
                {gifPreview
                  ? <img src={gifPreview} alt="gif" className="w-full h-full object-cover" />
                  : <Icon name="Image" size={18} className="text-muted-foreground" />}
              </div>
              <button type="button" onClick={() => gifRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm text-foreground transition-colors" data-clickable>
                <Icon name="Upload" size={14} className="text-primary" />
                {gifPreview ? "Заменить" : "Загрузить GIF"}
              </button>
              <input ref={gifRef} type="file" accept="image/gif,image/png,image/jpeg,image/webp,video/mp4,video/webm" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, setGifFile, setGifPreview); e.target.value = "" }} />
            </div>
          </div>

          {/* Banner bg upload */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Фоновое фото баннера справа</p>
            <div className="flex items-center gap-3">
              <div className="w-20 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-secondary flex items-center justify-center">
                {bannerPreview
                  ? <img src={bannerPreview} alt="banner" className="w-full h-full object-cover" />
                  : <Icon name="Image" size={18} className="text-muted-foreground" />}
              </div>
              <button type="button" onClick={() => bannerRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm text-foreground transition-colors" data-clickable>
                <Icon name="Upload" size={14} className="text-primary" />
                {bannerPreview ? "Заменить" : "Загрузить фото"}
              </button>
              <input ref={bannerRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, setBannerFile, setBannerPreview); e.target.value = "" }} />
            </div>
          </div>

          {/* Text */}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заголовок"
            className="w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Подпись / слоган"
            className="w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full mt-5 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm disabled:opacity-50" data-clickable>
          {saving ? "Сохраняю..." : "Сохранить"}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Hero Banner (public component, self-contained) ───────────────────────────
export function HeroBanner() {
  const [settings, setSettings] = useState<SiteSettings>({
    hero_gif_url: "", hero_banner_url: "", hero_title: "", hero_subtitle: "",
  })
  const [showEditor, setShowEditor] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(SETTINGS_URL)
      .then(r => r.json())
      .then(d => { setSettings(d); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  const handleSaved = (updates: Partial<SiteSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
    setShowEditor(false)
  }

  const handleEditClick = () => {
    if (isAdmin) setShowEditor(true)
    else setShowPasswordPrompt(true)
  }

  if (!loaded) return null

  const isEmpty = !settings.hero_gif_url && !settings.hero_banner_url && !settings.hero_title

  // Don't render at all for visitors if no content
  if (isEmpty && !isAdmin) return null

  return (
    <>
      <AnimatePresence>
        {showPasswordPrompt && (
          <PasswordPrompt
            onSuccess={(pwd) => { setIsAdmin(true); setAdminPassword(pwd); setShowPasswordPrompt(false); setShowEditor(true) }}
            onClose={() => setShowPasswordPrompt(false)}
          />
        )}
      </AnimatePresence>

      <section className="relative w-full overflow-hidden bg-black">
        {/* Pencil button — bottom-right corner, subtle */}
        <button
          className="absolute bottom-3 right-3 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/40 hover:text-white transition-colors backdrop-blur-sm"
          onClick={handleEditClick} data-clickable title="Редактировать баннер">
          <Icon name={isAdmin ? "PencilLine" : "Pencil"} size={14} />
        </button>

        <div className="flex w-full">
          {/* LEFT — GIF 9:16 */}
          <div
            className="relative flex-shrink-0 bg-zinc-950"
            style={{ width: "clamp(100px, 28vw, 320px)" }}>
            {settings.hero_gif_url ? (
              <img
                src={settings.hero_gif_url}
                alt="hero"
                className="w-full object-cover block"
                style={{ aspectRatio: "9/16" }}
              />
            ) : (
              <div className="w-full flex flex-col items-center justify-center gap-2 opacity-20 p-4"
                style={{ aspectRatio: "9/16" }}>
                <Icon name="Image" size={28} className="text-white" />
                <p className="text-white text-xs text-center">9:16</p>
              </div>
            )}
          </div>

          {/* RIGHT — Static banner */}
          <div className="relative flex-1 overflow-hidden"
            style={{ minHeight: "clamp(200px, calc(28vw * 16/9), calc(320px * 16/9))" }}>
            {/* Background */}
            {settings.hero_banner_url ? (
              <img src={settings.hero_banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-800" />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

            {/* Text */}
            <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-10 lg:p-14">
              {settings.hero_title && (
                <motion.h1
                  className="text-white font-serif text-2xl md:text-4xl lg:text-5xl xl:text-6xl leading-tight mb-2 md:mb-3"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  {settings.hero_title}
                </motion.h1>
              )}
              {settings.hero_subtitle && (
                <motion.p
                  className="text-white/70 text-sm md:text-base max-w-sm"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  {settings.hero_subtitle}
                </motion.p>
              )}
              {isEmpty && isAdmin && (
                <p className="text-white/30 text-sm">Нажми карандаш, чтобы добавить контент</p>
              )}
            </div>
          </div>
        </div>

        {/* Editor overlay */}
        <AnimatePresence>
          {showEditor && (
            <HeroBannerAdmin
              settings={settings}
              adminPassword={adminPassword}
              onSaved={handleSaved}
              onClose={() => setShowEditor(false)}
            />
          )}
        </AnimatePresence>
      </section>
    </>
  )
}
