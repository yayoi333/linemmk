import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import AccessRoot from './AccessRoot';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessRoot />
  </StrictMode>,
);
