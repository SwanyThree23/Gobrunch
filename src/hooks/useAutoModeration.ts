import { useState, useEffect, useCallback } from 'react';
import { moderation } from '@/lib/moderation';
import { useAuth } from './useAuth';
import type { RoomParticipant } from '@/types/database';

export function useAutoModeration(roomId: string) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [autoMutedUsers, setAutoMutedUsers] = useState<Set<string>>(new Set());

  const loadParticipants = useCallback(async () => {
    try {
      const data = await moderation.getRoomParticipants(roomId);
      setParticipants(data);
      const muted = new Set(
        data.filter((p) => p.auto_muted).map((p) => p.user_id)
      );
      setAutoMutedUsers(muted);
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  }, [roomId]);

  useEffect(() => {
    loadParticipants();
    const interval = setInterval(loadParticipants, 5000);
    return () => clearInterval(interval);
  }, [loadParticipants]);

  const reportSpamActivity = useCallback(
    async (userId: string, messageCount = 1) => {
      try {
        const wasMuted = await moderation.checkAndAutoMute(roomId, userId, messageCount);
        if (wasMuted) {
          setAutoMutedUsers((prev) => new Set(prev).add(userId));
        }
        return wasMuted;
      } catch (error) {
        console.error('Failed to report spam:', error);
        return false;
      }
    },
    [roomId]
  );

  const resetUser = useCallback(
    async (userId: string) => {
      try {
        await moderation.resetSpamScore(roomId, userId);
        setAutoMutedUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      } catch (error) {
        console.error('Failed to reset user:', error);
      }
    },
    [roomId]
  );

  return {
    participants,
    autoMutedUsers,
    reportSpamActivity,
    resetUser,
    refreshParticipants: loadParticipants,
  };
}
