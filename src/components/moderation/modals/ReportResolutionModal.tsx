import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, FileText, Clock, Trash2, AlertTriangle, Ban, Eye, Loader2, Shield, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { ResolutionAction } from '../../../lib/moderationUtils';

interface ReportResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: {
    id: string;
    reported_user_id?: string;
    content_id?: string;
    content_type?: string;
    reported_user?: {
      username: string;
      display_name: string;
      user_id: string;
    };
  };
  onResolve: (action: ResolutionAction) => Promise<void>;
}


export default function ReportResolutionModal({
  isOpen,
  onClose,
  report,
  onResolve
}: ReportResolutionModalProps) {
  const [selectedType, setSelectedType] = useState<'account' | 'content' | 'warning'>('warning');
  const [accountAction, setAccountAction] = useState<string>('');
  const [suspensionDuration, setSuspensionDuration] = useState<number>(24); // Default 24 hours
  const [contentAction, setContentAction] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isAccountReport = !!report.reported_user_id && !report.content_id;
  const isContentReport = !!report.content_id;

  // Ensure modal is mounted to DOM
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for this action');
      return;
    }

    if (selectedType === 'warning' && !warningMessage.trim()) {
      toast.error('Please provide a warning message');
      return;
    }

    if (selectedType === 'account' && !accountAction) {
      toast.error('Please select an account action');
      return;
    }

    if (selectedType === 'content' && !contentAction) {
      toast.error('Please select a content action');
      return;
    }

    if (selectedType === 'account' && accountAction === 'suspend' && !suspensionDuration) {
      toast.error('Please specify suspension duration');
      return;
    }

    setProcessing(true);
    try {
      const action: ResolutionAction = {
        type: selectedType,
        action: selectedType === 'account' ? accountAction : selectedType === 'content' ? contentAction : 'warn',
        duration: selectedType === 'account' && accountAction === 'suspend' ? suspensionDuration : undefined,
        message: selectedType === 'warning' ? warningMessage : undefined,
        reason
      };

      await onResolve(action);
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error resolving report:', error);
      toast.error(error?.message || 'Failed to resolve report');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedType('warning');
    setAccountAction('');
    setSuspensionDuration(24);
    setContentAction('');
    setWarningMessage('');
    setReason('');
  };

  const handleClose = () => {
    if (!processing) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          // Close modal when clicking backdrop
          if (e.target === e.currentTarget && !processing) {
            handleClose();
          }
        }}
        onKeyDown={(e) => {
          // Close modal on Escape key
          if (e.key === 'Escape' && !processing) {
            handleClose();
          }
        }}
        style={{ pointerEvents: 'auto' }}
        tabIndex={-1}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-[10000]"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Resolve Report</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={processing}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Report Type Info */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-sm text-slate-300">
                {isAccountReport && (
                  <>Reporting account: <span className="font-semibold text-white">{report.reported_user?.username || 'Unknown'}</span></>
                )}
                {isContentReport && (
                  <>Reporting content: <span className="font-semibold text-white">{report.content_type || 'Unknown type'}</span></>
                )}
                {!isAccountReport && !isContentReport && (
                  <>Report type: <span className="font-semibold text-white">General</span></>
                )}
              </p>
            </div>

            {/* Action Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Select Resolution Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedType('warning')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedType === 'warning'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <AlertTriangle className={`w-6 h-6 mx-auto mb-2 ${selectedType === 'warning' ? 'text-purple-400' : 'text-slate-400'}`} />
                  <p className={`text-sm font-medium ${selectedType === 'warning' ? 'text-white' : 'text-slate-400'}`}>
                    Warning
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Send notification</p>
                </button>

                {isAccountReport && (
                  <button
                    onClick={() => setSelectedType('account')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedType === 'account'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    <User className={`w-6 h-6 mx-auto mb-2 ${selectedType === 'account' ? 'text-purple-400' : 'text-slate-400'}`} />
                    <p className={`text-sm font-medium ${selectedType === 'account' ? 'text-white' : 'text-slate-400'}`}>
                      Account Action
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Suspend/Delete</p>
                  </button>
                )}

                {isContentReport && (
                  <button
                    onClick={() => setSelectedType('content')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedType === 'content'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    <FileText className={`w-6 h-6 mx-auto mb-2 ${selectedType === 'content' ? 'text-purple-400' : 'text-slate-400'}`} />
                    <p className={`text-sm font-medium ${selectedType === 'content' ? 'text-white' : 'text-slate-400'}`}>
                      Content Action
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Delete content</p>
                  </button>
                )}
              </div>
            </div>

            {/* Warning Section */}
            {selectedType === 'warning' && (
              <div className="space-y-4 bg-slate-700/30 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-300">
                  Warning Message
                </label>
                <textarea
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  placeholder="Enter a custom warning message that will be sent to the user..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={4}
                />
                <p className="text-xs text-slate-400">
                  This message will be sent as a notification to the user.
                </p>
              </div>
            )}

            {/* Account Action Section */}
            {selectedType === 'account' && isAccountReport && (
              <div className="space-y-4 bg-slate-700/30 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-300">
                  Account Action
                </label>
                <div className="space-y-3">
                  <button
                    onClick={() => setAccountAction('suspend')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      accountAction === 'suspend'
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Clock className={`w-5 h-5 ${accountAction === 'suspend' ? 'text-orange-400' : 'text-slate-400'}`} />
                      <div className="flex-1">
                        <p className={`font-medium ${accountAction === 'suspend' ? 'text-white' : 'text-slate-300'}`}>
                          Temporary Suspension
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Suspend the account for a specified duration
                        </p>
                      </div>
                    </div>
                  </button>

                  {accountAction === 'suspend' && (
                    <div className="ml-8 space-y-2">
                      <label className="block text-xs text-slate-400">
                        Suspension Duration (hours)
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          min="1"
                          max="8760"
                          value={suspensionDuration}
                          onChange={(e) => setSuspensionDuration(parseInt(e.target.value) || 24)}
                          className="w-24 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-400">
                          ({suspensionDuration < 24 ? `${suspensionDuration} hour${suspensionDuration !== 1 ? 's' : ''}` : `${Math.floor(suspensionDuration / 24)} day${Math.floor(suspensionDuration / 24) !== 1 ? 's' : ''}`})
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setAccountAction('readonly')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      accountAction === 'readonly'
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Eye className={`w-5 h-5 ${accountAction === 'readonly' ? 'text-yellow-400' : 'text-slate-400'}`} />
                      <div className="flex-1">
                        <p className={`font-medium ${accountAction === 'readonly' ? 'text-white' : 'text-slate-300'}`}>
                          Read-Only Mode
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          User can only read content, cannot interact or upload
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setAccountAction('delete')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      accountAction === 'delete'
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Trash2 className={`w-5 h-5 ${accountAction === 'delete' ? 'text-red-400' : 'text-slate-400'}`} />
                      <div className="flex-1">
                        <p className={`font-medium ${accountAction === 'delete' ? 'text-white' : 'text-slate-300'}`}>
                          Delete Account
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Permanently delete the user account (email will be sent)
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Content Action Section */}
            {selectedType === 'content' && isContentReport && (
              <div className="space-y-4 bg-slate-700/30 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-300">
                  Content Action
                </label>
                <button
                  onClick={() => setContentAction('delete')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    contentAction === 'delete'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Trash2 className={`w-5 h-5 ${contentAction === 'delete' ? 'text-red-400' : 'text-slate-400'}`} />
                    <div className="flex-1">
                      <p className={`font-medium ${contentAction === 'delete' ? 'text-white' : 'text-slate-300'}`}>
                        Delete Content
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Permanently delete the reported content ({report.content_type || 'content'})
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Reason Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Reason for Action <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a reason for this action (required)..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3}
                required
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-700">
            <button
              onClick={handleClose}
              disabled={processing}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={processing}
              className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Resolve Report</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  // Render modal in a portal at document body level to ensure it's always on top
  return createPortal(modalContent, document.body);
}

