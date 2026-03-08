import './socket';
import { createMediasoupWorker } from './mediasoup';

async function main() {
    const worker = await createMediasoupWorker();
    console.log('mediasoup worker created', worker.pid);
    // other initialization (rtmp, http endpoints) would go here.
}

main().catch(err => {
    console.error('server init error', err);
    process.exit(1);
});