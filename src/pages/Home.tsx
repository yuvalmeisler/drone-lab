import { useEffect, useRef, type CSSProperties } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import Amir from '../components/Amir'
import { useAmir, Words } from '../components/AmirGuide'
import { IconCheck, IconLayers, IconPlay, IconShield } from '../components/Icons'
import { Page, Reveal, ease, rise, stagger } from '../components/Motion'
import { drones } from '../data/drones'

export default function Home() {
  const { say, setHidden } = useAmir()
  const { hash } = useLocation()
  const heroRef = useRef<HTMLDivElement>(null)
  const heroAmirInView = useInView(heroRef, { margin: '-30% 0px -30% 0px' })

  const { scrollY } = useScroll()
  const photoY = useTransform(scrollY, [0, 600], [0, 60])

  // כשאמיר הגדול בהירו גלוי — אמיר הצף מתחבא, וכשגוללים הוא קופץ פנימה
  useEffect(() => {
    setHidden(heroAmirInView)
    return () => setHidden(false)
  }, [heroAmirInView, setHidden])

  useEffect(() => {
    say('בחרו רחפן מהרשימה — ואני אראה לכם את כל הפירוקים שלו.', 'point')
  }, [say])

  useEffect(() => {
    if (!hash) return
    const t = setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450)
    return () => clearTimeout(t)
  }, [hash])

  return (
    <Page>
      <section className="hero container">
        <motion.div className="hero-copy" variants={stagger} initial="hidden" animate="show">
          <motion.h1 variants={rise}>
            לפרק. להרכיב.
            <br />
            <span className="grad">להכיר כל בורג.</span>
          </motion.h1>
          <motion.p variants={rise} className="lead">
            סרטוני הדרכה קצרים וברורים לפירוק והרכבה של רכיבי הרחפנים ביחידה — צעד אחר צעד, עם אמיר לצדכם.
          </motion.p>
          <motion.div variants={rise} className="hero-actions">
            <a href="#drones" className="btn btn-primary" onClick={(e) => { e.preventDefault(); document.querySelector('#drones')?.scrollIntoView({ behavior: 'smooth' }) }}>
              בחרו רחפן
            </a>
            <a href="#how" className="btn btn-ghost" onClick={(e) => { e.preventDefault(); document.querySelector('#how')?.scrollIntoView({ behavior: 'smooth' }) }}>
              איך זה עובד
            </a>
          </motion.div>
        </motion.div>

        <div className="hero-visual" ref={heroRef}>
          <motion.div
            className="hero-blob"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease }}
          />
          <motion.div
            className="hero-photo"
            style={{ y: photoY }}
            initial={{ clipPath: 'inset(12% 12% 12% 12% round 40px)', opacity: 0 }}
            animate={{ clipPath: 'inset(0% 0% 0% 0% round 32px)', opacity: 1 }}
            transition={{ duration: 1.1, ease, delay: 0.15 }}
          >
            <img src="/photos/hero-repair.jpg" alt="טכנאי מפרק רחפן Mavic עם מברג על שולחן עבודה" />
          </motion.div>

          <motion.div className="float-chip chip-a" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7, duration: 0.6, ease }}>
            <span className="chip-icon green"><IconCheck size={16} /></span>
            <div><b>החלפת מדחפים</b><small>הושלם · 5 דק׳</small></div>
          </motion.div>
          <motion.div className="float-chip chip-b" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9, duration: 0.6, ease }}>
            <span className="chip-icon blue"><IconPlay size={14} /></span>
            <div><b>סרטון לכל פירוק</b><small>לכל רחפן בנפרד</small></div>
          </motion.div>

          <motion.div
            className="hero-amir"
            initial={{ opacity: 0, y: 60, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 180, damping: 14 }}
          >
            <div className="hero-amir-bubble">
              <b>היי, אני אמיר!</b>
              <Words className="" text="המדריך הדיגיטלי שלכם. בואו נפרק משהו." />
            </div>
            <Amir mood="wave" size={150} />
          </motion.div>
        </div>
      </section>

      <section id="how" className="section container">
        <Reveal className="section-head">
          <span className="eyebrow">פשוט וברור</span>
          <h2>איך זה עובד</h2>
        </Reveal>
        <div className="how-grid">
          {[
            { icon: <IconLayers size={22} />, color: 'blue', title: 'בוחרים רחפן', text: 'EVO, AVATA, ALPHA, MATRICE 350 או MAVIC 3 — כל אחד עם הפירוקים שלו.' },
            { icon: <IconPlay size={20} />, color: 'pink', title: 'צופים בסרטון', text: 'סרטון קצר לכל פירוק, מצולם מקרוב, עם כל הכלים הנדרשים.' },
            { icon: <IconShield size={22} />, color: 'green', title: 'מבצעים ומסמנים', text: 'עוברים על הצעדים, מסמנים ✓ ואמיר עוקב אחרי ההתקדמות שלכם.' },
          ].map((s, i) => (
            <Reveal key={s.title} delay={i * 0.12} className="how-card">
              <span className={`how-icon ${s.color}`}>{s.icon}</span>
              <span className="how-num">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="drones" className="section container">
        <Reveal className="section-head">
          <span className="eyebrow">שלב 1</span>
          <h2>בחרו רחפן</h2>
          <p>לכל רחפן יש את הפירוקים שלו. לחצו על רחפן כדי לראות אותם.</p>
        </Reveal>

        <motion.div
          className="drone-grid"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {drones.map((d) => (
            <motion.div key={d.id} variants={rise} whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
              <Link
                to={`/drone/${d.id}`}
                className="drone-card"
                style={{ '--accent': d.accent, '--accent-soft': d.accentSoft } as CSSProperties}
              >
                <div className="drone-card-img">
                  <img src={d.photo} alt={d.name} loading="lazy" />
                </div>
                <div className="drone-card-body">
                  <h3>{d.name}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <Reveal className="cta-band">
          <img src="/photos/workshop-2.jpg" alt="" aria-hidden />
          <div className="cta-band-copy">
            <h3>מוכנים להתחיל?</h3>
            <p>הפירוק הראשון הכי קל: התקנת מדחפים. 5 דקות וזה מאחוריכם.</p>
            <Link to="/drone/mavic-3/props" className="btn btn-light">להתחיל עכשיו</Link>
          </div>
          <div className="cta-band-amir"><Amir mood="cheer" size={130} /></div>
        </Reveal>
      </section>
    </Page>
  )
}
