"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  PlusCircle, 
  Send, 
  MoreVertical, 
  Sparkles,
  Share,
  Users,
  Lock,
  Globe,
  UserPlus,
  Trash2,
  MessageSquarePlus
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiChat } from "@/hooks/useAiChat";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { AddChatParticipants } from "@/components/ai/AddChatParticipants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AiChatPage() {
  const { user } = useAuth();
  const { 
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
    deleteChat
  } = useAiChat();
  
  const [newMessage, setNewMessage] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Filter chats based on search term
  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Format message timestamp
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    return format(new Date(timestamp), 'h:mm a');
  };
  
  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    const { success } = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
  };
  
  // Handle creating a new chat
  const handleCreateChat = async () => {
    const prompt = prompt("Enter your question for the AI:");
    if (!prompt) return;
    
    await createChat(prompt);
  };
  
  // Handle privacy update
  const handlePrivacyChange = async (chatId, privacy) => {
    await updateChatPrivacy(chatId, privacy);
  };
  
  // Handle deleting a chat
  const handleDeleteChat = async (chatId) => {
    if (confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
      await deleteChat(chatId);
    }
  };
  
  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return '?';
    
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Get privacy icon
  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
      case 'private':
        return <Lock className="h-4 w-4" />;
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'team':
        return <Users className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };
  
  // Get privacy label
  const getPrivacyLabel = (privacy) => {
    switch (privacy) {
      case 'private':
        return 'Private';
      case 'public':
        return 'Public';
      case 'team':
        return 'Team';
      default:
        return 'Private';
    }
  };

  return (
    <div className="h-full flex border overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search chats" 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">AI CHATS</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5"
                    onClick={handleCreateChat}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                
                {filteredChats.length === 0 && (
                  <p className="text-xs text-muted-foreground px-2">
                    {searchTerm ? 'No chats match your search' : 'No chats yet. Start one!'}
                  </p>
                )}
                
                {filteredChats.map(chat => (
                  <button
                    key={chat.id}
                    className={`w-full flex items-center px-2 py-1.5 rounded-md mb-1 
                    ${activeChat?.id === chat.id 
                      ? 'bg-gray-200 dark:bg-gray-800' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    onClick={() => setActiveChat(chat)}
                  >
                    <div className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/10 text-primary mr-2">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center">
                        <span className="text-sm truncate max-w-[130px]">{chat.title}</span>
                        <div className="ml-1 text-xs text-muted-foreground">
                          {getPrivacyIcon(chat.privacy)}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {format(new Date(chat.updated_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat content */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        {activeChat ? (
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-900">
            <div className="flex items-center">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 text-primary mr-3">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold">{activeChat.title}</h3>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getPrivacyIcon(activeChat.privacy)}
                  <span className="ml-1">{getPrivacyLabel(activeChat.privacy)}</span>
                  {activeChat.privacy === 'team' && (
                    <Badge className="ml-2 text-xs" variant="outline">{participants.length} participants</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {activeChat.created_by === user?.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Share className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Chat Visibility</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handlePrivacyChange(activeChat.id, 'private')}
                      className={activeChat.privacy === 'private' ? 'bg-gray-100 dark:bg-gray-800' : ''}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      <span>Private</span>
                      {activeChat.privacy === 'private' && (
                        <span className="ml-auto text-xs text-primary">Active</span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handlePrivacyChange(activeChat.id, 'team')}
                      className={activeChat.privacy === 'team' ? 'bg-gray-100 dark:bg-gray-800' : ''}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      <span>Team Only</span>
                      {activeChat.privacy === 'team' && (
                        <span className="ml-auto text-xs text-primary">Active</span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handlePrivacyChange(activeChat.id, 'public')}
                      className={activeChat.privacy === 'public' ? 'bg-gray-100 dark:bg-gray-800' : ''}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      <span>Public (All Users)</span>
                      {activeChat.privacy === 'public' && (
                        <span className="ml-auto text-xs text-primary">Active</span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsShareOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      <span>Add People</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCreateChat}>
                    <MessageSquarePlus className="h-4 w-4 mr-2" />
                    <span>New Chat</span>
                  </DropdownMenuItem>
                  {activeChat.created_by === user?.id && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteChat(activeChat.id)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span>Delete Chat</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-900">
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
        )}

        {/* Messages */}
        {activeChat ? (
          <div className="flex-1 overflow-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Sparkles className="h-12 w-12 mb-4 text-primary" />
                <p className="text-lg font-medium">Intelligent AI Assistant</p>
                <p className="text-sm">Start your conversation with our AI assistant</p>
              </div>
            ) : (
              messages.map(message => (
                <div 
                  key={message.id} 
                  className={`flex space-x-3 ${message.is_ai ? '' : 'justify-end'}`}
                >
                  {message.is_ai && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Sparkles className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[75%] ${!message.is_ai ? 'text-right' : ''}`}>
                    <div className="flex items-baseline">
                      {message.is_ai && <h4 className="font-medium text-sm">AI Assistant</h4>}
                      <span className={`text-xs text-muted-foreground ${message.is_ai ? 'ml-2' : ''}`}>
                        {formatMessageTime(message.created_at)}
                      </span>
                      {!message.is_ai && (
                        <h4 className="font-medium text-sm ml-2">
                          {message.user?.name || 'You'}
                        </h4>
                      )}
                    </div>
                    <div className={`mt-1 p-3 rounded-2xl ${
                      message.is_ai 
                        ? 'bg-white dark:bg-gray-800 shadow-sm rounded-tl-none' 
                        : 'bg-primary text-primary-foreground rounded-tr-none'
                    }`}>
                      <p className={`text-sm break-words whitespace-pre-wrap ${!message.is_ai ? 'text-left' : ''}`}>
                        {message.content}
                      </p>
                    </div>
                  </div>
                  {!message.is_ai && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getUserInitials(message.user?.name || 'You')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm max-w-md">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Welcome to AI Chat</h3>
              <p className="text-muted-foreground mb-4">
                Start a new conversation with our AI assistant to get help, generate ideas, or explore concepts.
              </p>
              <Button onClick={handleCreateChat}>
                Start New Conversation
              </Button>
            </div>
          </div>
        )}

        {/* Message input */}
        {activeChat && (
          <div className="p-4 border-t bg-white dark:bg-gray-900">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <Input 
                placeholder="Type your message..." 
                className="flex-1 rounded-full"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isSending}
                autoComplete="off"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!newMessage.trim() || isSending} 
                className="rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
      
      {/* Dialogs */}
      <AddChatParticipants
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        chatId={activeChat?.id}
      />
    </div>
  );
} 