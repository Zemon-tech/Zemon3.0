"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { createChatSession, generateResponse, generateChatTitle } from '@/lib/gemini';

export function useAiChat() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [chatSession, setChatSession] = useState(null);
  
  // Fetch user's AI chats
  useEffect(() => {
    const fetchChats = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('ai_chats')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        setChats(data || []);
        
        // Set first chat as active if none is active
        if (!activeChat && data && data.length > 0) {
          setActiveChat(data[0]);
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching AI chats:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
    
    // Subscribe to chat updates
    const chatsSubscription = supabase
      .channel('ai_chats_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'ai_chats'
      }, () => {
        fetchChats();
      })
      .subscribe();
      
    return () => {
      chatsSubscription.unsubscribe();
    };
  }, [user, activeChat]);
  
  // Fetch messages for active chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChat || !user) {
        setMessages([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('ai_messages')
          .select('*, user:users(id, name)')
          .eq('chat_id', activeChat.id)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        setMessages(data || []);
        
        // Initialize a new chat session
        initializeChatSession(data || []);
        
        // Fetch participants
        fetchParticipants();
        
        setError(null);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError(error.message);
      }
    };
    
    const fetchParticipants = async () => {
      if (!activeChat) return;
      
      try {
        const { data, error } = await supabase
          .from('ai_chat_participants')
          .select('*, user:users(id, name, email)')
          .eq('chat_id', activeChat.id);
        
        if (error) throw error;
        
        setParticipants(data || []);
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    };
    
    fetchMessages();
    
    // Subscribe to message updates
    const messagesSubscription = supabase
      .channel(`ai_messages:${activeChat?.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'ai_messages',
        filter: `chat_id=eq.${activeChat?.id}` 
      }, () => {
        fetchMessages();
      })
      .subscribe();
      
    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [activeChat, user]);
  
  // Initialize chat session with history
  const initializeChatSession = useCallback(async (messageHistory) => {
    try {
      const session = await createChatSession();
      
      // Reconstruct history in Gemini's format
      for (const msg of messageHistory) {
        if (msg.is_ai) {
          // Skip as we only need to provide user messages
          continue;
        }
        
        // Add user messages to session
        await session.sendMessage(msg.content);
        
        // Skip to next message if there's no AI response after this
        const nextIndex = messageHistory.indexOf(msg) + 1;
        if (nextIndex >= messageHistory.length || !messageHistory[nextIndex].is_ai) {
          continue;
        }
      }
      
      setChatSession(session);
    } catch (error) {
      console.error('Error initializing chat session:', error);
      setError('Failed to initialize AI. Please try again.');
    }
  }, []);
  
  // Create a new AI chat
  const createChat = async (initialPrompt) => {
    if (!initialPrompt?.trim() || !user) {
      return { success: false, error: 'Missing prompt or user' };
    }
    
    setIsSending(true);
    
    try {
      // Generate a title for the chat
      const title = await generateChatTitle(initialPrompt);
      
      // Create the chat
      const { data: chat, error: chatError } = await supabase
        .from('ai_chats')
        .insert({
          title,
          created_by: user.id,
          privacy: 'private'
        })
        .select()
        .single();
      
      if (chatError) throw chatError;
      
      // Add the user's message
      const { data: userMessage, error: userMsgError } = await supabase
        .from('ai_messages')
        .insert({
          chat_id: chat.id,
          user_id: user.id,
          is_ai: false,
          content: initialPrompt
        })
        .select()
        .single();
      
      if (userMsgError) throw userMsgError;
      
      // Get response from AI
      const aiResponse = await generateResponse(initialPrompt);
      
      // Add the AI's response
      const { error: aiMsgError } = await supabase
        .from('ai_messages')
        .insert({
          chat_id: chat.id,
          user_id: null,
          is_ai: true,
          content: aiResponse
        });
      
      if (aiMsgError) throw aiMsgError;
      
      setActiveChat(chat);
      
      return { success: true, chat };
    } catch (error) {
      console.error('Error creating AI chat:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsSending(false);
    }
  };
  
  // Send a message to the AI
  const sendMessage = async (content) => {
    if (!content?.trim() || !activeChat || !user) {
      return { success: false, error: 'Missing content, chat, or user' };
    }
    
    setIsSending(true);
    
    try {
      // Add the user's message
      const { data: userMessage, error: userMsgError } = await supabase
        .from('ai_messages')
        .insert({
          chat_id: activeChat.id,
          user_id: user.id,
          is_ai: false,
          content
        })
        .select()
        .single();
      
      if (userMsgError) throw userMsgError;
      
      // Get response from AI
      const aiResponse = await generateResponse(content, chatSession);
      
      // Add the AI's response
      const { error: aiMsgError } = await supabase
        .from('ai_messages')
        .insert({
          chat_id: activeChat.id,
          user_id: null,
          is_ai: true,
          content: aiResponse
        });
      
      if (aiMsgError) throw aiMsgError;
      
      // Update chat timestamp
      await supabase
        .from('ai_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeChat.id);
      
      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsSending(false);
    }
  };
  
  // Update chat privacy
  const updateChatPrivacy = async (chatId, privacy) => {
    if (!chatId || !privacy || !user) {
      return { success: false, error: 'Missing parameters' };
    }
    
    try {
      const { error } = await supabase
        .from('ai_chats')
        .update({ privacy })
        .eq('id', chatId)
        .eq('created_by', user.id);
      
      if (error) throw error;
      
      // Update the local state
      setChats(chats.map(chat => 
        chat.id === chatId ? { ...chat, privacy } : chat
      ));
      
      if (activeChat?.id === chatId) {
        setActiveChat({ ...activeChat, privacy });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating chat privacy:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };
  
  // Add participants to a chat
  const addParticipant = async (chatId, userId) => {
    if (!chatId || !userId || !user) {
      return { success: false, error: 'Missing parameters' };
    }
    
    try {
      const { error } = await supabase
        .from('ai_chat_participants')
        .insert({
          chat_id: chatId,
          user_id: userId,
          can_edit: false
        });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error adding participant:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };
  
  // Remove a participant from a chat
  const removeParticipant = async (chatId, userId) => {
    if (!chatId || !userId || !user) {
      return { success: false, error: 'Missing parameters' };
    }
    
    try {
      const { error } = await supabase
        .from('ai_chat_participants')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error removing participant:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };
  
  // Delete a chat
  const deleteChat = async (chatId) => {
    if (!chatId || !user) {
      return { success: false, error: 'Missing chat ID or user' };
    }
    
    try {
      const { error } = await supabase
        .from('ai_chats')
        .delete()
        .eq('id', chatId)
        .eq('created_by', user.id);
      
      if (error) throw error;
      
      // Update local state
      setChats(chats.filter(chat => chat.id !== chatId));
      
      // If active chat was deleted, set active chat to null
      if (activeChat?.id === chatId) {
        setActiveChat(null);
        setMessages([]);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting chat:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };
  
  return {
    chats,
    activeChat,
    setActiveChat,
    messages,
    participants,
    isLoading,
    isSending,
    error,
    createChat,
    sendMessage,
    updateChatPrivacy,
    addParticipant,
    removeParticipant,
    deleteChat
  };
} 