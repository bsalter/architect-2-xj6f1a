# Base image for Python 3.11
FROM python:3.11-slim

# Set environment variables to improve Python performance and behavior
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory in the container
WORKDIR /app

# Install system dependencies and cleanup in the same layer to reduce image size
RUN apt-get update && apt-get install -y --no-install-recommends gcc postgresql-client libpq-dev && \
    pip install --upgrade pip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code to container
COPY . .

# Create non-root user for security and change ownership of app directory
RUN useradd -m appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Set Flask application entry point
ENV FLASK_APP=wsgi.py

# Expose port for the application
EXPOSE 5000

# Define Gunicorn as the entrypoint with its config options
ENTRYPOINT ["gunicorn"]
CMD ["--config", "gunicorn.conf.py", "wsgi:application"]