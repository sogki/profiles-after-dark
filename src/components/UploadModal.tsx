import React, { useState } from "react";
import { X, Upload, Image, Tag, Loader } from "lucide-react";
import { useProfiles } from "../hooks/useProfiles";
import { useAuth } from "../context/authContext";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  // Which upload form is active? 'single' or 'profilePair'
  const [uploadMode, setUploadMode] = useState<"single" | "profilePair">("single");

  // Single upload form state
  const [singleForm, setSingleForm] = useState({
    title: "",
    category: "general" as "discord" | "twitter" | "instagram" | "general",
    type: "profile" as "profile" | "banner",
    tags: [] as string[],
    file: null as File | null,
  });

  // Profile pair upload form state
  const [pairForm, setPairForm] = useState({
    title: "",
    category: "general" as "discord" | "twitter" | "instagram" | "general",
    tags: [] as string[],
    pfpFile: null as File | null,
    bannerFile: null as File | null,
  });

  // Common states
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { uploadProfile, uploadImage, uploadProfilePair } = useProfiles();
  const { user } = useAuth();

  if (!isOpen) return null;

  // Drag handlers for single file upload (reused for both single & pair, separate file inputs)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Single form handlers
  const handleSingleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSingleForm({ ...singleForm, file });
    }
  };

  // Profile pair handlers
  const handlePfpFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPairForm({ ...pairForm, pfpFile: file });
    }
  };
  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPairForm({ ...pairForm, bannerFile: file });
    }
  };

  // Tag add/remove helpers for single or pair
  const addTag = () => {
    if (uploadMode === "single") {
      if (tagInput.trim() && !singleForm.tags.includes(tagInput.trim())) {
        setSingleForm({
          ...singleForm,
          tags: [...singleForm.tags, tagInput.trim()],
        });
        setTagInput("");
      }
    } else {
      if (tagInput.trim() && !pairForm.tags.includes(tagInput.trim())) {
        setPairForm({
          ...pairForm,
          tags: [...pairForm.tags, tagInput.trim()],
        });
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (uploadMode === "single") {
      setSingleForm({
        ...singleForm,
        tags: singleForm.tags.filter((tag) => tag !== tagToRemove),
      });
    } else {
      setPairForm({
        ...pairForm,
        tags: pairForm.tags.filter((tag) => tag !== tagToRemove),
      });
    }
  };

  // Submission handlers

  const sanitizeFilename = (name: string) =>
    name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!singleForm.file || !singleForm.title || !user) return;

    if (singleForm.file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const cleanFileName = sanitizeFilename(singleForm.file.name);
      const fileName = `${Date.now()}-${cleanFileName}`;

      const { url, error: uploadError } = await uploadImage(singleForm.file, fileName);

      if (uploadError || !url) {
        throw new Error(uploadError || "Failed to upload image");
      }

      const { error: profileError } = await uploadProfile({
        title: singleForm.title,
        category: singleForm.category,
        type: singleForm.type,
        image_url: url,
        tags: singleForm.tags,
        user_id: user.id,
      });

      if (profileError) throw new Error(profileError);

      // reset form and close
      onClose();
      setSingleForm({
        title: "",
        category: "general",
        type: "profile",
        tags: [],
        file: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!pairForm.pfpFile || !pairForm.bannerFile || !pairForm.title || !user) return;

    if (
      pairForm.pfpFile.size > 10 * 1024 * 1024 ||
      pairForm.bannerFile.size > 10 * 1024 * 1024
    ) {
      setError("One or both files are too large. Maximum size is 10MB each.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload PFP
      const cleanPfpName = sanitizeFilename(pairForm.pfpFile.name);
      const pfpFileName = `${Date.now()}-pfp-${cleanPfpName}`;
      const { url: pfpUrl, error: pfpUploadError } = await uploadImage(pairForm.pfpFile, pfpFileName);
      if (pfpUploadError || !pfpUrl) throw new Error(pfpUploadError || "Failed to upload profile picture");

      // Upload Banner
      const cleanBannerName = sanitizeFilename(pairForm.bannerFile.name);
      const bannerFileName = `${Date.now()}-banner-${cleanBannerName}`;
      const { url: bannerUrl, error: bannerUploadError } = await uploadImage(pairForm.bannerFile, bannerFileName);
      if (bannerUploadError || !bannerUrl) throw new Error(bannerUploadError || "Failed to upload banner");

      // Create profile pair record (assuming uploadProfilePair handles pair creation)
      const { error: pairError } = await uploadProfilePair({
        title: pairForm.title,
        category: pairForm.category,
        user_id: user.id,
        pfp_url: pfpUrl,
        banner_url: bannerUrl,
        tags: pairForm.tags,
      });

      if (pairError) throw new Error(pairError);

      // reset form and close
      onClose();
      setPairForm({
        title: "",
        category: "general",
        tags: [],
        pfpFile: null,
        bannerFile: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal fade overlay + fixed height modal with internal scroll container + fade transition between forms

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ animation: "fadeIn 0.25s ease forwards" }}
    >
      <style>{`
        @keyframes fadeIn {
          from {opacity: 0;}
          to {opacity: 1;}
        }
        @keyframes fadeOut {
          from {opacity: 1;}
          to {opacity: 0;}
        }
        .fade-enter {
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        }
        .fade-enter-active {
          opacity: 1;
        }
        .fade-exit {
          opacity: 1;
          transition: opacity 0.3s ease-in-out;
        }
        .fade-exit-active {
          opacity: 0;
        }
      `}</style>
      <div
        className="bg-slate-800 rounded-2xl max-w-2xl w-full"
        style={{ minHeight: 600, maxHeight: "95vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">
            {uploadMode === "single" ? "Upload Single" : "Upload Profile Pair"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Mode Switch Buttons */}
        <div className="flex space-x-4 p-4 border-b border-slate-700">
          <button
            onClick={() => {
              setError(null);
              setUploadMode("single");
              setTagInput("");
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              uploadMode === "single"
                ? "bg-purple-600 text-white"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
            }`}
          >
            Single Upload
          </button>
          <button
            onClick={() => {
              setError(null);
              setUploadMode("profilePair");
              setTagInput("");
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              uploadMode === "profilePair"
                ? "bg-purple-600 text-white"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
            }`}
          >
            Profile Pair Upload
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm m-4">
            {error}
          </div>
        )}

        {/* Form container with fade animation */}
        <div
          style={{ position: "relative", minHeight: 380 }}
          aria-live="polite"
        >
          {uploadMode === "single" ? (
            <form
              key="single"
              onSubmit={handleSubmitSingle}
              className="p-6 space-y-6"
              style={{ animation: "fadeIn 0.3s ease forwards" }}
              autoComplete="off"
            >
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Upload Image
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-purple-500 bg-purple-500/10"
                      : singleForm.file
                      ? "border-green-500 bg-green-500/10"
                      : "border-slate-600 hover:border-slate-500"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const files = Array.from(e.dataTransfer.files);
                    if (files.length > 0 && files[0].type.startsWith("image/")) {
                      setSingleForm({ ...singleForm, file: files[0] });
                    }
                  }}
                >
                  {singleForm.file ? (
                    <div className="flex flex-col items-center gap-2">
                      <Image className="w-12 h-12 text-green-500 mx-auto" />
                      <span className="text-sm text-green-400">
                        {singleForm.file.name}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto text-slate-400" />
                      <p className="mt-2 text-sm text-slate-400">
                        Drag and drop your image here or{" "}
                        <label
                          htmlFor="singleFileInput"
                          className="text-purple-400 cursor-pointer underline"
                        >
                          browse files
                        </label>
                        .
                      </p>
                      <input
                        id="singleFileInput"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleSingleFileSelect}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label
                  htmlFor="singleTitle"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Title
                </label>
                <input
                  id="singleTitle"
                  type="text"
                  value={singleForm.title}
                  onChange={(e) =>
                    setSingleForm({ ...singleForm, title: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-white"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="singleCategory"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Category
                </label>
                <select
                  id="singleCategory"
                  value={singleForm.category}
                  onChange={(e) =>
                    setSingleForm({
                      ...singleForm,
                      category: e.target.value as
                        | "discord"
                        | "twitter"
                        | "instagram"
                        | "general",
                    })
                  }
                  className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-white"
                >
                  <option value="general">General</option>
                  <option value="discord">Discord</option>
                  <option value="twitter">Twitter</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Type
                </label>
                <select
                  value={singleForm.type}
                  onChange={(e) =>
                    setSingleForm({
                      ...singleForm,
                      type: e.target.value as "profile" | "banner",
                    })
                  }
                  className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-white"
                >
                  <option value="profile">Profile</option>
                  <option value="banner">Banner</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Tags
                </label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {singleForm.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove tag ${tag}`}
                        className="hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                    className="flex-grow rounded-md border border-slate-600 bg-slate-900 p-2 text-white"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="bg-purple-600 px-4 rounded-md text-white"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 py-3 rounded-md text-white font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader className="animate-spin mx-auto" /> : "Upload"}
              </button>
            </form>
          ) : (
            <form
              key="profilePair"
              onSubmit={handleSubmitPair}
              className="p-6 space-y-6"
              style={{ animation: "fadeIn 0.3s ease forwards" }}
              autoComplete="off"
            >
              {/* PFP Upload */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Upload Profile Picture
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-purple-500 bg-purple-500/10"
                      : pairForm.pfpFile
                      ? "border-green-500 bg-green-500/10"
                      : "border-slate-600 hover:border-slate-500"
                  }`}
                >
                  {pairForm.pfpFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <Image className="w-12 h-12 text-green-500 mx-auto" />
                      <span className="text-sm text-green-400">
                        {pairForm.pfpFile.name}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto text-slate-400" />
                      <p className="mt-2 text-sm text-slate-400">
                        Drag and drop your profile picture here or{" "}
                        <label
                          htmlFor="pfpFileInput"
                          className="text-purple-400 cursor-pointer underline"
                        >
                          browse files
                        </label>
                        .
                      </p>
                      <input
                        id="pfpFileInput"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePfpFileSelect}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Banner Upload */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Upload Banner Image
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-purple-500 bg-purple-500/10"
                      : pairForm.bannerFile
                      ? "border-green-500 bg-green-500/10"
                      : "border-slate-600 hover:border-slate-500"
                  }`}
                >
                  {pairForm.bannerFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <Image className="w-12 h-12 text-green-500 mx-auto" />
                      <span className="text-sm text-green-400">
                        {pairForm.bannerFile.name}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto text-slate-400" />
                      <p className="mt-2 text-sm text-slate-400">
                        Drag and drop your banner image here or{" "}
                        <label
                          htmlFor="bannerFileInput"
                          className="text-purple-400 cursor-pointer underline"
                        >
                          browse files
                        </label>
                        .
                      </p>
                      <input
                        id="bannerFileInput"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBannerFileSelect}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label
                  htmlFor="pairTitle"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Title
                </label>
                <input
                  id="pairTitle"
                  type="text"
                  value={pairForm.title}
                  onChange={(e) =>
                    setPairForm({ ...pairForm, title: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-white"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="pairCategory"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Category
                </label>
                <select
                  id="pairCategory"
                  value={pairForm.category}
                  onChange={(e) =>
                    setPairForm({
                      ...pairForm,
                      category: e.target.value as
                        | "discord"
                        | "twitter"
                        | "instagram"
                        | "general",
                    })
                  }
                  className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-white"
                >
                  <option value="general">General</option>
                  <option value="discord">Discord</option>
                  <option value="twitter">Twitter</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Tags
                </label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {pairForm.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove tag ${tag}`}
                        className="hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                    className="flex-grow rounded-md border border-slate-600 bg-slate-900 p-2 text-white"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="bg-purple-600 px-4 rounded-md text-white"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 py-3 rounded-md text-white font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader className="animate-spin mx-auto" /> : "Upload"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
