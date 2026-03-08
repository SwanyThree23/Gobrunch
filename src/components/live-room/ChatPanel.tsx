import React from 'react';
import { ChatInput } from './ChatInput';

export const ChatPanel: React.FC<{ messages: any[]; streamId: string }> = ({ messages, streamId }) => (
    <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-2">
            {messages.map((m, idx) => (
                <div key={idx} className="mb-1">
                    <span className="font-mono text-xs text-cyan">{m.sender}</span>: <span>{m.text}</span>
                </div>
            ))}
        </div>
        <ChatInput streamId={streamId} />
    </div>
);