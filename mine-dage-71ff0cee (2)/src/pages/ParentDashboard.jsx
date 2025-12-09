import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import { da } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ActivityCard from "@/components/ActivityCard";
import EditActivityDialog from "@/components/EditActivityDialog";
import DeleteActivityDialog from "@/components/DeleteActivityDialog";
import { motion } from "framer-motion";

export default function ParentDashboard() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [viewMode, setViewMode] = useState("day");
  const [currentUser, setCurrentUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [deletingActivity, setDeletingActivity] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(async (user) => {
      setCurrentUser(user);
      const kids = await base44.entities.Child.filter({ parent_id: user.id });
      setChildren(kids);
      if (kids.length > 0 && !selectedChild) {
        setSelectedChild(kids[0]);
      }
    });
  }, []);

  const weekStart = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(selectedDate), { weekStartsOn: 1 });

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', selectedDate, selectedChild?.id, viewMode, weekStart, weekEnd],
    queryFn: async () => {
      if (!selectedChild) return [];
      
      if (viewMode === "week") {
        const allActivities = [];
        for (let i = 0; i < 7; i++) {
          const date = format(addDays(weekStart, i), "yyyy-MM-dd");
          const dayActivities = await base44.entities.Activity.filter({ 
            date,
            assigned_to_user_id: selectedChild.id 
          }, 'time');
          allActivities.push(...dayActivities);
        }
        return allActivities;
      } else {
        return await base44.entities.Activity.filter({ 
          date: selectedDate,
          assigned_to_user_id: selectedChild.id 
        }, 'time');
      }
    },
    enabled: !!selectedChild,
    initialData: [],
  });

  const deleteActivityMutation = useMutation({
    mutationFn: (id) => base44.entities.Activity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Activity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setEditingActivity(null);
    },
  });

  const handleDelete = (activity) => {
    setDeletingActivity(activity);
  };

  const confirmDelete = async (idOrSeriesId, type) => {
    if (type === 'single') {
      await deleteActivityMutation.mutateAsync(idOrSeriesId);
    } else if (type === 'series') {
      // Delete all future activities in this series
      const currentActivityDate = deletingActivity.date;
      
      // First find all future activities in series
      const futureActivities = await base44.entities.Activity.filter({
        series_id: idOrSeriesId,
        // We handle date filtering in memory since complex queries might be limited
      });
      
      // Filter for activities on or after the current date
      const toDelete = futureActivities.filter(a => a.date >= currentActivityDate);
      
      // Delete them one by one (parallelized)
      await Promise.all(toDelete.map(a => base44.entities.Activity.delete(a.id)));
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    }
    setDeletingActivity(null);
  };

  const handleToggleComplete = async (activity) => {
    await updateActivityMutation.mutateAsync({
      id: activity.id,
      data: { completed: !activity.completed }
    });
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
  };

  const handleSaveEdit = async (updatedData) => {
    await updateActivityMutation.mutateAsync({
      id: editingActivity.id,
      data: updatedData
    });
  };

  const getActivitiesForDate = (date) => {
    return activities.filter(a => a.date === format(date, "yyyy-MM-dd"));
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
    <div className="min-h-screen p-2 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col justify-between items-start mb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Forældreoversigt
            </h1>
            <p className="text-gray-600">Administrer dagens aktiviteter</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              onClick={() => setViewMode("day")}
              className="rounded-2xl h-14 px-6"
            >
              📅 Dag
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              onClick={() => setViewMode("week")}
              className="rounded-2xl h-14 px-6"
            >
              📆 Uge
            </Button>
            <Link to={createPageUrl("ManageChildren")}>
              <Button variant="outline" className="rounded-2xl h-14 px-6">
                👨‍👩‍👧‍👦 Administrer Børn
              </Button>
            </Link>
            <Link to={createPageUrl("ManageRewards")}>
              <Button variant="outline" className="rounded-2xl h-14 px-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 hover:from-yellow-100 hover:to-orange-100">
                <Gift className="w-5 h-5 mr-2 text-yellow-600" />
                <span className="text-yellow-700 font-semibold">Præmier</span>
              </Button>
            </Link>
            <Link to={createPageUrl("CreateActivity")}>
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl shadow-lg h-14 px-8">
                <Plus className="w-5 h-5 mr-2" />
                Ny Aktivitet
              </Button>
            </Link>
          </div>
        </div>

        {children.length > 0 && (
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {children.map((child) => (
              <Button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                variant={selectedChild?.id === child.id ? "default" : "outline"}
                className={`rounded-2xl h-16 px-6 flex items-center gap-3 whitespace-nowrap ${
                  selectedChild?.id === child.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    : ""
                }`}
              >
                <span className="text-2xl">{avatarEmojis[child.avatar] || "👤"}</span>
                <span className="font-semibold">{child.display_name}</span>
              </Button>
            ))}
          </div>
        )}

        {children.length === 0 && (
          <Card className="bg-white/40 backdrop-blur-md border-2 border-white shadow-xl p-12 text-center mb-8">
            <p className="text-6xl mb-4">👨‍👩‍👧‍👦</p>
            <p className="text-2xl font-semibold text-gray-700 mb-2">
              Opret først en barneprofil
            </p>
            <p className="text-gray-500 mb-6">
              Du skal oprette mindst én barneprofil før du kan planlægge aktiviteter
            </p>
            <Link to={createPageUrl("ManageChildren")}>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                Opret Barneprofil
              </Button>
            </Link>
          </Card>
        )}

        {selectedChild && viewMode === "day" && (
          <>
            <Card className="bg-white/60 backdrop-blur-md border-2 border-white shadow-xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), "yyyy-MM-dd"))}
                  className="rounded-xl h-12 w-12"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">
                    {format(new Date(selectedDate), "EEEE", { locale: da })}
                  </p>
                  <p className="text-gray-600">
                    {format(new Date(selectedDate), "d. MMMM yyyy", { locale: da })}
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), "yyyy-MM-dd"))}
                  className="rounded-xl h-12 w-12"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>

              {activities.length > 0 && (
                <div className="mt-6 text-center">
                  <p className="text-lg text-gray-600">
                    <span className="font-bold text-green-600">{activities.filter(a => a.completed).length}</span> af{" "}
                    <span className="font-bold">{activities.length}</span> aktiviteter gennemført
                  </p>
                </div>
              )}
            </Card>

            <div className="grid gap-6">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <ActivityCard activity={activity} isChildView={false} />
                  <div className="absolute -bottom-3 -right-3 flex gap-2 z-10">
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(activity)}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl shadow-xl h-14 px-6 border-4 border-white font-bold"
                    >
                      <Edit className="w-5 h-5 mr-2" />
                      Rediger
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleToggleComplete(activity)}
                      className="bg-white hover:bg-gray-50 rounded-2xl shadow-xl h-14 px-4 border-4 border-white"
                    >
                      {activity.completed ? "↩️" : "✅"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(activity)}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-xl h-14 px-4 border-4 border-white"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              ))}

              {activities.length === 0 && !isLoading && (
                <Card className="bg-white/40 backdrop-blur-md border-2 border-white shadow-xl p-12 text-center">
                  <p className="text-6xl mb-4">📅</p>
                  <p className="text-2xl font-semibold text-gray-700 mb-2">
                    Ingen aktiviteter planlagt
                  </p>
                  <p className="text-gray-500 mb-6">
                    Opret den første aktivitet for denne dag for {selectedChild.display_name}
                  </p>
                  <Link to={createPageUrl("CreateActivity")}>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl shadow-lg">
                      <Plus className="w-5 h-5 mr-2" />
                      Opret Aktivitet
                    </Button>
                  </Link>
                </Card>
              )}
            </div>
          </>
        )}

        {selectedChild && viewMode === "week" && (
          <>
            <Card className="bg-white/60 backdrop-blur-md border-2 border-white shadow-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 7), "yyyy-MM-dd"))}
                  className="rounded-xl h-12 w-12"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">
                    Uge {format(weekStart, "I", { locale: da })}
                  </p>
                  <p className="text-gray-600">
                    {format(weekStart, "d. MMM", { locale: da })} - {format(weekEnd, "d. MMM yyyy", { locale: da })}
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 7), "yyyy-MM-dd"))}
                  className="rounded-xl h-12 w-12"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </Card>

            <div className="grid gap-8">
              {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                const currentDay = addDays(weekStart, dayOffset);
                const dayActivities = getActivitiesForDate(currentDay);
                
                return (
                  <div key={dayOffset}>
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-2xl font-bold text-gray-800">
                        {format(currentDay, "EEEE", { locale: da })}
                      </h3>
                      <span className="text-gray-500">
                        {format(currentDay, "d. MMM", { locale: da })}
                      </span>
                      {dayActivities.length > 0 && (
                        <span className="ml-auto text-sm text-gray-600">
                          {dayActivities.filter(a => a.completed).length}/{dayActivities.length} færdige
                        </span>
                      )}
                    </div>
                    
                    <div className="grid gap-4">
                      {dayActivities.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative"
                        >
                          <ActivityCard activity={activity} isChildView={false} />
                          <div className="absolute -bottom-3 -right-3 flex gap-2 z-10">
                            <Button
                              variant="outline"
                              onClick={() => handleEdit(activity)}
                              className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl shadow-xl h-14 px-6 border-4 border-white font-bold"
                            >
                              <Edit className="w-5 h-5 mr-2" />
                              Rediger
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleToggleComplete(activity)}
                              className="bg-white hover:bg-gray-50 rounded-2xl shadow-xl h-14 px-4 border-4 border-white"
                            >
                              {activity.completed ? "↩️" : "✅"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDelete(activity.id)}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-xl h-14 px-4 border-4 border-white"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                      
                      {dayActivities.length === 0 && (
                        <Card className="bg-white/20 backdrop-blur-sm border-2 border-white/50 p-6 text-center">
                          <p className="text-gray-500">Ingen aktiviteter</p>
                        </Card>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {editingActivity && (
        <EditActivityDialog
          activity={editingActivity}
          open={!!editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deletingActivity && (
        <DeleteActivityDialog
          activity={deletingActivity}
          open={!!deletingActivity}
          onClose={() => setDeletingActivity(null)}
          onDelete={confirmDelete}
        />
      )}
    </div>
  );
}