import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function App() {
    const [gross, setGross] = React.useState(0);
    const [creator, setCreator] = React.useState(0);
    const [platform, setPlatform] = React.useState(0);

    const calc = (g: number) => {
        const c = Math.round((g * 0.9));
        setCreator(c);
        setPlatform(g - c);
    };

    return (
        <div className="p-4">
            <h1 className="text-3xl font-heading">Creator Studio</h1>
            <div className="mt-6">
                <label className="block mb-2">Gross amount (cents)</label>
                <input
                    type="number"
                    value={gross}
                    onChange={e => { setGross(+e.target.value); calc(+e.target.value); }}
                    className="input-field w-32"
                />
            </div>
            <div className="mt-4">
                <p>
                    Creator: <span className="text-gold">{(creator / 100).toFixed(2)}</span>
                </p>
                <p>
                    Platform: <span className="text-cyan">{(platform / 100).toFixed(2)}</span>
                </p>
            </div>
            );
}

            const container = document.getElementById('root');
            if (container) {
                createRoot(container).render(<App />);
}