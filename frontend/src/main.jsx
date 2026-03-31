import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import HomePage from './components/Homepage';
import App from './App';

function Root() {
  const [page, setPage] = useState('home');

  if (page === 'app') return <App />;
  return <HomePage onEnter={() => setPage('app')} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);