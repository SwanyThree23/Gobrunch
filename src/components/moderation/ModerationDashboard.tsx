import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { moderation } from '@/lib/moderation';
import { useAuth } from '@/hooks/useAuth';
import { formatRelativeTime } from '@/lib/utils';
import type { ModerationReport, UserBan } from '@/types/database';
import { Shield, Flag, Ban, CheckCircle, XCircle, Eye, Clock, Search, Filter } from 'lucide-react';

const statusColors: Record<string, string> = { pending: 'warning', reviewing: 'default', resolved: 'success', dismissed: 'secondary' };
const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />, reviewing: <Eye className="w-4 h-4" />,
  resolved: <CheckCircle className="w-4 h-4" />, dismissed: <XCircle className="w-4 h-4" />,
};

export const ModerationDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [bans, setBans] = useState<UserBan[]>([]);
  const [stats, setStats] = useState({ pending: 0, reviewing: 0, resolved: 0, dismissed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, b, s] = await Promise.all([
        moderation.getReports(statusFilter !== 'all' ? { status: statusFilter as any } : undefined),
        moderation.getActiveBans(),
        moderation.getReportStats(),
      ]);
      setReports(r); setBans(b); setStats(s);
    } catch (error) { console.error('Failed to load moderation data:', error); }
    finally { setLoading(false); }
  };

  const handleResolveReport = async (status: 'resolved' | 'dismissed') => {
    if (!selectedReport || !user) return;
    setProcessing(true);
    try {
      await moderation.updateReport(selectedReport.id, { status, reviewedBy: user.id, resolutionNote: resolutionNote || undefined });
      toast({ title: `Report ${status}`, variant: 'success' });
      setSelectedReport(null); setResolutionNote(''); loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally { setProcessing(false); }
  };

  const handleUnban = async (banId: string) => {
    try { await moderation.unbanUser(banId); toast({ title: 'User unbanned', variant: 'success' }); loadData(); }
    catch (error: any) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
  };

  const filteredReports = reports.filter((r) =>
    searchQuery ? r.description.toLowerCase().includes(searchQuery.toLowerCase()) || r.reason.includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="w-8 h-8" />Moderation Dashboard</h1>
        <p className="text-muted-foreground mt-1">Review reports and manage user behavior</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, color: '' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-500' },
          { label: 'Reviewing', value: stats.reviewing, color: 'text-blue-500' },
          { label: 'Resolved', value: stats.resolved, color: 'text-green-500' },
          { label: 'Dismissed', value: stats.dismissed, color: 'text-gray-500' },
        ].map((s) => (
          <Card key={s.label}><CardContent className="pt-4 pb-4 text-center"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports" className="gap-2"><Flag className="w-4 h-4" />Reports ({reports.length})</TabsTrigger>
          <TabsTrigger value="bans" className="gap-2"><Ban className="w-4 h-4" />Active Bans ({bans.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search reports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem><SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-4 bg-muted rounded w-1/3 mb-2" /><div className="h-3 bg-muted rounded w-2/3" /></CardContent></Card>)}</div>
          ) : filteredReports.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Flag className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No reports found</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={statusColors[report.status] as any}><span className="flex items-center gap-1">{statusIcons[report.status]}{report.status}</span></Badge>
                          <Badge variant="outline">{report.reason.replace('_', ' ')}</Badge>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(report.created_at)}</span>
                        </div>
                        <p className="text-sm mt-2">{report.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Reporter: {report.reporter_id.slice(0, 8)}...</span>
                          <span>Reported: {report.reported_user_id.slice(0, 8)}...</span>
                        </div>
                      </div>
                      {(report.status === 'pending' || report.status === 'reviewing') && (
                        <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}><Eye className="w-4 h-4 mr-1" />Review</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bans" className="space-y-3">
          {bans.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Ban className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No active bans</p></CardContent></Card>
          ) : bans.map((ban) => (
            <Card key={ban.id}><CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={ban.type === 'permanent' ? 'destructive' : 'warning'}>{ban.type}</Badge>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(ban.created_at)}</span>
                  </div>
                  <p className="text-sm font-medium">User: {ban.user_id.slice(0, 8)}...</p>
                  <p className="text-sm text-muted-foreground mt-1">Reason: {ban.reason}</p>
                  {ban.expires_at && <p className="text-xs text-muted-foreground mt-1">Expires: {new Date(ban.expires_at).toLocaleDateString()}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={() => handleUnban(ban.id)}>Unban</Button>
              </div>
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Report</DialogTitle></DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div><p className="text-sm font-medium">Reason</p><Badge variant="outline" className="mt-1">{selectedReport.reason.replace('_', ' ')}</Badge></div>
              <div><p className="text-sm font-medium">Description</p><p className="text-sm text-muted-foreground mt-1">{selectedReport.description}</p></div>
              <div>
                <label className="text-sm font-medium">Resolution Note</label>
                <textarea value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} placeholder="Add a note..." />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleResolveReport('dismissed')} disabled={processing}><XCircle className="w-4 h-4 mr-1" />Dismiss</Button>
            <Button variant="destructive" onClick={() => handleResolveReport('resolved')} disabled={processing}><CheckCircle className="w-4 h-4 mr-1" />Resolve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
