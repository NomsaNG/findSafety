"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Bell, Mail, MessageSquare, Plus, Trash2, MapPin, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { alertsAPI } from "@/lib/api-service"


// Alert interface
interface Alert {
  _id: string
  name: string
  location: {
    address?: string
    lat?: number
    lng?: number
  }
  radius: number
  crime_types: string[]
  severity_levels: string[]
  notification_channels: string[]
  frequency: string
  active: boolean
  user_id: string
  created_at: string
  updated_at: string
}

export default function AlertsPage() {
  // Check if localStorage is available
  const user = React.useMemo(() => {
    return typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("user_data") || "{}") : {};
  }, []);
  console.log("Retrieved user from localStorage:", user); // Debugging log

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [newAlert, setNewAlert] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    radius: "3",
    crime_types: ["all"],
    notification_channels: ["email"],
    frequency: "daily",
    active: true,
  })

  // Load alerts from API
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        if (!user?._id) {
          console.log("User ID is missing, stopping fetchAlerts"); // Debugging log
          setLoading(false); // Stop loading if user ID is missing
          return;
        }
        setLoading(true);
        console.log("Fetching alerts from API..."); // Debugging log
        const response = await alertsAPI.getAlerts();
        console.log("API response:", response); // Debugging log
        if (!response || !response.alerts) {
          throw new Error("Invalid response from API");
        }
        setAlerts(response.alerts);
      } catch (error) {
        console.error("Error fetching alerts:", error); // Debugging log
        toast({
          title: "Error loading alerts",
          description: "Could not load your alerts. Please try again later.",
          variant: "destructive",
        });
        setAlerts([]); // Clear alerts on error
      } finally {
        setLoading(false); // Ensure loading is stopped
      }
    };
    fetchAlerts();
  }, [user])

  // Function to handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  // Function to handle deleting an alert
  const handleDeleteAlert = async (id: string) => {
    try {
      await alertsAPI.deleteAlert(id)
      setAlerts(alerts.filter((alert) => alert._id !== id))
      toast({
        title: "Alert deleted",
        description: "Your alert has been successfully removed.",
      })
    } catch (error) {
      console.error("Error deleting alert:", error)
      toast({
        title: "Error",
        description: "Could not delete the alert. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Function to handle toggling an alert
  const handleToggleAlert = async (id: string, currentActive: boolean) => {
    try {
      const alert = alerts.find((a) => a._id === id)
      if (!alert) return

      await alertsAPI.updateAlert(id, {
        active: !currentActive,
      })

      setAlerts(alerts.map((alert) => (alert._id === id ? { ...alert, active: !currentActive } : alert)))

      toast({
        title: currentActive ? "Alert disabled" : "Alert enabled",
        description: `Your "${alert.name}" alert has been ${currentActive ? "disabled" : "enabled"}.`,
      })
    } catch (error) {
      console.error("Error updating alert:", error)
      toast({
        title: "Error",
        description: "Could not update the alert. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Function to handle creating a new alert
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Create Alert button clicked"); // Debugging log
    if (!user?._id) {
      console.log("User not logged in"); // Debugging log
      return;
    }
    try {
      console.log("Preparing alert data", formData); // Debugging log
      const alertData = {
        user_id: user._id, // Use logged-in user's ID
        name: formData.name || "New Alert",
        location: {
          address: formData.location || "Custom Location",
        },
        radius: Number.parseInt(formData.radius),
        crime_types: formData.crime_types,
        severity_levels: ["High", "Medium", "Low"], // Default to all severity levels
        notification_channels: formData.notification_channels,
        frequency: formData.frequency,
        active: formData.active,
      };
      console.log("Sending alert data to API", alertData); // Debugging log
      const response = await alertsAPI.createAlert(alertData);
      console.log("API response", response); // Debugging log
      setAlerts([...alerts, response.alert]);
      setNewAlert(false);
      resetForm();
      toast({
        title: "Alert created",
        description: "Your new alert has been successfully created.",
      });
    } catch (error) {
      console.error("Error creating alert", error); // Debugging log
      toast({
        title: "Error",
        description: "Could not create the alert. Please try again.",
      });
    }
  };

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      radius: "3",
      crime_types: ["all"],
      notification_channels: ["email"],
      frequency: "daily",
      active: true,
    })
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Alerts & Notifications</h1>
          <p className="text-muted-foreground">Manage your safety alerts and notification preferences</p>
        </div>
        <Button onClick={() => setNewAlert(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Alert
        </Button>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">My Alerts</TabsTrigger>
          <TabsTrigger value="preferences">Notification Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>Loading alerts...</span>
            </div>
          ) : (
            <>
              {newAlert && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Alert</CardTitle>
                    <CardDescription>Set up a new location-based safety alert</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form id="new-alert-form" onSubmit={handleCreateAlert} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="alert-name">Alert Name</Label>
                          <Input
                            id="alert-name"
                            placeholder="Home Area Alert"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="alert-location">Location</Label>
                          <div className="relative">
                            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="alert-location"
                              placeholder="Enter location..."
                              className="pl-8"
                              value={formData.location}
                              onChange={(e) => handleInputChange("location", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="alert-radius">Radius (km)</Label>
                          <Select value={formData.radius} onValueChange={(value) => handleInputChange("radius", value)}>
                            <SelectTrigger id="alert-radius">
                              <SelectValue placeholder="Select radius" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 km</SelectItem>
                              <SelectItem value="2">2 km</SelectItem>
                              <SelectItem value="3">3 km</SelectItem>
                              <SelectItem value="5">5 km</SelectItem>
                              <SelectItem value="10">10 km</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="alert-types">Crime Types</Label>
                          <Select
                            value={formData.crime_types[0]}
                            onValueChange={(value) => handleInputChange("crime_types", [value])}
                          >
                            <SelectTrigger id="alert-types">
                              <SelectValue placeholder="Select crime types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Crime Types</SelectItem>
                              <SelectItem value="Armed Robbery">Violent Crimes</SelectItem>
                              <SelectItem value="Burglary">Property Crimes</SelectItem>
                              <SelectItem value="Vehicle Theft">Vehicle Theft</SelectItem>
                              <SelectItem value="Drug-related">Drug-related</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="alert-channels">Notification Channels</Label>
                          <Select
                            value={formData.notification_channels[0]}
                            onValueChange={(value) => handleInputChange("notification_channels", [value])}
                          >
                            <SelectTrigger id="alert-channels">
                              <SelectValue placeholder="Select channels" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="both">Email & SMS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="alert-frequency">Alert Frequency</Label>
                          <Select
                            value={formData.frequency}
                            onValueChange={(value) => handleInputChange("frequency", value)}
                          >
                            <SelectTrigger id="alert-frequency">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediate">Immediate</SelectItem>
                              <SelectItem value="daily">Daily Digest</SelectItem>
                              <SelectItem value="weekly">Weekly Summary</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setNewAlert(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" form="new-alert-form">
                      Create Alert
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {alerts.length === 0 && !newAlert ? (
                <Card>
                  <CardContent className="flex h-64 flex-col items-center justify-center p-6 text-center">
                    <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-medium">No alerts yet</h3>
                    <p className="mb-4 text-muted-foreground">
                      Create your first alert to get notified about crime incidents in areas you care about.
                    </p>
                    <Button onClick={() => setNewAlert(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Alert
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {alerts.map((alert) => (
                    <Card key={alert._id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{alert.name}</CardTitle>
                          <Badge variant={alert.active ? "default" : "outline"}>
                            {alert.active ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                        <CardDescription>{alert.location.address}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{alert.radius} km radius</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {alert.crime_types.map((type) => (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between pt-2 text-sm">
                            <div className="flex items-center">
                              <Bell className="mr-1 h-4 w-4 text-muted-foreground" />
                              <span>{alert.frequency}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {alert.notification_channels.includes("email") && (
                                <Mail className="h-4 w-4 text-muted-foreground" />
                              )}
                              {alert.notification_channels.includes("sms") && (
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAlert(alert._id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                        <Switch
                          checked={alert.active}
                          onCheckedChange={() => handleToggleAlert(alert._id, alert.active)}
                        />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Customize how and when you receive safety notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="your@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+27 XX XXX XXXX" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Channels</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <Label htmlFor="email-notifications" className="cursor-pointer">
                        Email Notifications
                      </Label>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <Label htmlFor="sms-notifications" className="cursor-pointer">
                        SMS Notifications
                      </Label>
                    </div>
                    <Switch id="sms-notifications" defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Alert Types</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-alert-red" />
                      <Label htmlFor="high-severity" className="cursor-pointer">
                        High Severity Incidents
                      </Label>
                    </div>
                    <Switch id="high-severity" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-alert-orange" />
                      <Label htmlFor="medium-severity" className="cursor-pointer">
                        Medium Severity Incidents
                      </Label>
                    </div>
                    <Switch id="medium-severity" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-alert-yellow" />
                      <Label htmlFor="low-severity" className="cursor-pointer">
                        Low Severity Incidents
                      </Label>
                    </div>
                    <Switch id="low-severity" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-alert-green" />
                      <Label htmlFor="safety-updates" className="cursor-pointer">
                        Safety Improvements & Updates
                      </Label>
                    </div>
                    <Switch id="safety-updates" defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
