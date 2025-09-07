#!/usr/bin/env python3
"""
Test script for ChromaDB integration
"""

import requests
import json
import os

# Test configuration
BASE_URL = "http://127.0.0.1:5000"

def test_status():
    """Test the status endpoint"""
    print("Testing status endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/status")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Status: {data['status']}")
            print(f"✓ ChromaDB Status: {data['chromadb_status']}")
            print(f"✓ Total Vectors: {data['total_vectors']}")
            print(f"✓ Total Files: {data['total_files']}")
            return True
        else:
            print(f"✗ Status request failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Status request error: {e}")
        return False

def test_upload():
    """Test file upload (requires a test file)"""
    print("\nTesting file upload...")
    
    # Create a test text file
    test_content = """
    This is a test document for ChromaDB integration.
    It contains multiple sentences to test chunking and vectorization.
    The document should be split into chunks and stored in ChromaDB.
    Each chunk will have its own embedding for similarity search.
    This allows for semantic search across document content.
    """
    
    test_file_path = "test_document.txt"
    with open(test_file_path, "w", encoding="utf-8") as f:
        f.write(test_content)
    
    try:
        with open(test_file_path, "rb") as f:
            files = {"file": (test_file_path, f, "text/plain")}
            response = requests.post(f"{BASE_URL}/upload", files=files)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Upload successful: {data['message']}")
            print(f"✓ Chunks created: {data['chunks_created']}")
            return True
        else:
            print(f"✗ Upload failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"✗ Upload error: {e}")
        return False
    finally:
        # Clean up test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

def test_search():
    """Test similarity search"""
    print("\nTesting similarity search...")
    
    test_queries = [
        "test document content",
        "chunking and vectorization",
        "semantic search"
    ]
    
    for query in test_queries:
        try:
            response = requests.post(
                f"{BASE_URL}/search",
                json={"query": query, "n_results": 3}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Query '{query}': {data['total_results']} results")
                for i, result in enumerate(data['results']):
                    print(f"  Result {i+1}: {result['document'][:100]}...")
                    if result['metadata']:
                        print(f"    File: {result['metadata'].get('filename', 'Unknown')}")
            else:
                print(f"✗ Search failed for '{query}': {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Search error for '{query}': {e}")
            return False
    
    return True

def main():
    """Run all tests"""
    print("ChromaDB Integration Test")
    print("=" * 40)
    
    # Test status
    if not test_status():
        print("\n❌ Status test failed. Make sure the server is running.")
        return
    
    # Test upload
    if not test_upload():
        print("\n❌ Upload test failed.")
        return
    
    # Test search
    if not test_search():
        print("\n❌ Search test failed.")
        return
    
    print("\n✅ All tests passed! ChromaDB integration is working correctly.")

if __name__ == "__main__":
    main()
