import './styles.css';
import { initApp } from './app';
import { ENTERTAINMENT_DISCLAIMER } from './content';

const root = document.querySelector('#app');
const footer = document.querySelector('#app-footer');

if (footer instanceof HTMLElement) {
  footer.innerHTML = `<p class="disclaimer footer-disclaimer">${ENTERTAINMENT_DISCLAIMER}</p>`;
}

if (root instanceof HTMLElement) {
  initApp(root);
}
