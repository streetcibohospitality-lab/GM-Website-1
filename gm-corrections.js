/* ============================================================
   GRUB MONKEYS — CORRECTIONS LAYER (JS)
   ------------------------------------------------------------
   The behavioural counterpart to gm-corrections.css. Loaded LAST on the
   pages that need it, so it can react to state the design files set up.

   KEEP THIS SCRIPT LAST. It reads elements the page's own scripts create
   and only intervenes when they leave the UI in a state that misreports
   what the user can actually do.
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     Franchise "Vibe Check" reel — honest failure state.

     franchise.js drives the reel's controls off video.paused. When the
     file cannot be used at all, the element never starts but also never
     reports itself paused: networkState settles at NETWORK_NO_SOURCE (3)
     with readyState 0 and video.paused false. The controls then read
     "PAUSE" and "SOUND ON" over a static poster, offering a full control
     set for a reel that is not playing and cannot be started. That is the
     same defect the Monkey TV reel had on the homepage, where it is
     handled by switching the control to NO SIGNAL.

     Reachable whenever the source cannot be fetched or decoded: a failed
     or interrupted download, the file missing after a bad deploy, or a
     browser without the codec.
     ---------------------------------------------------------- */
  var video = document.getElementById('gmFrVibeVideo');
  if (!video) return;

  var play = document.getElementById('gmFrVibePlay');
  var sound = document.getElementById('gmFrVibeSound');
  var restart = document.getElementById('gmFrVibeRestart');
  var screenEl = document.getElementById('gmFrVibeScreen');
  var screenToggle = document.getElementById('gmFrVibeScreenToggle');
  var failed = false;

  function markUnavailable() {
    if (failed) return;
    failed = true;

    if (play) {
      play.textContent = 'NO SIGNAL';
      play.disabled = true;
      play.setAttribute('aria-label', 'Vibe check reel is unavailable');
    }
    if (sound) sound.disabled = true;
    if (restart) restart.disabled = true;
    if (screenToggle) {
      screenToggle.disabled = true;
      screenToggle.setAttribute('aria-label', 'Vibe check reel is unavailable');
    }
    /* The poster stays visible underneath, so the frame still reads as a
       screen rather than an empty box. */
    if (screenEl) screenEl.classList.add('is-unavailable');
  }

  video.addEventListener('error', markUnavailable);

  var source = video.querySelector('source');
  if (source) source.addEventListener('error', markUnavailable);

  /* A source the browser cannot use raises no error event of its own, so
     the settled state is checked once the page has had time to load. */
  window.setTimeout(function () {
    if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE && video.readyState === 0) {
      markUnavailable();
    }
  }, 8000);

  /* If it does become playable later, clear the flag so the page's own
     control sync takes back over. */
  video.addEventListener('loadedmetadata', function () {
    failed = false;
  });
})();
