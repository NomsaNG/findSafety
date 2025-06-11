"""
Data ingestion script for importing SAPS crime data into MongoDB Atlas
"""

import requests
import json
from datetime import datetime, timedelta
import random
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv
import pandas as pd

load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')
client = MongoClient(MONGODB_URI)
db = client['findsafety']
crimes_collection = db['crimes']

# Initialize sentence transformer
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

def generate_embedding(text: str):
    """Generate vector embedding for text"""
    embedding = model.encode(text)
    return embedding.tolist()

def read_police_stations(file_path):
    """Read police station data from an Excel file"""
    try:
        # Read the Excel file
        df = pd.read_excel(file_path)
        
        # Extract relevant columns (assuming columns: 'Name', 'Latitude', 'Longitude')
        police_stations = [
            {
                "name": row["COMPNT_NM"],
                "latitude": row["LOCATION_X"],
                "longitude": row["LOCATION_Y"]
            }
            for _, row in df.iterrows()
        ]
        
        return police_stations
    except Exception as e:
        print(f"Error reading police stations: {e}")
        return []

def generate_mock_saps_data():
    """Generate mock SAPS crime data for demonstration"""

    # South African cities and their coordinates
    locations = [
    {"city": "Johannesburg", "lat": -26.2041, "lng": 28.0473, "province": "Gauteng"},
    {"city": "Cape Town", "lat": -33.9249, "lng": 18.4241, "province": "Western Cape"},
    {"city": "Durban", "lat": -29.8587, "lng": 31.0218, "province": "KwaZulu-Natal"},
    {"city": "Pretoria", "lat": -25.7479, "lng": 28.2293, "province": "Gauteng"},
    {"city": "Port Elizabeth", "lat": -33.9608, "lng": 25.6022, "province": "Eastern Cape"},
    {"city": "Bloemfontein", "lat": -29.0852, "lng": 26.1596, "province": "Free State"},
    {"city": "East London", "lat": -33.0153, "lng": 27.9116, "province": "Eastern Cape"},
    {"city": "Pietermaritzburg", "lat": -29.6094, "lng": 30.3781, "province": "KwaZulu-Natal"},
    {"city": "Rustenburg", "lat": -25.6672, "lng": 27.2424, "province": "North West"},
    {"city": "Polokwane", "lat": -23.9045, "lng": 29.4689, "province": "Limpopo"},
    {"city": "Nelspruit", "lat": -25.4658, "lng": 30.9853, "province": "Mpumalanga"},
    {"city": "Kimberley", "lat": -28.7280, "lng": 24.7499, "province": "Northern Cape"},
    {"city": "George", "lat": -33.9648, "lng": 22.4617, "province": "Western Cape"},
    {"city": "Mthatha", "lat": -31.5889, "lng": 28.7844, "province": "Eastern Cape"},
    {"city": "Vereeniging", "lat": -26.6731, "lng": 27.9261, "province": "Gauteng"},
    {"city": "Paarl", "lat": -33.7342, "lng": 18.9621, "province": "Western Cape"},
    {"city": "Stellenbosch", "lat": -33.9346, "lng": 18.8610, "province": "Western Cape"},
    {"city": "Knysna", "lat": -34.0350, "lng": 23.0467, "province": "Western Cape"},
    {"city": "Beaufort West", "lat": -32.3480, "lng": 22.5829, "province": "Western Cape"},
    {"city": "Oudtshoorn", "lat": -33.5900, "lng": 22.2014, "province": "Western Cape"},
    {"city": "Klerksdorp", "lat": -26.8668, "lng": 26.6667, "province": "North West"},
    {"city": "Welkom", "lat": -27.9864, "lng": 26.7060, "province": "Free State"},
    {"city": "Upington", "lat": -28.4486, "lng": 21.2561, "province": "Northern Cape"},
    {"city": "Richards Bay", "lat": -28.7748, "lng": 32.0555, "province": "KwaZulu-Natal"},
    {"city": "Soweto", "lat": -26.2676, "lng": 27.8585, "province": "Gauteng"},
    {"city": "Worcester", "lat": -33.6465, "lng": 19.4485, "province": "Western Cape"},
    {"city": "Sutherland", "lat": -32.3743, "lng": 20.8064, "province": "Northern Cape"},
    {"city": "Swellendam", "lat": -34.0226, "lng": 20.4417, "province": "Western Cape"},
    {"city": "Queenstown", "lat": -31.8976, "lng": 26.8755, "province": "Eastern Cape"},
    {"city": "Newcastle", "lat": -27.7574, "lng": 29.9316, "province": "KwaZulu-Natal"},
    {"city": "Ladysmith", "lat": -28.5540, "lng": 29.7745, "province": "KwaZulu-Natal"},
    {"city": "Empangeni", "lat": -28.7553, "lng": 31.8935, "province": "KwaZulu-Natal"},
    {"city": "KwaDukuza", "lat": -29.3292, "lng": 31.2895, "province": "KwaZulu-Natal"},
    {"city": "Margate", "lat": -30.8640, "lng": 30.3706, "province": "KwaZulu-Natal"},
    {"city": "Middelburg", "lat": -31.5013, "lng": 26.1655, "province": "Eastern Cape"},
    {"city": "Springbok", "lat": -29.6641, "lng": 17.8860, "province": "Northern Cape"},
    {"city": "Kuruman", "lat": -27.4565, "lng": 23.4302, "province": "Northern Cape"},
    {"city": "De Aar", "lat": -30.6731, "lng": 24.0006, "province": "Northern Cape"},
    {"city": "Colesberg", "lat": -30.7192, "lng": 25.0963, "province": "Northern Cape"}
    ]

    # Crime types with descriptions and severity
    crime_types = [
        {
            "type": "Armed Robbery",
            "descriptions": [
                "Armed robbery at convenience store with firearm",
                "Bank robbery with multiple suspects",
                "Cash-in-transit heist on highway",
                "Armed robbery at shopping mall",
                "Restaurant robbery during business hours"
            ],
            "severity": "High"
        },
        {
            "type": "Burglary",
            "descriptions": [
                "Residential burglary with forced entry",
                "Business premises burglary overnight",
                "House burglary while residents away",
                "Office building burglary on weekend",
                "Warehouse burglary with stolen goods"
            ],
            "severity": "Medium"
        },
        {
            "type": "Vehicle Theft",
            "descriptions": [
                "Motor vehicle theft from parking lot",
                "Hijacking at traffic intersection",
                "Motorcycle theft from residential area",
                "Truck hijacking on national road",
                "Car theft from shopping center"
            ],
            "severity": "Medium"
        },
        {
            "type": "Assault",
            "descriptions": [
                "Common assault outside nightclub",
                "Domestic violence incident",
                "Assault with intent to cause grievous bodily harm",
                "Bar fight resulting in injuries",
                "Street assault during robbery attempt"
            ],
            "severity": "High"
        },
        {
            "type": "Drug-related",
            "descriptions": [
                "Drug dealing in residential area",
                "Possession of illegal substances",
                "Drug manufacturing operation discovered",
                "Drug trafficking arrest at border",
                "Illegal drug sales at school"
            ],
            "severity": "Low"
        },
        {
            "type": "Fraud",
            "descriptions": [
                "Credit card fraud at retail store",
                "Online banking fraud reported",
                "Identity theft and document fraud",
                "Investment scam targeting elderly",
                "ATM skimming device discovered"
            ],
            "severity": "Medium"
        },
        {
            "type": "Sexual Offences",
            "descriptions": [
                "Sexual assault reported to authorities",
                "Rape case under investigation",
                "Sexual harassment complaint filed",
                "Indecent assault incident",
                "Sexual offence against minor"
            ],
            "severity": "High"
        },
        {
            "type": "Murder",
            "descriptions": [
                "Homicide investigation ongoing",
                "Murder during robbery incident",
                "Domestic violence resulting in death",
                "Gang-related shooting fatality",
                "Murder case referred to court"
            ],
            "severity": "High"
        }
    ]
    
    crimes = []
    
    # Generate crimes for the last 6 months
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)
    
    for _ in range(2000):  # Generate 2000 mock crime records
        # Random date within the last 6 months
        random_days = random.randint(0, 180)
        crime_date = end_date - timedelta(days=random_days)
        
        # Random location
        location = random.choice(locations)
        
        # Add some randomness to coordinates (within ~90km radius)
        lat_offset = random.uniform(-0.9, 0.9)
        lng_offset = random.uniform(-0.9, 0.9)
        
        # Random crime type
        crime_type = random.choice(crime_types)
        description = random.choice(crime_type["descriptions"])
        
        # Create crime record
        crime = {
            "case_number": f"CAS-{random.randint(100000, 999999)}-{crime_date.year}",
            "type": crime_type["type"],
            "description": description,
            "description_vector": generate_embedding(description),
            "location": {
                "lat": location["lat"] + lat_offset,
                "lng": location["lng"] + lng_offset,
                "address": f"{location['city']}, {location['province']}",
                "province": location["province"],
                "city": location["city"]
            },
            "date": crime_date,
            "severity": crime_type["severity"],
            "status": random.choice(["Reported", "Under Investigation", "Closed", "Court Pending"]),
            "police_station": f"{location['city']} Police Station",
            "source": "SAPS",
            "imported_at": datetime.utcnow()
        }
        
        crimes.append(crime)
    
    return crimes

def import_crimes_to_mongodb(crimes):
    """Import crimes to MongoDB Atlas"""
    try:
        # Clear existing data (for demo purposes)
        crimes_collection.delete_many({})
        
        # Insert new data
        result = crimes_collection.insert_many(crimes)
        
        print(f"Successfully imported {len(result.inserted_ids)} crime records")
        
        # Create indexes for better performance
        crimes_collection.create_index([("date", -1)])
        crimes_collection.create_index([("type", 1)])
        crimes_collection.create_index([("location.city", 1)])
        crimes_collection.create_index([("severity", 1)])
        crimes_collection.create_index([("location.lat", 1), ("location.lng", 1)])
        
        print("Database indexes created successfully")
        
    except Exception as e:
        print(f"Error importing data: {e}")

def main():
    """Main function to run data ingestion"""
    print("Starting SAPS crime data ingestion...")
    
    # Generate mock data
    print("Generating mock SAPS crime data...")
    crimes = generate_mock_saps_data()
    
    # Import to MongoDB
    print("Importing data to MongoDB Atlas...")
    import_crimes_to_mongodb(crimes)
    
    print("Data ingestion completed successfully!")
    
    # Print some statistics
    total_crimes = crimes_collection.count_documents({})
    print(f"Total crimes in database: {total_crimes}")
    
    # Crime type breakdown
    pipeline = [
        {"$group": {"_id": "$type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    crime_stats = list(crimes_collection.aggregate(pipeline))
    print("\nCrime type breakdown:")
    for stat in crime_stats:
        print(f"  {stat['_id']}: {stat['count']}")

if __name__ == "__main__":
    police_stations = read_police_stations("../Police_points.xlsx")
    print(f"Loaded {len(police_stations)} police stations.")
    main()
