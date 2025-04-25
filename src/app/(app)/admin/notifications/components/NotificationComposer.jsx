"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }).max(100),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }).max(500),
  type: z.enum(["system", "message", "task", "event", "resource"]),
  severity: z.enum(["info", "success", "warning", "error"]),
  link: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal("")),
  recipientType: z.enum(["all", "team", "individual"]),
  team: z.string().optional(),
  userId: z.string().optional(),
});

export function NotificationComposer({ users, onSend, onPreview }) {
  const [isSending, setIsSending] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "system",
      severity: "info",
      link: "",
      recipientType: "all",
      team: "",
      userId: ""
    },
  });
  
  const recipientType = form.watch("recipientType");
  
  const onSubmit = async (values) => {
    try {
      setIsSending(true);
      const success = await onSend(values);
      
      if (success) {
        form.reset();
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  const handlePreview = () => {
    const values = form.getValues();
    if (form.formState.isValid) {
      onPreview(values);
    } else {
      form.trigger();
    }
  };
  
  // Extract unique roles for team selection
  const roles = [...new Set(users.map(user => user.role).filter(Boolean))];
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Notification Details */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Notification title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter the notification message" 
                    className="min-h-[100px]" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Provide a clear and concise message (max 500 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="message">Message</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="resource">Resource</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="info">Low (Info)</SelectItem>
                      <SelectItem value="success">Normal (Success)</SelectItem>
                      <SelectItem value="warning">Medium (Warning)</SelectItem>
                      <SelectItem value="error">High (Error)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/page" {...field} />
                </FormControl>
                <FormDescription>
                  Add a URL for users to visit when clicking the notification
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Recipients */}
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-sm font-medium mb-4">Recipients</h3>
          
          <FormField
            control={form.control}
            name="recipientType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all">All users</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="team" id="team" />
                      <Label htmlFor="team">Specific team</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual">Individual user</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {recipientType === 'team' && (
            <div className="mt-4 pl-6">
              <FormField
                control={form.control}
                name="team"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Team</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          {recipientType === 'individual' && (
            <div className="mt-4 pl-6">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select User</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={isSending}
          >
            Preview
          </Button>
          <Button type="submit" disabled={isSending}>
            {isSending ? "Sending..." : "Send Notification"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 