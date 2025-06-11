"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Layers, Filter, Loader2 } from "lucide-react"
import { Slider } from "./ui/slider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { crimeAPI } from "@/lib/api-service"
import { useToast } from "./ui/use-toast"

// Mock token - in a real app, this would be an environment variable
const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  "pk.eyJ1Ijoibm9tc2FnIiwiYSI6ImNsb2Z1eXJ5azB0azYybG8ybTllODF0YXUifQ.j-UezBHQy7r81-b1R8-WsA"

// South Africa coordinates
const SA_CENTER: [number, number] = [25.0339, -29.0852]
const SA_BOUNDS = [
  [16.3449, -34.8333], // Southwest coordinates
  [32.8908, -22.1265], // Northeast coordinates
]

// Crime type filters
const CRIME_TYPES = [
  { id: "all", label: "All", checked: true },
  { id: "Armed Robbery", label: "Armed Robbery", checked: false },
  { id: "Assault", label: "Assault", checked: false },
  { id: "Murder", label: "Murder", checked: false },
  { id: "Burglary", label: "Burglary", checked: false },
  { id: "Vehicle Theft", label: "Vehicle Theft", checked: false },
  { id: "Sexual Offences", label: "Sexual Offences", checked: false },
  { id: "Fraud", label: "Fraud", checked: false },
]

// Time period filters
const TIME_PERIODS = [
  { id: "30", label: "Last 30 days", checked: true },
  { id: "90", label: "Last 90 days", checked: false },
  { id: "180", label: "Last 180 days", checked: false },
]

// Map layer filters
const MAP_LAYERS = [
  { id: "heatmap", label: "Heatmap", checked: true },
  // { id: "clusters", label: "Clusters", checked: false },
  { id: "police", label: "Police Stations", checked: true },
  { id: "points", label: "Crime Points", checked: true },

]

export function CrimeMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [heatmapIntensity, setHeatmapIntensity] = useState([50])
  const [loading, setLoading] = useState(false)
  const [crimeTypes, setCrimeTypes] = useState(CRIME_TYPES)
  const [timePeriods, setTimePeriods] = useState(TIME_PERIODS)
  const [mapLayers, setMapLayers] = useState(MAP_LAYERS)
  const { toast } = useToast()

  // Function to toggle crime type filter
  const toggleCrimeType = (id: string) => {
    setCrimeTypes(crimeTypes.map((type) => (type.id === id ? { ...type, checked: !type.checked } : type)))
  }

  // Function to toggle time period filter
  const toggleTimePeriod = (id: string) => {
    setTimePeriods(
      timePeriods.map((period) => ({
        ...period,
        checked: period.id === id,
      })),
    )
  }

  // Function to toggle map layer
  const toggleMapLayer = (id: string) => {
    setMapLayers(mapLayers.map((layer) => (layer.id === id ? { ...layer, checked: !layer.checked } : layer)))
  }

  // Function to load heatmap data from API
  const loadHeatmapData = async () => {
    if (!map.current || !loaded) return

    setLoading(true)

    try {
      // Get selected crime type
      const selectedCrimeType = crimeTypes.find((type) => type.checked && type.id !== "all")?.id || "all"

      // Get selected time period
      const selectedDays = Number.parseInt(timePeriods.find((period) => period.checked)?.id || "30")

      // Fetch heatmap data from API
      console.log("Fetching data...")
      const response = await crimeAPI.getHeatmapData({
      
        type: selectedCrimeType,

        days: selectedDays,
      })
      
      console.log("Heatmap response:", response)
      const geojson = {
        type: "FeatureCollection",
        features: response.heatmap_data.map((point) => ({
          type: "Feature",
          properties: {
            weight: point.weight,
            type: point.type,
            severity: point.severity,
          },
          geometry: {
            type: "Point",
            coordinates: [point.lng, point.lat],
          },
        })),
      }

      if (map.current.getSource("crimes")) {
        console.log("Map source:", map.current.getSource("crimes"))

        // Update existing source
        const source = map.current.getSource("crimes") as mapboxgl.GeoJSONSource

        // Convert API data to GeoJSON

        console.log("GeoJSON being set to source:", geojson); // Debugging GeoJSON data

        source.setData(geojson as any)
      } else {
        // Create new source and layers
        map.current.addSource("crimes", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: response.heatmap_data.map((point) => ({
              type: "Feature",
              properties: {
                weight: point.weight,
                type: point.type,
                severity: point.severity,
              },
              geometry: {
                type: "Point",
                coordinates: [point.lng, point.lat],
              },
            })),
          },
        })

        console.log("GeoJSON being set to source:", geojson); // Debugging GeoJSON data

        // Add heatmap layer
        map.current.addLayer({
          id: "crimes-heat",
          type: "heatmap",
          source: "crimes",
          paint: {
            "heatmap-weight": ["get", "weight"],
            "heatmap-intensity": heatmapIntensity[0] / 50,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(0, 0, 255, 0)",
              0.2,
              "rgba(0, 255, 255, 0.6)",
              0.4,
              "rgba(0, 255, 0, 0.6)",
              0.6,
              "rgba(255, 255, 0, 0.6)",
              0.8,
              "rgba(255, 128, 0, 0.7)",
              1,
              "rgba(255, 0, 0, 0.8)",
            ],
            "heatmap-radius": 20,
            "heatmap-opacity": 0.8,
          },
          layout: {
            visibility: mapLayers.find((layer) => layer.id === "heatmap")?.checked ? "visible" : "none",
          },
        })

        // Add cluster layer
        // map.current.addLayer({
        //   id: "crimes-clusters",
        //   type: "circle",
        //   source: "crimes",
        //   filter: ["has", "point_count"],
        //   paint: {
        //     "circle-color": ["step", ["get", "point_count"], "#51bbd6", 10, "#f1f075", 30, "#f28cb1"],
        //     "circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 30, 40],
        //   },
        //   layout: {
        //     visibility: mapLayers.find((layer) => layer.id === "clusters")?.checked ? "visible" : "none",
        //   },
        // })

        // Add cluster count layer
        map.current.addLayer({
          id: "crimes-cluster-count",
          type: "symbol",
          source: "crimes",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
            visibility: mapLayers.find((layer) => layer.id === "clusters")?.checked ? "visible" : "none",
          },
        })
      }

      // Add individual crime point markers
      map.current.addLayer({
        id: "crimes-points",
        type: "circle",
        source: "crimes",
        paint: {
          "circle-radius": 6,
          "circle-color": [
            "match",
            ["get", "severity"],
            "High", "#ff0000",
            "Medium", "#ffa500",
            "Low", "#00ff00",
            "#888"
          ],
          "circle-opacity": 0.7,
        },
        layout: {
          visibility: mapLayers.find((layer) => layer.id === "points")?.checked ? "visible" : "none",
        },
      })

     //Add police stations layer
      // map.current.addLayer({
      //   id: "police-stations-points",
      //   type: "circle",
      //   source: "stations",
      //   paint: {
      //     "circle-radius": 8,
      //     "circle-color": "#0000FF",
      //     "circle-opacity": 0.8,
      //   },
      //   layout: {
      //     visibility: mapLayers.find((layer) => layer.id === "police")?.checked ? "visible" : "none",
      //   },
      // });


      toast({
        title: "Map updated",
        description: `Loaded ${response.total_points} crime incidents`,
      })
    } catch (error) {
      console.error("Error loading heatmap data:", error)
      toast({
        title: "Error loading data",
        description: "Could not load crime data for the map",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Add function to fetch police station data
  const loadPoliceStationData = async () => {
    if (!map.current || !loaded) return;

    try {
      const response = await crimeAPI.getPoliceStations();

      console.log("Police stations API response:", response);
      const geojson = {
        type: "FeatureCollection", // Explicitly set the type
        features: response.stations.map((station) => ({
          type: "Feature",
          properties: {
            name: station.name,
            address: `${station.latitude}, ${station.longitude}`,
          },
          geometry: {
            type: "Point",
            coordinates: [station.latitude, station.longitude], 
          },
        })),
      };
      console.log("Target police station name:", response.stations[0]?.name);
      console.log("Target police station coordinates:", response.stations[0]?.latitude, response.stations[0]?.longitude);

      console.log("Police stations GeoJSON data after mapping:", geojson);

      if (map.current.getSource("police-stations")) {
        const source = map.current.getSource("police-stations") as mapboxgl.GeoJSONSource;
        source.setData(geojson as any);
      } else {
        map.current.addSource("police-stations", {
          type: "geojson",
          data: geojson,
        });

        map.current.addLayer({
          id: "police-stations-points",
          type: "circle",
          source: "police-stations",
          paint: {
            "circle-radius": 5,
            "circle-color": "#0000FF",
            "circle-opacity": 0.8,
          },
          layout: {
            visibility: mapLayers.find((layer) => layer.id === "police")?.checked ? "visible" : "none",
          },
        });
      }

      const policeStationsSource = map.current.getSource("police-stations");
      if (policeStationsSource) {
        console.log("Police stations GeoJSON data:", (policeStationsSource as mapboxgl.GeoJSONSource)._data);
      } else {
        console.log("Police stations source is undefined.");
      }
      console.log("Map bounds:", map.current.getBounds());
      console.log("Map zoom level:", map.current.getZoom());
    } catch (error) {
      console.error("Error loading police station data:", error);
      toast({
        title: "Error loading data",
        description: "Could not load police station data",
        variant: "destructive",
      });
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    // Initialize map only once
    if (map.current) return

    // In a real implementation, we would use the actual Mapbox token
    try {
      mapboxgl.accessToken = MAPBOX_TOKEN

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: SA_CENTER,
        zoom: 5,
        bounds: SA_BOUNDS as mapboxgl.LngLatBoundsLike,
      })

      map.current.on("load", () => {
        console.log("Map loaded")
        setLoaded(true)
        // loadHeatmapData()
      })


      

      map.current.on("click", "crimes-points", (e) => {
        const features = e.features as mapboxgl.MapboxGeoJSONFeature[]
        const { type, severity } = features[0].properties || {}

        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<strong>${type}</strong><br>Severity: ${severity}`)
          .addTo(map.current!)
      })
      
    } catch (error) {
      console.error("Error initializing map:", error)
      toast({
        title: "Map error",
        description: "Could not initialize the map",
        variant: "destructive",
      })
    }

    return () => {
      map.current?.remove()
    }
  }, [])

  useEffect(() => {
    if (loaded) {
      console.log("Calling loadHeatmapData from useEffect")
      loadHeatmapData()
    }
  }, [loaded])

  // Call the function to load police station data
  useEffect(() => {
    if (loaded) {
      loadPoliceStationData();
    }
  }, [loaded]);

  // Update heatmap intensity
  useEffect(() => {
    if (loaded && map.current && map.current.getLayer("crimes-heat")) {
      map.current.setPaintProperty("crimes-heat", "heatmap-intensity", heatmapIntensity[0] / 50)
    }
  }, [heatmapIntensity, loaded])

  // Update map layers visibility
  useEffect(() => {
    if (!loaded || !map.current) return

    const heatmapLayer = mapLayers.find((layer) => layer.id === "heatmap")
    const policeLayer = mapLayers.find((layer) => layer.id === "police")
    const pointsLayer = mapLayers.find((layer) => layer.id === "points")

    console.log("Heatmap visibility:", heatmapLayer?.checked)

    if (map.current.getLayer("crimes-heat")) {
      map.current.setLayoutProperty("crimes-heat", "visibility", heatmapLayer?.checked ? "visible" : "none")
    }
    
    console.log("Police stations visibility:", policeLayer?.checked);
    console.log("Police stations layer exists:", map.current.getLayer("police-stations-points"));
    console.log("Police stations source exists:", map.current.getSource("police-stations"));
    if (map.current.getLayer("police-stations-points")) {
      map.current.setLayoutProperty("police-stations-points", "visibility", policeLayer?.checked ? "visible" : "none");
    }

    if (map.current.getLayer("crimes-points")) {
    map.current.setLayoutProperty("crimes-points", "visibility", pointsLayer?.checked ? "visible" : "none")
}
  }, [mapLayers, loaded])

  // Apply filters when they change
  useEffect(() => {
    if (loaded && map.current) {
      loadHeatmapData()
    }
  }, [crimeTypes, timePeriods])

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Crime Types</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {crimeTypes.map((type) => (
              <DropdownMenuCheckboxItem
                key={type.id}
                checked={type.checked}
                onCheckedChange={() => toggleCrimeType(type.id)}
              >
                {type.label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Time Period</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {timePeriods.map((period) => (
              <DropdownMenuCheckboxItem
                key={period.id}
                checked={period.checked}
                onCheckedChange={() => toggleTimePeriod(period.id)}
              >
                {period.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm">
              <Layers className="mr-2 h-4 w-4" />
              Layers
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Map Layers</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mapLayers.map((layer) => (
              <DropdownMenuCheckboxItem
                key={layer.id}
                checked={layer.checked}
                onCheckedChange={() => toggleMapLayer(layer.id)}
              >
                {layer.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="absolute bottom-4 left-4 z-10 w-64 bg-background/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Heatmap Intensity</span>
                <span className="text-xs text-muted-foreground">{heatmapIntensity[0]}%</span>
              </div>
              <Slider value={heatmapIntensity} onValueChange={setHeatmapIntensity} max={100} step={1} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div ref={mapContainer} className="h-full w-full" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading crime data...</span>
          </div>
        </div>
      )}

      {/* Fallback for demo purposes */}
      {!loaded && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center">
            <p className="text-lg font-medium">Map visualization would appear here</p>
            <p className="text-sm text-muted-foreground">Using Mapbox to display crime heatmaps across South Africa</p>
          </div>
        </div>
      )}
    </div>
  )
}