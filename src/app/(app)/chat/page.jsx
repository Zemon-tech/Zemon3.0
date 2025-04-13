"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, PlusCircle, Paperclip, Send, MoreVertical, Hash, User, Phone, Video } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-10rem)] flex border rounded-lg overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8" />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-muted-foreground">CHANNELS</h3>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            <ChannelItem name="general" active />
            <ChannelItem name="design" />
            <ChannelItem name="development" unread={3} />
            <ChannelItem name="marketing" />
          </div>

          <Separator className="my-2" />

          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-muted-foreground">DIRECT MESSAGES</h3>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            <DirectMessageItem name="John Doe" status="online" active />
            <DirectMessageItem name="Jane Smith" status="offline" />
            <DirectMessageItem name="Mike Johnson" status="online" unread={2} />
            <DirectMessageItem name="Sarah Wilson" status="idle" />
          </div>
        </div>
      </div>

      {/* Chat content */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <div className="flex items-center">
            <Hash className="h-5 w-5 mr-2 text-muted-foreground" />
            <h3 className="font-semibold">general</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <Message 
            user="John Doe" 
            time="10:23 AM" 
            content="Hi team! I've uploaded the new design files to the resources section." 
            avatar="JD"
          />
          <Message 
            user="Jane Smith" 
            time="10:28 AM" 
            content="Thanks John, I'll take a look at them right away." 
            avatar="JS"
          />
          <Message 
            user="Mike Johnson" 
            time="10:32 AM" 
            content="I'm still working on the API integration. Should be done by EOD." 
            avatar="MJ"
          />
          <Message 
            user="Sarah Wilson" 
            time="10:45 AM" 
            content="@Mike Make sure to update the documentation once you're done." 
            avatar="SW"
          />
          <Message 
            user="John Doe" 
            time="11:15 AM" 
            content="I'll schedule a review meeting for tomorrow morning." 
            avatar="JD"
          />
        </div>

        {/* Message input */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <PlusCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input placeholder="Message #general" className="flex-1" />
            <Button size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Channel item component
function ChannelItem({ name, active, unread }) {
  return (
    <button
      className={`w-full flex items-center px-2 py-1.5 rounded-md mb-1 
      ${active 
        ? 'bg-gray-200 dark:bg-gray-800' 
        : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
    >
      <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
      <span className={`text-sm flex-1 text-left ${active ? 'font-medium' : ''}`}>{name}</span>
      {unread && (
        <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unread}
        </span>
      )}
    </button>
  );
}

// Direct message item component
function DirectMessageItem({ name, status, active, unread }) {
  return (
    <button
      className={`w-full flex items-center px-2 py-1.5 rounded-md mb-1 
      ${active 
        ? 'bg-gray-200 dark:bg-gray-800' 
        : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
    >
      <div className="relative mr-2">
        <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-[10px]">
          {name.split(' ').map(part => part[0]).join('')}
        </div>
        <div 
          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white
          ${status === 'online' ? 'bg-green-500' : status === 'idle' ? 'bg-yellow-500' : 'bg-gray-400'}`}
        ></div>
      </div>
      <span className={`text-sm flex-1 text-left ${active ? 'font-medium' : ''}`}>{name}</span>
      {unread && (
        <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unread}
        </span>
      )}
    </button>
  );
}

// Message component
function Message({ user, time, content, avatar }) {
  return (
    <div className="flex space-x-3">
      <Avatar>
        <AvatarFallback>{avatar}</AvatarFallback>
      </Avatar>
      <div>
        <div className="flex items-baseline">
          <h4 className="font-medium">{user}</h4>
          <span className="ml-2 text-xs text-muted-foreground">{time}</span>
        </div>
        <p className="text-sm mt-1">{content}</p>
      </div>
    </div>
  );
} 