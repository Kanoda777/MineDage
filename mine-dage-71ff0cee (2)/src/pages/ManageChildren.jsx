import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ChildProfileCard from "../components/ChildProfileCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

const avatarOptions = [
  { value: "bear", emoji: "🐻", label: "Bjørn" },
  { value: "cat", emoji: "🐱", label: "Kat" },
  { value: "dog", emoji: "🐶", label: "Hund" },
  { value: "rabbit", emoji: "🐰", label: "Kanin" },
  { value: "fox", emoji: "🦊", label: "Ræv" },
  { value: "lion", emoji: "🦁", label: "Løve" },
  { value: "panda", emoji: "🐼", label: "Panda" },
  { value: "unicorn", emoji: "🦄", label: "Enhjørning" }
];

export default function ManageChildren() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    display_name: "",
    avatar: "bear",
    pin_code: ""
  });

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: children, isLoading } = useQuery({
    queryKey: ['children', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      return await base44.entities.Child.filter({ parent_id: currentUser.id });
    },
    enabled: !!currentUser,
    initialData: [],
  });

  const createChildMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Child.create({
        display_name: data.display_name,
        avatar: data.avatar,
        pin_code: data.pin_code,
        parent_id: currentUser.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      setShowDialog(false);
      setFormData({ display_name: "", avatar: "bear", pin_code: "" });
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: (id) => base44.entities.Child.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.pin_code.length !== 4 || !/^\d+$/.test(formData.pin_code)) {
      alert("PIN koden skal være præcis 4 cifre");
      return;
    }

    await createChildMutation.mutateAsync(formData);
  };

  const handleDelete = async (id) => {
    if (confirm("Er du sikker på at du vil slette denne barneprofil?")) {
      await deleteChildMutation.mutateAsync(id);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Indlæser...</p>
      </div>
    );
  }

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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Administrer Børn</h1>
            <p className="text-gray-600">Opret og administrer børneprofiler</p>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl shadow-lg h-14 px-8"
          >
            <Plus className="w-5 h-5 mr-2" />
            Tilføj Barn
          </Button>
        </div>

        <div className="grid gap-6">
          {children.map((child) => (
            <ChildProfileCard
              key={child.id}
              child={child}
              onDelete={handleDelete}
            />
          ))}

          {children.length === 0 && !isLoading && (
            <Card className="bg-white/40 backdrop-blur-md border-2 border-white shadow-xl p-12 text-center">
              <p className="text-6xl mb-4">👨‍👩‍👧‍👦</p>
              <p className="text-2xl font-semibold text-gray-700 mb-2">
                Ingen børneprofiler endnu
              </p>
              <p className="text-gray-500 mb-6">
                Opret den første barneprofil for at komme i gang
              </p>
              <Button
                onClick={() => setShowDialog(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Tilføj Barn
              </Button>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Opret Barneprofil</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="display_name" className="text-lg font-semibold">Barnets navn *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                placeholder="fx Emma, Lucas..."
                required
                className="h-12 text-lg rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-semibold">Vælg avatar *</Label>
              <div className="grid grid-cols-4 gap-3">
                {avatarOptions.map(({ value, emoji, label }) => (
                  <motion.button
                    key={value}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData({...formData, avatar: value})}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      formData.avatar === value
                        ? "border-blue-500 bg-blue-50 shadow-lg"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="text-4xl mb-1">{emoji}</div>
                    <p className="text-xs font-medium">{label}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin_code" className="text-lg font-semibold">PIN kode (4 cifre) *</Label>
              <Input
                id="pin_code"
                type="text"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={formData.pin_code}
                onChange={(e) => setFormData({...formData, pin_code: e.target.value.replace(/\D/g, '')})}
                placeholder="1234"
                required
                className="h-12 text-lg rounded-xl text-center tracking-widest"
              />
              <p className="text-sm text-gray-500">Denne PIN bruges til barnets login</p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="h-12 px-6 rounded-xl"
              >
                Annuller
              </Button>
              <Button
                type="submit"
                disabled={createChildMutation.isPending}
                className="h-12 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg"
              >
                Opret Profil
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}