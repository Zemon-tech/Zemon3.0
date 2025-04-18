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
    <div className="h-full flex border overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8" />
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
                  <h3 className="font-semibold text-sm text-muted-foreground">CHANNELS</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5"
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
                  <p className="text-xs text-muted-foreground px-2">No channels found</p>
                )}
              </div>

              <Separator className="my-2" />

              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">DIRECT MESSAGES</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5"
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
                  <p className="text-xs text-muted-foreground px-2">No direct messages</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat content */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        {activeChannel ? (
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-900">
            <div className="flex items-center">
              {activeChannel.type === 'direct' ? (
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(() => {
                        const memberIds = activeChannel.name?.split(':') || [];
                        const otherUserId = memberIds.find(id => id !== user?.id);
                        return getUserInitials(otherUserId);
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">{getChannelDisplayName(activeChannel)}</h3>
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    online
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 text-primary mr-3">
                    <Hash className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold">{getChannelDisplayName(activeChannel)}</h3>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {activeChannel.type !== 'direct' && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full"
                    onClick={() => setIsAddMembersOpen(true)}
                    title="Add members"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full"
                    onClick={() => setIsViewMembersOpen(true)}
                    title="View members"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="rounded-full">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-900">
            <h3 className="font-semibold">Select a channel</h3>
          </div>
        )}

        {/* Messages */}
        {activeChannel ? (
          <div className="flex-1 overflow-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
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
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm max-w-md">
              <Hash className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Welcome to Chat</h3>
              <p className="text-muted-foreground mb-4">
                Select a channel to start chatting or create a new one.
              </p>
              <Button onClick={() => setIsCreateChannelOpen(true)}>
                Create New Channel
              </Button>
            </div>
          </div>
        )}

        {/* Message input */}
        {activeChannel && (
          <div className="p-4 border-t bg-white dark:bg-gray-900">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <Button type="button" variant="ghost" size="icon" className="rounded-full">
                <PlusCircle className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="rounded-full">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input 
                placeholder={`Message ${getChannelDisplayName(activeChannel)}`} 
                className="flex-1 rounded-full"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                autoComplete="off"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!newMessage.trim()} 
                className="rounded-full"
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
      className={`w-full flex items-center px-2 py-1.5 rounded-md mb-1 
      ${active 
        ? 'bg-gray-200 dark:bg-gray-800' 
        : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
      onClick={onClick}
    >
      <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
      <span className={`text-sm flex-1 text-left truncate ${active ? 'font-medium' : ''}`}>{name}</span>
      {unread && (
        <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
      className={`w-full flex items-center px-2 py-1.5 rounded-md mb-1 
      ${active 
        ? 'bg-gray-200 dark:bg-gray-800' 
        : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
      onClick={onClick}
    >
      <div className="relative mr-2">
        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
          {getInitials(name)}
        </div>
        <div 
          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white
          ${status === 'online' ? 'bg-green-500' : status === 'idle' ? 'bg-yellow-500' : 'bg-gray-400'}`}
        ></div>
      </div>
      <span className={`text-sm flex-1 text-left truncate ${active ? 'font-medium' : ''}`}>{name}</span>
      {unread && (
        <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unread}
        </span>
      )}
    </button>
  );
}

// Message component
function Message({ user, time, content, avatar, isCurrentUser }) {
  return (
    <div className={`flex space-x-3 ${isCurrentUser ? 'justify-end' : ''}`}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">{avatar}</AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[75%] ${isCurrentUser ? 'text-right' : ''}`}>
        <div className="flex items-baseline">
          {!isCurrentUser && <h4 className="font-medium text-sm">{user}</h4>}
          <span className={`text-xs text-muted-foreground ${!isCurrentUser ? 'ml-2' : ''}`}>{time}</span>
          {isCurrentUser && <h4 className="font-medium text-sm ml-2">{user}</h4>}
        </div>
        <div className={`mt-1 p-3 rounded-2xl ${
          isCurrentUser 
            ? 'bg-primary text-white rounded-tr-none' 
            : 'bg-gray-200 dark:bg-gray-800 rounded-tl-none'
        }`}>
          <p className={`text-sm break-words ${isCurrentUser ? 'text-left' : ''}`}>{content}</p>
        </div>
      </div>
      {isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">{avatar}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
} 