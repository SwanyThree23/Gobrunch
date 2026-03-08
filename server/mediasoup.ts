import { Worker } from 'mediasoup';

// simple mediasoup setup placeholder; full implementation would create router,
// transports and handle WebRTC signaling.

export async function createMediasoupWorker(): Promise<Worker> {
    const worker = await Worker.create({ rtcMinPort: 10000, rtcMaxPort: 10100 });
    worker.on('died', () => {
        console.error('mediasoup worker died, exiting');
        process.exit(1);
    });
    return worker;
}
