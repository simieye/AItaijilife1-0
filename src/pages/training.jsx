// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Progress, Badge, Switch, Alert, AlertDescription, AlertTitle, useToast, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
// @ts-ignore;
import { Brain, Clock, Target, Trophy, Zap, TrendingUp, Award, Star, Play, Pause, RotateCcw, Settings, Timer, Flame, Shield, Eye, Heart, BarChart3, Activity, Users, Calendar, Filter, ChevronRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function AdvancedTrainingSystem(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState('modes');
  const [loading, setLoading] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [trainingSession, setTrainingSession] = useState(null);
  const [trainingResults, setTrainingResults] = useState(null);

  // 训练模式状态
  const [trainingModes, setTrainingModes] = useState({
    timeChallenge: {
      id: 'time_challenge',
      name: '限时挑战',
      description: '在限定时间内完成尽可能多的任务',
      icon: Timer,
      color: 'red',
      difficulty: 'medium',
      duration: 300,
      // 5分钟
      tasks: [],
      isActive: false
    },
    progressive: {
      id: 'progressive',
      name: '难度递增',
      description: '难度随进度逐渐提升的训练模式',
      icon: TrendingUp,
      color: 'blue',
      difficulty: 'adaptive',
      duration: 0,
      // 无限制
      tasks: [],
      isActive: false
    },
    specialized: {
      id: 'specialized',
      name: '专项技能',
      description: '针对特定技能的深度训练',
      icon: Target,
      color: 'green',
      difficulty: 'custom',
      duration: 0,
      tasks: [],
      isActive: false
    },
    endurance: {
      id: 'endurance',
      name: '耐力训练',
      description: '长时间持续训练，提升持久力',
      icon: Flame,
      color: 'orange',
      difficulty: 'hard',
      duration: 1800,
      // 30分钟
      tasks: [],
      isActive: false
    }
  });

  // 训练会话状态
  const [sessionState, setSessionState] = useState({
    isActive: false,
    currentTask: null,
    progress: 0,
    score: 0,
    timeRemaining: 0,
    completedTasks: 0,
    failedTasks: 0,
    streak: 0,
    difficulty: 1,
    startTime: null
  });

  // 专项技能类型
  const [skillTypes] = useState([{
    id: 'memory',
    name: '记忆力',
    description: '提升短期和长期记忆能力',
    icon: Brain,
    exercises: ['数字记忆', '图像记忆', '序列记忆', '联想记忆']
  }, {
    id: 'reaction',
    name: '反应力',
    description: '提高反应速度和准确性',
    icon: Zap,
    exercises: ['快速点击', '颜色识别', '方向判断', '模式匹配']
  }, {
    id: 'focus',
    name: '专注力',
    description: '增强注意力和集中度',
    icon: Eye,
    exercises: ['专注追踪', '干扰过滤', '多任务处理', '持续观察']
  }, {
    id: 'logic',
    name: '逻辑思维',
    description: '锻炼逻辑推理和问题解决能力',
    icon: Shield,
    exercises: ['数列推理', '图形推理', '逻辑判断', '策略规划']
  }]);

  // 用户训练统计
  const [trainingStats, setTrainingStats] = useState({
    totalTime: 0,
    totalSessions: 0,
    averageScore: 0,
    bestScore: 0,
    currentStreak: 0,
    longestStreak: 0,
    completedChallenges: 0,
    favoriteMode: null
  });

  // 排行榜数据
  const [leaderboard, setLeaderboard] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    allTime: []
  });

  // 加载训练数据
  const loadTrainingData = async () => {
    try {
      setLoading(true);
      const userId = $w.auth.currentUser?.userId || 'anonymous';

      // 加载训练任务
      const tasksResult = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_training_task',
        methodName: 'wedaGetRecordsV2',
        params: {
          orderBy: [{
            difficulty_level: 'asc'
          }],
          pageSize: 100
        }
      });

      // 加载用户进度
      const progressResult = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_user_progress',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              user_id: {
                $eq: userId
              }
            }
          },
          orderBy: [{
            started_at: 'desc'
          }],
          pageSize: 50
        }
      });

      // 加载用户统计
      const statsResult = await $w.cloud.callDataSource({
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

      // 更新训练模式
      const updatedModes = {
        ...trainingModes
      };
      Object.keys(updatedModes).forEach(modeKey => {
        updatedModes[modeKey].tasks = tasksResult.records || [];
      });
      setTrainingModes(updatedModes);

      // 更新统计数据
      if (statsResult.records && statsResult.records.length > 0) {
        const stats = statsResult.records[0];
        setTrainingStats({
          totalTime: stats.total_training_time || 0,
          totalSessions: stats.total_sessions || 0,
          averageScore: stats.average_score || 0,
          bestScore: stats.best_score || 0,
          currentStreak: stats.current_streak || 0,
          longestStreak: stats.longest_streak || 0,
          completedChallenges: stats.completed_challenges || 0,
          favoriteMode: stats.favorite_mode || null
        });
      }

      // 加载排行榜
      await loadLeaderboard();
    } catch (error) {
      console.error('加载训练数据失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载训练数据",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 加载排行榜
  const loadLeaderboard = async () => {
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_leaderboard',
        methodName: 'wedaGetRecordsV2',
        params: {
          orderBy: [{
            score: 'desc'
          }],
          pageSize: 20
        }
      });

      // 模拟排行榜数据分类
      const allTime = result.records || [];
      setLeaderboard({
        daily: allTime.slice(0, 10),
        weekly: allTime.slice(0, 10),
        monthly: allTime.slice(0, 10),
        allTime: allTime
      });
    } catch (error) {
      console.error('加载排行榜失败:', error);
    }
  };

  // 开始训练
  const startTraining = async (mode, settings = {}) => {
    try {
      const userId = $w.auth.currentUser?.userId || 'anonymous';
      const trainingMode = trainingModes[mode];
      if (!trainingMode) {
        toast({
          title: "训练模式错误",
          description: "选择的训练模式不存在",
          variant: "destructive"
        });
        return;
      }

      // 创建训练会话
      const session = {
        id: Date.now(),
        userId,
        mode,
        settings,
        startTime: Date.now(),
        status: 'active',
        currentTask: null,
        progress: 0,
        score: 0,
        timeRemaining: trainingMode.duration,
        completedTasks: 0,
        failedTasks: 0,
        streak: 0,
        difficulty: settings.initialDifficulty || 1
      };
      setTrainingSession(session);
      setSessionState({
        isActive: true,
        currentTask: null,
        progress: 0,
        score: 0,
        timeRemaining: trainingMode.duration,
        completedTasks: 0,
        failedTasks: 0,
        streak: 0,
        difficulty: settings.initialDifficulty || 1,
        startTime: Date.now()
      });

      // 记录训练开始
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_training_sessions',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            user_id: userId,
            mode: mode,
            settings: settings,
            started_at: Date.now(),
            status: 'active'
          }
        }
      });
      setShowStartDialog(false);
      setSelectedTraining(mode);
      setActiveTab('session');
      toast({
        title: "训练开始",
        description: `${trainingMode.name}训练已开始`,
        duration: 2000
      });

      // 开始训练循环
      startTrainingLoop(mode, session);
    } catch (error) {
      toast({
        title: "开始训练失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 训练循环
  const startTrainingLoop = (mode, session) => {
    const interval = setInterval(() => {
      setSessionState(prev => {
        if (!prev.isActive) {
          clearInterval(interval);
          return prev;
        }
        const trainingMode = trainingModes[mode];
        let newTimeRemaining = prev.timeRemaining - 1;

        // 检查时间限制
        if (trainingMode.duration > 0 && newTimeRemaining <= 0) {
          clearInterval(interval);
          endTraining(session);
          return {
            ...prev,
            timeRemaining: 0
          };
        }

        // 模拟任务进度
        const shouldCompleteTask = Math.random() > 0.7;
        let newScore = prev.score;
        let newCompletedTasks = prev.completedTasks;
        let newFailedTasks = prev.failedTasks;
        let newStreak = prev.streak;
        let newDifficulty = prev.difficulty;
        if (shouldCompleteTask) {
          newCompletedTasks++;
          newScore += 10 * newDifficulty;
          newStreak++;

          // 难度递增
          if (mode === 'progressive' && newCompletedTasks % 5 === 0) {
            newDifficulty++;
          }
        } else {
          newFailedTasks++;
          newStreak = 0;
        }
        return {
          ...prev,
          timeRemaining: newTimeRemaining,
          score: newScore,
          completedTasks: newCompletedTasks,
          failedTasks: newFailedTasks,
          streak: newStreak,
          difficulty: newDifficulty,
          progress: trainingMode.duration > 0 ? (trainingMode.duration - newTimeRemaining) / trainingMode.duration * 100 : newCompletedTasks / 50 * 100
        };
      });
    }, 1000);
  };

  // 结束训练
  const endTraining = async session => {
    try {
      const endTime = Date.now();
      const duration = endTime - session.startTime;
      const results = {
        sessionId: session.id,
        mode: session.mode,
        duration,
        score: sessionState.score,
        completedTasks: sessionState.completedTasks,
        failedTasks: sessionState.failedTasks,
        streak: sessionState.streak,
        difficulty: sessionState.difficulty,
        accuracy: sessionState.completedTasks / (sessionState.completedTasks + sessionState.failedTasks) * 100,
        endedAt: endTime
      };
      setTrainingResults(results);
      setSessionState(prev => ({
        ...prev,
        isActive: false
      }));

      // 保存训练结果
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_training_sessions',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            status: 'completed',
            ended_at: endTime,
            score: results.score,
            completed_tasks: results.completedTasks,
            failed_tasks: results.failedTasks,
            accuracy: results.accuracy
          },
          filter: {
            where: {
              _id: {
                $eq: session.id
              }
            }
          }
        }
      });

      // 更新用户统计
      await updateUserStats(results);
      setShowResultDialog(true);
      toast({
        title: "训练完成",
        description: `得分: ${results.score} | 准确率: ${results.accuracy.toFixed(1)}%`,
        duration: 3000
      });
    } catch (error) {
      toast({
        title: "保存结果失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 更新用户统计
  const updateUserStats = async results => {
    try {
      const userId = $w.auth.currentUser?.userId || 'anonymous';
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_user_stats',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            total_training_time: trainingStats.totalTime + results.duration,
            total_sessions: trainingStats.totalSessions + 1,
            average_score: (trainingStats.averageScore * trainingStats.totalSessions + results.score) / (trainingStats.totalSessions + 1),
            best_score: Math.max(trainingStats.bestScore, results.score),
            current_streak: results.streak > 0 ? trainingStats.currentStreak + 1 : 0,
            longest_streak: Math.max(trainingStats.longestStreak, results.streak),
            completed_challenges: trainingStats.completedChallenges + 1,
            last_training: Date.now()
          },
          filter: {
            where: {
              user_id: {
                $eq: userId
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('更新用户统计失败:', error);
    }
  };

  // 暂停训练
  const pauseTraining = () => {
    setSessionState(prev => ({
      ...prev,
      isActive: false
    }));
    toast({
      title: "训练已暂停",
      duration: 2000
    });
  };

  // 继续训练
  const resumeTraining = () => {
    setSessionState(prev => ({
      ...prev,
      isActive: true
    }));
    toast({
      title: "训练已继续",
      duration: 2000
    });
  };

  // 停止训练
  const stopTraining = () => {
    if (trainingSession) {
      endTraining(trainingSession);
    }
  };

  // 格式化时间
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取难度颜色
  const getDifficultyColor = difficulty => {
    if (difficulty <= 2) return 'text-green-400';
    if (difficulty <= 4) return 'text-yellow-400';
    if (difficulty <= 6) return 'text-orange-400';
    return 'text-red-400';
  };

  // 初始化
  useEffect(() => {
    loadTrainingData();
  }, []);
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-[#F5F5DC] p-4">
      <div className="max-w-7xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            高级训练中心
          </h1>
          <p className="text-[#F5F5DC]/70">挑战自我，突破极限</p>
        </div>

        {/* 训练统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-black/30 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{trainingStats.totalSessions}</div>
                  <div className="text-sm text-[#F5F5DC]/70">总训练次数</div>
                </div>
                <Activity className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{Math.round(trainingStats.totalTime / 60)}h</div>
                  <div className="text-sm text-[#F5F5DC]/70">总训练时长</div>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-green-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{Math.round(trainingStats.averageScore)}</div>
                  <div className="text-sm text-[#F5F5DC]/70">平均得分</div>
                </div>
                <BarChart3 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-yellow-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{trainingStats.currentStreak}</div>
                  <div className="text-sm text-[#F5F5DC]/70">当前连击</div>
                </div>
                <Flame className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-red-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{trainingStats.bestScore}</div>
                  <div className="text-sm text-[#F5F5DC]/70">最高得分</div>
                </div>
                <Trophy className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 功能标签页 */}
        <div className="bg-black/30 border border-gray-600 rounded-lg">
          <div className="flex border-b border-gray-600">
            <button onClick={() => setActiveTab('modes')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'modes' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Target className="w-4 h-4" />
              训练模式
            </button>
            <button onClick={() => setActiveTab('session')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'session' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Brain className="w-4 h-4" />
              训练会话
            </button>
            <button onClick={() => setActiveTab('skills')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'skills' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Award className="w-4 h-4" />
              专项技能
            </button>
            <button onClick={() => setActiveTab('leaderboard')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'leaderboard' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Trophy className="w-4 h-4" />
              排行榜
            </button>
          </div>

          <div className="p-6">
            {/* 训练模式标签页 */}
            {activeTab === 'modes' && <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">选择训练模式</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.values(trainingModes).map(mode => {
                  const Icon = mode.icon;
                  return <Card key={mode.id} className={`bg-black/20 border-2 cursor-pointer transition-all hover:border-${mode.color}-500/50 ${mode.isActive ? `border-${mode.color}-500/50` : 'border-gray-600'}`} onClick={() => {
                    setSelectedTraining(mode.id);
                    setShowStartDialog(true);
                  }}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 bg-${mode.color}-500/20 rounded-lg flex items-center justify-center`}>
                              <Icon className={`w-6 h-6 text-${mode.color}-400`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-[#F5F5DC] mb-2">{mode.name}</h4>
                              <p className="text-sm text-[#F5F5DC]/70 mb-4">{mode.description}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {mode.difficulty === 'easy' ? '简单' : mode.difficulty === 'medium' ? '中等' : mode.difficulty === 'hard' ? '困难' : mode.difficulty === 'adaptive' ? '自适应' : '自定义'}
                                  </Badge>
                                  {mode.duration > 0 && <Badge variant="outline" className="text-xs">
                                    {formatTime(mode.duration)}
                                  </Badge>}
                                </div>
                                <ChevronRight className="w-4 h-4 text-[#F5F5DC]/50" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>;
                })}
                  </div>
                </div>
              </div>}

            {/* 训练会话标签页 */}
            {activeTab === 'session' && <div className="space-y-6">
                {sessionState.isActive ? <div>
                    {/* 实时训练状态 */}
                    <Card className="bg-black/20 border-purple-500/30 mb-6">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-[#F5F5DC] mb-2">{sessionState.score}</div>
                            <div className="text-sm text-[#F5F5DC]/70">当前得分</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-[#F5F5DC] mb-2">{formatTime(sessionState.timeRemaining)}</div>
                            <div className="text-sm text-[#F5F5DC]/70">剩余时间</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-[#F5F5DC] mb-2">{sessionState.completedTasks}</div>
                            <div className="text-sm text-[#F5F5DC]/70">完成任务</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-[#F5F5DC] mb-2">{sessionState.streak}</div>
                            <div className="text-sm text-[#F5F5DC]/70">连击数</div>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <div className="flex justify-between text-sm text-[#F5F5DC]/70 mb-2">
                            <span>训练进度</span>
                            <span>{Math.round(sessionState.progress)}%</span>
                          </div>
                          <Progress value={sessionState.progress} className="h-3" />
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[#F5F5DC]/70">当前难度:</span>
                            <span className={`font-medium ${getDifficultyColor(sessionState.difficulty)}`}>
                              等级 {sessionState.difficulty}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={pauseTraining} className="flex items-center gap-1">
                              <Pause className="w-3 h-3" />
                              暂停
                            </Button>
                            <Button size="sm" variant="outline" onClick={stopTraining} className="flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              停止
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 模拟训练任务 */}
                    <Card className="bg-black/20 border-gray-600">
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-400 to-cyan-400 rounded-full flex items-center justify-center animate-pulse">
                            <Brain className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-[#F5F5DC] mb-2">当前任务</div>
                            <div className="text-sm text-[#F5F5DC]/70">
                              {selectedTraining === 'time_challenge' ? '快速记忆数字序列' : selectedTraining === 'progressive' ? '解决逻辑谜题' : selectedTraining === 'specialized' ? '专项技能训练' : '持续专注训练'}
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${sessionState.isActive ? 'bg-green-400' : 'bg-yellow-400'}`} />
                            <span className="text-sm text-[#F5F5DC]/70">
                              {sessionState.isActive ? '训练进行中' : '已暂停'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div> : <div className="text-center py-12">
                    <Brain className="w-16 h-16 mx-auto mb-4 text-[#F5F5DC]/50" />
                    <div className="text-xl text-[#F5F5DC]/70 mb-4">暂无活跃训练会话</div>
                    <Button onClick={() => setActiveTab('modes')} className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      选择训练模式
                    </Button>
                  </div>}
              </div>}

            {/* 专项技能标签页 */}
            {activeTab === 'skills' && <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">专项技能训练</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {skillTypes.map(skill => {
                  const Icon = skill.icon;
                  return <Card key={skill.id} className="bg-black/20 border-gray-600 hover:border-green-500/50 transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                              <Icon className="w-6 h-6 text-green-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-[#F5F5DC] mb-2">{skill.name}</h4>
                              <p className="text-sm text-[#F5F5DC]/70 mb-4">{skill.description}</p>
                              <div className="space-y-2">
                                <div className="text-sm text-[#F5F5DC]/60">训练项目:</div>
                                <div className="flex flex-wrap gap-1">
                                  {skill.exercises.map((exercise, index) => <Badge key={index} variant="outline" className="text-xs">
                                      {exercise}
                                    </Badge>)}
                                </div>
                              </div>
                              <Button size="sm" className="mt-4 w-full" onClick={() => {
                            setSelectedTraining('specialized');
                            setShowStartDialog(true);
                          }}>
                                开始训练
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>;
                })}
                  </div>
                </div>
              </div>}

            {/* 排行榜标签页 */}
            {activeTab === 'leaderboard' && <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">训练排行榜</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-black/20 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-sm text-[#F5F5DC]">今日排行</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {leaderboard.daily.slice(0, 5).map((user, index) => <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center text-xs font-bold text-yellow-400">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-[#F5F5DC]">{user.username || '用户' + (index + 1)}</div>
                                  <div className="text-xs text-[#F5F5DC]/60">得分: {user.score || 1000 - index * 100}</div>
                                </div>
                              </div>
                              <Trophy className="w-4 h-4 text-yellow-400" />
                            </div>)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-black/20 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-sm text-[#F5F5DC]">本周排行</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {leaderboard.weekly.slice(0, 5).map((user, index) => <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-xs font-bold text-blue-400">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-[#F5F5DC]">{user.username || '用户' + (index + 1)}</div>
                                  <div className="text-xs text-[#F5F5DC]/60">得分: {user.score || 5000 - index * 200}</div>
                                </div>
                              </div>
                              <Star className="w-4 h-4 text-blue-400" />
                            </div>)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>}
          </div>
        </div>

        {/* 开始训练对话框 */}
        <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
          <DialogContent className="bg-black/90 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-[#F5F5DC]">开始训练</DialogTitle>
              <DialogDescription className="text-[#F5F5DC]/70">
                配置训练参数并开始挑战
              </DialogDescription>
            </DialogHeader>
            {selectedTraining && <div className="space-y-4">
                <div className="bg-black/50 border border-gray-600 rounded-lg p-4">
                  <h4 className="font-medium text-[#F5F5DC] mb-2">
                    {trainingModes[selectedTraining]?.name}
                  </h4>
                  <p className="text-sm text-[#F5F5DC]/70">
                    {trainingModes[selectedTraining]?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">初始难度</label>
                  <Select defaultValue="1">
                    <SelectTrigger className="bg-black/20 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">入门</SelectItem>
                      <SelectItem value="2">简单</SelectItem>
                      <SelectItem value="3">中等</SelectItem>
                      <SelectItem value="4">困难</SelectItem>
                      <SelectItem value="5">专家</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">训练目标</label>
                  <Select defaultValue="score">
                    <SelectTrigger className="bg-black/20 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">最高得分</SelectItem>
                      <SelectItem value="accuracy">准确率</SelectItem>
                      <SelectItem value="speed">速度</SelectItem>
                      <SelectItem value="endurance">耐力</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStartDialog(false)}>
                取消
              </Button>
              <Button onClick={() => startTraining(selectedTraining)}>
                开始训练
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 训练结果对话框 */}
        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent className="bg-black/90 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-[#F5F5DC]">训练完成</DialogTitle>
              <DialogDescription className="text-[#F5F5DC]/70">
                查看您的训练成果
              </DialogDescription>
            </DialogHeader>
            {trainingResults && <div className="space-y-4">
                <div className="bg-black/50 border border-gray-600 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-[#F5F5DC]">{trainingResults.score}</div>
                      <div className="text-sm text-[#F5F5DC]/70">总得分</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#F5F5DC]">{trainingResults.accuracy.toFixed(1)}%</div>
                      <div className="text-sm text-[#F5F5DC]/70">准确率</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#F5F5DC]">{trainingResults.completedTasks}</div>
                      <div className="text-sm text-[#F5F5DC]/70">完成任务</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#F5F5DC]">{trainingResults.streak}</div>
                      <div className="text-sm text-[#F5F5DC]/70">最大连击</div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-medium text-[#F5F5DC] mb-2">训练评价</div>
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className={`w-5 h-5 ${i < Math.floor(trainingResults.score / 200) ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} />)}
                  </div>
                </div>
              </div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResultDialog(false)}>
                关闭
              </Button>
              <Button onClick={() => {
              setShowResultDialog(false);
              setActiveTab('modes');
            }}>
                再次训练
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
}