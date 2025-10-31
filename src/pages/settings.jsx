// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Progress, Badge, Switch, Alert, AlertDescription, AlertTitle, useToast, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
// @ts-ignore;
import { Settings, Palette, Bell, Brain, Layout, Download, Upload, RotateCcw, Save, Eye, EyeOff, Moon, Sun, Zap, Volume2, VolumeX, Clock, Calendar, Target, Trophy, Star, ChevronRight, Check, X, RefreshCw } from 'lucide-react';

export default function UserSettings(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState('theme');
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportedConfig, setExportedConfig] = useState(null);

  // 用户设置状态
  const [userSettings, setUserSettings] = useState({
    // 主题设置
    theme: {
      mode: 'warm',
      // warm, cool, dark, auto
      primaryColor: '#8B5CF6',
      accentColor: '#06B6D4',
      fontSize: 'medium',
      // small, medium, large
      fontFamily: 'system',
      // system, serif, mono
      borderRadius: 'medium',
      // small, medium, large, none
      animations: true,
      glassEffect: true,
      gradientBackground: true
    },
    // 通知设置
    notifications: {
      enabled: true,
      sound: true,
      vibration: false,
      desktop: true,
      types: {
        training: true,
        achievements: true,
        evolution: true,
        ethics: true,
        system: true
      },
      frequency: 'important',
      // all, important, none
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      position: 'top-right' // top-right, top-left, bottom-right, bottom-left
    },
    // 训练设置
    training: {
      autoStart: false,
      difficulty: 'adaptive',
      // easy, medium, hard, adaptive
      reminderEnabled: true,
      reminderTime: '19:00',
      dailyGoal: 3,
      maxDailyTime: 60,
      // minutes
      breakReminder: true,
      breakInterval: 30,
      // minutes
      showProgress: true,
      showStats: true,
      autoSave: true
    },
    // 界面设置
    interface: {
      layout: 'grid',
      // grid, list, compact
      density: 'comfortable',
      // compact, comfortable, spacious
      sidebarCollapsed: false,
      showTooltips: true,
      showShortcuts: true,
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      showSystemInfo: true,
      compactMode: false
    }
  });

  // 预设主题配置
  const themePresets = {
    warm: {
      name: '暖白色主题',
      description: '温暖舒适的暖白色调',
      primaryColor: '#F5F5DC',
      accentColor: '#8B5CF6',
      backgroundColor: 'from-slate-900 via-purple-900 to-slate-900',
      icon: Sun
    },
    cool: {
      name: '冷色调主题',
      description: '清新的蓝绿色调',
      primaryColor: '#E0F2FE',
      accentColor: '#06B6D4',
      backgroundColor: 'from-slate-900 via-blue-900 to-slate-900',
      icon: Eye
    },
    dark: {
      name: '暗黑模式',
      description: '深色护眼模式',
      primaryColor: '#F3F4F6',
      accentColor: '#6366F1',
      backgroundColor: 'from-gray-900 via-gray-800 to-gray-900',
      icon: Moon
    },
    auto: {
      name: '自动切换',
      description: '根据时间自动切换',
      primaryColor: '#F5F5DC',
      accentColor: '#8B5CF6',
      backgroundColor: 'from-slate-900 via-purple-900 to-slate-900',
      icon: RefreshCw
    }
  };

  // 加载用户设置
  const loadUserSettings = async () => {
    try {
      setLoading(true);
      // 模拟加载设置，实际应该从数据源获取
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 从 localStorage 加载设置作为备用
      const cachedSettings = localStorage.getItem('taiji_user_settings');
      if (cachedSettings) {
        const settings = JSON.parse(cachedSettings);
        setUserSettings(prev => ({
          ...prev,
          ...settings
        }));
      }
      toast({
        title: "设置已加载",
        description: "用户设置已成功加载",
        duration: 2000
      });
    } catch (error) {
      console.error('加载用户设置失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载用户设置，使用默认设置",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 保存用户设置
  const saveUserSettings = async () => {
    try {
      setLoading(true);

      // 保存到 localStorage 作为备用
      localStorage.setItem('taiji_user_settings', JSON.stringify(userSettings));

      // 模拟保存到服务器
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      toast({
        title: "保存成功",
        description: "用户设置已保存",
        duration: 2000
      });

      // 应用设置到当前界面
      applySettingsToInterface();
    } catch (error) {
      console.error('保存用户设置失败:', error);
      toast({
        title: "保存失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 应用设置到界面
  const applySettingsToInterface = () => {
    try {
      // 应用主题设置
      document.documentElement.style.setProperty('--primary-color', userSettings.theme.primaryColor);
      document.documentElement.style.setProperty('--accent-color', userSettings.theme.accentColor);

      // 应用字体设置
      if (userSettings.theme.fontSize === 'small') {
        document.documentElement.style.fontSize = '14px';
      } else if (userSettings.theme.fontSize === 'large') {
        document.documentElement.style.fontSize = '18px';
      } else {
        document.documentElement.style.fontSize = '16px';
      }

      // 应用字体类型
      if (userSettings.theme.fontFamily === 'serif') {
        document.documentElement.style.fontFamily = 'serif';
      } else if (userSettings.theme.fontFamily === 'mono') {
        document.documentElement.style.fontFamily = 'monospace';
      } else {
        document.documentElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      }
      toast({
        title: "设置已应用",
        description: "界面设置已生效",
        duration: 1500
      });
    } catch (error) {
      console.error('应用设置失败:', error);
    }
  };

  // 重置设置
  const resetSettings = () => {
    const defaultSettings = {
      theme: {
        mode: 'warm',
        primaryColor: '#8B5CF6',
        accentColor: '#06B6D4',
        fontSize: 'medium',
        fontFamily: 'system',
        borderRadius: 'medium',
        animations: true,
        glassEffect: true,
        gradientBackground: true
      },
      notifications: {
        enabled: true,
        sound: true,
        vibration: false,
        desktop: true,
        types: {
          training: true,
          achievements: true,
          evolution: true,
          ethics: true,
          system: true
        },
        frequency: 'important',
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        },
        position: 'top-right'
      },
      training: {
        autoStart: false,
        difficulty: 'adaptive',
        reminderEnabled: true,
        reminderTime: '19:00',
        dailyGoal: 3,
        maxDailyTime: 60,
        breakReminder: true,
        breakInterval: 30,
        showProgress: true,
        showStats: true,
        autoSave: true
      },
      interface: {
        layout: 'grid',
        density: 'comfortable',
        sidebarCollapsed: false,
        showTooltips: true,
        showShortcuts: true,
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
        showSystemInfo: true,
        compactMode: false
      }
    };
    setUserSettings(defaultSettings);
    setHasChanges(true);
    setShowResetDialog(false);
    toast({
      title: "设置已重置",
      description: "所有设置已恢复到默认值",
      duration: 2000
    });
  };

  // 导出配置
  const exportConfig = () => {
    try {
      const configData = {
        version: '1.0',
        timestamp: Date.now(),
        settings: userSettings
      };
      const configString = JSON.stringify(configData, null, 2);
      setExportedConfig(configString);
      setShowExportDialog(true);
      toast({
        title: "配置已生成",
        description: "配置文件已准备导出",
        duration: 1500
      });
    } catch (error) {
      toast({
        title: "导出失败",
        description: "无法生成配置文件",
        variant: "destructive"
      });
    }
  };

  // 导入配置
  const importConfig = event => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const configData = JSON.parse(e.target.result);
          if (configData.settings) {
            setUserSettings(configData.settings);
            setHasChanges(true);
            setShowExportDialog(false);
            toast({
              title: "导入成功",
              description: "配置已导入并应用",
              duration: 2000
            });
          } else {
            throw new Error('配置文件格式不正确');
          }
        } catch (error) {
          toast({
            title: "导入失败",
            description: "配置文件格式错误或已损坏",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
    // 重置文件输入
    event.target.value = '';
  };

  // 更新设置
  const updateSetting = (category, key, value) => {
    setUserSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);

    // 实时预览某些设置
    if (category === 'theme') {
      setTimeout(() => applySettingsToInterface(), 100);
    }
  };
  const updateNestedSetting = (category, nestedKey, key, value) => {
    setUserSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [nestedKey]: {
          ...prev[category][nestedKey],
          [key]: value
        }
      }
    }));
    setHasChanges(true);
  };

  // 测试功能
  const testTabSwitch = tabName => {
    setActiveTab(tabName);
    toast({
      title: "标签页切换",
      description: `已切换到${tabName === 'theme' ? '主题设置' : tabName === 'notifications' ? '通知设置' : tabName === 'training' ? '训练设置' : '界面设置'}`,
      duration: 1000
    });
  };
  const testSettingChange = (category, setting, value) => {
    updateSetting(category, setting, value);
    toast({
      title: "设置已更改",
      description: `${category}.${setting} = ${value}`,
      duration: 1000
    });
  };

  // 初始化
  useEffect(() => {
    loadUserSettings();
  }, []);
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-[#F5F5DC] p-4">
      <div className="max-w-6xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            用户设置
          </h1>
          <p className="text-[#F5F5DC]/70">个性化您的太极生命体体验</p>
        </div>

        {/* 测试控制面板 */}
        <div className="mb-6 p-4 bg-black/30 border border-purple-500/30 rounded-lg">
          <h3 className="text-lg font-medium text-[#F5F5DC] mb-3">功能测试面板</h3>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => testTabSwitch('theme')}>
              测试主题标签
            </Button>
            <Button size="sm" variant="outline" onClick={() => testTabSwitch('notifications')}>
              测试通知标签
            </Button>
            <Button size="sm" variant="outline" onClick={() => testTabSwitch('training')}>
              测试训练标签
            </Button>
            <Button size="sm" variant="outline" onClick={() => testTabSwitch('interface')}>
              测试界面标签
            </Button>
            <Button size="sm" variant="outline" onClick={() => testSettingChange('theme', 'mode', 'dark')}>
              测试主题切换
            </Button>
            <Button size="sm" variant="outline" onClick={() => testSettingChange('notifications', 'enabled', !userSettings.notifications.enabled)}>
              测试通知开关
            </Button>
            <Button size="sm" variant="outline" onClick={() => testSettingChange('training', 'dailyGoal', 5)}>
              测试训练目标
            </Button>
            <Button size="sm" variant="outline" onClick={() => testSettingChange('interface', 'language', 'en-US')}>
              测试语言切换
            </Button>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2 mb-6">
          <Button variant="outline" onClick={exportConfig} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出配置
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-config').click()} className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            导入配置
          </Button>
          <Button variant="outline" onClick={() => setShowResetDialog(true)} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            重置设置
          </Button>
          <Button variant={hasChanges ? "default" : "outline"} onClick={saveUserSettings} disabled={!hasChanges || loading} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {loading ? '保存中...' : '保存设置'}
          </Button>
        </div>

        {/* 隐藏的文件输入 */}
        <input id="import-config" type="file" accept=".json" onChange={importConfig} className="hidden" />

        {/* 设置标签页 */}
        <div className="bg-black/30 border border-gray-600 rounded-lg">
          <div className="flex border-b border-gray-600">
            <button onClick={() => setActiveTab('theme')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'theme' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Palette className="w-4 h-4" />
              主题设置
            </button>
            <button onClick={() => setActiveTab('notifications')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'notifications' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Bell className="w-4 h-4" />
              通知设置
            </button>
            <button onClick={() => setActiveTab('training')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'training' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Brain className="w-4 h-4" />
              训练设置
            </button>
            <button onClick={() => setActiveTab('interface')} className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === 'interface' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-[#F5F5DC]/70 hover:text-[#F5F5DC]'}`}>
              <Layout className="w-4 h-4" />
              界面设置
            </button>
          </div>

          <div className="p-6">
            {/* 主题设置 */}
            {activeTab === 'theme' && <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">主题模式</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(themePresets).map(([key, preset]) => {
                  const Icon = preset.icon;
                  return <Card key={key} className={`bg-black/20 border-2 cursor-pointer transition-all ${userSettings.theme.mode === key ? 'border-purple-500/50' : 'border-gray-600 hover:border-purple-500/30'}`} onClick={() => updateSetting('theme', 'mode', key)}>
                          <CardContent className="p-4">
                            <div className="text-center space-y-2">
                              <Icon className={`w-8 h-8 mx-auto ${userSettings.theme.mode === key ? 'text-purple-400' : 'text-[#F5F5DC]/60'}`} />
                              <div className="font-medium text-[#F5F5DC]">{preset.name}</div>
                              <div className="text-xs text-[#F5F5DC]/60">{preset.description}</div>
                              {userSettings.theme.mode === key && <Check className="w-4 h-4 mx-auto text-green-400" />}
                            </div>
                          </CardContent>
                        </Card>;
                })}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">字体设置</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">字体大小</label>
                      <Select value={userSettings.theme.fontSize} onValueChange={value => updateSetting('theme', 'fontSize', value)}>
                        <SelectTrigger className="bg-black/20 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">小</SelectItem>
                          <SelectItem value="medium">中</SelectItem>
                          <SelectItem value="large">大</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">字体类型</label>
                      <Select value={userSettings.theme.fontFamily} onValueChange={value => updateSetting('theme', 'fontFamily', value)}>
                        <SelectTrigger className="bg-black/20 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">系统字体</SelectItem>
                          <SelectItem value="serif">衬线字体</SelectItem>
                          <SelectItem value="mono">等宽字体</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">圆角大小</label>
                      <Select value={userSettings.theme.borderRadius} onValueChange={value => updateSetting('theme', 'borderRadius', value)}>
                        <SelectTrigger className="bg-black/20 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">无圆角</SelectItem>
                          <SelectItem value="small">小</SelectItem>
                          <SelectItem value="medium">中</SelectItem>
                          <SelectItem value="large">大</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">视觉效果</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">启用动画</div>
                        <div className="text-sm text-[#F5F5DC]/60">界面过渡动画和微交互</div>
                      </div>
                      <Switch checked={userSettings.theme.animations} onCheckedChange={checked => updateSetting('theme', 'animations', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">毛玻璃效果</div>
                        <div className="text-sm text-[#F5F5DC]/60">卡片背景的模糊效果</div>
                      </div>
                      <Switch checked={userSettings.theme.glassEffect} onCheckedChange={checked => updateSetting('theme', 'glassEffect', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">渐变背景</div>
                        <div className="text-sm text-[#F5F5DC]/60">页面背景的渐变效果</div>
                      </div>
                      <Switch checked={userSettings.theme.gradientBackground} onCheckedChange={checked => updateSetting('theme', 'gradientBackground', checked)} />
                    </div>
                  </div>
                </div>
              </div>}

            {/* 通知设置 */}
            {activeTab === 'notifications' && <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">通知偏好</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">启用通知</div>
                        <div className="text-sm text-[#F5F5DC]/60">接收系统通知</div>
                      </div>
                      <Switch checked={userSettings.notifications.enabled} onCheckedChange={checked => updateSetting('notifications', 'enabled', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">声音提醒</div>
                        <div className="text-sm text-[#F5F5DC]/60">通知时播放声音</div>
                      </div>
                      <Switch checked={userSettings.notifications.sound} onCheckedChange={checked => updateSetting('notifications', 'sound', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">桌面通知</div>
                        <div className="text-sm text-[#F5F5DC]/60">显示桌面通知</div>
                      </div>
                      <Switch checked={userSettings.notifications.desktop} onCheckedChange={checked => updateSetting('notifications', 'desktop', checked)} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">通知类型</h3>
                  <div className="space-y-3">
                    {Object.entries(userSettings.notifications.types).map(([key, value]) => <div key={key} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-[#F5F5DC]">{key === 'training' ? '训练通知' : key === 'achievements' ? '成就通知' : key === 'evolution' ? '进化通知' : key === 'ethics' ? '伦理通知' : '系统通知'}</div>
                          <div className="text-sm text-[#F5F5DC]/60">接收{key === 'training' ? '训练相关' : key === 'achievements' ? '成就解锁' : key === 'evolution' ? '进化进度' : key === 'ethics' ? '伦理审计' : '系统'}通知</div>
                        </div>
                        <Switch checked={value} onCheckedChange={checked => updateNestedSetting('notifications', 'types', key, checked)} />
                      </div>)}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">通知频率</h3>
                  <Select value={userSettings.notifications.frequency} onValueChange={value => updateSetting('notifications', 'frequency', value)}>
                    <SelectTrigger className="bg-black/20 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部通知</SelectItem>
                      <SelectItem value="important">仅重要通知</SelectItem>
                      <SelectItem value="none">关闭通知</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">免打扰时间</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">启用免打扰</div>
                        <div className="text-sm text-[#F5F5DC]/60">在指定时间段内静音通知</div>
                      </div>
                      <Switch checked={userSettings.notifications.quietHours.enabled} onCheckedChange={checked => updateNestedSetting('notifications', 'quietHours', 'enabled', checked)} />
                    </div>
                    {userSettings.notifications.quietHours.enabled && <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">开始时间</label>
                          <input type="time" value={userSettings.notifications.quietHours.start} onChange={e => updateNestedSetting('notifications', 'quietHours', 'start', e.target.value)} className="w-full px-3 py-2 bg-black/20 border border-gray-600 rounded-lg text-[#F5F5DC]" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">结束时间</label>
                          <input type="time" value={userSettings.notifications.quietHours.end} onChange={e => updateNestedSetting('notifications', 'quietHours', 'end', e.target.value)} className="w-full px-3 py-2 bg-black/20 border border-gray-600 rounded-lg text-[#F5F5DC]" />
                        </div>
                      </div>}
                  </div>
                </div>
              </div>}

            {/* 训练设置 */}
            {activeTab === 'training' && <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">训练偏好</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">自动开始训练</div>
                        <div className="text-sm text-[#F5F5DC]/60">到达预定时间自动开始训练</div>
                      </div>
                      <Switch checked={userSettings.training.autoStart} onCheckedChange={checked => updateSetting('training', 'autoStart', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">训练提醒</div>
                        <div className="text-sm text-[#F5F5DC]/60">在指定时间提醒训练</div>
                      </div>
                      <Switch checked={userSettings.training.reminderEnabled} onCheckedChange={checked => updateSetting('training', 'reminderEnabled', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">休息提醒</div>
                        <div className="text-sm text-[#F5F5DC]/60">长时间训练后提醒休息</div>
                      </div>
                      <Switch checked={userSettings.training.breakReminder} onCheckedChange={checked => updateSetting('training', 'breakReminder', checked)} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">训练参数</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">难度设置</label>
                      <Select value={userSettings.training.difficulty} onValueChange={value => updateSetting('training', 'difficulty', value)}>
                        <SelectTrigger className="bg-black/20 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">简单</SelectItem>
                          <SelectItem value="medium">中等</SelectItem>
                          <SelectItem value="hard">困难</SelectItem>
                          <SelectItem value="adaptive">自适应</SelectItem>
                          <SelectItem value="custom">自定义</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">每日目标</label>
                      <input type="number" min="1" max="10" value={userSettings.training.dailyGoal} onChange={e => updateSetting('training', 'dailyGoal', parseInt(e.target.value))} className="w-full px-3 py-2 bg-black/20 border border-gray-600 rounded-lg text-[#F5F5DC]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">提醒时间</label>
                      <input type="time" value={userSettings.training.reminderTime} onChange={e => updateSetting('training', 'reminderTime', e.target.value)} className="w-full px-3 py-2 bg-black/20 border border-gray-600 rounded-lg text-[#F5F5DC]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">最大训练时长(分钟)</label>
                      <input type="number" min="10" max="180" value={userSettings.training.maxDailyTime} onChange={e => updateSetting('training', 'maxDailyTime', parseInt(e.target.value))} className="w-full px-3 py-2 bg-black/20 border border-gray-600 rounded-lg text-[#F5F5DC]" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">显示选项</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">显示进度</div>
                        <div className="text-sm text-[#F5F5DC]/60">训练时显示进度条</div>
                      </div>
                      <Switch checked={userSettings.training.showProgress} onCheckedChange={checked => updateSetting('training', 'showProgress', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">显示统计</div>
                        <div className="text-sm text-[#F5F5DC]/60">显示训练统计数据</div>
                      </div>
                      <Switch checked={userSettings.training.showStats} onCheckedChange={checked => updateSetting('training', 'showStats', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">自动保存</div>
                        <div className="text-sm text-[#F5F5DC]/60">自动保存训练进度</div>
                      </div>
                      <Switch checked={userSettings.training.autoSave} onCheckedChange={checked => updateSetting('training', 'autoSave', checked)} />
                    </div>
                  </div>
                </div>
              </div>}

            {/* 界面设置 */}
            {activeTab === 'interface' && <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">布局设置</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">布局模式</label>
                      <Select value={userSettings.interface.layout} onValueChange={value => updateSetting('interface', 'layout', value)}>
                        <SelectTrigger className="bg-black/20 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grid">网格布局</SelectItem>
                          <SelectItem value="list">列表布局</SelectItem>
                          <SelectItem value="compact">紧凑布局</SelectItem>
                          <SelectItem value="card">卡片布局</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">显示密度</label>
                      <Select value={userSettings.interface.density} onValueChange={value => updateSetting('interface', 'density', value)}>
                        <SelectTrigger className="bg-black/20 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">紧凑</SelectItem>
                          <SelectItem value="comfortable">舒适</SelectItem>
                          <SelectItem value="spacious">宽松</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">显示选项</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">显示工具提示</div>
                        <div className="text-sm text-[#F5F5DC]/60">鼠标悬停显示提示信息</div>
                      </div>
                      <Switch checked={userSettings.interface.showTooltips} onCheckedChange={checked => updateSetting('interface', 'showTooltips', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">显示快捷键</div>
                        <div className="text-sm text-[#F5F5DC]/60">显示键盘快捷键提示</div>
                      </div>
                      <Switch checked={userSettings.interface.showShortcuts} onCheckedChange={checked => updateSetting('interface', 'showShortcuts', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">显示系统信息</div>
                        <div className="text-sm text-[#F5F5DC]/60">显示系统状态信息</div>
                      </div>
                      <Switch checked={userSettings.interface.showSystemInfo} onCheckedChange={checked => updateSetting('interface', 'showSystemInfo', checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#F5F5DC]">紧凑模式</div>
                        <div className="text-sm text-[#F5F5DC]/60">减少界面元素间距</div>
                      </div>
                      <Switch checked={userSettings.interface.compactMode} onCheckedChange={checked => updateSetting('interface', 'compactMode', checked)} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#F5F5DC] mb-4">地区设置</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">语言</label>
                      <Select value={userSettings.interface.language} onValueChange={value => updateSetting('interface', 'language', value)}>
                        <SelectTrigger className="bg-black/20 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zh-CN">简体中文</SelectItem>
                          <SelectItem value="zh-TW">繁体中文</SelectItem>
                          <SelectItem value="en-US">English</SelectItem>
                          <SelectItem value="ja-JP">日本語</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">时区</label>
                      <Select value={userSettings.interface.timezone} onValueChange={value => updateSetting('interface', 'timezone', value)}>
                        <SelectTrigger className="bg-black/20 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Shanghai">北京时间</SelectItem>
                          <SelectItem value="Asia/Tokyo">东京时间</SelectItem>
                          <SelectItem value="America/New_York">纽约时间</SelectItem>
                          <SelectItem value="Europe/London">伦敦时间</SelectItem>
                          <SelectItem value="UTC">UTC时间</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">日期格式</label>
                      <Select value={userSettings.interface.dateFormat} onValueChange={value => updateSetting('interface', 'dateFormat', value)}>
                        <SelectTrigger className="bg-black/20 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YYYY-MM-DD">2024-01-01</SelectItem>
                          <SelectItem value="DD/MM/YYYY">01/01/2024</SelectItem>
                          <SelectItem value="MM/DD/YYYY">01/01/2024</SelectItem>
                          <SelectItem value="DD-MM-YYYY">01-01-2024</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5DC]/70 mb-2">时间格式</label>
                      <Select value={userSettings.interface.timeFormat} onValueChange={value => updateSetting('interface', 'timeFormat', value)}>
                        <SelectTrigger className="bg-black/20 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24h">24小时制</SelectItem>
                          <SelectItem value="12h">12小时制</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>}
          </div>
        </div>

        {/* 重置确认对话框 */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent className="bg-black/90 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-[#F5F5DC]">重置设置</DialogTitle>
              <DialogDescription className="text-[#F5F5DC]/70">
                确定要重置所有设置到默认值吗？此操作无法撤销。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={resetSettings}>
                确认重置
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 导出配置对话框 */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="bg-black/90 border-gray-600 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#F5F5DC]">导出配置</DialogTitle>
              <DialogDescription className="text-[#F5F5DC]/70">
                复制下面的配置代码，可以导入到其他设备或备份。
              </DialogDescription>
            </DialogHeader>
            <div className="bg-black/50 border border-gray-600 rounded-lg p-4">
              <pre className="text-xs text-[#F5F5DC] overflow-x-auto max-h-96">
                {exportedConfig}
              </pre>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                关闭
              </Button>
              <Button onClick={() => {
              navigator.clipboard.writeText(exportedConfig);
              toast({
                title: "复制成功",
                description: "配置已复制到剪贴板",
                duration: 2000
              });
            }}>
                复制到剪贴板
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
}