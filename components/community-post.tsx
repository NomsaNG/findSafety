"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ThumbsUp, MessageCircle, Flag, MapPin, Clock, Shield, AlertTriangle, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CommunityPostProps {
  post: {
    id: string
    user: {
      name: string
      avatar: string
      verified: boolean
    }
    type: string
    location: {
      address: string
      coordinates: { lat: number; lng: number }
    }
    description: string
    timestamp: string
    media: any[]
    interactions: {
      upvotes: number
      comments: number
      flags: number
    }
    severity: string
    verified: boolean
  }
  onInteraction: (postId: string, action: "upvote" | "comment" | "flag") => void
}

export function CommunityPost({ post, onInteraction }: CommunityPostProps) {
  const [hasUpvoted, setHasUpvoted] = useState(false)

  const handleUpvote = () => {
    if (!hasUpvoted) {
      onInteraction(post.id, "upvote")
      setHasUpvoted(true)
    }
  }

  const handleComment = () => {
    onInteraction(post.id, "comment")
  }

  const handleFlag = () => {
    onInteraction(post.id, "flag")
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200"
      case "Medium":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Low":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCrimeTypeIcon = (type: string) => {
    switch (type) {
      case "Armed Robbery":
      case "Burglary":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "Suspicious Activity":
        return <Shield className="h-4 w-4 text-orange-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {post.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{post.user.name}</span>
                {post.user.verified && <Shield className="h-4 w-4 text-blue-500" />}
                {post.verified && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Community Verified
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{post.timestamp}</span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleFlag}>
                <Flag className="h-4 w-4 mr-2" />
                Report Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Crime Type and Severity */}
        <div className="flex items-center gap-2 mb-3">
          {getCrimeTypeIcon(post.type)}
          <span className="font-medium text-sm">{post.type}</span>
          <Badge variant="outline" className={`text-xs ${getSeverityColor(post.severity)}`}>
            {post.severity} Risk
          </Badge>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{post.location.address}</span>
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className="text-sm leading-relaxed">{post.description}</p>
        </div>

        {/* Media (if any) */}
        {post.media && post.media.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2">
              {post.media.slice(0, 2).map((media, index) => (
                <div key={index} className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Media {index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="mb-4" />

        {/* Interactions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUpvote}
              className={`gap-2 ${hasUpvoted ? "text-blue-600 bg-blue-50" : "text-muted-foreground"}`}
              disabled={hasUpvoted}
            >
              <ThumbsUp className={`h-4 w-4 ${hasUpvoted ? "fill-current" : ""}`} />
              <span className="text-sm">{post.interactions.upvotes}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleComment}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{post.interactions.comments}</span>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            {post.interactions.upvotes > 0 && <span>{post.interactions.upvotes} people found this helpful</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
