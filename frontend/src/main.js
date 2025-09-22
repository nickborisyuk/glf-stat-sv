import './app.css'
import App from './App.svelte'
import { cacheBuster } from './lib/cache-buster.js'

// Initialize cache busting
console.log('App version:', cacheBuster.getVersion());
console.log('Cache buster:', cacheBuster.getCacheBuster());

const app = new App({
  target: document.getElementById('app'),
})

export default app
