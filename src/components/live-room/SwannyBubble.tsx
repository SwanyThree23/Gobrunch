import React, { useEffect, useState } from 'react';

interface SwannyProps {
    streamId: string;
}

export const SwannyBubble: React.FC<SwannyProps> = ({ streamId }) => {
    const [message, setMessage] = useState('');

    // placeholder: messages would be fetched via websocket
    useEffect(() => {
        // simulate
        const id = setInterval(() => {
            setMessage('Swanny hype message');
        }, 15000);
        return () => clearInterval(id);
    }, [streamId]);

    return (
        <div className="fixed bottom-4 right-4 bg-black/60 p-3 rounded-full">{message}</div>
    );
};