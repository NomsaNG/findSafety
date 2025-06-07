"use client"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { crimeAPI } from "@/lib/api-service"
import { useToast } from "./ui/use-toast"

export function CrimeResults({ searchParams = {} }: { searchParams?: any }) {
  const [loading, setLoading] = useState(true)
  const [crimes, setCrimes] = useState<any[]>([])
  const { toast } = useToast()

  // Load crime results from API
  useEffect(() => {
    const fetchCrimes = async () => {
      try {
        setLoading(true)

        // Get search parameters
        const params = {
          type: searchParams.type || undefined,
          location: searchParams.location || undefined,
          startDate: searchParams.startDate || undefined,
          endDate: searchParams.endDate || undefined,
          severity: searchParams.severity || undefined,
          limit: 20,
        }

        const response = await crimeAPI.getCrimes(params)
        setCrimes(response.crimes)
      } catch (error) {
        console.error("Error fetching crimes:", error)
        toast({
          title: "Error loading data",
          description: "Could not load crime data",
          variant: "destructive",
        })
        setCrimes([])
      } finally {
        setLoading(false)
      }
    }

    fetchCrimes()
  }, [searchParams, toast])

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
  }

  // Function to format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Function to get badge variant based on severity
  const getBadgeVariant = (severity: string) => {
    switch (severity) {
      case "High":
        return "destructive"
      case "Medium":
        return "default"
      case "Low":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span>Loading crime data...</span>
      </div>
    )
  }

  if (crimes.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-center">
        <div>
          <p className="text-muted-foreground">No crime data found matching your search criteria</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead>Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crimes.map((crime) => (
              <TableRow key={crime._id}>
                <TableCell>{formatDate(crime.date)}</TableCell>
                <TableCell>{formatTime(crime.date)}</TableCell>
                <TableCell>{crime.type}</TableCell>
                <TableCell className="max-w-[150px] truncate">{crime.location?.address || "Unknown"}</TableCell>
                <TableCell className="hidden max-w-[300px] truncate md:table-cell">{crime.description}</TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(crime.severity)}>{crime.severity}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 text-sm text-muted-foreground">Showing {crimes.length} results</div>
    </div>
  )
}
