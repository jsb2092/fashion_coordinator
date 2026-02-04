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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedOutfit?: SuggestedOutfit;
  itemLists?: ItemList[];
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
    "Hi! I'm here to help you put together great outfits. Tell me about an occasion, event, or how you want to look, and I'll suggest outfit combinations from your wardrobe. For example:\n\n• \"What should I wear to a nice dinner?\"\n• \"I have a job interview tomorrow\"\n• \"Casual outfit for a weekend brunch\"\n\nWhat can I help you with?",
};

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (!input.trim() || isLoading) return;

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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
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
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        suggestedOutfit: data.suggestedOutfit,
        itemLists: data.itemLists,
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

        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about outfit suggestions..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
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
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
