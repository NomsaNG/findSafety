// Mock crime data for South Africa
export const mockCrimeData = [
  // This would be populated with real data from SAPS in a production app
  // For demo purposes, we're using placeholder data
  {
    id: 1,
    type: "Armed Robbery",
    location: {
      lat: -26.1052,
      lng: 28.056,
      address: "Sandton, Johannesburg",
    },
    date: "2025-05-19T14:30:00",
    description: "Armed robbery at a convenience store. Two suspects fled on motorcycles.",
    severity: "High",
  },
  {
    id: 2,
    type: "Vehicle Theft",
    location: {
      lat: -33.918,
      lng: 18.4233,
      address: "Sea Point, Cape Town",
    },
    date: "2025-05-19T10:15:00",
    description: "Vehicle stolen from parking lot. Security camera footage available.",
    severity: "Medium",
  },
  {
    id: 3,
    type: "Burglary",
    location: {
      lat: -29.7075,
      lng: 31.0669,
      address: "Umhlanga, Durban",
    },
    date: "2025-05-18T23:45:00",
    description: "Residential burglary. Electronics and jewelry stolen.",
    severity: "Medium",
  },
  {
    id: 4,
    type: "Assault",
    location: {
      lat: -25.7461,
      lng: 28.2392,
      address: "Hatfield, Pretoria",
    },
    date: "2025-05-18T21:20:00",
    description: "Assault outside a nightclub. Victim sustained minor injuries.",
    severity: "High",
  },
  {
    id: 5,
    type: "Drug-related",
    location: {
      lat: -33.9275,
      lng: 18.4571,
      address: "Woodstock, Cape Town",
    },
    date: "2025-05-18T18:10:00",
    description: "Drug dealing reported in residential area.",
    severity: "Low",
  },
]

// Mock crime statistics by type
export const mockCrimeStats = {
  violent: {
    total: 1245,
    change: 5,
    breakdown: {
      robbery: 450,
      assault: 380,
      murder: 95,
      sexual: 320,
    },
  },
  property: {
    total: 3210,
    change: -2,
    breakdown: {
      burglary: 1250,
      theft: 1560,
      vandalism: 400,
    },
  },
  vehicle: {
    total: 876,
    change: 1,
    breakdown: {
      carTheft: 420,
      carjacking: 156,
      partTheft: 300,
    },
  },
  drug: {
    total: 654,
    change: -8,
  },
}

// Mock crime trends over time
export const mockCrimeTrends = [
  { month: "Jan", violent: 120, property: 180, drug: 60 },
  { month: "Feb", violent: 132, property: 190, drug: 70 },
  { month: "Mar", violent: 125, property: 200, drug: 65 },
  { month: "Apr", violent: 140, property: 210, drug: 75 },
  { month: "May", violent: 150, property: 195, drug: 80 },
]

// Mock police stations
export const mockPoliceStations = [
  {
    id: 1,
    name: "Sandton Police Station",
    location: {
      lat: -26.1071,
      lng: 28.0567,
    },
    phone: "011 722 4200",
  },
  {
    id: 2,
    name: "Cape Town Central Police Station",
    location: {
      lat: -33.9258,
      lng: 18.4232,
    },
    phone: "021 467 8000",
  },
  {
    id: 3,
    name: "Durban Central Police Station",
    location: {
      lat: -29.8579,
      lng: 31.0292,
    },
    phone: "031 325 4000",
  },
]
