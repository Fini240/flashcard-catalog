import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { report } from './report'

// A tab that has been open across a deploy is holding an index.html that names
// chunk files the server no longer has. Nothing breaks until something is
// imported lazily — the Firebase plugins load their web halves on first use —
// and then sync fails while the rest of the app carries on looking fine.
//
// The hosting config now tells browsers never to cache index.html, which stops
// this happening again, but a client that is *already* stale can't be fixed
// from the server: it has to notice and reload itself.
const RELOAD_KEY = 'fc-stale-reload-at'
// Long enough that a reload which didn't help can't loop, short enough that a
// genuine staleness weeks later still gets its one retry. Deliberately not
// cleared on a successful boot: the reload *is* the successful boot, so
// clearing it there would hand every subsequent failure a fresh retry and
// reload forever.
const RETRY_WINDOW_MS = 60_000

window.addEventListener('vite:preloadError', (event) => {
  report('boot.staleChunk', event.payload || event)
  let lastAttempt = 0
  try {
    lastAttempt = Number(sessionStorage.getItem(RELOAD_KEY)) || 0
  } catch (e) {
    // Storage blocked (private mode): without somewhere to remember the
    // attempt there's no way to stop a loop, so don't start one.
    return
  }
  if (Date.now() - lastAttempt < RETRY_WINDOW_MS) return
  try {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch (e) {
    return
  }
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
