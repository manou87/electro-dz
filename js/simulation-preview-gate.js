/**
 * Accès preview simulation — vous seul connaissez la clé.
 * URL : https://electro-dz.com/simulation-swissdz.html?cle=VOTRE_CLE
 * Changez PREVIEW_KEY ci-dessous, puis republiez le site.
 */
(function () {
  var PREVIEW_KEY = 'swissdz-test-2026'
  var STORAGE = 'electrodz-swissdz-preview-ok'

  var params = new URLSearchParams(window.location.search)
  if (params.get('cle') === PREVIEW_KEY) {
    try { sessionStorage.setItem(STORAGE, '1') } catch (e) { /* ignore */ }
  }

  var ok = false
  try { ok = sessionStorage.getItem(STORAGE) === '1' } catch (e) { /* ignore */ }

  if (ok) return

  var meta = document.querySelector('meta[name="robots"]')
  if (meta) meta.setAttribute('content', 'noindex, nofollow')

  document.addEventListener('DOMContentLoaded', function () {
    document.body.innerHTML =
      '<main style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:1.5rem;text-align:center;color:#e8e8e8;background:#12141a;min-height:100vh;box-sizing:border-box">' +
      '<h1 style="font-size:1.25rem;margin:0 0 1rem">Simulation SwissDz — accès privé</h1>' +
      '<p style="color:#9aa0a8;line-height:1.5">Cette version est en test. Ouvrez le lien avec votre clé personnelle :</p>' +
      '<p style="word-break:break-all;font-family:monospace;font-size:0.85rem;background:#1e2229;padding:0.75rem;border-radius:8px">' +
      window.location.pathname + '?cle=<votre-clé></p>' +
      '<p style="color:#6b7280;font-size:0.8rem;margin-top:2rem">Electro DZ · SwissDZ</p></main>'
  })
  throw new Error('simulation-preview-locked')
})()
