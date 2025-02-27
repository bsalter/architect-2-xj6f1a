# gunicorn.conf.py
# WSGI server configuration for the Interaction Management System backend
# Version: 1.0.0

import os
import multiprocessing

# Server socket binding
bind = os.getenv('GUNICORN_BIND', '0.0.0.0:5000')

# Worker processes
# The recommended formula is (2 x number of CPU cores) + 1
# This provides good CPU utilization while maintaining headroom for handling spikes
workers = int(os.getenv('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))

# Worker type - gevent is recommended for asynchronous processing
# gevent provides good performance for I/O bound applications like APIs
worker_class = os.getenv('GUNICORN_WORKER_CLASS', 'gevent')

# Maximum number of simultaneous clients per worker
worker_connections = int(os.getenv('GUNICORN_WORKER_CONNECTIONS', 1000))

# Number of threads per worker for handling requests
threads = int(os.getenv('GUNICORN_THREADS', 2))

# Timeout for worker processes (in seconds)
# Ensures that slow requests don't tie up workers indefinitely
timeout = int(os.getenv('GUNICORN_TIMEOUT', 30))

# Timeout for keepalive connections (in seconds)
keepalive = int(os.getenv('GUNICORN_KEEPALIVE', 2))

# Worker lifecycle management
# Restart workers after this many requests to prevent memory leaks
max_requests = int(os.getenv('GUNICORN_MAX_REQUESTS', 1000))

# Add randomness to max_requests to avoid all workers restarting at the same time
max_requests_jitter = int(os.getenv('GUNICORN_MAX_REQUESTS_JITTER', 50))

# How long to wait for workers to finish current requests before forcefully restarting
graceful_timeout = int(os.getenv('GUNICORN_GRACEFUL_TIMEOUT', 30))

# Logging configuration
loglevel = os.getenv('GUNICORN_LOG_LEVEL', 'info')
accesslog = os.getenv('GUNICORN_ACCESS_LOG', '-')  # '-' means stdout
errorlog = os.getenv('GUNICORN_ERROR_LOG', '-')    # '-' means stderr

# Access log format compatible with common log analysis tools
# Includes response time (L) in microseconds for performance monitoring
access_log_format = '%(h)s %(l)s %(u)s %(t)s \"%(r)s\" %(s)s %(b)s \"%(f)s\" \"%(a)s\" %(L)s'

# Capture stdout/stderr from workers
capture_output = True

# Preload application code before worker processes are forked
# Reduces memory usage but may cause issues with some applications
preload_app = os.getenv('GUNICORN_PRELOAD_APP', 'false').lower() == 'true'

# Use shared memory for temporary storage to improve performance
worker_tmp_dir = '/dev/shm'

# IP addresses allowed for X-Forwarded-For header
# '*' allows all IPs, specify comma-separated IPs for more security
forwarded_allow_ips = os.getenv('GUNICORN_FORWARDED_ALLOW_IPS', '*')

# Hook function called before the master process is initialized
def on_starting(server):
    """
    Called just before the master process is initialized.
    
    This is a good place to perform any initialization tasks that should occur
    once before any workers are created.
    """
    server.log.info("Initializing Gunicorn server for Interaction Management System")
    server.log.info(f"Binding to {bind} with {workers} workers using {worker_class} worker class")

# Hook function called after a worker has been forked
def post_fork(server, worker):
    """
    Called just after a worker has been forked.
    
    This is a good place to set up worker-specific configurations or connections.
    """
    server.log.info(f"Worker {worker.pid} initialized with {threads} threads")
    # Set worker-specific configurations here if needed

# Hook function called when a worker exits
def worker_exit(server, worker):
    """
    Called just after a worker has been exited, in the worker process.
    
    This is a good place to close resources that might be shared between workers.
    """
    server.log.info(f"Worker {worker.pid} is exiting")
    # Close any worker-specific resources here if needed

# Hook function called when a child process exits
def child_exit(server, worker):
    """
    Called just after a worker process exits, in the master process.
    
    This is a good place to log information about worker turnover for monitoring.
    """
    server.log.info(f"Worker {worker.pid} has exited, new worker will be spawned")

# Hook function called before the server is reloaded
def on_reload(server):
    """
    Called before the server is reloaded (e.g., when receiving a SIGHUP).
    
    This is a good place to perform any cleanup before configuration reload.
    """
    server.log.info("Reloading Gunicorn configuration")