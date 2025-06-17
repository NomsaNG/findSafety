"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, X } from "lucide-react"

interface LocationFilterProps {
  selectedLocation: string
  onLocationChange: (location: string) => void
}

const popularLocations = ["Sandton", "Rosebank", "Melville", "Parktown", "Bryanston", "Randburg", "Fourways", "Midrand"]

export function LocationFilter({ selectedLocation, onLocationChange }: LocationFilterProps) {
  const [customLocation, setCustomLocation] = useState("")

  const handleLocationSelect = (location: string) => {
    onLocationChange(location)
  }

  const handleCustomLocation = () => {
    if (customLocation.trim()) {
      onLocationChange(customLocation.trim())
      setCustomLocation("")
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          // In a real app, you'd reverse geocode these coordinates
          onLocationChange(`Near me (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`)
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }
  }

  const clearLocation = () => {
    onLocationChange("")
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Selection */}
        {selectedLocation && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              {selectedLocation}
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0 hover:bg-transparent" onClick={clearLocation}>
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          </div>
        )}

        {/* Custom Location Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter suburb or area..."
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCustomLocation()}
              className="flex-1"
            />
            <Button onClick={handleCustomLocation} disabled={!customLocation.trim()} size="sm">
              Set
            </Button>
          </div>

          <Button variant="outline" onClick={getCurrentLocation} className="w-full gap-2" size="sm">
            <Navigation className="h-4 w-4" />
            Use Current Location
          </Button>
        </div>

        {/* Popular Locations */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Popular Areas:</p>
          <div className="flex flex-wrap gap-1">
            {popularLocations.map((location) => (
              <Button
                key={location}
                variant={selectedLocation === location ? "default" : "outline"}
                size="sm"
                onClick={() => handleLocationSelect(location)}
                className="text-xs"
              >
                {location}
              </Button>
            ))}
          </div>
        </div>

        {/* Radius Info */}
        <div className="text-xs text-muted-foreground">
          <p>Shows posts within 10km of selected location</p>
        </div>
      </CardContent>
    </Card>
  )
}
