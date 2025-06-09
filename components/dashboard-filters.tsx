"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { MapPin, Calendar, Filter, X } from "lucide-react"
import type { DateRange } from "react-day-picker"

interface DashboardFiltersProps {
  onFiltersChange: (filters: {
    location?: string
    dateRange?: DateRange
  }) => void
  className?: string
}

export function DashboardFilters({ onFiltersChange, className }: DashboardFiltersProps) {
  const [location, setLocation] = useState("")
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  // Apply filters when they change
  useEffect(() => {
    const filters: any = {}

    if (location.trim()) {
      filters.location = location.trim()
    }

    if (dateRange.from || dateRange.to) {
      filters.dateRange = dateRange
    }

    // Check if we have active filters
    const hasFilters = !!(location.trim() || (dateRange.from && dateRange.to))
    setHasActiveFilters(hasFilters)

    onFiltersChange(filters)
  }, [location, dateRange, onFiltersChange])

  const clearFilters = () => {
    setLocation("")
    setDateRange({
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date(),
    })
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location-filter" className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </Label>
          <Input
            id="location-filter"
            placeholder="Enter city, province, or address..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Filter data by specific locations (e.g., "Johannesburg", "Western Cape", "Sandton")
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </Label>
          <DatePickerWithRange value={dateRange} onChange={setDateRange} className="w-full" />
          <p className="text-xs text-muted-foreground">Select the time period for crime data analysis</p>
        </div>

        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <div className="flex flex-wrap gap-2">
              {location && (
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                  <MapPin className="h-3 w-3" />
                  <span>{location}</span>
                </div>
              )}
              {dateRange.from && dateRange.to && (
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
