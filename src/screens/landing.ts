import { AI_TRANSPARENCY_NOTICE, APP_NAME, ENTERTAINMENT_DISCLAIMER } from '../content';

export function renderLanding(root: HTMLElement, onStart: () => void): void {
  root.innerHTML = `
    <section class="screen landing">
      <div class="stars-bg" aria-hidden="true"></div>
      <div class="landing-content">
        <p class="eyebrow">${APP_NAME}</p>
        <h1>Discover your<br /><span class="accent">cosmic personality</span></h1>
        <p class="subhead">A premium, playful astrology &amp; personality read, built from your birth details in under a minute.</p>
        <button class="btn btn-primary btn-large" id="start-btn" type="button">Begin your reading</button>
        <div class="notice-stack">
          <p class="notice">✨ ${AI_TRANSPARENCY_NOTICE}</p>
          <p class="disclaimer">${ENTERTAINMENT_DISCLAIMER}</p>
        </div>
      </div>
    </section>
  `;
  root.querySelector('#start-btn')?.addEventListener('click', onStart);
}
