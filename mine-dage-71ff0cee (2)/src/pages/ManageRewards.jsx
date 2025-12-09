
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Gift, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import VoiceRecorder from "@/components/VoiceRecorder";
import ImageUpload from "@/components/ImageUpload"; // Added ImageUpload import
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const rewardIcons = ["🎁", "🎮", "🍦", "🎬", "🏀", "🎨", "📚", "🚴", "🎪", "🌟"];

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

export default function ManageRewards() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    audio_url: "",
    image_url: "", // Added image_url to formData
    points_required: 10,
    icon: "🎁",
    assigned_to_child_id: "",
    is_active: true,
    claimed: false
  });

  useEffect(() => {
    base44.auth.me().then(async (user) => {
      setCurrentUser(user);
      const kids = await base44.entities.Child.filter({ parent_id: user.id });
      setChildren(kids);
      if (kids.length > 0) {
        setFormData(prev => ({ ...prev, assigned_to_child_id: kids[0].id }));
      }
    });
  }, []);

  const { data: rewards } = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      if (!currentUser) return [];
      const allRewards = await base44.entities.Reward.list();
      return allRewards.filter(reward => 
        children.some(child => child.id === reward.assigned_to_child_id)
      );
    },
    enabled: !!currentUser && children.length > 0,
    initialData: [],
  });

  const createRewardMutation = useMutation({
    mutationFn: (data) => base44.entities.Reward.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteRewardMutation = useMutation({
    mutationFn: (id) => base44.entities.Reward.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });

  const markAsGivenMutation = useMutation({
    mutationFn: (id) => base44.entities.Reward.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      audio_url: "",
      image_url: "", // Added image_url to resetForm
      points_required: 10,
      icon: "🎁",
      assigned_to_child_id: children.length > 0 ? children[0].id : "",
      is_active: true,
      claimed: false
    });
  };

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

  const handleImageUpload = (imageUrl) => { // New handleImageUpload function
    setFormData(prev => ({
      ...prev,
      image_url: imageUrl
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createRewardMutation.mutateAsync(formData);
  };

  const handleDelete = async (id) => {
    if (confirm("Er du sikker på at du vil slette denne præmie?")) {
      await deleteRewardMutation.mutateAsync(id);
    }
  };

  const handleMarkAsGiven = async (id) => {
    if (confirm("Markér denne præmie som givet? Den vil blive fjernet fra barnets liste.")) {
      await markAsGivenMutation.mutateAsync(id);
    }
  };

  const getChildById = (id) => children.find(child => child.id === id);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Administrer Præmier</h1>
            <p className="text-gray-600">Opret og administrer præmier børnene kan optjene</p>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-2xl h-14 px-6 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ny Præmie
          </Button>
        </div>

        {children.length === 0 && (
          <Card className="bg-white/40 backdrop-blur-md border-2 border-white shadow-xl p-12 text-center">
            <p className="text-6xl mb-4">👨‍👩‍👧‍👦</p>
            <p className="text-2xl font-semibold text-gray-700 mb-2">
              Opret først en barneprofil
            </p>
            <p className="text-gray-500 mb-6">
              Du skal have mindst én barneprofil før du kan oprette præmier
            </p>
          </Card>
        )}

        {children.map(child => {
          const childRewards = rewards.filter(r => r.assigned_to_child_id === child.id);
          const activeRewards = childRewards.filter(r => r.is_active && !r.claimed);
          const claimedRewards = childRewards.filter(r => r.claimed && r.is_active);

          return (
            <div key={child.id} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{avatarEmojis[child.avatar] || "👤"}</span>
                <h2 className="text-2xl font-bold text-gray-800">{child.display_name}</h2>
                <div className="ml-auto bg-yellow-100 px-4 py-2 rounded-2xl">
                  <p className="text-yellow-800 font-bold">
                    ⭐ {child.total_points || 0} stjerner
                  </p>
                </div>
              </div>

              {claimedRewards.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                      Nyt! {claimedRewards.length}
                    </span>
                    Indløste præmier - venter på levering
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {claimedRewards.map(reward => (
                      <motion.div
                        key={reward.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-4 border-green-300 shadow-xl p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-4xl">{reward.icon}</span>
                              <div>
                                <h4 className="text-xl font-bold text-gray-800">{reward.title}</h4>
                                <p className="text-green-700 font-bold flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  Indløst! ({reward.points_required} ⭐)
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleMarkAsGiven(reward.id)}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                            >
                              ✓ Givet
                            </Button>
                          </div>
                          {reward.description && (
                            <p className="text-gray-700">{reward.description}</p>
                          )}
                          {reward.image_url && (
                              <img src={reward.image_url} alt={reward.title} className="mt-4 rounded-xl w-full object-cover max-h-40" />
                          )}
                          <div className="mt-3 bg-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-800 font-semibold text-center">
                              🎉 {child.display_name} har valgt at indløse denne præmie!
                            </p>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeRewards.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Aktive præmier</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {activeRewards.map(reward => (
                      <motion.div
                        key={reward.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Card className="bg-white/60 backdrop-blur-md border-2 border-white shadow-xl p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-4xl">{reward.icon}</span>
                              <div>
                                <h4 className="text-xl font-bold text-gray-800">{reward.title}</h4>
                                <p className="text-yellow-600 font-bold">
                                  {reward.points_required} ⭐ nødvendigt
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(reward.id)}
                              className="rounded-xl"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                          {reward.description && (
                            <p className="text-gray-600 mb-3">{reward.description}</p>
                          )}
                          {reward.image_url && (
                              <img src={reward.image_url} alt={reward.title} className="mt-4 rounded-xl w-full object-cover max-h-40" />
                          )}
                          <div className="bg-gray-100 rounded-xl p-3 mt-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-600">Fremskridt</span>
                              <span className="text-sm font-bold">
                                {child.total_points || 0} / {reward.points_required}
                              </span>
                            </div>
                            <div className="w-full bg-gray-300 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${Math.min(100, ((child.total_points || 0) / reward.points_required) * 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeRewards.length === 0 && claimedRewards.length === 0 && (
                <Card className="bg-white/40 backdrop-blur-md border-2 border-white shadow-xl p-8 text-center">
                  <p className="text-5xl mb-3">🎁</p>
                  <p className="text-gray-600">Ingen præmier oprettet for {child.display_name} endnu</p>
                </Card>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Opret ny præmie</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Hvilket barn?</Label>
              <div className="grid grid-cols-2 gap-2">
                {children.map(child => (
                  <Button
                    key={child.id}
                    type="button"
                    variant={formData.assigned_to_child_id === child.id ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, assigned_to_child_id: child.id }))}
                    className="h-16 rounded-xl"
                  >
                    <span className="text-2xl mr-2">{avatarEmojis[child.avatar]}</span>
                    {child.display_name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vælg ikon</Label>
              <div className="grid grid-cols-5 gap-2">
                {rewardIcons.map(icon => (
                  <Button
                    key={icon}
                    type="button"
                    variant={formData.icon === icon ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className="text-3xl h-14 rounded-xl"
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Præmiens navn *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="fx Biograftur, Ekstra skærmtid..."
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beskriv præmien..."
                className="h-20 rounded-xl"
              />
              
              <VoiceRecorder 
                onTranscription={handleVoiceTranscription}
                onAudioFile={handleAudioFile}
                buttonText="🎤 Indtal beskrivelse"
              />
              
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <span>💡</span>
                Tryk på mikrofon-knappen og tal beskrivelsen ind. Barnet kan lytte til den senere.
              </p>
            </div>

            <div className="space-y-3"> {/* New ImageUpload section */}
              <Label>Tilføj billede</Label>
              <ImageUpload
                currentImageUrl={formData.image_url}
                onImageUploaded={handleImageUpload}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Antal stjerner nødvendigt *</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={formData.points_required}
                onChange={(e) => setFormData(prev => ({ ...prev, points_required: parseInt(e.target.value) || 1 }))}
                className="h-12 rounded-xl"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="rounded-xl"
              >
                Annuller
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl"
              >
                <Gift className="w-4 h-4 mr-2" />
                Opret præmie
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
