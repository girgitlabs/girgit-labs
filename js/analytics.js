// PostHog custom analytics for Girgit Labs
export function track(event, properties = {}) {
  try {
    if (window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture(event, properties);
    }
  } catch (e) {
    // Fail silently so site execution is never blocked
  }
}

export function initAnalytics() {
  if (typeof document === 'undefined') return;

  // Global click delegate for high-intent and engagement interactions
  document.addEventListener('click', (e) => {
    // 1. clicked_lets_talk
    const talkLink = e.target.closest('a[href="#talk"], a[href$="#talk"]');
    if (talkLink) {
      const location = talkLink.closest('nav, .nav') ? 'navbar' : (talkLink.closest('footer, .ft') ? 'footer' : 'body');
      track('clicked_lets_talk', {
        location,
        label: talkLink.textContent.trim(),
        path: window.location.pathname
      });
      return;
    }

    // 2. email_copied
    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) {
      const email = copyBtn.dataset.copy || 'connect@girgitlabs.design';
      const location = copyBtn.closest('.ft') ? 'footer' : (copyBtn.closest('.cta') ? 'cta_section' : 'body');
      track('email_copied', {
        email,
        location,
        path: window.location.pathname
      });
      return;
    }

    // Direct mailto clicks
    const mailto = e.target.closest('a[href^="mailto:"]');
    if (mailto) {
      track('email_clicked', {
        email: mailto.href.replace('mailto:', ''),
        path: window.location.pathname
      });
      return;
    }

    // 3. viewed_work_project
    const workLink = e.target.closest('.work-link, a[href*="work/"]');
    if (workLink) {
      const name = workLink.querySelector('.work-meta span')?.textContent?.trim() || workLink.textContent.trim();
      track('viewed_work_project', {
        project_name: name,
        project_url: workLink.getAttribute('href')
      });
      return;
    }

    // 4. chameleon_interacted
    const chamEl = e.target.closest('.sh-figure, [data-figure], .hide-girgit, .hide-btn, .mascot, [data-hero-cham]');
    if (chamEl) {
      const section = chamEl.closest('.hide') ? 'jungle_hide' : (chamEl.closest('.sh') ? 'hero' : 'interactive');
      track('chameleon_interacted', {
        section,
        element: chamEl.className || chamEl.tagName
      });
      return;
    }

    // 5. played_with_stickers
    const sticker = e.target.closest('.sticker, [data-pile] .pill, [data-pile] img');
    if (sticker) {
      track('played_with_stickers', {
        text: sticker.textContent.trim() || 'sticker_graphic'
      });
    }
  }, { passive: true });
}

// Auto-run when module is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnalytics);
} else {
  initAnalytics();
}
