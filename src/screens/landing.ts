import { APP_NAME } from '../content';
import { t } from '../lib/i18n';

export function renderLanding(root: HTMLElement, onStart: () => void): void {
  root.innerHTML = `
    <section class="screen landing">
      <div class="stars-bg" aria-hidden="true"></div>
      <div class="landing-content">
        <p class="eyebrow">${APP_NAME}</p>
        <h1>${t('landing_title_html')}</h1>
        <p class="subhead">${t('landing_sub')}</p>
        <button class="btn btn-primary btn-large" id="start-btn" type="button">${t('start_btn')}</button>
        <div class="notice-stack">
          <p class="notice">✨ ${t('ai_notice')}</p>
          <p class="disclaimer">${t('disclaimer')}</p>
        </div>
      </div>
    </section>
  `;
  root.querySelector('#start-btn')?.addEventListener('click', onStart);
}
