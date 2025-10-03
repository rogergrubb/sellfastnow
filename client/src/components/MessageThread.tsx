import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Paperclip } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

interface MessageThreadProps {
  recipientName: string;
  recipientAvatar?: string;
  listingTitle: string;
}

export default function MessageThread({ 
  recipientName, 
  recipientAvatar,
  listingTitle 
}: MessageThreadProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    //todo: remove mock functionality
    {
      id: "1",
      senderId: "2",
      senderName: recipientName,
      text: "Hi! Is this item still available?",
      timestamp: "10:30 AM",
      isOwn: false,
    },
    {
      id: "2",
      senderId: "1",
      senderName: "You",
      text: "Yes, it's still available! Would you like to know more about it?",
      timestamp: "10:32 AM",
      isOwn: true,
    },
    {
      id: "3",
      senderId: "2",
      senderName: recipientName,
      text: "Great! Can we meet tomorrow to check it out?",
      timestamp: "10:35 AM",
      isOwn: false,
    },
  ]);

  const handleSend = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: "1",
        senderName: "You",
        text: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      };
      setMessages([...messages, newMessage]);
      setMessage("");
      console.log("Message sent:", message);
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={recipientAvatar} />
            <AvatarFallback>{recipientName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold">{recipientName}</div>
            <div className="text-sm text-muted-foreground line-clamp-1">{listingTitle}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
            data-testid={`message-${msg.id}`}
          >
            <div className={`max-w-[70%] ${msg.isOwn ? 'order-2' : 'order-1'}`}>
              <div
                className={`rounded-lg px-4 py-2 ${
                  msg.isOwn
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
              <div className="text-xs text-muted-foreground mt-1 px-1">
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            data-testid="button-attach"
            onClick={() => console.log("Attach file")}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            data-testid="input-message"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            data-testid="button-send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
