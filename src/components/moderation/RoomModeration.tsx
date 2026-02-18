import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { moderation } from '@/lib/moderation';
import { ReportDialog } from './ReportDialog';
import { BanUserDialog } from './BanUserDialog';
import type { RoomParticipant } from '@/types/database';
import { MicOff, Hand, UserMinus, AlertTriangle, Shield, Volume2, VolumeX, Bot } from 'lucide-react';

interface RoomModerationProps {
  roomId: string;
  isHost: boolean;
}

export const RoomModeration: React.FC<RoomModerationProps> = ({ roomId, isHost }) => {
  const { toast } = useToast();
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipants();
    const interval = setInterval(loadParticipants, 10000);
    return () => clearInterval(interval);
  }, [roomId]);

  const loadParticipants = async () => {
    try { setParticipants(await moderation.getRoomParticipants(roomId)); }
    catch (error) { console.error('Failed to load participants:', error); }
    finally { setLoading(false); }
  };

  const handleMute = async (userId: string) => {
    try { await moderation.muteParticipant(roomId, userId); toast({ title: 'User muted' }); loadParticipants(); }
    catch (error: any) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
  };

  const handleUnmute = async (userId: string) => {
    try { await moderation.unmuteParticipant(roomId, userId); toast({ title: 'User unmuted' }); loadParticipants(); }
    catch (error: any) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
  };

  const handleRemove = async (userId: string) => {
    if (!window.confirm('Remove this participant?')) return;
    try { await moderation.removeParticipant(roomId, userId); toast({ title: 'Participant removed' }); loadParticipants(); }
    catch (error: any) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
  };

  const handleResetSpam = async (userId: string) => {
    try { await moderation.resetSpamScore(roomId, userId); toast({ title: 'Spam score reset' }); loadParticipants(); }
    catch (error: any) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
  };

  const roleOrder: Record<string, number> = { host: 0, 'co-host': 1, speaker: 2, listener: 3 };
  const sorted = [...participants].sort((a, b) => (roleOrder[a.role] || 3) - (roleOrder[b.role] || 3));

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Shield className="w-5 h-5" />Participants ({participants.length})</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="flex items-center gap-3 animate-pulse"><div className="w-8 h-8 bg-muted rounded-full" /><div className="flex-1"><div className="h-4 bg-muted rounded w-1/3" /></div></div>)}</div>
        ) : (
          <div className="space-y-2">
            {sorted.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{p.user_id.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{p.user_id.slice(0, 8)}...</span>
                    <Badge variant="outline" className="text-[10px]">{p.role}</Badge>
                    {p.is_muted && <MicOff className="w-3 h-3 text-destructive" />}
                    {p.auto_muted && <Bot className="w-3 h-3 text-orange-500" title="Auto-muted for spam" />}
                    {p.is_hand_raised && <Hand className="w-3 h-3 text-yellow-500" />}
                  </div>
                  {p.spam_score > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3 text-orange-500" />
                      <span className="text-[10px] text-orange-500">Spam: {p.spam_score}</span>
                    </div>
                  )}
                </div>
                {isHost && p.role !== 'host' && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => p.is_muted ? handleUnmute(p.user_id) : handleMute(p.user_id)} title={p.is_muted ? 'Unmute' : 'Mute'}>
                      {p.is_muted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </Button>
                    {p.auto_muted && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleResetSpam(p.user_id)} title="Reset spam"><Bot className="w-3.5 h-3.5" /></Button>}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(p.user_id)} title="Remove"><UserMinus className="w-3.5 h-3.5" /></Button>
                    <ReportDialog reportedUserId={p.user_id} reportedUserName={p.user_id.slice(0, 8)} roomId={roomId} />
                    <BanUserDialog userId={p.user_id} userName={p.user_id.slice(0, 8)} roomId={roomId} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
