import React from 'react';
import PostureCorrector from './components/PostureCorrector';
import { Github } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10" 
        style={{backgroundImage: "url('https://images.unsplash.com/photo-1554224311-5abf6422218f?q=80&w=2940&auto=format&fit=crop')"}}
      ></div>
      <div className="relative container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Neck<span className="text-teal-400">Wise</span>
          </h1>
          <a href="https://github.com/noahgsolomon/PosturePerfect-AI" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
            <Github size={24} />
          </a>
        </header>
        <main>
          <PostureCorrector />
        </main>
      </div>
    </div>
  );
}

export default App;
