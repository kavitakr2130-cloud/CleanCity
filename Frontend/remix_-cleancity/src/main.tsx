import "./global.css";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId="53957083883-2umcp0m9ffrh0irprolrlbs1rimls64o.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>,
);
