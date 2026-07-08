import { buildTeaser } from './lib/astrology';
import { getLang, LANGS, setLang, t } from './lib/i18n';
import type { Lang } from './lib/i18n';
import { fetchPaymentsMode, fetchProducts } from './lib/products';
import { generateReferralCode, getReferralFromUrl } from './lib/referral';
import { persistFaceConsent, persistReading, revokeFaceConsent } from './data';
import { renderBirthForm } from './screens/birthForm';
import { renderLanding } from './screens/landing';
import { renderResults } from './screens/results';
import { renderSelfie } from './screens/selfie';
import { createInitialState } from './types';
import type { AppState, BirthData } from './types';

export function initApp(container: HTMLElement): void {
  const state: AppState = createInitialState();
  state.referredBy = getReferralFromUrl();

  container.innerHTML = '<div id="lang-bar" class="lang-bar"></div><div id="screen-root"></div>';
  const langBar = container.querySelector('#lang-bar') as HTMLElement;
  const root = container.querySelector('#screen-root') as HTMLElement;

  function renderLangBar(): void {
    langBar.innerHTML = `
      <label class="lang-select-wrap">
        <span class="sr-only">Language</span>
        <select id="lang-select" class="lang-select" aria-label="Language">
          ${LANGS.map((l) => `<option value="${l.code}" ${l.code === getLang() ? 'selected' : ''}>${l.flag} ${l.label}</option>`).join('')}
        </select>
      </label>
    `;
    langBar.querySelector('#lang-select')?.addEventListener('change', (event) => {
      const value = (event.target as HTMLSelectElement).value as Lang;
      setLang(value);
      renderLangBar();
      renderFooter();
      render();
    });
  }

  function renderFooter(): void {
    const footer = document.querySelector('#app-footer');
    if (footer instanceof HTMLElement) {
      footer.innerHTML = `<p class="disclaimer footer-disclaimer">${t('disclaimer')}</p>`;
    }
  }

  function render(): void {
    switch (state.step) {
      case 'landing':
        renderLanding(root, () => {
          state.step = 'birth';
          render();
        });
        break;

      case 'birth':
        renderBirthForm(
          root,
          state.birth,
          (data: BirthData) => {
            state.birth = data;
            state.step = 'selfie';
            render();
          },
          () => {
            state.step = 'landing';
            render();
          },
        );
        break;

      case 'selfie':
        if (!state.birth) {
          state.step = 'birth';
          render();
          return;
        }
        renderSelfie(
          root,
          state.birth,
          (result) => {
            state.faceConsent.consented = result.consented;
            state.faceTraits = result.traits;
            void finalizeReading();
          },
          () => {
            state.step = 'birth';
            render();
          },
        );
        break;

      case 'results':
        renderResults(root, state, {
          onRevokeFace: () => void handleRevokeFace(),
          onRestart: () => {
            const next = createInitialState();
            next.referredBy = state.referredBy;
            Object.assign(state, next);
            render();
          },
        });
        break;

      default:
        break;
    }
  }

  async function finalizeReading(): Promise<void> {
    const birth = state.birth;
    if (!birth) return;

    state.teaser = buildTeaser(birth.date, birth.time, birth.place);
    state.referralCode = generateReferralCode(birth.email);

    state.readingId = await persistReading({
      birth,
      teaser: state.teaser,
      faceTraits: state.faceTraits,
      referralCode: state.referralCode,
      referredBy: state.referredBy,
    });

    if (state.faceConsent.consented) {
      state.faceConsent.recordId = await persistFaceConsent(state.readingId, birth.email);
    }

    state.step = 'results';
    render();

    void loadOffers();
  }

  async function loadOffers(): Promise<void> {
    const [products, mode] = await Promise.all([fetchProducts(), fetchPaymentsMode()]);
    state.products = products;
    state.paymentsMode = mode;
    state.productsLoaded = true;
    if (state.step === 'results') render();
  }

  async function handleRevokeFace(): Promise<void> {
    if (state.faceConsent.recordId) {
      await revokeFaceConsent(state.faceConsent.recordId);
    }
    state.faceConsent.consented = false;
    state.faceConsent.revokedAt = new Date().toISOString();
    state.faceTraits = [];
    if (state.step === 'results') render();
  }

  renderLangBar();
  renderFooter();
  render();
}
