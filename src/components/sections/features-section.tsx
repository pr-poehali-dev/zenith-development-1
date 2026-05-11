import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Icon from "@/components/ui/icon"

function WaveVisualizer() {
  const [bars, setBars] = useState(Array.from({ length: 8 }, () => Math.random()))

  useEffect(() => {
    const interval = setInterval(() => {
      setBars(Array.from({ length: 8 }, () => 0.2 + Math.random() * 0.8))
    }, 300)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-end justify-center gap-1 h-full pb-2">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-3 rounded-full bg-primary"
          animate={{ height: `${h * 80}px` }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}

function CoverGrid() {
  const colors = [
    "from-purple-900 to-indigo-900",
    "from-red-900 to-pink-900",
    "from-amber-900 to-orange-900",
    "from-green-900 to-teal-900",
  ]
  const emojis = ["🌃", "🔴", "🌅", "🖤"]

  return (
    <div className="grid grid-cols-2 gap-2 h-full p-2">
      {colors.map((color, i) => (
        <motion.div
          key={i}
          className={`rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl`}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          {emojis[i]}
        </motion.div>
      ))}
    </div>
  )
}

function VideoCard() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 2))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="w-full max-w-[140px] aspect-video bg-foreground/10 rounded-lg flex items-center justify-center">
        <Icon name="Play" size={28} className="text-primary" />
      </div>
      <div className="w-full max-w-[140px] h-1.5 bg-foreground/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <section className="bg-background px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <motion.p
          className="text-muted-foreground text-sm uppercase tracking-widest mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Возможности
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Music Card */}
          <motion.div
            className="bg-secondary rounded-xl p-8 min-h-[280px] flex flex-col"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.2 }}
            data-clickable
          >
            <div className="flex-1">
              <WaveVisualizer />
            </div>
            <div className="mt-4">
              <h3 className="font-serif text-xl text-foreground">Музыка</h3>
              <p className="text-muted-foreground text-sm mt-1">Аудио треки с обложками — включай одним касанием.</p>
            </div>
          </motion.div>

          {/* Gallery Card */}
          <motion.div
            className="bg-secondary rounded-xl p-8 min-h-[280px] flex flex-col"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.96 }}
            data-clickable
          >
            <div className="flex-1">
              <CoverGrid />
            </div>
            <div className="mt-4">
              <h3 className="font-serif text-xl text-foreground">Обложки</h3>
              <p className="text-muted-foreground text-sm mt-1">Красивая сетка-кубик с обложками альбомов.</p>
            </div>
          </motion.div>

          {/* Video Card */}
          <motion.div
            className="bg-secondary rounded-xl p-8 min-h-[280px] flex flex-col"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.96 }}
            data-clickable
          >
            <div className="flex-1">
              <VideoCard />
            </div>
            <div className="mt-4">
              <h3 className="font-serif text-xl text-foreground">Видео</h3>
              <p className="text-muted-foreground text-sm mt-1">Видеоклипы и концерты — в том же интерфейсе.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
