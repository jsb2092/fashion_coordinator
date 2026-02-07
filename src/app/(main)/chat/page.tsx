"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  createOutfit,
  getChatSessions,
  getChatSession,
  createChatSession,
  addChatMessage,
  deleteChatSession,
} from "@/lib/actions";
import { toast } from "sonner";
import { OutfitSuggestionCard } from "@/components/chat/OutfitSuggestionCard";
import Link from "next/link";

interface OutfitItem {
  id: string;
  category: string;
  subcategory?: string | null;
  colorPrimary: string;
  colorSecondary?: string | null;
  pattern?: string | null;
  brand?: string | null;
  material?: string | null;
  photoUrls: string[];
  notes?: string | null;
}

interface SuggestedOutfit {
  name: string;
  itemIds: string[];
  items?: OutfitItem[];
  reasoning: string;
  occasionType: string;
  formalityScore: number;
}

interface ItemList {
  category: string;
  items: OutfitItem[];
}

interface FitCheck {
  overallScore: number;
  overallVerdict: string;
  colorHarmony: { score: number; feedback: string };
  formalityBalance: { score: number; feedback: string };
  fit: { score: number; feedback: string };
  proportions: { score: number; feedback: string };
  suggestions: string[];
  compliments: string[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedOutfit?: SuggestedOutfit;
  itemLists?: ItemList[];
  imageUrls?: string[];
  fitCheck?: FitCheck;
}

interface ChatSession {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm here to help you put together great outfits. Tell me about an occasion, event, or how you want to look, and I'll suggest outfit combinations from your wardrobe. For example:\n\n• \"What should I wear to a nice dinner?\"\n• \"I have a job interview tomorrow\"\n• \"Casual outfit for a weekend brunch\"\n\nYou can also attach a photo for a **fit check** - I'll analyze your outfit and give you feedback on colors, fit, and styling!\n\nWhat can I help you with?",
};

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadSessions = async () => {
    try {
      const data = await getChatSessions();
      setSessions(data as ChatSession[]);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const session = await getChatSession(sessionId);
      if (session && session.messages) {
        setCurrentSessionId(sessionId);
        const loadedMessages: Message[] = session.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          suggestedOutfit: m.suggestedOutfit as unknown as SuggestedOutfit | undefined,
        }));
        setMessages(loadedMessages.length > 0 ? loadedMessages : [WELCOME_MESSAGE]);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      toast.error("Failed to load chat");
    }
  };

  const startNewChat = async () => {
    try {
      const session = await createChatSession();
      setCurrentSessionId(session.id);
      setMessages([WELCOME_MESSAGE]);
      await loadSessions();
    } catch (error) {
      console.error("Failed to create session:", error);
      toast.error("Failed to start new chat");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Delete this chat?")) return;
    try {
      await deleteChatSession(sessionId);
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([WELCOME_MESSAGE]);
      }
      await loadSessions();
      toast.success("Chat deleted");
    } catch (error) {
      console.error("Failed to delete session:", error);
      toast.error("Failed to delete chat");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && pendingImages.length === 0) || isLoading || isUploading) return;

    // Create session if needed
    let sessionId = currentSessionId;
    if (!sessionId) {
      try {
        const session = await createChatSession();
        sessionId = session.id;
        setCurrentSessionId(sessionId);
        await loadSessions();
      } catch (error) {
        console.error("Failed to create session:", error);
        toast.error("Failed to start chat");
        return;
      }
    }

    // Upload images if any
    let uploadedImageUrls: string[] = [];
    if (pendingImages.length > 0) {
      setIsUploading(true);
      try {
        uploadedImageUrls = await uploadImages(pendingImages);
      } catch (error) {
        console.error("Failed to upload images:", error);
        toast.error("Failed to upload images");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim() || "Please check this outfit",
      imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setPendingImages([]);
    // Clean up preview URLs
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setIsLoading(true);

    // Save user message
    try {
      await addChatMessage(sessionId, "user", userMessage.content);
    } catch (error) {
      console.error("Failed to save message:", error);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
            imageUrls: m.imageUrls,
          })),
          imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "subscription_required") {
          setShowUpgradePrompt(true);
          return;
        }
        throw new Error(data.message || "Failed to get response");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        suggestedOutfit: data.suggestedOutfit,
        itemLists: data.itemLists,
        fitCheck: data.fitCheck,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message with full outfit data
      try {
        await addChatMessage(
          sessionId,
          "assistant",
          data.content,
          data.suggestedOutfit
        );
        await loadSessions();
      } catch (error) {
        console.error("Failed to save message:", error);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get a response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveOutfit = async (outfit: SuggestedOutfit) => {
    if (!outfit) return;

    try {
      await createOutfit({
        name: outfit.name,
        occasionType: outfit.occasionType,
        itemIds: outfit.itemIds,
        formalityScore: outfit.formalityScore,
        createdBy: "ai",
        aiReasoning: outfit.reasoning,
      });
      toast.success("Outfit saved!");
    } catch (error) {
      console.error("Save outfit error:", error);
      toast.error("Failed to save outfit");
    }
  };

  const handleRequestReplacement = (item: OutfitItem, reason: string) => {
    const replacementMessage = `Please replace the ${item.category} (${item.colorPrimary}${item.brand ? `, ${item.brand}` : ""}) in this outfit. ${reason}. Suggest an alternative from my wardrobe.`;
    setInput(replacementMessage);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageFiles = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 3); // Max 3 images

    if (imageFiles.length > 0) {
      // Create previews
      const previews = imageFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previews].slice(0, 3));
      setPendingImages((prev) => [...prev, ...imageFiles].slice(0, 3));
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const { url } = await res.json();
      urls.push(url);
    }
    return urls;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className={cn(
          "border-r bg-muted/30 flex flex-col transition-all",
          showSidebar ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        <div className="p-3 border-b">
          <Button onClick={startNewChat} className="w-full" size="sm">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
                  currentSessionId === session.id && "bg-muted"
                )}
                onClick={() => loadSession(session.id)}
              >
                <svg
                  className="w-4 h-4 flex-shrink-0 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                  />
                </svg>
                <span className="flex-1 text-sm truncate">
                  {session.title || "New Chat"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded transition-opacity"
                >
                  <svg
                    className="w-3 h-3 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No chat history yet
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Ask Claude</h1>
            <p className="text-sm text-muted-foreground">
              Get personalized outfit suggestions from your wardrobe
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                      />
                    </svg>
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] space-y-3",
                    message.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  {/* User's attached images */}
                  {message.role === "user" && message.imageUrls && message.imageUrls.length > 0 && (
                    <div className="flex gap-2 justify-end">
                      {message.imageUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Attached ${i + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {message.suggestedOutfit && (
                    <OutfitSuggestionCard
                      outfit={message.suggestedOutfit}
                      onSave={() => handleSaveOutfit(message.suggestedOutfit!)}
                      onRequestReplacement={handleRequestReplacement}
                    />
                  )}

                  {/* Item Lists (Packing Lists, etc.) */}
                  {message.itemLists && message.itemLists.length > 0 && (
                    <div className="space-y-4 w-full">
                      {message.itemLists.map((list, listIndex) => (
                        <div key={listIndex} className="bg-muted/50 rounded-lg p-4">
                          <h4 className="font-semibold mb-3">{list.category}</h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {list.items.map((item) => (
                              <div key={item.id} className="group">
                                <div className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                                  {item.photoUrls[0] ? (
                                    <img
                                      src={item.photoUrls[0]}
                                      alt={item.category}
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  ) : (
                                    <div className="text-center text-xs text-muted-foreground p-1">
                                      <p className="font-medium">{item.category}</p>
                                      <p>{item.colorPrimary}</p>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-center mt-1 truncate text-muted-foreground">
                                  {item.colorPrimary} {item.category.toLowerCase()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fit Check Results */}
                  {message.fitCheck && (
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-4 w-full border border-purple-200/50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Fit Check
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-purple-600">
                            {message.fitCheck.overallScore}/10
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-3">{message.fitCheck.overallVerdict}</p>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                          { label: "Colors", data: message.fitCheck.colorHarmony },
                          { label: "Formality", data: message.fitCheck.formalityBalance },
                          { label: "Fit", data: message.fitCheck.fit },
                          { label: "Proportions", data: message.fitCheck.proportions },
                        ].map((item) => (
                          <div key={item.label} className="bg-background/50 rounded-md p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">{item.label}</span>
                              <span className="text-xs font-semibold">{item.data.score}/10</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{item.data.feedback}</p>
                          </div>
                        ))}
                      </div>

                      {message.fitCheck.compliments.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-green-600 mb-1">What&apos;s working:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {message.fitCheck.compliments.map((c, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-green-500">✓</span> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {message.fitCheck.suggestions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-amber-600 mb-1">Suggestions:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {message.fitCheck.suggestions.map((s, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-amber-500">→</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-primary-foreground animate-pulse"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {showUpgradePrompt && (
          <div className="border-t bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-6">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">AI Chat is a Pro Feature</p>
                  <p className="text-sm text-muted-foreground">Upgrade to Pro to get personalized outfit suggestions from Claude.</p>
                </div>
              </div>
              <Link href="/pricing">
                <Button className="bg-amber-600 hover:bg-amber-700">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="border-t p-4">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Image previews */}
            {imagePreviews.length > 0 && (
              <div className="flex gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={preview} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      type="button"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading || showUpgradePrompt || pendingImages.length >= 3}
              />

              {/* Photo upload button */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading || showUpgradePrompt || pendingImages.length >= 3}
                title="Attach photos for a fit check"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </Button>

              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  showUpgradePrompt
                    ? "Upgrade to Pro to use AI chat..."
                    : pendingImages.length > 0
                    ? "Ask about this outfit (or just send to get a fit check)..."
                    : "Ask about outfit suggestions, or attach a photo for a fit check..."
                }
                className="min-h-[60px] resize-none flex-1"
                disabled={isLoading || isUploading || showUpgradePrompt}
              />
              <Button
                type="submit"
                disabled={isLoading || isUploading || showUpgradePrompt || (!input.trim() && pendingImages.length === 0)}
              >
                {isUploading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                )}
              </Button>
            </form>
            {pendingImages.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                {pendingImages.length}/3 photos attached
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
