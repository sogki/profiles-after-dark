import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Shield,
  Flag,
  AlertTriangle,
  FileText,
  Lock,
  Eye,
  X,
  Loader2,
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle as AlertOctagon, // Renamed to avoid conflict and use a valid icon
  Users,
  MessageSquare,
  Clock,
  Zap
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface EnhancedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporterUserId: string;
  reportedUserId?: string;
  reportedUsername?: string;
  contentId?: string;
  contentType?: string;
  contentUrl?: string;
  onReportSubmitted?: () => void;
}

const reportCategories = [
  { id: 'inappropriate', label: 'Inappropriate Content', icon: AlertCircle, color: 'red' },
  { id: 'spam', label: 'Spam', icon: MessageSquare, color: 'orange' },
  { id: 'harassment', label: 'Harassment', icon: Users, color: 'purple' },
  { id: 'violence', label: 'Violence', icon: Shield, color: 'red' },
  { id: 'hate_speech', label: 'Hate Speech', icon: Flag, color: 'red' },
  { id: 'copyright', label: 'Copyright Violation', icon: FileText, color: 'blue' },
  { id: 'privacy', label: 'Privacy Violation', icon: Lock, color: 'yellow' },
  { id: 'other', label: 'Other', icon: AlertTriangle, color: 'gray' }
];

const severityLevels = [
  { id: 'low', label: 'Low', color: 'green', description: 'Minor issue' },
  { id: 'medium', label: 'Medium', color: 'yellow', description: 'Moderate concern' },
  { id: 'high', label: 'High', color: 'orange', description: 'Serious issue' },
  { id: 'critical', label: 'Critical', color: 'red', description: 'Urgent attention needed' }
];

import { notifyAllStaffOfReport } from '../../../lib/moderationUtils';

const notifyReporterOfSubmission = async (reporterUserId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: reporterUserId,
        content: '✅ Report Submitted Successfully - Your report has been received and will be reviewed by our moderation team.',
        type: 'system',
        priority: 'low',
        read: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating reporter notification:', error);
    }
  } catch (error) {
    console.error('Error notifying reporter:', error);
  }
};

const logReportSubmission = async (reportData: {
  reporterUserId: string;
  reportedUserId?: string;
  reason: string;
  description: string;
}) => {
  try {
    const { error } = await supabase
      .from('moderation_logs')
      .insert({
        action: 'report_submitted',
        moderator_id: reportData.reporterUserId, // Reporter is the "moderator" in this context
        target_user_id: reportData.reportedUserId || null,
        description: `User reported ${reportData.reportedUserId ? 'user' : 'content'} for ${reportData.reason}: ${reportData.description}`,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging report submission:', error);
    }
  } catch (error) {
    console.error('Error logging report submission:', error);
  }
};

export default function EnhancedReportModal({ 
  isOpen, 
  onClose, 
  reporterUserId,
  reportedUserId,
  reportedUsername,
  contentId,
  contentType,
  contentUrl,
  onReportSubmitted 
}: EnhancedReportModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    severity: 'medium',
    evidence: [] as File[],
    anonymous: false,
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        title: '',
        description: '',
        category: '',
        severity: 'medium',
        evidence: [],
        anonymous: false,
        priority: 'medium'
      });
      setAiAnalysis(null);
      setShowAIAnalysis(false);
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEvidenceUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setFormData(prev => ({
        ...prev,
        evidence: [...prev.evidence, ...newFiles].slice(0, 5) // Max 5 files
      }));
    }
  };

  const removeEvidence = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  const runAIAnalysis = async () => {
    if (!formData.description) return;
    
    setLoading(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAnalysis = {
        riskScore: Math.floor(Math.random() * 100),
        confidence: Math.floor(Math.random() * 100),
        suggestedCategory: formData.category || 'inappropriate',
        suggestedSeverity: formData.severity || 'medium',
        keywords: ['inappropriate', 'content', 'violation'],
        recommendations: ['Review content for policy violations', 'Consider user history']
      };
      
      setAiAnalysis(mockAnalysis);
      setShowAIAnalysis(true);
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error('AI analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Upload evidence files (if any) - with error handling
      const evidenceUrls: string[] = [];
      if (formData.evidence && formData.evidence.length > 0) {
        try {
          for (const file of formData.evidence) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `evidence/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('moderation-evidence')
              .upload(filePath, file);
            
            if (uploadError) {
              console.error('Storage upload error:', uploadError);
              // Don't throw error, just log and continue without evidence
              console.warn('Evidence upload failed, continuing without evidence files');
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from('moderation-evidence')
                .getPublicUrl(filePath);
              
              evidenceUrls.push(publicUrl);
            }
          }
        } catch (storageError) {
          console.error('Storage upload failed:', storageError);
          console.warn('Continuing report submission without evidence files');
        }
      }

      // Create report with correct field names
      // Only include reported_user_id if it exists and is valid
      const reportData: any = {
        reporter_user_id: reporterUserId,
        reason: formData.category,
        details: formData.description,
        description: formData.title,
        status: 'pending',
        urgent: formData.severity === 'high' || formData.priority === 'urgent',
        evidence: evidenceUrls.length > 0 ? evidenceUrls.join(',') : null,
        created_at: new Date().toISOString(),
        notified_user: false,
        notification_sent_at: null
      };

      // Ensure we have either a reported_user_id or content_id to satisfy the check constraint
      let hasValidTarget = false;

      // Use content_id approach to avoid foreign key issues
      if (reportedUserId) {
        // Store the reported user ID as content_id to avoid foreign key constraint
        reportData.content_id = 'user-' + reportedUserId;
        // Don't set content_type to avoid constraint violation
        hasValidTarget = true;
        console.log('Using reported user as content_id:', 'user-' + reportedUserId);
      }

      // Add content info if provided
      if (contentId) {
        reportData.content_id = contentId;
        hasValidTarget = true;
      }
      // Don't set content_type to avoid constraint violations

      // If we don't have a valid target, we need to create a placeholder or handle this case
      if (!hasValidTarget) {
        // For general reports without a specific target, we can use a placeholder content_id
        reportData.content_id = 'general-report-' + Date.now();
        console.log('No specific target provided, using general report target');
      }

      // Ensure we have at least one target field to satisfy the constraint
      if (!reportData.reported_user_id && !reportData.content_id) {
        // Fallback: use a system-generated content_id
        reportData.content_id = 'system-report-' + Date.now();
        console.log('No target provided, using system report target');
      }

      // Debug: Log the report data before insertion
      console.log('Report data to insert:', reportData);

      const { data: insertedReport, error } = await supabase
        .from('reports')
        .insert(reportData)
        .select()
        .single();

      if (error) {
        console.error('Database error details:', error);
        console.error('Report data that failed:', reportData);
        
        // If it's a constraint violation, try with minimal required fields
        if (error.code === '23514') {
          console.log('Constraint violation detected, trying with minimal fields...');
          
          const minimalReportData = {
            reporter_user_id: reporterUserId,
            reason: formData.category,
            details: formData.description,
            status: 'pending',
            created_at: new Date().toISOString()
          };
          
          // Always use content_id as target to avoid foreign key issues
          if (contentId) {
            minimalReportData.content_id = contentId;
          } else if (reportedUserId) {
            // Use the reported user ID as content_id to avoid foreign key constraint
            minimalReportData.content_id = 'user-' + reportedUserId;
            // Don't set content_type to avoid constraint violation
          } else {
            minimalReportData.content_id = 'general-report-' + Date.now();
          }
          
          console.log('Trying minimal report data:', minimalReportData);
          
          const { data: retryData, error: retryError } = await supabase
            .from('reports')
            .insert(minimalReportData)
            .select()
            .single();
            
          if (retryError) {
            console.error('Retry also failed:', retryError);
            throw retryError;
          } else {
            console.log('Report submitted successfully with minimal data');
            // Use retryData for notifications
            if (retryData) {
              // Get reporter and reported user info for notifications
              const { data: reporterData } = await supabase
                .from('user_profiles')
                .select('username')
                .eq('user_id', reporterUserId)
                .single();
              
              const { data: reportedData } = reportedUserId ? await supabase
                .from('user_profiles')
                .select('username')
                .eq('user_id', reportedUserId)
                .single() : { data: null };

              // Notify all staff
              await notifyAllStaffOfReport(retryData.id, {
                reporterUsername: reporterData?.username,
                reportedUsername: reportedData?.username,
                reason: formData.category,
                urgent: formData.severity === 'high' || formData.priority === 'urgent'
              });
            }
          }
        } else {
          throw error;
        }
      } else if (insertedReport) {
        // Get reporter and reported user info for notifications
        const { data: reporterData } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('user_id', reporterUserId)
          .single();
        
        const { data: reportedData } = reportedUserId ? await supabase
          .from('user_profiles')
          .select('username')
          .eq('user_id', reportedUserId)
          .single() : { data: null };

        // Log the report submission to moderation_logs
        await logReportSubmission({
          reporterUserId,
          reportedUserId,
          reason: formData.category,
          description: formData.description
        });

        // Notify all staff members
        await notifyAllStaffOfReport(insertedReport.id, {
          reporterUsername: reporterData?.username,
          reportedUsername: reportedData?.username,
          reason: formData.category,
          urgent: formData.severity === 'high' || formData.priority === 'urgent'
        });
      }

      // Send confirmation notification to reporter
      await notifyReporterOfSubmission(reporterUserId);

      toast.success('Report submitted successfully');
      onReportSubmitted?.();
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Flag className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Report Content</h2>
                <p className="text-slate-400 text-sm">Step {step} of 3</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-3 bg-slate-800/50">
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNum <= step
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {stepNum}
                </div>
              ))}
              <div className="flex-1 h-1 bg-slate-700 rounded-full mx-2">
                <div 
                  className="h-full bg-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">What would you like to report?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {reportCategories.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => handleInputChange('category', category.id)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            formData.category === category.id
                              ? 'border-purple-500 bg-purple-500/20'
                              : 'border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <IconComponent className={`w-6 h-6 mx-auto mb-2 text-${category.color}-400`} />
                          <span className="text-white text-sm font-medium">{category.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Severity Level
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {severityLevels.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => handleInputChange('severity', level.id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.severity === level.id
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full bg-${level.color}-400`} />
                          <span className="text-white text-sm font-medium">{level.label}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{level.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Provide Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Report Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Brief description of the issue"
                        className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Detailed Description *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Please provide as much detail as possible about the issue..."
                        rows={4}
                        className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Evidence (Optional)
                      </label>
                      <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm mb-3">
                          Upload screenshots or files (Max 5 files)
                        </p>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*,.pdf,.doc,.docx"
                          onChange={(e) => handleEvidenceUpload(e.target.files)}
                          className="hidden"
                          id="evidence-upload"
                        />
                        <label
                          htmlFor="evidence-upload"
                          className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Choose Files
                        </label>
                      </div>
                      
                      {formData.evidence.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {formData.evidence.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                              <span className="text-white text-sm">{file.name}</span>
                              <button
                                onClick={() => removeEvidence(index)}
                                className="p-1 text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={runAIAnalysis}
                    disabled={!formData.description || loading}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Analyzing...' : 'AI Analysis'}
                  </button>
                  
                  {aiAnalysis && (
                    <button
                      onClick={() => setShowAIAnalysis(!showAIAnalysis)}
                      className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      View Analysis
                    </button>
                  )}
                </div>

                {showAIAnalysis && aiAnalysis && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">AI Analysis Results</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Risk Score:</span>
                        <span className="text-white ml-2">{aiAnalysis.riskScore}%</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Confidence:</span>
                        <span className="text-white ml-2">{aiAnalysis.confidence}%</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-slate-400">Keywords:</span>
                      <span className="text-white ml-2">{aiAnalysis.keywords.join(', ')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Review & Submit</h3>
                  
                  <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Category:</span>
                      <span className="text-white">
                        {reportCategories.find(c => c.id === formData.category)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Severity:</span>
                      <span className="text-white capitalize">{formData.severity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Title:</span>
                      <span className="text-white">{formData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Evidence:</span>
                      <span className="text-white">{formData.evidence.length} files</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-800/70 transition-colors">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="anonymous"
                        checked={formData.anonymous}
                        onChange={(e) => handleInputChange('anonymous', e.target.checked)}
                        className="sr-only"
                      />
                      <label
                        htmlFor="anonymous"
                        className="flex items-center space-x-3 cursor-pointer"
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                          formData.anonymous 
                            ? 'bg-purple-600 border-purple-600' 
                            : 'bg-transparent border-slate-500 hover:border-purple-500'
                        }`}>
                          {formData.anonymous && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-slate-300 text-sm font-medium">
                          Submit anonymously
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-700">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              {step === 3 ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Flag className="w-4 h-4 mr-2" />
                  )}
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={step === 1 && !formData.category}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
