import { Zap } from 'lucide-react';

export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Zap className="text-primary" size={size} aria-hidden="true" />
      <span className="text-2xl font-bold text-foreground">ScriptSwift</span>
    </div>
  );
}
