"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Phone, AlertTriangle, ThumbsUp, Shield, Filter, Clock } from "lucide-react"
import { CommunityAlertForm } from "@/components/community-alert-form"
import { ReportToPoliceDialog } from "@/components/report-to-police-dialog"
import { LocationFilter } from "@/components/location-filter"
import { SafetyTipsSection } from "@/components/safety-tips-section"
import { CommunityPost } from "@/components/community-post"
import { useToast } from "@/components/ui/use-toast"
import { useAuthGuard } from "@/lib/auth-service"

// Mock community posts data
const mockCommunityPosts = [
  {
    id: "1",
    user: {
      name: "Sarah M.",
      avatar: "",
      verified: true,
    },
    type: "Armed Robbery",
    location: {
      address: "Sandton City Mall, Johannesburg",
      coordinates: { lat: -26.1052, lng: 28.056 },
    },
    description:
      "Two suspects approached me in the parking garage around 6 PM. They demanded my phone and wallet. Security arrived quickly but suspects fled. Be extra careful in the lower levels.",
    timestamp: "2 hours ago",
    media: [],
    interactions: {
      upvotes: 12,
      comments: 5,
      flags: 0,
    },
    severity: "High",
    verified: false,
  },
  {
    id: "2",
    user: {
      name: "Mike K.",
      avatar: "",
      verified: false,
    },
    type: "Suspicious Activity",
    location: {
      address: "Rosebank, Johannesburg",
      coordinates: { lat: -26.1467, lng: 28.0436 },
    },
    description:
      "Noticed someone trying car door handles on Oxford Road around 2 AM. Called security but person disappeared. Residents should lock their cars properly.",
    timestamp: "5 hours ago",
    media: [],
    interactions: {
      upvotes: 8,
      comments: 3,
      flags: 0,
    },
    severity: "Medium",
    verified: true,
  },
  {
    id: "3",
    user: {
      name: "Lisa P.",
      avatar: "",
      verified: true,
    },
    type: "Vehicle Theft",
    location: {
      address: "Melville, Johannesburg",
      coordinates: { lat: -26.1875, lng: 28.0103 },
    },
    description:
      "My car was stolen from 7th Street this morning. White Toyota Corolla, license plate CA 123 GP. Please keep an eye out. Case opened at Brixton Police Station.",
    timestamp: "1 day ago",
    media: [],
    interactions: {
      upvotes: 24,
      comments: 8,
      flags: 0,
    },
    severity: "High",
    verified: true,
  },
]

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [showAlertForm, setShowAlertForm] = useState(false)
  const [showPoliceReport, setShowPoliceReport] = useState(false)
  const [posts, setPosts] = useState(mockCommunityPosts)
  const [filteredPosts, setFilteredPosts] = useState(mockCommunityPosts)
  const [activeTab, setActiveTab] = useState("recent")
  const { toast } = useToast()

  // Protect the route
  const isAuthenticated = useAuthGuard()

  // Filter posts based on search and location
  useEffect(() => {
    let filtered = posts

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (post) =>
          post.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.location.address.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Location filter
    if (selectedLocation.trim()) {
      filtered = filtered.filter((post) => post.location.address.toLowerCase().includes(selectedLocation.toLowerCase()))
    }

    // Sort by tab selection
    if (activeTab === "recent") {
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } else if (activeTab === "popular") {
      filtered.sort((a, b) => b.interactions.upvotes - a.interactions.upvotes)
    } else if (activeTab === "verified") {
      filtered = filtered.filter((post) => post.verified)
    }

    setFilteredPosts(filtered)
  }, [searchQuery, selectedLocation, posts, activeTab])

  const handleNewAlert = (alertData: any) => {
    const newPost = {
      id: Date.now().toString(),
      user: {
        name: "You",
        avatar: "",
        verified: false,
      },
      type: alertData.crimeType,
      location: {
        address: alertData.location,
        coordinates: { lat: 0, lng: 0 }, // Would be geocoded in real app
      },
      description: alertData.description,
      timestamp: "Just now",
      media: alertData.media || [],
      interactions: {
        upvotes: 0,
        comments: 0,
        flags: 0,
      },
      severity: alertData.severity || "Medium",
      verified: false,
    }

    setPosts([newPost, ...posts])
    setShowAlertForm(false)

    toast({
      title: "Community Alert Posted",
      description: "Your alert has been shared with the community. Thank you for keeping everyone informed.",
    })
  }

  const handlePostInteraction = (postId: string, action: "upvote" | "comment" | "flag") => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          const updatedPost = { ...post }
          if (action === "upvote") {
            updatedPost.interactions.upvotes += 1
          } else if (action === "comment") {
            updatedPost.interactions.comments += 1
          } else if (action === "flag") {
            updatedPost.interactions.flags += 1
          }
          return updatedPost
        }
        return post
      }),
    )

    if (action === "upvote") {
      toast({
        title: "Post upvoted",
        description: "Thank you for validating this community alert.",
      })
    } else if (action === "flag") {
      toast({
        title: "Post flagged",
        description: "Thank you for helping maintain community standards.",
      })
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Community Safety</h1>
            <p className="text-muted-foreground">Share alerts, stay informed, and keep your community safe</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowPoliceReport(true)} variant="outline" className="gap-2">
              <Phone className="h-4 w-4" />
              Report to Police
            </Button>
            <Button onClick={() => setShowAlertForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Post Alert
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search by crime type, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Location Filter */}
            <LocationFilter selectedLocation={selectedLocation} onLocationChange={setSelectedLocation} />

            {/* Safety Tips */}
            <SafetyTipsSection />

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Alerts</span>
                  <Badge variant="secondary">{posts.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Verified Posts</span>
                  <Badge variant="secondary">{posts.filter((p) => p.verified).length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <Badge variant="secondary">12</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Community Alerts</CardTitle>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {filteredPosts.length} of {posts.length} posts
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="recent" className="gap-2">
                      <Clock className="h-4 w-4" />
                      Recent
                    </TabsTrigger>
                    <TabsTrigger value="popular" className="gap-2">
                      <ThumbsUp className="h-4 w-4" />
                      Popular
                    </TabsTrigger>
                    <TabsTrigger value="verified" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Verified
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="recent" className="mt-0">
                    <div className="space-y-6">
                      {filteredPosts.length === 0 ? (
                        <div className="text-center py-12">
                          <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-xl font-medium mb-2">No alerts found</h3>
                          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            {searchQuery || selectedLocation
                              ? "Try adjusting your search or location filters to see more results"
                              : "Be the first to share a community alert and help keep everyone informed"}
                          </p>
                          <Button onClick={() => setShowAlertForm(true)} size="lg">
                            <Plus className="h-4 w-4 mr-2" />
                            Post First Alert
                          </Button>
                        </div>
                      ) : (
                        filteredPosts.map((post) => (
                          <CommunityPost key={post.id} post={post} onInteraction={handlePostInteraction} />
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="popular" className="mt-0">
                    <div className="space-y-6">
                      {filteredPosts.map((post) => (
                        <CommunityPost key={post.id} post={post} onInteraction={handlePostInteraction} />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="verified" className="mt-0">
                    <div className="space-y-6">
                      {filteredPosts.map((post) => (
                        <CommunityPost key={post.id} post={post} onInteraction={handlePostInteraction} />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialogs */}
        <CommunityAlertForm open={showAlertForm} onOpenChange={setShowAlertForm} onSubmit={handleNewAlert} />

        <ReportToPoliceDialog open={showPoliceReport} onOpenChange={setShowPoliceReport} />
      </div>
    </div>
  )
}
