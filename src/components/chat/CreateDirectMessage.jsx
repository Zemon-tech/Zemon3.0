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
import { Search, AlertCircle } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export function CreateDirectMessage({ open, onOpenChange }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { createDirectMessage } = useChat();
  const { user: currentUser } = useAuth();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      fetchAllUsers();
    } else {
      setError(null);
    }
  }, [open, currentUser]);

  // Function to fetch all users
  const fetchAllUsers = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .neq('id', currentUser?.id)
        .order('name')
        .limit(50);
      
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

  const handleStartChat = async (userId) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { success, error: chatError } = await createDirectMessage(userId);
      
      if (!success) {
        if (chatError && chatError.includes('infinite recursion')) {
          setError('Unable to create chat due to a policy conflict. Please contact an administrator.');
        } else {
          setError(chatError || 'Failed to create chat. Please try again.');
        }
        return;
      }
      
      setSearchTerm("");
      onOpenChange(false);
    } catch (error) {
      console.error('Chat creation error:', error);
      setError('An unexpected error occurred. Please try again.');
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
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Select a user to start a conversation with.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-4 py-3 rounded-md flex items-center text-sm text-red-800 dark:text-red-300">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        
          <div className="grid gap-2">
            <Label htmlFor="user-search">To:</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="user-search" 
                placeholder="Search users..." 
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
                  onClick={() => !isSubmitting && handleStartChat(user.id)}
                >
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 