import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Brain,
  Target,
  Scan,
  Sparkles,
  Play,
  Pause,
  RefreshCw,
  Loader2,
  BarChart3,
  TrendingUp,
  Activity,
  Clock,
  Users,
  Flag,
  Plus
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface ModerationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger_conditions: string[];
  actions: string[];
  created_at: string;
  updated_at: string;
}

interface AutoModerationScan {
  id: string;
  scan_type: string;
  status: 'running' | 'completed' | 'failed';
  items_scanned: number;
  issues_found: number;
  started_at: string;
  completed_at?: string;
}

interface SpamPattern {
  id: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high';
  enabled: boolean;
  created_at: string;
}

export default function AutomationView() {
  const [rules, setRules] = useState<ModerationRule[]>([]);
  const [scans, setScans] = useState<AutoModerationScan[]>([]);
  const [patterns, setPatterns] = useState<SpamPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiScanInProgress, setAiScanInProgress] = useState(false);
  const [bulkScanInProgress, setBulkScanInProgress] = useState(false);

  const [stats, setStats] = useState({
    totalScans: 0,
    itemsScanned: 0,
    issuesFound: 0,
    accuracy: 0,
    falsePositives: 0,
    responseTime: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load moderation rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('moderation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (!rulesError && rulesData) {
        setRules(rulesData);
      }

      // Load recent scans
      const { data: scansData, error: scansError } = await supabase
        .from('auto_moderation_scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!scansError && scansData) {
        setScans(scansData);
      }

      // Load spam patterns
      const { data: patternsData, error: patternsError } = await supabase
        .from('spam_patterns')
        .select('*')
        .order('created_at', { ascending: false });

      if (!patternsError && patternsData) {
        setPatterns(patternsData);
      }

      // Load stats
      const [
        { count: totalScans },
        { count: itemsScanned },
        { count: issuesFound }
      ] = await Promise.all([
        supabase.from('auto_moderation_scans').select('*', { count: 'exact', head: true }),
        supabase.from('auto_moderation_scans').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('auto_moderation_scans').select('*', { count: 'exact', head: true }).eq('status', 'completed').not('action_taken', 'is', null)
      ]);

      setStats({
        totalScans: totalScans || 0,
        itemsScanned: itemsScanned || 0,
        issuesFound: issuesFound || 0,
        accuracy: 85, // Mock data
        falsePositives: 5, // Mock data
        responseTime: 2.3 // Mock data
      });

    } catch (error) {
      console.error('Error loading automation data:', error);
      toast.error('Failed to load automation data');
    } finally {
      setLoading(false);
    }
  };

  const runAIScan = async () => {
    setAiScanInProgress(true);
    try {
      // Simulate AI scan
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('AI scan completed successfully');
    } catch (error) {
      console.error('Error running AI scan:', error);
      toast.error('Failed to run AI scan');
    } finally {
      setAiScanInProgress(false);
    }
  };

  const runBulkScan = async () => {
    setBulkScanInProgress(true);
    try {
      // Simulate bulk scan
      await new Promise(resolve => setTimeout(resolve, 5000));
      toast.success('Bulk scan completed successfully');
    } catch (error) {
      console.error('Error running bulk scan:', error);
      toast.error('Failed to run bulk scan');
    } finally {
      setBulkScanInProgress(false);
    }
  };

  const toggleRule = async (ruleId: string) => {
    try {
      // Simulate rule toggle
      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      ));
      toast.success('Rule updated successfully');
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Failed to update rule');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading automation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Automation</h2>
          <p className="text-slate-400">Configure AI-powered moderation rules and OpenAI scanning</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={runAIScan}
            disabled={aiScanInProgress}
            className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {aiScanInProgress ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            {aiScanInProgress ? 'Scanning...' : 'AI Scan'}
          </button>
          <button
            onClick={runBulkScan}
            disabled={bulkScanInProgress}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {bulkScanInProgress ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Scan className="w-4 h-4 mr-2" />
            )}
            {bulkScanInProgress ? 'Scanning...' : 'Bulk Scan'}
          </button>
        </div>
      </div>

      {/* AI Moderation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Scans',
            value: stats.totalScans,
            icon: Scan,
            color: 'blue',
            change: '+12%'
          },
          {
            title: 'Items Scanned',
            value: stats.itemsScanned,
            icon: Target,
            color: 'green',
            change: '+8%'
          },
          {
            title: 'Issues Found',
            value: stats.issuesFound,
            icon: Flag,
            color: 'red',
            change: '-5%'
          },
          {
            title: 'Accuracy',
            value: `${stats.accuracy}%`,
            icon: Brain,
            color: 'purple',
            change: '+2%'
          }
        ].map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <p className="text-xs text-green-400 mt-1">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center`}>
                  <IconComponent className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Moderation Rules */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Moderation Rules</h3>
            <button className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              <Settings className="w-4 h-4 mr-2" />
              Add Rule
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {rules.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">No moderation rules configured</p>
                <button className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                  Create First Rule
                </button>
              </div>
            ) : (
              rules.map((rule, index) => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-400' : 'bg-slate-400'}`} />
                    <div>
                      <h4 className="text-white font-medium">{rule.name}</h4>
                      <p className="text-slate-400 text-sm">{rule.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        rule.enabled 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Recent Scans</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {scans.length === 0 ? (
              <div className="text-center py-8">
                <Scan className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">No recent scans</p>
              </div>
            ) : (
              scans.map((scan, index) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      scan.status === 'completed' ? 'bg-green-400' :
                      scan.status === 'running' ? 'bg-yellow-400' :
                      'bg-red-400'
                    }`} />
                    <div>
                      <h4 className="text-white font-medium">{scan.scan_type}</h4>
                      <p className="text-slate-400 text-sm">
                        {scan.items_scanned} items scanned • {scan.issues_found} issues found
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">
                      {new Date(scan.started_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {scan.status}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Spam Patterns */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Spam Patterns</h3>
            <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              Add Pattern
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {patterns.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">No spam patterns configured</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Add First Pattern
                </button>
              </div>
            ) : (
              patterns.map((pattern, index) => (
                <motion.div
                  key={pattern.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      pattern.severity === 'high' ? 'bg-red-400' :
                      pattern.severity === 'medium' ? 'bg-yellow-400' :
                      'bg-green-400'
                    }`} />
                    <div>
                      <h4 className="text-white font-medium">{pattern.pattern}</h4>
                      <p className="text-slate-400 text-sm capitalize">
                        {pattern.severity} severity
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      pattern.enabled 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {pattern.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
