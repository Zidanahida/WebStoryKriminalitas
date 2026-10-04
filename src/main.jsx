import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './components/App'  // ← tambahkan /components/

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)