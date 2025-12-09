import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save, Sun, Utensils, Book, Bus, Home, Shirt, Moon, Play, School, Music, Palette, Bike, Radio, Tv, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { format, addDays, startOfWeek, getDay, addWeeks } from "date-fns";
import { da } from "date-fns/locale";
import VoiceRecorder from "../components/VoiceRecorder";
import ImageUpload from "../components/ImageUpload";

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

const weekDays = [
  { value: 1, label: "Man" },
  { value: 2, label: "Tir" },
  { value: 3, label: "Ons" },
  { value: 4, label: "Tor" },
  { value: 5, label: "Fre" },
  { value: 6, label: "Lør" },
  { value: 0, label: "Søn" }
];

const iconMapping = {
  sun: Sun,
  utensils: Utensils,
  book: Book,
  bus: Bus,
  home: Home,
  shirt: Shirt,
  tooth: Radio,
  bed: Moon,
  play: Play,
  school: School,
  music: Music,
  palette: Palette,
  bike: Bike,
  ball: Radio,
  tv: Tv
};

export default function CreateActivity() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    audio_url: "",
    image_url: "", // Added image_url to formData
    icon: "sun",
    color: "blue",
    time: "08:00",
    duration_minutes: 30,
    assigned_to_user_id: "",
    completed: false,
    activity_type: "vigtige_ting",
    points: 0
  });
  const [selectedWeekDays, setSelectedWeekDays] = useState([]);
  const [numberOfWeeks, setNumberOfWeeks] = useState(4);
  const [showPreviousActivities, setShowPreviousActivities] = useState(false);

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

  const handleImageUpload = (imageUrl) => { // New handler for image upload
    setFormData(prev => ({
      ...prev,
      image_url: imageUrl
    }));
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        if (user && user.id) {
          const kids = await base44.entities.Child.filter({ parent_id: user.id });
          setChildren(kids);
          if (kids.length > 0) {
            setFormData(prev => ({ ...prev, assigned_to_user_id: kids[0].id }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch user or children:", error);
      }
    };
    fetchUserData();
  }, []);

  const { data: previousActivities } = useQuery({
    queryKey: ['previous-activities', formData.assigned_to_user_id],
    queryFn: async () => {
      if (!formData.assigned_to_user_id) return [];
      const activities = await base44.entities.Activity.filter({ 
        assigned_to_user_id: formData.assigned_to_user_id 
      }, '-created_date');
      
      const unique = [];
      const seenTitles = new Set();
      for (const activity of activities) {
        if (!seenTitles.has(activity.title)) {
          seenTitles.add(activity.title);
          unique.push(activity);
        }
      }
      return unique.slice(0, 10);
    },
    enabled: !!formData.assigned_to_user_id && showPreviousActivities,
    initialData: [],
  });

  const createActivityMutation = useMutation({
    mutationFn: async (activities) => {
      const promises = activities.map(activity => base44.entities.Activity.create(activity));
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      navigate(createPageUrl("ParentDashboard"));
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedWeekDays.length === 0) {
      alert("Vælg mindst én dag");
      return;
    }

    const activities = [];
    const seriesId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    for (let weekOffset = 0; weekOffset < numberOfWeeks; weekOffset++) {
      const currentWeekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset);
      
      selectedWeekDays.forEach(targetWeekDay => {
        let targetDate = currentWeekStart;
        let currentWeekDay = getDay(targetDate);
        if (currentWeekDay === 0) currentWeekDay = 7;
        
        const daysToAdd = targetWeekDay === 0 ? (7 - currentWeekDay) : (targetWeekDay - currentWeekDay);
        targetDate = addDays(currentWeekStart, daysToAdd);
        
        activities.push({
          ...formData,
          date: format(targetDate, "yyyy-MM-dd"),
          completed: false,
          series_id: seriesId
        });
      });
    }

    await createActivityMutation.mutateAsync(activities);
  };

  const handleCopyActivity = (activity) => {
    setFormData({
      title: activity.title,
      description: activity.description || "",
      audio_url: activity.audio_url || "",
      image_url: activity.image_url || "", // Included image_url in copy
      icon: activity.icon,
      color: activity.color,
      time: activity.time,
      duration_minutes: activity.duration_minutes,
      assigned_to_user_id: activity.assigned_to_user_id,
      completed: false,
      activity_type: activity.activity_type || "vigtige_ting",
      points: activity.points || 0
    });
    setShowPreviousActivities(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleWeekDay = (day) => {
    setSelectedWeekDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const avatarEmojis = {
    bear: "🐻",
    cat: "🐱",
    dog: "🐶",
    rabbit: "🐰",
    fox: "🦊",
    lion: "🦁",
    panda: "🐼",
    unicorn: "🦄"
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("ParentDashboard"))}
            className="rounded-xl h-12 w-12"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Opret Ny Aktivitet</h1>
            <p className="text-gray-600">Udfyld detaljerne for aktiviteten</p>
          </div>
          <Button
            onClick={() => setShowPreviousActivities(!showPreviousActivities)}
            variant="outline"
            className="rounded-2xl h-12 px-6"
          >
            <Copy className="w-5 h-5 mr-2" />
            Kopier tidligere
          </Button>
        </div>

        {showPreviousActivities && (
          <Card className="bg-white/60 backdrop-blur-md border-2 border-white shadow-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tidligere aktiviteter</h2>
            <div className="grid gap-3">
              {previousActivities.map((activity) => {
                const IconComponent = iconMapping[activity.icon];
                return (
                  <motion.button
                    key={activity.id}
                    onClick={() => handleCopyActivity(activity)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-400 transition-all text-left"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-${activity.color}-400 flex items-center justify-center`}>
                      {IconComponent && <IconComponent className="w-6 h-6 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.time} • {activity.duration_minutes} min</p>
                    </div>
                    <Copy className="w-5 h-5 text-gray-400" />
                  </motion.button>
                );
              })}
              {previousActivities.length === 0 && (
                <p className="text-center text-gray-500 py-4">Ingen tidligere aktiviteter fundet</p>
              )}
            </div>
          </Card>
        )}

        <Card className="bg-white/60 backdrop-blur-md border-2 border-white shadow-xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Aktivitetstype *</Label>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleChange("activity_type", "vigtige_ting");
                    handleChange("points", 0);
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    formData.activity_type === "vigtige_ting"
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="text-5xl mb-3">✅</div>
                  <p className="text-xl font-bold text-gray-800 mb-1">Vigtige ting</p>
                  <p className="text-sm text-gray-600">Rutiner som skal gøres hver dag</p>
                  <p className="text-xs text-gray-500 mt-2">Mad, bad, tænder, skole osv.</p>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleChange("activity_type", "bonus");
                    handleChange("points", 1);
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    formData.activity_type === "bonus"
                      ? "border-yellow-500 bg-yellow-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="text-5xl mb-3">⭐</div>
                  <p className="text-xl font-bold text-gray-800 mb-1">Bonus</p>
                  <p className="text-sm text-gray-600">Ekstra hjælp der giver point</p>
                  <p className="text-xs text-gray-500 mt-2">Skrald, tur, passe dyr osv.</p>
                </motion.button>
              </div>
            </div>

            {formData.activity_type === "bonus" && (
              <div className="space-y-2 bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
                <Label htmlFor="points" className="text-lg font-semibold flex items-center gap-2">
                  <span>⭐</span> Hvor mange stjerner giver opgaven?
                </Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => handleChange("points", parseInt(e.target.value) || 1)}
                  className="h-14 text-lg rounded-xl"
                />
                <p className="text-sm text-gray-600 mt-2">Barnet kan optjene stjerner til at få præmier</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title" className="text-lg font-semibold">Aktivitetens navn *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="fx Morgenmad, Skole, Leg..."
                required
                className="h-14 text-lg rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-lg font-semibold">Beskrivelse</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Kort beskrivelse af hvad der skal ske..."
                className="h-24 text-lg rounded-xl"
              />
              
              <VoiceRecorder 
                onTranscription={handleVoiceTranscription}
                onAudioFile={handleAudioFile}
                buttonText="🎤 Indtal beskrivelse"
              />
              
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <span>💡</span>
                Tryk på mikrofon-knappen og tal beskrivelsen ind. Lydoptagelsen bliver gemt og kan afspilles senere.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-semibold">Tilføj billede</Label>
              <ImageUpload
                currentImageUrl={formData.image_url}
                onImageUploaded={handleImageUpload}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-semibold">Hvilket barn? *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {children.map((child) => (
                  <motion.button
                    key={child.id}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChange("assigned_to_user_id", child.id)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      formData.assigned_to_user_id === child.id
                        ? "border-blue-500 bg-blue-50 shadow-lg"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="text-4xl mb-2">{avatarEmojis[child.avatar] || "👤"}</div>
                    <p className="text-sm font-medium">{child.display_name}</p>
                  </motion.button>
                ))}
              </div>
              {children.length === 0 && (
                <p className="text-red-500 text-sm">Du skal først oprette en barneprofil</p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-semibold">Vælg ugedage *</Label>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map(({ value, label }) => (
                  <motion.button
                    key={value}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleWeekDay(value)}
                    className={`p-3 rounded-2xl border-2 transition-all ${
                      selectedWeekDays.includes(value)
                        ? "border-green-500 bg-green-50 shadow-lg"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-bold text-center">{label}</p>
                  </motion.button>
                ))}
              </div>
              
              <div className="mt-4">
                <Label htmlFor="weeks" className="text-base font-semibold mb-2 block">
                  Opret for hvor mange uger frem? *
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="weeks"
                    type="number"
                    min="1"
                    max="52"
                    value={numberOfWeeks}
                    onChange={(e) => setNumberOfWeeks(parseInt(e.target.value) || 1)}
                    className="h-12 text-lg rounded-xl w-24"
                  />
                  <span className="text-gray-600">uger frem i tiden</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Der oprettes i alt {selectedWeekDays.length * numberOfWeeks} aktiviteter
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-semibold">Vælg ikon *</Label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {icons.map(({ value, icon: Icon, label }) => (
                  <motion.button
                    key={value}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChange("icon", value)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      formData.icon === value
                        ? "border-blue-500 bg-blue-50 shadow-lg"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs font-medium text-center">{label}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-semibold">Vælg farve *</Label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {colors.map(({ value, bg, label }) => (
                  <motion.button
                    key={value}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChange("color", value)}
                    className={`h-16 rounded-2xl border-2 transition-all ${bg} ${
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

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="time" className="text-lg font-semibold">Tidspunkt *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                  required
                  className="h-14 text-lg rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" className="text-lg font-semibold">Varighed (minutter)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => handleChange("duration_minutes", parseInt(e.target.value))}
                  className="h-14 text-lg rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(createPageUrl("ParentDashboard"))}
                className="h-14 px-8 text-lg rounded-2xl"
              >
                Annuller
              </Button>
              <Button
                type="submit"
                disabled={createActivityMutation.isPending}
                className="h-14 px-8 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl shadow-lg"
              >
                <Save className="w-5 h-5 mr-2" />
                Gem {selectedWeekDays.length * numberOfWeeks} aktiviteter
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}