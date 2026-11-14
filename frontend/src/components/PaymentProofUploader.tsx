"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

interface PaymentProofUploaderProps {
  onUpload: (url: string, publicId: string) => void;
  onRemove: () => void;
  initialUrl?: string;
  initialPublicId?: string;
  disabled?: boolean;
}

export default function PaymentProofUploader({
  onUpload,
  onRemove,
  initialUrl,
  initialPublicId,
  disabled = false,
}: PaymentProofUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(
    initialUrl || null
  );
  const [uploadedPublicId, setUploadedPublicId] = useState<string | null>(
    initialPublicId || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a valid image (JPEG, PNG, GIF) or PDF file");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(API_ENDPOINTS.UPLOAD.IMAGE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.imageUrl && data.publicId) {
        setUploadedUrl(data.imageUrl);
        setUploadedPublicId(data.publicId);
        onUpload(data.imageUrl, data.publicId);
        setError(null);
      } else {
        setError(data.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedUrl(null);
    setUploadedPublicId(null);
    onRemove();
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Payment Proof Upload
        </label>
        <p className="text-xs text-gray-400 mb-3">
          Upload a screenshot or PDF of your payment confirmation. Accepted
          formats: JPEG, PNG, GIF, PDF (max 10MB)
        </p>
      </div>

      {uploadedUrl ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div className="flex-1">
              <p className="text-green-400 font-medium text-sm">
                Payment proof uploaded successfully
              </p>
              <p className="text-gray-300 text-xs truncate">{uploadedUrl}</p>
            </div>
            <button
              onClick={handleRemove}
              disabled={disabled}
              className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          onClick={handleClick}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
            ${
              disabled
                ? "border-gray-600 bg-gray-800/50 cursor-not-allowed opacity-50"
                : "border-gray-500 hover:border-cyan-500 hover:bg-cyan-500/5"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />

          {uploading ? (
            <div className="space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
              <p className="text-cyan-400 text-sm">
                Uploading payment proof...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <div>
                <p className="text-white font-medium">Upload Payment Proof</p>
                <p className="text-gray-400 text-sm">
                  Click to select file or drag and drop
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {/* File Preview */}
      {uploadedUrl && (
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-2">Preview:</p>
          <div className="bg-gray-800/50 rounded-lg p-3">
            {uploadedUrl.toLowerCase().includes(".pdf") ? (
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-red-400" />
                <span className="text-white text-sm">PDF Document</span>
              </div>
            ) : (
              <img
                src={uploadedUrl}
                alt="Payment proof preview"
                className="max-w-full h-32 object-contain rounded"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
