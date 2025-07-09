import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, FileText, CheckCircle, XCircle, Info, ClipboardList } from "lucide-react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

const appealReasons = [
  {
    title: "Content Taken Down",
    description: "Appeal if your content was removed and you believe it does not violate guidelines.",
    icon: FileText,
  },
  {
    title: "Account Suspension",
    description: "Appeal if your account was suspended and you believe it was a mistake.",
    icon: Flag,
  },
  {
    title: "Feature Restriction",
    description: "Appeal restrictions like limited posting or feature removal.",
    icon: ClipboardList,
  },
  {
    title: "Other",
    description: "Appeal for reasons not listed above.",
    icon: Info,
  },
];

export default function AppealsFormSystem() {
  const [selectedReason, setSelectedReason] = useState("");
  const [banType, setBanType] = useState("");
  const [formData, setFormData] = useState({
    discordTag: "",
    email: "",
    username: "",
    explanation: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New state to hold current user ID from Supabase
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch the current authenticated user on mount
  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Failed to get user:", error);
        return;
      }
      if (data?.user) {
        setUserId(data.user.id);
      }
    }
    fetchUser();
  }, []);

  // Derive username for the appeal from formData
  const username = formData.username || formData.discordTag || "Unknown";

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!banType || !selectedReason || !formData.explanation.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (banType === "discord" && (!formData.discordTag.trim() || !formData.email.trim())) {
      toast.error("Please provide your Discord tag and email.");
      return;
    }
    if (banType === "website" && !formData.username.trim()) {
      toast.error("Please provide your username or email.");
      return;
    }

    if (!userId) {
      toast.error("You must be logged in to submit an appeal.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("appeals").insert([
        {
          user_id: userId,
          username: username,
          ban_type: banType,
          ban_reason: selectedReason,
          appeal_reason: formData.explanation.trim(),
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Supabase insert error:", error);
        toast.error("Failed to submit appeal: " + error.message);
      } else {
        toast.success("Appeal submitted successfully!");
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold text-white mb-6 text-center"
        >
          Submit an Appeal
        </motion.h1>
        {!showForm && !submitted && (
          <>
            <p className="text-slate-300 text-center mb-8">
              Select a reason below to start your appeal.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {appealReasons.map((reason, idx) => {
                const Icon = reason.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className={`bg-slate-800/50 backdrop-blur rounded-xl border border-blue-600 p-6 hover:shadow-lg cursor-pointer transition-all ${
                      selectedReason === reason.title ? "border-blue-400" : ""
                    }`}
                    onClick={() => {
                      setSelectedReason(reason.title);
                      setShowForm(true);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-blue-500/20">
                        <Icon className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {reason.title}
                        </h3>
                        <p className="text-slate-300 text-sm">{reason.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        <AnimatePresence>
          {showForm && !submitted && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              onSubmit={handleSubmit}
              className="mt-8 bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-8 space-y-6"
            >
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-400" /> Appeal Form
              </h2>
              <div>
                <label className="text-slate-300 block mb-1">Ban Type</label>
                <select
                  value={banType}
                  onChange={(e) => setBanType(e.target.value)}
                  required
                  className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-400"
                  disabled={isSubmitting}
                >
                  <option value="">Select Ban Type</option>
                  <option value="discord">Discord Ban</option>
                  <option value="website">Website Ban</option>
                </select>
              </div>
              {banType === "discord" && (
                <>
                  <div>
                    <label className="text-slate-300 block mb-1">Discord Username + Tag</label>
                    <input
                      type="text"
                      required
                      value={formData.discordTag}
                      onChange={(e) =>
                        setFormData({ ...formData, discordTag: e.target.value })
                      }
                      placeholder="Username#1234"
                      className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-400"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="you@example.com"
                      className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-400"
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              )}
              {banType === "website" && (
                <div>
                  <label className="text-slate-300 block mb-1">Username or Email</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="Your username or email"
                    className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-400"
                    disabled={isSubmitting}
                  />
                </div>
              )}
              <div>
                <label className="text-slate-300 block mb-1">Explanation</label>
                <textarea
                  required
                  value={formData.explanation}
                  onChange={(e) =>
                    setFormData({ ...formData, explanation: e.target.value })
                  }
                  placeholder="Explain why you believe this ban was a mistake."
                  rows={4}
                  className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-400 resize-none"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedReason("");
                    setFormData({
                      discordTag: "",
                      email: "",
                      username: "",
                      explanation: "",
                    });
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <XCircle className="w-5 h-5" /> Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <CheckCircle className="w-5 h-5" /> Submit Appeal
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center text-white mt-10"
          >
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-lg">
              Your appeal for <strong>{selectedReason}</strong> has been submitted successfully.
              We will review and get back to you via the contact provided.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
