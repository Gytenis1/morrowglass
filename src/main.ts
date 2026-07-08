import './styles.css';
import { initApp } from './app';

const root = document.querySelector('#app');

if (root instanceof HTMLElement) {
  initApp(root);
}
