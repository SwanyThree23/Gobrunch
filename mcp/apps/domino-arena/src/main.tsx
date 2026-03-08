import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function App() {
    return (
        <div className="p-4">
            <h1 className="text-3xl font-heading">Domino Arena</h1>
            <p>Multiplayer dominos game UI with tournaments.</p>
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(<App />);
}