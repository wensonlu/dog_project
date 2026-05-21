import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {
  enableVConsole,
  ensureVConsoleLoaded,
  getH5DebugEnabled,
  initH5DebugCapture,
} from './utils/h5DebugConsole'

initH5DebugCapture()

if (getH5DebugEnabled()) {
  ensureVConsoleLoaded()
    .then(() => enableVConsole())
    .catch(() => {})
}

createRoot(document.getElementById('root')).render(
  <App />
)
