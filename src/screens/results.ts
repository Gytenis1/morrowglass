import { buildReferralUrl } from '../lib/referral';
import { buildLocalizedSections, signName, t } from '../lib/i18n';
import { copyLink, renderShareCardCanvas, shareCardImage, socialIntentUrl } from '../lib/share';
import type { AppState } from '../types';

export interface ResultsCallbacks {
  onRevokeFace: () => void;
  onRestart: () => void;
}

export function renderResults(root: HTMLElement, state: AppState, callbacks: ResultsCallbacks): void {
  const teaser = state.teaser;
  if (!teaser) return;

  const referralCode = state.referralCode ?? '';
  const referralUrl = buildReferralUrl(referralCode);
  const sunLoc = signName(teaser.sunSign);
  const moonLoc = signName(teaser.moonSign);
  const risingLoc = signName(teaser.risingSign);
  const shareText = t('share_text')
    .replaceAll('{sun}', sunLoc)
    .replaceAll('{moon}', moonLoc)
    .replaceAll('{rising}', risingLoc)
    .replaceAll('{archetype}', teaser.archetype);

  const birth = state.birth;
  const seed = `${birth?.date ?? ''}|${birth?.time ?? ''}|${(birth?.place ?? '').trim().toLowerCase()}`;
  const sections = buildLocalizedSections(teaser.sunSign, teaser.moonSign, teaser.risingSign, seed);

  const testModePill = state.paymentsMode === 'test' ? `<span class="pill pill-test">${t('test_mode')}</span>` : '';

  const faceCard = state.faceConsent.consented && state.faceTraits.length > 0
    ? `
      <div class="card face-card">
        <h3>${t('face_read_title')}</h3>
        <ul>${state.faceTraits.map((tr) => `<li>${tr}</li>`).join('')}</ul>
        <button class="btn-link" id="revoke-face-btn" type="button">${t('revoke_btn')}</button>
      </div>
    `
    : '';

  root.innerHTML = `
    <section class="screen results-screen">
      <header class="results-header">
        <p class="eyebrow">${t('your_reading')} ${testModePill}</p>
        <h2>${sunLoc} ${t('sun')} · ${moonLoc} ${t('moon')} · ${risingLoc} ${t('rising')}</h2>
        <p class="archetype">${teaser.archetype}</p>
      </header>

      <div class="card-grid">
        <div class="card hidden-card unlocked">
          <h3>${t('hidden_trait_title')}</h3>
          <p>${sections.hidden}</p>
        </div>
      </div>

      <div class="card section-card">
        <h3>${t('meaning_title')}</h3>
        <p>${sections.meaning}</p>
      </div>

      <div class="card section-card">
        <h3>${t('actions_title')}</h3>
        <ol class="action-list">
          ${sections.actions.map((a) => `<li>${a}</li>`).join('')}
        </ol>
      </div>

      <div class="card section-card pep-card">
        <h3>${t('pep_title')}</h3>
        <p>${sections.pep}</p>
      </div>

      <div class="card section-card humor-card">
        ${sections.humor.map((h) => `<p class="humor-line">😄 ${h}</p>`).join('')}
      </div>

      <div class="card section-card final-card">
        <h3>${t('final_title')}</h3>
        <p>${sections.final}</p>
      </div>

      ${faceCard}

      <p class="disclaimer results-disclaimer">${t('disclaimer')}</p>

      <p class="premium-soon">${t('premium_soon')}</p>

      <section class="share-section">
        <h3>${t('share_title')}</h3>
        <p class="share-incentive">${t('share_incentive')}</p>
        <canvas id="share-canvas" class="share-canvas-preview" width="1080" height="1350" hidden></canvas>
        <div class="share-actions">
          <button class="btn btn-primary" id="share-native-btn" type="button">${t('share_card_btn')}</button>
        </div>
        <div class="share-socials">
          <button class="btn btn-social" id="share-x-btn" type="button">X</button>
          <button class="btn btn-social" id="share-facebook-btn" type="button">Facebook</button>
          <button class="btn btn-social" id="share-instagram-btn" type="button">Instagram</button>
          <button class="btn btn-social" id="share-tiktok-btn" type="button">TikTok</button>
        </div>
        <p class="referral-line">${t('referral_line')} <code>${referralUrl}</code></p>
        <p class="share-status" id="share-status" aria-live="polite"></p>
      </section>

      <button class="btn-link restart-btn" id="restart-btn" type="button">${t('restart')}</button>
    </section>
  `;

  root.querySelector('#revoke-face-btn')?.addEventListener('click', callbacks.onRevokeFace);
  root.querySelector('#restart-btn')?.addEventListener('click', callbacks.onRestart);

  const shareStatus = root.querySelector('#share-status');
  const setStatus = (msg: string) => {
    if (shareStatus instanceof HTMLElement) shareStatus.textContent = msg;
  };

  root.querySelector('#share-native-btn')?.addEventListener('click', async () => {
    const canvas = renderShareCardCanvas({
      sunSign: sunLoc,
      moonSign: moonLoc,
      risingSign: risingLoc,
      archetype: teaser.archetype,
      referralCode,
      url: referralUrl,
    });
    setStatus(t('preparing'));
    const outcome = await shareCardImage(canvas, 'morrowglass-reading.png', shareText);
    if (outcome === 'shared') setStatus(t('shared'));
    else if (outcome === 'downloaded') setStatus(t('downloaded'));
    else setStatus(t('share_err'));
  });

  root.querySelector('#share-x-btn')?.addEventListener('click', () => {
    window.open(socialIntentUrl('x', referralUrl, shareText), '_blank', 'noopener,noreferrer');
  });
  root.querySelector('#share-facebook-btn')?.addEventListener('click', () => {
    window.open(socialIntentUrl('facebook', referralUrl, shareText), '_blank', 'noopener,noreferrer');
  });
  root.querySelector('#share-instagram-btn')?.addEventListener('click', async () => {
    const ok = await copyLink(referralUrl);
    setStatus(ok ? t('copied_ig') : referralUrl);
  });
  root.querySelector('#share-tiktok-btn')?.addEventListener('click', async () => {
    const ok = await copyLink(referralUrl);
    setStatus(ok ? t('copied_tt') : referralUrl);
  });
}
