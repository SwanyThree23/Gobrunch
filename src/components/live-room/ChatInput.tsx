import React, { useState } from 'react';
import { Button } from '../../components/Button';

interface ChatInputProps {
    streamId: string;
    senderId?: string;
    onSent?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ streamId, senderId, onSent }) => {
    const [text, setText] = useState('');

    const send = async () => {
        if (!text.trim()) return;
        await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ streamId, senderId, content: { text } })
        });
        setText('');
        onSent?.();
    };

    return (
        <div className="flex gap-2 p-2">
            <input
                className="input-field flex-1"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type a message"
            />
            <Button onClick={send} variant="primary">
                Send
            </Button>
        </div>
    );
};