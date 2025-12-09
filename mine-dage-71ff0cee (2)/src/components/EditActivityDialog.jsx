
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sun, Utensils, Book, Bus, Home, Shirt, Moon, Play, School, Music, Palette, Bike, Radio, Tv } from "lucide-react";
import { motion } from "framer-motion";
import VoiceRecorder from "@/components/VoiceRecorder";
import ImageUpload from "@/components/ImageUpload";

const icons = [
  { value: "sun", icon: Sun, label: "Morgenmad" },
  { value: "utensils", icon: Utensils, label: "Mad" },
  { value: "book", icon: Book, label: "Læsning" },
  { value: "bus", icon: Bus, label: "Transport" },
  { value: "home", icon: Home, label: "Hjem" },
  { value: "shirt", icon: Shirt, label: "Tøj på" },
  { value: "tooth", icon: Radio, label: "Tænder" },
  { value: "bed", icon: Moon, label: "Sengetid" },
  { value: "play", icon: Play, label: "Leg" },
  { value: "school", icon: School, label: "Skole" },
  { value: "music", icon: Music, label: "Musik" },
  { value: "palette", icon: Palette, label: "Tegning" },
  { value: "bike", icon: Bike, label: "Cykling" },
  { value: "ball", icon: Radio, label: "Sport" },
  { value: "tv", icon: Tv, label: "Skærmtid" }
];

const colors = [
  { value: "blue", bg: "bg-blue-400", label: "Blå" },
  { value: "orange", bg: "bg-orange-400", label: "Orange" },
  { value: "purple", bg: "bg-purple-400", label: "Lilla" },
  { value: "green", bg: "bg-green-400", label: "Grøn" },
  { value: "yellow", bg: "bg-yellow-400", label: "Gul" },
  { value: "pink", bg: "bg-pink-400", label: "Pink" },
  { value: "red", bg: "bg-red-400", label: "Rød" }
];

export default function EditActivityDialog({ activity, open, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: activity?.title || "",
    description: activity?.description || "",
    audio_url: activity?.audio_url || "",
    image_url: activity?.image_url || "", // Added image_url
    icon: activity?.icon || "sun",
    color: activity?.color || "blue",
    time: activity?.time || "08:00",
    duration_minutes: activity?.duration_minutes || 30,
  });

  const handleVoiceTranscription = (text) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description 
        ? `${prev.description} ${text}` 
        : text
    }));
  };

  const handleAudioFile = (audioUrl) => {
    setFormData(prev => ({
      ...prev,
      audio_url: audioUrl
    }));
  };

  // New function for image upload
  const handleImageUpload = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      image_url: imageUrl
    }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Rediger aktivitet</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-lg font-semibold">Aktivitetens navn *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="fx Morgenmad, Skole, Leg..."
              required
              className="h-12 text-lg rounded-xl"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="text-lg font-semibold">Beskrivelse</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Kort beskrivelse af hvad der skal ske..."
              className="h-20 text-base rounded-xl"
            />
            
            <VoiceRecorder 
              onTranscription={handleVoiceTranscription}
              onAudioFile={handleAudioFile}
              buttonText="🎤 Indtal beskrivelse"
            />
          </div>

          {/* New Image Upload Section */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Billede</Label>
            <ImageUpload
              currentImageUrl={formData.image_url}
              onImageUploaded={handleImageUpload}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-lg font-semibold">Vælg ikon *</Label>
            <div className="grid grid-cols-5 gap-2">
              {icons.map(({ value, icon: Icon, label }) => (
                <motion.button
                  key={value}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleChange("icon", value)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.icon === value
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-xs font-medium text-center">{label}</p>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-lg font-semibold">Vælg farve *</Label>
            <div className="grid grid-cols-7 gap-2">
              {colors.map(({ value, bg, label }) => (
                <motion.button
                  key={value}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleChange("color", value)}
                  className={`h-12 rounded-xl border-2 transition-all ${bg} ${
                    formData.color === value
                      ? "border-gray-800 shadow-lg"
                      : "border-white"
                  }`}
                >
                  <span className="sr-only">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time" className="text-base font-semibold">Tidspunkt *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleChange("time", e.target.value)}
                required
                className="h-12 text-base rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-base font-semibold">Varighed (minutter)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => handleChange("duration_minutes", parseInt(e.target.value))}
                className="h-12 text-base rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-12 px-6 rounded-xl"
            >
              Annuller
            </Button>
            <Button
              type="submit"
              className="h-12 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg"
            >
              Gem ændringer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
