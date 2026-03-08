import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function App() {
    return (
        <div className="p-4">
            <h1 className="text-3xl font-heading">Live Room</h1>
            <p>Panel shows videoguest grid, health bar, chat and Swanny bubble.</p>
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(<App />);
}