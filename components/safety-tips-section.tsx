"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lightbulb, RefreshCw, TrendingUp, Clock } from "lucide-react"

// Mock AI-generated safety tips
const mockSafetyTips = [
  {
    id: "1",
    title: "Avoid Main Street after 7 PM",
    description:
      "4 incidents reported this week involving pedestrians on Main Street after dark. Consider alternative routes or use rideshare services.",
    severity: "High",
    basedOn: "Recent community reports",
    timestamp: "Updated 2 hours ago",
  },
  {
    id: "2",
    title: "Parking Garage Security Alert",
    description:
      "Increased vehicle break-ins reported in Sandton City parking levels B2-B4. Park in well-lit areas and avoid leaving valuables visible.",
    severity: "Medium",
    basedOn: "Crime trend analysis",
    timestamp: "Updated 6 hours ago",
  },
  {
    id: "3",
    title: "ATM Safety Reminder",
    description:
      "Be extra cautious at ATMs near shopping centers. Cover your PIN and be aware of your surroundings. Use ATMs inside banks when possible.",
    severity: "Medium",
    basedOn: "General safety guidelines",
    timestamp: "Updated 1 day ago",
  },
]

export function SafetyTipsSection() {
  const [tips, setTips] = useState(mockSafetyTips)
  const [loading, setLoading] = useState(false)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  // Auto-rotate tips every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length)
    }, 30000)

    return () => clearInterval(interval)
  }, [tips.length])

  const refreshTips = async () => {
    setLoading(true)

    // Simulate API call to get fresh AI-generated tips
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // In a real app, this would call the AI service
    setTips([...mockSafetyTips].sort(() => Math.random() - 0.5))
    setCurrentTipIndex(0)
    setLoading(false)
  }

  const currentTip = tips[currentTipIndex]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200"
      case "Medium":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Low":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Safety Tips
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={refreshTips} disabled={loading} className="gap-1">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentTip && (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-sm leading-tight">{currentTip.title}</h3>
              <Badge variant="outline" className={`text-xs ${getSeverityColor(currentTip.severity)}`}>
                {currentTip.severity}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{currentTip.description}</p>

            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{currentTip.basedOn}</span>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{currentTip.timestamp}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tip Navigation */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-1">
            {tips.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentTipIndex ? "bg-primary" : "bg-muted"
                }`}
                onClick={() => setCurrentTipIndex(index)}
              />
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            {currentTipIndex + 1} of {tips.length}
          </div>
        </div>

        {/* Powered by AI notice */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          <span className="flex items-center justify-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Powered by AI analysis
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
