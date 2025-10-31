// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Progress, Badge, Switch, Alert, AlertDescription, AlertTitle, useToast, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
// @ts-ignore;
import { Wifi, WifiOff, Database, Sync, Cloud, CloudOff, Download, Upload, RefreshCw, Settings, Clock, CheckCircle, AlertCircle, XCircle, Activity, HardDrive, Trash2, Smartphone, Monitor, Globe, Shield, Lock, Unlock, Eye, EyeOff } from 'lucide-react';

export default function OfflineModeSystem(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState('status');
  const [loading, setLoading] = useState(false);
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [showSyncDetailsDialog, setShowSyncDetailsDialog] = useState(false);

  // 离线状态管理
  const [offlineStatus, setOfflineStatus] = useState({
    isOnline: navigator.onLine,
    lastSyncTime: null,
    pendingSyncCount: 0,
    syncInProgress: false,
    offlineMode: false
  });

  // 缓存状态
  const [cacheStatus, setCacheStatus] = useState({
    totalSize: 0,
    usedSize: 0,
    availableSize: 0,
    cachedData: {
      trainingTasks: 0,
      userProgress: 0,
      achievements: 0,
      logs: 0
    }
  });

  // 同步历史
  const [syncHistory, setSyncHistory] = useState([]);
  const [syncDetails, setSyncDetails] = useState(null);

  // 离线设置
  const [offlineSettings, setOfflineSettings] = useState({
    autoSync: true,
    syncInterval: 30,
    // minutes
    cacheExpiry: 7,
    // days
    offlineModeEnabled: false,
    compressCache: true,
    encryptCache: false,
    maxCacheSize: 100 // MB
  });

  // 网络状态监听
  useEffect(() => {
    const handleOnline = () => {
      setOfflineStatus(prev => ({
        ...prev,
        isOnline: true
      }));
      toast({
        title: "网络已连接",
        description: "正在同步离线数据...",
        duration: 2000
      });
      if (offlineSettings.autoSync) {
        syncOfflineData();
      }
    };
    const handleOffline = () => {
      setOfflineStatus(prev => ({
        ...prev,
        isOnline: false
      }));
      toast({
        title: "网络已断开",
        description: "已切换到离线模式",
        variant: "default",
        duration: 3000
      });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初始化离线状态
    initializeOfflineMode();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 初始化离线模式
  const initializeOfflineMode = async () => {
    try {
      // 检查 IndexedDB 支持
      if (!window.indexedDB) {
        toast({
          title: "浏览器不支持",
          description: "当前浏览器不支持离线存储功能",
          variant: "destructive"
        });
        return;
      }

      // 加载离线设置
      await loadOfflineSettings();

      // 加载缓存状态
      await updateCacheStatus();

      // 加载同步历史
      await loadSyncHistory();

      // 检查待同步数据
      await checkPendingSync();

      // 设置自动同步
      if (offlineSettings.autoSync && offlineStatus.isOnline) {
        setupAutoSync();
      }
    } catch (error) {
      console.error('初始化离线模式失败:', error);
      toast({
        title: "初始化失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 加载离线设置
  const loadOfflineSettings = async () => {
    try {
      const cachedSettings = localStorage.getItem('taiji_offline_settings');
      if (cachedSettings) {
        const settings = JSON.parse(cachedSettings);
        setOfflineSettings(prev => ({
          ...prev,
          ...settings
        }));
      }
    } catch (error) {
      console.error('加载离线设置失败:', error);
    }
  };

  // 保存离线设置
  const saveOfflineSettings = async newSettings => {
    try {
      setOfflineSettings(newSettings);
      localStorage.setItem('taiji_offline_settings', JSON.stringify(newSettings));

      // 重新设置自动同步
      if (newSettings.autoSync && offlineStatus.isOnline) {
        setupAutoSync();
      }
      toast({
        title: "设置已保存",
        duration: 2000
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 更新缓存状态
  const updateCacheStatus = async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const totalSizeMB = Math.round(estimate.quota / (1024 * 1024));
        const usedSizeMB = Math.round(estimate.usage / (1024 * 1024));
        setCacheStatus(prev => ({
          ...prev,
          totalSize: totalSizeMB,
          usedSize: usedSizeMB,
          availableSize: totalSizeMB - usedSizeMB
        }));
      }

      // 获取各类数据的缓存数量
      const cachedData = await getCachedDataCount();
      setCacheStatus(prev => ({
        ...prev,
        cachedData
      }));
    } catch (error) {
      console.error('更新缓存状态失败:', error);
    }
  };

  // 获取缓存数据数量
  const getCachedDataCount = async () => {
    try {
      // 这里应该从 IndexedDB 获取实际数据
      // 为了演示，返回模拟数据
      return {
        trainingTasks: 45,
        userProgress: 23,
        achievements: 12,
        logs: 156
      };
    } catch (error) {
      return {
        trainingTasks: 0,
        userProgress: 0,
        achievements: 0,
        logs: 0
      };
    }
  };

  // 加载同步历史
  const loadSyncHistory = async () => {
    try {
      const cachedHistory = localStorage.getItem('taiji_sync_history');
      if (cachedHistory) {
        const history = JSON.parse(cachedHistory);
        setSyncHistory(history.slice(0, 10)); // 只显示最近10条
      }
    } catch (error) {
      console.error('加载同步历史失败:', error);
    }
  };

  // 检查待同步数据
  const checkPendingSync = async () => {
    try {
      // 这里应该检查 IndexedDB 中的待同步数据
      const pendingCount = Math.floor(Math.random() * 5); // 模拟数据
      setOfflineStatus(prev => ({
        ...prev,
        pendingSyncCount: pendingCount
      }));
    } catch (error) {
      console.error('检查待同步数据失败:', error);
    }
  };

  // 设置自动同步
  const setupAutoSync = () => {
    // 清除之前的定时器
    if (window.syncInterval) {
      clearInterval(window.syncInterval);
    }

    // 设置新的定时器
    window.syncInterval = setInterval(() => {
      if (offlineStatus.isOnline && offlineStatus.pendingSyncCount > 0) {
        syncOfflineData();
      }
    }, offlineSettings.syncInterval * 60 * 1000);
  };

  // 缓存数据到本地
  const cacheDataToLocal = async (dataType, data) => {
    try {
      // 这里应该使用 IndexedDB 存储数据
      // 为了演示，使用 localStorage
      const cacheKey = `taiji_cache_${dataType}`;
      const cacheData = {
        data: data,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      await updateCacheStatus();
      toast({
        title: "数据已缓存",
        description: `${dataType} 数据已保存到本地`,
        duration: 2000
      });
    } catch (error) {
      toast({
        title: "缓存失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 同步离线数据
  const syncOfflineData = async () => {
    if (!offlineStatus.isOnline) {
      toast({
        title: "网络不可用",
        description: "请检查网络连接后重试",
        variant: "destructive"
      });
      return;
    }
    try {
      setLoading(true);
      setOfflineStatus(prev => ({
        ...prev,
        syncInProgress: true
      }));
      const syncStartTime = Date.now();
      let syncedItems = 0;
      let failedItems = 0;

      // 这里应该从 IndexedDB 获取待同步数据并上传到云端
      // 为了演示，模拟同步过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      syncedItems = Math.floor(Math.random() * 10) + 1;
      failedItems = Math.floor(Math.random() * 2);

      // 记录同步历史
      const syncRecord = {
        id: Date.now(),
        startTime: syncStartTime,
        endTime: Date.now(),
        syncedItems,
        failedItems,
        status: failedItems === 0 ? 'success' : 'partial',
        type: 'auto'
      };
      const newHistory = [syncRecord, ...syncHistory].slice(0, 20);
      setSyncHistory(newHistory);
      localStorage.setItem('taiji_sync_history', JSON.stringify(newHistory));

      // 更新状态
      setOfflineStatus(prev => ({
        ...prev,
        syncInProgress: false,
        lastSyncTime: Date.now(),
        pendingSyncCount: Math.max(0, prev.pendingSyncCount - syncedItems)
      }));
      toast({
        title: "同步完成",
        description: `成功同步 ${syncedItems} 项数据${failedItems > 0 ? `，${failedItems} 项失败` : ''}`,
        variant: failedItems === 0 ? "default" : "destructive",
        duration: 3000
      });
    } catch (error) {
      setOfflineStatus(prev => ({
        ...prev,
        syncInProgress: false
      }));
      toast({
        title: "同步失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 手动同步
  const manualSync = async () => {
    await syncOfflineData();
  };

  // 清理缓存
  const clearCache = async () => {
    try {
      setLoading(true);

      // 清除所有缓存数据
      const keys = Object.keys(localStorage).filter(key => key.startsWith('taiji_cache_'));
      keys.forEach(key => localStorage.removeItem(key));
      await updateCacheStatus();
      setShowClearCacheDialog(false);
      toast({
        title: "缓存已清理",
        description: `已清理 ${keys.length} 个缓存项`,
        duration: 2000
      });
    } catch (error) {
      toast({
        title: "清理失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 切换离线模式
  const toggleOfflineMode = async enabled => {
    try {
      const newSettings = {
        ...offlineSettings,
        offlineModeEnabled: enabled
      };
      await saveOfflineSettings(newSettings);
      setOfflineStatus(prev => ({
        ...prev,
        offlineMode: enabled
      }));
      if (enabled) {
        toast({
          title: "离线模式已启用",
          description: "将在网络不可用时自动使用离线数据",
          duration: 2000
        });
      } else {
        toast({
          title: "离线模式已禁用",
          description: "将始终尝试连接网络获取最新数据",
          duration: 2000
        });
      }
    } catch (error) {
      toast({
        title: "切换失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 获取同步状态图标
  const getSyncStatusIcon = () => {
    if (offlineStatus.syncInProgress) {
      return <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />;
    }
    if (offlineStatus.pendingSyncCount > 0) {
      return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
    return <CheckCircle className="w-5 h-5 text-green-400" />;
  };

  // 获取网络状态文本
  const getNetworkStatusText = () => {
    if (!offlineStatus.isOnline) {
      return "离线模式";
    }
    if (offlineStatus.syncInProgress) {
      return "正在同步";
    }
    if (offlineStatus.pendingSyncCount > 0) {
      return `待同步 ${offlineStatus.pendingSyncCount} 项`;
    }
    return "已同步";
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-[#F5F5DC] p-4">
      <div className="max-w-6xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            离线模式
          </h1>
          <p className="text-[#F5F5DC]/70">管理离线数据缓存和同步设置</p>
        </div>

        {/* 状态卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-black/30 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">
                    {offlineStatus.isOnline ? '在线' : '离线'}
                  </div>
                  <div className="text-sm text-[#F5F5DC]/70">网络状态</div>
                </div>
                {offlineStatus.isOnline ? <Wifi className="w-8 h-8 text-green-400" /> : <WifiOff className="w-8 h-8 text-red-400" />}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{cacheStatus.usedSize}MB</div>
                  <div className="text-sm text-[#F5F5DC]/70">缓存大小</div>
                </div>
                <HardDrive className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-yellow-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{offlineStatus.pendingSyncCount}</div>
                  <div className="text-sm text-[#F5F5DC]/70">待同步</div>
                </div>
                <Sync className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-green-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{getNetworkStatusText()}</div>
                  <div className="text-sm text-[#F5F5DC]/70">同步状态</div>
                </div>
                {getSyncStatusIcon()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 功能标签页 */}
        <div className="bg-black/30 border border-gray-600 rounded-lg">
          <div className="flex border-b border-gray-600">
            <button onClick={() => setActiveTab('status')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'status' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Activity className="w-4 h-4" />
              状态监控
            </button>
            <button onClick={() => setActiveTab('cache')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'cache' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Database className="w-4 h-4" />
              缓存管理
            </button>
            <button onClick={() => setActiveTab('sync')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'sync' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Cloud className="w-4 h-4" />
              同步设置
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'settings' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Settings className="w-4 h-4" />
              离线设置
            </button>
          </div>

          <div className="p-6">
            {/* 状态监控标签页 */}
            {activeTab === 'status' && <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">连接状态</h3>
                  <Card className="bg-black/20 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${offlineStatus.isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                          <div>
                            <div className="font-medium text-[#F5F5DC]">
                              {offlineStatus.isOnline ? '网络连接正常' : '网络连接断开'}
                            </div>
                            <div className="text-sm text-[#F5F5DC]/70">
                              {offlineStatus.isOnline ? '可以正常使用在线功能' : '已切换到离线模式'}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" onClick={manualSync} disabled={!offlineStatus.isOnline || offlineStatus.syncInProgress} className="flex items-center gap-2">
                          <RefreshCw className={`w-4 h-4 ${offlineStatus.syncInProgress ? 'animate-spin' : ''}`} />
                          {offlineStatus.syncInProgress ? '同步中...' : '立即同步'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">同步历史</h3>
                  <div className="space-y-3">
                    {syncHistory.length > 0 ? syncHistory.map((record, index) => <Card key={record.id || index} className="bg-black/20 border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${record.status === 'success' ? 'bg-green-400' : record.status === 'partial' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                              <div>
                                <div className="font-medium text-[#F5F5DC]">
                                  {record.status === 'success' ? '同步成功' : record.status === 'partial' ? '部分成功' : '同步失败'}
                                </div>
                                <div className="text-sm text-[#F5F5DC]/70">
                                  {new Date(record.startTime).toLocaleString()} | 
                                  耗时 {Math.round((record.endTime - record.startTime) / 1000)}秒
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-[#F5F5DC]/80">
                                成功 {record.syncedItems} 项
                              </div>
                              {record.failedItems > 0 && <div className="text-sm text-red-400">
                                失败 {record.failedItems} 项
                              </div>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>) : <div className="text-center py-8">
                        <Cloud className="w-12 h-12 mx-auto mb-4 text-[#F5F5DC]/50" />
                        <div className="text-[#F5F5DC]/70">暂无同步记录</div>
                      </div>}
                  </div>
                </div>
              </div>}

            {/* 缓存管理标签页 */}
            {activeTab === 'cache' && <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">缓存概览</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-black/20 border-gray-600">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-[#F5F5DC]/70">已使用</span>
                            <span className="text-[#F5F5DC]">{cacheStatus.usedSize}MB</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#F5F5DC]/70">总容量</span>
                            <span className="text-[#F5F5DC]">{cacheStatus.totalSize}MB</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-gradient-to-r from-purple-400 to-cyan-400 h-2 rounded-full" style={{
                          width: `${cacheStatus.usedSize / cacheStatus.totalSize * 100}%`
                        }} />
                          </div>
                          <div className="text-xs text-[#F5F5DC]/50 text-center">
                            使用率 {Math.round(cacheStatus.usedSize / cacheStatus.totalSize * 100)}%
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-black/20 border-gray-600">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-[#F5F5DC]/70">训练任务</span>
                            <span className="text-[#F5F5DC]">{cacheStatus.cachedData.trainingTasks} 项</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#F5F5DC]/70">用户进度</span>
                            <span className="text-[#F5F5DC]">{cacheStatus.cachedData.userProgress} 项</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#F5F5DC]/70">成就数据</span>
                            <span className="text-[#F5F5DC]">{cacheStatus.cachedData.achievements} 项</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#F5F5DC]/70">系统日志</span>
                            <span className="text-[#F5F5DC]">{cacheStatus.cachedData.logs} 项</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">缓存操作</h3>
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => updateCacheStatus()} className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      刷新状态
                    </Button>
                    <Button variant="outline" onClick={() => setShowClearCacheDialog(true)} className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      清理缓存
                    </Button>
                  </div>
                </div>
              </div>}

            {/* 同步设置标签页 */}
            {activeTab === 'sync' && <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">同步配置</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">自动同步</div>
                        <div className="text-sm text-[#F5F5DC]/60">网络恢复时自动同步离线数据</div>
                      </div>
                      <Switch checked={offlineSettings.autoSync} onCheckedChange={checked => saveOfflineSettings({
                    ...offlineSettings,
                    autoSync: checked
                  })} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">同步间隔</div>
                        <div className="text-sm text-[#F5F5DC]/60">自动同步的时间间隔</div>
                      </div>
                      <Select value={offlineSettings.syncInterval.toString()} onValueChange={value => saveOfflineSettings({
                    ...offlineSettings,
                    syncInterval: parseInt(value)
                  })}>
                        <SelectTrigger className="bg-black/20 border-gray-600 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5分钟</SelectItem>
                          <SelectItem value="15">15分钟</SelectItem>
                          <SelectItem value="30">30分钟</SelectItem>
                          <SelectItem value="60">1小时</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">缓存过期</div>
                        <div className="text-sm text-[#F5F5DC]/60">本地缓存数据的过期时间</div>
                      </div>
                      <Select value={offlineSettings.cacheExpiry.toString()} onValueChange={value => saveOfflineSettings({
                    ...offlineSettings,
                    cacheExpiry: parseInt(value)
                  })}>
                        <SelectTrigger className="bg-black/20 border-gray-600 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1天</SelectItem>
                          <SelectItem value="3">3天</SelectItem>
                          <SelectItem value="7">7天</SelectItem>
                          <SelectItem value="30">30天</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">同步操作</h3>
                  <div className="flex gap-4">
                    <Button onClick={manualSync} disabled={!offlineStatus.isOnline || offlineStatus.syncInProgress} className="flex items-center gap-2">
                      <Cloud className="w-4 h-4" />
                      {offlineStatus.syncInProgress ? '同步中...' : '立即同步'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowSyncDetailsDialog(true)} className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      查看详情
                    </Button>
                  </div>
                </div>
              </div>}

            {/* 离线设置标签页 */}
            {activeTab === 'settings' && <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">离线模式</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">启用离线模式</div>
                        <div className="text-sm text-[#F5F5DC]/60">在网络不可用时使用本地缓存数据</div>
                      </div>
                      <Switch checked={offlineSettings.offlineModeEnabled} onCheckedChange={toggleOfflineMode} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">压缩缓存</div>
                        <div className="text-sm text-[#F5F5DC]/60">压缩本地缓存数据以节省存储空间</div>
                      </div>
                      <Switch checked={offlineSettings.compressCache} onCheckedChange={checked => saveOfflineSettings({
                    ...offlineSettings,
                    compressCache: checked
                  })} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">加密缓存</div>
                        <div className="text-sm text-[#F5F5DC]/60">加密本地缓存数据以提高安全性</div>
                      </div>
                      <Switch checked={offlineSettings.encryptCache} onCheckedChange={checked => saveOfflineSettings({
                    ...offlineSettings,
                    encryptCache: checked
                  })} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">最大缓存大小</div>
                        <div className="text-sm text-[#F5F5DC]/60">本地缓存的最大存储限制</div>
                      </div>
                      <Select value={offlineSettings.maxCacheSize.toString()} onValueChange={value => saveOfflineSettings({
                    ...offlineSettings,
                    maxCacheSize: parseInt(value)
                  })}>
                        <SelectTrigger className="bg-black/20 border-gray-600 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50MB</SelectItem>
                          <SelectItem value="100">100MB</SelectItem>
                          <SelectItem value="200">200MB</SelectItem>
                          <SelectItem value="500">500MB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">离线功能</h3>
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>离线模式支持</AlertTitle>
                    <AlertDescription>
                      在离线模式下，您可以继续使用以下功能：
                      <ul className="mt-2 list-disc list-inside text-sm">
                        <li>查看已缓存的训练任务</li>
                        <li>记录训练进度（离线保存）</li>
                        <li>查看已解锁的成就</li>
                        <li>浏览系统日志</li>
                      </ul>
                      网络恢复后将自动同步所有离线数据。
                    </AlertDescription>
                  </Alert>
                </div>
              </div>}
          </div>
        </div>

        {/* 清理缓存确认对话框 */}
        <Dialog open={showClearCacheDialog} onOpenChange={setShowClearCacheDialog}>
          <DialogContent className="bg-black/90 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-[#F5F5DC]">清理缓存</DialogTitle>
              <DialogDescription className="text-[#F5F5DC]/70">
                确定要清理所有本地缓存数据吗？这将删除所有离线保存的数据。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClearCacheDialog(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={clearCache} disabled={loading}>
                {loading ? '清理中...' : '确认清理'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 同步详情对话框 */}
        <Dialog open={showSyncDetailsDialog} onOpenChange={setShowSyncDetailsDialog}>
          <DialogContent className="bg-black/90 border-gray-600 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#F5F5DC]">同步详情</DialogTitle>
              <DialogDescription className="text-[#F5F5DC]/70">
                查看详细的同步信息和状态
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-black/50 border border-gray-600 rounded-lg p-4">
                <h4 className="font-medium text-[#F5F5DC] mb-2">当前状态</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#F5F5DC]/60">网络状态:</span>
                    <span className="ml-2 text-[#F5F5DC]">{offlineStatus.isOnline ? '在线' : '离线'}</span>
                  </div>
                  <div>
                    <span className="text-[#F5F5DC]/60">同步状态:</span>
                    <span className="ml-2 text-[#F5F5DC]">{getNetworkStatusText()}</span>
                  </div>
                  <div>
                    <span className="text-[#F5F5DC]/60">待同步项:</span>
                    <span className="ml-2 text-[#F5F5DC]">{offlineStatus.pendingSyncCount} 项</span>
                  </div>
                  <div>
                    <span className="text-[#F5F5DC]/60">最后同步:</span>
                    <span className="ml-2 text-[#F5F5DC]">
                      {offlineStatus.lastSyncTime ? new Date(offlineStatus.lastSyncTime).toLocaleString() : '从未同步'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-black/50 border border-gray-600 rounded-lg p-4">
                <h4 className="font-medium text-[#F5F5DC] mb-2">同步设置</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#F5F5DC]/60">自动同步:</span>
                    <span className="ml-2 text-[#F5F5DC]">{offlineSettings.autoSync ? '启用' : '禁用'}</span>
                  </div>
                  <div>
                    <span className="text-[#F5F5DC]/60">同步间隔:</span>
                    <span className="ml-2 text-[#F5F5DC]">{offlineSettings.syncInterval} 分钟</span>
                  </div>
                  <div>
                    <span className="text-[#F5F5DC]/60">缓存过期:</span>
                    <span className="ml-2 text-[#F5F5DC]">{offlineSettings.cacheExpiry} 天</span>
                  </div>
                  <div>
                    <span className="text-[#F5F5DC]/60">离线模式:</span>
                    <span className="ml-2 text-[#F5F5DC]">{offlineSettings.offlineModeEnabled ? '启用' : '禁用'}</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowSyncDetailsDialog(false)}>
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
}