import type { BirthData } from '../types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function renderBirthForm(
  root: HTMLElement,
  initial: BirthData | undefined,
  onSubmit: (data: BirthData) => void,
  onBack: () => void,
): void {
  root.innerHTML = `
    <section class="screen form-screen">
      <button class="btn-link back-btn" id="back-btn" type="button">&larr; Back</button>
      <h2>Your birth details</h2>
      <p class="section-sub">We use these to calculate your sun, moon &amp; rising signs.</p>
      <form id="birth-form" novalidate>
        <label class="field">
          <span>Birth date <em>(required)</em></span>
          <input type="date" name="date" required value="${initial?.date ?? ''}" />
        </label>
        <label class="field">
          <span>Birth time <em>(optional, improves accuracy)</em></span>
          <input type="time" name="time" value="${initial?.time ?? ''}" />
        </label>
        <label class="field">
          <span>Birth place <em>(required)</em></span>
          <input type="text" name="place" required placeholder="City, Country" value="${initial?.place ?? ''}" />
        </label>
        <label class="field">
          <span>Email <em>(required)</em></span>
          <input type="email" name="email" required placeholder="you@example.com" value="${initial?.email ?? ''}" />
        </label>
        <p class="field-error" id="form-error" role="alert" aria-live="polite"></p>
        <button class="btn btn-primary btn-large" type="submit">Continue</button>
      </form>
    </section>
  `;

  root.querySelector('#back-btn')?.addEventListener('click', onBack);

  const form = root.querySelector('#birth-form');
  const errorEl = root.querySelector('#form-error');
  if (!(form instanceof HTMLFormElement) || !(errorEl instanceof HTMLElement)) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const date = String(formData.get('date') ?? '').trim();
    const time = String(formData.get('time') ?? '').trim();
    const place = String(formData.get('place') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();

    if (!date) {
      errorEl.textContent = 'Please enter your birth date.';
      return;
    }
    if (!place) {
      errorEl.textContent = 'Please enter your birth place.';
      return;
    }
    if (!email || !EMAIL_RE.test(email)) {
      errorEl.textContent = 'Please enter a valid email address.';
      return;
    }
    errorEl.textContent = '';
    onSubmit({ date, time: time || undefined, place, email });
  });
}
