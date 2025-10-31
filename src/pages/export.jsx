// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Progress, Badge, Switch, Alert, AlertDescription, AlertTitle, useToast, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox } from '@/components/ui';
// @ts-ignore;
import { Download, Upload, Database, FileText, Calendar, Filter, CheckCircle, AlertCircle, Clock, BarChart3, TrendingUp, Users, Trophy, Target, Brain, Eye, Save, RefreshCw, Settings, ChevronRight, ChevronDown, Plus, Minus, Search, X } from 'lucide-react';

export default function DataExportBackup(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState('export');
  const [loading, setLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // 导出配置
  const [exportConfig, setExportConfig] = useState({
    dataType: 'all',
    // all, training, progress, achievements, logs
    format: 'json',
    // json, csv, pdf, excel
    dateRange: {
      enabled: false,
      startDate: '',
      endDate: ''
    },
    includeFields: {
      training: ['task_id', 'title', 'description', 'difficulty_level', 'reward_points', 'category'],
      progress: ['user_id', 'task_id', 'status', 'score', 'started_at', 'completed_at', 'attempts', 'best_score'],
      achievements: ['title', 'description', 'category', 'points', 'rarity', 'unlocked_at'],
      logs: ['log_type', 'trigger_event', 'virtual_response', 'timestamp']
    },
    options: {
      includeStats: true,
      includeCharts: false,
      compress: false,
      encrypt: false
    }
  });

  // 数据统计
  const [dataStats, setDataStats] = useState({
    training: {
      count: 0,
      lastUpdate: null
    },
    progress: {
      count: 0,
      lastUpdate: null
    },
    achievements: {
      count: 0,
      lastUpdate: null
    },
    logs: {
      count: 0,
      lastUpdate: null
    }
  });

  // 备份记录
  const [backupRecords, setBackupRecords] = useState([]);

  // 加载数据统计
  const loadDataStats = async () => {
    try {
      setLoading(true);
      const [trainingResult, progressResult, achievementsResult, logsResult] = await Promise.all([$w.cloud.callDataSource({
        dataSourceName: 'taiji_training_task',
        methodName: 'wedaGetRecordsV2',
        params: {
          getCount: true,
          pageSize: 1
        }
      }), $w.cloud.callDataSource({
        dataSourceName: 'taiji_user_progress',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              user_id: {
                $eq: $w.auth.currentUser?.userId || 'anonymous'
              }
            }
          },
          getCount: true,
          pageSize: 1
        }
      }), $w.cloud.callDataSource({
        dataSourceName: 'taiji_achievement',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              user_id: {
                $eq: $w.auth.currentUser?.userId || 'anonymous'
              }
            }
          },
          getCount: true,
          pageSize: 1
        }
      }), $w.cloud.callDataSource({
        dataSourceName: 'taiji_logs',
        methodName: 'wedaGetRecordsV2',
        params: {
          getCount: true,
          pageSize: 1
        }
      })]);
      setDataStats({
        training: {
          count: trainingResult.total || 0,
          lastUpdate: new Date().toISOString()
        },
        progress: {
          count: progressResult.total || 0,
          lastUpdate: new Date().toISOString()
        },
        achievements: {
          count: achievementsResult.total || 0,
          lastUpdate: new Date().toISOString()
        },
        logs: {
          count: logsResult.total || 0,
          lastUpdate: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('加载数据统计失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载数据统计信息",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 加载备份记录
  const loadBackupRecords = async () => {
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_backup_records',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              user_id: {
                $eq: $w.auth.currentUser?.userId || 'anonymous'
              }
            }
          },
          orderBy: [{
            created_at: 'desc'
          }],
          pageSize: 10,
          pageNumber: 1
        }
      });
      setBackupRecords(result.records || []);
    } catch (error) {
      console.error('加载备份记录失败:', error);
    }
  };

  // 预览数据
  const previewExportData = async () => {
    try {
      setLoading(true);
      const data = await collectExportData();
      setPreviewData(data);
      setShowPreviewDialog(true);
    } catch (error) {
      toast({
        title: "预览失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 收集导出数据
  const collectExportData = async () => {
    const userId = $w.auth.currentUser?.userId || 'anonymous';
    const data = {
      exportInfo: {
        userId,
        exportTime: new Date().toISOString(),
        version: '1.0',
        config: exportConfig
      },
      data: {}
    };
    try {
      // 收集训练任务数据
      if (exportConfig.dataType === 'all' || exportConfig.dataType === 'training') {
        const trainingResult = await $w.cloud.callDataSource({
          dataSourceName: 'taiji_training_task',
          methodName: 'wedaGetRecordsV2',
          params: {
            select: exportConfig.includeFields.training.reduce((acc, field) => {
              acc[field] = true;
              return acc;
            }, {}),
            pageSize: 100
          }
        });
        data.data.training = trainingResult.records || [];
      }

      // 收集用户进度数据
      if (exportConfig.dataType === 'all' || exportConfig.dataType === 'progress') {
        const progressFilter = {
          where: {
            user_id: {
              $eq: userId
            }
          }
        };
        if (exportConfig.dateRange.enabled) {
          progressFilter.where.$and = [{
            started_at: {
              $gte: new Date(exportConfig.dateRange.startDate).getTime()
            }
          }, {
            started_at: {
              $lte: new Date(exportConfig.dateRange.endDate).getTime()
            }
          }];
        }
        const progressResult = await $w.cloud.callDataSource({
          dataSourceName: 'taiji_user_progress',
          methodName: 'wedaGetRecordsV2',
          params: {
            filter: progressFilter,
            select: exportConfig.includeFields.progress.reduce((acc, field) => {
              acc[field] = true;
              return acc;
            }, {}),
            pageSize: 100
          }
        });
        data.data.progress = progressResult.records || [];
      }

      // 收集成就数据
      if (exportConfig.dataType === 'all' || exportConfig.dataType === 'achievements') {
        const achievementFilter = {
          where: {
            user_id: {
              $eq: userId
            }
          }
        };
        if (exportConfig.dateRange.enabled) {
          achievementFilter.where.$and = [{
            unlocked_at: {
              $gte: new Date(exportConfig.dateRange.startDate).getTime()
            }
          }, {
            unlocked_at: {
              $lte: new Date(exportConfig.dateRange.endDate).getTime()
            }
          }];
        }
        const achievementsResult = await $w.cloud.callDataSource({
          dataSourceName: 'taiji_achievement',
          methodName: 'wedaGetRecordsV2',
          params: {
            filter: achievementFilter,
            select: exportConfig.includeFields.achievements.reduce((acc, field) => {
              acc[field] = true;
              return acc;
            }, {}),
            pageSize: 100
          }
        });
        data.data.achievements = achievementsResult.records || [];
      }

      // 收集日志数据
      if (exportConfig.dataType === 'all' || exportConfig.dataType === 'logs') {
        const logsFilter = {};
        if (exportConfig.dateRange.enabled) {
          logsFilter.where = {
            $and: [{
              timestamp: {
                $gte: new Date(exportConfig.dateRange.startDate).getTime()
              }
            }, {
              timestamp: {
                $lte: new Date(exportConfig.dateRange.endDate).getTime()
              }
            }]
          };
        }
        const logsResult = await $w.cloud.callDataSource({
          dataSourceName: 'taiji_logs',
          methodName: 'wedaGetRecordsV2',
          params: {
            filter: logsFilter,
            select: exportConfig.includeFields.logs.reduce((acc, field) => {
              acc[field] = true;
              return acc;
            }, {}),
            pageSize: 100
          }
        });
        data.data.logs = logsResult.records || [];
      }

      // 添加统计信息
      if (exportConfig.options.includeStats) {
        data.stats = {
          trainingCount: data.data.training?.length || 0,
          progressCount: data.data.progress?.length || 0,
          achievementsCount: data.data.achievements?.length || 0,
          logsCount: data.data.logs?.length || 0
        };
      }
      return data;
    } catch (error) {
      throw new Error(`数据收集失败: ${error.message}`);
    }
  };

  // 执行导出
  const executeExport = async () => {
    try {
      setLoading(true);
      setExportProgress(0);
      const data = await collectExportData();
      setExportProgress(30);

      // 根据格式处理数据
      let processedData;
      let fileName;
      let mimeType;
      switch (exportConfig.format) {
        case 'json':
          processedData = JSON.stringify(data, null, 2);
          fileName = `taiji_export_${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          processedData = convertToCSV(data);
          fileName = `taiji_export_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        case 'pdf':
          // 这里可以集成PDF生成库
          processedData = JSON.stringify(data, null, 2);
          fileName = `taiji_export_${new Date().toISOString().split('T')[0]}.pdf`;
          mimeType = 'application/pdf';
          break;
        case 'excel':
          // 这里可以集成Excel生成库
          processedData = JSON.stringify(data, null, 2);
          fileName = `taiji_export_${new Date().toISOString().split('T')[0]}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        default:
          processedData = JSON.stringify(data, null, 2);
          fileName = `taiji_export_${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
      }
      setExportProgress(60);

      // 创建备份记录
      await createBackupRecord(fileName, exportConfig.format, data);
      setExportProgress(80);

      // 下载文件
      downloadFile(processedData, fileName, mimeType);
      setExportProgress(100);
      setExportData(data);
      setShowExportDialog(true);
      toast({
        title: "导出成功",
        description: `数据已导出为 ${fileName}`,
        duration: 3000
      });
    } catch (error) {
      toast({
        title: "导出失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setExportProgress(0);
    }
  };

  // 转换为CSV格式
  const convertToCSV = data => {
    const csvRows = [];

    // 添加导出信息
    csvRows.push('# 导出信息');
    csvRows.push(`用户ID,${data.exportInfo.userId}`);
    csvRows.push(`导出时间,${data.exportInfo.exportTime}`);
    csvRows.push(`版本,${data.exportInfo.version}`);
    csvRows.push('');

    // 处理各类数据
    Object.entries(data.data).forEach(([dataType, records]) => {
      if (records && records.length > 0) {
        csvRows.push(`# ${dataType.toUpperCase()} 数据`);
        const headers = Object.keys(records[0]);
        csvRows.push(headers.join(','));
        records.forEach(record => {
          const values = headers.map(header => {
            const value = record[header];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          });
          csvRows.push(values.join(','));
        });
        csvRows.push('');
      }
    });
    return csvRows.join('\n');
  };

  // 下载文件
  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], {
      type: mimeType
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 创建备份记录
  const createBackupRecord = async (fileName, format, data) => {
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'taiji_backup_records',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            user_id: $w.auth.currentUser?.userId || 'anonymous',
            file_name: fileName,
            format: format,
            data_type: exportConfig.dataType,
            file_size: new Blob([JSON.stringify(data)]).size,
            record_count: Object.values(data.data).reduce((sum, records) => sum + (records?.length || 0), 0),
            created_at: Date.now()
          }
        }
      });
      await loadBackupRecords();
    } catch (error) {
      console.error('创建备份记录失败:', error);
    }
  };

  // 恢复数据
  const restoreData = async backupRecord => {
    try {
      setLoading(true);
      // 这里可以实现数据恢复逻辑
      toast({
        title: "恢复功能",
        description: "数据恢复功能正在开发中",
        duration: 2000
      });
    } catch (error) {
      toast({
        title: "恢复失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 更新导出配置
  const updateExportConfig = (key, value) => {
    setExportConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const updateNestedConfig = (category, key, value) => {
    setExportConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };
  const updateFieldConfig = (dataType, field, value) => {
    setExportConfig(prev => ({
      ...prev,
      includeFields: {
        ...prev.includeFields,
        [dataType]: value
      }
    }));
  };

  // 初始化
  useEffect(() => {
    loadDataStats();
    loadBackupRecords();
  }, []);
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-[#F5F5DC] p-4">
      <div className="max-w-6xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            数据导出与备份
          </h1>
          <p className="text-[#F5F5DC]/70">导出您的训练数据、进度记录和成就信息</p>
        </div>

        {/* 数据统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-black/30 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{dataStats.training.count}</div>
                  <div className="text-sm text-[#F5F5DC]/70">训练任务</div>
                </div>
                <Target className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{dataStats.progress.count}</div>
                  <div className="text-sm text-[#F5F5DC]/70">进度记录</div>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-yellow-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{dataStats.achievements.count}</div>
                  <div className="text-sm text-[#F5F5DC]/70">成就数量</div>
                </div>
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-green-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F5F5DC]">{dataStats.logs.count}</div>
                  <div className="text-sm text-[#F5F5DC]/70">日志条目</div>
                </div>
                <FileText className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 功能标签页 */}
        <div className="bg-black/30 border border-gray-600 rounded-lg">
          <div className="flex border-b border-gray-600">
            <button onClick={() => setActiveTab('export')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'export' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Download className="w-4 h-4" />
              数据导出
            </button>
            <button onClick={() => setActiveTab('backup')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'backup' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Database className="w-4 h-4" />
              备份管理
            </button>
          </div>

          <div className="p-6">
            {/* 数据导出标签页 */}
            {activeTab === 'export' && <div className="space-y-6">
                {/* 导出配置 */}
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">导出配置</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 数据类型选择 */}
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">数据类型</label>
                      <Select value={exportConfig.dataType} onValueChange={value => updateExportConfig('dataType', value)}>
                        <SelectTrigger className="bg-black/20 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部数据</SelectItem>
                          <SelectItem value="training">训练任务</SelectItem>
                          <SelectItem value="progress">进度记录</SelectItem>
                          <SelectItem value="achievements">成就信息</SelectItem>
                          <SelectItem value="logs">系统日志</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 导出格式选择 */}
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">导出格式</label>
                      <Select value={exportConfig.format} onValueChange={value => updateExportConfig('format', value)}>
                        <SelectTrigger className="bg-black/20 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON格式</SelectItem>
                          <SelectItem value="csv">CSV格式</SelectItem>
                          <SelectItem value="pdf">PDF格式</SelectItem>
                          <SelectItem value="excel">Excel格式</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 时间范围选择 */}
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">时间范围</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={exportConfig.dateRange.enabled} onCheckedChange={checked => updateNestedConfig('dateRange', 'enabled', checked)} />
                      <span className="text-[#F5F5DC]">限制时间范围</span>
                    </div>
                    {exportConfig.dateRange.enabled && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">开始日期</label>
                          <input type="date" value={exportConfig.dateRange.startDate} onChange={e => updateNestedConfig('dateRange', 'startDate', e.target.value)} className="w-full px-3 py-2 bg-black/20 border border-gray-600 rounded-lg text-[#F5F5DC]" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">结束日期</label>
                          <input type="date" value={exportConfig.dateRange.endDate} onChange={e => updateNestedConfig('dateRange', 'endDate', e.target.value)} className="w-full px-3 py-2 bg-black/20 border border-gray-600 rounded-lg text-[#F5F5DC]" />
                        </div>
                      </div>}
                  </div>
                </div>

                {/* 导出选项 */}
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">导出选项</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">包含统计信息</div>
                        <div className="text-sm text-[#F5F5DC]/60">导出数据统计和分析</div>
                      </div>
                      <Switch checked={exportConfig.options.includeStats} onCheckedChange={checked => updateNestedConfig('options', 'includeStats', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">包含图表</div>
                        <div className="text-sm text-[#F5F5DC]/60">导出数据可视化图表</div>
                      </div>
                      <Switch checked={exportConfig.options.includeCharts} onCheckedChange={checked => updateNestedConfig('options', 'includeCharts', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">压缩文件</div>
                        <div className="text-sm text-[#F5F5DC]/60">压缩导出文件以减小体积</div>
                      </div>
                      <Switch checked={exportConfig.options.compress} onCheckedChange={checked => updateNestedConfig('options', 'compress', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">加密文件</div>
                        <div className="text-sm text-[#F5F5DC]/60">使用密码保护导出文件</div>
                      </div>
                      <Switch checked={exportConfig.options.encrypt} onCheckedChange={checked => updateNestedConfig('options', 'encrypt', checked)} />
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-4">
                  <Button variant="outline" onClick={previewExportData} disabled={loading} className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    预览数据
                  </Button>
                  <Button onClick={executeExport} disabled={loading} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    {loading ? '导出中...' : '开始导出'}
                  </Button>
                </div>

                {/* 导出进度 */}
                {loading && <div className="space-y-2">
                    <div className="flex justify-between text-sm text-[#F5F5DC]/80">
                      <span>导出进度</span>
                      <span>{exportProgress}%</span>
                    </div>
                    <Progress value={exportProgress} className="h-2" />
                  </div>}
              </div>}

            {/* 备份管理标签页 */}
            {activeTab === 'backup' && <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">备份记录</h3>
                  {backupRecords.length > 0 ? <div className="space-y-3">
                      {backupRecords.map((record, index) => <Card key={record._id || index} className="bg-black/20 border-gray-600">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-[#F5F5DC]">{record.file_name}</div>
                                <div className="text-sm text-[#F5F5DC]/60 mt-1">
                                  格式: {record.format} | 大小: {(record.file_size / 1024).toFixed(2)}KB | 记录数: {record.record_count}
                                </div>
                                <div className="text-xs text-[#F5F5DC]/50 mt-1">
                                  备份时间: {new Date(record.created_at).toLocaleString()}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => restoreData(record)} className="flex items-center gap-1">
                                  <Upload className="w-3 h-3" />
                                  恢复
                                </Button>
                                <Button size="sm" variant="outline" className="flex items-center gap-1">
                                  <Download className="w-3 h-3" />
                                  下载
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>)}
                    </div> : <div className="text-center py-8">
                    <Database className="w-12 h-12 mx-auto mb-4 text-[#F5F5DC]/50" />
                    <div className="text-[#F5F5DC]/70">暂无备份记录</div>
                    <div className="text-sm text-[#F5F5DC]/50 mt-2">导出数据后会自动创建备份记录</div>
                  </div>}
                </div>
              </div>}
          </div>
        </div>

        {/* 数据预览对话框 */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="bg-black/90 border-gray-600 max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#F5F5DC]">数据预览</DialogTitle>
              <DialogDescription className="text-[#F5F5DC]/70">
                预览将要导出的数据内容
              </DialogDescription>
            </DialogHeader>
            {previewData && <div className="space-y-4">
                <div className="bg-black/50 border border-gray-600 rounded-lg p-4">
                  <h4 className="font-medium text-[#F5F5DC] mb-2">导出信息</h4>
                  <div className="text-sm text-[#F5F5DC]/80 space-y-1">
                    <div>用户ID: {previewData.exportInfo.userId}</div>
                    <div>导出时间: {new Date(previewData.exportInfo.exportTime).toLocaleString()}</div>
                    <div>版本: {previewData.exportInfo.version}</div>
                  </div>
                </div>
                
                {previewData.stats && <div className="bg-black/50 border border-gray-600 rounded-lg p-4">
                    <h4 className="font-medium text-[#F5F5DC] mb-2">数据统计</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-[#F5F5DC]/60">训练任务</div>
                        <div className="font-medium text-[#F5F5DC]">{previewData.stats.trainingCount}</div>
                      </div>
                      <div>
                        <div className="text-[#F5F5DC]/60">进度记录</div>
                        <div className="font-medium text-[#F5F5DC]">{previewData.stats.progressCount}</div>
                      </div>
                      <div>
                        <div className="text-[#F5F5DC]/60">成就数量</div>
                        <div className="font-medium text-[#F5F5DC]">{previewData.stats.achievementsCount}</div>
                      </div>
                      <div>
                        <div className="text-[#F5F5DC]/60">日志条目</div>
                        <div className="font-medium text-[#F5F5DC]">{previewData.stats.logsCount}</div>
                      </div>
                    </div>
                  </div>}

                <div className="bg-black/50 border border-gray-600 rounded-lg p-4">
                  <h4 className="font-medium text-[#F5F5DC] mb-2">数据预览</h4>
                  <pre className="text-xs text-[#F5F5DC] overflow-x-auto max-h-60">
                    {JSON.stringify(previewData.data, null, 2).substring(0, 1000)}...
                  </pre>
                </div>
              </div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                关闭
              </Button>
              <Button onClick={() => {
              setShowPreviewDialog(false);
              executeExport();
            }}>
                确认导出
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 导出成功对话框 */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="bg-black/90 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-[#F5F5DC]">导出成功</DialogTitle>
              <DialogDescription className="text-[#F5F5DC]/70">
                您的数据已成功导出
              </DialogDescription>
            </DialogHeader>
            {exportData && <div className="space-y-4">
                <div className="bg-black/50 border border-gray-600 rounded-lg p-4">
                  <h4 className="font-medium text-[#F5F5DC] mb-2">导出统计</h4>
                  <div className="text-sm text-[#F5F5DC]/80 space-y-1">
                    <div>导出时间: {new Date().toLocaleString()}</div>
                    <div>数据类型: {exportConfig.dataType}</div>
                    <div>导出格式: {exportConfig.format}</div>
                    {exportData.stats && <div>总记录数: {Object.values(exportData.stats).reduce((sum, count) => sum + count, 0)}</div>}
                  </div>
                </div>
              </div>}
            <DialogFooter>
              <Button onClick={() => setShowExportDialog(false)}>
                完成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
}