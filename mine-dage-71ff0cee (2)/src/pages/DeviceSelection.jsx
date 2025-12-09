import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Smartphone, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function DeviceSelection() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // Tjek om telefonen allerede er sat op som barnets telefon
        const deviceChildId = localStorage.getItem('device_child_id');
        if (deviceChildId) {
          navigate(createPageUrl("ChildLogin"));
          return;
        }
      } catch (error) {
        navigate(createPageUrl("Welcome"));
      }
      setIsLoading(false);
    };
    checkUser();
  }, [navigate]);

  const handleParentDevice = () => {
    navigate(createPageUrl("ParentDashboard"));
  };

  const handleChildDevice = () => {
    setShowConfirmDialog(true);
  };

  const confirmChildDevice = () => {
    setShowConfirmDialog(false);
    navigate(createPageUrl("ChildDeviceSetup"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">Indlæser...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="text-7xl mb-4">📱</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Hvilken telefon er dette?
          </h1>
          <p className="text-xl text-gray-600">
            Vælg om dette er din egen telefon eller barnets telefon
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card 
              className="bg-white/60 backdrop-blur-md border-4 border-white shadow-2xl p-8 hover:scale-105 transition-transform cursor-pointer"
              onClick={handleParentDevice}
            >
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg">
                  <Users className="w-20 h-20 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Min telefon
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Dette er min egen telefon hvor jeg vil administrere børnenes dagsplaner
                </p>
                <Button 
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleParentDevice();
                  }}
                >
                  Fortsæt som forælder
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card 
              className="bg-white/60 backdrop-blur-md border-4 border-white shadow-2xl p-8 hover:scale-105 transition-transform cursor-pointer"
              onClick={handleChildDevice}
            >
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                  <Smartphone className="w-20 h-20 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Barnets telefon
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Dette er mit barns telefon som jeg vil knytte til en barneprofil
                </p>
                <Button 
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white rounded-2xl shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChildDevice();
                  }}
                >
                  Opsæt barnets telefon
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <Card className="bg-white/40 backdrop-blur-md border-2 border-white shadow-lg p-6 inline-block">
            <div className="space-y-2 text-left">
              <p className="text-gray-600">
                <span className="font-semibold">Min telefon:</span> Administrer alle børns planer, opret og rediger aktiviteter
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Barnets telefon:</span> Vælg hvilket barn telefonen tilhører, derefter logger barnet ind med PIN
              </p>
            </div>
          </Card>
        </motion.div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              ⚠️ Vigtigt!
            </DialogTitle>
            <DialogDescription className="text-lg pt-4 space-y-3">
              <p className="font-semibold text-gray-800">
                Dette vil knytte telefonen permanent til dit barn.
              </p>
              <p className="text-gray-700">
                Efter opsætningen:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Bliver du logget ud fra denne telefon</li>
                <li>Kun barnet kan logge ind med PIN-kode</li>
                <li>Telefonen fungerer som barnets personlige enhed</li>
              </ul>
              <p className="text-gray-600 text-sm pt-2">
                Er du sikker på at dette er barnets telefon?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 h-12 text-lg rounded-xl"
            >
              Annuller
            </Button>
            <Button
              onClick={confirmChildDevice}
              className="flex-1 h-12 text-lg bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white rounded-xl shadow-lg"
            >
              Ja, fortsæt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}