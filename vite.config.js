import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The version manifest the installed app checks itself against.
//
// The APK is sideloaded, so it never updates itself: whatever a user installed
// is what they keep, and until now the only way to learn there was a newer one
// was to go looking. The app now asks this file on launch — it is served from
// hosting, which the ship sequence redeploys with every release, so it is
// current the moment anything ships.
//
// Generated rather than committed, and read out of whatsNew.js rather than
// package.json, because APP_VERSION there is what the running app believes it
// is. A manifest that could disagree with it would either nag every user
// forever or never nag anyone, and both failures are silent. If the regex
// below stops matching, the build fails rather than shipping a manifest that
// says the wrong thing.
function versionManifest() {
  return {
    name: 'version-manifest',
    generateBundle() {
      const source = readFileSync('src/whatsNew.js', 'utf8')
      const match = source.match(/export const APP_VERSION = "([^"]+)"/)
      if (!match) throw new Error('version-manifest: no APP_VERSION in src/whatsNew.js')
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version: match[1], builtAt: new Date().toISOString() }, null, 2),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionManifest()],
})
