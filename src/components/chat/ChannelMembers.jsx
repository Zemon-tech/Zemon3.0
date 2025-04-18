"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export function ChannelMembers({ open, onOpenChange, channelId, channelName }) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (open && channelId) {
      fetchMembers();
    }
  }, [open, channelId]);

  const fetchMembers = async () => {
    if (!channelId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to use the RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_channel_members', { 
        channel_id: channelId,
        user_id: currentUser.id
      });
      
      if (!rpcError && rpcData) {
        setMembers(rpcData);
      } else {
        // Fallback to direct query
        const { data: memberData, error: memberError } = await supabase
          .from('channel_members')
          .select('*, user:users(id, name, email)')
          .eq('channel_id', channelId)
          .order('is_admin', { ascending: false });
          
        if (memberError) throw memberError;
        
        // Format the data to match the RPC structure
        const formattedMembers = memberData.map(m => ({
          member_id: m.user.id,
          member_name: m.user.name,
          member_email: m.user.email,
          is_admin: m.is_admin,
          joined_at: m.joined_at
        }));
        
        setMembers(formattedMembers);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Could not load channel members. Please try again.');
    } finally {
      setIsLoading(false);
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
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Channel Members</DialogTitle>
          {channelName && (
            <DialogDescription>
              Members of #{channelName}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-4 py-3 rounded-md flex items-center text-sm text-red-800 dark:text-red-300">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <div className="py-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No members found</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto divide-y">
              {members.map(member => (
                <div key={member.member_id} className="flex items-center justify-between py-3 px-1">
                  <div className="flex items-center">
                    <Avatar className="h-9 w-9 mr-3">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getUserInitials(member.member_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center">
                        <p className="font-medium">{member.member_name}</p>
                        {member.is_admin && (
                          <div className="ml-2 flex items-center text-xs text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950/50 px-2 py-0.5 rounded-full">
                            <Shield className="h-3 w-3 mr-1 inline-block" />
                            Admin
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{member.member_email}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Joined {formatDate(member.joined_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 