"use client"
import { useEffect, useState } from "react"
import { Progress } from "./ui/progress"
import { Car, Home, Pill, ShieldAlert, Smartphone, Loader2 } from "lucide-react"
import { crimeAPI } from "@/lib/api-service"
import { useToast } from "./ui/use-toast"

// Icon mapping for crime types
const crimeIcons: Record<string, any> = {
  "Violent Crime": ShieldAlert,
  "Armed Robbery": ShieldAlert,
  Assault: ShieldAlert,
  Murder: ShieldAlert,
  "Sexual Offences": ShieldAlert,
  "Property Theft": Home,
  Burglary: Home,
  "Vehicle Theft": Car,
  "Drug-related": Pill,
  Fraud: Smartphone,
  Other: Smartphone,
}

// Default stats in case API fails
const defaultStats = [
  {
    type: "Violent Crime",
    count: 0,
    change: 0,
    icon: ShieldAlert,
    color: "alert-red",
    severity: "High",
  },
]

export function CrimeStats() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any[]>([])
  const { toast } = useToast()

  // Load crime statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await crimeAPI.getStats()

        // Transform API response to our component format
        const formattedStats = response.stats.map((stat) => {
          // Determine severity based on high_severity count
          let severity = "Low"
          let color = "alert-yellow"

          if (stat.high_severity > 0) {
            const highSeverityRatio = stat.high_severity / stat.count
            if (highSeverityRatio > 0.5) {
              severity = "High"
              color = "alert-red"
            } else if (highSeverityRatio > 0.2) {
              severity = "Medium"
              color = "alert-orange"
            }
          }

          // Get icon based on crime type
          const IconComponent = crimeIcons[stat.type] || ShieldAlert

          return {
            type: stat.type,
            count: stat.count,
            change: stat.change_percentage || 0,
            icon: IconComponent,
            color,
            severity,
          }
        })

        // Sort by count (highest first)
        formattedStats.sort((a, b) => b.count - a.count)

        // Take top 5
        setStats(formattedStats.slice(0, 5))
      } catch (error) {
        console.error("Error fetching crime stats:", error)
        toast({
          title: "Error loading statistics",
          description: "Could not load crime statistics",
          variant: "destructive",
        })
        setStats(defaultStats)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [toast])

  // Calculate max count for relative progress bars
  const maxCount = Math.max(...stats.map((stat) => stat.count), 1)

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span>Loading statistics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {stats.map((stat) => (
        <div key={stat.type} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <stat.icon className={`h-4 w-4 text-${stat.color}`} />
              <span className="font-medium">{stat.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{stat.count}</span>
              <span className={`text-xs ${stat.change > 0 ? "text-alert-red" : "text-alert-green"}`}>
                {stat.change > 0 ? `+${stat.change}%` : `${stat.change}%`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Progress
              value={(stat.count / maxCount) * 100}
              className={`h-2 ${stat.severity === "High" ? "bg-alert-red/20" : stat.severity === "Medium" ? "bg-alert-orange/20" : "bg-alert-yellow/20"}`}
              indicatorClassName={`${stat.severity === "High" ? "bg-alert-red" : stat.severity === "Medium" ? "bg-alert-orange" : "bg-alert-yellow"}`}
            />
            <span
              className={`text-xs font-medium ${
                stat.severity === "High"
                  ? "text-alert-red"
                  : stat.severity === "Medium"
                    ? "text-alert-orange"
                    : "text-alert-yellow"
              }`}
            >
              {stat.severity}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
