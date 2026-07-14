// src/components/Header.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const categories = [
  { key: 'shopping-trolley', label: 'Shopping Trolley' },
  { key: 'utility-trolley', label: 'Utility Trolley' },
  { key: 'camping-wagon', label: 'Camping Wagon' },
  { key: 'outdoor-furniture', label: 'Outdoor Furniture' },
]

export default function Header() {
  const navigate = useNavigate()

  // Desktop dropdown
  const [desktopProductsOpen, setDesktopProductsOpen] = useState(false)

  // Mobile menu state
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false)

  // Mobile animation state (no more renderMobile state)
  // closing=true means: we are playing closing animation but DOM still mounted
  const [closing, setClosing] = useState(false)

  const ANIM_MS = 480

  // === Detect input type (hover vs touch-like) ===
  const _isTouchLike = useMemo(() => {
    if (typeof window === 'undefined') return false
    const mm = (q) => window.matchMedia && window.matchMedia(q).matches
    const coarse = mm('(pointer: coarse)')
    const noHover = mm('(hover: none)')
    const touchPoints =
      typeof navigator !== 'undefined' && (navigator.maxTouchPoints || 0) > 0
    return coarse || noHover || touchPoints
  }, [])


  // ===== Derived mount flag (IMPORTANT) =====
  // Keep mounted while open OR during closing animation
  const renderMobile = mobileOpen || closing

  // ===== Manage closing animation lifecycle =====
  const closeTimerRef = useRef(null)

  useEffect(() => {
    // when opening: ensure closing=false
    if (mobileOpen) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      setClosing(false)
      return
    }

    // when mobileOpen turns false: if not mounted, do nothing
    // if it was open and now closes, start closing animation
    if (!mobileOpen && renderMobile) {
      setClosing(true)
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      closeTimerRef.current = setTimeout(() => {
        setClosing(false) // unmount after animation
      }, ANIM_MS + 60)
    }

    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileOpen])

  // `mobileShown` used purely to drive CSS transition state:
  // shown = open AND not closing
  const mobileShown = mobileOpen && !closing

  // ===== Desktop hover close timer =====
  const desktopHoverCloseTimerRef = useRef(null)

  // Close desktop dropdown when clicking outside
  const desktopWrapRef = useRef(null)
  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!desktopProductsOpen) return
      const el = desktopWrapRef.current
      if (!el) return
      if (!el.contains(e.target)) setDesktopProductsOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [desktopProductsOpen])

  // Cleanup desktop hover timer on unmount
  useEffect(() => {
    return () => {
      if (desktopHoverCloseTimerRef.current)
        clearTimeout(desktopHoverCloseTimerRef.current)
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  const itemBase =
    'h-9 px-3 inline-flex items-center rounded-md text-sm font-semibold tracking-wide text-white/80 hover:text-white hover:bg-white/5 transition'
  const itemActive = 'bg-white/10 text-white'

  const closeMobile = () => {
    setMobileOpen(false)
    setMobileProductsOpen(false)
  }

  const goCategory = (key) => {
    navigate(`/products?category=${encodeURIComponent(key)}`)
    closeMobile()
  }

  // iPad/touch: click toggles. Mouse: click toggles too (fine).
  const handleProductsButtonClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDesktopProductsOpen((v) => !v)
  }

  return (
    <header className="relative z-50 bg-neutral-950 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4">
        <NavLink
          to="/"
          className="text-xl font-bold tracking-tight text-white"
          onClick={() => {
            closeMobile()
            setDesktopProductsOpen(false)
          }}
        >
          Juxin
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${itemBase} ${isActive ? itemActive : ''}`
            }
            onClick={() => setDesktopProductsOpen(false)}
          >
            HOME
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `${itemBase} ${isActive ? itemActive : ''}`
            }
            onClick={() => setDesktopProductsOpen(false)}
          >
            ABOUT
          </NavLink>

          {/* PRODUCTS dropdown */}
          <div ref={desktopWrapRef} className="relative">
            <button
              type="button"
              onClick={handleProductsButtonClick}
              className={`${itemBase} ${
                desktopProductsOpen ? itemActive : ''
              }`}
              aria-expanded={desktopProductsOpen}
              aria-haspopup="menu"
            >
              PRODUCTS <span className="ml-1 text-white/60">▾</span>
            </button>

            {desktopProductsOpen && (
              <div
                className="
                  absolute top-full mt-3
                  left-1/2 -translate-x-1/2
                  w-[360px]
                  max-w-[92vw]
                  rounded-2xl border border-white/10
                  bg-neutral-950/40 backdrop-blur-md
                  shadow-2xl
                  overflow-hidden
                "
                role="menu"
              >
                <div className="p-4">
                  <div className="mb-3 text-[11px] font-semibold tracking-[0.28em] text-white/45 uppercase">
                    Products
                  </div>

                  <div className="max-h-[52vh] overflow-auto">
                    <div className="grid gap-2">
                      {categories.map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => {
                            navigate(
                              `/products?category=${encodeURIComponent(
                                c.key,
                              )}`,
                            )
                            setDesktopProductsOpen(false)
                          }}
                          className="
                            group w-full min-w-0
                            rounded-xl border border-white/10
                            bg-white/5 hover:bg-white/10
                            px-3 py-3
                            text-left
                            transition
                          "
                        >
                          <div className="text-sm font-semibold text-white/90 group-hover:text-white break-words leading-5">
                            {c.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `${itemBase} ${isActive ? itemActive : ''}`
            }
            onClick={() => setDesktopProductsOpen(false)}
          >
            CONTACT
          </NavLink>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/5 transition"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <span className="relative h-5 w-6">
            <span
              className={`absolute left-0 top-0 h-[2px] w-6 bg-white/90 rounded transition-transform ease-out ${
                mobileOpen ? 'translate-y-[9px] rotate-45' : ''
              }`}
              style={{ transitionDuration: `${ANIM_MS}ms` }}
            />
            <span
              className={`absolute left-0 top-[9px] h-[2px] w-6 bg-white/90 rounded transition-opacity ease-out ${
                mobileOpen ? 'opacity-0' : 'opacity-100'
              }`}
              style={{ transitionDuration: `${ANIM_MS}ms` }}
            />
            <span
              className={`absolute left-0 top-[18px] h-[2px] w-6 bg-white/90 rounded transition-transform ease-out ${
                mobileOpen ? 'translate-y-[-9px] -rotate-45' : ''
              }`}
              style={{ transitionDuration: `${ANIM_MS}ms` }}
            />
          </span>
        </button>
      </div>

      {/* Mobile overlay + panel */}
      {renderMobile && (
        <div className="sm:hidden">
          {/* overlay */}
          <button
            type="button"
            className={`fixed inset-0 bg-black/40 transition-opacity ease-out ${
              mobileShown ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transitionDuration: `${ANIM_MS}ms` }}
            onClick={closeMobile}
            aria-label="Close menu overlay"
          />

          {/* panel */}
          <div
            className={`fixed right-0 top-0 h-full w-[82%] max-w-[360px] bg-neutral-950 border-l border-white/10 shadow-2xl
              transition-transform ease-out ${
        mobileShown ? 'translate-x-0' : 'translate-x-full'
        }`}
            style={{ transitionDuration: `${ANIM_MS}ms` }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold tracking-widest text-white/60 uppercase">
                  Menu
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/5 transition"
                  onClick={closeMobile}
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 grid gap-2">
                <NavLink
                  to="/"
                  end
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `w-full justify-start ${itemBase} ${
                      isActive ? itemActive : ''
                    }`
                  }
                >
                  HOME
                </NavLink>

                <NavLink
                  to="/about"
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `w-full justify-start ${itemBase} ${
                      isActive ? itemActive : ''
                    }`
                  }
                >
                  ABOUT
                </NavLink>

                <button
                  type="button"
                  onClick={() => setMobileProductsOpen((v) => !v)}
                  className={`w-full justify-between ${itemBase} ${
                    mobileProductsOpen ? itemActive : ''
                  }`}
                >
                  <span className="inline-flex items-center">
                    PRODUCTS{' '}
                    <span className="ml-2 text-white/60">
                      {mobileProductsOpen ? '▴' : '▾'}
                    </span>
                  </span>
                </button>

                {mobileProductsOpen && (
                  <div className="ml-1 mt-1 grid gap-1 rounded-xl border border-white/10 bg-white/5 p-2">
                    {categories.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => goCategory(c.key)}
                        className="rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 transition break-words"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}

                <NavLink
                  to="/contact"
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `w-full justify-start ${itemBase} ${
                      isActive ? itemActive : ''
                    }`
                  }
                >
                  CONTACT
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
