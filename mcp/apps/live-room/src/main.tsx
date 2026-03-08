import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import React, { useEffect, useState, useRef } from 'react';
import { HealthBar } from '../../../src/components/live-room/HealthBar';
import { GuestGrid } from '../../../src/components/live-room/GuestGrid';
import { ChatPanel } from '../../../src/components/live-room/ChatPanel';
import { SwannyBubble } from '../../../src/components/live-room/SwannyBubble';

type State = 'idle' | 'countdown' | 'live' | 'ended';

function App() {
    const [state, setState] = useState<State>('idle');
    const [count, setCount] = useState<number>(3);
    const [health, setHealth] = useState({ bitrate: 0, fps: 0, latency: 0 });
    const [viewerCount, setViewerCount] = useState<number>(0);
    const [timer, setTimer] = useState<number>(0);
    const intervalRef = useRef<NodeJS.Timeout>();

    // tick health/viewer when live
    useEffect(() => {
        if (state === 'live') {
            intervalRef.current = setInterval(async () => {
                // fetch health
                try {
                    const res = await fetch(`/api/streams/health?streamId=demo`);
                    const data = await res.json();
                    setHealth({ bitrate: data[0]?.revenue || 0, fps: 30, latency: 50 });
                    setViewerCount(prev => prev + Math.floor(Math.random() * 3));
                    setTimer(prev => prev + 1);
                } catch { }
            }, 1000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [state]);

    useEffect(() => {
        if (state === 'countdown') {
            if (count === 0) {
                setState('live');
            } else {
                const id = setTimeout(() => setCount(c => c - 1), 1000);
                return () => clearTimeout(id);
            }
        }
    }, [state, count]);

    const start = () => {
        setState('countdown');
        setCount(3);
    };

    const end = () => {
        setState('ended');
    };

    return (
        <div className="relative h-screen bg-background text-white">
            {state === 'idle' && (
                <div className="flex flex-col items-center justify-center h-full">
                    <button onClick={start} className="btn-gold text-2xl">
                        Go Live
                    </button>
                </div>
            )}

            {state === 'countdown' && (
                <div className="flex items-center justify-center h-full">
                    <span className="text-9xl font-heading text-gold countdown">
                </div>
            )}

            {state === 'live' && (
                <>
                    <HealthBar {...health} />
                    <div className="absolute top-12 right-4 text-cyan">
                        Viewers: {viewerCount}
                    </div>
                    <div className="absolute top-12 left-4 text-gold">
                        {timer}s
                    </div>
                    <div className="h-full grid grid-cols-3">
                        <div className="col-span-2 flex flex-col">
                            <GuestGrid guests={[]} />
                        </div>
                        <div className="col-span-1">
                            <ChatPanel messages={[]} streamId="demo" />
                        </div>
                    </div>
                    <SwannyBubble streamId="demo" />
                    <button
                        className="fixed bottom-4 left-4 btn-secondary"
                        onClick={end}
                    >
                        End Stream
                    </button>
                </>
            )}

            {state === 'ended' && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="bg-background p-8 rounded-lg text-center">
                        <h2 className="text-4xl font-heading text-gold">
                            Stream Ended
                        </h2>
                        <p>Viewers: {viewerCount}</p>
                        <p>Duration: {timer}s</p>
                        <p className="text-2xl font-heading text-gold">
                            Creator earned: $0.00 (90%)
                        </p>
                        <button
                            className="mt-4 btn-primary"
                            onClick={() => setState('idle')}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(<App />);
}