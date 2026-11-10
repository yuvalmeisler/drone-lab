import { useEffect } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AmirProvider } from './components/AmirGuide'
import Home from './pages/Home'
import DronePage from './pages/DronePage'
import TaskPage from './pages/TaskPage'
import Credits from './pages/Credits'

function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          <motion.img
            src="/logo-bahad20.png"
            alt="בה״ד 20"
            className="logo-img"
            initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          />
          <span className="logo-text">
            <b>סדנת הרחפנים</b>
            <small>פירוק והרכבה</small>
          </span>
        </Link>
        <nav className="nav">
          <Link to="/#drones">רחפנים</Link>
          <Link to="/#how">איך זה עובד</Link>
        </nav>
      </div>
    </header>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname, location.hash])

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/drone/:droneId" element={<DronePage />} />
        <Route path="/drone/:droneId/:taskId" element={<TaskPage />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AmirProvider>
        <Header />
        <AnimatedRoutes />
        <footer className="footer">
          <div className="container footer-inner">
            <span>סדנת הרחפנים · חומר לימוד פנימי. בכל מקרה של ספק — עובדים לפי הוראות היצרן.</span>
          </div>
        </footer>
      </AmirProvider>
    </BrowserRouter>
  )
}
