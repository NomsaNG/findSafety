"""
Authentication module for FindSafety
Handles user registration, login, and JWT token management
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
import re

load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')
client = MongoClient(MONGODB_URI)
db = client['findsafety']
users_collection = db['users']

# JWT configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id: str) -> str:
    """Generate a JWT token for a user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception('Token has expired')
    except jwt.InvalidTokenError:
        raise Exception('Invalid token')

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> tuple[bool, str]:
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    return True, "Password is valid"

def require_auth(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid authorization header format'}), 401
        
        if not token:
            return jsonify({'error': 'Authentication token is missing'}), 401
        
        try:
            payload = verify_token(token)
            current_user_id = payload['user_id']
            
            # Get user from database
            user = users_collection.find_one({'_id': ObjectId(current_user_id)})
            if not user:
                return jsonify({'error': 'User not found'}), 401
            
            # Add user to request context
            request.current_user = user
            
        except Exception as e:
            return jsonify({'error': str(e)}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

def register_user(email: str, password: str, first_name: str, last_name: str) -> dict:
    """Register a new user"""
    
    # Validate input
    if not validate_email(email):
        raise Exception('Invalid email format')
    
    is_valid, message = validate_password(password)
    if not is_valid:
        raise Exception(message)
    
    if not first_name or not last_name:
        raise Exception('First name and last name are required')
    
    # Check if user already exists
    existing_user = users_collection.find_one({'email': email.lower()})
    if existing_user:
        raise Exception('User with this email already exists')
    
    # Create new user
    hashed_password = hash_password(password)
    
    user_data = {
        'email': email.lower(),
        'password': hashed_password,
        'first_name': first_name.strip(),
        'last_name': last_name.strip(),
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
        'is_active': True,
        'email_verified': False,
        'preferences': {
            'notifications': {
                'email': True,
                'sms': False,
                'push': True
            },
            'alert_frequency': 'daily',
            'severity_levels': ['High', 'Medium']
        }
    }
    
    result = users_collection.insert_one(user_data)
    user_id = str(result.inserted_id)
    
    # Generate token
    token = generate_token(user_id)
    
    # Return user data (without password)
    user_data.pop('password')
    user_data['_id'] = user_id
    
    return {
        'user': user_data,
        'token': token,
        'message': 'User registered successfully'
    }

def login_user(email: str, password: str) -> dict:
    """Login a user"""
    
    if not email or not password:
        raise Exception('Email and password are required')
    
    # Find user by email
    user = users_collection.find_one({'email': email.lower()})
    if not user:
        raise Exception('Invalid email or password')
    
    # Verify password
    if not verify_password(password, user['password']):
        raise Exception('Invalid email or password')
    
    # Check if user is active
    if not user.get('is_active', True):
        raise Exception('Account is deactivated')
    
    # Update last login
    users_collection.update_one(
        {'_id': user['_id']},
        {'$set': {'last_login': datetime.utcnow()}}
    )
    
    # Generate token
    token = generate_token(str(user['_id']))
    
    # Return user data (without password)
    user.pop('password')
    user['_id'] = str(user['_id'])
    
    return {
        'user': user,
        'token': token,
        'message': 'Login successful'
    }

def get_user_profile(user_id: str) -> dict:
    """Get user profile by ID"""
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user:
        raise Exception('User not found')
    
    # Remove sensitive data
    user.pop('password', None)
    user['_id'] = str(user['_id'])
    
    return user

def update_user_profile(user_id: str, update_data: dict) -> dict:
    """Update user profile"""
    
    # Remove fields that shouldn't be updated directly
    update_data.pop('_id', None)
    update_data.pop('password', None)
    update_data.pop('email', None)
    update_data.pop('created_at', None)
    
    # Add updated timestamp
    update_data['updated_at'] = datetime.utcnow()
    
    result = users_collection.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': update_data}
    )
    
    if result.matched_count == 0:
        raise Exception('User not found')
    
    return get_user_profile(user_id)