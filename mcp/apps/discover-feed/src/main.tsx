import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function App() {
    return (
        <div className="p-4">
            <h1 className="text-3xl font-heading">Discover Feed</h1>
            <p>Grid of live creators with category filter.</p>
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(<App />);
}