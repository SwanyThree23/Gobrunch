import React from 'react';
import { useRouter } from 'next/router';

export default function StreamPage() {
    const router = useRouter();
    const { id } = router.query;
    return (
        <div className="p-6">
            <h1 className="text-3xl font-heading">Stream {id}</h1>
            <p>Live room view with video and chat.</p>
        </div>
    );
}