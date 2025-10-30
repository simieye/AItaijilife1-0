// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Progress } from '@/components/ui';
// @ts-ignore;
import { MemoryStick } from 'lucide-react';

export function MemoryPyramid({
  stm,
  mtm,
  ltm
}) {
  const layers = [{
    name: '短期记忆 (STM)',
    value: stm,
    max: 20,
    color: 'bg-blue-500'
  }, {
    name: '中期记忆 (MTM)',
    value: mtm,
    max: 50,
    color: 'bg-purple-500'
  }, {
    name: '长期记忆 (LTM)',
    value: ltm,
    max: 200,
    color: 'bg-cyan-500'
  }];
  return <Card className="bg-black/30 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MemoryStick className="h-5 w-5" />
          记忆金字塔
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {layers.map((layer, index) => <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{layer.name}</span>
                <span>{layer.value}条</span>
              </div>
              <Progress value={layer.value / layer.max * 100} className="h-2" indicatorClassName={layer.color} />
            </div>)}
        </div>
      </CardContent>
    </Card>;
}