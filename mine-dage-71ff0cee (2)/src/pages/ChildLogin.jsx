import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Delete, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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

export default function ChildLogin() {
  const navigate = useNavigate();
  const [deviceChildId, setDeviceChildId] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);

  useEffect(() => {
    const savedDeviceChildId = localStorage.getItem('device_child_id');
    if (savedDeviceChildId) {
      setDeviceChildId(savedDeviceChildId);
    }
  }, []);

  const { data: child, isLoading } = useQuery({
    queryKey: ['device-child', deviceChildId],
    queryFn: async () => {
      if (!deviceChildId) return null;
      const children = await base44.entities.Child.filter({ id: deviceChildId });
      return children.length > 0 ? children[0] : null;
    },
    enabled: !!deviceChildId,
  });

  useEffect(() => {
    if (child) {
      setSelectedChild(child);
    }
  }, [child]);

  const speakChildName = (childToSpeak) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(childToSpeak.display_name);
      utterance.lang = 'da-DK';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePinInput = (digit) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      
      if (newPin.length === 4) {
        checkPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPinInput(pinInput.slice(0, -1));
    setError("");
  };

  const checkPin = async (pin) => {
    if (selectedChild.pin_code === pin) {
      sessionStorage.setItem('child_session', JSON.stringify({
        id: selectedChild.id,
        display_name: selectedChild.display_name,
        avatar: selectedChild.avatar,
        parent_id: selectedChild.parent_id
      }));
      navigate(createPageUrl("ChildView"));
    } else {
      setError("Forkert PIN kode");
      setPinInput("");
      setTimeout(() => setError(""), 2000);
    }
  };

  const handleResetDevice = () => {
    localStorage.removeItem('device_child_id');
    localStorage.removeItem('device_parent_id');
    sessionStorage.removeItem('child_session');
    setShowResetDialog(false);
    navigate(createPageUrl("Welcome"));
  };

  const handleLongPressStart = () => {
    const timer = setTimeout(() => {
      setShowResetDialog(true);
    }, 3000);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  if (!deviceChildId || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <Card className="bg-white/60 backdrop-blur-md border-4 border-white shadow-2xl p-8">
            <p className="text-6xl mb-4">📱</p>
            <p className="text-2xl font-semibold text-gray-700 mb-4">
              Telefonen er ikke sat op endnu
            </p>
            <p className="text-gray-600 mb-6">
              Denne telefon skal først knyttes til en barneprofil
            </p>
            <Button
              onClick={() => navigate(createPageUrl("Welcome"))}
              className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl shadow-lg"
            >
              Opsæt telefon
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <p className="text-xl">Indlæser...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <div
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
            onMouseDown={handleLongPressStart}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            className="opacity-20 hover:opacity-40 transition-opacity"
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => speakChildName(selectedChild)}
            className="rounded-xl"
          >
            <Volume2 className="w-5 h-5" />
          </Button>
        </div>

        <Card className="bg-white/60 backdrop-blur-md border-4 border-white shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-9xl mb-4">
              {avatarEmojis[selectedChild.avatar] || "👤"}
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Hej {selectedChild.display_name}! 👋
            </h2>
            <p className="text-xl text-gray-600">Indtast din PIN kode</p>
          </div>

          <div className="mb-8">
            <div className="flex justify-center gap-4 mb-4">
              {[0, 1, 2, 3].map((index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold ${
                    pinInput.length > index
                      ? "bg-gradient-to-br from-blue-400 to-purple-400 text-white shadow-lg"
                      : "bg-gray-200"
                  }`}
                >
                  {pinInput.length > index ? "•" : ""}
                </motion.div>
              ))}
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-red-500 font-semibold text-lg"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                onClick={() => handlePinInput(num.toString())}
                className="h-20 text-3xl font-bold bg-white hover:bg-gray-50 text-gray-800 rounded-2xl shadow-lg border-2 border-gray-200"
                disabled={pinInput.length >= 4}
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={handleDelete}
              className="h-20 bg-white hover:bg-red-50 text-gray-800 rounded-2xl shadow-lg border-2 border-gray-200"
              disabled={pinInput.length === 0}
            >
              <Delete className="w-8 h-8" />
            </Button>
            <Button
              onClick={() => handlePinInput("0")}
              className="h-20 text-3xl font-bold bg-white hover:bg-gray-50 text-gray-800 rounded-2xl shadow-lg border-2 border-gray-200"
              disabled={pinInput.length >= 4}
            >
              0
            </Button>
          </div>
        </Card>

        <Button
          variant="outline"
          onClick={() => setShowResetDialog(true)}
          className="w-full mt-4 rounded-2xl text-gray-500"
        >
          Nulstil enhed
        </Button>
      </div>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Nulstil telefon</DialogTitle>
            <DialogDescription className="text-lg pt-4">
              <p className="text-gray-700 mb-3">
                Er du sikker på at du vil nulstille denne telefon?
              </p>
              <p className="text-gray-600">
                Telefonen vil ikke længere være knyttet til {selectedChild.display_name}, og skal sættes op igen.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              className="flex-1 h-12 text-lg rounded-xl"
            >
              Annuller
            </Button>
            <Button
              onClick={handleResetDevice}
              className="flex-1 h-12 text-lg bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Ja, nulstil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}