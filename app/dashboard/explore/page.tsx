"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CrimeMap } from "@/components/crime-map"
import { Search, Filter, MapPin } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { CrimeResults } from "@/components/crime-results"
import { useToast } from "@/components/ui/use-toast"

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [view, setView] = useState("map")
  const [location, setLocation] = useState("")
  const [crimeType, setCrimeType] = useState("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [searchParams, setSearchParams] = useState<any>({})
  const { toast } = useToast()

  // Function to apply filters
  const applyFilters = () => {
    const params: any = {}

    if (searchQuery) {
      params.query = searchQuery
    }

    if (location) {
      params.location = location
    }

    if (crimeType !== "all") {
      params.type = crimeType
    }

    if (dateRange.from) {
      params.startDate = dateRange.from.toISOString()
    }

    if (dateRange.to) {
      params.endDate = dateRange.to.toISOString()
    }

    setSearchParams(params)

    toast({
      title: "Filters applied",
      description: "Crime data has been filtered based on your criteria",
    })

    // Switch to list view if using search query
    if (searchQuery) {
      setView("list")
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">Explore Crime Data</h1>
        <p className="text-muted-foreground">Search, filter, and analyze crime patterns across South Africa</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Parameters</CardTitle>
          <CardDescription>Define your search criteria to explore crime data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Query</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search crime descriptions..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Crime Type</label>
              <Select value={crimeType} onValueChange={setCrimeType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select crime type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crime Types</SelectItem>
                  <SelectItem value="Armed Robbery">Armed Robbery</SelectItem>
                  <SelectItem value="Assault">Assault</SelectItem>
                  <SelectItem value="Burglary">Burglary</SelectItem>
                  <SelectItem value="Vehicle Theft">Vehicle Theft</SelectItem>
                  <SelectItem value="Drug-related">Drug-related</SelectItem>
                  <SelectItem value="Murder">Murder</SelectItem>
                  <SelectItem value="Sexual Offences">Sexual Offences</SelectItem>
                  <SelectItem value="Fraud">Fraud</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter location..."
                  className="pl-8"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithRange value={dateRange} onChange={setDateRange} />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button className="gap-2" onClick={applyFilters}>
              <Filter className="h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="map" value={view} onValueChange={setView} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="h-[600px]">
                <CrimeMap />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <CrimeResults searchParams={searchParams} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
