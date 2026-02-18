import { supabase } from './supabase';
import type { ModerationReport, UserBan, UserWarning, RoomParticipant } from '@/types/database';

export const moderation = {
  // ===== REPORTS =====
  async createReport(report: {
    reporterId: string;
    reportedUserId: string;
    roomId?: string;
    communityId?: string;
    reason: ModerationReport['reason'];
    description: string;
    evidenceUrls?: string[];
  }): Promise<ModerationReport> {
    const { data, error } = await supabase
      .from('moderation_reports')
      .insert({
        reporter_id: report.reporterId,
        reported_user_id: report.reportedUserId,
        room_id: report.roomId || null,
        community_id: report.communityId || null,
        reason: report.reason,
        description: report.description,
        evidence_urls: report.evidenceUrls || [],
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getReports(filters?: {
    status?: ModerationReport['status'];
    communityId?: string;
  }): Promise<ModerationReport[]> {
    let query = supabase
      .from('moderation_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.communityId) query = query.eq('community_id', filters.communityId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async updateReport(
    reportId: string,
    updates: { status: ModerationReport['status']; reviewedBy: string; resolutionNote?: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('moderation_reports')
      .update({
        status: updates.status,
        reviewed_by: updates.reviewedBy,
        resolution_note: updates.resolutionNote || null,
      })
      .eq('id', reportId);
    if (error) throw error;
  },

  async getReportStats(): Promise<{
    pending: number;
    reviewing: number;
    resolved: number;
    dismissed: number;
    total: number;
  }> {
    const { data, error } = await supabase.from('moderation_reports').select('status');
    if (error) throw error;
    const stats = { pending: 0, reviewing: 0, resolved: 0, dismissed: 0, total: 0 };
    (data || []).forEach((r) => {
      stats[r.status as keyof Omit<typeof stats, 'total'>]++;
      stats.total++;
    });
    return stats;
  },

  // ===== BANS =====
  async banUser(ban: {
    userId: string;
    bannedBy: string;
    communityId?: string;
    roomId?: string;
    reason: string;
    type: 'temporary' | 'permanent';
    expiresAt?: string;
  }): Promise<UserBan> {
    const { data, error } = await supabase
      .from('user_bans')
      .insert({
        user_id: ban.userId,
        banned_by: ban.bannedBy,
        community_id: ban.communityId || null,
        room_id: ban.roomId || null,
        reason: ban.reason,
        type: ban.type,
        expires_at: ban.expiresAt || null,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async unbanUser(banId: string): Promise<void> {
    const { error } = await supabase
      .from('user_bans')
      .update({ is_active: false })
      .eq('id', banId);
    if (error) throw error;
  },

  async getActiveBans(filters?: { userId?: string; communityId?: string }): Promise<UserBan[]> {
    let query = supabase
      .from('user_bans')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (filters?.userId) query = query.eq('user_id', filters.userId);
    if (filters?.communityId) query = query.eq('community_id', filters.communityId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async isUserBanned(userId: string, communityId?: string): Promise<boolean> {
    let query = supabase
      .from('user_bans')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);
    if (communityId) query = query.eq('community_id', communityId);
    const { data } = await query;
    return (data || []).length > 0;
  },

  // ===== WARNINGS =====
  async issueWarning(warning: {
    userId: string;
    issuedBy: string;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }): Promise<UserWarning> {
    const { data, error } = await supabase
      .from('user_warnings')
      .insert({
        user_id: warning.userId,
        issued_by: warning.issuedBy,
        reason: warning.reason,
        severity: warning.severity,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getUserWarnings(userId: string): Promise<UserWarning[]> {
    const { data, error } = await supabase
      .from('user_warnings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async acknowledgeWarning(warningId: string): Promise<void> {
    const { error } = await supabase
      .from('user_warnings')
      .update({ acknowledged: true })
      .eq('id', warningId);
    if (error) throw error;
  },

  // ===== AUTO-MODERATION =====
  async checkAndAutoMute(roomId: string, userId: string, messageCount?: number): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_spam_and_mute', {
      p_room_id: roomId,
      p_user_id: userId,
      p_message_count: messageCount || 1,
    });
    if (error) throw error;
    return data;
  },

  async resetSpamScore(roomId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('room_participants')
      .update({ spam_score: 0, auto_muted: false, is_muted: false })
      .eq('room_id', roomId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async getRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
    const { data, error } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async muteParticipant(roomId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('room_participants')
      .update({ is_muted: true })
      .eq('room_id', roomId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async unmuteParticipant(roomId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('room_participants')
      .update({ is_muted: false, auto_muted: false })
      .eq('room_id', roomId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async removeParticipant(roomId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);
    if (error) throw error;
  },
};
