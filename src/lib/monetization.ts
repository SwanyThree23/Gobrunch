import { supabase } from './supabase';
import type { Tip, SubscriptionTier, Subscription, VirtualGood, UserPurchase, WalletTransaction } from '@/types/database';

export const monetization = {
  // ===== TIPPING =====
  async sendTip(params: {
    senderId: string;
    recipientId: string;
    roomId?: string;
    amount: number;
    message?: string;
    isAnonymous?: boolean;
  }): Promise<string> {
    const { data, error } = await supabase.rpc('process_tip', {
      p_sender_id: params.senderId,
      p_recipient_id: params.recipientId,
      p_room_id: params.roomId || null,
      p_amount: params.amount,
      p_message: params.message || null,
      p_is_anonymous: params.isAnonymous || false,
    });
    if (error) throw error;
    return data;
  },

  async getTipsReceived(userId: string): Promise<Tip[]> {
    const { data, error } = await supabase
      .from('tips')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getTipsSent(userId: string): Promise<Tip[]> {
    const { data, error } = await supabase
      .from('tips')
      .select('*')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getRoomTips(roomId: string): Promise<Tip[]> {
    const { data, error } = await supabase
      .from('tips')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // ===== SUBSCRIPTIONS =====
  async getSubscriptionTiers(communityId: string): Promise<SubscriptionTier[]> {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('community_id', communityId)
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createSubscriptionTier(tier: Omit<SubscriptionTier, 'id' | 'created_at'>): Promise<SubscriptionTier> {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .insert(tier)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async subscribe(params: {
    userId: string;
    tierId: string;
    communityId: string;
    billingCycle: 'monthly' | 'yearly';
  }): Promise<Subscription> {
    const now = new Date();
    const periodEnd = new Date(now);
    if (params.billingCycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: params.userId,
        tier_id: params.tierId,
        community_id: params.communityId,
        status: 'active',
        billing_cycle: params.billingCycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', subscriptionId);
    if (error) throw error;
  },

  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // ===== VIRTUAL GOODS =====
  async getVirtualGoods(category?: string): Promise<VirtualGood[]> {
    let query = supabase
      .from('virtual_goods')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async purchaseVirtualGood(userId: string, goodId: string): Promise<string> {
    const { data, error } = await supabase.rpc('purchase_virtual_good', {
      p_user_id: userId,
      p_good_id: goodId,
    });
    if (error) throw error;
    return data;
  },

  async getUserPurchases(userId: string): Promise<UserPurchase[]> {
    const { data, error } = await supabase
      .from('user_purchases')
      .select('*')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async toggleEquipGood(purchaseId: string, equipped: boolean): Promise<void> {
    const { error } = await supabase
      .from('user_purchases')
      .update({ is_equipped: equipped })
      .eq('id', purchaseId);
    if (error) throw error;
  },

  // ===== WALLET =====
  async getWalletBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data?.wallet_balance || 0;
  },

  async getWalletTransactions(userId: string, limit = 50): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async addFunds(userId: string, amount: number): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', userId)
      .single();

    const newBalance = (profile?.wallet_balance || 0) + amount;

    await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', userId);

    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      type: 'deposit',
      amount,
      balance_after: newBalance,
      description: 'Funds added to wallet',
    });
  },
};
