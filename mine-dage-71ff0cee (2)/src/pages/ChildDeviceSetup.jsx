import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle } from "lucide-react";

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

export default function ChildDeviceSetup() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        navigate(createPageUrl("Welcome"));
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [navigate]);

  const { data: children } = useQuery({
    queryKey: ['children', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      return await base44.entities.Child.filter({ parent_id: currentUser.id });
    },
    enabled: !!currentUser,
    initialData: [],
  });

  const handleSelectChild = (child) => {
    localStorage.setItem('device_child_id', child.id);
    localStorage.setItem('device_parent_id', currentUser.id);
    sessionStorage.removeItem('child_session');
    
    // Log forælderen ud fra denne enhed, da det nu er barnets telefon
    base44.auth.logout(createPageUrl("ChildLogin"));
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(createPageUrl("DeviceSelection"))}
          className="mb-6 rounded-xl h-12 w-12"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Hvilket barn skal bruge denne telefon?
          </h1>
          <p className="text-xl text-gray-600">
            Vælg barnet som denne telefon skal være knyttet til
          </p>
        </motion.div>

        {children.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            {children.map((child, index) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="bg-white/60 backdrop-blur-md border-4 border-white shadow-xl p-6 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => handleSelectChild(child)}
                >
                  <div className="text-center">
                    <div className="text-8xl mb-4">
                      {avatarEmojis[child.avatar] || "👤"}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {child.display_name}
                    </h3>
                    <Button
                      className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectChild(child);
                      }}
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Vælg
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="bg-white/40 backdrop-blur-md border-2 border-white shadow-xl p-12 text-center">
            <p className="text-6xl mb-4">👨‍👩‍👧‍👦</p>
            <p className="text-2xl font-semibold text-gray-700 mb-4">
              Ingen børneprofiler fundet
            </p>
            <p className="text-gray-600 mb-6">
              Du skal først oprette en barneprofil på din egen telefon
            </p>
            <Button
              onClick={() => navigate(createPageUrl("ParentDashboard"))}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl shadow-lg"
            >
              Gå til forældreoversigt
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}