import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfDay } from "date-fns";
import { da } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Star, LogOut, Volume2, Calendar, Gift, Sparkles, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ActivityCard from "../components/ActivityCard";
import ProgressCircle from "../components/ProgressCircle";
import { Card } from "@/components/ui/card";

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

export default function ChildView() {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const [showFuture, setShowFuture] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentChild, setCurrentChild] = useState(null);
  const [selectedChildFilter, setSelectedChildFilter] = useState("me");
  const [siblings, setSiblings] = useState([]);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [parentUser, setParentUser] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const childSessionStr = sessionStorage.getItem('child_session');
    if (!childSessionStr) {
      navigate(createPageUrl("ChildLogin"));
      return;
    }
    
    try {
      const childSession = JSON.parse(childSessionStr);
      setCurrentChild(childSession);
      
      base44.entities.Child.filter({ 
        parent_id: childSession.parent_id
      }).then(setSiblings);

      base44.entities.User.filter({ id: childSession.parent_id }).then(users => {
        if (users.length > 0) {
          setParentUser(users[0]);
        }
      });
    } catch (e) {
      navigate(createPageUrl("ChildLogin"));
    }
  }, [navigate]);

  const { data: childData } = useQuery({
    queryKey: ['child-data', currentChild?.id],
    queryFn: async () => {
      if (!currentChild?.id) return null;
      const children = await base44.entities.Child.filter({ id: currentChild.id });
      return children[0] || null;
    },
    enabled: !!currentChild?.id,
  });

  const { data: rewards } = useQuery({
    queryKey: ['child-rewards', currentChild?.id],
    queryFn: async () => {
      if (!currentChild?.id) return [];
      return await base44.entities.Reward.filter({ 
        assigned_to_child_id: currentChild.id,
        is_active: true,
        claimed: false
      });
    },
    enabled: !!currentChild?.id,
    initialData: [],
  });

  const { data: todayActivities, isLoading: loadingToday } = useQuery({
    queryKey: ['activities-today', today, selectedChildFilter, currentChild?.id],
    queryFn: () => {
      const filter = { date: today };
      if (selectedChildFilter === "me") {
        filter.assigned_to_user_id = currentChild?.id;
      } else if (selectedChildFilter !== "all") {
        filter.assigned_to_user_id = selectedChildFilter;
      }
      return base44.entities.Activity.filter(filter, 'time');
    },
    enabled: !!currentChild,
    initialData: [],
  });

  const { data: futureActivities, isLoading: loadingFuture } = useQuery({
    queryKey: ['activities-future', currentChild?.id],
    queryFn: async () => {
      if (!currentChild) return [];
      
      const allFutureActivities = [];
      for (let i = 1; i <= 7; i++) {
        const futureDate = format(addDays(new Date(), i), "yyyy-MM-dd");
        const dayActivities = await base44.entities.Activity.filter({ 
          date: futureDate,
          assigned_to_user_id: currentChild.id 
        }, 'time');
        
        dayActivities.forEach(activity => {
          allFutureActivities.push({ ...activity, displayDate: futureDate });
        });
      }
      return allFutureActivities;
    },
    enabled: !!currentChild && showFuture,
    initialData: [],
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Activity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities-today'] });
      queryClient.invalidateQueries({ queryKey: ['activities-future'] });
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Child.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['child-data'] });
    },
  });

  const claimRewardMutation = useMutation({
    mutationFn: async ({ rewardId, pointsRequired, rewardTitle }) => {
      const newPoints = (childData?.total_points || 0) - pointsRequired;
      await base44.entities.Reward.update(rewardId, { claimed: true });
      await base44.entities.Child.update(currentChild.id, { total_points: newPoints });
      
      if (parentUser?.email) {
        await base44.integrations.Core.SendEmail({
          to: parentUser.email,
          subject: `🎉 ${currentChild.display_name} har indløst en præmie!`,
          body: `
Hej!

${currentChild.display_name} har lige indløst en præmie! 🎁

Præmie: ${rewardTitle}
Stjerner brugt: ${pointsRequired} ⭐
Stjerner tilbage: ${newPoints} ⭐

Log ind på Min Dagsplan for at se præmien og markere den som givet når I har leveret den.

Mvh,
Min Dagsplan
          `.trim()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['child-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['child-data'] });
    },
  });

  const handleComplete = async (activity) => {
    if (activity.assigned_to_user_id !== currentChild.id) {
      return;
    }
    
    await updateActivityMutation.mutateAsync({ 
      id: activity.id, 
      data: { completed: true } 
    });

    if (activity.activity_type === "bonus" && activity.points > 0) {
      const newTotalPoints = (childData?.total_points || 0) + activity.points;
      await updateChildMutation.mutateAsync({
        id: currentChild.id,
        data: { total_points: newTotalPoints }
      });
      setEarnedPoints(activity.points);
    }
    
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      setEarnedPoints(0);
    }, 3000);
  };

  const handleClaimReward = async (reward) => {
    if (confirm(`Er du sikker på at du vil bruge ${reward.points_required} stjerner på: ${reward.title}?`)) {
      await claimRewardMutation.mutateAsync({
        rewardId: reward.id,
        pointsRequired: reward.points_required,
        rewardTitle: reward.title
      });
      
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  const speakReward = (reward) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      let textToSpeak = `${reward.title}. `;
      if (reward.description) {
        textToSpeak += `${reward.description}. `;
      }
      textToSpeak += `Du skal bruge ${reward.points_required} ${reward.points_required === 1 ? 'stjerne' : 'stjerner'} for at få denne præmie.`;
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'da-DK';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const playRecordedAudio = (reward) => {
    if (reward.audio_url) {
      const audio = new Audio(reward.audio_url);
      setPlayingAudio(reward.id);
      
      audio.onended = () => {
        setPlayingAudio(null);
      };
      
      audio.onerror = () => {
        setPlayingAudio(null);
        alert("Kunne ikke afspille lydoptagelsen");
      };
      
      audio.play();
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('child_session');
    navigate(createPageUrl("ChildLogin"));
  };

  const speakWelcome = () => {
    if ('speechSynthesis' in window && currentChild) {
      const myActivitiesCount = todayActivities.filter(a => a.assigned_to_user_id === currentChild.id).length;
      const text = `Hej ${currentChild.display_name}! Velkommen til dagsplanen. Du har ${myActivitiesCount} aktiviteter i dag. ${
        siblings.length > 1 ? 'Du kan også se dine søskendes aktiviteter ved at skifte faner.' : ''
      }`;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'da-DK';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!currentChild) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <p className="text-xl">Indlæser...</p>
      </div>
    );
  }

  const myTodayActivities = todayActivities.filter(a => a.assigned_to_user_id === currentChild.id);
  const completedCount = myTodayActivities.filter(a => a.completed).length;
  const totalCount = myTodayActivities.length;

  const activitiesToDisplay = showFuture ? todayActivities : todayActivities;
  const currentPoints = childData?.total_points || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <header className="bg-white/40 backdrop-blur-md border-b-2 border-white/50 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-md">
            <div className="text-4xl">
              {avatarEmojis[currentChild.avatar] || "👤"}
            </div>
            <div>
              <p className="font-bold text-lg text-gray-800">
                {currentChild.display_name}
              </p>
              <p className="text-xs text-gray-500">Logget ind som barn</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={speakWelcome}
              variant="outline"
              size="icon"
              className="rounded-xl h-12 w-12"
              title="Lyt til oversigt"
            >
              <Volume2 className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="rounded-xl"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log ud
            </Button>
          </div>
        </div>
      </header>

      <div className="p-3 md:p-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                Hej {currentChild.display_name}! 🌟
              </h1>
              <div className="bg-yellow-100 px-4 py-2 rounded-2xl border-2 border-yellow-300 shadow-lg">
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-bold text-yellow-600">
                    {currentPoints}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xl text-gray-600">
              I dag, {format(new Date(), "EEEE d. MMMM", { locale: da })}
            </p>
          </motion.div>

          {rewards.length > 0 && selectedChildFilter === "me" && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Gift className="w-6 h-6 text-yellow-500" />
                  Dine præmier
                </h2>
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-2xl border-2 border-yellow-300">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                    <span className="font-bold text-yellow-700">
                      Du har {currentPoints} {currentPoints === 1 ? 'stjerne' : 'stjerner'}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 text-center">
                Dine stjerner kan bruges til ALLE præmier. Når du har nok stjerner, kan du vælge hvilken præmie du vil have! 🎁
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {rewards.map(reward => {
                  const progress = Math.min(100, (currentPoints / reward.points_required) * 100);
                  const pointsNeeded = Math.max(0, reward.points_required - currentPoints);
                  const canClaim = currentPoints >= reward.points_required;
                  
                  return (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Card className={`border-4 border-white shadow-xl p-6 ${
                        canClaim 
                          ? 'bg-gradient-to-br from-green-50 to-green-100 ring-4 ring-green-300' 
                          : 'bg-gradient-to-br from-yellow-50 to-orange-50'
                      }`}>
                        <div className="flex gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-4 mb-3">
                              <span className="text-5xl">{reward.icon}</span>
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-1">
                                  <h3 className="text-xl font-bold text-gray-800">{reward.title}</h3>
                                  <div className="flex gap-2">
                                    {reward.audio_url && (
                                      <Button
                                        onClick={() => playRecordedAudio(reward)}
                                        variant="outline"
                                        size="icon"
                                        className={`rounded-xl w-10 h-10 ${
                                          playingAudio === reward.id ? 'bg-purple-100 border-purple-400' : 'bg-white/80'
                                        }`}
                                      >
                                        <Mic className={`w-5 h-5 ${playingAudio === reward.id ? 'text-purple-600 animate-pulse' : 'text-purple-600'}`} />
                                      </Button>
                                    )}
                                    <Button
                                      onClick={() => speakReward(reward)}
                                      variant="outline"
                                      size="icon"
                                      className="rounded-xl w-10 h-10 bg-white/80"
                                    >
                                      <Volume2 className="w-5 h-5 text-blue-600" />
                                    </Button>
                                  </div>
                                </div>
                                {reward.description && (
                                  <p className="text-gray-600 text-sm mb-3">{reward.description}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="bg-white/60 rounded-xl p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-gray-700">Koster</span>
                                <span className="text-lg font-bold text-yellow-600">
                                  {reward.points_required} ⭐
                                </span>
                              </div>
                              <div className="w-full bg-gray-300 rounded-full h-3 mb-3">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{ duration: 0.5 }}
                                  className={`h-3 rounded-full ${
                                    canClaim 
                                      ? 'bg-gradient-to-r from-green-400 to-green-500' 
                                      : 'bg-gradient-to-r from-yellow-400 to-orange-400'
                                  }`}
                                />
                              </div>
                              {canClaim ? (
                                <p className="text-center text-sm font-semibold text-gray-700 mb-2">
                                  Mangler {pointsNeeded} {pointsNeeded === 1 ? 'stjerne' : 'stjerner'} 💪
                                </p>
                              ) : (
                                <p className="text-center text-sm font-semibold text-gray-700 mb-2">
                                  Mangler {pointsNeeded} {pointsNeeded === 1 ? 'stjerne' : 'stjerner'} 💪
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {reward.image_url && (
                            <div className="flex-shrink-0">
                              <img
                                src={reward.image_url}
                                alt={reward.title}
                                className="w-48 h-40 rounded-2xl object-cover shadow-md border-2 border-white/60"
                              />
                            </div>
                          )}
                        </div>
                        
                        {canClaim && (
                          <Button
                            onClick={() => handleClaimReward(reward)}
                            disabled={claimRewardMutation.isPending}
                            className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-lg font-bold"
                          >
                            <Gift className="w-5 h-5 mr-2" />
                            Indløs præmie! 🎉
                          </Button>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {siblings.length > 1 && (
            <Tabs value={selectedChildFilter} onValueChange={setSelectedChildFilter} className="mb-6">
              <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm rounded-2xl p-2">
                <TabsTrigger value="me" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                  Mine opgaver
                </TabsTrigger>
                {siblings.filter(s => s.id !== currentChild.id).map(sibling => (
                  <TabsTrigger 
                    key={sibling.id} 
                    value={sibling.id}
                    className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                  >
                    {avatarEmojis[sibling.avatar]} {sibling.display_name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {selectedChildFilter === "me" && totalCount > 0 && (
            <div className="mb-8 flex justify-center">
              <ProgressCircle completed={completedCount} total={totalCount} />
            </div>
          )}

          <div className="mb-6 flex justify-center">
            <Button
              onClick={() => setShowFuture(!showFuture)}
              variant="outline"
              className="rounded-2xl h-14 px-8 text-lg font-semibold bg-white/60 backdrop-blur-sm"
            >
              <Calendar className="w-5 h-5 mr-2" />
              {showFuture ? 'Skjul kommende dage' : 'Vis kommende dage'}
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">I dag</h2>
              {todayActivities.length === 0 && !loadingToday && (
                <Card className="bg-white/40 backdrop-blur-md border-2 border-white shadow-xl p-12 text-center">
                  <p className="text-6xl mb-4">🎉</p>
                  <p className="text-2xl font-semibold text-gray-700">Ingen aktiviteter i dag!</p>
                </Card>
              )}
              <div className="space-y-4">
                {todayActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onComplete={handleComplete}
                    isChildView={true}
                  />
                ))}
              </div>
            </div>

            {showFuture && futureActivities.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Kommende dage</h2>
                {Object.entries(
                  futureActivities.reduce((acc, activity) => {
                    const date = activity.displayDate;
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(activity);
                    return acc;
                  }, {})
                ).map(([date, activities]) => (
                  <div key={date} className="mb-6">
                    <h3 className="text-xl font-bold text-gray-700 mb-3">
                      {format(new Date(date), "EEEE d. MMMM", { locale: da })}
                    </h3>
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <ActivityCard
                          key={activity.id}
                          activity={activity}
                          onComplete={null}
                          isChildView={false}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <div className="bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 rounded-full p-12 shadow-2xl">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Star className="w-24 h-24 text-white mx-auto fill-white" />
                </motion.div>
                <p className="text-4xl font-bold text-white mt-4">
                  {earnedPoints > 0 ? `+${earnedPoints} ⭐ Godt klaret! 🎉` : 'Godt klaret! 🎉'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}