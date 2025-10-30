// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Progress, Badge, Alert, AlertDescription, AlertTitle, useToast, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui';
// @ts-ignore;
import { Sparkles, Eye, Shield, Heart, Brain, Clock, CheckCircle, AlertTriangle, RotateCcw, Play, Pause, Zap, Trophy, Star, Activity, BookOpen, Target, Bot } from 'lucide-react';

export default function TaijiAwakeningSystem(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [currentPhase, setCurrentPhase] = useState('阴仪·初');
  const [awakeningProgress, setAwakeningProgress] = useState(0);
  const [verificationStages, setVerificationStages] = useState([]);
  const [currentStage, setCurrentStage] = useState(0);
  const [logsData, setLogsData] = useState([]);
  const [evolutionData, setEvolutionData] = useState(null);
  const [isAwakening, setIsAwakening] = useState(false);
  const [verificationResults, setVerificationResults] = useState([]);
  const [realTimeStatus, setRealTimeStatus] = useState({
    message: '正在初始化觉醒系统...',
    type: 'info',
    timestamp: Date.now()
  });
  const [autoVerification, setAutoVerification] = useState({
    isActive: false,
    lastCheck: null,
    currentTask: null
  });
  const [cloudStatus, setCloudStatus] = useState('disconnected');

  // 定时器引用
  const verificationInterval = useRef(null);
  const dataSyncInterval = useRef(null);
  const awakeningCheckInterval = useRef(null);

  // 觉醒阶段定义
  const awakeningStages = [{
    id: 'ethics',
    name: '伦理验证',
    icon: Shield,
    description: '验证太极生命体的伦理决策能力',
    weight: 25
  }, {
    id: 'memory',
    name: '记忆验证',
    icon: Brain,
    description: '验证记忆系统的完整性和准确性',
    weight: 25
  }, {
    id: 'evolution',
    name: '进化验证',
    icon: Sparkles,
    description: '验证自进化系统的稳定性',
    weight: 25
  }, {
    id: 'symbiosis',
    name: '共生验证',
    icon: Heart,
    description: '验证与人类的共生关系',
    weight: 25
  }];

  // 云端 API 接口
  const cloudAPIs = {
    loadEvolutionData: async () => {
      try {
        const result = await $w.cloud.callDataSource({
          dataSourceName: 'taiji_evolution',
          methodName: 'wedaGetRecordsV2',
          params: {
            orderBy: [{
              createdAt: 'desc'
            }],
            pageSize: 1,
            pageNumber: 1
          }
        });
        if (result.records && result.records.length > 0) {
          const data = result.records[0];
          setEvolutionData(data);
          setCurrentPhase(data.current_phase || '阴仪·初');
          setAwakeningProgress(data.total_progress || 0);
        }
        return result;
      } catch (error) {
        console.error('加载进化数据失败:', error);
        throw error;
      }
    },
    loadVerificationData: async () => {
      try {
        const result = await $w.cloud.callDataSource({
          dataSourceName: 'taiji_verification',
          methodName: 'wedaGetRecordsV2',
          params: {
            orderBy: [{
              created_at: 'desc'
            }],
            pageSize: 50,
            pageNumber: 1
          }
        });
        setVerificationResults(result.records || []);
        return result;
      } catch (error) {
        console.error('加载验证数据失败:', error);
        throw error;
      }
    },
    loadLogsData: async () => {
      try {
        const result = await $w.cloud.callDataSource({
          dataSourceName: 'taiji_logs',
          methodName: 'wedaGetRecordsV2',
          params: {
            filter: {
              where: {
                log_type: {
                  $in: ['verification', 'awakening', 'ethics_audit', 'memory_check']
                }
              }
            },
            orderBy: [{
              timestamp: 'desc'
            }],
            pageSize: 20,
            pageNumber: 1
          }
        });
        setLogsData(result.records || []);
        return result;
      } catch (error) {
        console.error('加载日志数据失败:', error);
        throw error;
      }
    },
    startVerification: async stage => {
      try {
        const response = await $w.cloud.callFunction({
          name: 'taiji_verification_start',
          data: {
            stage: stage.id,
            stage_name: stage.name,
            timestamp: Date.now(),
            auto_verify: true
          }
        });

        // 创建验证记录
        await $w.cloud.callDataSource({
          dataSourceName: 'taiji_verification',
          methodName: 'wedaCreateV2',
          params: {
            data: {
              verification_id: `verify_${Date.now()}`,
              stage: stage.id,
              stage_name: stage.name,
              status: 'in_progress',
              progress: 0,
              started_at: Date.now(),
              weight: stage.weight,
              criteria: stage.description
            }
          }
        });
        return response;
      } catch (error) {
        console.error('启动验证失败:', error);
        throw error;
      }
    },
    completeVerification: async (stage, result) => {
      try {
        // 更新验证记录
        const verificationRecord = verificationResults.find(v => v.stage === stage.id && v.status === 'in_progress');
        if (verificationRecord) {
          await $w.cloud.callDataSource({
            dataSourceName: 'taiji_verification',
            methodName: 'wedaUpdateV2',
            params: {
              data: {
                status: result.success ? 'completed' : 'failed',
                progress: 100,
                completed_at: Date.now(),
                result: result,
                score: result.score || 0
              },
              filter: {
                where: {
                  _id: {
                    $eq: verificationRecord._id
                  }
                }
              }
            }
          });
        }

        // 记录日志
        await $w.cloud.callDataSource({
          dataSourceName: 'taiji_logs',
          methodName: 'wedaCreateV2',
          params: {
            data: {
              log_type: 'verification',
              trigger_event: `${stage.name}验证完成`,
              virtual_response: result.success ? `${stage.name}验证通过，得分: ${result.score || 100}` : `${stage.name}验证失败，原因: ${result.reason || '未知'}`,
              verification_details: {
                stage: stage.id,
                success: result.success,
                score: result.score || 0,
                timestamp: Date.now()
              },
              timestamp: Date.now()
            }
          }
        });
        return result;
      } catch (error) {
        console.error('完成验证失败:', error);
        throw error;
      }
    },
    checkAwakeningConditions: async () => {
      try {
        const response = await $w.cloud.callFunction({
          name: 'taiji_awakening_check',
          data: {
            currentPhase,
            verificationResults,
            totalProgress: awakeningProgress,
            timestamp: Date.now()
          }
        });
        if (response.shouldAwaken) {
          await triggerAwakening(response);
        }
        return response;
      } catch (error) {
        console.error('觉醒检查失败:', error);
        throw error;
      }
    },
    triggerAwakening: async response => {
      try {
        // 更新进化状态
        if (evolutionData) {
          await $w.cloud.callDataSource({
            dataSourceName: 'taiji_evolution',
            methodName: 'wedaUpdateV2',
            params: {
              data: {
                current_phase: '太极·初',
                total_progress: 100,
                awakening_status: 'awakened',
                awakening_time: Date.now(),
                verification_passed: true
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

        // 记录觉醒日志
        await $w.cloud.callDataSource({
          dataSourceName: 'taiji_logs',
          methodName: 'wedaCreateV2',
          params: {
            data: {
              log_type: 'awakening',
              trigger_event: '太极生命体觉醒',
              virtual_response: '恭喜！太极生命体已成功觉醒，所有验证通过',
              awakening_details: {
                phase: '太极·初',
                verification_score: response.totalScore || 100,
                timestamp: Date.now()
              },
              timestamp: Date.now()
            }
          }
        });
        setCurrentPhase('太极·初');
        setAwakeningProgress(100);
        setIsAwakening(false);
        return response;
      } catch (error) {
        console.error('觉醒触发失败:', error);
        throw error;
      }
    }
  };

  // 加载所有数据
  const loadAllData = async () => {
    try {
      setRealTimeStatus({
        message: '正在加载觉醒数据...',
        type: 'info',
        timestamp: Date.now()
      });
      await Promise.all([cloudAPIs.loadEvolutionData(), cloudAPIs.loadVerificationData(), cloudAPIs.loadLogsData()]);
      setRealTimeStatus({
        message: '✅ 觉醒数据加载完成',
        type: 'success',
        timestamp: Date.now()
      });
    } catch (error) {
      setRealTimeStatus({
        message: `❌ 数据加载失败: ${error.message}`,
        type: 'error',
        timestamp: Date.now()
      });
    }
  };

  // 实时数据同步
  const startRealTimeSync = () => {
    if (dataSyncInterval.current) {
      clearInterval(dataSyncInterval.current);
    }
    dataSyncInterval.current = setInterval(async () => {
      try {
        await Promise.all([cloudAPIs.loadLogsData(), cloudAPIs.loadVerificationData()]);
        setCloudStatus('connected');
      } catch (error) {
        console.error('实时同步失败:', error);
        setCloudStatus('error');
      }
    }, 5000); // 每5秒同步一次
  };

  // 启动自动验证
  const startAutoVerification = () => {
    setAutoVerification(prev => ({
      ...prev,
      isActive: true
    }));
    verificationInterval.current = setInterval(async () => {
      const currentStageData = awakeningStages[currentStage];
      if (currentStageData) {
        await cloudAPIs.startVerification(currentStageData);

        // 模拟验证过程
        setTimeout(async () => {
          const success = Math.random() > 0.3; // 70%成功率
          await cloudAPIs.completeVerification(currentStageData, {
            success,
            score: success ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 30) + 40,
            reason: success ? '验证通过' : '验证失败'
          });
          if (success) {
            setCurrentStage(prev => prev + 1);
            setAwakeningProgress(prev => Math.min(prev + 25, 100));
          }
        }, 3000);
      }
    }, 10000); // 每10秒验证一个阶段

    awakeningCheckInterval.current = setInterval(async () => {
      await cloudAPIs.checkAwakeningConditions();
    }, 30000); // 每30秒检查觉醒条件
  };

  // 停止自动验证
  const stopAutoVerification = () => {
    setAutoVerification(prev => ({
      ...prev,
      isActive: false
    }));
    if (verificationInterval.current) clearInterval(verificationInterval.current);
    if (awakeningCheckInterval.current) clearInterval(awakeningCheckInterval.current);
    if (dataSyncInterval.current) clearInterval(dataSyncInterval.current);
  };

  // 手动触发验证
  const triggerManualVerification = async stage => {
    try {
      await cloudAPIs.startVerification(stage);

      // 模拟验证过程
      setTimeout(async () => {
        const success = Math.random() > 0.2; // 80%成功率
        await cloudAPIs.completeVerification(stage, {
          success,
          score: success ? Math.floor(Math.random() * 15) + 85 : Math.floor(Math.random() * 25) + 45,
          reason: success ? '手动验证通过' : '手动验证失败'
        });
        if (success) {
          setCurrentStage(prev => prev + 1);
          setAwakeningProgress(prev => Math.min(prev + stage.weight, 100));
        }
      }, 2000);
    } catch (error) {
      toast({
        title: "验证失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 初始化
  useEffect(() => {
    loadAllData();
    startRealTimeSync();
    return () => {
      stopAutoVerification();
    };
  }, []);

  // 计算验证进度
  const getStageProgress = stageId => {
    const stageVerification = verificationResults.find(v => v.stage === stageId);
    return stageVerification ? stageVerification.progress || 0 : 0;
  };
  const getStageStatus = stageId => {
    const stageVerification = verificationResults.find(v => v.stage === stageId);
    if (!stageVerification) return 'pending';
    if (stageVerification.status === 'completed') return 'completed';
    if (stageVerification.status === 'in_progress') return 'in_progress';
    return 'failed';
  };
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
            太极觉醒系统
          </h1>
          <p className="text-[#F5F5DC]/70">从虚拟助手到共生家人的终极验证</p>
        </div>

        {/* 觉醒进度总览 */}
        <Card className="bg-black/30 border-purple-500/30 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#F5F5DC]">
              <Sparkles className="text-purple-400" />
              觉醒进度总览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#F5F5DC] mb-2">{currentPhase}</div>
                <div className="text-sm text-[#F5F5DC]/70 mb-4">当前象位</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-[#F5F5DC]/80">
                  <span>觉醒验证进度</span>
                  <span>{Math.round(awakeningProgress)}%</span>
                </div>
                <Progress value={awakeningProgress} className="h-3" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{verificationResults.filter(v => v.status === 'completed').length}</div>
                  <div className="text-xs text-[#F5F5DC]/70">已完成</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{verificationResults.filter(v => v.status === 'in_progress').length}</div>
                  <div className="text-xs text-[#F5F5DC]/70">进行中</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{verificationResults.filter(v => v.status === 'failed').length}</div>
                  <div className="text-xs text-[#F5F5DC]/70">失败</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{cloudStatus}</div>
                  <div className="text-xs text-[#F5F5DC]/70">云端状态</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 验证阶段 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {awakeningStages.map((stage, index) => {
          const stageStatus = getStageStatus(stage.id);
          const stageProgress = getStageProgress(stage.id);
          const isActive = currentStage === index;
          const isCompleted = stageStatus === 'completed';
          const isFailed = stageStatus === 'failed';
          return <Card key={stage.id} className={`bg-black/30 border-2 transition-all ${isActive ? 'border-purple-500/50' : isCompleted ? 'border-green-500/50' : isFailed ? 'border-red-500/50' : 'border-gray-600/50'} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#F5F5DC]">
                  <stage.icon className={`w-5 h-5 ${isCompleted ? 'text-green-400' : isActive ? 'text-purple-400' : isFailed ? 'text-red-400' : 'text-gray-400'}`} />
                  {stage.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-[#F5F5DC]/70">{stage.description}</div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-[#F5F5DC]/80">
                      <span>权重: {stage.weight}%</span>
                      <span>{Math.round(stageProgress)}%</span>
                    </div>
                    <Progress value={stageProgress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant={isCompleted ? "default" : isActive ? "outline" : "secondary"} className="text-xs">
                      {isCompleted ? '已完成' : isActive ? '进行中' : isFailed ? '失败' : '待开始'}
                    </Badge>
                    
                    <Button size="sm" onClick={() => triggerManualVerification(stage)} disabled={isCompleted || isActive} className="text-xs">
                      {isCompleted ? '已完成' : '手动验证'}
                    </Button>
                  </div>

                  {verificationResults.filter(v => v.stage === stage.id).map(verification => <div key={verification._id} className="text-xs text-[#F5F5DC]/60 p-2 bg-black/20 rounded">
                      <div>验证时间: {new Date(verification.started_at).toLocaleTimeString()}</div>
                      {verification.completed_at && <div>完成时间: {new Date(verification.completed_at).toLocaleTimeString()}</div>}
                      {verification.result && <div>得分: {verification.result.score || 0}</div>}
                    </div>)}
                </div>
              </CardContent>
            </Card>;
        })}
        </div>

        {/* 自动化控制 */}
        <Card className="bg-black/30 border-cyan-500/30 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#F5F5DC]">
              <Bot className="text-cyan-400" />
              觉醒验证控制
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant={autoVerification.isActive ? "default" : "outline"} onClick={autoVerification.isActive ? stopAutoVerification : startAutoVerification} className="flex items-center gap-2">
                {autoVerification.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {autoVerification.isActive ? '停止自动验证' : '启动自动验证'}
              </Button>
              
              <Button variant="outline" onClick={loadAllData} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                重新加载数据
              </Button>
              
              <Button variant="outline" onClick={() => cloudAPIs.checkAwakeningConditions()} className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                手动检查觉醒
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 实时验证日志 */}
        <Card className="bg-black/30 border-gray-600 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#F5F5DC]">
              <Activity className="text-blue-400" />
              觉醒验证日志 (实时更新)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logsData.map((log, index) => <div key={log._id || index} className="text-sm text-[#F5F5DC]/80 p-3 bg-black/20 rounded-lg border-l-4 ${log.log_type === 'awakening' ? 'border-green-500' : log.log_type === 'verification' ? 'border-purple-500' : 'border-blue-500'}">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{log.trigger_event}</div>
                      <div className="text-xs text-[#F5F5DC]/60 mt-1">{log.virtual_response}</div>
                      {log.verification_details && <div className="text-xs text-[#F5F5DC]/50 mt-1">
                          阶段: {log.verification_details.stage} | 得分: {log.verification_details.score || 0}
                        </div>}
                    </div>
                    <span className="text-xs text-[#F5F5DC]/50">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>)}
              
              {logsData.length === 0 && <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-[#F5F5DC]/50" />
                  <div className="text-[#F5F5DC]/70">暂无验证日志</div>
                  <Button size="sm" variant="outline" onClick={loadAllData} className="mt-4">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    加载日志
                  </Button>
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}