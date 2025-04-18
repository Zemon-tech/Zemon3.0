"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, AlertCircle, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export function AddChatParticipants({ open, onOpenChange, chatId, onAddParticipants }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { user: currentUser } = useAuth();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      fetchAllUsers();
      setSelectedUsers([]);
      setSuccess(false);
      setError(null);
    }
  }, [open, chatId]);

  // Function to fetch all users not already in the chat
  const fetchAllUsers = async () => {
    if (!currentUser || !chatId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // First get all current chat participants
      const { data: participants, error: memberError } = await supabase
        .from('ai_chat_participants')
        .select('user_id')
        .eq('chat_id', chatId);
      
      if (memberError) throw memberError;
      
      const participantIds = participants.map(p => p.user_id);
      
      // Then get all users not in this chat
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .not('id', 'in', participantIds.length > 0 ? `(${participantIds.join(',')})` : '(null)')
        .order('name');
      
      if (error) throw error;
      setAllUsers(data || []);
      setUserResults(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Search for users as the user types
  useEffect(() => {
    if (!searchTerm.trim()) {
      setUserResults(allUsers);
      return;
    }
    
    setIsSearching(true);
    try {
      // Filter the already fetched users
      const filteredUsers = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setUserResults(filteredUsers);
    } catch (error) {
      console.error('Error filtering users:', error.message);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, allUsers]);

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleAddParticipants = async () => {
    if (selectedUsers.length === 0) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Create array of objects for the insert
      const participants = selectedUsers.map(userId => ({
        chat_id: chatId,
        user_id: userId,
        can_edit: false
      }));
      
      // Insert all participants
      const { error } = await supabase
        .from('ai_chat_participants')
        .insert(participants);
      
      if (error) throw error;
      
      setSuccess(true);
      
      // Call the callback if provided
      if (onAddParticipants) {
        onAddParticipants(selectedUsers);
      }
      
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error('Error adding participants:', error.message);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return 'U';
    
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share AI Chat</DialogTitle>
          <DialogDescription>
            Select users to share this AI chat with.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-4 py-3 rounded-md flex items-center text-sm text-red-800 dark:text-red-300">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 px-4 py-3 rounded-md flex items-center text-sm text-green-800 dark:text-green-300">
              <Check className="h-4 w-4 mr-2 flex-shrink-0" />
              <p>Users added successfully!</p>
            </div>
          )}
        
          <div className="grid gap-2">
            <Label htmlFor="user-search">Search users:</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="user-search" 
                placeholder="Search by name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                autoComplete="off"
              />
            </div>
          </div>
          
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-2">Loading users...</div>
            ) : isSearching ? (
              <div className="text-center py-2">Searching...</div>
            ) : userResults.length > 0 ? (
              userResults.map(user => (
                <div 
                  key={user.id}
                  className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => toggleUserSelection(user.id)}
                >
                  <Checkbox 
                    id={`user-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => toggleUserSelection(user.id)}
                    className="mr-2"
                  />
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-2 text-muted-foreground">No users found</div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            variant="outline"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddParticipants}
            disabled={selectedUsers.length === 0 || isSubmitting}
          >
            {isSubmitting ? "Adding..." : `Share with ${selectedUsers.length} ${selectedUsers.length === 1 ? 'User' : 'Users'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 