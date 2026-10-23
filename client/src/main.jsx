import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ── CSS imports — order matters ──────────────────────────────
import './styles/variables.css';
import './styles/reset.css';
import './styles/global.css';
import './styles/navbar.css';
import './styles/sidebar.css';
import './styles/dashboard.css';
import './styles/forms.css';
import './styles/cards.css';
import './styles/tables.css';
import './styles/charts.css';
import './styles/responsive.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
