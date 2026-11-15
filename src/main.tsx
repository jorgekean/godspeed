import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.tsx'

// Detect iOS and apply platform classes for safe area handling
const isIOS = Capacitor.getPlatform() === 'ios' || /iPad|iPhone|iPod/.test(navigator.userAgent);
if (isIOS) {
  document.documentElement.classList.add('plt-ios', 'ios-device');
}
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('capacitor-native');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
