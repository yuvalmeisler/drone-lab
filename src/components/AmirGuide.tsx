import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Amir, { type Mood } from './Amir'

interface Line {
  text: string
  mood?: Mood
}

interface GuideApi {
  say: (text: string, mood?: Mood) => void
  setHidden: (hidden: boolean) => void
}

const GuideContext = createContext<GuideApi>({ say: () => {}, setHidden: () => {} })

const TIPS: Line[] = [
  { text: 'לפני כל פירוק — סוללה בחוץ. תמיד.', mood: 'point' },
  { text: 'לא נכנס? לא מפעילים כוח. עוצרים ובודקים שוב.', mood: 'think' },
  { text: 'צלמו בטלפון לפני שמנתקים כבל — ותדעו בדיוק איך הוא חוזר.', mood: 'point' },
  { text: 'עבודה על משטח בהיר ומואר = פחות ברגים אבודים.', mood: 'happy' },
]

export function useAmir() {
  return useContext(GuideContext)
}

/** אמיר צף בפינת המסך בכל האתר ומגיב למה שקורה בדף. */
export function AmirProvider({ children }: { children: ReactNode }) {
  const [line, setLine] = useState<Line>({ text: 'היי, אני אמיר! אני אלווה אתכם לאורך כל הסדנה.', mood: 'wave' })
  const [open, setOpen] = useState(true)
  const [hidden, setHidden] = useState(false)
  const [tip, setTip] = useState(0)
  const [talking, setTalking] = useState(false)

  // הפה של אמיר זז בזמן שהמילים נכנסות לבועה
  useEffect(() => {
    if (!open || hidden) return setTalking(false)
    setTalking(true)
    const t = setTimeout(() => setTalking(false), 350 + line.text.split(" ").length * 45 + 300)
    return () => clearTimeout(t)
  }, [line, open, hidden])

  const say = useCallback((text: string, mood: Mood = 'happy') => {
    setLine({ text, mood })
    setOpen(true)
  }, [])

  // אחרי כמה שניות הבועה מתכווצת, ואמיר נשאר לחכות
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => setOpen(false), 9000)
    return () => clearTimeout(t)
  }, [open, line])

  // כשאמיר קופץ חזרה למסך — הוא מדבר שוב
  useEffect(() => {
    if (!hidden) setOpen(true)
  }, [hidden])

  const nextTip = () => {
    if (!open) return setOpen(true)
    setLine(TIPS[tip % TIPS.length])
    setTip((n) => n + 1)
  }

  const api = useMemo(() => ({ say, setHidden }), [say])

  return (
    <GuideContext.Provider value={api}>
      {children}
      <AnimatePresence>
        {!hidden && (
          <motion.div
            className="guide"
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <AnimatePresence mode="wait">
              {open && (
                <motion.div
                  key={line.text}
                  className="guide-bubble"
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                >
                  <button className="guide-close" onClick={() => setOpen(false)} aria-label="סגירה">×</button>
                  <span className="guide-name">אמיר · המדריך שלך</span>
                  <Words text={line.text} />
                  <button className="guide-more" onClick={nextTip}>עוד טיפ</button>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              className="guide-avatar"
              onClick={nextTip}
              whileHover={{ scale: 1.06, rotate: -3 }}
              whileTap={{ scale: 0.94 }}
              aria-label="טיפ מאמיר"
            >
              <Amir mood={open ? line.mood : 'happy'} talking={talking} size={96} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </GuideContext.Provider>
  )
}

/** טקסט שנכנס מילה אחרי מילה */
export function Words({ text, className = 'guide-text' }: { text: string; className?: string }) {
  return (
    <p className={className}>
      {/* שם לועזי מבודד (iso) נשאר יחידה אחת כדי שהכיוון לא יתהפך */}
      {(text.match(/[^\s⁨]*⁨[^⁩]*⁩\S*|\S+/g) ?? []).map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.15 + i * 0.045, duration: 0.3 }}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {w}{' '}
        </motion.span>
      ))}
    </p>
  )
}
