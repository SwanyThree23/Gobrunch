import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { moderation } from '@/lib/moderation';
import { useAuth } from '@/hooks/useAuth';
import { Flag, AlertTriangle } from 'lucide-react';

interface ReportDialogProps {
  reportedUserId: string;
  reportedUserName: string;
  roomId?: string;
  communityId?: string;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'hate_speech', label: 'Hate Speech' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Other' },
] as const;

export const ReportDialog: React.FC<ReportDialogProps> = ({ reportedUserId, reportedUserName, roomId, communityId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason || !description.trim()) return;
    setSubmitting(true);
    try {
      await moderation.createReport({ reporterId: user.id, reportedUserId, roomId, communityId, reason: reason as any, description: description.trim() });
      toast({ title: 'Report Submitted', description: 'We will review your report.', variant: 'success' });
      setOpen(false);
      setReason('');
      setDescription('');
    } catch (error: any) {
      toast({ title: 'Failed to submit report', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive"><Flag className="w-4 h-4" />Report</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" />Report {reportedUserName}</DialogTitle>
          <DialogDescription>All reports are reviewed by our moderation team.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Reason</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
              <SelectContent>{REPORT_REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" rows={4} placeholder="Describe what happened..." maxLength={1000} />
            <p className="text-xs text-muted-foreground mt-1">{description.length}/1000 characters</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={submitting || !reason || !description.trim()}>{submitting ? 'Submitting...' : 'Submit Report'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
