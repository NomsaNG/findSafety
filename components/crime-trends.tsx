"use client"

import { useEffect, useState } from "react"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendItem } from "@/components/ui/chart"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Loader2 } from "lucide-react"
import { crimeAPI } from "@/lib/api-service"
import { useToast } from "./ui/use-toast"

// Default trend data in case API fails
const defaultTrendData = [
  { month: "Jan", violent: 0, property: 0, drug: 0 },
  { month: "Feb", violent: 0, property: 0, drug: 0 },
  { month: "Mar", violent: 0, property: 0, drug: 0 },
  { month: "Apr", violent: 0, property: 0, drug: 0 },
  { month: "May", violent: 0, property: 0, drug: 0 },
]

interface CrimeTrendsProps {
  filters?: {
    location?: string
    start_date?: string
    end_date?: string
  }
}

export function CrimeTrends({ filters = {} }: CrimeTrendsProps) {
  const [loading, setLoading] = useState(true)
  const [trendData, setTrendData] = useState<any[]>(defaultTrendData)
  const { toast } = useToast()

  // Load crime trends from API
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true)
        const response = await crimeAPI.getTrends(filters)

        if (!response || !response.trends) {
          throw new Error("Invalid response from API")
        }

        // Transform API response to our component format
        const formattedTrends = response.trends.map((trend) => {
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
          const month = monthNames[trend._id.month - 1]

          // Initialize with month
          const formattedTrend: any = { month }

          // Add crime counts by type
          trend.crimes.forEach((crime: any) => {
            // Group similar crime types
            if (["Armed Robbery", "Assault", "Murder", "Sexual Offences"].includes(crime.type)) {
              formattedTrend.violent = (formattedTrend.violent || 0) + crime.count
            } else if (["Burglary", "Vehicle Theft", "Property Theft", "Fraud"].includes(crime.type)) {
              formattedTrend.property = (formattedTrend.property || 0) + crime.count
            } else if (crime.type === "Drug-related") {
              formattedTrend.drug = crime.count
            } else {
              // Other crime types
              formattedTrend.other = (formattedTrend.other || 0) + crime.count
            }
          })

          // Ensure all categories exist
          formattedTrend.violent = formattedTrend.violent || 0
          formattedTrend.property = formattedTrend.property || 0
          formattedTrend.drug = formattedTrend.drug || 0

          return formattedTrend
        })

        // Sort by month/year
        formattedTrends.sort((a, b) => {
          const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
          return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
        })

        setTrendData(formattedTrends)
      } catch (error) {
        console.error("Error fetching crime trends:", error)
        toast({
          title: "Error loading trends",
          description: error instanceof Error ? error.message : "Could not load crime trend data",
          variant: "destructive",
        })
        setTrendData(defaultTrendData)
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [toast, filters?.location, filters?.start_date, filters?.end_date])

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span>Loading trend data...</span>
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ChartContainer title="Crime Trends" description="Monthly crime incidents by category" className="h-full">
        <ChartLegend className="mb-4">
          <ChartLegendItem name="Violent Crimes" color="#E11D48" />
          <ChartLegendItem name="Property Crimes" color="#FB923C" />
          <ChartLegendItem name="Drug-related" color="#22C55E" />
        </ChartLegend>
        <ResponsiveContainer width="100%" height="80%">
          <LineChart data={trendData}>
            <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Line type="monotone" dataKey="violent" stroke="#E11D48" strokeWidth={2} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="property" stroke="#FB923C" strokeWidth={2} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="drug" stroke="#22C55E" strokeWidth={2} activeDot={{ r: 6 }} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="border-none bg-background p-2 shadow-md"
                  items={[
                    { name: "Violent Crimes", color: "#E11D48", valueFormatter: (value) => `${value} incidents` },
                    { name: "Property Crimes", color: "#FB923C", valueFormatter: (value) => `${value} incidents` },
                    { name: "Drug-related", color: "#22C55E", valueFormatter: (value) => `${value} incidents` },
                  ]}
                />
              }
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
