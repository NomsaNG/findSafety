"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Upload, X, AlertTriangle, Camera } from "lucide-react"

interface CommunityAlertFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

const crimeTypes = [
  "Armed Robbery",
  "Burglary",
  "Vehicle Theft",
  "Assault",
  "Suspicious Activity",
  "Drug Activity",
  "Vandalism",
  "Fraud/Scam",
  "Other",
]

const severityLevels = [
  { value: "Low", label: "Minor incident" },
  { value: "Medium", label: "Concerning activity" },
  { value: "High", label: "Serious crime" },
]

export function CommunityAlertForm({ open, onOpenChange, onSubmit }: CommunityAlertFormProps) {
  const [formData, setFormData] = useState({
    crimeType: "",
    location: "",
    description: "",
    severity: "Medium",
    media: [] as File[],
  })
  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setFormData({
      ...formData,
      media: [...formData.media, ...files].slice(0, 3), // Max 3 files
    })
  }

  const removeMedia = (index: number) => {
    setFormData({
      ...formData,
      media: formData.media.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onSubmit(formData)

      // Reset form
      setFormData({
        crimeType: "",
        location: "",
        description: "",
        severity: "Medium",
        media: [],
      })
    } catch (error) {
      console.error("Error submitting alert:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you'd reverse geocode these coordinates
          const { latitude, longitude } = position.coords
          setFormData({
            ...formData,
            location: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Report Alert
          </DialogTitle>
          <DialogDescription className="text-sm">
            Share information about a crime or suspicious activity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Crime Type */}
          <div className="space-y-2">
            <Label htmlFor="crime-type" className="text-sm font-medium">
              Crime Type *
            </Label>
            <Select value={formData.crimeType} onValueChange={(value) => handleInputChange("crimeType", value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select crime type" />
              </SelectTrigger>
              <SelectContent>
                {crimeTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">
              Location *
            </Label>
            <div className="flex gap-2">
              <Input
                id="location"
                placeholder="Enter address or area"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                required
                className="flex-1 h-9"
              />
              <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation} className="gap-1 px-2">
                <MapPin className="h-3 w-3" />
                Current
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what happened..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              required
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Severity Level</Label>
            <RadioGroup
              value={formData.severity}
              onValueChange={(value) => handleInputChange("severity", value)}
              className="space-y-2"
            >
              {severityLevels.map((level) => (
                <div key={level.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={level.value} id={level.value} />
                  <Label htmlFor={level.value} className="text-sm cursor-pointer">
                    <span className="font-medium">{level.value}</span> - {level.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Photos/Videos (Optional)</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-3">
              <div className="text-center">
                <Camera className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground mb-2">Upload photos or videos</p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaUpload}
                  className="hidden"
                  id="media-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("media-upload")?.click()}
                  className="gap-1 h-8"
                >
                  <Upload className="h-3 w-3" />
                  Choose Files
                </Button>
              </div>

              {formData.media.length > 0 && (
                <div className="mt-3 space-y-1">
                  {formData.media.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-xs">
                      <span className="truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedia(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Max 3 files, 10MB each</p>
          </div>

          {/* Privacy Notice */}
          <Alert className="py-2">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              Your alert will be visible to all community members. Avoid sharing personal information.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} size="sm">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.crimeType || !formData.location || !formData.description}
              size="sm"
            >
              {loading ? "Posting..." : "Post Alert"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
