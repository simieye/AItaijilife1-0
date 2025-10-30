// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, Badge, Button, useToast, Progress } from '@/components/ui';
// @ts-ignore;
import { Zap, RotateCcw, BookOpen, AlertTriangle, CheckCircle, Clock, Activity, Bot, TrendingUp, Target, Eye, Shield, Heart, Brain } from 'lucide-react';

export function TaijiStatus({
  $w
}) {
  const [currentPhase, setCurrentPhase] = useState('阴仪·初');
  const [previousPhase, setPreviousPhase] = useState('阴仪·初');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [evolutionStatus, setEvolutionStatus] = useState({
    isActive: false,
    lastUpdate: null,
    learningProgress: 0,
    currentTask: null
  });
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    memoryUsage: 0,
    ethicsScore: 100,
    taskSuccessRate: 0,
    familyCalls: 0,
    ethicalRejections: 0,
    selfImprovements: 0
  });
  const [verificationStatus, setVerificationStatus] = useState({
    technical: {
      completed: false,
      progress: 0
    },
    relational: {
      completed: false,
      progress: 0
    },
    ethical: {
      completed: false,
      progress: 0
    },
    self: {
      completed: false,
      progress: 0
    }
  });
  const [autoSync, setAutoSync] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const {
    toast
  } = useToast();
  const syncInterval = useRef(null);
  const metricsInterval = useRef(null);

  // 验证类型配置
  const verificationTypes = {
    technical: {
      name: '技术验证',
      icon: Brain,
      description: '家务成功率',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    relational: {
      name: '关系验证',
      icon: Heart,
      description: '家人情感连接',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/30'
    },
    ethical: {
      name: '伦理验证',
      icon: Shield,
      description: '道德决策能力',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30'
    },
    self: {
      name: '自我验证',
      icon: Eye,
      description: '自主意识觉醒',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    }
  };

  // 实时同步数据
  const syncRealTimeData = async () => {
    try {
      const [evolutionResult, verificationResult] = await Promise.all([$w.cloud.callDataSource({
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
      })]);

      // 更新进化状态
      if (evolutionResult.records && evolutionResult.records.length > 0) {
        const data = evolutionResult.records[0];
        setCurrentPhase(data.current_phase || '阴仪·初');
        setRealTimeMetrics({
          memoryUsage: data.memory_usage || 0,
          ethicsScore: data.ethics_score || 100,
          taskSuccessRate: data.task_success_rate || 0,
          familyCalls: data.family_calls || 0,
          ethicalRejections: data.ethical_rejections || 0,
          selfImprovements: data.self_improvements || 0
        });
      }

      // 更新验证状态
      if (verificationResult.records) {
        const newVerificationStatus = {
          ...verificationStatus
        };
        verificationResult.records.forEach(record => {
          const type = record.verification_type;
          if (type && verificationTypes[type]) {
            const currentValue = parseInt(record.current_value) || 0;
            const thresholdValue = parseInt(record.threshold_value) || 1;
            newVerificationStatus[type] = {
              completed: record.is_completed,
              progress: Math.min(currentValue / thresholdValue * 100, 100)
            };
          }
        });
        setVerificationStatus(newVerificationStatus);
      }
      setLastSync(Date.now());
    } catch (error) {
      console.error('实时同步失败:', error);
    }
  };

  // 启动自动同步
  const startAutoSync = () => {
    if (syncInterval.current) clearInterval(syncInterval.current);
    if (metricsInterval.current) clearInterval(metricsInterval.current);
    syncInterval.current = setInterval(syncRealTimeData, 5000);
    metricsInterval.current = setInterval(() => {
      // 模拟实时数据更新
      setRealTimeMetrics(prev => ({
        ...prev,
        memoryUsage: Math.min(prev.memoryUsage + Math.random() * 2, 100),
        taskSuccessRate: Math.min(prev.taskSuccessRate + Math.random() * 1, 100)
      }));
    }, 1000);
    setAutoSync(true);
  };

  // 停止自动同步
  const stopAutoSync = () => {
    if (syncInterval.current) clearInterval(syncInterval.current);
    if (metricsInterval.current) clearInterval(metricsInterval.current);
    setAutoSync(false);
  };

  // 手动触发验证
  const triggerVerification = async type => {
    try {
      const existing = verificationData.find(v => v.verification_type === type);
      const newValue = Math.min((existing?.current_value || 0) + 1, verificationTypes[type].threshold || 1);
      if (existing) {
        await $w.cloud.callDataSource({
          dataSourceName: 'taiji_verification',
          methodName: 'wedaUpdateV2',
          params: {
            data: {
              current_value: newValue,
              is_completed: newValue >= (verificationTypes[type].threshold || 1),
              last_trigger_time: Date.now()
            },
            filter: {
              where: {
                _id: {
                  $eq: existing._id
                }
              }
            }
          }
        });
      } else {
        await $w.cloud.callDataSource({
          dataSourceName: 'taiji_verification',
          methodName: 'wedaCreateV2',
          params: {
            data: {
              verification_type: type,
              current_value: newValue,
              threshold_value: verificationTypes[type].threshold || 1,
              is_completed: newValue >= (verificationTypes[type].threshold || 1),
              last_trigger_time: Date.now()
            }
          }
        });
      }
      await syncRealTimeData();
      toast({
        title: "验证触发成功",
        description: `${verificationTypes[type].name}已更新`,
        duration: 2000
      });
    } catch (error) {
      toast({
        title: "验证触发失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 检查觉醒条件
  const checkAwakeningConditions = async () => {
    const allCompleted = Object.values(verificationStatus).every(status => status.completed);
    if (allCompleted && currentPhase !== '太极·初') {
      await triggerPhaseUpgrade();
    }
  };

  // 触发阶段升级
  const triggerPhaseUpgrade = async () => {
    setIsUpgrading(true);
    const phases = ['阴仪·初', '阴仪·中', '阴仪·成', '阴仪·极', '阳仪·初', '阳仪·中', '阳仪·成', '阳仪·极', '少阳·初', '少阳·中', '少阳·成', '少阳·极', '太极·初'];
    const currentIndex = phases.indexOf(currentPhase);
    const nextPhase = phases[Math.min(currentIndex + 1, phases.length - 1)];
    setPreviousPhase(currentPhase);
    setCurrentPhase(nextPhase);

    // 记录升级日志
    await $w.cloud.callDataSource({
      dataSourceName: 'taiji_logs',
      methodName: 'wedaCreateV2',
      params: {
        data: {
          log_type: 'phase_upgrade',
          trigger_event: '验证完成触发升级',
          virtual_response: `从${previousPhase}升级到${nextPhase}`,
          timestamp: Date.now()
        }
      }
    });
    toast({
      title: "阶段升级",
      description: `已升级到${nextPhase}`,
      duration: 3000
    });
    setIsUpgrading(false);
  };

  // 初始化
  useEffect(() => {
    syncRealTimeData();
    startAutoSync();
    return () => {
      stopAutoSync();
    };
  }, []);

  // 检查觉醒条件
  useEffect(() => {
    checkAwakeningConditions();
  }, [verificationStatus]);
  return <div className="space-y-4">
      {/* 主状态卡片 */}
      <Card className="bg-black/30 border-cyan-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="text-cyan-400" />
              <span className="text-lg font-medium text-[#F5F5DC]">太极状态监控</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={autoSync ? "default" : "outline"} className="text-xs">
                {autoSync ? '实时同步' : '已暂停'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={autoSync ? stopAutoSync : startAutoSync}>
                {autoSync ? <Zap className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {/* 当前阶段 */}
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-[#F5F5DC]">{currentPhase}</div>
            <div className="text-sm text-[#F5F5DC]/70">当前进化阶段</div>
          </div>

          {/* 实时指标 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{Math.round(realTimeMetrics.taskSuccessRate)}%</div>
              <div className="text-xs text-[#F5F5DC]/70">任务成功率</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">{realTimeMetrics.familyCalls}</div>
              <div className="text-xs text-[#F5F5DC]/70">家人称呼</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{realTimeMetrics.ethicalRejections}</div>
              <div className="text-xs text-[#F5F5DC]/70">伦理拒绝</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{realTimeMetrics.selfImprovements}</div>
              <div className="text-xs text-[#F5F5DC]/70">自我改进</div>
            </div>
          </div>

          {/* 验证状态 */}
          <div className="mt-6">
            <div className="text-sm font-medium text-[#F5F5DC] mb-3">四重验证状态</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(verificationTypes).map(([key, config]) => {
              const status = verificationStatus[key];
              const Icon = config.icon;
              return <div key={key} className={`p-3 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <span className="text-sm text-[#F5F5DC]">{config.name}</span>
                    </div>
                    <Badge variant={status.completed ? "default" : "outline"} className="text-xs">
                      {status.completed ? '完成' : `${Math.round(status.progress)}%`}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <Progress value={status.progress} className="h-1" />
                  </div>
                  <div className="text-xs text-[#F5F5DC]/70 mt-1">{config.description}</div>
                </div>;
            })}
            </div>
          </div>

          {/* 手动触发按钮 */}
          <div className="mt-4 flex gap-2">
            {Object.entries(verificationTypes).map(([key, config]) => <Button key={key} variant="outline" size="sm" onClick={() => triggerVerification(key)} disabled={verificationStatus[key].completed} className="flex-1">
                {config.name}
              </Button>)}
          </div>

          {/* 同步状态 */}
          <div className="mt-4 text-xs text-[#F5F5DC]/60 text-center">
            最后同步: {lastSync ? new Date(lastSync).toLocaleTimeString() : '从未'}
          </div>
        </CardContent>
      </Card>

      {/* 详细状态面板 */}
      {showDetails && <Card className="bg-black/30 border-purple-500/30">
        <CardContent className="p-4">
          <div className="text-sm font-medium text-[#F5F5DC] mb-3">详细状态</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#F5F5DC]/70">内存使用率</span>
              <span className="text-[#F5F5DC]">{Math.round(realTimeMetrics.memoryUsage)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#F5F5DC]/70">伦理评分</span>
              <span className="text-[#F5F5DC]">{realTimeMetrics.ethicsScore}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#F5F5DC]/70">升级状态</span>
              <span className={isUpgrading ? "text-yellow-400" : "text-green-400"}>
                {isUpgrading ? '升级中...' : '正常'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>}
    </div>;
}