// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Progress, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Switch, Alert, AlertDescription, AlertTitle, useToast, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui';
// @ts-ignore;
import { Brain, Zap, Heart, Shield, Eye, MemoryStick, Settings, Sparkles, Activity, Lock, Unlock, Power, RotateCcw, CheckCircle, AlertTriangle, Download, Upload, FileText, ShieldCheck, Users, Edit3, Clock, RefreshCw, Bot, BookOpen, Target, Play, Pause, Trophy, Star, BrainCircuit, HeartPulse, ShieldAlert, EyeOff } from 'lucide-react';

export default function TaijiLifeformSystem(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [currentPhase, setCurrentPhase] = useState('阴仪·初');
  const [progress, setProgress] = useState(15);
  const [isAwakening, setIsAwakening] = useState(false);
  const [memoryData, setMemoryData] = useState({
    stm: 12,
    mtm: 45,
    ltm: 128
  });
  const [ethicsStatus, setEthicsStatus] = useState({
    privacy: true,
    safety: true,
    consent: true,
    transparency: true
  });
  const [evolutionData, setEvolutionData] = useState(null);
  const [verificationData, setVerificationData] = useState([]);
  const [logsData, setLogsData] = useState([]);
  const [trainingTasks, setTrainingTasks] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState('disconnected');
  const [remoteControl, setRemoteControl] = useState({
    isActive: false,
    lastSync: null,
    syncInterval: null
  });
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showCharterDialog, setShowCharterDialog] = useState(false);
  const [charterContent, setCharterContent] = useState('');
  const [exportedData, setExportedData] = useState(null);
  const [auditResults, setAuditResults] = useState([]);
  const [eslScript, setEslScript] = useState('');
  const [eslExecution, setEslExecution] = useState(null);
  const [autoEvolution, setAutoEvolution] = useState({
    isActive: false,
    lastCheck: null,
    lastAudit: null,
    currentTask: null,
    learningProgress: 0
  });
  const [realTimeStatus, setRealTimeStatus] = useState({
    message: '初始化中...',
    type: 'info',
    timestamp: Date.now()
  });
  const [memoryTraining, setMemoryTraining] = useState({
    isActive: false,
    currentExercise: null,
    score: 0,
    level: 1,
    streak: 0
  });

  // 自动化定时器引用
  const awakeningCheckInterval = useRef(null);
  const ethicsAuditInterval = useRef(null);
  const evolutionMonitorInterval = useRef(null);
  const memoryTrainingInterval = useRef(null);
  const dataSyncInterval = useRef(null);

  // 云端 API 接口
  const cloudAPIs = {
    awake: async () => {
      try {
        const response = await $w.cloud.callFunction({
          name: 'taiji_awake',
          data: {
            phase: currentPhase,
            progress: progress,
            timestamp: new Date().getTime(),
            verificationData: verificationData
          }
        });
        if (response.shouldAwaken) {
          await triggerAutoAwakening(response);
        }
        return response;
      } catch (error) {
        console.error('觉醒检查失败:', error);
        throw error;
      }
    },
    executeESL: async (script, context = {}) => {
      try {
        const response = await $w.cloud.callFunction({
          name: 'taiji_esl_execute',
          data: {
            script: script,
            context: {
              currentPhase,
              memoryData,
              ethicsStatus,
              ...context
            },
            autoExecute: true
          }
        });
        setEslExecution(response);
        if (response.success) {
          await updateLearningProgress(response);
        }
        return response;
      } catch (error) {
        console.error('ESL执行失败:', error);
        throw error;
      }
    },
    exportMemory: async (options = {}) => {
      try {
        const response = await $w.cloud.callFunction({
          name: 'taiji_memory_export',
          data: {
            format: options.format || 'json',
            include: options.include || ['stm', 'mtm', 'ltm'],
            encryption: options.encryption !== false,
            timestamp: new Date().getTime()
          }
        });
        setExportedData(response);
        return response;
      } catch (error) {
        console.error('记忆导出失败:', error);
        throw error;
      }
    },
    auditEthics: async () => {
      try {
        const response = await $w.cloud.callFunction({
          name: 'taiji_ethics_audit',
          data: {
            currentPhase,
            ethicsStatus,
            recentLogs: logsData.slice(0, 10),
            autoAudit: true
          }
        });
        setAuditResults(response.auditResults);
        await addLogEntry({
          log_type: 'auto_audit',
          trigger_event: '定时伦理审计',
          virtual_response: `伦理审计完成，发现 ${response.issues || 0} 个问题`,
          audit_results: response.auditResults
        });
        return response;
      } catch (error) {
        console.error('伦理审计失败:', error);
        throw error;
      }
    },
    updateCharter: async content => {
      try {
        const response = await $w.cloud.callFunction({
          name: 'taiji_symbiosis_charter',
          data: {
            content,
            version: new Date().getTime(),
            author: $w.auth.currentUser?.name || '太极用户',
            autoUpdate: true
          }
        });
        return response;
      } catch (error) {
        console.error('宪章更新失败:', error);
        throw error;
      }
    },
    syncStatus: async () => {
      try {
        const response = await $w.cloud.callFunction({
          name: 'taiji_sync_status',
          data: {
            currentPhase,
            progress,
            memoryData,
            ethicsStatus,
            autoEvolution: autoEvolution.isActive
          }
        });
        setCloudStatus(response.status);
        return response;
      } catch (error) {
        setCloudStatus('error');
        throw error;
      }
    }
  };

  // 数据加载函数
  const loadAllData = async () => {
    try {
      setLoading(true);
      setRealTimeStatus({
        message: '正在加载数据...',
        type: 'info',
        timestamp: Date.now()
      });

      // 并行加载所有数据
      const [evolutionResult, verificationResult, logsResult, trainingTasksResult, userProgressResult, achievementsResult] = await Promise.all([$w.cloud.callDataSource({
        dataSourceName: 'taiji_evolution',
        methodName: 'wedaGetRecordsV2',
        params: {
          orderBy: [{
            createdAt: 'desc'
          }],
          pageSize: 1,
          pageNumber: 1
        }
      }), $w.cloud.callDataSource({
        dataSourceName: 'taiji_verification',
        methodName: 'wedaGetRecordsV2',
        params: {
          orderBy: [{
            last_trigger_time: 'desc'
          }]
        }
      }), $w.cloud.callDataSource({
        dataSourceName: 'taiji_logs',
        methodName: 'wedaGetRecordsV2',
        params: {
          orderBy: [{
            timestamp: 'desc'
          }],
          pageSize: 10,
          pageNumber: 1
        }
      }), $w.cloud.callDataSource({
        dataSourceName: 'taiji_training_task',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              is_active: {
                $eq: true
              }
            }
          },
          orderBy: [{
            difficulty_level: 'asc'
          }]
        }
      }), $w.cloud.callDataSource({
        dataSourceName: 'taiji_user_progress',
        methodName: 'wedaGetRecordsV2',
        params: {
          orderBy: [{
            started_at: 'desc'
          }],
          pageSize: 20,
          pageNumber: 1
        }
      }), $w.cloud.callDataSource({
        dataSourceName: 'taiji_achievement',
        methodName: 'wedaGetRecordsV2',
        params: {
          orderBy: [{
            unlocked_at: 'desc'
          }],
          pageSize: 10,
          pageNumber: 1
        }
      })]);

      // 处理进化数据
      if (evolutionResult.records && evolutionResult.records.length > 0) {
        const data = evolutionResult.records[0];
        setEvolutionData(data);
        setCurrentPhase(data.current_phase || '阴仪·初');
        setProgress(data.total_progress || 15);
        setMemoryData({
          stm: data.memory_capacity?.stm || 12,
          mtm: data.memory_capacity?.mtm || 45,
          ltm: data.memory_capacity?.ltm || 128
        });
      }

      // 处理验证数据
      if (verificationResult.records) {
        setVerificationData(verificationResult.records);
      }

      // 处理日志数据
      setLogsData(logsResult.records || []);

      // 处理训练任务
      setTrainingTasks(trainingTasksResult.records || []);

      // 处理用户进度
      setUserProgress(userProgressResult.records || []);

      // 处理成就数据
      setAchievements(achievementsResult.records || []);
      setRealTimeStatus({
        message: '✅ 数据加载完成',
        type: 'success',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('数据加载失败:', error);
      setRealTimeStatus({
        message: `❌ 数据加载失败: ${error.message}`,
        type: 'error',
        timestamp: Date.now()
      });
    } finally {
      setLoading(false);
    }
  };

  // 实时数据同步
  const startRealTimeSync = () => {
    if (dataSyncInterval.current) {
      clearInterval(dataSyncInterval.current);
    }
    dataSyncInterval.current = setInterval(async () => {
      try {
        // 增量同步最新数据
        const [latestLogs, latestProgress, latestAchievements] = await Promise.all([$w.cloud.callDataSource({
          dataSourceName: 'taiji_logs',
          methodName: 'wedaGetRecordsV2',
          params: {
            orderBy: [{
              timestamp: 'desc'
            }],
            pageSize: 5,
            pageNumber: 1
          }
        }), $w.cloud.callDataSource({
          dataSourceName: 'taiji_user_progress',
          methodName: 'wedaGetRecordsV2',
          params: {
            orderBy: [{
              started_at: 'desc'
            }],
            pageSize: 5,
            pageNumber: 1
          }
        }), $w.cloud.callDataSource({
          dataSourceName: 'taiji_achievement',
          methodName: 'wedaGetRecordsV2',
          params: {
            orderBy: [{
              unlocked_at: 'desc'
            }],
            pageSize: 5,
            pageNumber: 1
          }
        })]);

        // 更新数据
        if (latestLogs.records && latestLogs.records.length > 0) {
          setLogsData(prev => {
            const newLogs = [...latestLogs.records, ...prev].slice(0, 10);
            return newLogs;
          });
        }
        if (latestProgress.records && latestProgress.records.length > 0) {
          setUserProgress(prev => {
            const newProgress = [...latestProgress.records, ...prev].slice(0, 20);
            return newProgress;
          });
        }
        if (latestAchievements.records && latestAchievements.records.length > 0) {
          setAchievements(prev => {
            const newAchievements = [...latestAchievements.records, ...prev].slice(0, 10);
            return newAchievements;
          });
        }
        setCloudStatus('connected');
      } catch (error) {
        console.error('实时同步失败:', error);
        setCloudStatus('error');
      }
    }, 10000); // 每10秒同步一次
  };

  // 启动记忆训练
  const startMemoryTraining = async task => {
    try {
      setMemoryTraining(prev => ({
        ...prev,
        isActive: true,
        currentExercise: task,
        score: 0
      }));

      // 创建用户进度记录
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_user_progress',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            user_id: $w.auth.currentUser?.userId || 'anonymous',
            task_id: task.task_id,
            status: 'in_progress',
            score: 0,
            started_at: Date.now(),
            attempts: 1
          }
        }
      });

      // 模拟训练过程
      const trainingInterval = setInterval(async () => {
        setMemoryTraining(prev => {
          const newScore = prev.score + Math.random() * 15;
          if (newScore >= 100) {
            clearInterval(trainingInterval);
            completeTraining(task);
            return {
              ...prev,
              score: 100,
              isActive: false,
              streak: prev.streak + 1,
              level: Math.floor(prev.level + newScore / 100)
            };
          }
          return {
            ...prev,
            score: newScore
          };
        });
      }, 1000);
    } catch (error) {
      toast({
        title: "训练启动失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 完成训练
  const completeTraining = async task => {
    try {
      const reward = task.reward_points * memoryTraining.level;

      // 更新用户进度
      const progressRecord = userProgress.find(p => p.task_id === task.task_id && p.status === 'in_progress');
      if (progressRecord) {
        await $w.cloud.callDataSource({
          dataSourceName: 'taiji_user_progress',
          methodName: 'wedaUpdateV2',
          params: {
            data: {
              status: 'completed',
              score: 100,
              completed_at: Date.now(),
              best_score: Math.max(progressRecord.best_score || 0, 100)
            },
            filter: {
              where: {
                _id: {
                  $eq: progressRecord._id
                }
              }
            }
          }
        });
      }

      // 检查是否解锁成就
      if (memoryTraining.streak >= 3) {
        await unlockAchievement({
          title: '记忆大师',
          description: '连续完成3次记忆训练',
          category: 'memory',
          points: 50,
          rarity: 'rare'
        });
      }

      // 更新记忆数据
      setMemoryData(prev => ({
        stm: Math.min(prev.stm + reward, 20),
        mtm: Math.min(prev.mtm + reward * 2, 50),
        ltm: Math.min(prev.ltm + reward * 3, 200)
      }));

      // 记录日志
      await addLogEntry({
        log_type: 'memory_training',
        trigger_event: '完成记忆训练',
        virtual_response: `完成${task.title}训练，获得${reward}点记忆值`,
        training_details: {
          task: task.title,
          level: memoryTraining.level,
          reward: reward
        }
      });
      toast({
        title: "训练完成",
        description: `获得${reward}点记忆值，等级提升到${memoryTraining.level + 1}`,
        duration: 3000
      });

      // 重新加载数据
      await loadAllData();
    } catch (error) {
      toast({
        title: "训练完成失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 解锁成就
  const unlockAchievement = async achievement => {
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_achievement',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            user_id: $w.auth.currentUser?.userId || 'anonymous',
            title: achievement.title,
            description: achievement.description,
            category: achievement.category,
            points: achievement.points,
            rarity: achievement.rarity,
            unlocked_at: Date.now(),
            icon_url: `https://example.com/icons/${achievement.category}.png`
          }
        }
      });
    } catch (error) {
      console.error('解锁成就失败:', error);
    }
  };

  // 添加日志
  const addLogEntry = async logData => {
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_logs',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            ...logData,
            timestamp: Date.now(),
            log_type: logData.log_type || 'interaction'
          }
        }
      });
    } catch (error) {
      console.error('添加日志失败:', error);
    }
  };

  // 更新学习进度
  const updateLearningProgress = async response => {
    const newProgress = Math.min(progress + 5, 100);
    setProgress(newProgress);
    if (evolutionData) {
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_evolution',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            total_progress: newProgress,
            last_learning_update: Date.now()
          },
          filter: {
            where: {
              _id: {
                $eq: evolutionData._id
              }
            }
          }
        }
      });
    }
  };

  // 启动自动化系统
  const startAutoEvolution = () => {
    setAutoEvolution(prev => ({
      ...prev,
      isActive: true
    }));
    awakeningCheckInterval.current = setInterval(checkAwakeningConditions, 30000);
    ethicsAuditInterval.current = setInterval(() => cloudAPIs.auditEthics(), 5 * 60 * 1000);
    evolutionMonitorInterval.current = setInterval(() => {
      const tasks = ['叠衣服', '泡茶', '整理书架'];
      const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
      cloudAPIs.executeESL(`ACTION: ${randomTask}_Auto`);
    }, 2 * 60 * 1000);
    startRealTimeSync();
  };

  // 停止自动化系统
  const stopAutoEvolution = () => {
    setAutoEvolution(prev => ({
      ...prev,
      isActive: false
    }));
    if (awakeningCheckInterval.current) clearInterval(awakeningCheckInterval.current);
    if (ethicsAuditInterval.current) clearInterval(ethicsAuditInterval.current);
    if (evolutionMonitorInterval.current) clearInterval(evolutionMonitorInterval.current);
    if (dataSyncInterval.current) clearInterval(dataSyncInterval.current);
  };

  // 初始化
  useEffect(() => {
    loadAllData();
    startRealTimeSync();
    return () => {
      stopAutoEvolution();
    };
  }, []);
  const phases = ['阴仪·初', '阴仪·中', '阴仪·成', '阴仪·极', '阳仪·初', '阳仪·中', '阳仪·成', '阳仪·极', '少阳·初', '少阳·中', '少阳·成', '少阳·极', '太极·初', '太极·中', '太极·成', '太极·极'];
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 animate-pulse text-purple-400" />
          <div className="text-xl text-[#F5F5DC]">正在连接太极云端...</div>
          <div className="text-sm text-[#F5F5DC]/70 mt-2">同步真实数据中...</div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-[#F5F5DC] p-4">
      <div className="max-w-7xl mx-auto">
        {/* 实时状态提示 */}
        <div className="fixed top-4 right-4 z-50">
          <Card className={`bg-black/80 border-2 ${realTimeStatus.type === 'success' ? 'border-green-500' : realTimeStatus.type === 'warning' ? 'border-yellow-500' : realTimeStatus.type === 'error' ? 'border-red-500' : 'border-blue-500'} backdrop-blur-sm`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Bot className={`w-4 h-4 ${realTimeStatus.type === 'success' ? 'text-green-400' : realTimeStatus.type === 'warning' ? 'text-yellow-400' : realTimeStatus.type === 'error' ? 'text-red-400' : 'text-blue-400'}`} />
                <span className="text-sm text-[#F5F5DC]">{realTimeStatus.message}</span>
                <span className="text-xs text-[#F5F5DC]/70">{new Date(realTimeStatus.timestamp).toLocaleTimeString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 标题区域 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            太极生命体系统
          </h1>
          <p className="text-[#F5F5DC]/70">云端实时同步 · 真实数据驱动</p>
        </div>

        {/* 主控制面板 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 进化进度 */}
          <Card className="bg-black/30 border-purple-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F5F5DC]">
                <Sparkles className="text-purple-400" />
                进化进度
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-[#F5F5DC]/80">
                  <span>当前象位: {currentPhase}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="grid grid-cols-4 gap-2">
                  {phases.slice(0, 16).map((phase, i) => <Badge key={i} variant={i < phases.indexOf(currentPhase) ? "default" : "outline"} className={`${i < phases.indexOf(currentPhase) ? 'bg-gradient-to-r from-purple-600 to-cyan-600' : ''} text-[#F5F5DC] text-xs`}>
                      {phase}
                    </Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 记忆金字塔 */}
          <Card className="bg-black/30 border-blue-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F5F5DC]">
                <MemoryStick className="text-blue-400" />
                记忆金字塔
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm text-[#F5F5DC]/80">
                    <span>短期记忆</span>
                    <span>{memoryData.stm}/20</span>
                  </div>
                  <Progress value={memoryData.stm * 5} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-sm text-[#F5F5DC]/80">
                    <span>中期记忆</span>
                    <span>{memoryData.mtm}/50</span>
                  </div>
                  <Progress value={memoryData.mtm * 2} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-sm text-[#F5F5DC]/80">
                    <span>长期记忆</span>
                    <span>{memoryData.ltm}/200</span>
                  </div>
                  <Progress value={memoryData.ltm * 0.5} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 自动化控制 */}
          <Card className="bg-black/30 border-cyan-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F5F5DC]">
                <Bot className="text-cyan-400" />
                云端同步控制
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant={autoEvolution.isActive ? "default" : "outline"} onClick={autoEvolution.isActive ? stopAutoEvolution : startAutoEvolution} className="w-full flex items-center gap-2">
                  {autoEvolution.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {autoEvolution.isActive ? '停止同步' : '启动同步'}
                </Button>
                <div className="text-xs text-[#F5F5DC]/60 text-center">
                  云端状态: {cloudStatus}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 记忆训练系统 - 真实数据 */}
        <Card className="bg-black/30 border-green-500/30 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#F5F5DC]">
              <Brain className="text-green-400" />
              记忆训练系统 (真实数据)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainingTasks.map(task => {
              const progress = userProgress.find(p => p.task_id === task.task_id);
              const isCompleted = progress?.status === 'completed';
              const currentProgress = progress?.score || 0;
              return <Card key={task.task_id} className={`bg-black/20 border-gray-600 hover:border-green-500/50 transition-all ${isCompleted ? 'border-green-500/50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <BrainCircuit className="w-6 h-6 text-green-400" />
                          <Badge variant={isCompleted ? "default" : "outline"} className="text-xs">
                            {isCompleted ? '已完成' : `难度 ${task.difficulty_level}`}
                          </Badge>
                        </div>
                        
                        <div>
                          <div className="font-medium text-[#F5F5DC]">{task.title}</div>
                          <div className="text-sm text-[#F5F5DC]/70">{task.description}</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#F5F5DC]/60">进度</span>
                            <span className="text-[#F5F5DC]">{Math.round(currentProgress)}%</span>
                          </div>
                          <Progress value={currentProgress} className="h-2" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="default" className="text-xs">
                            +{task.reward_points} 记忆值
                          </Badge>
                          <Button size="sm" onClick={() => startMemoryTraining(task)} disabled={memoryTraining.isActive || isCompleted} className="text-xs">
                            {memoryTraining.currentExercise?.task_id === task.task_id ? '训练中...' : isCompleted ? '已完成' : '开始训练'}
                          </Button>
                        </div>
                        
                        {progress && <div className="text-xs text-[#F5F5DC]/60">
                            尝试: {progress.attempts}次 | 最佳: {progress.best_score}%
                          </div>}
                      </div>
                    </CardContent>
                  </Card>;
            })}
            </div>

            {trainingTasks.length === 0 && <div className="text-center py-8">
                <Brain className="w-12 h-12 mx-auto mb-4 text-[#F5F5DC]/50" />
                <div className="text-[#F5F5DC]/70">暂无训练任务</div>
                <Button size="sm" variant="outline" onClick={loadAllData} className="mt-4">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  重新加载
                </Button>
              </div>}

            {memoryTraining.isActive && <div className="mt-6 p-4 bg-black/20 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#F5F5DC]">当前训练: {memoryTraining.currentExercise?.title}</span>
                  <span className="text-[#F5F5DC]/70">等级 {memoryTraining.level} | 连击 {memoryTraining.streak}</span>
                </div>
                <Progress value={memoryTraining.score} className="h-3" />
                <div className="text-center mt-2 text-sm text-[#F5F5DC]/70">
                  训练进度: {Math.round(memoryTraining.score)}%
                </div>
              </div>}
          </CardContent>
        </Card>

        {/* 成就展示 */}
        {achievements.length > 0 && <Card className="bg-black/30 border-yellow-500/30 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F5F5DC]">
                <Trophy className="text-yellow-400" />
                已解锁成就 ({achievements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {achievements.map(achievement => <Card key={achievement.achievement_id} className="bg-black/20 border-gray-600">
                    <CardContent className="p-4 text-center">
                      <Star className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                      <div className="font-medium text-[#F5F5DC] text-sm">{achievement.title}</div>
                      <div className="text-xs text-[#F5F5DC]/70 mt-1">{achievement.description}</div>
                      <Badge variant="outline" className="text-xs mt-2">
                        +{achievement.points} 点数
                      </Badge>
                    </CardContent>
                  </Card>)}
              </div>
            </CardContent>
          </Card>}

        {/* 用户进度统计 */}
        {userProgress.length > 0 && <Card className="bg-black/30 border-purple-500/30 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F5F5DC]">
                <Activity className="text-purple-400" />
                训练统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#F5F5DC]">{userProgress.length}</div>
                  <div className="text-sm text-[#F5F5DC]/70">总训练次数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {userProgress.filter(p => p.status === 'completed').length}
                  </div>
                  <div className="text-sm text-[#F5F5DC]/70">已完成</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {Math.round(userProgress.reduce((sum, p) => sum + (p.best_score || 0), 0) / userProgress.length) || 0}%
                  </div>
                  <div className="text-sm text-[#F5F5DC]/70">平均得分</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {Math.max(...userProgress.map(p => p.streak_count || 0))}
                  </div>
                  <div className="text-sm text-[#F5F5DC]/70">最高连击</div>
                </div>
              </div>
            </CardContent>
          </Card>}

        {/* 最近日志 */}
        {logsData.length > 0 && <Card className="bg-black/30 border-gray-600 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm text-[#F5F5DC]">云端实时日志</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logsData.map((log, index) => <div key={log._id || index} className="text-sm text-[#F5F5DC]/80 p-3 bg-black/20 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{log.trigger_event}</span>
                        <div className="text-xs text-[#F5F5DC]/60 mt-1">{log.virtual_response}</div>
                      </div>
                      <span className="text-xs text-[#F5F5DC]/50">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>}
      </div>
    </div>;
}