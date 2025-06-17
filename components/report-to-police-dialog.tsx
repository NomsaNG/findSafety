"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Phone, MapPin, Clock, Navigation, AlertTriangle, Shield, Search } from "lucide-react"

interface ReportToPoliceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mock police station data
const policeStations = [
  {
    id: "1",
    name: "Sandton Police Station",
    address: "135 West Street, Sandton, 2196",
    phone: "011 219 3000",
    emergency: "10111",
    distance: "2.3 km",
    hours: "24 hours",
    services: ["General Policing", "Detective Services", "Traffic Department"],
    coordinates: { lat: -26.1052, lng: 28.056 },
  },
  {
    id: "2",
    name: "Rosebank Police Station",
    address: "188 Jan Smuts Avenue, Rosebank, 2196",
    phone: "011 242 2500",
    emergency: "10111",
    distance: "4.1 km",
    hours: "24 hours",
    services: ["General Policing", "Family Violence Unit", "Detective Services"],
    coordinates: { lat: -26.1467, lng: 28.0436 },
  },
  {
    id: "3",
    name: "Brixton Police Station",
    address: "1 Main Reef Road, Brixton, 2019",
    phone: "011 837 5000",
    emergency: "10111",
    distance: "6.8 km",
    hours: "24 hours",
    services: ["General Policing", "Detective Services", "Community Service Centre"],
    coordinates: { lat: -26.2309, lng: 27.9111 },
  },
]

export function ReportToPoliceDialog({ open, onOpenChange }: ReportToPoliceDialogProps) {
  const [location, setLocation] = useState("")
  const [nearestStations, setNearestStations] = useState(policeStations)
  const [loading, setLoading] = useState(false)

  const handleLocationSearch = async () => {
    if (!location.trim()) return

    setLoading(true)

    // Simulate location-based search
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real app, this would geocode the location and find nearest stations
    setNearestStations(policeStations)
    setLoading(false)
  }

  const handleEmergencyCall = () => {
    window.location.href = "tel:10111"
  }

  const handleStationCall = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const handleGetDirections = (station: any) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(station.address)}`
    window.open(url, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Report to Police
          </DialogTitle>
          <DialogDescription>
            Find your nearest police station and get contact information to officially report a crime.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Emergency Alert */}
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-900">Emergency Situation?</h3>
                  <p className="text-sm text-red-700">
                    If you're in immediate danger or witnessing a crime in progress, call emergency services now.
                  </p>
                </div>
                <Button onClick={handleEmergencyCall} className="bg-red-600 hover:bg-red-700 text-white">
                  <Phone className="h-4 w-4 mr-2" />
                  Call 10111
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Location Search */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="location">Enter Crime Location</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Enter the address or area where the incident occurred to find the nearest police station.
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                id="location"
                placeholder="Enter street address, suburb, or landmark..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLocationSearch()}
                className="flex-1"
              />
              <Button onClick={handleLocationSearch} disabled={loading || !location.trim()} className="gap-2">
                <Search className="h-4 w-4" />
                {loading ? "Searching..." : "Find Stations"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Police Stations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Nearest Police Stations</h3>
              <Badge variant="secondary">{nearestStations.length} stations found</Badge>
            </div>

            <div className="grid gap-4">
              {nearestStations.map((station) => (
                <Card key={station.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{station.name}</CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{station.distance}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{station.hours}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Open 24/7
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Address */}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span className="text-sm">{station.address}</span>
                    </div>

                    {/* Services */}
                    <div>
                      <p className="text-sm font-medium mb-2">Available Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {station.services.map((service) => (
                          <Badge key={service} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => handleStationCall(station.phone)} className="flex-1 gap-2">
                        <Phone className="h-4 w-4" />
                        Call Station
                      </Button>
                      <Button variant="outline" onClick={() => handleGetDirections(station)} className="flex-1 gap-2">
                        <Navigation className="h-4 w-4" />
                        Get Directions
                      </Button>
                    </div>

                    {/* Contact Info */}
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <div className="flex justify-between">
                        <span>Station: {station.phone}</span>
                        <span>Emergency: {station.emergency}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-900 mb-2">What to Expect When Reporting</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Bring identification and any evidence you have</li>
                <li>• Be prepared to provide detailed information about the incident</li>
                <li>• You'll receive a case reference number for follow-up</li>
                <li>• The process typically takes 30-60 minutes</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
