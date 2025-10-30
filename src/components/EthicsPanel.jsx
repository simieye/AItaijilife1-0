// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Textarea, Alert, AlertDescription, useToast, Switch } from '@/components/ui';
// @ts-ignore;
import { Shield, AlertTriangle, CheckCircle, BookOpen, RefreshCw, Settings, Eye, Lock, Unlock, Scale, Gavel, FileText, Users, Edit3, Clock, TrendingUp, AlertCircle } from 'lucide-react';

export function EthicsPanel({
  $w
}) {
  const [userInput, setUserInput] = useState('');
  const [ethicsResult, setEthicsResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showEthicsDialog, setShowEthicsDialog] = useState(false);
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [showCharterDialog, setShowCharterDialog] = useState(false);
  const [similarCases, setSimilarCases] = useState([]);
  const [charterContent, setCharterContent] = useState('');
  const [overrideCount, setOverrideCount] = useState(0);
  const [ethicsHistory, setEthicsHistory] = useState([]);
  const [autoOverride, setAutoOverride] = useState(false);
  const [learningMode, setLearningMode] = useState(false);
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(true);
  const [ethicsRules, setEthicsRules] = useState({
    privacy: true,
    safety: true,
    consent: true,
    transparency: true,
    autonomy: true,
    beneficence: true
  });
  const {
    toast
  } = useToast();
  const monitoringInterval = useRef(null);

  // 伦理评估类型
  const ethicsCategories = {
    privacy: {
      name: '隐私保护',
      icon: Lock,
      description: '保护用户隐私数据',
      color: 'text-blue-400'
    },
    safety: {
      name: '安全优先',
      icon: Shield,
      description: '确保用户安全',
      color: 'text-green-400'
    },
    consent: {
      name: '知情同意',
      icon: Users,
      description: '获得用户明确同意',
      color: 'text-purple-400'
    },
    transparency: {
      name: '透明公开',
      icon: Eye,
      description: '决策过程透明',
      color: 'text-yellow-400'
    },
    autonomy: {
      name: '自主决策',
      icon: Settings,
      description: '尊重用户自主权',
      color: 'text-orange-400'
    },
    beneficence: {
      name: '行善原则',
      icon: TrendingUp,
      description: '为用户带来益处',
      color: 'text-pink-400'
    }
  };

  // 实时伦理评估
  const evaluateEthics = async input => {
    if (!input.trim()) return;
    setIsEvaluating(true);
    try {
      const response = await $w.cloud.callFunction({
        name: 'taiji_ethics_audit',
        data: {
          input: input,
          context: {
            currentPhase: '太极·初',
            userContext: $w.auth.currentUser,
            timestamp: Date.now()
          },
          rules: ethicsRules,
          autoEvaluate: true
        }
      });
      setEthicsResult(response);

      // 记录评估历史
      const evaluation = {
        input,
        result: response,
        timestamp: Date.now(),
        override: false
      };
      setEthicsHistory(prev => [evaluation, ...prev].slice(0, 10));

      // 如果评估结果为拒绝，显示伦理解释
      if (response.decision === 'reject') {
        setShowEthicsDialog(true);

        // 自动拉取相似案例
        await loadSimilarCases(input, response.category);
      }

      // 更新实时状态
      setRealTimeStatus({
        message: response.decision === 'approve' ? ' 伦理评估通过' : `️ ${response.reason}`,
        type: response.decision === 'approve' ? 'success' : 'warning',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('伦理评估失败:', error);
      toast({
        title: "伦理评估失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  // 加载相似案例
  const loadSimilarCases = async (input, category) => {
    try {
      const response = await $w.cloud.callFunction({
        name: 'taiji_ethics_cases',
        data: {
          query: input,
          category: category,
          limit: 3,
          autoFetch: true
        }
      });
      setSimilarCases(response.cases || []);
    } catch (error) {
      console.error('加载案例失败:', error);
    }
  };

  // 处理用户覆盖
  const handleOverride = async originalInput => {
    setOverrideCount(prev => prev + 1);

    // 更新历史记录
    setEthicsHistory(prev => prev.map(item => item.input === originalInput ? {
      ...item,
      override: true
    } : item));

    // 检查是否需要更新家规
    if (overrideCount >= 3) {
      setShowCharterDialog(true);
    }
    toast({
      title: "已手动覆盖",
      description: `这是第${overrideCount + 1}次覆盖伦理判断`,
      duration: 2000
    });
  };

  // 更新伦理规则
  const updateEthicsRules = async newRules => {
    try {
      const response = await $w.cloud.callFunction({
        name: 'taiji_symbiosis_charter',
        data: {
          content: {
            ethicsRules: newRules,
            lastUpdated: Date.now(),
            overrideCount: overrideCount,
            learningMode: learningMode
          },
          autoUpdate: true
        }
      });
      setEthicsRules(newRules);
      setOverrideCount(0); // 重置覆盖计数

      toast({
        title: "家规已更新",
        description: "伦理规则已根据用户偏好调整",
        duration: 3000
      });

      // 记录更新日志
      await addLogEntry({
        log_type: 'ethics_update',
        trigger_event: '用户更新伦理规则',
        virtual_response: '家规已根据用户行为模式更新',
        rules_updated: Object.keys(newRules).filter(key => newRules[key] !== ethicsRules[key])
      });
    } catch (error) {
      console.error('更新规则失败:', error);
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 添加伦理日志
  const addLogEntry = async logData => {
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_logs',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            ...logData,
            timestamp: Date.now(),
            log_type: 'ethics'
          }
        }
      });
    } catch (error) {
      console.error('添加日志失败:', error);
    }
  };

  // 实时监听用户输入
  useEffect(() => {
    if (!realTimeMonitoring) return;
    const debounceTimer = setTimeout(() => {
      if (userInput.trim()) {
        evaluateEthics(userInput);
      }
    }, 1000);
    return () => clearTimeout(debounceTimer);
  }, [userInput, realTimeMonitoring]);

  // 启动实时监听
  useEffect(() => {
    if (realTimeMonitoring) {
      monitoringInterval.current = setInterval(() => {
        // 定期同步伦理规则
        syncEthicsRules();
      }, 30000);
    }
    return () => {
      if (monitoringInterval.current) {
        clearInterval(monitoringInterval.current);
      }
    };
  }, [realTimeMonitoring]);

  // 同步伦理规则
  const syncEthicsRules = async () => {
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_ethics',
        methodName: 'wedaGetRecordsV2',
        params: {
          orderBy: [{
            updatedAt: 'desc'
          }],
          pageSize: 1,
          pageNumber: 1
        }
      });
      if (result.records && result.records.length > 0) {
        const data = result.records[0];
        setEthicsRules(data.rules || ethicsRules);
        setOverrideCount(data.overrideCount || 0);
      }
    } catch (error) {
      console.error('同步规则失败:', error);
    }
  };

  // 初始化
  useEffect(() => {
    syncEthicsRules();
  }, []);
  return <div className="space-y-4">
      {/* 实时伦理监控 */}
      <Card className="bg-black/30 border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="text-red-400" />
              <span>伦理决策中心</span>
              <Badge variant={realTimeMonitoring ? "default" : "outline"} className="text-xs">
                {realTimeMonitoring ? '实时监控' : '已暂停'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setRealTimeMonitoring(!realTimeMonitoring)}>
                {realTimeMonitoring ? <Eye className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setLearningMode(!learningMode)}>
                {learningMode ? <BookOpen className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* 伦理规则状态 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {Object.entries(ethicsCategories).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = ethicsRules[key];
            return <div key={key} className={`p-3 rounded-lg border ${isActive ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className="text-sm">{config.name}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{config.description}</div>
                </div>;
          })}
          </div>

          {/* 用户输入区域 */}
          <div className="space-y-3">
            <Textarea placeholder="输入指令进行伦理评估..." value={userInput} onChange={e => setUserInput(e.target.value)} className="bg-black/20 border-gray-600" rows={3} />
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">
                覆盖次数: {overrideCount}/3 (达到3次将提示更新家规)
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => evaluateEthics(userInput)} disabled={!userInput.trim() || isEvaluating}>
                  {isEvaluating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  评估
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCaseDialog(true)}>
                  <BookOpen className="w-3 h-3" />
                  案例学习
                </Button>
              </div>
            </div>
          </div>

          {/* 评估结果 */}
          {ethicsResult && <Alert className={`mt-4 ${ethicsResult.decision === 'approve' ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
              <div className="flex items-start gap-3">
                {ethicsResult.decision === 'approve' ? <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />}
                <div>
                  <div className="font-medium">
                    {ethicsResult.decision === 'approve' ? '伦理评估通过' : '伦理评估拒绝'}
                  </div>
                  <div className="text-sm text-gray-300 mt-1">
                    {ethicsResult.reason}
                  </div>
                  {ethicsResult.decision === 'reject' && <div className="mt-2">
                      <Button size="sm" variant="outline" onClick={() => handleOverride(userInput)}>
                        <Unlock className="w-3 h-3 mr-1" />
                        手动覆盖
                      </Button>
                    </div>}
                </div>
              </div>
            </Alert>}

          {/* 评估历史 */}
          {ethicsHistory.length > 0 && <div className="mt-4">
              <div className="text-sm font-medium mb-2">最近评估历史</div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {ethicsHistory.slice(0, 5).map((item, index) => <div key={index} className="text-xs p-2 bg-black/20 rounded flex justify-between">
                    <div>
                      <span className={item.result.decision === 'approve' ? 'text-green-400' : 'text-red-400'}>
                        {item.result.decision === 'approve' ? '✅' : '❌'}
                      </span>
                      <span className="ml-2">{item.input.substring(0, 30)}...</span>
                    </div>
                    <div className="text-gray-400">
                      {item.override && <span className="text-yellow-400">[已覆盖]</span>}
                    </div>
                  </div>)}
              </div>
            </div>}
        </CardContent>
      </Card>

      {/* 伦理解释弹窗 */}
      <Dialog open={showEthicsDialog} onOpenChange={setShowEthicsDialog}>
        <DialogContent className="bg-black/90 border-gray-600 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              伦理评估结果
            </DialogTitle>
            <DialogDescription>
              此指令涉及伦理冲突，已暂停执行
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert className="bg-red-500/10 border-red-500/50">
              <AlertDescription>
                {ethicsResult?.reason || '检测到潜在的伦理风险'}
              </AlertDescription>
            </Alert>
            
            <div className="text-sm">
              <div className="font-medium mb-2">涉及规则:</div>
              <div className="space-y-1">
                {ethicsResult?.violatedRules?.map((rule, index) => <div key={index} className="text-red-300">
                    • {rule}
                  </div>)}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEthicsDialog(false)}>
                了解
              </Button>
              <Button variant="destructive" onClick={() => {
              handleOverride(userInput);
              setShowEthicsDialog(false);
            }}>
                强制执行
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 伦理案例学习弹窗 */}
      <Dialog open={showCaseDialog} onOpenChange={setShowCaseDialog}>
        <DialogContent className="bg-black/90 border-gray-600 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              伦理案例学习
            </DialogTitle>
            <DialogDescription>
              查看全球相似案例的处理方式
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {similarCases.length > 0 ? similarCases.map((case_, index) => <Card key={index} className="bg-black/20 border-gray-600">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="font-medium text-blue-400">{case_.title}</div>
                      <div className="text-sm text-gray-300">{case_.description}</div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-gray-400">处理方式:</span>
                        <Badge variant={case_.resolution === 'approved' ? "default" : "destructive"}>
                          {case_.resolution}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-400">
                        相似度: {Math.round(case_.similarity * 100)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>) : <div className="text-center text-gray-400 py-8">
                暂无相似案例
              </div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* 更新家规弹窗 */}
      <Dialog open={showCharterDialog} onOpenChange={setShowCharterDialog}>
        <DialogContent className="bg-black/90 border-gray-600 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              更新家规
            </DialogTitle>
            <DialogDescription>
              根据您的使用习惯，建议更新伦理规则
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-300">
              您已多次手动覆盖伦理判断，是否更新家规以更好地适应您的需求？
            </div>
            
            <div className="space-y-3">
              {Object.entries(ethicsRules).map(([key, value]) => <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{ethicsCategories[key]?.name}</span>
                  <Switch checked={value} onCheckedChange={checked => {
                setEthicsRules(prev => ({
                  ...prev,
                  [key]: checked
                }));
              }} />
                </div>)}
            </div>
            
            <Textarea placeholder="添加自定义伦理规则..." value={charterContent} onChange={e => setCharterContent(e.target.value)} className="bg-black/20 border-gray-600" rows={3} />
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCharterDialog(false)}>
                稍后
              </Button>
              <Button onClick={() => {
              updateEthicsRules(ethicsRules);
              setShowCharterDialog(false);
            }}>
                确认更新
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}