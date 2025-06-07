"""
Alert processing system for FindSafety
Monitors crime data and sends notifications based on user alerts
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pymongo import MongoClient
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import requests
import json
from typing import List, Dict
import schedule
import time

load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')
client = MongoClient(MONGODB_URI)
db = client['findsafety']
crimes_collection = db['crimes']
alerts_collection = db['alerts']
notifications_collection = db['notifications']

# Email configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
EMAIL_USER = os.getenv('EMAIL_USER')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')

# SMS configuration (using a service like Twilio)
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates in kilometers using Haversine formula"""
    import math
    
    # Convert latitude and longitude from degrees to radians
    lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r

def find_matching_crimes(alert: Dict, since_date: datetime) -> List[Dict]:
    """Find crimes that match an alert's criteria"""
    
    # Build query based on alert criteria
    query = {
        "date": {"$gte": since_date}
    }
    
    # Filter by crime types if specified
    if alert.get('crime_types') and 'All' not in alert['crime_types']:
        query['type'] = {"$in": alert['crime_types']}
    
    # Filter by severity levels
    if alert.get('severity_levels'):
        query['severity'] = {"$in": alert['severity_levels']}
    
    # Get all crimes that match basic criteria
    crimes = list(crimes_collection.find(query))
    
    # Filter by location radius
    matching_crimes = []
    alert_location = alert.get('location', {})
    alert_radius = alert.get('radius', 5)
    
    if 'lat' in alert_location and 'lng' in alert_location:
        for crime in crimes:
            crime_location = crime.get('location', {})
            if 'lat' in crime_location and 'lng' in crime_location:
                distance = calculate_distance(
                    alert_location['lat'], alert_location['lng'],
                    crime_location['lat'], crime_location['lng']
                )
                
                if distance <= alert_radius:
                    crime['distance_from_alert'] = round(distance, 2)
                    matching_crimes.append(crime)
    
    return matching_crimes

def send_email_notification(to_email: str, subject: str, body: str) -> bool:
    """Send email notification"""
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(EMAIL_USER, to_email, text)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def send_sms_notification(to_phone: str, message: str) -> bool:
    """Send SMS notification using Twilio"""
    try:
        from twilio.rest import Client
        
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        message = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to_phone
        )
        
        return True
    except Exception as e:
        print(f"Error sending SMS: {e}")
        return False

def generate_alert_email(alert: Dict, crimes: List[Dict]) -> str:
    """Generate HTML email content for alert"""
    
    severity_colors = {
        'High': '#E11D48',
        'Medium': '#FB923C',
        'Low': '#22C55E'
    }
    
    html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }}
            .header {{ background-color: #003E40; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; }}
            .crime-item {{ border-left: 4px solid #ddd; padding: 15px; margin: 10px 0; background-color: #f9f9f9; }}
            .severity-high {{ border-left-color: {severity_colors['High']}; }}
            .severity-medium {{ border-left-color: {severity_colors['Medium']}; }}
            .severity-low {{ border-left-color: {severity_colors['Low']}; }}
            .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛡️ FindSafety Alert: {alert['name']}</h1>
                <p>Crime activity detected in your monitored area</p>
            </div>
            
            <p>We've detected {len(crimes)} new crime incident(s) in your monitored area: <strong>{alert['location'].get('address', 'Unknown location')}</strong></p>
            
            <h3>Recent Incidents:</h3>
    """
    
    for crime in crimes[:10]:  # Limit to 10 most recent
        severity_class = f"severity-{crime['severity'].lower()}"
        date_str = crime['date'].strftime('%Y-%m-%d %H:%M')
        
        html += f"""
            <div class="crime-item {severity_class}">
                <h4>{crime['type']} - {crime['severity']} Severity</h4>
                <p><strong>Date:</strong> {date_str}</p>
                <p><strong>Location:</strong> {crime['location'].get('address', 'Unknown')}</p>
                <p><strong>Distance:</strong> {crime.get('distance_from_alert', 'N/A')} km from your alert location</p>
                <p><strong>Description:</strong> {crime['description']}</p>
            </div>
        """
    
    if len(crimes) > 10:
        html += f"<p><em>... and {len(crimes) - 10} more incidents</em></p>"
    
    html += f"""
            <div class="footer">
                <p>This alert was generated for: {alert['name']}</p>
                <p>Alert radius: {alert['radius']} km</p>
                <p>To manage your alerts, visit the FindSafety dashboard.</p>
                <p>Stay safe!</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html

def generate_alert_sms(alert: Dict, crimes: List[Dict]) -> str:
    """Generate SMS content for alert"""
    high_severity_count = len([c for c in crimes if c['severity'] == 'High'])
    
    message = f"FindSafety Alert: {len(crimes)} new crime(s) detected near {alert['location'].get('address', 'your location')}"
    
    if high_severity_count > 0:
        message += f" ({high_severity_count} high severity)"
    
    message += f". Check the app for details. Stay safe!"
    
    return message

def process_immediate_alerts():
    """Process alerts that need immediate notifications"""
    
    # Get all active immediate alerts
    immediate_alerts = list(alerts_collection.find({
        "active": True,
        "frequency": "immediate"
    }))
    
    # Check for crimes in the last hour
    since_date = datetime.utcnow() - timedelta(hours=1)
    
    for alert in immediate_alerts:
        matching_crimes = find_matching_crimes(alert, since_date)
        
        if matching_crimes:
            # Check if we've already sent a notification for these crimes
            crime_ids = [str(crime['_id']) for crime in matching_crimes]
            
            existing_notification = notifications_collection.find_one({
                "alert_id": str(alert['_id']),
                "crime_ids": {"$in": crime_ids},
                "sent_at": {"$gte": since_date}
            })
            
            if not existing_notification:
                send_alert_notification(alert, matching_crimes)

def process_daily_alerts():
    """Process daily digest alerts"""
    
    # Get all active daily alerts
    daily_alerts = list(alerts_collection.find({
        "active": True,
        "frequency": "daily"
    }))
    
    # Check for crimes in the last 24 hours
    since_date = datetime.utcnow() - timedelta(days=1)
    
    for alert in daily_alerts:
        matching_crimes = find_matching_crimes(alert, since_date)
        
        if matching_crimes:
            send_alert_notification(alert, matching_crimes)

def process_weekly_alerts():
    """Process weekly summary alerts"""
    
    # Get all active weekly alerts
    weekly_alerts = list(alerts_collection.find({
        "active": True,
        "frequency": "weekly"
    }))
    
    # Check for crimes in the last 7 days
    since_date = datetime.utcnow() - timedelta(days=7)
    
    for alert in weekly_alerts:
        matching_crimes = find_matching_crimes(alert, since_date)
        
        if matching_crimes:
            send_alert_notification(alert, matching_crimes)

def send_alert_notification(alert: Dict, crimes: List[Dict]):
    """Send notification for an alert"""
    
    notification_channels = alert.get('notification_channels', ['email'])
    user_id = alert.get('user_id')
    
    # Get user contact information (in a real app, this would come from user profile)
    user_email = f"user_{user_id}@example.com"  # Placeholder
    user_phone = "+27123456789"  # Placeholder
    
    notifications_sent = []
    
    # Send email notification
    if 'email' in notification_channels:
        subject = f"FindSafety Alert: {alert['name']}"
        body = generate_alert_email(alert, crimes)
        
        if send_email_notification(user_email, subject, body):
            notifications_sent.append('email')
    
    # Send SMS notification
    if 'sms' in notification_channels:
        message = generate_alert_sms(alert, crimes)
        
        if send_sms_notification(user_phone, message):
            notifications_sent.append('sms')
    
    # Log notification
    notification_record = {
        "alert_id": str(alert['_id']),
        "user_id": user_id,
        "crime_ids": [str(crime['_id']) for crime in crimes],
        "channels_sent": notifications_sent,
        "crime_count": len(crimes),
        "sent_at": datetime.utcnow()
    }
    
    notifications_collection.insert_one(notification_record)
    
    print(f"Sent alert notification for '{alert['name']}' - {len(crimes)} crimes, channels: {notifications_sent}")

def main():
    """Main function to run alert processing"""
    
    print("Starting FindSafety Alert Processor...")
    
    # Schedule different types of alerts
    schedule.every(15).minutes.do(process_immediate_alerts)  # Check every 15 minutes for immediate alerts
    schedule.every().day.at("08:00").do(process_daily_alerts)  # Daily digest at 8 AM
    schedule.every().monday.at("08:00").do(process_weekly_alerts)  # Weekly summary on Monday at 8 AM
    
    print("Alert processor scheduled. Running...")
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    main()
