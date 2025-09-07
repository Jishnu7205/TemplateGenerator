import os
import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer
from flask import Flask, request, jsonify
from flask_cors import CORS
## UPDATED: Import specific modules from google.generativeai
from google import genai
from google.genai import types
from dotenv import load_dotenv
import chromadb
from chromadb.config import Settings


# --- Initialization ---

# Initialize the Flask application
app = Flask(__name__)
# Enable Cross-Origin Resource Sharing (CORS)
CORS(app)

# --- ChromaDB Storage ---

# Initialize ChromaDB client
print("Initializing ChromaDB...")
chroma_client = chromadb.Client(Settings(
    persist_directory="./chroma_db",
    anonymized_telemetry=False
))

# Get or create collection for document vectors
try:
    vector_collection = chroma_client.get_collection("document_vectors")
    print("Found existing ChromaDB collection.")
except:
    vector_collection = chroma_client.create_collection(
        name="document_vectors",
        metadata={"description": "Document chunks and their embeddings"}
    )
    print("Created new ChromaDB collection.")

# In-memory storage for templates { "template_name": "markdown_content" }
template_store = {}

# --- Model Loading ---

# Load sentence-transformer model (existing)
print("Loading sentence-transformer model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded successfully.")

## UPDATED: Configure Gemini Client
print("Configuring Gemini client...")
# load_dotenv() # Load environment variables from .env file
client = None
# genai.configure(api_key="AIzaSyBQMM-ozsySWufP_i7Utn8fDatyu5x2B7s")
client = genai.Client(api_key="AIzaSyBQMM-ozsySWufP_i7Utn8fDatyu5x2B7s")
# try:
#     # Use the standard client initialization
#     api_key = "AIzaSyDn-lTIqxdid33hltoce9i6jqZZdicUZCk"#os.getenv("GEMINI_API_KEY")
#     if not api_key:
#         print("Error: GEMINI_API_KEY not found in environment variables.")
#     else:
#         client = genai.Client(api_key=api_key)
#         print("Gemini client configured successfully.")
# except Exception as e:
#     print(f"Error configuring Gemini client: {e}")
print("-" * 20)


# --- Helper Functions (No changes here) ---

def extract_text_from_pdf(file_stream):
    """Extracts text from a PDF file stream."""
    text = ""
    try:
        with fitz.open(stream=file_stream.read(), filetype="pdf") as doc:
            for page in doc:
                text += page.get_text()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None
    return text

def extract_text_from_txt(file_stream):
    """Extracts text from a TXT file stream."""
    try:
        return file_stream.read().decode('utf-8')
    except Exception as e:
        print(f"Error reading text file: {e}")
        return None
    return text

def chunk_text(text, chunk_size=512, overlap=50):
    """Splits text into overlapping chunks."""
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


# --- API Endpoints ---

@app.route('/upload', methods=['POST'])
def upload_file():
    # This function remains unchanged.
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected for uploading"}), 400
    if file:
        filename = file.filename
        text = ""
        if filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(file)
        elif filename.lower().endswith('.txt'):
            text = extract_text_from_txt(file)
        else:
            return jsonify({"error": "Unsupported file type."}), 400
        if not text:
            return jsonify({"error": f"Could not extract text from {filename}"}), 500
        chunks = chunk_text(text)
        if not chunks:
            return jsonify({"error": "Text is too short to be chunked."}), 400
        embeddings = model.encode(chunks, show_progress_bar=True)
        vectors = embeddings.tolist()
        
        # Store in ChromaDB
        try:
            # Generate unique IDs for each chunk
            chunk_ids = [f"{filename}_{i}" for i in range(len(chunks))]
            
            # Add to ChromaDB collection
            vector_collection.add(
                ids=chunk_ids,
                embeddings=vectors,
                documents=chunks,
                metadatas=[{"filename": filename, "chunk_index": i} for i in range(len(chunks))]
            )
            print(f"Stored {len(vectors)} vectors for {filename} in ChromaDB.")
        except Exception as e:
            print(f"Error storing vectors in ChromaDB: {e}")
            return jsonify({"error": "Failed to store vectors in database."}), 500
        
        return jsonify({
            "message": "File processed successfully.",
            "filename": filename,
            "chunks_created": len(chunks)
        }), 200

@app.route('/status', methods=['GET'])
def status():
    try:
        # Get collection count
        collection_count = vector_collection.count()
        
        # Get unique filenames from metadata
        all_data = vector_collection.get()
        unique_files = set()
        if all_data['metadatas']:
            for metadata in all_data['metadatas']:
                if metadata and 'filename' in metadata:
                    unique_files.add(metadata['filename'])
        
        return jsonify({
            "status": "Server is running.",
            "chromadb_status": "Connected",
            "total_vectors": collection_count,
            "total_files": len(unique_files),
            "files_in_database": list(unique_files),
            "templates_in_memory": list(template_store.keys())
        }), 200
    except Exception as e:
        return jsonify({
            "status": "Server is running.",
            "chromadb_status": f"Error: {str(e)}",
            "total_vectors": 0,
            "total_files": 0,
            "files_in_database": [],
            "templates_in_memory": list(template_store.keys())
        }), 200

# --- Vector Search Endpoints ---

@app.route('/search', methods=['POST'])
def search_similar():
    """
    Search for similar document chunks using ChromaDB.
    Expects JSON with 'query' and optional 'n_results' (default 5).
    """
    try:
        data = request.json
        query = data.get('query')
        n_results = data.get('n_results', 5)
        
        if not query:
            return jsonify({"error": "Query is required."}), 400
        
        # Generate embedding for the query
        query_embedding = model.encode([query])
        
        # Search in ChromaDB
        results = vector_collection.query(
            query_embeddings=query_embedding.tolist(),
            n_results=n_results
        )
        
        # Format results
        search_results = []
        if results['documents'] and results['documents'][0]:
            for i, doc in enumerate(results['documents'][0]):
                search_results.append({
                    "document": doc,
                    "distance": results['distances'][0][i] if results['distances'] else None,
                    "metadata": results['metadatas'][0][i] if results['metadatas'] else None
                })
        
        return jsonify({
            "query": query,
            "results": search_results,
            "total_results": len(search_results)
        }), 200
        
    except Exception as e:
        print(f"Error in similarity search: {e}")
        return jsonify({"error": "Search failed."}), 500

# --- Template Generation Endpoints ---

@app.route('/generate-template', methods=['POST'])
def generate_template():
    """
    ## UPDATED: This endpoint now uses the genai.Client method.
    Receives a user prompt and optionally a current template,
    then uses Gemini to generate or modify the template.
    """
    if not client:
        return jsonify({"error": "Gemini client is not configured. Check API key."}), 500

    data = request.json
    user_prompt = data.get('prompt')
    current_template = data.get('current_template', '')

    if not user_prompt:
        return jsonify({"error": "Prompt is required."}), 400

    if current_template:
        full_prompt = f"""
        You are an assistant that helps edit document templates in Markdown format.
        A user has provided an existing template and a request to modify it.
        Modify the template based on the user's request and return the complete, updated Markdown.
        Do NOT just describe the changes; return the entire template with the changes applied.

        EXISTING TEMPLATE:
        ---
        {current_template}
        ---

        USER'S EDIT REQUEST: "{user_prompt}"

        UPDATED MARKDOWN TEMPLATE:
        """
    else:
        full_prompt = f"""
        You are an assistant that helps create document templates in Markdown format.
        A user wants a new template. Based on their request, create a structured template using Markdown.
        Use headings (#, ##), lists (*), and bold text to define the structure.
        Do NOT add any explanatory text before or after the markdown content.

        USER'S REQUEST: "{user_prompt}"

        MARKDOWN TEMPLATE:
        """

    try:
        print("Sending prompt to Gemini...")
        ## --- UPDATED: Standard API Call Structure ---
        # 1. Define the model to use
        model_name = "gemini-1.5-flash"

        # 2. Make the API call using the client
        response = client.models.generate_content(
            model=model_name,
            contents=full_prompt
        )
        ## --- End of Update ---

        # Clean up the response, removing potential code block formatting
        cleaned_response = response.text.strip().replace("```markdown", "").replace("```", "").strip()
        print("Received response from Gemini.")
        return jsonify({"template": cleaned_response})

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return jsonify({"error": "Failed to generate template from AI."}), 500


@app.route('/save-template', methods=['POST'])
def save_template():
    # This function remains unchanged.
    data = request.json
    name = data.get('name')
    content = data.get('content')
    if not name or not content:
        return jsonify({"error": "Template name and content are required."}), 400
    template_store[name] = content
    print(f"Saved template: {name}")
    return jsonify({"message": f"Template '{name}' saved successfully."}), 200


# --- Main Entry Point ---

if __name__ == '__main__':
    app.run(debug=True, port=5000)