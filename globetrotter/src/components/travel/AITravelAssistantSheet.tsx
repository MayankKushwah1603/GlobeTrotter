import { Bot, Send, Sparkles, User, RefreshCw, X, MessageSquare } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { askAITravelAssistant, type ChatMessage } from "@/lib/gemini";
import type { TripDetail } from "@/lib/types";

const QUICK_PROMPTS = [
  "🎒 What essential items should I pack?",
  "☔ What are good indoor/rainy day alternatives?",
  "🍜 What local food specialties must I try?",
  "🚇 How should I get around efficiently?",
  "💡 Any tips to reduce daily expenses?",
];

export function AITravelAssistantSheet({ trip }: { trip: TripDetail }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `👋 Hi! I'm your **GlobeTrotter AI Assistant** for **${trip.name}**.\n\nI have your full itinerary, stops, and scheduled activities loaded. Ask me anything about local tips, packing, food spots, or budget advice!`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  async function handleSend(customText?: string) {
    const textToSend = customText || input.trim();
    if (!textToSend || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: textToSend }];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const reply = await askAITravelAssistant(trip, textToSend, newMessages);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err: any) {
      toast.error(err.message || "Failed to get response from Gemini AI.");
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `⚠️ *Sorry, I ran into an error connecting to Gemini AI:* ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setMessages([
      {
        role: "assistant",
        content: `👋 Ready to help with **${trip.name}**! What would you like to know?`,
      },
    ]);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
        >
          <Sparkles className="mr-1.5 size-4 text-indigo-500 animate-pulse" />
          <span>AI Co-Pilot</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-sm">
                <Bot className="size-4" />
              </div>
              <div>
                <SheetTitle className="text-base">Travel Co-Pilot</SheetTitle>
                <SheetDescription className="text-xs">
                  Gemini AI assistant tailored to your itinerary
                </SheetDescription>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              onClick={handleReset}
              title="Reset conversation"
            >
              <RefreshCw className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        </SheetHeader>

        {/* Quick prompt badges */}
        <div className="flex gap-1.5 overflow-x-auto py-2 pr-1 no-scrollbar border-b">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isLoading}
              onClick={() => handleSend(prompt)}
              className="shrink-0 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:bg-muted hover:text-foreground"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message history */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-1 py-3 text-sm">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="flex size-6 shrink-0 select-none items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                  <Bot className="size-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg px-3.5 py-2.5 leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-muted/40 text-foreground"
                }`}
              >
                <div className="whitespace-pre-wrap break-words text-xs sm:text-sm">
                  {m.content}
                </div>
              </div>
              {m.role === "user" && (
                <div className="flex size-6 shrink-0 select-none items-center justify-center rounded-full bg-primary/20 text-primary">
                  <User className="size-3.5" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2.5">
              <div className="flex size-6 shrink-0 select-none items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                <Bot className="size-3.5" />
              </div>
              <div className="rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
                <span className="animate-pulse">Thinking & analyzing itinerary...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat input footer */}
        <div className="border-t pt-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about tips, packing, food, or alternatives..."
              className="resize-none text-xs sm:text-sm"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="size-10 shrink-0 bg-primary text-primary-foreground"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
