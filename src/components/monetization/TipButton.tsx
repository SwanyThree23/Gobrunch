import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { monetization } from '@/lib/monetization';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { Heart, DollarSign, MessageSquare, Eye, EyeOff } from 'lucide-react';

interface TipButtonProps {
  recipientId: string;
  recipientName: string;
  roomId?: string;
}

const QUICK_AMOUNTS = [1, 5, 10, 25, 50, 100];

export const TipButton: React.FC<TipButtonProps> = ({ recipientId, recipientName, roomId }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(5);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSendTip = async () => {
    if (!user || !amount || amount <= 0) return;
    if ((profile?.wallet_balance || 0) < amount) {
      toast({ title: 'Insufficient Balance', description: 'Please add funds to your wallet first.', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      await monetization.sendTip({
        senderId: user.id, recipientId, roomId, amount,
        message: message || undefined, isAnonymous,
      });
      toast({ title: 'Tip Sent!', description: `You sent ${formatCurrency(amount)} to ${recipientName}`, variant: 'success' });
      setOpen(false);
      setAmount(5);
      setMessage('');
    } catch (error: any) {
      toast({ title: 'Failed to send tip', description: error.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Heart className="w-4 h-4 text-pink-500" />
          Tip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Send a Tip to {recipientName}
          </DialogTitle>
          <DialogDescription>Show your appreciation. Platform fee: 10%.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Your Balance</span>
            <span className="font-semibold">{formatCurrency(profile?.wallet_balance || 0)}</span>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Quick Amount</label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((qa) => (
                <Button key={qa} variant={amount === qa ? 'default' : 'outline'} size="sm" onClick={() => setAmount(qa)}>
                  {formatCurrency(qa)}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Custom Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="pl-10" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Message (optional)</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="flex w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" rows={2} placeholder="Add a message..." maxLength={200} />
            </div>
          </div>
          <button onClick={() => setIsAnonymous(!isAnonymous)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            {isAnonymous ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isAnonymous ? 'Sending anonymously' : 'Send with your name'}
          </button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSendTip} disabled={sending || !amount || amount <= 0} className="gap-2">
            <Heart className="w-4 h-4" />
            {sending ? 'Sending...' : `Send ${formatCurrency(amount)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
