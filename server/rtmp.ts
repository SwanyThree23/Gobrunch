import ffmpeg from 'fluent-ffmpeg';

// minimal helper to forward a local WebRTC stream to RTMP endpoints
export function forwardToRtmp(inputUrl: string, outputs: string[]) {
    let command = ffmpeg(inputUrl);
    outputs.forEach(o => {
        command = command.output(o).addOptions(['-c:v copy', '-c:a aac']);
    });
    command.on('start', cmd => console.log('ffmpeg started', cmd));
    command.on('error', err => console.error('ffmpeg error', err));
    command.on('end', () => console.log('ffmpeg ended'));
    command.run();
}
