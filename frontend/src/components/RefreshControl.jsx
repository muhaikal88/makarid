import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

export const RefreshControl = ({ onRefresh, label = 'Refresh' }) => {
  const [autoInterval, setAutoInterval] = useState(0); // 0 = off, minutes
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const timerRef = useRef(null);

  const doRefresh = async () => {
    setRefreshing(true);
    try { await onRefresh(); }
    catch {}
    setRefreshing(false);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoInterval > 0) {
      timerRef.current = setInterval(doRefresh, autoInterval * 60 * 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoInterval]);

  const timeAgo = () => {
    if (!lastRefresh) return '';
    const s = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (s < 60) return `${s}d lalu`;
    return `${Math.floor(s / 60)}m lalu`;
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={doRefresh} disabled={refreshing}>
        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? '...' : label}
      </Button>
      <select value={autoInterval} onChange={(e) => setAutoInterval(parseInt(e.target.value))}
        className="h-8 rounded-md border border-input bg-background px-1.5 text-xs" title="Auto refresh">
        <option value="0">Manual</option>
        <option value="1">1 menit</option>
        <option value="3">3 menit</option>
        <option value="5">5 menit</option>
        <option value="10">10 menit</option>
        <option value="30">30 menit</option>
      </select>
      {lastRefresh && <span className="text-[10px] text-gray-400">{timeAgo()}</span>}
    </div>
  );
};
