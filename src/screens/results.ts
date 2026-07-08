import { ENTERTAINMENT_DISCLAIMER, SHARE_INCENTIVE_COPY } from '../content';
import { formatPrice } from '../lib/products';
import { buildReferralUrl } from '../lib/referral';
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
  const shareText = `I just got my cosmic personality read on Morrowglass — I'm a ${teaser.sunSign} sun / ${teaser.moonSign} moon / ${teaser.risingSign} rising, "${teaser.archetype}". Get yours:`;

  const testModePill = state.paymentsMode === 'test' ? '<span class="pill pill-test">Test mode</span>' : '';

  const faceCard = state.faceConsent.consented && state.faceTraits.length > 0
    ? `
      <div class="card face-card">
        <h3>Your playful face read</h3>
        <ul>${state.faceTraits.map((t) => `<li>${t}</li>`).join('')}</ul>
        <button class="btn-link" id="revoke-face-btn" type="button">Revoke consent &amp; delete my face data</button>
      </div>
    `
    : '';

  const productsMarkup = state.productsLoaded
    ? renderProducts(state)
    : '<p class="loading-note">Loading offers…</p>';

  root.innerHTML = `
    <section class="screen results-screen">
      <header class="results-header">
        <p class="eyebrow">Your reading ${testModePill}</p>
        <h2>${teaser.sunSign} Sun · ${teaser.moonSign} Moon · ${teaser.risingSign} Rising</h2>
        <p class="archetype">${teaser.archetype}</p>
      </header>

      <div class="card-grid">
        ${teaser.insights.map((insight) => `<div class="card insight-card"><p>${insight}</p></div>`).join('')}
        <div class="card hidden-card">
          <div class="blur-layer">
            <p>${teaser.hiddenTrait}</p>
          </div>
          <div class="hidden-overlay">
            <span class="lock-icon" aria-hidden="true">🔒</span>
            <p>Hidden Trait — unlock with any reading below</p>
          </div>
        </div>
      </div>

      ${faceCard}

      <p class="disclaimer results-disclaimer">${ENTERTAINMENT_DISCLAIMER}</p>

      <section class="paywall-section">
        <h3>Unlock your full cosmic profile</h3>
        ${productsMarkup}
      </section>

      <section class="share-section">
        <h3>Share your reading</h3>
        <p class="share-incentive">${SHARE_INCENTIVE_COPY}</p>
        <canvas id="share-canvas" class="share-canvas-preview" width="1080" height="1350" hidden></canvas>
        <div class="share-actions">
          <button class="btn btn-primary" id="share-native-btn" type="button">Share / download my card</button>
        </div>
        <div class="share-socials">
          <button class="btn btn-social" id="share-x-btn" type="button">Share on X</button>
          <button class="btn btn-social" id="share-facebook-btn" type="button">Share on Facebook</button>
          <button class="btn btn-social" id="share-instagram-btn" type="button">Share on Instagram</button>
          <button class="btn btn-social" id="share-tiktok-btn" type="button">Share on TikTok</button>
        </div>
        <p class="referral-line">Your referral link: <code>${referralUrl}</code></p>
        <p class="share-status" id="share-status" aria-live="polite"></p>
      </section>

      <button class="btn-link restart-btn" id="restart-btn" type="button">Start a new reading</button>
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
      sunSign: teaser.sunSign,
      moonSign: teaser.moonSign,
      risingSign: teaser.risingSign,
      archetype: teaser.archetype,
      referralCode,
      url: referralUrl,
    });
    setStatus('Preparing your share card…');
    const outcome = await shareCardImage(canvas, 'morrowglass-reading.png', shareText);
    if (outcome === 'shared') setStatus('Shared!');
    else if (outcome === 'downloaded') setStatus('Image downloaded — share it anywhere you like.');
    else setStatus('Could not generate the image. Please try again.');
  });

  root.querySelector('#share-x-btn')?.addEventListener('click', () => {
    window.open(socialIntentUrl('x', referralUrl, shareText), '_blank', 'noopener,noreferrer');
  });
  root.querySelector('#share-facebook-btn')?.addEventListener('click', () => {
    window.open(socialIntentUrl('facebook', referralUrl, shareText), '_blank', 'noopener,noreferrer');
  });
  root.querySelector('#share-instagram-btn')?.addEventListener('click', async () => {
    const ok = await copyLink(referralUrl);
    setStatus(ok ? 'Link copied! Paste it in your Instagram bio or story.' : referralUrl);
  });
  root.querySelector('#share-tiktok-btn')?.addEventListener('click', async () => {
    const ok = await copyLink(referralUrl);
    setStatus(ok ? 'Link copied! Paste it in your TikTok bio or video caption.' : referralUrl);
  });
}

function renderProducts(state: AppState): string {
  if (state.products.length === 0) {
    return '<p class="offers-placeholder">Offers launching shortly — check back soon.</p>';
  }

  return `
    <div class="offer-grid">
      ${state.products
        .map((product) => {
          const price = formatPrice(product.amount_cents, product.currency);
          const suffix = product.product_type === 'subscription' ? '/mo' : '';
          return `
            <div class="offer-card">
              <h4>${product.name}</h4>
              <p class="offer-desc">${product.description}</p>
              <p class="offer-price">${price}${suffix}</p>
              <a class="btn btn-primary" href="${product.payment_link_url}" target="_blank" rel="noopener noreferrer">
                ${product.product_type === 'subscription' ? 'Subscribe' : 'Unlock now'}
              </a>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}
