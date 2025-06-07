# FindSafety Backend API

This is the Python Flask backend for the FindSafety crime data visualization platform.

## Features

- **Crime Data API**: RESTful endpoints for crime data retrieval and analysis
- **Vector Search**: Semantic search using MongoDB Atlas Vector Search
- **AI Chat Interface**: OpenAI-powered chatbot for crime data queries
- **Alert System**: Location-based crime alerts with email/SMS notifications
- **Data Ingestion**: Import and process SAPS crime data

## Setup

### Prerequisites

- Python 3.9+
- MongoDB Atlas cluster with Vector Search enabled
- OpenAI API key
- Email service (Gmail/SMTP)
- Twilio account (for SMS alerts)

### Installation

1. Clone the repository and navigate to the backend directory:
\`\`\`bash
cd backend
\`\`\`

2. Create a virtual environment:
\`\`\`bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
\`\`\`

3. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

4. Create environment file:
\`\`\`bash
cp .env.example .env
\`\`\`

5. Configure your `.env` file with the required credentials:
\`\`\`env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/findsafety
OPENAI_API_KEY=your_openai_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
\`\`\`

### MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster
2. Enable Vector Search on your cluster
3. Create a database named `findsafety`
4. The application will automatically create the required collections and indexes

### Running the Application

1. Start the Flask API:
\`\`\`bash
python app.py
\`\`\`

2. Import sample data:
\`\`\`bash
python data_ingestion.py
\`\`\`

3. Start the alert processor (in a separate terminal):
\`\`\`bash
python alert_processor.py
\`\`\`

## API Endpoints

### Crime Data
- `GET /api/crimes` - Get crimes with filtering
- `POST /api/crimes/search` - Vector search for crimes
- `GET /api/crimes/stats` - Get crime statistics
- `GET /api/crimes/trends` - Get crime trends over time
- `GET /api/crimes/heatmap` - Get heatmap data

### AI Chat
- `POST /api/chat` - Chat with AI about crime data

### Alerts
- `GET /api/alerts` - Get user alerts
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/<id>` - Update alert
- `DELETE /api/alerts/<id>` - Delete alert

### Data Management
- `POST /api/data/import` - Import crime data

## Vector Search

The application uses MongoDB Atlas Vector Search for semantic crime data queries. Crime descriptions are automatically converted to vector embeddings using the `sentence-transformers` library.

### Search Index Configuration

The vector search index is automatically created with the following configuration:
\`\`\`json
{
  "fields": [
    {
      "type": "vector",
      "path": "description_vector",
      "numDimensions": 384,
      "similarity": "cosine"
    }
  ]
}
\`\`\`

## Alert System

The alert processor runs as a separate service and:
- Monitors for new crimes matching user alert criteria
- Sends email and SMS notifications
- Supports immediate, daily, and weekly alert frequencies
- Calculates geographic proximity using the Haversine formula

## Deployment

### Using Docker

1. Build and run with Docker Compose:
\`\`\`bash
docker-compose up --build
\`\`\`

### Manual Deployment

1. Install dependencies on your server
2. Configure environment variables
3. Use a WSGI server like Gunicorn:
\`\`\`bash
gunicorn --bind 0.0.0.0:5000 --workers 4 app:app
\`\`\`

## Data Sources

The application is designed to work with:
- South African Police Service (SAPS) crime data
- Municipal crime statistics
- Community policing forum reports

For demonstration purposes, the `data_ingestion.py` script generates realistic mock data.

## Security Considerations

- API keys and database credentials are stored in environment variables
- CORS is configured for frontend domains
- Input validation and sanitization
- Rate limiting should be implemented for production use

## Contributing

1. Follow PEP 8 style guidelines
2. Add tests for new features
3. Update documentation for API changes
4. Ensure environment variables are documented
