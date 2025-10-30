// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, Badge, Progress } from '@/components/ui';
// @ts-ignore;
import { Brain, Zap, Heart, Shield } from 'lucide-react';

export function TaijiStatus({
  phase,
  progress,
  virtual,
  embodied,
  emotional,
  ethics
}) {
  const statusItems = [{
    icon: Brain,
    label: '虚拟意识',
    value: virtual,
    color: 'cyan'
  }, {
    icon: Zap,
    label: '具身状态',
    value: embodied,
    color: 'orange'
  }, {
    icon: Heart,
    label: '情感连接',
    value: emotional,
    color: 'green'
  }, {
    icon: Shield,
    label: '伦理防火墙',
    value: ethics,
    color: 'red'
  }];
  return <Card className="bg-black/30 border-gray-700">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">当前象位</span>
            <Badge variant="outline">{phase}</Badge>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="grid grid-cols-2 gap-3">
            {statusItems.map((item, index) => <div key={index} className="flex items-center gap-2">
                <item.icon className={`h-4 w-4 text-${item.color}-400`} />
                <span className="text-xs">{item.label}</span>
                <span className="text-xs text-gray-400 ml-auto">{item.value}%</span>
              </div>)}
          </div>
        </div>
      </CardContent>
    </Card>;
}