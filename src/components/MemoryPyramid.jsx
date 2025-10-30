// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Progress, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, useToast } from '@/components/ui';
// @ts-ignore;
import { Brain, MemoryStick, Trash2, Clock, RotateCcw, AlertTriangle, CheckCircle, Zap, Sparkles } from 'lucide-react';

export function MemoryPyramid({
  $w
}) {
  const [memoryData, setMemoryData] = useState({
    stm: 12,
    mtm: 45,
    ltm: 128,
    lastUpdated: Date.now()
  });
  const [particles, setParticles] = useState([]);
  const [autoSync, setAutoSync] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteRange, setDeleteRange] = useState('7d');
  const [syncStatus, setSyncStatus] = useState('connected');
  const [lastSync, setLastSync] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const {
    toast
  } = useToast();
  const syncInterval = useRef(null);
  const cleanupInterval = useRef(null);
  const particleInterval = useRef(null);

  // 记忆类型配置
  const memoryTypes = {
    stm: {
      name: '短期记忆',
      description: '实时任务数据',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      max: 20,
      decay: 24 // 小时
    },
    mtm: {
      name: '中期记忆',
      description: '7天内学习记录',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      max: 50,
      decay: 7 // 天
    },
    ltm: {
      name: '长期记忆',
      description: '永久存储的核心记忆',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      max: 200,
      decay: null // 永久
    }
  };

  // 生成记忆碎片粒子
  const generateParticles = () => {
    const newParticles = [];
    const count = Math.min(memoryData.stm, 15);
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 2 + 1,
        color: ['#3B82F6', '#8B5CF6', '#10B981'][Math.floor(Math.random() * 3)]
      });
    }
    setParticles(newParticles);
  };

  // 自动同步记忆到LTM
  const syncToLTM = async (taskData = null) => {
    try {
      setSyncStatus('syncing');
      const response = await $w.cloud.callFunction({
        name: 'taiji_memory_export',
        data: {
          format: 'json',
          include: ['stm', 'mtm', 'ltm'],
          encryption: true,
          autoSync: true,
          taskData: taskData || {
            type: 'auto_sync',
            timestamp: Date.now(),
            source: 'memory_pyramid'
          }
        }
      });
      if (response.success) {
        // 更新LTM计数
        const newLTM = memoryData.ltm + (memoryData.stm + memoryData.mtm);
        setMemoryData(prev => ({
          ...prev,
          ltm: Math.min(newLTM, 200),
          lastUpdated: Date.now()
        }));

        // 清空STM和MTM
        setMemoryData(prev => ({
          ...prev,
          stm: 0,
          mtm: 0
        }));

        // 更新云端数据
        await updateMemoryData({
          ltm: newLTM,
          stm: 0,
          mtm: 0,
          last_sync: Date.now()
        });
        setLastSync(Date.now());
        setSyncStatus('connected');
        toast({
          title: "记忆同步完成",
          description: `已同步 ${memoryData.stm + memoryData.mtm} 条记忆到LTM`,
          duration: 2000
        });
      }
    } catch (error) {
      console.error('记忆同步失败:', error);
      setSyncStatus('error');
      toast({
        title: "同步失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 自动清理过期MTM
  const autoCleanupMTM = async () => {
    try {
      setArchiving(true);
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_memory',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              memory_type: {
                $eq: 'mtm'
              },
              last_updated: {
                $lt: Date.now() - 7 * 24 * 60 * 60 * 1000 // 7天前
              }
            }
          }
        }
      });
      const expiredMemories = result.records || [];
      if (expiredMemories.length > 0) {
        // 归档到LTM
        const archivedCount = expiredMemories.length;
        const newLTM = memoryData.ltm + archivedCount;
        setMemoryData(prev => ({
          ...prev,
          ltm: Math.min(newLTM, 200),
          mtm: Math.max(prev.mtm - archivedCount, 0)
        }));

        // 删除过期MTM
        for (const memory of expiredMemories) {
          await $w.cloud.callDataSource({
            dataSourceName: 'taiji_memory',
            methodName: 'wedaDeleteV2',
            params: {
              filter: {
                where: {
                  _id: {
                    $eq: memory._id
                  }
                }
              }
            }
          });
        }
        toast({
          title: "自动归档完成",
          description: `已归档 ${archivedCount} 条过期记忆到LTM`,
          duration: 2000
        });
      }
    } catch (error) {
      console.error('自动清理失败:', error);
    } finally {
      setArchiving(false);
    }
  };

  // 一键粉碎记忆
  const deleteMemoryRange = async () => {
    try {
      const ranges = {
        '1d': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        'all': null
      };
      const cutoffTime = ranges[deleteRange];
      const filter = cutoffTime ? {
        created_at: {
          $gte: Date.now() - cutoffTime
        }
      } : {};
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_memory',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: filter
          }
        }
      });
      const memoriesToDelete = result.records || [];
      if (memoriesToDelete.length > 0) {
        // 批量删除
        await $w.cloud.callDataSource({
          dataSourceName: 'taiji_memory',
          methodName: 'wedaBatchDeleteV2',
          params: {
            filter: {
              where: {
                _id: {
                  $in: memoriesToDelete.map(m => m._id)
                }
              }
            }
          }
        });

        // 重置本地计数
        if (deleteRange === 'all') {
          setMemoryData({
            stm: 0,
            mtm: 0,
            ltm: 0,
            lastUpdated: Date.now()
          });
        }
        toast({
          title: "记忆粉碎完成",
          description: `已删除 ${memoriesToDelete.length} 条记忆`,
          duration: 3000
        });
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error('删除记忆失败:', error);
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 更新记忆数据
  const updateMemoryData = async updates => {
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_memory_stats',
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
        await $w.cloud.callDataSource({
          dataSourceName: 'taiji_memory_stats',
          methodName: 'wedaUpdateV2',
          params: {
            data: updates,
            filter: {
              where: {
                _id: {
                  $eq: result.records[0]._id
                }
              }
            }
          }
        });
      } else {
        await $w.cloud.callDataSource({
          dataSourceName: 'taiji_memory_stats',
          methodName: 'wedaCreateV2',
          params: {
            data: {
              ...updates,
              created_at: Date.now()
            }
          }
        });
      }
    } catch (error) {
      console.error('更新记忆数据失败:', error);
    }
  };

  // 加载记忆数据
  const loadMemoryData = async () => {
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_memory_stats',
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
        setMemoryData({
          stm: data.stm || 0,
          mtm: data.mtm || 0,
          ltm: data.ltm || 0,
          lastUpdated: data.last_updated || Date.now()
        });
      }
    } catch (error) {
      console.error('加载记忆数据失败:', error);
      setSyncStatus('error');
    }
  };

  // 启动自动化系统
  const startAutoSystem = () => {
    setAutoSync(true);

    // 每30秒检查并同步
    syncInterval.current = setInterval(() => {
      if (memoryData.stm > 0 || memoryData.mtm > 10) {
        syncToLTM();
      }
    }, 30000);

    // 每天检查过期MTM
    cleanupInterval.current = setInterval(() => {
      autoCleanupMTM();
    }, 24 * 60 * 60 * 1000);

    // 实时更新粒子效果
    particleInterval.current = setInterval(generateParticles, 2000);
  };

  // 停止自动化系统
  const stopAutoSystem = () => {
    setAutoSync(false);
    if (syncInterval.current) clearInterval(syncInterval.current);
    if (cleanupInterval.current) clearInterval(cleanupInterval.current);
    if (particleInterval.current) clearInterval(particleInterval.current);
  };

  // 手动添加记忆
  const addMemory = async (type, content) => {
    try {
      const newCount = memoryData[type] + 1;
      setMemoryData(prev => ({
        ...prev,
        [type]: Math.min(newCount, memoryTypes[type].max),
        lastUpdated: Date.now()
      }));
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_memory',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            memory_type: type,
            content: content,
            created_at: Date.now(),
            expires_at: type === 'stm' ? Date.now() + memoryTypes.stm.decay * 60 * 60 * 1000 : type === 'mtm' ? Date.now() + memoryTypes.mtm.decay * 24 * 60 * 60 * 1000 : null
          }
        }
      });

      // 触发同步
      if (type === 'stm' && memoryData.stm >= 15) {
        syncToLTM({
          type: 'manual_add',
          content
        });
      }
    } catch (error) {
      console.error('添加记忆失败:', error);
    }
  };

  // 初始化
  useEffect(() => {
    loadMemoryData();
    generateParticles();
    startAutoSystem();
    return () => {
      stopAutoSystem();
    };
  }, []);
  return <div className="space-y-4">
      {/* 记忆金字塔主卡片 */}
      <Card className="bg-black/30 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MemoryStick className="text-cyan-400" />
              <span>记忆金字塔</span>
              <Badge variant={syncStatus === 'connected' ? "default" : "destructive"} className="text-xs">
                {syncStatus}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setAutoSync(!autoSync)}>
                {autoSync ? <Zap className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(memoryTypes).map(([key, config]) => {
            const value = memoryData[key];
            const percentage = value / config.max * 100;
            return <div key={key} className={`p-4 rounded-lg border ${config.bgColor} border-gray-600`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${config.color}`}>{config.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {value}/{config.max}
                  </Badge>
                </div>
                
                <Progress value={percentage} className="h-2 mb-2" />
                
                <div className="text-xs text-gray-400 mb-2">{config.description}</div>
                
                {config.decay && <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {config.decay > 24 ? `${config.decay}天后过期` : `${config.decay}小时后过期`}
                </div>}
              </div>;
          })}
          </div>

          {/* 记忆碎片可视化 */}
          <div className="mt-6">
            <div className="text-sm text-gray-400 mb-2">记忆碎片 (STM实时更新)</div>
            <div className="relative h-32 bg-black/20 rounded-lg overflow-hidden">
              {particles.map(particle => <div key={particle.id} className="absolute rounded-full animate-pulse" style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              animation: `float ${particle.speed}s ease-in-out infinite alternate`
            }} />)}
              
              {particles.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                  暂无记忆碎片
                </div>}
            </div>
          </div>

          {/* 同步状态 */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              {archiving ? <RotateCcw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              <span>{archiving ? '正在归档...' : '自动管理已启用'}</span>
            </div>
            <span>最后同步: {lastSync ? new Date(lastSync).toLocaleTimeString() : '从未'}</span>
          </div>
        </CardContent>
      </Card>

      {/* 一键粉碎对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-black/90 border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-red-400">记忆粉碎确认</DialogTitle>
            <DialogDescription>
              此操作将永久删除选定时间范围内的记忆数据，无法恢复。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[{
              value: '1d',
              label: '最近1天'
            }, {
              value: '7d',
              label: '最近7天'
            }, {
              value: '30d',
              label: '最近30天'
            }, {
              value: 'all',
              label: '全部记忆'
            }].map(option => <Button key={option.value} variant={deleteRange === option.value ? "default" : "outline"} size="sm" onClick={() => setDeleteRange(option.value)}>
                  {option.label}
                </Button>)}
            </div>
            
            <div className="text-sm text-gray-400">
              将删除: <span className="text-red-400 font-medium">{deleteRange === 'all' ? '所有记忆数据' : `最近${deleteRange.replace('d', '')}天的记忆`}</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={deleteMemoryRange}>
              确认粉碎
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-20px) scale(0.8);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>;
}