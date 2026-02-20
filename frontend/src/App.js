import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/Home';
import Learn from './pages/Learn';
import Explore from './pages/Explore';
import Quiz from './pages/Quiz';
import Dashboard from './pages/Dashboard';
import Sandbox from './pages/Sandbox';

function App() {
  return (
    <div className="App">
      <div className="noise-overlay" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:orbitId" element={<Learn />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/quiz/:orbitId" element={<Quiz />} />
          <Route path="/sandbox" element={<Sandbox />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0B1015',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            color: '#fff',
            fontFamily: 'Outfit, sans-serif',
          },
        }}
      />
    </div>
  );
}

export default App;
