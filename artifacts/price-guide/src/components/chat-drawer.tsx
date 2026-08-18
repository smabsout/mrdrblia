import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { 
  useListAnthropicConversations,
  useCreateAnthropicConversation,
  useListAnthropicMessages,
  getListAnthropicMessagesQueryKey,
  getListAnthropicConversationsQueryKey
} from "@workspace/api-client-react";

export function ChatDrawer() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Only run conversations query if drawer is open
  const { data: conversations } = useListAnthropicConversations({
    query: { enabled: !!user && isOpen, queryKey: getListAnthropicConversationsQueryKey() }
  });

  const createConv = useCreateAnthropicConversation();

  useEffect(() => {
    if (isOpen && conversations) {
      if (conversations.length > 0) {
        setActiveConversationId(conversations[0].id);
      } else if (!createConv.isPending) {
        createConv.mutate({ data: { title: "My Collection" } }, {
          onSuccess: (newConv) => {
            setActiveConversationId(newConv.id);
            queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
          }
        });
      }
    }
  }, [isOpen, conversations, createConv.isPending, queryClient]);

  const { data: messages } = useListAnthropicMessages(activeConversationId!, {
    query: { enabled: !!activeConversationId && isOpen, queryKey: getListAnthropicMessagesQueryKey(activeConversationId!) }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedResponse]);

  if (!user) return null;

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput || input;
    if (!text.trim() || !activeConversationId || isStreaming) return;
    
    setInput("");
    setIsStreaming(true);
    setStreamedResponse("");

    try {
      // Optimistically add user message if we wanted to, but the server handles it.
      // We will rely on stream text appearing instantly, then refetch.
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const response = await fetch(`${BASE}/api/anthropic/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: text }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let tempResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!; // save incomplete line
        
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              tempResponse += data.content;
              setStreamedResponse(tempResponse);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: getListAnthropicMessagesQueryKey(activeConversationId) });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    "Summarize my collection",
    "What's my most valuable piece?",
    "What's changed in value recently?"
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-transform duration-200 flex items-center gap-2 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="font-bold">Ask AI</span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-50 transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-[100dvh] w-full max-w-[400px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <h2 className="font-bold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Collection AI
          </h2>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages?.length === 0 && !isStreaming && (
            <div className="text-center text-muted-foreground mt-8 text-sm">
              <p>Ask about your collection.</p>
            </div>
          )}
          
          {messages?.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-br-none' 
                  : 'bg-white border rounded-bl-none shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {(isStreaming || streamedResponse) && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-white border rounded-bl-none shadow-sm whitespace-pre-wrap">
                {streamedResponse || "..."}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t bg-white">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {quickActions.map(action => (
              <button 
                key={action}
                onClick={() => { setInput(action); }}
                className="text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-1 rounded-full whitespace-nowrap transition-colors border"
              >
                {action}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your collection..."
              className="text-sm shadow-none"
              disabled={isStreaming}
            />
            <Button 
              size="icon" 
              onClick={() => handleSend()}
              disabled={isStreaming || !input.trim()}
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}