import { FACE_CONSENT_COPY, FACE_STEP_INTRO } from '../content';
import { generateFaceTraits } from '../lib/face';
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
      <button class="btn-link back-btn" id="back-btn" type="button">&larr; Back</button>
      <h2>Add a face read? <span class="tag-optional">Optional</span></h2>
      <p class="section-sub">${FACE_STEP_INTRO}</p>

      <div class="consent-box">
        <label class="checkbox-row">
          <input type="checkbox" id="face-consent-checkbox" />
          <span>${FACE_CONSENT_COPY}</span>
        </label>
      </div>

      <div class="selfie-capture">
        <input type="file" accept="image/*" capture="user" id="selfie-input" hidden />
        <button class="btn btn-secondary" id="selfie-btn" type="button" disabled>Take or choose a selfie</button>
        <canvas id="selfie-canvas" width="240" height="240" class="selfie-canvas" hidden></canvas>
        <p class="selfie-status" id="selfie-status" aria-live="polite"></p>
      </div>

      <div class="selfie-result" id="selfie-result" hidden>
        <h3>Playful face traits</h3>
        <ul id="face-trait-list"></ul>
        <button class="btn-link" id="revoke-btn" type="button">Revoke consent &amp; delete my face data</button>
      </div>

      <div class="selfie-actions">
        <button class="btn-link" id="skip-btn" type="button">Skip this step</button>
        <button class="btn btn-primary btn-large" id="continue-btn" type="button">See my reading</button>
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

      if (statusEl instanceof HTMLElement) statusEl.textContent = 'Scanning in your browser…';

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
            statusEl.textContent = 'Photo analyzed and deleted immediately — nothing was uploaded.';
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
        statusEl.textContent = 'Consent revoked. Your face data has been deleted.';
      }
      if (consentCheckbox instanceof HTMLInputElement) consentCheckbox.checked = false;
      if (selfieBtn instanceof HTMLButtonElement) selfieBtn.disabled = true;
    });
  }
}
