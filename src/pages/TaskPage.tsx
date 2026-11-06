import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Amir from '../components/Amir'
import { useAmir } from '../components/AmirGuide'
import { IconBolt, IconCheck, IconClock, IconPlay, IconTool } from '../components/Icons'
import { Page, ease, rise, stagger } from '../components/Motion'
import { formatTime, getDrone, iso, taskKey, videoList, type VideoQuiz } from '../data/drones'
import { toggleDone, useProgress } from '../lib/progress'

function QuizVideo({ src, poster, quizzes }: { src: string; poster: string; quizzes: VideoQuiz[] }) {
  const ref = useRef<HTMLVideoElement>(null)
  const done = useRef(new Set<number>())
  const [active, setActive] = useState<number | null>(null)
  const [picked, setPicked] = useState<number | null>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    let raf = 0
    const check = () => {
      const i = quizzes.findIndex((q, k) => !done.current.has(k) && v.currentTime >= q.at)
      if (i >= 0) {
        done.current.add(i)
        v.pause()
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
        v.currentTime = quizzes[i].at
        setPicked(null)
        setActive(i)
        return
      }
      if (!v.paused && !v.ended) raf = requestAnimationFrame(check)
    }
    const onPlay = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(check)
    }
    // חזרה אחורה לפני השאלה — השאלה תקפוץ שוב
    const onSeeked = () => quizzes.forEach((q, k) => v.currentTime < q.at && done.current.delete(k))
    v.addEventListener('play', onPlay)
    v.addEventListener('seeked', onSeeked)
    return () => {
      cancelAnimationFrame(raf)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('seeked', onSeeked)
    }
  }, [quizzes])

  useEffect(() => {
    if (picked === null) return
    const t = setTimeout(() => {
      setActive(null)
      setPicked(null)
      ref.current?.play().catch(() => {})
    }, 2200)
    return () => clearTimeout(t)
  }, [picked])

  const q = active !== null ? quizzes[active] : null
  const correct = q && picked === q.answer

  return (
    <div className="quiz-video">
      <video ref={ref} className="video-frame" src={src} poster={poster} controls={!q} playsInline />
      <AnimatePresence>
        {q && (
          <motion.div className="quiz-overlay" dir="rtl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="quiz-card" initial={{ y: 16, scale: 0.96 }} animate={{ y: 0, scale: 1 }} transition={{ duration: 0.35, ease }}>
              <span className="quiz-tag">שאלה</span>
              <h3>{q.question}</h3>
              <div className="quiz-options">
                {q.options.map((o, i) => {
                  const state = picked === null ? '' : i === q.answer ? 'right' : i === picked ? 'wrong' : 'dim'
                  return (
                    <button key={o} className={state} disabled={picked !== null} onClick={() => setPicked(i)}>
                      <b>{i + 1}</b> {o}
                    </button>
                  )
                })}
              </div>
              {picked !== null && (
                <motion.p className={`quiz-result ${correct ? 'right' : 'wrong'}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  {correct ? 'כל הכבוד! 👏' : <>טעות. התשובה הנכונה: <b>{q.options[q.answer]}</b></>}
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Video({ src, poster, quizzes }: { src?: string; poster: string; quizzes?: VideoQuiz[] }) {
  if (src && /youtu\.?be/.test(src)) {
    const id = src.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1]
    return <iframe className="video-frame" src={`https://www.youtube.com/embed/${id}?rel=0`} title="סרטון הדרכה" allowFullScreen />
  }
  if (src && quizzes?.length) return <QuizVideo src={src} poster={poster} quizzes={quizzes} />
  if (src) return <video className="video-frame" src={src} poster={poster} controls playsInline />
  return (
    <div className="video-placeholder">
      <img src={poster} alt="" aria-hidden />
      <div className="video-placeholder-inner">
        <motion.span className="play" animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.2 }}>
          <IconPlay size={30} />
        </motion.span>
        <b>הסרטון בעריכה</b>
        <span>יעלה לכאן בקרוב. בינתיים — עברו על שלבי העבודה למטה.</span>
      </div>
    </div>
  )
}

const COLORS = ['#2F6BFF', '#FFC23C', '#FF6B8A', '#22C55E', '#7C5CFF']

function Confetti() {
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 36 }, (_, i) => {
        const angle = (i / 36) * Math.PI * 2
        const dist = 120 + Math.random() * 160
        return (
          <motion.i
            key={i}
            style={{ background: COLORS[i % COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 80, opacity: 0, rotate: Math.random() * 540, scale: 0.6 }}
            transition={{ duration: 1.4 + Math.random() * 0.6, ease: [0.15, 0.8, 0.3, 1] }}
          />
        )
      })}
    </div>
  )
}

export default function TaskPage() {
  const { droneId, taskId } = useParams()
  const drone = getDrone(droneId)
  const index = drone?.tasks.findIndex((t) => t.id === taskId) ?? -1
  const task = drone?.tasks[index]
  const done = useProgress()
  const { say } = useAmir()
  const [checked, setChecked] = useState<number[]>([])
  const [party, setParty] = useState(0)
  const [clip, setClip] = useState(0)
  const videos = videoList(task?.video)

  useEffect(() => {
    if (!task) return
    setChecked([])
    setClip(0)
    say(task.tip ?? `ב"${task.title}" יש ${task.steps.length} שלבים. צפו בסרטון ואז בצעו אחד-אחד.`, task.tip ? 'point' : 'happy')
  }, [task, say])

  const stepCount = task?.steps.length ?? 0
  const alreadyDone = !!drone && !!task && done.includes(taskKey(drone.id, task.id))
  useEffect(() => {
    if (stepCount && checked.length === stepCount && !alreadyDone) say('כל השלבים מסומנים! לחצו על "סיימתי" כדי לשמור.', 'point')
  }, [checked.length, stepCount, alreadyDone, say])

  if (!drone || !task) return <Navigate to={drone ? `/drone/${drone.id}` : '/'} replace />

  const key = taskKey(drone.id, task.id)
  const isDone = done.includes(key)
  const prev = drone.tasks[index - 1]
  const next = drone.tasks[index + 1]
  const allChecked = checked.length === task.steps.length

  const toggleStep = (i: number) => {
    setChecked((prev) => (prev.includes(i) ? prev.filter((n) => n !== i) : [...prev, i]))
  }

  const complete = () => {
    if (isDone) {
      toggleDone(key, false)
      return
    }
    toggleDone(key, true)
    setParty((n) => n + 1)
    say(next ? `כל הכבוד! ${task.title} — בוצע. הבא בתור: ${next.title}.` : `סיימתם את כל הפירוקים של ${iso(drone.name)}! 🏆`, 'cheer')
  }

  return (
    <Page>
      <div className="container" style={{ '--accent': drone.accent, '--accent-soft': drone.accentSoft } as CSSProperties}>
        <div className="crumbs">
          <Link to="/#drones">רחפנים</Link>
          <span>/</span>
          <Link to={`/drone/${drone.id}`}>{drone.name}</Link>
          <span>/</span>
          <b>{task.title}</b>
        </div>

        <div className="task-head">
          <div>
            <h1>{task.title}</h1>
            <p className="lead">{task.summary}</p>
          </div>
          <div className="task-chips">
            <span className={`level level-${task.difficulty}`}><IconBolt size={14} /> {task.difficulty}</span>
            <span className="meta"><IconClock size={15} /> {formatTime(task.minutes)}</span>
          </div>
        </div>

        <div className="task-grid">
          <div className="task-main">
            <motion.div className="video-card" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease }}>
              <Video key={videos[clip] ?? 'none'} src={videos[clip]} poster="/photos/hero-repair.jpg" quizzes={clip === 0 ? task.quizzes : undefined} />
            </motion.div>
            {videos.length > 1 && (
              <div className="video-tabs" role="tablist">
                {videos.map((v, i) => (
                  <button key={v} role="tab" aria-selected={i === clip} className={i === clip ? 'active' : ''} onClick={() => setClip(i)}>
                    <IconPlay size={11} /> חלק {i + 1}
                  </button>
                ))}
              </div>
            )}

            <div className="card steps-card">
              <div className="steps-head">
                <h2>שלבי העבודה</h2>
                <span className="muted">{checked.length}/{task.steps.length}</span>
              </div>
              <div className="bar"><motion.i initial={false} animate={{ width: `${(checked.length / task.steps.length) * 100}%` }} transition={{ type: 'spring', stiffness: 140, damping: 20 }} /></div>
              <motion.ol className="steps" variants={stagger} initial="hidden" animate="show">
                {task.steps.map((s, i) => {
                  const on = checked.includes(i)
                  return (
                    <motion.li key={i} variants={rise}>
                      <button className={`step ${on ? 'on' : ''}`} onClick={() => toggleStep(i)}>
                        <motion.span className="step-box" animate={on ? { scale: [1, 1.25, 1] } : {}} transition={{ duration: 0.3 }}>
                          {on ? <IconCheck size={14} /> : i + 1}
                        </motion.span>
                        <span>{s}</span>
                      </button>
                    </motion.li>
                  )
                })}
              </motion.ol>

              <div className="complete-wrap">
                <motion.button
                  className={`btn ${isDone ? 'btn-done' : allChecked ? 'btn-primary pulse' : 'btn-primary'}`}
                  onClick={complete}
                  whileTap={{ scale: 0.95 }}
                >
                  {isDone ? <><IconCheck size={18} /> הושלם · לחצו לביטול</> : 'סיימתי את הפירוק'}
                </motion.button>
                <AnimatePresence>{party > 0 && <Confetti key={party} />}</AnimatePresence>
              </div>
            </div>
          </div>

          <aside className="task-side">
            <div className="card">
              <h3 className="side-title"><IconTool size={18} /> כלים נדרשים</h3>
              {task.tools.length ? (
                <ul className="tools">{task.tools.map((t) => <li key={t}>{t}</li>)}</ul>
              ) : (
                <p className="muted">לא צריך כלים — רק ידיים נקיות.</p>
              )}
            </div>
            <div className="card safety">
              <h3 className="side-title">⚠️ לפני שמתחילים</h3>
              <ul className="tools">
                <li>רחפן כבוי, סוללה בחוץ</li>
                <li>משטח עבודה נקי ומואר</li>
                <li>קופסה לברגים</li>
              </ul>
            </div>
            {task.tip && (
              <div className="card amir-tip">
                <Amir mood="point" size={64} />
                <div>
                  <b>הטיפ של אמיר</b>
                  <p>{task.tip}</p>
                </div>
              </div>
            )}
          </aside>
        </div>

        <nav className="task-nav">
          {prev ? (
            <Link to={`/drone/${drone.id}/${prev.id}`} className="task-nav-link">
              <span><small>הקודם</small>{prev.title}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link to={`/drone/${drone.id}/${next.id}`} className="task-nav-link end">
              <span><small>הבא</small>{next.title}</span>
            </Link>
          ) : (
            <Link to={`/drone/${drone.id}`} className="task-nav-link end">
              <span><small>סיום</small>חזרה ל-{drone.name}</span>
            </Link>
          )}
        </nav>
      </div>
    </Page>
  )
}
