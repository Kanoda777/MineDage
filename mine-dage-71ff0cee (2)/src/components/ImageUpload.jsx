import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

export default function ImageUpload({ currentImageUrl, onImageUploaded, buttonText = "Tilføj billede" }) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl || "");
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
    onImageUploaded(file_url);
    setUploading(false);
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    onImageUploaded("");
  };

  return (
    <div className="space-y-3">
      {imageUrl ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <img
            src={imageUrl}
            alt="Uploaded"
            className="w-full h-48 object-cover rounded-2xl border-4 border-white shadow-lg"
          />
          <Button
            type="button"
            onClick={handleRemoveImage}
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            className="h-24 rounded-2xl border-2 border-dashed hover:border-blue-400 hover:bg-blue-50"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Camera className="w-6 h-6" />
                <span className="text-sm font-semibold">Tag foto</span>
              </div>
            )}
          </Button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileUpload(e.target.files?.[0])}
            className="hidden"
          />

          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            className="h-24 rounded-2xl border-2 border-dashed hover:border-purple-400 hover:bg-purple-50"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6" />
                <span className="text-sm font-semibold">Vælg billede</span>
              </div>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files?.[0])}
            className="hidden"
          />
        </div>
      )}
      <p className="text-sm text-gray-500 text-center">
        📸 Tag et billede med kameraet eller vælg et fra din enhed
      </p>
    </div>
  );
}