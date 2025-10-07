import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  User,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Loader2,
  Ban,
  UserCheck,
  UserX,
  Shield,
  Bot,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface Appeal {
  id: string;
  appeal_reason: string;
  banType: 'discord' | 'website' | '';
  discordTag?: string;
  email?: string;
  username?: string;
  explanation: string;
  status: 'pending' | 'approved' | 'denied';
  appeal_date: string;
  reviewed_by?: string;
  resolved_at?: string;
  mod_cases?: {
    id: string;
    banType: string;
    status: string;
  } | null;
  reviewer_name?: string;
}

export default function AppealsView() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [filterBanType, setFilterBanType] = useState<'all' | 'discord' | 'website'>('all');
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [processingAppeal, setProcessingAppeal] = useState<string | null>(null);

  useEffect(() => {
    loadAppeals();
  }, []);

  const loadAppeals = async () => {
    setLoading(true);
    try {
      // For now, return empty array since appeals table doesn't exist
      // This can be implemented when the database schema is ready
      setAppeals([]);
    } catch (error) {
      console.error('Error loading appeals:', error);
      toast.error('Failed to load appeals');
    } finally {
      setLoading(false);
    }
  };

  const handleAppealAction = async (appealId: string, action: 'approve' | 'deny', reason?: string) => {
    setProcessingAppeal(appealId);
    try {
      // Simulate appeal processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAppeals(prev => prev.map(appeal => 
        appeal.id === appealId 
          ? { 
              ...appeal, 
              status: action === 'approve' ? 'approved' : 'denied',
              reviewed_by: 'current_moderator',
              resolved_at: new Date().toISOString()
            }
          : appeal
      ));
      
      toast.success(`Appeal ${action === 'approve' ? 'approved' : 'denied'} successfully`);
    } catch (error) {
      console.error('Error processing appeal:', error);
      toast.error('Failed to process appeal');
    } finally {
      setProcessingAppeal(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'denied':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'approved':
        return 'text-green-400 bg-green-500/20';
      case 'denied':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getBanTypeIcon = (banType: string) => {
    switch (banType) {
      case 'discord':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'website':
        return <Shield className="w-4 h-4 text-purple-400" />;
      default:
        return <Ban className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredAppeals = appeals.filter(appeal => {
    const matchesSearch = !searchQuery || 
      appeal.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appeal.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appeal.discordTag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appeal.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || appeal.status === filterStatus;
    const matchesBanType = filterBanType === 'all' || appeal.banType === filterBanType;
    
    return matchesSearch && matchesStatus && matchesBanType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading appeals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Appeals Management</h2>
          <p className="text-slate-400">Review and process user appeals</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadAppeals}
            className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search appeals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
        </select>
        <select
          value={filterBanType}
          onChange={(e) => setFilterBanType(e.target.value as any)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Ban Types</option>
          <option value="discord">Discord</option>
          <option value="website">Website</option>
        </select>
      </div>

      {/* Appeals List */}
      <div className="space-y-4">
        {filteredAppeals.map((appeal, index) => (
          <motion.div
            key={appeal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800 rounded-xl border border-slate-700 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {appeal.username || appeal.discordTag || 'Unknown User'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(appeal.status)}
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appeal.status)}`}>
                        {appeal.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getBanTypeIcon(appeal.banType)}
                      <span className="text-sm text-slate-400 capitalize">
                        {appeal.banType || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Appeal Reason</p>
                      <p className="text-white">{appeal.appeal_reason}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Explanation</p>
                      <p className="text-white">{appeal.explanation}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Appealed: {new Date(appeal.appeal_date).toLocaleDateString()}</span>
                    </div>
                    {appeal.reviewed_by && (
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>Reviewed by: {appeal.reviewer_name || appeal.reviewed_by}</span>
                      </div>
                    )}
                    {appeal.resolved_at && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Resolved: {new Date(appeal.resolved_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {appeal.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAppealAction(appeal.id, 'approve')}
                      disabled={processingAppeal === appeal.id}
                      className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                      {processingAppeal === appeal.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleAppealAction(appeal.id, 'deny')}
                      disabled={processingAppeal === appeal.id}
                      className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                      {processingAppeal === appeal.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Deny
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedAppeal(appeal)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredAppeals.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">No appeals found</p>
        </div>
      )}

      {/* Appeal Detail Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Appeal Details</h3>
              <button
                onClick={() => setSelectedAppeal(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">User Information</h4>
                  <div className="space-y-2">
                    <p className="text-white">
                      <strong>Username:</strong> {selectedAppeal.username || 'N/A'}
                    </p>
                    <p className="text-white">
                      <strong>Discord Tag:</strong> {selectedAppeal.discordTag || 'N/A'}
                    </p>
                    <p className="text-white">
                      <strong>Email:</strong> {selectedAppeal.email || 'N/A'}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Appeal Information</h4>
                  <div className="space-y-2">
                    <p className="text-white">
                      <strong>Ban Type:</strong> {selectedAppeal.banType || 'N/A'}
                    </p>
                    <p className="text-white">
                      <strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedAppeal.status)}`}>
                        {selectedAppeal.status}
                      </span>
                    </p>
                    <p className="text-white">
                      <strong>Appeal Date:</strong> {new Date(selectedAppeal.appeal_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Appeal Reason</h4>
                <p className="text-white bg-slate-700/50 rounded-lg p-3">
                  {selectedAppeal.appeal_reason}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Explanation</h4>
                <p className="text-white bg-slate-700/50 rounded-lg p-3">
                  {selectedAppeal.explanation}
                </p>
              </div>

              {selectedAppeal.status === 'pending' && (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      handleAppealAction(selectedAppeal.id, 'approve');
                      setSelectedAppeal(null);
                    }}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Appeal
                  </button>
                  <button
                    onClick={() => {
                      handleAppealAction(selectedAppeal.id, 'deny');
                      setSelectedAppeal(null);
                    }}
                    className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Deny Appeal
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
