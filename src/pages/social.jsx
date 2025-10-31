// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Progress, Badge, Switch, Alert, AlertDescription, AlertTitle, useToast, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input } from '@/components/ui';
// @ts-ignore;
import { Users, Trophy, Star, Heart, Share2, MessageCircle, UserPlus, Search, Filter, Globe, MapPin, TrendingUp, Award, Target, Brain, Eye, Send, Bell, Settings, ChevronRight, ChevronDown, Plus, Minus, Crown, Medal, Zap, Clock, Calendar, BarChart3, Check, X } from 'lucide-react';

export default function SocialRankingSystem(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState('ranking');
  const [loading, setLoading] = useState(false);
  const [showAddFriendDialog, setShowAddFriendDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rankingType, setRankingType] = useState('global');
  const [timeRange, setTimeRange] = useState('week');

  // 社交数据状态
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [globalRanking, setGlobalRanking] = useState([]);
  const [localRanking, setLocalRanking] = useState([]);
  const [friendsRanking, setFriendsRanking] = useState([]);
  const [userRanking, setUserRanking] = useState(null);
  const [sharedAchievements, setSharedAchievements] = useState([]);
  const [socialStats, setSocialStats] = useState({
    friendsCount: 0,
    followersCount: 0,
    followingCount: 0,
    sharedCount: 0,
    likesReceived: 0
  });

  // 添加好友表单
  const [addFriendForm, setAddFriendForm] = useState({
    userId: '',
    message: ''
  });

  // 加载好友列表
  const loadFriends = async () => {
    try {
      const userId = $w.auth.currentUser?.userId || 'anonymous';
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_friends',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              $or: [{
                user_id: {
                  $eq: userId
                }
              }, {
                friend_id: {
                  $eq: userId
                }
              }]
            }
          },
          pageSize: 50
        }
      });
      setFriends(result.records || []);
    } catch (error) {
      console.error('加载好友列表失败:', error);
    }
  };

  // 加载好友请求
  const loadFriendRequests = async () => {
    try {
      const userId = $w.auth.currentUser?.userId || 'anonymous';
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_friend_requests',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              receiver_id: {
                $eq: userId
              },
              status: {
                $eq: 'pending'
              }
            }
          },
          pageSize: 20
        }
      });
      setFriendRequests(result.records || []);
    } catch (error) {
      console.error('加载好友请求失败:', error);
    }
  };

  // 加载排行榜数据
  const loadRankingData = async () => {
    try {
      setLoading(true);
      const userId = $w.auth.currentUser?.userId || 'anonymous';

      // 加载全球排行榜
      const globalResult = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_user_stats',
        methodName: 'wedaGetRecordsV2',
        params: {
          orderBy: [{
            total_points: 'desc'
          }],
          pageSize: 50
        }
      });
      setGlobalRanking(globalResult.records || []);

      // 加载本地排行榜（基于地理位置）
      const localResult = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_user_stats',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              location: {
                $eq: 'China' // 可以根据用户实际位置动态设置
              }
            }
          },
          orderBy: [{
            total_points: 'desc'
          }],
          pageSize: 50
        }
      });
      setLocalRanking(localResult.records || []);

      // 加载好友排行榜
      const friendsResult = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_user_stats',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              user_id: {
                $in: friends.map(f => f.friend_id)
              }
            }
          },
          orderBy: [{
            total_points: 'desc'
          }],
          pageSize: 50
        }
      });
      setFriendsRanking(friendsResult.records || []);

      // 获取用户排名
      const userRankResult = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_user_stats',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              user_id: {
                $eq: userId
              }
            }
          },
          pageSize: 1
        }
      });
      setUserRanking(userRankResult.records?.[0] || null);
    } catch (error) {
      console.error('加载排行榜数据失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载排行榜数据",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 加载社交统计
  const loadSocialStats = async () => {
    try {
      const userId = $w.auth.currentUser?.userId || 'anonymous';
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_user_stats',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              user_id: {
                $eq: userId
              }
            }
          },
          pageSize: 1
        }
      });
      if (result.records && result.records.length > 0) {
        setSocialStats({
          friendsCount: result.records[0].friends_count || 0,
          followersCount: result.records[0].followers_count || 0,
          followingCount: result.records[0].following_count || 0,
          sharedCount: result.records[0].shared_count || 0,
          likesReceived: result.records[0].likes_received || 0
        });
      }
    } catch (error) {
      console.error('加载社交统计失败:', error);
    }
  };

  // 添加好友
  const addFriend = async () => {
    try {
      setLoading(true);
      const userId = $w.auth.currentUser?.userId || 'anonymous';
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_friend_requests',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            sender_id: userId,
            receiver_id: addFriendForm.userId,
            message: addFriendForm.message,
            status: 'pending',
            created_at: Date.now()
          }
        }
      });
      toast({
        title: "发送成功",
        description: "好友请求已发送",
        duration: 2000
      });
      setShowAddFriendDialog(false);
      setAddFriendForm({
        userId: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: "发送失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理好友请求
  const handleFriendRequest = async (requestId, action) => {
    try {
      setLoading(true);
      const userId = $w.auth.currentUser?.userId || 'anonymous';
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_friend_requests',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            status: action,
            responded_at: Date.now()
          },
          filter: {
            where: {
              _id: {
                $eq: requestId
              }
            }
          }
        }
      });
      if (action === 'accepted') {
        // 创建好友关系
        const request = friendRequests.find(r => r._id === requestId);
        if (request) {
          await $w.cloud.callDataSource({
            dataSourceName: 'taiji_friends',
            methodName: 'wedaCreateV2',
            params: {
              data: {
                user_id: userId,
                friend_id: request.sender_id,
                created_at: Date.now()
              }
            }
          });
        }
      }
      toast({
        title: action === 'accepted' ? "已接受好友请求" : "已拒绝好友请求",
        duration: 2000
      });
      await loadFriendRequests();
      await loadFriends();
    } catch (error) {
      toast({
        title: "操作失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 分享成就
  const shareAchievement = async achievement => {
    try {
      const userId = $w.auth.currentUser?.userId || 'anonymous';
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_shared_achievements',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            user_id: userId,
            achievement_id: achievement.achievement_id,
            title: achievement.title,
            description: achievement.description,
            points: achievement.points,
            shared_at: Date.now(),
            likes_count: 0,
            comments_count: 0
          }
        }
      });
      setShareData(achievement);
      setShowShareDialog(true);
      toast({
        title: "分享成功",
        description: "成就已分享到社交动态",
        duration: 2000
      });
    } catch (error) {
      toast({
        title: "分享失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 点赞分享
  const likeSharedAchievement = async shareId => {
    try {
      const userId = $w.auth.currentUser?.userId || 'anonymous';
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_shared_achievements',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            $inc: {
              likes_count: 1
            }
          },
          filter: {
            where: {
              _id: {
                $eq: shareId
              }
            }
          }
        }
      });

      // 记录点赞
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_likes',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            user_id: userId,
            target_id: shareId,
            target_type: 'achievement_share',
            created_at: Date.now()
          }
        }
      });
      toast({
        title: "点赞成功",
        duration: 1000
      });
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  // 获取当前排行榜数据
  const getCurrentRanking = () => {
    switch (rankingType) {
      case 'global':
        return globalRanking;
      case 'local':
        return localRanking;
      case 'friends':
        return friendsRanking;
      default:
        return globalRanking;
    }
  };

  // 获取排名徽章
  const getRankBadge = rank => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />;
    return <span className="text-sm font-bold text-[#F5F5DC]/70">#{rank}</span>;
  };

  // 初始化
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
    loadRankingData();
    loadSocialStats();
  }, []);
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-[#F5F5DC] p-4">
      <div className="max-w-7xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            社交中心
          </h1>
          <p className="text-[#F5F5DC]/70">与全球太极修行者一起成长</p>
        </div>

        {/* 社交统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-black/30 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{socialStats.friendsCount}</div>
                  <div className="text-sm text-[#F5F5DC]/70">好友</div>
                </div>
                <Users className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{socialStats.followersCount}</div>
                  <div className="text-sm text-[#F5F5DC]/70">关注者</div>
                </div>
                <Heart className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-green-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{socialStats.sharedCount}</div>
                  <div className="text-sm text-[#F5F5DC]/70">分享</div>
                </div>
                <Share2 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-yellow-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{socialStats.likesReceived}</div>
                  <div className="text-sm text-[#F5F5DC]/70">获赞</div>
                </div>
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-red-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{userRanking?.global_rank || '-'}</div>
                  <div className="text-sm text-[#F5F5DC]/70">全球排名</div>
                </div>
                <Trophy className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 功能标签页 */}
        <div className="bg-black/30 border border-gray-600 rounded-lg">
          <div className="flex border-b border-gray-600">
            <button onClick={() => setActiveTab('ranking')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'ranking' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Trophy className="w-4 h-4" />
              排行榜
            </button>
            <button onClick={() => setActiveTab('friends')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'friends' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Users className="w-4 h-4" />
              好友
            </button>
            <button onClick={() => setActiveTab('shared')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'shared' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Share2 className="w-4 h-4" />
              动态
            </button>
          </div>

          <div className="p-6">
            {/* 排行榜标签页 */}
            {activeTab === 'ranking' && <div className="space-y-6">
                {/* 排行榜筛选 */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Select value={rankingType} onValueChange={setRankingType}>
                      <SelectTrigger className="bg-black/20 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            全球排行榜
                          </div>
                        </SelectItem>
                        <SelectItem value="local">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            本地排行榜
                          </div>
                        </SelectItem>
                        <SelectItem value="friends">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            好友排行榜
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="bg-black/20 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">今日</SelectItem>
                        <SelectItem value="week">本周</SelectItem>
                        <SelectItem value="month">本月</SelectItem>
                        <SelectItem value="all">全部时间</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 用户排名卡片 */}
                {userRanking && <Card className="bg-black/20 border-purple-500/30 mb-6">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl font-bold text-purple-400">
                            {getRankBadge(userRanking.global_rank || 999)}
                          </div>
                          <div>
                            <div className="font-medium text-[#F5F5DC]">您的排名</div>
                            <div className="text-sm text-[#F5F5DC]/70">
                              总积分: {userRanking.total_points || 0} | 
                              完成任务: {userRanking.completed_tasks || 0}
                            </div>
                          </div>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>}

                {/* 排行榜列表 */}
                <div className="space-y-3">
                  {getCurrentRanking().map((user, index) => <Card key={user._id || index} className={`bg-black/20 border-gray-600 hover:border-purple-500/50 transition-all ${user.user_id === ($w.auth.currentUser?.userId || 'anonymous') ? 'border-purple-500/50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-2xl">
                              {getRankBadge(index + 1)}
                            </div>
                            <div>
                              <div className="font-medium text-[#F5F5DC]">{user.username || '用户' + index}</div>
                              <div className="text-sm text-[#F5F5DC]/70">
                                等级 {user.level || 1} | 
                                积分 {user.total_points || 0} | 
                                完成任务 {user.completed_tasks || 0}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {user.location || '未知'}
                            </Badge>
                            {user.user_id === ($w.auth.currentUser?.userId || 'anonymous') && <Badge variant="default" className="text-xs">
                                您
                              </Badge>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>)}
                </div>

                {getCurrentRanking().length === 0 && <div className="text-center py-8">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-[#F5F5DC]/50" />
                    <div className="text-[#F5F5DC]/70">暂无排行数据</div>
                  </div>}
              </div>}

            {/* 好友标签页 */}
            {activeTab === 'friends' && <div className="space-y-6">
                {/* 好友操作 */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button onClick={() => setShowAddFriendDialog(true)} className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      添加好友
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#F5F5DC]/50" />
                    <input type="text" placeholder="搜索好友..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 bg-black/20 border border-gray-600 rounded-lg text-[#F5F5DC] placeholder-[#F5F5DC]/50 focus:outline-none focus:border-purple-500" />
                  </div>
                </div>

                {/* 好友请求 */}
                {friendRequests.length > 0 && <div>
                    <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">好友请求</h3>
                    <div className="space-y-3">
                      {friendRequests.map((request, index) => <Card key={request._id || index} className="bg-black/20 border-yellow-500/30">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-[#F5F5DC]">{request.sender_name || '用户'}</div>
                                <div className="text-sm text-[#F5F5DC]/70">{request.message || '想要添加您为好友'}</div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleFriendRequest(request._id, 'accepted')} className="flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  接受
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleFriendRequest(request._id, 'rejected')} className="flex items-center gap-1">
                                  <X className="w-3 h-3" />
                                  拒绝
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>)}
                    </div>
                  </div>}

                {/* 好友列表 */}
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">好友列表 ({friends.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friends.map((friend, index) => <Card key={friend._id || index} className="bg-black/20 border-gray-600 hover:border-blue-500/50 transition-all">
                        <CardContent className="p-4">
                          <div className="text-center space-y-3">
                            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-400 to-cyan-400 rounded-full flex items-center justify-center">
                              <Users className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-[#F5F5DC]">{friend.friend_name || '好友' + index}</div>
                              <div className="text-sm text-[#F5F5DC]/70">
                                等级 {friend.level || 1} | 
                                积分 {friend.points || 0}
                              </div>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <Badge variant={friend.online_status === 'online' ? "default" : "secondary"} className="text-xs">
                                {friend.online_status === 'online' ? '在线' : '离线'}
                              </Badge>
                              <Button size="sm" variant="outline" className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                聊天
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>)}
                  </div>
                </div>

                {friends.length === 0 && <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-[#F5F5DC]/50" />
                    <div className="text-[#F5F5DC]/70">暂无好友</div>
                    <div className="text-sm text-[#F5F5DC]/50 mt-2">添加好友开始社交互动</div>
                  </div>}
              </div>}

            {/* 动态标签页 */}
            {activeTab === 'shared' && <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-[#F5F5DC]">社交动态</h3>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    筛选
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* 示例分享动态 */}
                  <Card className="bg-black/20 border-gray-600">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-[#F5F5DC]">张三</div>
                              <div className="text-xs text-[#F5F5DC]/50">2小时前</div>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="text-[#F5F5DC]/70">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="bg-black/30 border border-gray-600 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            <span className="font-medium text-[#F5F5DC]">解锁成就：记忆大师</span>
                          </div>
                          <div className="text-sm text-[#F5F5DC]/70">连续完成30天记忆训练，记忆力显著提升！</div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Button size="sm" variant="ghost" className="flex items-center gap-1 text-[#F5F5DC]/70">
                              <Heart className="w-4 h-4" />
                              12
                            </Button>
                            <Button size="sm" variant="ghost" className="flex items-center gap-1 text-[#F5F5DC]/70">
                              <MessageCircle className="w-4 h-4" />
                              3
                            </Button>
                          </div>
                          <Button size="sm" variant="ghost" className="text-[#F5F5DC]/70">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 更多动态... */}
                  <Card className="bg-black/20 border-gray-600">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-[#F5F5DC]">李四</div>
                              <div className="text-xs text-[#F5F5DC]/50">5小时前</div>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="text-[#F5F5DC]/70">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="bg-black/30 border border-gray-600 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5 text-green-400" />
                            <span className="font-medium text-[#F5F5DC]">完成挑战：极限训练</span>
                          </div>
                          <div className="text-sm text-[#F5F5DC]/70">成功完成最高难度的训练任务，获得500积分奖励！</div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Button size="sm" variant="ghost" className="flex items-center gap-1 text-[#F5F5DC]/70">
                              <Heart className="w-4 h-4" />
                              8
                            </Button>
                            <Button size="sm" variant="ghost" className="flex items-center gap-1 text-[#F5F5DC]/70">
                              <MessageCircle className="w-4 h-4" />
                              2
                            </Button>
                          </div>
                          <Button size="sm" variant="ghost" className="text-[#F5F5DC]/70">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>}
          </div>
        </div>

        {/* 添加好友对话框 */}
        <Dialog open={showAddFriendDialog} onOpenChange={setShowAddFriendDialog}>
          <DialogContent className="bg-black/90 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-[#F5F5DC]">添加好友</DialogTitle>
              <DialogDescription className="text-[#F5F5DC]/70">
                输入用户ID或用户名添加好友
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">用户ID</label>
                <Input value={addFriendForm.userId} onChange={e => setAddFriendForm(prev => ({
                ...prev,
                userId: e.target.value
              }))} placeholder="请输入用户ID" className="bg-black/20 border-gray-600 text-[#F5F5DC]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">验证消息</label>
                <Input value={addFriendForm.message} onChange={e => setAddFriendForm(prev => ({
                ...prev,
                message: e.target.value
              }))} placeholder="请输入验证消息（可选）" className="bg-black/20 border-gray-600 text-[#F5F5DC]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddFriendDialog(false)}>
                取消
              </Button>
              <Button onClick={addFriend} disabled={loading || !addFriendForm.userId}>
                {loading ? '发送中...' : '发送请求'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 分享对话框 */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="bg-black/90 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-[#F5F5DC]">分享成就</DialogTitle>
              <DialogDescription className="text-[#F5F5DC]/70">
                选择分享平台
              </DialogDescription>
            </DialogHeader>
            {shareData && <div className="space-y-4">
                <div className="bg-black/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="font-medium text-[#F5F5DC]">{shareData.title}</span>
                  </div>
                  <div className="text-sm text-[#F5F5DC]/70">{shareData.description}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    微信
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    微博
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    QQ
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    复制链接
                  </Button>
                </div>
              </div>}
            <DialogFooter>
              <Button onClick={() => setShowShareDialog(false)}>
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
}