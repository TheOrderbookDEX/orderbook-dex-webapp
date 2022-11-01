import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.scss';
import reportWebVitals from './reportWebVitals';
import App from './components/App';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
