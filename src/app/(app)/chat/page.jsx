"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  PlusCircle, 
  Paperclip, 
  Send, 
  MoreVertical, 
  Hash, 
  User, 
  Phone, 
  Video,
  Users
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateChannel } from "@/components/chat/CreateChannel";
import { CreateDirectMessage } from "@/components/chat/CreateDirectMessage";
import { AddChannelMembers } from "@/components/chat/AddChannelMembers";
import { ChannelMembers } from "@/components/chat/ChannelMembers";

export default function ChatPage() {
  const { user } = useAuth();
  const { 
    channels, 
    directMessages, 
    activeChannel, 
    setActiveChannel, 
    messages, 
    users, 
    isLoading,
    sendMessage,
    getChannelDisplayName,
    getUserInitials 
  } = useChat();
  
  const [newMessage, setNewMessage] = useState("");
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isCreateDMOpen, setIsCreateDMOpen] = useState(false);
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [isViewMembersOpen, setIsViewMembersOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Format timestamp
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

  return (
    <div className="h-full flex border overflow-hidden border-base-300 dark:border-base-800">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col bg-base-100 dark:bg-base-300 border-base-300 dark:border-base-800">
        <div className="p-4 border-b border-base-300 dark:border-base-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-base-content/70 dark:text-base-content/70" />
            <Input placeholder="Search" className="pl-8 bg-base-200 border-base-300 dark:bg-base-200 dark:border-base-800 dark:text-base-content" />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              <Skeleton className="h-5 w-full dark:bg-base-200" />
              <Skeleton className="h-8 w-full dark:bg-base-200" />
              <Skeleton className="h-8 w-full dark:bg-base-200" />
              <Skeleton className="h-8 w-full dark:bg-base-200" />
            </div>
          ) : (
            <>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h3 className="font-semibold text-sm text-base-content/70 dark:text-base-content/70">CHANNELS</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 hover:bg-base-200 hover:text-primary dark:hover:bg-base-200 dark:text-base-content/70 dark:hover:text-base-content"
                    onClick={() => setIsCreateChannelOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                {channels.map(channel => (
                  <ChannelItem 
                    key={channel.id} 
                    name={channel.name || 'general'} 
                    active={activeChannel?.id === channel.id}
                    onClick={() => setActiveChannel(channel)} 
                  />
                ))}
                {channels.length === 0 && (
                  <p className="text-xs text-base-content/60 dark:text-base-content/60 px-3">No channels found</p>
                )}
              </div>

              <Separator className="my-2 bg-base-300 dark:bg-base-800" />

              <div className="p-3">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h3 className="font-semibold text-sm text-base-content/70 dark:text-base-content/70">DIRECT MESSAGES</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 hover:bg-base-200 hover:text-primary dark:hover:bg-base-200 dark:text-base-content/70 dark:hover:text-base-content"
                    onClick={() => setIsCreateDMOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                {directMessages.map(dm => {
                  const memberIds = dm.name?.split(':') || [];
                  const otherUserId = memberIds.find(id => id !== user?.id);
                  const otherUser = users[otherUserId];
                  
                  // Make sure we have a proper display name
                  const displayName = otherUser?.name || 'Unknown User';
                  
                  return (
                    <DirectMessageItem 
                      key={dm.id}
                      name={displayName}
                      status="online" 
                      active={activeChannel?.id === dm.id}
                      onClick={() => setActiveChannel(dm)}
                    />
                  );
                })}
                {directMessages.length === 0 && (
                  <p className="text-xs text-base-content/60 dark:text-base-content/60 px-3">No direct messages</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat content */}
      <div className="flex-1 flex flex-col bg-base-100 dark:bg-base-300">
        {/* Chat header */}
        {activeChannel ? (
          <div className="flex items-center justify-between px-4 py-3 border-b bg-base-100 dark:bg-base-300 border-base-300 dark:border-base-800">
            <div className="flex items-center">
              {activeChannel.type === 'direct' ? (
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="bg-primary/10 text-primary dark:bg-base-200 dark:text-base-content">
                      {(() => {
                        const memberIds = activeChannel.name?.split(':') || [];
                        const otherUserId = memberIds.find(id => id !== user?.id);
                        return getUserInitials(otherUserId);
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold dark:text-base-content">{getChannelDisplayName(activeChannel)}</h3>
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-success/20 text-success dark:bg-success/20 dark:text-success">
                    online
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="flex items-center justify-center h-8 w-8 bg-primary/10 text-primary dark:bg-base-200 dark:text-base-content mr-3">
                    <Hash className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold dark:text-base-content">{getChannelDisplayName(activeChannel)}</h3>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {activeChannel.type !== 'direct' && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-base-200 dark:hover:bg-base-200 dark:text-base-content/70"
                    onClick={() => setIsAddMembersOpen(true)}
                    title="Add members"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-base-200 dark:hover:bg-base-200 dark:text-base-content/70"
                    onClick={() => setIsViewMembersOpen(true)}
                    title="View members"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="hover:bg-base-200 dark:hover:bg-base-200 dark:text-base-content/70">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-base-200 dark:hover:bg-base-200 dark:text-base-content/70">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-base-200 dark:hover:bg-base-200 dark:text-base-content/70">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-3 border-b bg-base-100 dark:bg-base-300 border-base-300 dark:border-base-800">
            <h3 className="font-semibold dark:text-base-content">Select a channel</h3>
          </div>
        )}

        {/* Messages */}
        {activeChannel ? (
          <div className="flex-1 overflow-auto p-4 space-y-6 bg-base-200 dark:bg-base-200">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-base-content/60 dark:text-base-content/60">
                <p>No messages yet</p>
                <p className="text-sm">Be the first to send a message!</p>
              </div>
            ) : (
              messages.map(message => (
                <Message 
                  key={message.id}
                  user={users[message.user_id]?.name || 'Unknown User'} 
                  time={formatMessageTime(message.created_at)} 
                  content={message.content} 
                  avatar={getUserInitials(message.user_id)}
                  isCurrentUser={message.user_id === user?.id}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-base-200 dark:bg-base-200">
            <div className="text-center p-6 bg-base-100 dark:bg-base-300">
              <Hash className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 dark:text-base-content">Welcome to Chat</h3>
              <p className="text-base-content/60 dark:text-base-content/60 mb-4">
                Select a channel to start chatting or create a new one.
              </p>
              <Button onClick={() => setIsCreateChannelOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-content">
                Create New Channel
              </Button>
            </div>
          </div>
        )}

        {/* Message input */}
        {activeChannel && (
          <div className="p-4 border-t bg-base-100 dark:bg-base-300 border-base-300 dark:border-base-800">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" className="hover:bg-base-200 dark:hover:bg-base-200 dark:text-base-content/70">
                <PlusCircle className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="hover:bg-base-200 dark:hover:bg-base-200 dark:text-base-content/70">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input 
                placeholder={`Message ${getChannelDisplayName(activeChannel)}`} 
                className="flex-1 bg-base-200 border-base-300 dark:bg-base-200 dark:border-base-800 dark:text-base-content"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                autoComplete="off"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!newMessage.trim()} 
                className="bg-primary hover:bg-primary/90 text-primary-content"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
      
      {/* Dialogs */}
      <CreateChannel 
        open={isCreateChannelOpen} 
        onOpenChange={setIsCreateChannelOpen} 
      />
      <CreateDirectMessage 
        open={isCreateDMOpen} 
        onOpenChange={setIsCreateDMOpen} 
      />
      <AddChannelMembers
        open={isAddMembersOpen}
        onOpenChange={setIsAddMembersOpen}
        channelId={activeChannel?.id}
      />
      <ChannelMembers
        open={isViewMembersOpen}
        onOpenChange={setIsViewMembersOpen}
        channelId={activeChannel?.id}
        channelName={activeChannel?.name}
      />
    </div>
  );
}

// Channel item component
function ChannelItem({ name, active, unread, onClick }) {
  return (
    <button
      className={`w-full flex items-center px-3 py-2 mb-1 transition-colors duration-150
      ${active 
        ? 'bg-base-300 dark:bg-base-200 text-base-content dark:text-base-content' 
        : 'hover:bg-base-200 dark:hover:bg-base-100 text-base-content/70 dark:text-base-content/70'}`}
      onClick={onClick}
    >
      <Hash className={`h-4 w-4 mr-2 ${active ? 'text-base-content dark:text-base-content' : 'text-base-content/60 dark:text-base-content/60'}`} />
      <span className={`text-sm flex-1 text-left truncate ${active ? 'font-medium' : ''}`}>{name}</span>
      {unread && (
        <span className="bg-primary text-primary-content text-xs w-5 h-5 flex items-center justify-center">
          {unread}
        </span>
      )}
    </button>
  );
}

// Direct message item component
function DirectMessageItem({ name, status, active, unread, onClick }) {
  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    
    // If name has multiple parts (first and last name), get first letter of each part
    if (name.includes(' ')) {
      return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    // Otherwise just return the first letter
    return name.charAt(0).toUpperCase();
  };
  
  return (
    <button
      className={`w-full flex items-center px-3 py-2 mb-1 transition-colors duration-150
      ${active 
        ? 'bg-base-300 dark:bg-base-200 text-base-content dark:text-base-content' 
        : 'hover:bg-base-200 dark:hover:bg-base-100 text-base-content/70 dark:text-base-content/70'}`}
      onClick={onClick}
    >
      <div className="relative mr-2">
        <div className="w-6 h-6 bg-primary/10 text-primary dark:bg-base-200 dark:text-base-content flex items-center justify-center text-[10px]">
          {getInitials(name)}
        </div>
        <div 
          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border border-base-100 dark:border-base-300
          ${status === 'online' ? 'bg-success' : status === 'idle' ? 'bg-warning' : 'bg-neutral'}`}
        ></div>
      </div>
      <span className={`text-sm flex-1 text-left truncate ${active ? 'font-medium' : ''}`}>{name}</span>
      {unread && (
        <span className="bg-primary text-primary-content text-xs w-5 h-5 flex items-center justify-center">
          {unread}
        </span>
      )}
    </button>
  );
}

// Message component
function Message({ user, time, content, avatar, isCurrentUser }) {
  return (
    <div className={`flex gap-3 ${isCurrentUser ? 'justify-end' : ''}`}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs dark:bg-base-200 dark:text-base-content">{avatar}</AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[75%] ${isCurrentUser ? 'text-right' : ''}`}>
        <div className="flex items-baseline mb-1">
          {!isCurrentUser && <h4 className="font-medium text-sm dark:text-base-content">{user}</h4>}
          <span className={`text-xs text-base-content/60 dark:text-base-content/60 ${!isCurrentUser ? 'ml-2' : ''}`}>{time}</span>
          {isCurrentUser && <h4 className="font-medium text-sm ml-2 dark:text-base-content">{user}</h4>}
        </div>
        <div className={`p-3 ${
          isCurrentUser 
            ? 'bg-primary text-primary-content' 
            : 'bg-base-300 dark:bg-base-200 text-base-content dark:text-base-content'
        }`}>
          <p className={`text-sm break-words ${isCurrentUser ? 'text-left' : ''}`}>{content}</p>
        </div>
      </div>
      {isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs dark:bg-base-200 dark:text-base-content">{avatar}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
} 