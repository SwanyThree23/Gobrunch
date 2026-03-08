import React from 'react';

export const ChatPanel: React.FC<{ messages: any[] }> = ({ messages }) => (
    <div className="h-full overflow-y-auto p-2">
        {messages.map((m, idx) => (
            <div key={idx} className="mb-1">
                <span className="font-mono text-xs text-cyan">{m.sender}</span>: <span>{m.text}</span>
            </div>
        ))}
    </div>
);