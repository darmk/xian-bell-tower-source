import { createRoot } from 'react-dom/client';
import App from './App';
import FollowGate from './FollowGate';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <FollowGate>
    <App />
  </FollowGate>,
);
