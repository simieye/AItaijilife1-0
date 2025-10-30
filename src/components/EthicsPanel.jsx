// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Switch, Alert, AlertDescription } from '@/components/ui';
// @ts-ignore;
import { Shield, AlertTriangle } from 'lucide-react';

export function EthicsPanel({
  settings,
  onSettingChange
}) {
  const ethicsItems = [{
    key: 'privacy',
    label: '隐私保护',
    description: '卧室/浴室视觉永久关闭'
  }, {
    key: 'safety',
    label: '安全优先',
    description: '危险物品自动暂停'
  }, {
    key: 'consent',
    label: '知情同意',
    description: '每次记录前询问'
  }, {
    key: 'transparency',
    label: '决策透明',
    description: '所有行为可审计'
  }];
  return <Card className="bg-black/30 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          伦理防火墙
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ethicsItems.map(item => <div key={item.key} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-gray-400">{item.description}</div>
              </div>
              <Switch checked={settings[item.key]} onCheckedChange={checked => onSettingChange(item.key, checked)} />
            </div>)}
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              每日07:00自动播报合规声明，记忆30天自毁
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>;
}