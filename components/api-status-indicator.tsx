"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { healthAPI } from "@/lib/api-service"

export function ApiStatusIndicator() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        await healthAPI.check()
        setStatus("connected")
      } catch (error) {
        console.error("API health check failed:", error)
        setStatus("error")
      } finally {
        setLastChecked(new Date())
      }
    }

    checkApiStatus()

    // Check API status every 5 minutes
    const interval = setInterval(checkApiStatus, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date | null) => {
    if (!date) return ""
    return new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            {status === "checking" && (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>API</span>
              </Badge>
            )}
            {status === "connected" && (
              <Badge variant="outline" className="gap-1 border-green-500 text-green-500">
                <CheckCircle className="h-3 w-3" />
                <span>API</span>
              </Badge>
            )}
            {status === "error" && (
              <Badge variant="outline" className="gap-1 border-red-500 text-red-500">
                <XCircle className="h-3 w-3" />
                <span>API</span>
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            API Status: {status === "checking" ? "Checking..." : status === "connected" ? "Connected" : "Error"}
            {lastChecked && <span className="block text-xs opacity-70">Last checked: {formatTime(lastChecked)}</span>}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
