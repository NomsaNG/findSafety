FROM python:3.9-slim

WORKDIR /app

# Install build tools and upgrade pip
RUN apt-get update && apt-get install -y gcc g++ \
 && pip install --upgrade pip

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Remove build tools (optional cleanup)
RUN apt-get remove -y gcc g++ \
 && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

# Copy application code
COPY . .

EXPOSE 8080

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--timeout", "180", "app:app"]
