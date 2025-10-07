import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Monitor,
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart,
  LineChart,
  Gauge,
  Thermometer,
  Zap,
  Clock,
  Users,
  Shield
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

interface PerformanceMetric {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
  timestamp: string;
}

export default function MonitoringView() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Simulate loading system metrics
      const mockMetrics: SystemMetric[] = [
        {
          id: '1',
          name: 'CPU Usage',
          value: 45,
          unit: '%',
          status: 'healthy',
          trend: 'stable',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Memory Usage',
          value: 72,
          unit: '%',
          status: 'warning',
          trend: 'up',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Disk Usage',
          value: 85,
          unit: '%',
          status: 'warning',
          trend: 'up',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Database Connections',
          value: 23,
          unit: 'connections',
          status: 'healthy',
          trend: 'stable',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Response Time',
          value: 120,
          unit: 'ms',
          status: 'healthy',
          trend: 'down',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '6',
          name: 'Error Rate',
          value: 0.2,
          unit: '%',
          status: 'healthy',
          trend: 'down',
          lastUpdated: new Date().toISOString()
        }
      ];

      const mockPerformance: PerformanceMetric[] = [
        {
          id: '1',
          metric: 'API Response Time',
          value: 120,
          threshold: 200,
          status: 'good',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          metric: 'Database Query Time',
          value: 45,
          threshold: 100,
          status: 'good',
          timestamp: new Date().toISOString()
        },
        {
          id: '3',
          metric: 'Memory Usage',
          value: 72,
          threshold: 80,
          status: 'warning',
          timestamp: new Date().toISOString()
        },
        {
          id: '4',
          metric: 'CPU Usage',
          value: 45,
          threshold: 70,
          status: 'good',
          timestamp: new Date().toISOString()
        }
      ];

      setMetrics(mockMetrics);
      setPerformance(mockPerformance);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast.error('Failed to load system metrics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return 'text-green-400 bg-green-500/20';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'critical':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">System Monitoring</h2>
          <p className="text-slate-400">Monitor system performance and health</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <button
            onClick={loadMetrics}
            className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(metric.status)}
                <h3 className="text-lg font-semibold text-white">{metric.name}</h3>
              </div>
              {getTrendIcon(metric.trend)}
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-white">
                  {metric.value}{metric.unit}
                </div>
                <div className={`text-sm px-2 py-1 rounded-full inline-block ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    metric.status === 'healthy' ? 'bg-green-400' :
                    metric.status === 'warning' ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(metric.value, 100)}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {performance.map((metric, index) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-700/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium">{metric.metric}</h4>
                  {getStatusIcon(metric.status)}
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-white">
                    {metric.value}
                  </span>
                  <span className="text-sm text-slate-400">
                    Threshold: {metric.threshold}
                  </span>
                </div>
                
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      metric.status === 'good' ? 'bg-green-400' :
                      metric.status === 'warning' ? 'bg-yellow-400' :
                      'bg-red-400'
                    }`}
                    style={{ 
                      width: `${Math.min((metric.value / metric.threshold) * 100, 100)}%` 
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Status */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Database</h3>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Connection Pool</span>
              <span className="text-white">23/50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Query Time</span>
              <span className="text-white">45ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Queries</span>
              <span className="text-white">12</span>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Server className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">API Server</h3>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Uptime</span>
              <span className="text-white">99.9%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Response Time</span>
              <span className="text-white">120ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Requests/min</span>
              <span className="text-white">1,234</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              {
                id: '1',
                type: 'warning',
                message: 'Memory usage is above 70%',
                timestamp: '2 minutes ago',
                icon: AlertTriangle
              },
              {
                id: '2',
                type: 'info',
                message: 'Database backup completed successfully',
                timestamp: '1 hour ago',
                icon: CheckCircle
              },
              {
                id: '3',
                type: 'success',
                message: 'System performance optimization applied',
                timestamp: '3 hours ago',
                icon: Zap
              }
            ].map((alert, index) => {
              const IconComponent = alert.icon;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-4 p-4 bg-slate-700/50 rounded-lg"
                >
                  <IconComponent className={`w-5 h-5 ${
                    alert.type === 'warning' ? 'text-yellow-400' :
                    alert.type === 'info' ? 'text-blue-400' :
                    'text-green-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-white">{alert.message}</p>
                    <p className="text-sm text-slate-400">{alert.timestamp}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
