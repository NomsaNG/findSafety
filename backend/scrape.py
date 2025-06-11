#Scrape.py
# This module handles scraping of crime-related data from various sources.
# Scrape the internet for crime-related posts, news articles, and reports (latest or live reports).
# Scrape tweets

# Use SerpAPI to get recent Facebook crime-related posts

# Pull data from news RSS feeds

# Query a crime-report API

# | Tool                 | Purpose                                           |
# | -------------------- | ------------------------------------------------- |
# | **SerpAPI**          | Search Facebook, Google, Reddit, etc.             |
# | **Twint / snscrape** | Scrape Twitter/X posts                            |
# | **Newspaper3k**      | Scrape and parse news articles                    |
# | **RSS parsers**      | Track crime blogs/news in real-time               |
# | **Custom scrapers**  | Use `requests + BeautifulSoup` for scraping sites |
# | **MongoDB**          | Store past scraped reports locally                |

"""
Crime Data Scraper for South Africa
Scrapes crime-related data from various sources including social media, news, and RSS feeds.
"""

import requests
import json
import time
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import feedparser
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv
import subprocess
import sys

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CrimeScraper:
    def __init__(self):
        # MongoDB connection
        self.mongodb_uri = os.getenv('MONGODB_URI', 'mongodb+srv://nomsa:simplepassword@cluster0.obnp1dw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
        self.client = MongoClient(self.mongodb_uri)
        self.db = self.client['findsafety']
        self.crimes_collection = self.db['crimes']
        self.raw_data_collection = self.db['raw_scraped_data']
        
        # API keys
        self.serpapi_key = os.getenv('SERPAPI_KEY')
        
        # Initialize sentence transformer for embeddings
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Crime-related keywords
        self.crime_keywords = [
            'robbery', 'burglary', 'theft', 'hijacking', 'murder', 'assault', 'rape',
            'shooting', 'stabbing', 'crime', 'police', 'arrest', 'investigation',
            'victim', 'suspect', 'criminal', 'violence', 'attack', 'incident',
            'fraud', 'scam', 'drugs', 'trafficking', 'kidnapping', 'carjacking'
        ]
        
        # South African locations
        self.sa_locations = [
            'johannesburg', 'cape town', 'durban', 'pretoria', 'port elizabeth',
            'bloemfontein', 'east london', 'pietermaritzburg', 'rustenburg',
            'polokwane', 'nelspruit', 'kimberley', 'upington', 'gauteng',
            'western cape', 'kwazulu-natal', 'eastern cape', 'free state',
            'limpopo', 'mpumalanga', 'north west', 'northern cape', 'south africa'
        ]
        
        # News sources
        self.news_sources = [
            'https://www.statssa.gov.za/?cat=26',
            'https://www.news24.com',
            'https://www.iol.co.za',
            'https://www.timeslive.co.za',
            'https://www.sowetanlive.co.za',
            'https://www.citizen.co.za',
            'https://www.dailymaverick.co.za'
        ]
        
        # RSS feeds
        self.rss_feeds = [
            'https://www.news24.com/news24/southafrica/rss',
            'https://www.iol.co.za/rss/south-africa',
            'https://www.timeslive.co.za/rss/',
            'https://www.citizen.co.za/feed/',
            'https://www.dailymaverick.co.za/feed/'
        ]

    def generate_embedding(self, text: str) -> List[float]:
        """Generate vector embedding for text"""
        try:
            embedding = self.model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return []

    def is_crime_related(self, text: str) -> bool:
        """Check if text is crime-related"""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.crime_keywords)

    def is_south_african(self, text: str) -> bool:
        """Check if text mentions South African locations"""
        text_lower = text.lower()
        return any(location in text_lower for location in self.sa_locations)

    def extract_location(self, text: str) -> Dict[str, str]:
        """Extract location information from text"""
        text_lower = text.lower()
        location_info = {
            'city': '',
            'province': '',
            'address': ''
        }
        
        # Simple location extraction (can be improved with NLP)
        for location in self.sa_locations:
            if location in text_lower:
                if location in ['gauteng', 'western cape', 'kwazulu-natal', 'eastern cape', 
                               'free state', 'limpopo', 'mpumalanga', 'north west', 'northern cape']:
                    location_info['province'] = location.title()
                else:
                    location_info['city'] = location.title()
                    location_info['address'] = location.title()
        
        return location_info

    def classify_crime_type(self, text: str) -> str:
        """Classify the type of crime based on text content"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['robbery', 'rob', 'robbed']):
            return 'Robbery'
        elif any(word in text_lower for word in ['burglary', 'break', 'breaking']):
            return 'Burglary'
        elif any(word in text_lower for word in ['theft', 'steal', 'stolen']):
            return 'Theft'
        elif any(word in text_lower for word in ['hijack', 'carjack']):
            return 'Vehicle Hijacking'
        elif any(word in text_lower for word in ['murder', 'kill', 'killed', 'homicide']):
            return 'Murder'
        elif any(word in text_lower for word in ['assault', 'attack', 'beaten']):
            return 'Assault'
        elif any(word in text_lower for word in ['rape', 'sexual assault']):
            return 'Sexual Offences'
        elif any(word in text_lower for word in ['fraud', 'scam']):
            return 'Fraud'
        elif any(word in text_lower for word in ['drug', 'trafficking']):
            return 'Drug-related'
        else:
            return 'Other Crime'

    def assess_severity(self, text: str, crime_type: str) -> str:
        """Assess crime severity based on content and type"""
        text_lower = text.lower()
        
        # High severity indicators
        high_severity_words = ['murder', 'kill', 'death', 'rape', 'gun', 'weapon', 'armed']
        if any(word in text_lower for word in high_severity_words):
            return 'High'
        
        # Crime type based severity
        if crime_type in ['Murder', 'Sexual Offences', 'Armed Robbery']:
            return 'High'
        elif crime_type in ['Assault', 'Vehicle Hijacking', 'Burglary']:
            return 'Medium'
        else:
            return 'Low'

    def scrape_twitter_posts(self, max_posts: int = 100) -> List[Dict]:
        """Scrape Twitter/X posts using snscrape"""
        logger.info("Starting Twitter scraping...")
        scraped_data = []
        
        try:
            # Install snscrape if not available
            try:
                import snscrape.modules.twitter as sntwitter
            except ImportError:
                logger.info("Installing snscrape...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", "snscrape"])
                import snscrape.modules.twitter as sntwitter
            
            # Search queries for South African crime
            queries = [
                "crime South Africa",
                "robbery Johannesburg",
                "hijacking Cape Town",
                "SAPS arrest",
                "police South Africa"
            ]
            
            for query in queries:
                logger.info(f"Searching Twitter for: {query}")
                
                # Create scraper
                scraper = sntwitter.TwitterSearchScraper(f"{query} since:2024-01-01")
                
                count = 0
                for tweet in scraper.get_items():
                    if count >= max_posts // len(queries):
                        break
                    
                    # Filter for crime-related and South African content
                    if (self.is_crime_related(tweet.content) and 
                        self.is_south_african(tweet.content)):
                        
                        scraped_data.append({
                            'id': tweet.id,
                            'content': tweet.content,
                            'date': tweet.date,
                            'user': tweet.user.username,
                            'url': tweet.url,
                            'source': 'twitter',
                            'retweets': tweet.retweetCount,
                            'likes': tweet.likeCount
                        })
                        count += 1
                
                # Rate limiting
                time.sleep(2)
        
        except Exception as e:
            logger.error(f"Error scraping Twitter: {e}")
        
        logger.info(f"Scraped {len(scraped_data)} Twitter posts")
        return scraped_data

    def scrape_facebook_posts(self, max_posts: int = 50) -> List[Dict]:
        """Scrape Facebook posts using SerpAPI"""
        logger.info("Starting Facebook scraping...")
        scraped_data = []
        
        if not self.serpapi_key:
            logger.warning("SerpAPI key not found, skipping Facebook scraping")
            return scraped_data
        
        try:
            queries = [
                "crime South Africa site:facebook.com",
                "SAPS police South Africa site:facebook.com",
                "robbery Johannesburg site:facebook.com"
            ]
            
            for query in queries:
                params = {
                    'q': query,
                    'api_key': self.serpapi_key,
                    'engine': 'google',
                    'num': 10
                }
                
                response = requests.get('https://serpapi.com/search', params=params)
                if response.status_code == 200:
                    results = response.json()
                    
                    for result in results.get('organic_results', []):
                        if 'facebook.com' in result.get('link', ''):
                            scraped_data.append({
                                'title': result.get('title', ''),
                                'snippet': result.get('snippet', ''),
                                'url': result.get('link', ''),
                                'source': 'facebook',
                                'date': datetime.now()
                            })
                
                time.sleep(1)  # Rate limiting
        
        except Exception as e:
            logger.error(f"Error scraping Facebook: {e}")
        
        logger.info(f"Scraped {len(scraped_data)} Facebook posts")
        return scraped_data

    def scrape_news_articles(self) -> List[Dict]:
        """Scrape news articles from South African news websites"""
        logger.info("Starting news article scraping...")
        scraped_data = []
        
        try:
            # Install newspaper3k if not available
            try:
                from newspaper import Article, Config
            except ImportError:
                logger.info("Installing newspaper3k...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", "newspaper3k"])
                from newspaper import Article, Config
            
            config = Config()
            config.browser_user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            
            for news_site in self.news_sources:
                try:
                    logger.info(f"Scraping {news_site}")
                    
                    # Get the main page
                    response = requests.get(news_site, timeout=10)
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Find article links
                    links = soup.find_all('a', href=True)
                    article_urls = []
                    
                    for link in links[:20]:  # Limit to first 20 links
                        href = link['href']
                        if href.startswith('/'):
                            href = urljoin(news_site, href)
                        
                        # Check if link looks like an article
                        if any(word in href.lower() for word in ['news', 'article', 'story']):
                            article_urls.append(href)
                    
                    # Scrape individual articles
                    for url in article_urls[:5]:  # Limit to 5 articles per site
                        try:
                            article = Article(url, config=config)
                            article.download()
                            article.parse()
                            
                            if (article.text and len(article.text) > 100 and
                                self.is_crime_related(article.text) and
                                self.is_south_african(article.text)):
                                
                                scraped_data.append({
                                    'title': article.title,
                                    'content': article.text,
                                    'url': url,
                                    'date': article.publish_date or datetime.now(),
                                    'source': 'news',
                                    'site': news_site
                                })
                        
                        except Exception as e:
                            logger.debug(f"Error scraping article {url}: {e}")
                            continue
                        
                        time.sleep(1)  # Rate limiting
                
                except Exception as e:
                    logger.error(f"Error scraping {news_site}: {e}")
                    continue
                
                time.sleep(2)  # Rate limiting between sites
        
        except Exception as e:
            logger.error(f"Error in news scraping: {e}")
        
        logger.info(f"Scraped {len(scraped_data)} news articles")
        return scraped_data

    def scrape_rss_feeds(self) -> List[Dict]:
        """Scrape RSS feeds from news sources"""
        logger.info("Starting RSS feed scraping...")
        scraped_data = []
        
        try:
            for feed_url in self.rss_feeds:
                try:
                    logger.info(f"Parsing RSS feed: {feed_url}")
                    feed = feedparser.parse(feed_url)
                    
                    for entry in feed.entries[:10]:  # Limit to 10 entries per feed
                        content = entry.get('summary', '') + ' ' + entry.get('description', '')
                        
                        if (self.is_crime_related(content) and 
                            self.is_south_african(content)):
                            
                            scraped_data.append({
                                'title': entry.get('title', ''),
                                'content': content,
                                'url': entry.get('link', ''),
                                'date': datetime(*entry.published_parsed[:6]) if hasattr(entry, 'published_parsed') and entry.published_parsed else datetime.now(),
                                'source': 'rss',
                                'feed_url': feed_url
                            })
                
                except Exception as e:
                    logger.error(f"Error parsing RSS feed {feed_url}: {e}")
                    continue
                
                time.sleep(1)  # Rate limiting
        
        except Exception as e:
            logger.error(f"Error in RSS scraping: {e}")
        
        logger.info(f"Scraped {len(scraped_data)} RSS entries")
        return scraped_data

    def process_scraped_data(self, raw_data: List[Dict]) -> List[Dict]:
        """Process raw scraped data into standardized crime records"""
        logger.info("Processing scraped data...")
        processed_crimes = []
        
        for item in raw_data:
            try:
                # Extract text content
                text_content = ''
                if 'content' in item:
                    text_content = item['content']
                elif 'snippet' in item:
                    text_content = item['snippet']
                elif 'title' in item:
                    text_content = item['title']
                
                if not text_content or len(text_content) < 20:
                    continue
                
                # Clean text
                text_content = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\$$\$$,]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text_content)
                text_content = re.sub(r'[^\w\s]', ' ', text_content)
                text_content = ' '.join(text_content.split())
                
                # Extract information
                crime_type = self.classify_crime_type(text_content)
                location_info = self.extract_location(text_content)
                severity = self.assess_severity(text_content, crime_type)
                
                # Create standardized crime record
                crime_record = {
                    'type': crime_type,
                    'description': text_content[:500],  # Limit description length
                    'description_vector': self.generate_embedding(text_content),
                    'location': {
                        'address': location_info.get('address', 'South Africa'),
                        'city': location_info.get('city', ''),
                        'province': location_info.get('province', ''),
                        'lat': None,  # Would need geocoding service
                        'lng': None
                    },
                    'date': item.get('date', datetime.now()),
                    'severity': severity,
                    'source': f"scraped_{item.get('source', 'unknown')}",
                    'source_url': item.get('url', ''),
                    'scraped_at': datetime.now(),
                    'raw_data_id': None  # Will be set when raw data is stored
                }
                
                processed_crimes.append(crime_record)
            
            except Exception as e:
                logger.error(f"Error processing item: {e}")
                continue
        
        logger.info(f"Processed {len(processed_crimes)} crime records")
        return processed_crimes

    def store_data(self, raw_data: List[Dict], processed_crimes: List[Dict]):
        """Store both raw and processed data in MongoDB"""
        logger.info("Storing data in MongoDB...")
        
        try:
            # Store raw data
            if raw_data:
                raw_result = self.raw_data_collection.insert_many(raw_data)
                logger.info(f"Stored {len(raw_result.inserted_ids)} raw data records")
                
                # Link processed crimes to raw data
                for i, crime in enumerate(processed_crimes):
                    if i < len(raw_result.inserted_ids):
                        crime['raw_data_id'] = raw_result.inserted_ids[i]
            
            # Store processed crimes
            if processed_crimes:
                crimes_result = self.crimes_collection.insert_many(processed_crimes)
                logger.info(f"Stored {len(crimes_result.inserted_ids)} processed crime records")
        
        except Exception as e:
            logger.error(f"Error storing data: {e}")

    def run_full_scrape(self):
        """Run complete scraping process"""
        logger.info("Starting full crime data scraping process...")
        
        all_raw_data = []
        
        # Scrape from all sources
        twitter_data = self.scrape_twitter_posts(max_posts=50)
        all_raw_data.extend(twitter_data)
        
        facebook_data = self.scrape_facebook_posts(max_posts=20)
        all_raw_data.extend(facebook_data)
        
        news_data = self.scrape_news_articles()
        all_raw_data.extend(news_data)
        
        rss_data = self.scrape_rss_feeds()
        all_raw_data.extend(rss_data)
        
        logger.info(f"Total raw data collected: {len(all_raw_data)}")
        
        # Process the data
        processed_crimes = self.process_scraped_data(all_raw_data)
        
        # Store in database
        self.store_data(all_raw_data, processed_crimes)
        
        logger.info("Scraping process completed successfully!")
        
        return {
            'raw_data_count': len(all_raw_data),
            'processed_crimes_count': len(processed_crimes),
            'timestamp': datetime.now()
        }

def main():
    """Main function to run the scraper"""
    scraper = CrimeScraper()
    result = scraper.run_full_scrape()
    
    print(f"Scraping completed!")
    print(f"Raw data collected: {result['raw_data_count']}")
    print(f"Crime records processed: {result['processed_crimes_count']}")
    print(f"Timestamp: {result['timestamp']}")

if __name__ == "__main__":
    main()
