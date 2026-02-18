import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monetization } from '@/lib/monetization';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

export function useWallet() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const balanceQuery = useQuery({
    queryKey: ['wallet-balance', user?.id],
    queryFn: () => monetization.getWalletBalance(user!.id),
    enabled: !!user,
  });

  const transactionsQuery = useQuery({
    queryKey: ['wallet-transactions', user?.id],
    queryFn: () => monetization.getWalletTransactions(user!.id),
    enabled: !!user,
  });

  const sendTipMutation = useMutation({
    mutationFn: (params: {
      recipientId: string;
      roomId?: string;
      amount: number;
      message?: string;
      isAnonymous?: boolean;
    }) =>
      monetization.sendTip({
        senderId: user!.id,
        ...params,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      refreshProfile();
      toast({
        title: 'Tip Sent!',
        description: `You sent ${formatCurrency(variables.amount)}`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send tip',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addFundsMutation = useMutation({
    mutationFn: (amount: number) => monetization.addFunds(user!.id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      refreshProfile();
      toast({
        title: 'Funds Added',
        description: 'Your wallet has been topped up.',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add funds',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    balance: balanceQuery.data ?? 0,
    transactions: transactionsQuery.data ?? [],
    isLoading: balanceQuery.isLoading || transactionsQuery.isLoading,
    sendTip: sendTipMutation.mutate,
    addFunds: addFundsMutation.mutate,
    isSendingTip: sendTipMutation.isPending,
    isAddingFunds: addFundsMutation.isPending,
  };
}
