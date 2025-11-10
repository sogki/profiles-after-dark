import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Monitor,
  Activity,
  Server,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  LineChart as LineChartIcon,
  Globe,
  Zap,
  Clock,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { getConfigValue } from '../../../lib/config';

interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: string;
}

interface MetricDataPoint {
  timestamp: string;
  responseTime: number;
  requests: number;
  errors: number;
  cpu: number;
  memory: number;
}

interface MetricsData {
  timeRange: string;
  metrics: MetricDataPoint[];
  summary: {
    current: number;
    average: number;
    peak: number;
    totalRequests: number;
    totalErrors: number;
  };
}

export default function AnalyticsMonitoringView() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('1h');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [apiUrl, setApiUrl] = useState<string>(import.meta.env.VITE_API_URL || 'https://dev.profilesafterdark.com/api/v1');

  // Initialize API URL from config
  useEffect(() => {
    getConfigValue('VITE_API_URL').then(url => {
      if (url) {
        setApiUrl(url);
      }
    }).catch(() => {
      // Fallback already set
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch service health
      const healthResponse = await fetch(`${apiUrl}/monitoring/health`);
      const healthData = await healthResponse.json();
      
      if (healthData.success) {
        setServices(healthData.data.services);
      }

      // Fetch metrics
      const metricsResponse = await fetch(`${apiUrl}/monitoring/metrics?timeRange=${timeRange}`);
      const metricsData = await metricsResponse.json();
      
      if (metricsData.success) {
        setMetrics(metricsData.data);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      toast.error('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }, [timeRange, apiUrl]);

  useEffect(() => {
    loadData();
    
    if (isLive) {
      const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [loadData, isLive]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-400 border-green-400';
      case 'degraded':
        return 'text-yellow-400 border-yellow-400';
      case 'down':
        return 'text-red-400 border-red-400';
      default:
        return 'text-slate-400 border-slate-400';
    }
  };

  const formatTimeRange = (range: string) => {
    const ranges = {
      '1h': 'Last Hour',
      '24h': 'Last 24 Hours',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days'
    };
    return ranges[range as keyof typeof ranges] || range;
  };

  const formatChartTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeRange === '1h') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === '24h') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const operationalCount = services.filter(s => s.status === 'operational').length;
  const allOperational = operationalCount === services.length && services.length > 0;

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">System Status Dashboard</h2>
          <p className="text-red-400">Comprehensive monitoring of all system components</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              isLive
                ? 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
                : 'bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600'
            }`}
          >
            <Activity className={`w-4 h-4 mr-2 ${isLive ? 'animate-pulse' : ''}`} />
            {isLive ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={loadData}
            className="flex items-center px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </button>
        </div>
      </div>

      {/* Core Services Status */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Core Services</h3>
              <p className="text-slate-400 text-sm">Main website, APIs, database, and Discord bot</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(operationalCount, 5) }).map((_, i) => (
              <CheckCircle key={i} className="w-5 h-5 text-green-400" />
            ))}
            {operationalCount > 5 && (
              <span className="text-green-400 text-sm">+{operationalCount - 5}</span>
            )}
            <span className={`${allOperational ? 'text-green-400' : 'text-yellow-400'}`}>
              {operationalCount}/{services.length} operational
            </span>
            <CheckCircle className={`w-5 h-5 ${allOperational ? 'text-green-400' : 'text-yellow-400'}`} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-slate-700/50 rounded-lg p-4 border ${getStatusColor(service.status)}/30`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white">{service.name}</h4>
                {getStatusIcon(service.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Service {service.status}</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-white">{service.responseTime}ms</span>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(service.status)} bg-opacity-20`}>
                  {service.status === 'operational' ? 'Operational' : service.status === 'degraded' ? 'Degraded' : 'Down'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      {metrics && (
        <div className="bg-slate-800 rounded-xl border border-red-500/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <LineChartIcon className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Performance Metrics</h3>
                <p className="text-red-400 text-sm">Real-time system performance monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <span className="text-red-400 text-sm">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Current</div>
              <div className="text-2xl font-bold text-red-400">{metrics.summary.current}ms</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Average</div>
              <div className="text-2xl font-bold text-white">{metrics.summary.average}ms</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Peak</div>
              <div className="text-2xl font-bold text-yellow-400">{metrics.summary.peak}ms</div>
            </div>
          </div>

          {/* API Response Time Chart */}
          <div className="bg-slate-700/30 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">
              API Response Time ({formatTimeRange(timeRange)})
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.metrics.map(m => ({
                ...m,
                time: formatChartTime(m.timestamp)
              }))}>
                <defs>
                  <linearGradient id="colorResponseTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorResponseTime)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Additional Metrics Charts */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests Over Time */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Requests Over Time</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metrics.metrics.map(m => ({
                ...m,
                time: formatChartTime(m.timestamp)
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Error Rate */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Error Rate</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metrics.metrics.map(m => ({
                ...m,
                time: formatChartTime(m.timestamp)
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-6 h-6 text-yellow-400" />
              <span className="text-sm text-slate-400">Total Requests</span>
            </div>
            <div className="text-3xl font-bold text-white">{metrics.summary.totalRequests.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <span className="text-sm text-slate-400">Total Errors</span>
            </div>
            <div className="text-3xl font-bold text-red-400">{metrics.summary.totalErrors}</div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <span className="text-sm text-slate-400">Error Rate</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {metrics.summary.totalRequests > 0
                ? ((metrics.summary.totalErrors / metrics.summary.totalRequests) * 100).toFixed(2)
                : 0}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

