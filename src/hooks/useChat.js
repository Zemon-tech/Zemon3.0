"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useChat() {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch channels and direct messages
  useEffect(() => {
    const fetchChannels = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Direct query for channels to avoid the recursive policy issue
        // This is a workaround until the policy is fixed
        const { data, error } = await supabase.rpc('get_user_channels', { 
          user_id: user.id 
        });
        
        if (error) {
          // Fallback to simpler query if RPC doesn't exist
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('channels')
            .select('id, name, description, type, is_private, created_by');
          
          if (fallbackError) throw fallbackError;
          
          // Get channel memberships separately
          const { data: memberships, error: membershipError } = await supabase
            .from('channel_members')
            .select('channel_id')
            .eq('user_id', user.id);
            
          if (membershipError) throw membershipError;
          
          // Filter channels user is a member of
          const userChannelIds = memberships.map(m => m.channel_id);
          const userChannels = fallbackData.filter(c => userChannelIds.includes(c.id));
          
          // Process data
          const groupChannels = userChannels.filter(c => c.type !== 'direct');
          const dmChannels = userChannels.filter(c => c.type === 'direct');
          
          setChannels(groupChannels);
          setDirectMessages(dmChannels);
          
          // Set first channel as active if none is active
          if (!activeChannel && groupChannels.length > 0) {
            setActiveChannel(groupChannels[0]);
          }
          
          setError(null);
        } else {
          // Process data from RPC call
          const groupChannels = data.filter(c => c.type !== 'direct');
          const dmChannels = data.filter(c => c.type === 'direct');
          
          setChannels(groupChannels);
          setDirectMessages(dmChannels);
          
          // Set first channel as active if none is active
          if (!activeChannel && groupChannels.length > 0) {
            setActiveChannel(groupChannels[0]);
          }
          
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching channels:', error.message);
        setError(error.message);
        
        // Set dummy data for demonstration if error occurs
        if (process.env.NODE_ENV === 'development') {
          const dummyChannels = [
            { id: '1', name: 'general', type: 'public', is_private: false },
            { id: '2', name: 'random', type: 'public', is_private: false },
          ];
          
          setChannels(dummyChannels);
          
          if (!activeChannel) {
            setActiveChannel(dummyChannels[0]);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannels();
    
    // Subscribe to channel updates
    const channelsSubscription = supabase
      .channel('public:channels')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'channel_members',
        filter: `user_id=eq.${user?.id}` 
      }, () => {
        fetchChannels();
      })
      .subscribe();
      
    return () => {
      channelsSubscription.unsubscribe();
    };
  }, [user, activeChannel]);
  
  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, role');
        
        if (error) throw error;
        
        // Convert to object for easy lookup
        const usersMap = {};
        data.forEach(u => {
          // Make sure we have a proper name, not just email
          if (!u.name || u.name.trim() === '' || u.name.includes('@')) {
            // Format name from email: convert johndoe@example.com to John Doe
            const emailName = u.email.split('@')[0] || 'User';
            const formattedName = emailName
              .replace(/[._-]/g, ' ') // Replace dots, underscores, hyphens with spaces
              .replace(/\d+/g, '') // Remove numbers
              .split(' ')
              .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()) // Capitalize each part
              .join(' ')
              .trim() || 'User';
              
            u.name = formattedName;
          }
          usersMap[u.id] = u;
        });
        
        setUsers(usersMap);
      } catch (error) {
        console.error('Error fetching users:', error.message);
        setError(error.message);
      }
    };
    
    fetchUsers();
  }, [user]);
  
  // Fetch messages for active channel
  useEffect(() => {
    if (!activeChannel || !user) return;
    
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('channel_id', activeChannel.id)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        setMessages(data || []);
        
        // Update last read timestamp
        await supabase
          .from('channel_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('channel_id', activeChannel.id)
          .eq('user_id', user.id);
          
      } catch (error) {
        console.error('Error fetching messages:', error.message);
        setError(error.message);
        
        // Set dummy data for demonstration if error occurs
        if (process.env.NODE_ENV === 'development') {
          setMessages([
            { 
              id: '1', 
              content: 'This is a dummy message since we encountered an error fetching the real messages.', 
              user_id: user.id,
              created_at: new Date().toISOString()
            }
          ]);
        }
      }
    };
    
    fetchMessages();
    
    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel(`messages:${activeChannel.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `channel_id=eq.${activeChannel.id}` 
      }, payload => {
        setMessages(current => [...current, payload.new]);
      })
      .subscribe();
      
    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [activeChannel, user]);
  
  // Send a message
  const sendMessage = async (content) => {
    if (!content.trim() || !activeChannel || !user) {
      return { success: false, error: 'Missing content, channel, or user' };
    }
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content,
          channel_id: activeChannel.id,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, message: data };
    } catch (error) {
      console.error('Error sending message:', error.message);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };
  
  // Create a new channel
  const createChannel = async (name, type = 'group', isPrivate = false) => {
    if (!name.trim() || !user) {
      return { success: false, error: 'Missing name or user' };
    }
    
    try {
      // Create channel using stored procedure to bypass RLS
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_channel', { 
        channel_name: name,
        channel_type: type,
        is_private: isPrivate
      });
      
      if (!rpcError && rpcData) {
        setActiveChannel(rpcData);
        return { success: true, channel: rpcData };
      }
      
      // Fallback to direct insert
      const { data, error } = await supabase
        .from('channels')
        .insert({
          name,
          type,
          is_private: isPrivate,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      setActiveChannel(data);
      return { success: true, channel: data };
    } catch (error) {
      console.error('Error creating channel:', error.message);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };
  
  // Create a direct message channel
  const createDirectMessage = async (otherUserId) => {
    if (!otherUserId || !user) {
      return { success: false, error: 'Missing user IDs' };
    }
    
    // Sort IDs to ensure consistent channel naming
    const ids = [user.id, otherUserId].sort();
    const channelName = `${ids[0]}:${ids[1]}`;
    
    try {
      // Check if DM channel already exists
      const { data: existingChannels, error: searchError } = await supabase
        .from('channels')
        .select('*')
        .eq('type', 'direct')
        .eq('name', channelName);
      
      if (searchError) throw searchError;
      
      // Return existing channel if found
      if (existingChannels && existingChannels.length > 0) {
        setActiveChannel(existingChannels[0]);
        return { success: true, channel: existingChannels[0] };
      }
      
      // Try to use a stored procedure first (to avoid RLS issues)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_user_channel', { 
          other_user_id: otherUserId,
          channel_name: channelName
        });
        
        if (!rpcError && rpcData) {
          setActiveChannel(rpcData);
          return { success: true, channel: rpcData };
        }
      } catch (rpcError) {
        console.warn('RPC not available, falling back to standard insert:', rpcError.message);
        // Continue with standard insert if RPC fails or doesn't exist
      }
      
      // Create new DM channel using standard insert
      const { data, error } = await supabase
        .from('channels')
        .insert({
          name: channelName,
          type: 'direct',
          is_private: true,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add the other user to the channel
      const { error: memberError } = await supabase
        .from('channel_members')
        .insert({
          channel_id: data.id,
          user_id: otherUserId,
          is_admin: false
        });
      
      if (memberError) throw memberError;
      
      setActiveChannel(data);
      return { success: true, channel: data };
    } catch (error) {
      console.error('Error creating direct message:', error.message);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };
  
  // Get channel name for display
  const getChannelDisplayName = (channel) => {
    if (!channel) return '';
    
    if (channel.type === 'direct') {
      // For DMs, find the other user's name
      const memberIds = channel.name ? channel.name.split(':') : [];
      const otherUserId = memberIds.find(id => id !== user?.id);
      const otherUser = users[otherUserId];
      
      // If we have the user object and it has a name property, use that
      if (otherUser && otherUser.name) {
        return otherUser.name;
      }
      
      // Fallback to a generic name if no user data is available
      return 'Direct Message';
    }
    
    return channel.name;
  };
  
  // Get user initials for avatar
  const getUserInitials = (userId) => {
    const userData = users[userId];
    if (!userData || !userData.name) return 'U';
    
    return userData.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return {
    channels,
    directMessages,
    activeChannel,
    setActiveChannel,
    messages,
    users,
    isLoading,
    error,
    sendMessage,
    createChannel,
    createDirectMessage,
    getChannelDisplayName,
    getUserInitials
  };
} 