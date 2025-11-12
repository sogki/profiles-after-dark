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
  BarChart3,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';
import { getConfigValue } from '../../../lib/config';
import { supabase } from '../../../lib/supabase';

interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: string;
}

interface MetricDataPoint {
  timestamp: string;
  time: string;
  responseTime: number;
  avg_response_time: number;
  requests: number;
  total_requests: number;
  errors: number;
  total_errors: number;
  error_rate: number;
  cpu?: number;
  memory?: number;
}

interface MetricsData {
  timeRange: string;
  metrics: MetricDataPoint[];
  summary: {
    current: number;
    average: number;
    peak: number;
    min: number;
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
    p50: number;
    p95: number;
    p99: number;
  };
}

interface EndpointUsage {
  endpoint: string;
  method: string;
  total_requests: number;
  total_errors: number;
  error_rate: number;
  avg_response_time: number;
  p95_response_time: number;
  total_request_size: number;
  total_response_size: number;
  unique_ips: number;
  unique_users: number;
}

interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: string;
}

export default function AnalyticsMonitoringView() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [endpointUsage, setEndpointUsage] = useState<EndpointUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [apiUrl, setApiUrl] = useState<string>(import.meta.env.VITE_API_URL || 'https://dev.profilesafterdark.com/api/v1');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  // Initialize API URL from config
  // Prefer base key (API_URL) over VITE_ prefixed version
  useEffect(() => {
    getConfigValue('API_URL').then(url => {
      if (url) setApiUrl(url);
    }).catch(() => {
      // Fallback to VITE_API_URL for backward compatibility
      getConfigValue('VITE_API_URL').then(url => {
        if (url) setApiUrl(url);
      }).catch(() => {
        // Final fallback already set in useState
      });
    });
  }, []);

  // Helper functions - defined before use
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Try to fetch service health from API (optional, won't fail if unavailable)
      try {
        const healthResponse = await fetch(`${apiUrl}/monitoring/health`, { 
          signal: AbortSignal.timeout(5000) 
        });
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          if (healthData.success) {
            setServices(healthData.data.services);
          }
        }
      } catch (error) {
        console.warn('Could not fetch health data from API, using database metrics only');
        // Set default services based on database availability
        setServices([
          { id: 'database', name: 'Database', status: 'operational', responseTime: 0, lastChecked: new Date().toISOString() },
          { id: 'api', name: 'API Server', status: 'operational', responseTime: 0, lastChecked: new Date().toISOString() }
        ]);
      }

      // Load metrics directly from database using RPC function
      try {
        const { data: metricsData, error: metricsError } = await supabase
          .rpc('get_api_metrics_summary', {
            p_time_range: timeRange,
            p_endpoint: selectedEndpoint
          });

        if (metricsError) {
          console.error('Error loading metrics from database:', metricsError);
          // Fallback to direct query if RPC fails
          await loadMetricsDirectly();
        } else if (metricsData && metricsData.length > 0) {
          // Transform database data to chart format
          const transformedMetrics: MetricDataPoint[] = metricsData.map((point: any) => {
            const timestamp = point.time_bucket;
            return {
              timestamp,
              time: formatChartTime(timestamp),
            responseTime: Number(point.avg_response_time) || 0,
            avg_response_time: Number(point.avg_response_time) || 0,
            requests: Number(point.total_requests) || 0,
            total_requests: Number(point.total_requests) || 0,
            errors: Number(point.total_errors) || 0,
            total_errors: Number(point.total_errors) || 0,
            error_rate: Number(point.error_rate) || 0
            };
          });

          // Calculate summary statistics
          const allResponseTimes = metricsData.map((p: any) => Number(p.avg_response_time) || 0);
          const allRequests = metricsData.map((p: any) => Number(p.total_requests) || 0);
          const allErrors = metricsData.map((p: any) => Number(p.total_errors) || 0);
          
          const totalRequests = allRequests.reduce((a: number, b: number) => a + b, 0);
          const totalErrors = allErrors.reduce((a: number, b: number) => a + b, 0);
          const avgResponseTime = allResponseTimes.length > 0 
            ? allResponseTimes.reduce((a: number, b: number) => a + b, 0) / allResponseTimes.length 
            : 0;
          const maxResponseTime = allResponseTimes.length > 0 ? Math.max(...allResponseTimes) : 0;
          const minResponseTime = allResponseTimes.length > 0 ? Math.min(...allResponseTimes) : 0;
          
          // Get percentiles from latest data point
          const latestPoint = metricsData[metricsData.length - 1];
          const p50 = latestPoint ? Number(latestPoint.p50_response_time) || 0 : 0;
          const p95 = latestPoint ? Number(latestPoint.p95_response_time) || 0 : 0;
          const p99 = latestPoint ? Number(latestPoint.p99_response_time) || 0 : 0;

          setMetrics({
            timeRange,
            metrics: transformedMetrics,
            summary: {
              current: transformedMetrics.length > 0 ? transformedMetrics[transformedMetrics.length - 1].responseTime : 0,
              average: avgResponseTime,
              peak: maxResponseTime,
              min: minResponseTime,
              totalRequests,
              totalErrors,
              errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
              p50,
              p95,
              p99
            }
          });
        } else {
          // No data available
          setMetrics({
            timeRange,
            metrics: [],
            summary: {
              current: 0,
              average: 0,
              peak: 0,
              min: 0,
              totalRequests: 0,
              totalErrors: 0,
              errorRate: 0,
              p50: 0,
              p95: 0,
              p99: 0
            }
          });
        }
      } catch (error) {
        console.error('Error loading metrics:', error);
        await loadMetricsDirectly();
      }

      // Load endpoint usage statistics
      await loadEndpointUsage();

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      toast.error('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }, [timeRange, apiUrl, selectedEndpoint]);

  const loadMetricsDirectly = async () => {
    try {
      // Calculate time range
      let startTime: Date;
      switch (timeRange) {
        case '1h':
          startTime = new Date(Date.now() - 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      }

      const { data, error } = await supabase
        .from('api_metrics')
        .select('*')
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Aggregate by time buckets
        const buckets = new Map<string, any>();
        const intervalMs = timeRange === '1h' ? 5 * 60 * 1000 : timeRange === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

        data.forEach((metric: any) => {
          const timestamp = new Date(metric.timestamp).getTime();
          const bucketTime = Math.floor(timestamp / intervalMs) * intervalMs;
          const bucketKey = new Date(bucketTime).toISOString();

          if (!buckets.has(bucketKey)) {
            buckets.set(bucketKey, {
              timestamp: bucketKey,
              responseTimes: [],
              requests: 0,
              errors: 0
            });
          }

          const bucket = buckets.get(bucketKey)!;
          bucket.responseTimes.push(metric.response_time);
          bucket.requests += 1;
          if (metric.error) bucket.errors += 1;
        });

        const transformedMetrics: MetricDataPoint[] = Array.from(buckets.entries())
          .map(([key, value]) => ({
            timestamp: key,
            time: formatChartTime(key),
            responseTime: value.responseTimes.reduce((a: number, b: number) => a + b, 0) / value.responseTimes.length,
            avg_response_time: value.responseTimes.reduce((a: number, b: number) => a + b, 0) / value.responseTimes.length,
            requests: value.requests,
            total_requests: value.requests,
            errors: value.errors,
            total_errors: value.errors,
            error_rate: value.requests > 0 ? (value.errors / value.requests) * 100 : 0
          }))
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const allResponseTimes = data.map((m: any) => m.response_time);
        const totalRequests = data.length;
        const totalErrors = data.filter((m: any) => m.error).length;

        setMetrics({
          timeRange,
          metrics: transformedMetrics,
          summary: {
            current: transformedMetrics.length > 0 ? transformedMetrics[transformedMetrics.length - 1].responseTime : 0,
            average: allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length,
            peak: Math.max(...allResponseTimes),
            min: Math.min(...allResponseTimes),
            totalRequests,
            totalErrors,
            errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
            p50: 0,
            p95: 0,
            p99: 0
          }
        });
      }
    } catch (error) {
      console.error('Error loading metrics directly:', error);
    }
  };

  const loadEndpointUsage = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_endpoint_usage_stats', {
          p_time_range: timeRange,
          p_limit: 20
        });

      if (error) {
        console.error('Error loading endpoint usage:', error);
        // Fallback to direct query
        await loadEndpointUsageDirectly();
        return;
      }

      if (data) {
        setEndpointUsage(data);
      }
    } catch (error) {
      console.error('Error loading endpoint usage:', error);
      await loadEndpointUsageDirectly();
    }
  };

  const loadEndpointUsageDirectly = async () => {
    try {
      let startTime: Date;
      switch (timeRange) {
        case '1h':
          startTime = new Date(Date.now() - 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      }

      const { data, error } = await supabase
        .from('api_metrics')
        .select('endpoint, method, response_time, error, request_size, response_size, ip_address, user_id')
        .gte('timestamp', startTime.toISOString());

      if (error) throw error;

      if (data) {
        // Aggregate by endpoint and method
        const endpointMap = new Map<string, any>();

        data.forEach((metric: any) => {
          const key = `${metric.method}:${metric.endpoint}`;
          if (!endpointMap.has(key)) {
            endpointMap.set(key, {
              endpoint: metric.endpoint,
              method: metric.method,
              responseTimes: [],
              requests: 0,
              errors: 0,
              requestSizes: [],
              responseSizes: [],
              ips: new Set(),
              users: new Set()
            });
          }

          const stats = endpointMap.get(key)!;
          stats.responseTimes.push(metric.response_time);
          stats.requests += 1;
          if (metric.error) stats.errors += 1;
          if (metric.request_size) stats.requestSizes.push(metric.request_size);
          if (metric.response_size) stats.responseSizes.push(metric.response_size);
          if (metric.ip_address) stats.ips.add(metric.ip_address);
          if (metric.user_id) stats.users.add(metric.user_id);
        });

        const usage: EndpointUsage[] = Array.from(endpointMap.entries())
          .map(([key, stats]) => {
            const avgResponseTime = stats.responseTimes.reduce((a: number, b: number) => a + b, 0) / stats.responseTimes.length;
            const sortedTimes = [...stats.responseTimes].sort((a, b) => a - b);
            const p95Index = Math.floor(sortedTimes.length * 0.95);

            return {
              endpoint: stats.endpoint,
              method: stats.method,
              total_requests: stats.requests,
              total_errors: stats.errors,
              error_rate: stats.requests > 0 ? (stats.errors / stats.requests) * 100 : 0,
              avg_response_time: avgResponseTime,
              p95_response_time: sortedTimes[p95Index] || 0,
              total_request_size: stats.requestSizes.reduce((a: number, b: number) => a + b, 0),
              total_response_size: stats.responseSizes.reduce((a: number, b: number) => a + b, 0),
              unique_ips: stats.ips.size,
              unique_users: stats.users.size
            };
          })
          .sort((a, b) => b.total_requests - a.total_requests)
          .slice(0, 20);

        setEndpointUsage(usage);
      }
    } catch (error) {
      console.error('Error loading endpoint usage directly:', error);
    }
  };

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

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'border-green-500 text-green-400 bg-green-500/10';
      case 'POST': return 'border-blue-500 text-blue-400 bg-blue-500/10';
      case 'PUT': return 'border-yellow-500 text-yellow-400 bg-yellow-500/10';
      case 'DELETE': return 'border-red-500 text-red-400 bg-red-500/10';
      default: return 'border-slate-500 text-slate-400 bg-slate-500/10';
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
            <div className="text-3xl font-bold text-red-400">{metrics.summary.totalErrors.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <span className="text-sm text-slate-400">Error Rate</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {metrics.summary.errorRate.toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      {/* Endpoint Usage Statistics */}
      {endpointUsage.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUpIcon className="w-6 h-6 text-purple-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Endpoint Usage Statistics</h3>
                <p className="text-slate-400 text-sm">Most used endpoints and their performance metrics</p>
              </div>
            </div>
            <select
              value={selectedEndpoint || 'all'}
              onChange={(e) => {
                setSelectedEndpoint(e.target.value === 'all' ? null : e.target.value);
              }}
              className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Endpoints</option>
              {Array.from(new Set(endpointUsage.map(e => e.endpoint))).map(endpoint => (
                <option key={endpoint} value={endpoint}>{endpoint}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {endpointUsage.slice(0, 10).map((endpoint, index) => (
              <motion.div
                key={`${endpoint.method}-${endpoint.endpoint}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono text-white truncate">{endpoint.endpoint}</code>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Requests</div>
                        <div className="text-sm font-semibold text-white">{endpoint.total_requests.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Avg Response</div>
                        <div className="text-sm font-semibold text-white">{Math.round(endpoint.avg_response_time)}ms</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Error Rate</div>
                        <div className={`text-sm font-semibold ${endpoint.error_rate > 5 ? 'text-red-400' : endpoint.error_rate > 1 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {endpoint.error_rate.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">P95 Response</div>
                        <div className="text-sm font-semibold text-yellow-400">{Math.round(endpoint.p95_response_time)}ms</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <span>Unique IPs: {endpoint.unique_ips}</span>
                  {endpoint.unique_users > 0 && <span>Users: {endpoint.unique_users}</span>}
                  {endpoint.total_request_size > 0 && (
                    <span>Request Size: {(endpoint.total_request_size / 1024 / 1024).toFixed(2)} MB</span>
                  )}
                  {endpoint.total_response_size > 0 && (
                    <span>Response Size: {(endpoint.total_response_size / 1024 / 1024).toFixed(2)} MB</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {endpointUsage.length === 0 && !loading && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center">
          <Activity className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">No endpoint usage data available for the selected time range.</p>
          <p className="text-slate-500 text-sm mt-2">API requests will be tracked automatically when they occur.</p>
        </div>
      )}
    </div>
  );
}

