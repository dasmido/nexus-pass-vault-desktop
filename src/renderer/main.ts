import 'carbon-components-svelte/css/g10.css';
import darkThemeHref from 'carbon-components-svelte/css/g90.css?url';
import { mount } from 'svelte';
import App from './App.svelte';

const darkTheme = document.createElement('link');
darkTheme.rel = 'stylesheet';
darkTheme.href = darkThemeHref;
darkTheme.disabled = true;
darkTheme.id = 'carbon-dark-theme';
document.head.appendChild(darkTheme);

const app = mount(App, {
  target: document.getElementById('app')!
});

export default app;