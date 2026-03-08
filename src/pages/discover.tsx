import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

interface StreamRow {
    id: string;
    title: string;
    creator_id: string;
}

export default function Discover() {
    const [streams, setStreams] = useState<StreamRow[]>([]);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase
                .from('streams')
                .select('id,title,creator_id')
                .eq('status', 'live');
            setStreams(data || []);
        };
        fetch();

        const sub = supabase
            .channel('public:streams')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'streams' }, payload => {
                if (payload.new?.status === 'live') {
                    setStreams(s => [...s, payload.new]);
                } else if (payload.old?.status === 'live' && payload.new?.status !== 'live') {
                    setStreams(s => s.filter(x => x.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(sub);
        };
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-3xl font-heading mb-4">Discover Live Creators</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {streams.map(stream => (
                    <Link key={stream.id} href={`/stream/${stream.id}`}>
                        <a className="glass-card p-4 hover:shadow-lg">
                            <h2 className="font-heading text-xl">{stream.title}</h2>
                        </a>
                    </Link>
                ))}
                {streams.length === 0 && <p>No live streams right now.</p>}
            </div>
        </div>
    );
}