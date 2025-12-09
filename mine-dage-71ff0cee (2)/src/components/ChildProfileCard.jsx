import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { motion } from "framer-motion";

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

export default function ChildProfileCard({ child, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="bg-white/60 backdrop-blur-md border-2 border-white shadow-xl p-6 hover:shadow-2xl transition-shadow">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-300 to-purple-300 flex items-center justify-center text-5xl shadow-lg">
            {avatarEmojis[child.avatar] || "👤"}
          </div>
          
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-800">{child.display_name || child.full_name}</h3>
            <p className="text-gray-600">PIN: ••••</p>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(child.id)}
            className="rounded-xl hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}