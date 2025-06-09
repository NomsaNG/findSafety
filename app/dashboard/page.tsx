"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CrimeMap } from "@/components/crime-map"
import { CrimeStats } from "@/components/crime-stats"
import { RecentCrimes } from "@/components/recent-crimes"
import { CrimeTrends } from "@/components/crime-trends"
import { Loader2 } from "lucide-react"
import { healthAPI } from "@/lib/api-service"
import { useToast } from "@/components/ui/use-toast"

export default function DashboardPage() {
  const [apiStatus, setApiStatus] = useState<"loading" | "connected" | "error">("loading")
  const { toast } = useToast()

  // Check API connection on page load
  useEffect(() => {
    let isMounted = true; // Prevent state updates if the component is unmounted

    const checkApiConnection = async () => {
      try {
        await healthAPI.check()
        if (isMounted) {
          setApiStatus("connected")
        }
      } catch (error) {
        console.error("API connection error:", error)
        if (isMounted) {
          setApiStatus("error")
          toast({
            title: "Connection Error",
            description: "Could not connect to the FindSafety API. Some features may be limited.",
            variant: "destructive",
          })
        }
      }
    }

    checkApiConnection()

    return () => {
      isMounted = false // Cleanup to avoid setting state on unmounted component
    }
  }, [toast])

  return (
    <div className="container mx-auto py-6">
      {apiStatus === "loading" ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Connecting to FindSafety API...</span>
        </div>
      ) : apiStatus === "error" ? (
        <Card className="mb-6 border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-destructive">
                Could not connect to the FindSafety API. Using demo data instead.
              </span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Crime Overview</CardTitle>
              <CardDescription>Interactive map of crime incidents in South Africa</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[500px] p-0">
            <CrimeMap />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Crime Statistics</CardTitle>
            <CardDescription>Summary of crime incidents by type</CardDescription>
          </CardHeader>
          <CardContent>
            <CrimeStats />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
            <CardDescription>Latest reported crimes in your area</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentCrimes />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Crime Trends</CardTitle>
            <CardDescription>Crime rate changes over time</CardDescription>
          </CardHeader>
          <CardContent>
            <CrimeTrends />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}