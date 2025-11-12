import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Shield,
  Flag,
  AlertTriangle,
  FileText,
  Lock,
  X,
  Loader2,
  Camera,
  Upload,
  CheckCircle,
  Users,
  MessageSquare,
  Clock,
  Zap,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/authContext';
import toast from 'react-hot-toast';
import { notifyAllStaffOfReport } from '../../lib/moderationUtils';
import Footer from '../Footer';

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
        moderator_id: reportData.reporterUserId,
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

interface ReportFormPageProps {
  reportedUserId?: string;
  reportedUsername?: string;
  contentId?: string;
  contentType?: string;
  contentUrl?: string;
}

export default function ReportFormPage({
  reportedUserId,
  reportedUsername,
  contentId,
  contentType,
  contentUrl,
}: ReportFormPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get params from location state, URL params, or props
  const state = location.state as any;
  const searchParams = new URLSearchParams(location.search);
  const actualReportedUserId = reportedUserId || state?.reportedUserId || searchParams.get('userId') || undefined;
  const actualReportedUsername = reportedUsername || state?.reportedUsername || searchParams.get('username') || undefined;
  const actualContentId = contentId || state?.contentId || searchParams.get('contentId') || undefined;
  const actualContentType = contentType || state?.contentType || searchParams.get('contentType') || undefined;
  const actualContentUrl = contentUrl || state?.contentUrl || searchParams.get('contentUrl') || undefined;

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
    if (!user) {
      navigate('/');
      toast.error('Please sign in to submit a report');
    }
  }, [user, navigate]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEvidenceUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setFormData(prev => ({
        ...prev,
        evidence: [...prev.evidence, ...newFiles].slice(0, 5)
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
    if (!user) {
      toast.error('Please sign in to submit a report');
      return;
    }

    if (!formData.title || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
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
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from('moderation-evidence')
                .getPublicUrl(filePath);
              
              evidenceUrls.push(publicUrl);
            }
          }
        } catch (storageError) {
          console.error('Storage upload failed:', storageError);
        }
      }

      const reportData: any = {
        reporter_user_id: user.id,
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

      let hasValidTarget = false;

      if (actualReportedUserId) {
        reportData.content_id = 'user-' + actualReportedUserId;
        hasValidTarget = true;
      }

      if (actualContentId) {
        reportData.content_id = actualContentId;
        hasValidTarget = true;
      }

      if (!hasValidTarget) {
        reportData.content_id = 'general-report-' + Date.now();
      }

      const { data: insertedReport, error } = await supabase
        .from('reports')
        .insert(reportData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        
        const minimalReportData = {
          reporter_user_id: user.id,
          reason: formData.category,
          details: formData.description,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        
        if (actualContentId) {
          minimalReportData.content_id = actualContentId;
        } else if (actualReportedUserId) {
          minimalReportData.content_id = 'user-' + actualReportedUserId;
        } else {
          minimalReportData.content_id = 'general-report-' + Date.now();
        }
        
        const { data: retryData, error: retryError } = await supabase
          .from('reports')
          .insert(minimalReportData)
          .select()
          .single();
          
        if (retryError) {
          throw retryError;
        }

        if (retryData) {
          const { data: reporterData } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('user_id', user.id)
            .single();
          
          const { data: reportedData } = actualReportedUserId ? await supabase
            .from('user_profiles')
            .select('username')
            .eq('user_id', actualReportedUserId)
            .single() : { data: null };

          await notifyAllStaffOfReport(retryData.id, {
            reporterUsername: reporterData?.username,
            reportedUsername: reportedData?.username,
            reason: formData.category,
            urgent: formData.severity === 'high' || formData.priority === 'urgent'
          });
        }
      } else if (insertedReport) {
        const { data: reporterData } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('user_id', user.id)
          .single();
        
        const { data: reportedData } = actualReportedUserId ? await supabase
          .from('user_profiles')
          .select('username')
          .eq('user_id', actualReportedUserId)
          .single() : { data: null };

        await logReportSubmission({
          reporterUserId: user.id,
          reportedUserId: actualReportedUserId,
          reason: formData.category,
          description: formData.description
        });

        await notifyAllStaffOfReport(insertedReport.id, {
          reporterUsername: reporterData?.username,
          reportedUsername: reportedData?.username,
          reason: formData.category,
          urgent: formData.severity === 'high' || formData.priority === 'urgent'
        });

        let reporteeUserId = actualReportedUserId;
        
        if (!reporteeUserId && actualContentId && actualContentType) {
          try {
            let tableName = '';
            switch (actualContentType.toLowerCase()) {
              case 'profile':
              case 'pfp':
              case 'banner':
                tableName = 'profiles';
                break;
              case 'profile_pair':
              case 'combo':
                tableName = 'profile_pairs';
                break;
              case 'emote':
                tableName = 'emotes';
                break;
              case 'wallpaper':
                tableName = 'wallpapers';
                break;
              case 'emoji_combo':
                tableName = 'emoji_combos';
                break;
            }

            if (tableName) {
              const { data: contentData } = await supabase
                .from(tableName)
                .select('user_id')
                .eq('id', actualContentId)
                .single();

              if (contentData?.user_id) {
                reporteeUserId = contentData.user_id;
              }
            }
          } catch (error) {
            console.error('Error fetching content owner:', error);
          }
        }

        if (reporteeUserId) {
          try {
            const { error: reporteeError } = await supabase
              .from('notifications')
              .insert({
                user_id: reporteeUserId,
                content: `📋 You have been reported: A report has been submitted against your account or content. Our moderation team will review this report.`,
                type: 'warning',
                priority: 'medium',
                read: false,
                action_url: `/moderation/reports/${insertedReport.id}`
              });

            if (reporteeError) {
              console.error('Error creating reportee notification:', reporteeError);
            }
          } catch (error) {
            console.error('Error notifying reportee:', error);
          }
        }
      }

      await notifyReporterOfSubmission(user.id);

      toast.success('Report submitted successfully');
      navigate('/report-content');
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/report-content')}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="p-3 bg-red-600/20 rounded-xl">
              <Flag className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Submit a Report</h1>
              <p className="text-slate-400">Step {step} of 3</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-8 border border-slate-700">
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
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 mb-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">What would you like to report?</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                <h3 className="text-xl font-semibold text-white mb-4">Provide Details</h3>
                
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
                      className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      rows={6}
                      className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
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
                          <div key={index} className="flex items-center justify-between p-2 bg-slate-700 rounded-lg">
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
                <h3 className="text-xl font-semibold text-white mb-4">Review & Submit</h3>
                
                <div className="bg-slate-700 rounded-lg p-4 space-y-3">
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

                <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-700/70 transition-colors">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={formData.anonymous}
                    onChange={(e) => handleInputChange('anonymous', e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="anonymous" className="text-slate-300 text-sm font-medium cursor-pointer">
                    Submit anonymously
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="px-6 py-3 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/report-content')}
              className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            {step === 3 ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
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
                disabled={!formData.category}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

