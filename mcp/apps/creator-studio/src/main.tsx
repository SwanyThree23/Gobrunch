import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function App() {
    const [gross, setGross] = React.useState(0);
    const [creator, setCreator] = React.useState(0);
    const [platform, setPlatform] = React.useState(0);

    const calc = (g: number) => {
        const c = Math.round(g * 0.9);
        setCreator(c);
        setPlatform(g - c);
    };

    return (
        <div className="p-4">
            <h1 className="text-3xl font-heading">Creator Studio</h1>

            {/* Stream configuration */}
            <section className="mt-6">
                <h2 className="text-xl font-semibold">Stream Settings</h2>
                <div className="mt-2">
                    <label className="block mb-1">Title</label>
                    <input type="text" className="input-field w-full" placeholder="Enter stream title" />
                </div>
                <div className="mt-2">
                    <label className="block mb-1">Game</label>
                    <input type="text" className="input-field w-full" placeholder="e.g. Chess" />
                </div>
            </section>

            {/* Thumbnail picker */}
            <section className="mt-6">
                <h2 className="text-xl font-semibold">Thumbnail</h2>
                <div className="mt-2 border-dashed border-2 border-white/25 p-4 text-center">
                    <p>Upload or select a thumbnail (coming soon)</p>
                </div>
            </section>

            {/* 90% calculator */}
            <section className="mt-6">
                <h2 className="text-xl font-semibold">90% Calculator</h2>
                <div className="mt-2">
                    <label className="block mb-2">Gross amount (cents)</label>
                    <input
                        type="number"
                        value={gross}
                        onChange={e => {
                            setGross(+e.target.value);
                            calc(+e.target.value);
                        }}
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
            </section>
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(<App />);
}