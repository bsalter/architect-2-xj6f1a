import os
import io
import re
from setuptools import setup, find_packages

# Get the absolute path of the directory containing this file
here = os.path.abspath(os.path.dirname(__file__))

def read(filename):
    """Read file contents from a specified file."""
    # Join the base directory path with the requested filename
    filepath = os.path.join(here, filename)
    # Open the file with proper encoding (utf-8)
    with io.open(filepath, 'r', encoding='utf-8') as f:
        # Read and return the file contents
        return f.read()

def find_version(filepath):
    """Extract version string from a python file using regex."""
    # Define a regular expression pattern to match version variable assignment
    version_pattern = r"__version__ = ['\"]([^'\"]*)['\"]"
    # Read the file contents
    content = read(filepath)
    # Search for the version pattern in the file content
    version_match = re.search(version_pattern, content, re.M)
    # Extract and return the version string if found
    if version_match:
        return version_match.group(1)
    # Raise RuntimeError if version pattern not found
    raise RuntimeError("Unable to find version string in {}".format(filepath))

# Package setup configuration
setup(
    name='interaction_management_system',
    version='0.1.0',
    description='A web application for managing and viewing Interaction records',
    long_description=read('README.md'),
    long_description_content_type='text/markdown',
    url='https://github.com/organization/interaction-management-system',
    author='Interaction Management System Team',
    author_email='team@example.com',
    packages=find_packages(exclude=['tests*']),
    include_package_data=True,
    install_requires=[
        'Flask==2.3.2',
        'SQLAlchemy==2.0.19',
        'Flask-JWT-Extended==4.5.2',
        'Flask-Cors==4.0.0',
        'marshmallow==3.20.1',
        'psycopg2-binary==2.9.7',
        'alembic==1.11.1',
        'python-dotenv==1.0.0',
        'gunicorn==21.2.0',
        'redis==7.0.12',
    ],
    extras_require={
        'dev': [
            'pytest==7.4.0',
            'pytest-flask==1.2.0',
            'pytest-cov==4.1.0',
            'black==23.7.0',
            'flake8==6.1.0',
            'isort==5.12.0',
        ],
    },
    entry_points={
        'console_scripts': [
            'ims-server=app:create_app',
        ],
    },
    python_requires='>=3.11',
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.11',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
)