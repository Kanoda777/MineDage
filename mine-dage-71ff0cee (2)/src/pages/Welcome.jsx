import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingSetup = async () => {
      // Tjek om telefonen allerede er sat op som barnets telefon
      const deviceChildId = localStorage.getItem('device_child_id');
      if (deviceChildId) {
        navigate(createPageUrl("ChildLogin"));
        return;
      }

      // Tjek om brugeren allerede er logget ind
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        navigate(createPageUrl("DeviceSelection"));
      }
    };
    checkExistingSetup();
  }, [navigate]);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("DeviceSelection"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="text-8xl mb-6">👋</div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-4">
            Velkommen!
          </h1>
          <p className="text-2xl text-gray-600 mb-2">Min Dagsplan</p>
          <p className="text-lg text-gray-500">
            En app der hjælper børn med ADHD og autisme
          </p>
        </motion.div>

        <Card className="bg-white/60 backdrop-blur-md border-4 border-white shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Kom i gang
            </h2>
            <p className="text-lg text-gray-600">
              Log ind for at oprette eller se dagsplaner
            </p>
          </div>

          <Button 
            onClick={handleLogin}
            size="lg"
            className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl shadow-lg"
          >
            Log ind med Google/Email
          </Button>

          <div className="mt-8 space-y-3 text-sm text-gray-600">
            <p className="flex items-start gap-2">
              <span className="text-lg">👨‍👩‍👧‍👦</span>
              <span>Forældre logger ind for at oprette og administrere børnenes planer</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-lg">📱</span>
              <span>Børn logger ind på deres egen telefon med PIN-kode</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-lg">🔗</span>
              <span>Alle telefoner deler samme data - ændringer synkroniseres automatisk</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}