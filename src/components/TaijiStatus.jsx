// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, Badge, Button, useToast } from '@/components/ui';
// @ts-ignore;
import { Zap, RotateCcw, BookOpen, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';

export function TaijiStatus({
  $w
}) {
  const [currentPhase, setCurrentPhase] = useState('阴仪·初');
  const [previousPhase, setPreviousPhase] = useState('阴仪·初');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [evolutionStatus, setEvolutionStatus] = useState({
    isActive: false,
    currentTask: null,
    lastUpdate: null,
    syncStatus: 'connected'
  });
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const {
    toast
  } = useToast();
  const logsRef = useRef(null);

  // 太极阴阳旋转动画
  const TaijiAnimation = ({
    isAnimating
  }) => <div className={`relative w-16 h-16 ${isAnimating ? 'animate-spin' : ''}`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white via-gray-300 to-black">
        <div className="absolute top-0 left-1/2 w-8 h-8 bg-black rounded-full transform -translate-x-1/2">
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="absolute bottom-0 left-1/2 w-8 h-8 bg-white rounded-full transform -translate-x-1/2">
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-black rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>
    </div>;

  // 实时监听进化等级变化
  const listenToEvolutionChanges = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const db = tcb.database();

      // 监听进化等级数据变化
      const watcher = db.collection('taiji_evolution').orderBy('createdAt', 'desc').limit(1).watch({
        onChange: snapshot => {
          if (snapshot.docs.length > 0) {
            const data = snapshot.docs[0].data();
            handlePhaseChange(data);
          }
        },
        onError: error => {
          console.error('监听进化数据失败:', error);
          setSyncError(error);
          setEvolutionStatus(prev => ({
            ...prev,
            syncStatus: 'error'
          }));
        }
      });
      return () => watcher.close();
    } catch (error) {
      console.error('设置监听失败:', error);
      setSyncError(error);
      setEvolutionStatus(prev => ({
        ...prev,
        syncStatus: 'error'
      }));
    }
  };

  // 处理象位升级
  const handlePhaseChange = async newData => {
    const newPhase = newData.current_phase || '阴仪·初';
    if (newPhase !== currentPhase) {
      setPreviousPhase(currentPhase);
      setCurrentPhase(newPhase);
      setIsUpgrading(true);

      // 播放升级特效
      toast({
        title: "象位升级！",
        description: `从 ${previousPhase} 升级到 ${newPhase}`,
        duration: 3000
      });

      // 3秒后停止动画
      setTimeout(() => {
        setIsUpgrading(false);
      }, 3000);

      // 记录升级日志
      await addLogEntry({
        log_type: 'phase_upgrade',
        trigger_event: '象位升级',
        virtual_response: `成功升级到 ${newPhase}`,
        upgrade_details: {
          from: previousPhase,
          to: newPhase,
          timestamp: Date.now()
        }
      });
    }

    // 更新自进化状态
    setEvolutionStatus(prev => ({
      ...prev,
      lastUpdate: newData.updatedAt || Date.now(),
      syncStatus: 'connected'
    }));
  };

  // 获取自进化活跃状态
  const getEvolutionStatusText = () => {
    const statusMap = {
      'learning_user_preferences': '正在学习用户偏好',
      'ethics_firewall_update': '伦理防火墙更新中',
      'memory_optimization': '记忆优化中',
      'skill_acquisition': '技能习得中',
      'syncing': '数据同步中',
      'idle': '待机中'
    };
    return statusMap[evolutionStatus.currentTask] || '系统运行中';
  };

  // 获取最新日志
  const loadLatestLogs = async () => {
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_logs',
        methodName: 'wedaGetRecordsV2',
        params: {
          orderBy: [{
            timestamp: 'desc'
          }],
          pageSize: 10,
          pageNumber: 1
        }
      });
      setLogs(result.records || []);
    } catch (error) {
      console.error('加载日志失败:', error);
      setSyncError(error);
    }
  };

  // 添加日志条目
  const addLogEntry = async logData => {
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_logs',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            ...logData,
            timestamp: Date.now()
          }
        }
      });
      await loadLatestLogs();
    } catch (error) {
      console.error('添加日志失败:', error);
    }
  };

  // 手动重试同步
  const retrySync = async () => {
    setSyncError(null);
    setEvolutionStatus(prev => ({
      ...prev,
      syncStatus: 'reconnecting'
    }));
    try {
      await loadLatestLogs();
      await listenToEvolutionChanges();
      toast({
        title: "同步成功",
        description: "数据已重新同步",
        duration: 2000
      });
      setEvolutionStatus(prev => ({
        ...prev,
        syncStatus: 'connected'
      }));
    } catch (error) {
      setSyncError(error);
      setEvolutionStatus(prev => ({
        ...prev,
        syncStatus: 'error'
      }));
    }
  };

  // 滚动到最新日志
  const scrollToLatestLog = () => {
    if (logsRef.current) {
      logsRef.current.scrollTop = 0;
    }
  };

  // 监听自进化状态变化
  const monitorEvolutionStatus = async () => {
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_evolution',
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
        setEvolutionStatus(prev => ({
          ...prev,
          currentTask: data.current_task || 'idle',
          lastUpdate: data.updatedAt || Date.now()
        }));
      }
    } catch (error) {
      setSyncError(error);
    }
  };

  // 初始化监听
  useEffect(() => {
    const init = async () => {
      await loadLatestLogs();
      await monitorEvolutionStatus();

      // 设置定时更新状态
      const statusInterval = setInterval(monitorEvolutionStatus, 5000);

      // 设置实时监听
      const unsubscribe = listenToEvolutionChanges();
      return () => {
        clearInterval(statusInterval);
        if (unsubscribe) unsubscribe();
      };
    };
    init();
  }, []);

  // 状态颜色映射
  const getStatusColor = status => {
    switch (status) {
      case 'connected':
        return 'text-green-400';
      case 'reconnecting':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  // 状态图标映射
  const getStatusIcon = status => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4" />;
      case 'reconnecting':
        return <RotateCcw className="w-4 h-4 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };
  return <div className="space-y-4">
      {/* 太极状态卡片 */}
      <Card className="bg-black/30 border-cyan-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TaijiAnimation isAnimating={isUpgrading} />
              <div>
                <div className="text-lg font-bold text-cyan-400">{currentPhase}</div>
                <div className="text-sm text-gray-400">{getEvolutionStatusText()}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 ${getStatusColor(evolutionStatus.syncStatus)}`}>
                {getStatusIcon(evolutionStatus.syncStatus)}
                <span className="text-xs">{evolutionStatus.syncStatus}</span>
              </div>
              
              {evolutionStatus.syncStatus === 'error' && <Button variant="ghost" size="sm" onClick={retrySync} className="text-xs">
                  <RotateCcw className="w-3 h-3 mr-1" />
                  重试
                </Button>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 进化日志快捷入口 */}
      <Card className="bg-black/30 border-purple-500/30">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-sm">进化日志</span>
              <Badge variant="outline" className="text-xs">
                {logs.length}
              </Badge>
            </div>
            
            <Button variant="ghost" size="sm" onClick={() => setShowLogs(!showLogs)} className="text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              {showLogs ? '隐藏' : '查看'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 日志展示面板 */}
      {showLogs && <Card className="bg-black/30 border-gray-600">
          <CardContent className="p-3">
            <div ref={logsRef} className="max-h-48 overflow-y-auto space-y-2">
              {logs.length === 0 ? <div className="text-center text-gray-400 text-sm py-4">
                  暂无日志记录
                </div> : logs.map((log, index) => <div key={log._id || index} className="text-xs p-2 bg-black/20 rounded flex justify-between items-start">
                    <div>
                      <div className="text-gray-300">{log.trigger_event}</div>
                      <div className="text-gray-500">{log.virtual_response}</div>
                    </div>
                    <div className="text-gray-400 text-right">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>)}
            </div>
            
            <Button variant="ghost" size="sm" onClick={scrollToLatestLog} className="w-full mt-2 text-xs">
              查看最新日志
            </Button>
          </CardContent>
        </Card>}

      {/* 同步异常提示 */}
      {syncError && <Card className="bg-red-500/10 border-red-500/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">同步异常</span>
              </div>
              <Button variant="outline" size="sm" onClick={retrySync} className="text-xs">
                <RotateCcw className="w-3 h-3 mr-1" />
                重试
              </Button>
            </div>
            <div className="text-xs text-red-300 mt-1">
              {syncError.message || '无法连接到云端'}
            </div>
          </CardContent>
        </Card>}
    </div>;
}