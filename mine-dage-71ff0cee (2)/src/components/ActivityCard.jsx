import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Sun, Utensils, Book, Bus, Home, Shirt, Moon, Play, School, Music, Palette, Bike, Radio, Tv, Volume2, Mic } from "lucide-react";
import { motion } from "framer-motion";

const iconMap = {
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

const colorMap = {
  blue: "from-blue-300 to-blue-400",
  orange: "from-orange-300 to-orange-400",
  purple: "from-purple-300 to-purple-400",
  green: "from-green-300 to-green-400",
  yellow: "from-yellow-300 to-yellow-400",
  pink: "from-pink-300 to-pink-400",
  red: "from-red-300 to-red-400"
};

const bgColorMap = {
  blue: "bg-blue-50",
  orange: "bg-orange-50",
  purple: "bg-purple-50",
  green: "bg-green-50",
  yellow: "bg-yellow-50",
  pink: "bg-pink-50",
  red: "bg-red-50"
};

export default function ActivityCard({ activity, onComplete, isChildView }) {
  const Icon = iconMap[activity.icon] || Sun;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const isBonus = activity.activity_type === "bonus";
  
  const speakActivity = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      setIsSpeaking(true);
      
      let textToSpeak = `${activity.title}. `;
      if (activity.description) {
        textToSpeak += `${activity.description}. `;
      }
      textToSpeak += `Tidspunkt klokken ${activity.time}. `;
      if (activity.duration_minutes) {
        textToSpeak += `Det tager ${activity.duration_minutes} minutter.`;
      }
      if (isBonus && activity.points) {
        textToSpeak += ` Denne opgave giver ${activity.points} ${activity.points === 1 ? 'stjerne' : 'stjerner'}.`;
      }
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'da-DK';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Din browser understøtter ikke oplæsning");
    }
  };

  const playRecordedAudio = () => {
    if (activity.audio_url) {
      const audio = new Audio(activity.audio_url);
      setIsPlayingAudio(true);
      
      audio.onended = () => {
        setIsPlayingAudio(false);
      };
      
      audio.onerror = () => {
        setIsPlayingAudio(false);
        alert("Kunne ikke afspille lydoptagelsen");
      };
      
      audio.play();
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className={`${bgColorMap[activity.color]} border-4 border-white shadow-xl overflow-hidden ${
        activity.completed ? 'opacity-60' : ''
      } ${isBonus ? 'ring-2 ring-yellow-400' : ''}`}>
        {isBonus && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-2 flex items-center justify-center gap-2">
            <span className="text-white font-bold text-sm">⭐ BONUS</span>
            {activity.points > 0 && (
              <span className="text-white font-bold text-sm">
                +{activity.points} {activity.points === 1 ? 'stjerne' : 'stjerner'}
              </span>
            )}
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${colorMap[activity.color]} flex items-center justify-center shadow-lg flex-shrink-0`}>
              <Icon className="w-10 h-10 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="flex-1 w-full">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-gray-800 leading-tight">{activity.title}</h3>
                    <div className="flex gap-2 flex-shrink-0">
                      {isChildView && (
                        <>
                          {activity.audio_url && (
                            <Button
                              onClick={playRecordedAudio}
                              variant="outline"
                              size="icon"
                              className={`rounded-2xl w-12 h-12 ${
                                isPlayingAudio ? 'bg-purple-100 border-purple-400' : 'bg-white/80'
                              }`}
                            >
                              <Mic className={`w-6 h-6 ${isPlayingAudio ? 'text-purple-600 animate-pulse' : 'text-purple-600'}`} />
                            </Button>
                          )}
                          <Button
                            onClick={speakActivity}
                            variant="outline"
                            size="icon"
                            className={`rounded-2xl w-12 h-12 ${
                              isSpeaking ? 'bg-blue-100 border-blue-400' : 'bg-white/80'
                            }`}
                          >
                            <Volume2 className={`w-6 h-6 ${isSpeaking ? 'text-blue-600 animate-pulse' : 'text-blue-600'}`} />
                          </Button>
                        </>
                      )}
                      {activity.completed && (
                        <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  
                  {activity.description && (
                    <p className="text-gray-600 text-lg mb-3">{activity.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl">
                      <span className="text-3xl">🕐</span>
                      <span className="font-bold text-lg text-gray-700">{activity.time}</span>
                    </div>
                    
                    {activity.duration_minutes && (
                      <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl">
                        <span className="text-3xl">⏱️</span>
                        <span className="font-bold text-lg text-gray-700">{activity.duration_minutes} min</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {activity.image_url && (
                  <div className="flex-shrink-0 mt-4 md:mt-0 md:ml-4 w-full md:w-auto">
                    <img
                      src={activity.image_url}
                      alt={activity.title}
                      className="w-full md:w-64 h-48 md:h-40 rounded-2xl object-cover shadow-md border-2 border-white/60"
                    />
                  </div>
                )}
                </div>
              
              {isChildView && !activity.completed && onComplete && (
                <Button
                  onClick={() => onComplete(activity)}
                  size="lg"
                  className={`w-full h-14 text-xl font-bold rounded-2xl shadow-lg ${
                    isBonus 
                      ? "bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white"
                      : "bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white"
                  }`}
                >
                  <CheckCircle className="w-6 h-6 mr-2" />
                  {isBonus ? `Færdig! Optjen ${activity.points} ⭐` : 'Jeg er færdig! 🎉'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}