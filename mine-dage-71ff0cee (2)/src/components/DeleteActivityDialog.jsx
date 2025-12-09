import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Copy } from "lucide-react";

export default function DeleteActivityDialog({ activity, open, onClose, onDelete }) {
  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Slet aktivitet</DialogTitle>
          <DialogDescription>
            Hvordan vil du slette "{activity.title}"?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            onClick={() => onDelete(activity.id, 'single')}
            className="justify-start h-auto py-4 px-6"
          >
            <Trash2 className="w-5 h-5 mr-3 text-red-500" />
            <div className="text-left">
              <div className="font-semibold">Slet kun denne</div>
              <div className="text-sm text-gray-500">Fjerner kun aktiviteten for denne dag</div>
            </div>
          </Button>

          {activity.series_id && (
            <Button
              variant="outline"
              onClick={() => onDelete(activity.series_id, 'series')}
              className="justify-start h-auto py-4 px-6 bg-red-50 border-red-200 hover:bg-red-100"
            >
              <Copy className="w-5 h-5 mr-3 text-red-600" />
              <div className="text-left">
                <div className="font-semibold text-red-700">Slet alle fremtidige</div>
                <div className="text-sm text-red-600">Sletter denne og alle kommende gentagelser</div>
              </div>
            </Button>
          )}
        </div>

        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Annuller
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}