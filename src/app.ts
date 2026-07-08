import { buildTeaser } from './lib/astrology';
import { fetchPaymentsMode, fetchProducts } from './lib/products';
import { generateReferralCode, getReferralFromUrl } from './lib/referral';
import { persistFaceConsent, persistReading, revokeFaceConsent } from './data';
import { renderBirthForm } from './screens/birthForm';
import { renderLanding } from './screens/landing';
import { renderResults } from './screens/results';
import { renderSelfie } from './screens/selfie';
import { createInitialState } from './types';
import type { AppState, BirthData } from './types';

export function initApp(root: HTMLElement): void {
  const state: AppState = createInitialState();
  state.referredBy = getReferralFromUrl();

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

  render();
}
