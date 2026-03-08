import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { HealthBar } from '../../components/live-room/HealthBar';
import { GuestGrid } from '../../components/live-room/GuestGrid';
import { ChatPanel } from '../../components/live-room/ChatPanel';
import { SwannyBubble } from '../../components/live-room/SwannyBubble';
import { TipButton } from '../../components/TipButton';

export default function StreamPage() {
    const router = useRouter();
    const { id } = router.query;
    const [health, setHealth] = useState({ bitrate: 0, fps: 0, latency: 0 });
    const [viewerCount, setViewerCount] = useState<number>(0);
    const [timer, setTimer] = useState<number>(0);

    useEffect(() => {
        if (!id) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/streams/health?streamId=${id}`);
                const data = await res.json();
                setHealth({ bitrate: data[0]?.revenue || 0, fps: 30, latency: 50 });
                setViewerCount(v => v + Math.floor(Math.random() * 2));
                setTimer(t => t + 1);
            } catch { }
        }, 1000);
        return () => clearInterval(interval);
    }, [id]);

    return (
        <div className="relative h-screen bg-background text-white">
            <HealthBar {...health} />
            <div className="absolute top-12 right-4 text-cyan">Viewers: {viewerCount}</div>
            <div className="absolute top-12 left-4 text-gold">{timer}s</div>
            <div className="h-full grid grid-cols-3">
                <div className="col-span-2 flex flex-col">
                    <GuestGrid guests={[]} />
                </div>
                <div className="col-span-1">
                    <div className="flex flex-col h-full">
                        <ChatPanel messages={[]} streamId={String(id)} />
                        <div className="p-2">
                            <TipButton streamId={String(id)} creatorStripeAccountId="acct_demo" />
                        </div>
                    </div>
                </div>
            </div>
            <SwannyBubble streamId={String(id)} />
        </div>
    );
}