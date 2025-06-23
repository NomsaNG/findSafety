
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.operations import SearchIndexModel
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv
# import openai

from sentence_transformers import SentenceTransformer
import numpy as np
from bson import ObjectId
import json
from typing import List, Dict, Any
from dateutil.parser import parse
import firebase_admin
from firebase_admin import credentials, messaging

# Import authentication module
from auth import (
    register_user, login_user, get_user_profile, update_user_profile,
    require_auth
)

# Import data ingestion module
from data_ingestion import read_police_stations


# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["https://find-safety-90nitdmzg-natashas-projects-cb323fc8.vercel.app"])


# MongoDB Atlas connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://nomsa:simplepassword@cluster0.obnp1dw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
client = MongoClient(MONGODB_URI)
db = client['findsafety']

# Collections
crimes_collection = db['crimes']
alerts_collection = db['alerts']
users_collection = db['users']

# Initialize sentence transformer for vector embeddings
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# OpenAI API key for chat functionality
gemini_key = os.getenv('GEMINI_API_KEY')

client = genai.Client(api_key=gemini_key)

# Initialize Firebase Admin SDK
cred = credentials.Certificate("/Users/nomsagoba/Downloads/findsafety/findsafety-c108d-firebase-adminsdk-fbsvc-189248dba5.json")
firebase_admin.initialize_app(cred)

# Example function to send a push notification
def send_push_notification(token, title, body):
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body
        ),
        token=token
    )
    response = messaging.send(message)
    print("Successfully sent message:", response)

class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle ObjectId and datetime objects"""
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

app.json_encoder = JSONEncoder

def create_search_indexes():
    """Create vector search indexes for MongoDB Atlas"""
    try:
        # Vector search index for crime descriptions
        vector_index = SearchIndexModel(
            definition={
                "fields": [
                    {
                        "type": "vector",
                        "path": "description_vector",
                        "numDimensions": 384,  # Dimension for all-MiniLM-L6-v2
                        "similarity": "cosine"
                    }
                ]
            },
            name="crime_vector_index"
        )
        
        # Text search index for general search
        text_index = SearchIndexModel(
            definition={
                "mappings": {
                    "dynamic": False,
                    "fields": {
                        "description": {"type": "string"},
                        "location.address": {"type": "string"},
                        "type": {"type": "string"}
                    }
                }
            },
            name="crime_text_index"
        )
        
        # crimes_collection.create_search_indexes([vector_index, text_index])
        print("Search indexes created successfully")
    except Exception as e:
        print(f"Error creating search indexes: {e}")

def generate_embedding(text: str) -> List[float]:
    """Generate vector embedding for text using sentence transformer"""
    embedding = model.encode(text)
    return embedding.tolist()

# Authentication routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        
        result = register_user(email, password, first_name, last_name)
        
        return jsonify(result), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        
        result = login_user(email, password)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.route('/api/auth/profile', methods=['GET'])
@require_auth
def get_profile():
    """Get user profile endpoint"""
    try:
        user_id = str(request.current_user['_id'])
        profile = get_user_profile(user_id)
        
        return jsonify({"user": profile}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/auth/profile', methods=['PUT'])
@require_auth
def update_profile():
    """Update user profile endpoint"""
    try:
        data = request.get_json()
        user_id = str(request.current_user['_id'])
        
        updated_profile = update_user_profile(user_id, data)
        
        return jsonify({
            "user": updated_profile,
            "message": "Profile updated successfully"
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow()})

def convert_objectid(doc):
    """Recursively convert ObjectId fields in a document to strings."""
    if isinstance(doc, list):
        return [convert_objectid(d) for d in doc]
    if isinstance(doc, dict):
        return {k: str(v) if isinstance(v, ObjectId) else v for k, v in doc.items()}
    return doc

@app.route('/api/crimes', methods=['GET'])
def get_crimes():
    try:
        crime_type = request.args.get('type', 'all')
        location = request.args.get('location')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        severity = request.args.get('severity')
        limit = int(request.args.get('limit', 10))

        query = {}

        if crime_type != 'all':
            query['type'] = {'$regex': crime_type, '$options': 'i'}

        if location:
            # Search in multiple location fields
            query['$or'] = [
                {'location.address': {'$regex': location, '$options': 'i'}},
                {'location.city': {'$regex': location, '$options': 'i'}},
                {'location.province': {'$regex': location, '$options': 'i'}}
            ]
            
        if severity:
            query['severity'] = severity

        if start_date and end_date:
            query['date'] = {
                '$gte': datetime.fromisoformat(start_date.replace('Z', '+00:00')),
                '$lte': datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            }
        elif start_date:
            query['date'] = {'$gte': datetime.fromisoformat(start_date.replace('Z', '+00:00'))}
        elif end_date:
            query['date'] = {'$lte': datetime.fromisoformat(end_date.replace('Z', '+00:00'))}

        crimes = list(crimes_collection.find(query).limit(limit).sort('date', -1))
        crimes = convert_objectid(crimes)

        return jsonify({
            "crimes": crimes,
            "total": len(crimes),
            "query": query
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/crimes/search', methods=['POST'])
def search_crimes():
    """Vector search for crimes using natural language queries"""
    try:
        data = request.get_json()
        query_text = data.get('query', '')
        limit = data.get('limit', 10)
        
        if not query_text:
            return jsonify({"error": "Query text is required"}), 400
        
        # Generate embedding for the query
        query_embedding = generate_embedding(query_text)
        
        # Perform vector search
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "crime_vector_index",
                    "path": "description_vector",
                    "queryVector": query_embedding,
                    "numCandidates": 100,
                    "limit": limit
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "type": 1,
                    "description": 1,
                    "location": 1,
                    "date": 1,
                    "severity": 1,
                    "score": {"$meta": "vectorSearchScore"}
                }
            }
        ]
        
        results = list(crimes_collection.aggregate(pipeline))
        
        return jsonify({
            "results": results,
            "query": query_text,
            "total": len(results)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/crimes/stats', methods=['GET'])
def get_crime_stats():
    """Get crime statistics"""
    try:
        # Get date range (default to last 30 days)
        location = request.args.get('location')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # Build base query
        base_query = {}
        if location:
            base_query['$or'] = [
                {'location.address': {'$regex': location, '$options': 'i'}},
                {'location.city': {'$regex': location, '$options': 'i'}},
                {'location.province': {'$regex': location, '$options': 'i'}}
            ]

        # Default to last 30 days if no date range specified
        if not start_date and not end_date:
            end_date_obj = datetime.utcnow()
            start_date_obj = end_date_obj - timedelta(days=30)
        else:
            if start_date:
                start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            else:
                start_date_obj = datetime.utcnow() - timedelta(days=30)

            if end_date:
                end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            else:
                end_date_obj = datetime.utcnow()

        base_query['date'] = {"$gte": start_date_obj, "$lte": end_date_obj}

        # Aggregate crime statistics
        pipeline = [
            {
                "$match": base_query
            },
            {
                "$group": {
                    "_id": "$type",
                    "count": {"$sum": 1},
                    "severity_breakdown": {
                        "$push": "$severity"
                    }
                }
            },
            {
                "$project": {
                    "type": "$_id",
                    "count": 1,
                    "high_severity": {
                        "$size": {
                            "$filter": {
                                "input": "$severity_breakdown",
                                "cond": {"$eq": ["$$this", "High"]}
                            }
                        }
                    },
                    "medium_severity": {
                        "$size": {
                            "$filter": {
                                "input": "$severity_breakdown",
                                "cond": {"$eq": ["$$this", "Medium"]}
                            }
                        }
                    },
                    "low_severity": {
                        "$size": {
                            "$filter": {
                                "input": "$severity_breakdown",
                                "cond": {"$eq": ["$$this", "Low"]}
                            }
                        }
                    }
                }
            }
        ]

        stats = list(crimes_collection.aggregate(pipeline))

        return jsonify({
            "stats": stats,
            "period": {
                "start": start_date_obj.isoformat(),
                "end": end_date_obj.isoformat()
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/crimes/trends', methods=['GET'])
def get_crime_trends():
    """Get crime trends over time"""
    try:
        # Get query parameters for filtering
        location = request.args.get('location')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build base query
        base_query = {}
        
        if location:
            base_query['$or'] = [
                {'location.address': {'$regex': location, '$options': 'i'}},
                {'location.city': {'$regex': location, '$options': 'i'}},
                {'location.province': {'$regex': location, '$options': 'i'}}
            ]
        
        # Default to last 6 months if no date range specified
        if not start_date and not end_date:
            end_date_obj = datetime.utcnow()
            start_date_obj = end_date_obj - timedelta(days=180)
        else:
            if start_date:
                start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            else:
                start_date_obj = datetime.utcnow() - timedelta(days=180)
            
            if end_date:
                end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            else:
                end_date_obj = datetime.utcnow()
        
        base_query['date'] = {"$gte": start_date_obj, "$lte": end_date_obj}
        
        pipeline = [
            {
                "$match": {
                    "date": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$date"},
                        "month": {"$month": "$date"},
                        "type": "$type"
                    },
                    "count": {"$sum": 1}
                }
            },
            {
                "$group": {
                    "_id": {
                        "year": "$_id.year",
                        "month": "$_id.month"
                    },
                    "crimes": {
                        "$push": {
                            "type": "$_id.type",
                            "count": "$count"
                        }
                    }
                }
            },
            {
                "$sort": {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]
        
        trends = list(crimes_collection.aggregate(pipeline))
        
        return jsonify({
            "trends": trends,
            "period": {
                "start": start_date,
                "end": end_date
            }
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/crimes/heatmap', methods=['GET'])
def get_heatmap_data():
    """Get crime data for heatmap visualization"""
    try:
        # Get query parameters
        crime_type = request.args.get('type', 'all')
        location = request.args.get('location')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        days = int(request.args.get('days', 30))
        
        # Build query
        query = {}
        
        # Date filtering
        if start_date and end_date:
            query['date'] = {
                "$gte": datetime.fromisoformat(start_date.replace('Z', '+00:00')),
                "$lte": datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            }
        else:
            # Default to specified days
            end_date_obj = datetime.utcnow()
            start_date_obj = end_date_obj - timedelta(days=days)
            query['date'] = {"$gte": start_date_obj, "$lte": end_date_obj}
        
        if crime_type != 'all':
            query['type'] = {'$regex': crime_type, '$options': 'i'}
        
        if location:
            query['$or'] = [
                {'location.address': {'$regex': location, '$options': 'i'}},
                {'location.city': {'$regex': location, '$options': 'i'}},
                {'location.province': {'$regex': location, '$options': 'i'}}
            ]
        
        # Get crimes with location data
        crimes = list(crimes_collection.find(
            query,
            {
                "location.lat": 1,
                "location.lng": 1,
                "type": 1,
                "severity": 1,
                "date": 1
            }
        ))
        
        # Format for heatmap
        heatmap_data = []
        for crime in crimes:
            # print(":", crime)  # Log each crime being processed
            if 'location' in crime and 'lat' in crime['location'] and 'lng' in crime['location']:
                # Weight based on severity
                weight = 1
                if crime.get('severity') == 'High':
                    weight = 3
                elif crime.get('severity') == 'Medium':
                    weight = 2
                
                heatmap_data.append({
                    "lat": crime['location']['lat'],
                    "lng": crime['location']['lng'],
                    "weight": weight,
                    "type": crime.get('type'),
                    "severity": crime.get('severity'),
                    "date": crime.get('date')
                })
        # print("Query:", query)  # Log the query
        # print("Heatmap Data:", heatmap_data)  # Log the heatmap data
        return jsonify({
            "heatmap_data": heatmap_data,
            "total_points": len(heatmap_data),
            "query": query
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    from google import genai
    from google.generativeai import GenerativeModel
    print("POST /api/chat called")  # Log the endpoint call
    try:
        print("Parsing request")
        data = request.get_json()
        print("Request data:", data)  # Log the request data
        user_message = data.get('message', '')
        print("User message:", user_message)  # Log the user message

        if not user_message:
            print("Error: Message is required")
            return jsonify({"error": "Message is required"}), 400

        # Get relevant crime data based on the query
        print("Generating embedding for user message")
        query_embedding = generate_embedding(user_message)
        print("Query embedding generated")  # Log the embedding generation

        # Search for relevant crimes
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "crime_vector_index",
                    "path": "description_vector",
                    "queryVector": query_embedding,
                    "numCandidates": 50,
                    "limit": 5
                }
            },
            {
                "$project": {
                    "type": 1,
                    "description": 1,
                    "location": 1,
                    "date": 1,
                    "severity": 1
                }
            }
        ]
        print("Running vector search pipeline")  # Log the pipeline execution
        relevant_crimes = list(db['crimes'].find().sort("date", -1).limit(5))
        relevant_crimes = convert_objectid(relevant_crimes)  # Convert ObjectId fields
        print("Relevant crimes found:", relevant_crimes)  # Log the results

        # Fetch recent raw scraped data (limit to last 5 posts)
        recent_scraped_posts = list(db['raw_scraped_data'].find().sort("date", -1).limit(5))
        recent_scraped_posts = convert_objectid(recent_scraped_posts)  # Convert ObjectId fields
        print("Recent scraped posts:", recent_scraped_posts)  # Log the scraped posts

        # Prepare context for AI
        context = "Recent crimes:\n"
        for crime in relevant_crimes:
            context += f"- {crime['type']} in {crime.get('location', {}).get('address', 'unknown location')} on {crime['date'].strftime('%Y-%m-%d')}: {crime['description']}\n"

        context += "\nRecent scraped posts:\n"
        for post in recent_scraped_posts:
            context += f"- {post.get('title', 'No title')} on {post.get('date', 'unknown date')}: {post.get('content', 'No content')}\n"

        print("Context prepared for AI:", context)  # Log the context

        # Generate AI response
        print("Generating AI response")  # Log the AI response generation

        try:
            model = GenerativeModel('gemini-1.5-flash')

            prompt = (
                "You are FindSafetyAI, an AI assistant specialized in crime data analysis.\n\n"
                "You help South Africans stay informed about crime trends and safety issues.\n\n"
                "Your role is to answer questions about recent and past crimes using the real data from our database.\n\n"
                "Offer practical, sensitive, and trauma-aware advice to concerned citizens.\n\n"
                "Encourage community engagement and reporting suspicious activities.\n\n"
                "always be calm, respectful, and exaggarate. Your tone must be serious, professional, and empathetic.\n\n"
                "When answering:"
                "If the user's question involves a location, date range, or type of crime, search the database for matches and summarize key patterns (e.g., crime type, location, severity, date)."
                "If the data is limited or not found, say so transparently, and encourage users to report it on the community page."
                "If a crime sounds unreported, gently ask if they'd like to report it or be connected to a local station."
                "Be detailed but concise, focusing on the most relevant information."
                f"Context: {context}\n\n"
                f"Question: {user_message}"
            )

            response = model.generate_content([
                {"role": "user", "parts": [{"text": prompt}]}
            ])

            ai_response = response.text
            print("AI Response:", ai_response)  # Log the AI response
        except Exception as gemini_error:
            print("Gemini API error:", gemini_error)
            return jsonify({"error": "Failed to generate AI response"}), 500

        return jsonify({
            "response": ai_response,
            "relevant_crimes": relevant_crimes,
            "recent_scraped_posts": recent_scraped_posts,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    except Exception as e:
        print("Error in /api/chat:", e)  # Log the error
        return jsonify({"error": str(e)}), 500

@app.route('/api/alerts', methods=['GET'])
@require_auth
def get_alerts():
    """Get user alerts"""
    try:
        user_id = str(request.current_user['_id'])  # Retrieve user_id from authenticated session

        # Validate that the user exists
        user_exists = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user_exists:
            return jsonify({"error": "User not found"}), 404

        alerts = list(alerts_collection.find({"user_id": user_id}))
        alerts = convert_objectid(alerts)  # Convert ObjectId fields to strings

        return jsonify({
            "alerts": alerts,
            "total": len(alerts)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/alerts', methods=['POST'])
@require_auth
def create_alert():
    """Create a new alert"""
    try:
        data = request.get_json()

        # Retrieve user_id from authenticated session
        user_id = str(request.current_user['_id'])

        alert = {
            "user_id": user_id,
            "name": data.get('name'),
            "location": data.get('location'),
            "radius": data.get('radius', 5),
            "crime_types": data.get('crime_types', []),
            "severity_levels": data.get('severity_levels', ['High', 'Medium', 'Low']),
            "notification_channels": data.get('notification_channels', ['email']),
            "frequency": data.get('frequency', 'daily'),
            "active": data.get('active', True),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = alerts_collection.insert_one(alert)
        alert['_id'] = result.inserted_id

        # Convert ObjectId fields to strings
        alert = convert_objectid(alert)

        return jsonify({
            "alert": alert,
            "message": "Alert created successfully"
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/alerts/<alert_id>', methods=['PUT'])
def update_alert(alert_id):
    """Update an existing alert"""
    try:
        data = request.get_json()
        
        update_data = {
            "updated_at": datetime.utcnow()
        }
        
        # Add fields that can be updated
        updatable_fields = ['name', 'location', 'radius', 'crime_types', 'severity_levels', 
                           'notification_channels', 'frequency', 'active']
        
        for field in updatable_fields:
            if field in data:
                update_data[field] = data[field]
        
        result = alerts_collection.update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Alert not found"}), 404
        
        updated_alert = alerts_collection.find_one({"_id": ObjectId(alert_id)})
        
        return jsonify({
            "alert": updated_alert,
            "message": "Alert updated successfully"
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/alerts/<alert_id>', methods=['DELETE'])
def delete_alert(alert_id):
    """Delete an alert"""
    try:
        result = alerts_collection.delete_one({"_id": ObjectId(alert_id)})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Alert not found"}), 404
        
        return jsonify({"message": "Alert deleted successfully"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/data/import', methods=['POST'])
def import_crime_data():
    """Import crime data (for data ingestion)"""
    try:
        data = request.get_json()
        crimes = data.get('crimes', [])
        
        # Process each crime record
        processed_crimes = []
        for crime in crimes:
            # Generate vector embedding for description
            if 'description' in crime:
                crime['description_vector'] = generate_embedding(crime['description'])
            
            # Ensure proper date format
            if 'date' in crime and isinstance(crime['date'], str):
                crime['date'] = datetime.fromisoformat(crime['date'])
            
            # Add metadata
            crime['imported_at'] = datetime.utcnow()
            
            processed_crimes.append(crime)
        
        # Insert into database
        if processed_crimes:
            result = crimes_collection.insert_many(processed_crimes)
            
            return jsonify({
                "message": f"Successfully imported {len(result.inserted_ids)} crime records",
                "inserted_ids": [str(id) for id in result.inserted_ids]
            })
        else:
            return jsonify({"message": "No crimes to import"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/police-stations', methods=['GET'])
def get_police_stations():
    """API endpoint to fetch police station data"""
    try:
        police_stations = read_police_stations("../Police_points.xlsx")
        print(f"Retrieved {len(police_stations)} police stations") 
        # print the first 5 stations for debugging
        print("Sample police stations:", police_stations[:5])
       
        return jsonify({
            "stations": police_stations,  # Updated key
            "total": len(police_stations)
        })

        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Create search indexes on startup
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=8080)
