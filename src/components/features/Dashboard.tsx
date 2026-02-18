import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { Room, Community } from '@/types/database';
import {
  Radio,
  Users,
  TrendingUp,
  Wallet,
  Plus,
  ArrowRight,
  Zap,
  Calendar,
  Activity,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [liveRooms, setLiveRooms] = useState<Room[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [roomsResult, communitiesResult] = await Promise.all([
        supabase
          .from('rooms')
          .select('*')
          .eq('status', 'live')
          .order('started_at', { ascending: false })
          .limit(6),
        supabase
          .from('communities')
          .select('*')
          .eq('is_public', true)
          .order('member_count', { ascending: false })
          .limit(4),
      ]);

      setLiveRooms(roomsResult.data || []);
      setCommunities(communitiesResult.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {profile?.full_name || 'there'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening in your communities
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Room
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(profile?.wallet_balance || 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Wallet className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Live Rooms</p>
                <p className="text-2xl font-bold">{liveRooms.length}</p>
              </div>
              <div className="p-3 rounded-full bg-red-500/10">
                <Radio className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Communities</p>
                <p className="text-2xl font-bold">{communities.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">
                  {profile?.is_verified ? 'Verified' : 'Active'}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Rooms */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500" />
            Live Now
          </h2>
          <Link to="/rooms">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : liveRooms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Radio className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No live rooms right now</p>
              <p className="text-sm mt-1">Be the first to start a conversation!</p>
              <Button className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Start a Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {liveRooms.map((room) => (
              <Link key={room.id} to={`/rooms/${room.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="destructive" className="gap-1">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        LIVE
                      </Badge>
                      {room.tags.length > 0 && (
                        <Badge variant="secondary">{room.tags[0]}</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mt-2 line-clamp-1">{room.title}</h3>
                    {room.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {room.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {room.max_participants} max
                      </span>
                      {room.started_at && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Started {formatRelativeTime(room.started_at)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Communities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Popular Communities
          </h2>
          <Link to="/communities">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {communities.map((community) => (
            <Card key={community.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar>
                    <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{community.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {community.member_count} members
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {community.description}
                </p>
                <div className="flex gap-1 mt-3 flex-wrap">
                  {community.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
