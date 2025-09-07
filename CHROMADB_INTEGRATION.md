# ChromaDB Integration

This document describes the ChromaDB integration for vector storage and similarity search in the Synthesis AI Application.

## Overview

The application now uses ChromaDB instead of in-memory storage for document vectors. This provides:
- Persistent vector storage
- Efficient similarity search
- Scalable vector database
- Better performance for large document collections

## Features

### 1. Vector Storage
- Documents are automatically chunked and vectorized when uploaded
- Vectors are stored in ChromaDB with metadata (filename, chunk index)
- Persistent storage across application restarts

### 2. Similarity Search
- Search for semantically similar content across all uploaded documents
- Configurable number of results
- Distance scores for relevance ranking
- Real-time search through the web interface

### 3. Database Statistics
- Real-time vector count
- File count tracking
- Storage usage estimation
- Database connection status

## API Endpoints

### Upload File
```
POST /upload
Content-Type: multipart/form-data

Stores document chunks and vectors in ChromaDB
```

### Search Similar Content
```
POST /search
Content-Type: application/json

{
  "query": "search text",
  "n_results": 5
}

Returns similar document chunks with metadata
```

### Get Status
```
GET /status

Returns ChromaDB statistics and connection status
```

## Installation

1. Install ChromaDB:
```bash
pip install chromadb
```

2. The database will be automatically created in `./chroma_db/` directory

## Usage

### Backend (Python)
```python
# ChromaDB is automatically initialized when the Flask app starts
# Vectors are stored when files are uploaded via /upload endpoint
# Search is performed via /search endpoint
```

### Frontend (React)
```jsx
// Search functionality is integrated into the Data Processing page
// Users can search for similar content after uploading documents
// Results show document chunks with similarity scores
```

## Configuration

ChromaDB settings can be modified in `app.py`:

```python
chroma_client = chromadb.Client(Settings(
    persist_directory="./chroma_db",
    anonymized_telemetry=False
))
```

## Testing

Run the test script to verify ChromaDB integration:

```bash
python test_chromadb.py
```

This will test:
- Database connection
- File upload and vectorization
- Similarity search functionality

## File Structure

```
Synthesis AI Application/
├── app.py                 # Main Flask app with ChromaDB integration
├── test_chromadb.py      # Test script for ChromaDB functionality
├── chroma_db/            # ChromaDB data directory (auto-created)
└── requirements.txt      # Updated with chromadb dependency
```

## Benefits

1. **Persistence**: Vectors survive application restarts
2. **Scalability**: Can handle large document collections
3. **Performance**: Optimized vector similarity search
4. **Metadata**: Rich metadata for each vector (filename, chunk index)
5. **Flexibility**: Easy to extend with additional search features

## Migration from In-Memory Storage

The application automatically migrated from in-memory `vector_store` dictionary to ChromaDB. No manual migration is required - simply restart the application and upload new documents.
