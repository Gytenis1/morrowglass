import { generateFaceTraits } from '../lib/face';
import { t } from '../lib/i18n';
import type { BirthData } from '../types';

export interface SelfieResult {
  consented: boolean;
  traits: string[];
}

export function renderSelfie(
  root: HTMLElement,
  birth: BirthData,
  onContinue: (result: SelfieResult) => void,
  onBack: () => void,
): void {
  root.innerHTML = `
    <section class="screen selfie-screen">
      <button class="btn-link back-btn" id="back-btn" type="button">${t('back')}</button>
      <h2>${t('selfie_title')} <span class="tag-optional">${t('optional_tag')}</span></h2>
      <p class="section-sub">${t('face_intro')}</p>

      <div class="consent-box">
        <label class="checkbox-row">
          <input type="checkbox" id="face-consent-checkbox" />
          <span>${t('face_consent')}</span>
        </label>
      </div>

      <div class="selfie-capture">
        <input type="file" accept="image/*" capture="user" id="selfie-input" hidden />
        <button class="btn btn-secondary" id="selfie-btn" type="button" disabled>${t('take_selfie')}</button>
        <canvas id="selfie-canvas" width="240" height="240" class="selfie-canvas" hidden></canvas>
        <p class="selfie-status" id="selfie-status" aria-live="polite"></p>
      </div>

      <div class="selfie-result" id="selfie-result" hidden>
        <h3>${t('face_traits_title')}</h3>
        <ul id="face-trait-list"></ul>
        <button class="btn-link" id="revoke-btn" type="button">${t('revoke_btn')}</button>
      </div>

      <div class="selfie-actions">
        <button class="btn-link" id="skip-btn" type="button">${t('skip')}</button>
        <button class="btn btn-primary btn-large" id="continue-btn" type="button">${t('see_reading')}</button>
      </div>
    </section>
  `;

  let traits: string[] = [];
  let consented = false;

  const consentCheckbox = root.querySelector('#face-consent-checkbox');
  const selfieBtn = root.querySelector('#selfie-btn');
  const selfieInput = root.querySelector('#selfie-input');
  const canvas = root.querySelector('#selfie-canvas');
  const statusEl = root.querySelector('#selfie-status');
  const resultBox = root.querySelector('#selfie-result');
  const traitList = root.querySelector('#face-trait-list');
  const revokeBtn = root.querySelector('#revoke-btn');

  root.querySelector('#back-btn')?.addEventListener('click', onBack);
  root.querySelector('#skip-btn')?.addEventListener('click', () => onContinue({ consented: false, traits: [] }));
  root.querySelector('#continue-btn')?.addEventListener('click', () => onContinue({ consented, traits }));

  if (consentCheckbox instanceof HTMLInputElement && selfieBtn instanceof HTMLButtonElement) {
    consentCheckbox.addEventListener('change', () => {
      selfieBtn.disabled = !consentCheckbox.checked;
    });
  }

  if (selfieBtn instanceof HTMLButtonElement && selfieInput instanceof HTMLInputElement) {
    selfieBtn.addEventListener('click', () => selfieInput.click());

    selfieInput.addEventListener('change', () => {
      const file = selfieInput.files?.[0];
      if (!file) return;
      if (!(consentCheckbox instanceof HTMLInputElement) || !consentCheckbox.checked) return;

      if (statusEl instanceof HTMLElement) statusEl.textContent = t('scanning');

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        if (canvas instanceof HTMLCanvasElement) {
          canvas.hidden = false;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        // Simulate brief in-browser analysis, then immediately discard the
        // image entirely. Traits are derived only from birth data, never
        // from actual pixels — this feature is intentionally simulated.
        window.setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
          if (canvas instanceof HTMLCanvasElement) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            canvas.hidden = true;
          }
          selfieInput.value = '';

          traits = generateFaceTraits(`${birth.date}|${birth.time ?? ''}|${birth.place}`);
          consented = true;

          if (statusEl instanceof HTMLElement) {
            statusEl.textContent = t('analyzed');
          }
          if (traitList instanceof HTMLElement) {
            traitList.innerHTML = traits.map((t) => `<li>${t}</li>`).join('');
          }
          if (resultBox instanceof HTMLElement) resultBox.hidden = false;
        }, 900);
      };
      img.src = objectUrl;
    });
  }

  if (revokeBtn instanceof HTMLButtonElement) {
    revokeBtn.addEventListener('click', () => {
      traits = [];
      consented = false;
      if (resultBox instanceof HTMLElement) resultBox.hidden = true;
      if (traitList instanceof HTMLElement) traitList.innerHTML = '';
      if (statusEl instanceof HTMLElement) {
        statusEl.textContent = t('revoked');
      }
      if (consentCheckbox instanceof HTMLInputElement) consentCheckbox.checked = false;
      if (selfieBtn instanceof HTMLButtonElement) selfieBtn.disabled = true;
    });
  }
}
