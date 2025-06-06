FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy necessary files
COPY requirements.txt azure_agent.py .
RUN ls -la &&\
    pip install --no-cache-dir -r requirements.txt &&\
    python azure_agent.py download-files

# Command to run the application
CMD ["python", "azure_agent.py", "dev"]
