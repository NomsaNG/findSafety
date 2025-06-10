"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, Send, Bot, User, Loader2 } from "lucide-react"
import { chatAPI } from "@/lib/api-service"
import { useToast } from "@/components/ui/use-toast"

// Message type definition
interface Message {
  id: number
  role: "user" | "assistant"
  content: string
  timestamp: string
  isLoading?: boolean
}

// Initial welcome message
const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "Hello! I'm your FindSafety AI assistant. I can help you understand crime patterns and trends in South Africa. What would you like to know?",
    timestamp: new Date().toISOString(),
  },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [messages])

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    console.log("Sending message:", input) // Log the user input

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    }

    // Add loading message
    const loadingMessage: Message = {
      id: messages.length + 2,
      role: "assistant",
      content: "",
      isLoading: true,
      timestamp: new Date().toISOString(),
    }

    setMessages([...messages, userMessage, loadingMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Send message to API
      console.log("Calling chatAPI.sendMessage")
      const response = await chatAPI.sendMessage(input)
      console.log("API response received:", response) // Log the API response

      // Replace loading message with actual response
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.isLoading
            ? {
                id: msg.id,
                role: "assistant",
                content: response.response,
                timestamp: response.timestamp || new Date().toISOString(),
              }
            : msg,
        ),
      )
    } catch (error) {
      console.error("Error sending message:", error) // Log the error

      // Replace loading message with error
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.isLoading
            ? {
                id: msg.id,
                role: "assistant",
                content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
                timestamp: new Date().toISOString(),
              }
            : msg,
        ),
      )

      toast({
        title: "Error",
        description: "Failed to get a response from the AI assistant",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Chat Assistant</CardTitle>
              <CardDescription>Ask questions about crime data and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Suggested Questions</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => setInput("What are the crime trends in Johannesburg?")}
                      disabled={isLoading}
                    >
                      What are the crime trends in Johannesburg?
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => setInput("Is Cape Town safe for tourists?")}
                      disabled={isLoading}
                    >
                      Is Cape Town safe for tourists?
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => setInput("Has vehicle theft increased in Durban?")}
                      disabled={isLoading}
                    >
                      Has vehicle theft increased in Durban?
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => setInput("What are the safest neighborhoods in Pretoria?")}
                      disabled={isLoading}
                    >
                      What are the safest neighborhoods in Pretoria?
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-9">
          <Card className="flex h-[700px] flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Shield className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>FindSafety AI</CardTitle>
                  <CardDescription>Your personal crime data analyst</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex max-w-[80%] items-start gap-3 rounded-lg p-4 ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/20 text-primary">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="space-y-1">
                          {message.isLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Thinking...</span>
                            </div>
                          ) : (
                            <div className="text-sm">{message.content}</div>
                          )}
                          <div className="text-xs opacity-70">{formatTime(message.timestamp)}</div>
                        </div>
                        {message.role === "user" && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex w-full items-center space-x-2"
              >
                <Input
                  placeholder="Ask about crime trends and patterns..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
