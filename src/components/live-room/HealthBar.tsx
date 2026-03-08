import React from 'react';

export interface HealthProps {
    bitrate: number;
    fps: number;
    latency: number;
}

export const HealthBar: React.FC<HealthProps> = ({ bitrate, fps, latency }) => {
    const color =
        bitrate >= 3000 ? 'text-green-400' : bitrate >= 1500 ? 'text-yellow-400' : 'text-red-400';
    return (
        <div className="fixed top-0 left-0 right-0 bg-black/50 p-2 flex justify-between text-sm">
            <span className={color}>Bitrate: {bitrate} kbps</span>
            <span>FPS: {fps}</span>
            <span>Latency: {latency} ms</span>
        </div>
    );
};