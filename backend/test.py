
import pandas as pd 
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
        print(f"Read {len(police_stations)} police stations from {file_path}")
        return police_stations
    except Exception as e:
        print(f"Error reading police stations: {e}")
        return []

if __name__ == "__main__":
    police_stations = read_police_stations("../Police_points.xlsx")