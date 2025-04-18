"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Check } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { AddChannelMembers } from "./AddChannelMembers";

export function CreateChannel({ open, onOpenChange }) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [newChannelId, setNewChannelId] = useState(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const { createChannel } = useChat();

  const resetForm = () => {
    setName("");
    setIsPrivate(false);
    setError(null);
    setSuccess(false);
    setNewChannelId(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    const { success, channel, error: channelError } = await createChannel(name, 'group', isPrivate);
    setIsSubmitting(false);
    
    if (success) {
      setSuccess(true);
      setNewChannelId(channel.id);
      // Don't close dialog yet to show success message and add members option
    } else {
      setError(channelError || 'Failed to create channel');
    }
  };

  const handleAddMembers = () => {
    setShowAddMembers(true);
  };

  // When the add members dialog is closed
  const handleAddMembersClose = (open) => {
    setShowAddMembers(open);
    if (!open) {
      // Close the create channel dialog after adding members
      setTimeout(() => {
        handleClose();
      }, 500);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a new channel</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-4 py-3 rounded-md flex items-center text-sm text-red-800 dark:text-red-300">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          {success ? (
            <div className="py-4">
              <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 px-4 py-3 rounded-md flex items-center text-sm text-green-800 dark:text-green-300 mb-4">
                <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                <p>Channel created successfully!</p>
              </div>
              <div className="flex flex-col space-y-2">
                <Button onClick={handleAddMembers}>
                  Add Members
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Skip for now
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="channel-name">Channel name</Label>
                  <Input 
                    id="channel-name" 
                    placeholder="e.g. marketing" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="private-channel"
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                  <Label htmlFor="private-channel">Make this channel private</Label>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={!name.trim() || isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Channel"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Separate dialog for adding members */}
      <AddChannelMembers
        open={showAddMembers}
        onOpenChange={handleAddMembersClose}
        channelId={newChannelId}
      />
    </>
  );
} 