import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { moderation } from '@/lib/moderation';
import { useAuth } from '@/hooks/useAuth';
import { Ban } from 'lucide-react';

interface BanUserDialogProps {
  userId: string;
  userName: string;
  communityId?: string;
  roomId?: string;
  onBanned?: () => void;
}

export const BanUserDialog: React.FC<BanUserDialogProps> = ({ userId, userName, communityId, roomId, onBanned }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [banType, setBanType] = useState<'temporary' | 'permanent'>('temporary');
  const [duration, setDuration] = useState('24');
  const [submitting, setSubmitting] = useState(false);

  const handleBan = async () => {
    if (!user || !reason.trim()) return;
    setSubmitting(true);
    try {
      let expiresAt: string | undefined;
      if (banType === 'temporary') {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + parseInt(duration));
        expiresAt = expiry.toISOString();
      }
      await moderation.banUser({ userId, bannedBy: user.id, communityId, roomId, reason: reason.trim(), type: banType, expiresAt });
      toast({ title: 'User Banned', description: `${userName} has been ${banType === 'permanent' ? 'permanently' : 'temporarily'} banned.`, variant: 'success' });
      setOpen(false);
      setReason('');
      onBanned?.();
    } catch (error: any) {
      toast({ title: 'Failed to ban user', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2"><Ban className="w-4 h-4" />Ban</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Ban className="w-5 h-5 text-destructive" />Ban {userName}</DialogTitle>
          <DialogDescription>This will prevent the user from participating.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Ban Type</label>
            <Select value={banType} onValueChange={(v) => setBanType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="temporary">Temporary</SelectItem><SelectItem value="permanent">Permanent</SelectItem></SelectContent>
            </Select>
          </div>
          {banType === 'temporary' && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Duration</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem><SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem><SelectItem value="72">3 days</SelectItem>
                  <SelectItem value="168">1 week</SelectItem><SelectItem value="720">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" rows={3} placeholder="Reason for the ban..." maxLength={500} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleBan} disabled={submitting || !reason.trim()}>{submitting ? 'Processing...' : 'Confirm Ban'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
