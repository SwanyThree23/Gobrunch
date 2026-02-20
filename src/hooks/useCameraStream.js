import { useState, useEffect, useRef, useCallback } from 'react';

// Permission state machine: idle → pending → granted | denied | unavailable
const PERM_STATES = { IDLE: 'idle', PENDING: 'pending', GRANTED: 'granted', DENIED: 'denied', UNAVAILABLE: 'unavailable' };

export function useCameraStream() {
  const [permState, setPermState] = useState(PERM_STATES.IDLE);
  const [stream, setStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [devices, setDevices] = useState({ video: [], audio: [] });
  const [activeDevices, setActiveDevices] = useState({ videoId: null, audioId: null });
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const videoRef = useRef(null);

  // Check browser support
  const isSupported = typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia;
  const isDisplaySupported = typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getDisplayMedia;

  // Enumerate devices after getting permission
  const enumerateDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        video: all.filter(d => d.kind === 'videoinput'),
        audio: all.filter(d => d.kind === 'audioinput'),
      });
    } catch (e) {
      console.warn('Device enumeration failed:', e);
    }
  }, []);

  // Request camera + mic
  const requestCamera = useCallback(async (videoDeviceId, audioDeviceId) => {
    if (!isSupported) {
      setPermState(PERM_STATES.UNAVAILABLE);
      setError('Camera access is not supported in this browser.');
      return;
    }

    setPermState(PERM_STATES.PENDING);
    setError(null);

    try {
      const constraints = {
        video: videoDeviceId
          ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: audioDeviceId
          ? { deviceId: { exact: audioDeviceId }, echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(prev => {
        if (prev) prev.getTracks().forEach(t => t.stop());
        return mediaStream;
      });
      setPermState(PERM_STATES.GRANTED);
      setActiveDevices({
        videoId: videoDeviceId || mediaStream.getVideoTracks()[0]?.getSettings().deviceId,
        audioId: audioDeviceId || mediaStream.getAudioTracks()[0]?.getSettings().deviceId,
      });
      await enumerateDevices();

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setPermState(err.name === 'NotAllowedError' ? PERM_STATES.DENIED : PERM_STATES.UNAVAILABLE);
      setError(err.message || 'Failed to access camera.');
    }
  }, [isSupported, enumerateDevices]);

  // Switch camera device
  const switchCamera = useCallback(async deviceId => {
    if (!stream) return;
    await requestCamera(deviceId, activeDevices.audioId);
  }, [stream, activeDevices.audioId, requestCamera]);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    if (!isDisplaySupported) {
      setError('Screen sharing is not supported in this browser.');
      return;
    }
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: true,
      });
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        setScreenStream(null);
        setIsScreenSharing(false);
      });
      setScreenStream(displayStream);
      setIsScreenSharing(true);
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        setError('Screen share failed: ' + err.message);
      }
    }
  }, [isDisplaySupported]);

  // Stop screen share
  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
    }
    setIsScreenSharing(false);
  }, [screenStream]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!stream) return;
    stream.getAudioTracks().forEach(t => {
      t.enabled = isMuted;
    });
    setIsMuted(prev => !prev);
  }, [stream, isMuted]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (!stream) return;
    stream.getVideoTracks().forEach(t => {
      t.enabled = isCamOff;
    });
    setIsCamOff(prev => !prev);
  }, [stream, isCamOff]);

  // Stop all
  const stopAll = useCallback(() => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (screenStream) screenStream.getTracks().forEach(t => t.stop());
    setStream(null);
    setScreenStream(null);
    setPermState(PERM_STATES.IDLE);
    setIsScreenSharing(false);
  }, [stream, screenStream]);

  // Attach stream to video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = isScreenSharing ? screenStream : stream;
    }
  }, [stream, screenStream, isScreenSharing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (screenStream) screenStream.getTracks().forEach(t => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    permState,
    PERM_STATES,
    stream,
    screenStream,
    devices,
    activeDevices,
    error,
    isMuted,
    isCamOff,
    isScreenSharing,
    isSupported,
    isDisplaySupported,
    videoRef,
    requestCamera,
    switchCamera,
    startScreenShare,
    stopScreenShare,
    toggleMute,
    toggleCamera,
    stopAll,
  };
}

export default useCameraStream;
