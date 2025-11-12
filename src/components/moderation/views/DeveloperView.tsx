import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { Code, Server, Activity, Globe, Database, Zap, Clock, AlertCircle, CheckCircle, XCircle, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface ApiEndpoint {
  path: string
  method: string
  description: string
  category: string
}

interface ApiMetrics {
  endpoint: string
  method: string
  avgResponseTime: number
  totalRequests: number
  totalErrors: number
  errorRate: number
  p95ResponseTime: number
  p99ResponseTime: number
}

interface ApiStatus {
  status: 'operational' | 'degraded' | 'down'
  uptime: number
  version: string
  lastCheck: Date
}

export default function DeveloperView() {
  const [apiUrl, setApiUrl] = useState<string>(import.meta.env.VITE_API_URL || 'https://dev.profilesafterdark.com/api/v1')
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [apiMetrics, setApiMetrics] = useState<ApiMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null)

  const endpoints: ApiEndpoint[] = [
    { path: '/api/v1/profiles', method: 'GET', description: 'Get all profiles', category: 'Profiles' },
    { path: '/api/v1/profiles/:id', method: 'GET', description: 'Get profile by ID', category: 'Profiles' },
    { path: '/api/v1/emotes', method: 'GET', description: 'Get all emotes', category: 'Emotes' },
    { path: '/api/v1/emotes/:id', method: 'GET', description: 'Get emote by ID', category: 'Emotes' },
    { path: '/api/v1/wallpapers', method: 'GET', description: 'Get all wallpapers', category: 'Wallpapers' },
    { path: '/api/v1/wallpapers/:id', method: 'GET', description: 'Get wallpaper by ID', category: 'Wallpapers' },
    { path: '/api/v1/discord/users/:discordId', method: 'GET', description: 'Get Discord user', category: 'Discord' },
    { path: '/api/v1/discord/users', method: 'POST', description: 'Create/Update Discord user', category: 'Discord' },
    { path: '/api/v1/moderation/cases/:guildId', method: 'GET', description: 'Get moderation cases', category: 'Moderation' },
    { path: '/api/v1/moderation/cases', method: 'POST', description: 'Create moderation case', category: 'Moderation' },
    { path: '/api/v1/moderation/logs/:guildId', method: 'GET', description: 'Get moderation logs', category: 'Moderation' },
    { path: '/api/v1/stats', method: 'GET', description: 'Get website statistics', category: 'Statistics' },
    { path: '/api/v1/search', method: 'GET', description: 'Search content', category: 'Search' },
    { path: '/api/v1/monitoring/health', method: 'GET', description: 'Health check', category: 'Monitoring' },
    { path: '/api/v1/monitoring/metrics', method: 'GET', description: 'Get API metrics', category: 'Monitoring' },
    { path: '/health', method: 'GET', description: 'Basic health check', category: 'Monitoring' },
  ]

  useEffect(() => {
    loadApiStatus()
    loadApiMetrics()
  }, [apiUrl, timeRange])

  const loadApiStatus = async () => {
    try {
      const startTime = Date.now()
      const response = await fetch(`${apiUrl.replace('/api/v1', '')}/health`)
      const responseTime = Date.now() - startTime

      if (response.ok) {
        const data = await response.json()
        setApiStatus({
          status: responseTime < 1000 ? 'operational' : 'degraded',
          uptime: data.uptime || 0,
          version: data.version || '1.0.0',
          lastCheck: new Date()
        })
      } else {
        setApiStatus({
          status: 'down',
          uptime: 0,
          version: 'Unknown',
          lastCheck: new Date()
        })
      }
    } catch (error) {
      setApiStatus({
        status: 'down',
        uptime: 0,
        version: 'Unknown',
        lastCheck: new Date()
      })
    }
  }

  const loadApiMetrics = async () => {
    setLoading(true)
    try {
      // Calculate time range
      const timeRanges: Record<string, number> = {
        '1h': 3600000,
        '24h': 86400000,
        '7d': 604800000,
        '30d': 2592000000
      }

      const startTime = new Date(Date.now() - timeRanges[timeRange]).toISOString()

      // Try RPC function first
      try {
        const { data, error } = await supabase
          .rpc('get_api_metrics_summary', {
            p_time_range: timeRange,
            p_endpoint: selectedEndpoint || null
          })

        if (!error && data) {
          // Transform function results if available
          const aggregated = new Map<string, ApiMetrics>()
          // Note: The function returns aggregated data, but we'd need to map it properly
          // For now, fall through to direct query
        }
      } catch (rpcError) {
        // RPC function might not exist, continue with direct query
        console.log('RPC function not available, using direct query')
      }

      // Direct query approach
      const { data: metricsData, error: metricsError } = await supabase
        .from('api_metrics')
        .select('endpoint, method, response_time, error')
        .gte('timestamp', startTime)
        .order('timestamp', { ascending: false })
        .limit(10000)

      if (metricsError) {
        // Table might not exist or no access
        console.warn('Could not load API metrics:', metricsError)
        setApiMetrics([])
        return
      }

      // Aggregate metrics
      const aggregated = new Map<string, ApiMetrics>()

      metricsData?.forEach((metric) => {
        const key = `${metric.method} ${metric.endpoint}`
        if (!aggregated.has(key)) {
          aggregated.set(key, {
            endpoint: metric.endpoint,
            method: metric.method,
            avgResponseTime: 0,
            totalRequests: 0,
            totalErrors: 0,
            errorRate: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0
          })
        }

        const agg = aggregated.get(key)!
        agg.totalRequests++
        if (metric.error) agg.totalErrors++
      })

      // Calculate averages and percentiles
      aggregated.forEach((agg, key) => {
        const endpointMetrics = metricsData?.filter(m => `${m.method} ${m.endpoint}` === key) || []
        const responseTimes = endpointMetrics.map(m => m.response_time).sort((a, b) => a - b)
        
        if (responseTimes.length > 0) {
          agg.avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          agg.errorRate = (agg.totalErrors / agg.totalRequests) * 100
          agg.p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0
          agg.p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0
        }
      })

      setApiMetrics(Array.from(aggregated.values()))
    } catch (error) {
      console.error('Error loading API metrics:', error)
      // Don't show error toast if table doesn't exist - it's optional
      setApiMetrics([])
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'degraded':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'down':
        return 'text-red-400 bg-red-500/10 border-red-500/30'
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30'
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'POST':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'PUT':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'DELETE':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const categories = Array.from(new Set(endpoints.map(e => e.category)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Code className="w-6 h-6 text-purple-400" />
            </div>
            Developer Tools
          </h2>
          <p className="text-slate-400 mt-1">API endpoints, metrics, and developer resources</p>
        </div>
        <button
          onClick={() => {
            loadApiStatus()
            loadApiMetrics()
          }}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* API Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-400" />
              API Status
            </h3>
            {apiStatus && (
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(apiStatus.status)}`}>
                {apiStatus.status.toUpperCase()}
              </span>
            )}
          </div>
          {apiStatus ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Version</p>
                <p className="text-sm font-semibold text-white">{apiStatus.version}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Uptime</p>
                <p className="text-sm font-semibold text-white">
                  {Math.floor(apiStatus.uptime / 3600)}h {Math.floor((apiStatus.uptime % 3600) / 60)}m
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Base URL</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-white truncate flex-1">{apiUrl}</p>
                  <button
                    onClick={() => copyToClipboard(apiUrl)}
                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-purple-400" />
            API Metrics
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Endpoints</p>
              <p className="text-2xl font-bold text-white">{endpoints.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Tracked Metrics</p>
              <p className="text-2xl font-bold text-white">{apiMetrics.length}</p>
            </div>
            <div className="pt-3 border-t border-slate-700/50">
              <label className="text-xs text-slate-500 mb-2 block">Time Range</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-purple-400" />
            Quick Links
          </h3>
          <div className="space-y-2">
            <a
              href={`${apiUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors group"
            >
              <Globe className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
              <span className="text-sm text-white">API Documentation</span>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-400 ml-auto" />
            </a>
            <a
              href={`${apiUrl}/monitoring/health`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors group"
            >
              <Zap className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
              <span className="text-sm text-white">Health Check</span>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-400 ml-auto" />
            </a>
            <a
              href={`${apiUrl}/monitoring/metrics`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors group"
            >
              <Activity className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
              <span className="text-sm text-white">Metrics Endpoint</span>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-400 ml-auto" />
            </a>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
          <Globe className="w-6 h-6 text-purple-400" />
          API Endpoints
        </h3>
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{category}</h4>
              <div className="space-y-2">
                {endpoints
                  .filter(e => e.category === category)
                  .map((endpoint, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/30 hover:border-slate-700/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${getMethodColor(endpoint.method)}`}>
                            {endpoint.method}
                          </span>
                          <code className="text-sm font-mono text-white truncate">{endpoint.path}</code>
                        </div>
                        <p className="text-xs text-slate-400">{endpoint.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const url = endpoint.path.includes(':') 
                              ? `${apiUrl}${endpoint.path.replace(/:[^/]+/g, 'example')}`
                              : `${apiUrl}${endpoint.path}`
                            copyToClipboard(url)
                          }}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Copy URL"
                        >
                          <Copy className="w-4 h-4 text-slate-400" />
                        </button>
                        {!endpoint.path.includes(':') && (
                          <a
                            href={`${apiUrl}${endpoint.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                          </a>
                        )}
                        {endpoint.path.includes(':') && (
                          <span className="text-xs text-slate-500 opacity-0 group-hover:opacity-100" title="This endpoint requires parameters">
                            Requires params
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Metrics Table */}
      {apiMetrics.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <Activity className="w-6 h-6 text-purple-400" />
            Performance Metrics
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Endpoint</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Method</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Requests</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Avg Response</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">P95</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">P99</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Errors</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Error Rate</th>
                </tr>
              </thead>
              <tbody>
                {apiMetrics.map((metric, idx) => (
                  <tr key={idx} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-4">
                      <code className="text-sm font-mono text-white">{metric.endpoint}</code>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${getMethodColor(metric.method)}`}>
                        {metric.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-white">{metric.totalRequests.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-sm text-white">{metric.avgResponseTime}ms</td>
                    <td className="py-3 px-4 text-right text-sm text-white">{metric.p95ResponseTime}ms</td>
                    <td className="py-3 px-4 text-right text-sm text-white">{metric.p99ResponseTime}ms</td>
                    <td className="py-3 px-4 text-right text-sm text-red-400">{metric.totalErrors}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-semibold ${metric.errorRate > 5 ? 'text-red-400' : metric.errorRate > 1 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {metric.errorRate.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* About API Metrics Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-purple-400" />
          About API Metrics
        </h3>
        <div className="prose prose-invert max-w-none">
          <p className="text-sm text-slate-300 mb-4">
            The <code className="text-purple-400 bg-slate-900/50 px-1.5 py-0.5 rounded">api_metrics</code> table stores 
            detailed metrics for all API requests, including:
          </p>
          <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
            <li>Response times and performance data</li>
            <li>Request and response sizes</li>
            <li>Error rates and status codes</li>
            <li>Endpoint usage statistics</li>
            <li>User agent and IP address tracking</li>
          </ul>
          <p className="text-sm text-slate-300 mt-4">
            This data is automatically collected by the API middleware and can be used for monitoring, 
            performance optimization, and debugging.
          </p>
        </div>
      </div>
    </div>
  )
}

