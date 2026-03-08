import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function App() {
    return (
        <div className="p-4">
            <h1 className="text-3xl font-heading">Creator Studio</h1>
            <p>Stream configuration, 90% calculator, thumbnail picker.</p>
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(<App />);
}