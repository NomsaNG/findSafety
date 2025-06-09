"use client"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { ScrollArea } from "./ui/scroll-area"
import { Loader2 } from "lucide-react"
import { crimeAPI } from "@/lib/api-service"
import { useToast } from "./ui/use-toast"

interface RecentCrimesProps {
  filters?: {
    location?: string
    start_date?: string
    end_date?: string
  }
}

export function RecentCrimes({ filters = {} }: RecentCrimesProps) {
  const [loading, setLoading] = useState(true)
  const [crimes, setCrimes] = useState<any[]>([])
  const { toast } = useToast()

  // Load recent crimes from API
  useEffect(() => {
    const fetchRecentCrimes = async () => {
      try {
        setLoading(true)
        const response = await crimeAPI.getCrimes({
          limit: 10,
          ...filters,
        })

        if (!response || !response.crimes) {
          throw new Error("Invalid response from API")
        }

        setCrimes(response.crimes)
      } catch (error) {
        console.error("Error fetching recent crimes:", error)
        toast({
          title: "Error loading data",
          description: error instanceof Error ? error.message : "Could not load recent crime incidents",
          variant: "destructive",
        })
        setCrimes([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecentCrimes()
  }, [toast, filters?.location, filters?.start_date, filters?.end_date])

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-ZA", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Function to get initials for avatar
  const getInitials = (crimeType: string) => {
    return crimeType
      .split(" ")
      .map((word) => word[0])
      .join("")
  }

  // Function to get badge variant based on severity
  const getBadgeVariant = (severity: string) => {
    switch (severity) {
      case "High":
        return "destructive"
      case "Medium":
        return "default"
      case "Low":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span>Loading recent incidents...</span>
      </div>
    )
  }

  if (crimes.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-center">
        <div>
          <p className="text-muted-foreground">No recent incidents to display</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {crimes.map((crime) => (
          <div key={crime._id} className="flex items-start gap-4">
            <Avatar className="h-9 w-9">
              <AvatarFallback
                className={`
                ${
                  crime.severity === "High"
                    ? "bg-alert-red/10 text-alert-red"
                    : crime.severity === "Medium"
                      ? "bg-alert-orange/10 text-alert-orange"
                      : "bg-alert-yellow/10 text-alert-yellow"
                }
              `}
              >
                {getInitials(crime.type)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-none">{crime.type}</p>
                <Badge variant={getBadgeVariant(crime.severity)}>{crime.severity}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{crime.location?.address || "Unknown location"}</p>
              <p className="text-xs text-muted-foreground">{formatDate(crime.date)}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
