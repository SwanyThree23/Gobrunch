import { useState, useEffect, useRef, useCallback } from 'react';

export function useAudioAnalyzer(stream, { bars = 26, fftSize = 256 } = {}) {
  const [levels, setLevels] = useState(Array(bars).fill(0));
  const [peakLevel, setPeakLevel] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const ctxRef = useRef(null);
  const analyzerRef = useRef(null);
  const sourceRef = useRef(null);
  const rafRef = useRef(null);

  const start = useCallback(() => {
    if (!stream || !stream.getAudioTracks().length) return;
    if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = fftSize;
      analyzer.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyzer);

      ctxRef.current = ctx;
      analyzerRef.current = analyzer;
      sourceRef.current = source;

      const bufLen = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufLen);

      const tick = () => {
        if (!analyzerRef.current) return;
        analyzerRef.current.getByteFrequencyData(dataArray);

        const step = Math.floor(bufLen / bars);
        const newLevels = Array.from({ length: bars }, (_, i) => {
          const start = i * step;
          const slice = dataArray.slice(start, start + step);
          const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
          return avg / 255; // normalize 0-1
        });

        const peak = Math.max(...newLevels);
        setLevels(newLevels);
        setPeakLevel(peak);
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
      setIsActive(true);
    } catch (e) {
      console.warn('AudioAnalyzer failed to start:', e);
    }
  }, [stream, bars, fftSize]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch {}
    }
    if (ctxRef.current) {
      try { ctxRef.current.close(); } catch {}
    }
    ctxRef.current = null;
    analyzerRef.current = null;
    sourceRef.current = null;
    setLevels(Array(bars).fill(0));
    setPeakLevel(0);
    setIsActive(false);
  }, [bars]);

  useEffect(() => {
    if (stream) {
      start();
    } else {
      stop();
    }
    return stop;
  }, [stream]); // eslint-disable-line react-hooks/exhaustive-deps

  return { levels, peakLevel, isActive };
}

export default useAudioAnalyzer;
