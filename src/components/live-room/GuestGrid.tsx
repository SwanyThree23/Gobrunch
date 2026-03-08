import React from 'react';

interface Guest {
    id: string;
    name: string;
    muted: boolean;
    cameraOff: boolean;
}

export const GuestGrid: React.FC<{ guests: Guest[] }> = ({ guests }) => {
    const columns = guests.length <= 1 ? 'grid-cols-1' : guests.length <= 2 ? 'grid-cols-2' : guests.length <= 4 ? 'grid-cols-2' : 'grid-cols-4';
    return (
        <div className={`grid ${columns} gap-2`}>{guests.map(g => <div key={g.id} className="bg-black/30 p-2 rounded">{g.name}</div>)}</div>
    );
};