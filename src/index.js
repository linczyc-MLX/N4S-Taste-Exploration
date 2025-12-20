import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TasteProvider } from './contexts/TasteContext';
import './styles/index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TasteProvider>
      <App />
    </TasteProvider>
  </React.StrictMode>
);
