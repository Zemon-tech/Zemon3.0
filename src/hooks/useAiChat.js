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
  
  // Initialize chat session with history - moved before useEffect
  const initializeChatSession = useCallback(async (messageHistory) => {
    try {
      const session = await createChatSession();
      
      // Filter to just get user messages
      const userMessages = messageHistory.filter(msg => !msg.is_ai);
      
      // If there are no messages or only one, just initialize without history
      if (userMessages.length <= 1) {
        setChatSession(session);
        return;
      }
      
      // Only process the most recent message to avoid rate limits
      // This is a compromise: we don't get full history but avoid rate limits
      const lastUserMessage = userMessages[userMessages.length - 1];
      
      try {
        // Add just the last user message to the session
        await session.sendMessage(lastUserMessage.content);
      } catch (error) {
        // If we hit rate limits, just continue with an empty session
        console.warn('Could not initialize chat history due to rate limits:', error.message);
      }
      
      setChatSession(session);
    } catch (error) {
      console.error('Error initializing chat session:', error);
      // Don't set error state here to avoid UI disruption
      setChatSession(null);
    }
  }, []);
  
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
    
    // Subscribe to message updates - improved subscription
    let messageSubscription;
    if (activeChat?.id) {
      messageSubscription = supabase
        .channel(`ai_messages_channel_${activeChat.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'ai_messages',
          filter: `chat_id=eq.${activeChat.id}` 
        }, (payload) => {
          // Handle different types of changes
          if (payload.eventType === 'INSERT') {
            // Add the new message to the messages array
            setMessages(currentMessages => [...currentMessages, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            // Update the modified message
            setMessages(currentMessages => 
              currentMessages.map(msg => msg.id === payload.new.id ? payload.new : msg)
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove the deleted message
            setMessages(currentMessages => 
              currentMessages.filter(msg => msg.id !== payload.old.id)
            );
          }
        })
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED') {
            console.log('Message subscription status:', status);
          }
        });
    }
      
    return () => {
      if (messageSubscription) {
        supabase.removeChannel(messageSubscription);
      }
    };
  }, [activeChat, user, initializeChatSession]);
  
  // Create a new AI chat
  const createChat = async (initialPrompt) => {
    if (!initialPrompt?.trim() || !user) {
      return { success: false, error: 'Missing prompt or user' };
    }
    
    setIsSending(true);
    
    try {
      // Generate a title for the chat (with fallback)
      let title;
      try {
        title = await generateChatTitle(initialPrompt);
      } catch (error) {
        console.error('Failed to generate title, using fallback:', error);
        // Fallback title if API fails
        title = initialPrompt.substring(0, 30) + '...';
      }
      
      // Create temporary chat for immediate display
      const tempChat = {
        id: 'temp-chat-' + Date.now(),
        title,
        created_by: user.id,
        privacy: 'private',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Update UI immediately with temporary chat
      setChats(currentChats => [tempChat, ...currentChats]);
      setActiveChat(tempChat);
      
      // Create temporary message objects for immediate display
      const tempUserMsg = {
        id: 'temp-user-' + Date.now(),
        chat_id: tempChat.id,
        user_id: user.id,
        is_ai: false,
        content: initialPrompt,
        created_at: new Date().toISOString(),
        user: { id: user.id, name: user.email || 'You' }
      };
      
      const tempAiMsg = {
        id: 'temp-ai-' + Date.now(),
        chat_id: tempChat.id,
        user_id: null,
        is_ai: true,
        content: "Thinking...",
        created_at: new Date().toISOString()
      };
      
      // Update UI with temporary messages
      setMessages([tempUserMsg, tempAiMsg]);
      
      // Create the chat in the database
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
      
      // Get response from AI (with fallback)
      let aiResponse;
      try {
        aiResponse = await generateResponse(initialPrompt);
      } catch (error) {
        console.error('Failed to get AI response, using fallback:', error);
        // Fallback message if API fails
        aiResponse = "I'm sorry, I couldn't generate a response at this time. The AI service might be temporarily unavailable.";
      }
      
      // Add the AI's response
      const { data: aiMessage, error: aiMsgError } = await supabase
        .from('ai_messages')
        .insert({
          chat_id: chat.id,
          user_id: null,
          is_ai: true,
          content: aiResponse
        })
        .select()
        .single();
      
      if (aiMsgError) throw aiMsgError;
      
      // Update UI with real chat and messages
      setChats(currentChats => 
        currentChats.filter(c => c.id !== tempChat.id)
          .concat([chat])
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      );
      setActiveChat(chat);
      setMessages([userMessage, aiMessage]);
      
      return { success: true, chat };
    } catch (error) {
      console.error('Error creating AI chat:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsSending(false);
    }
  };
  
  // Send a message to the AI - improved to update UI immediately
  const sendMessage = async (content) => {
    if (!content?.trim() || !activeChat || !user) {
      return { success: false, error: 'Missing content, chat, or user' };
    }
    
    setIsSending(true);
    
    try {
      // Create a temporary message object for immediate display
      const tempUserMsg = {
        id: 'temp-user-' + Date.now(),
        chat_id: activeChat.id,
        user_id: user.id,
        is_ai: false,
        content,
        created_at: new Date().toISOString(),
        user: { id: user.id, name: user.email || 'You' }
      };
      
      // Update UI immediately with the temporary message
      setMessages(currentMessages => [...currentMessages, tempUserMsg]);
      
      // Add the user's message to the database
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
      
      // Create temporary AI response for immediate feedback
      const tempAiMsg = {
        id: 'temp-ai-' + Date.now(),
        chat_id: activeChat.id,
        user_id: null,
        is_ai: true,
        content: "Thinking...",
        created_at: new Date().toISOString()
      };
      
      // Update UI with temporary AI response
      setMessages(currentMessages => 
        currentMessages.filter(msg => msg.id !== tempUserMsg.id)
          .concat([userMessage, tempAiMsg])
      );
      
      // Get response from AI (with fallback)
      let aiResponse;
      try {
        aiResponse = await generateResponse(content, chatSession);
      } catch (error) {
        console.error('Failed to get AI response, using fallback:', error);
        // Fallback message if API fails
        aiResponse = "I'm sorry, I couldn't generate a response at this time. The AI service might be temporarily unavailable.";
      }
      
      // Add the AI's response to the database
      const { data: aiMessage, error: aiMsgError } = await supabase
        .from('ai_messages')
        .insert({
          chat_id: activeChat.id,
          user_id: null,
          is_ai: true,
          content: aiResponse
        })
        .select()
        .single();
      
      if (aiMsgError) throw aiMsgError;
      
      // Remove temporary message and update with real message
      setMessages(currentMessages => 
        currentMessages.filter(msg => msg.id !== tempAiMsg.id)
          .concat([aiMessage])
      );
      
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