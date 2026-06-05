import os
import glob
import logging
# pyrefly: ignore [missing-import]
import httpx
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Load env variables
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "shoption_knowledge"

if not all([OPENAI_API_KEY, QDRANT_URL, QDRANT_API_KEY]):
    logger.error("Missing credentials in .env file! Ensure OPENAI_API_KEY, QDRANT_URL, and QDRANT_API_KEY are set.")
    exit(1)

# Initialize Qdrant Client
qdrant_client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    timeout=60.0
)

def get_openai_embedding(text: str) -> list:
    """
    Calls OpenAI API to generate a 1536-dimension embedding for text-embedding-3-small.
    """
    url = "https://api.openai.com/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "input": text,
        "model": "text-embedding-3-small"
    }
    
    with httpx.Client() as client:
        try:
            response = client.post(url, headers=headers, json=payload, timeout=15.0)
            response.raise_for_status()
            data = response.json()
            return data["data"][0]["embedding"]
        except Exception as e:
            logger.error(f"Error generating OpenAI embedding: {e}")
            raise e

def chunk_text(text: str, chunk_size: int = 800, chunk_overlap: int = 150) -> list:
    """
    Splits text into manageable chunks with overlap.
    """
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    current_chunk = ""
    
    for para in paragraphs:
        if len(current_chunk) + len(para) <= chunk_size:
            current_chunk += "\n\n" + para if current_chunk else para
        else:
            if current_chunk:
                chunks.append(current_chunk)
            # Handle paragraphs larger than chunk_size
            if len(para) > chunk_size:
                words = para.split()
                sub_chunk = []
                current_len = 0
                for word in words:
                    sub_chunk.append(word)
                    current_len += len(word) + 1
                    if current_len >= chunk_size - chunk_overlap:
                        chunks.append(" ".join(sub_chunk))
                        # Simple overlap: keep the last 5 words
                        sub_chunk = sub_chunk[-5:]
                        current_len = sum(len(w) + 1 for w in sub_chunk)
                if sub_chunk:
                    current_chunk = " ".join(sub_chunk)
            else:
                current_chunk = para
                
    if current_chunk:
        chunks.append(current_chunk)
        
    return chunks

def setup_collection():
    """
    Recreates the Qdrant collection to ensure a fresh index.
    """
    try:
        logger.info(f"Recreating Qdrant collection: '{COLLECTION_NAME}'...")
        qdrant_client.recreate_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=1536,  # OpenAI text-embedding-3-small size
                distance=models.Distance.COSINE
            )
        )
        logger.info("Collection recreated successfully.")
    except Exception as e:
        logger.error(f"Failed to set up Qdrant collection: {e}")
        raise e

def main():
    setup_collection()
    
    # Get all text files in the knowledge_base directory
    kb_path = os.path.join("knowledge_base", "*.txt")
    files = glob.glob(kb_path)
    
    if not files:
        logger.warning("No .txt files found in knowledge_base directory.")
        return
        
    points = []
    point_id = 1
    
    for file_path in files:
        filename = os.path.basename(file_path)
        logger.info(f"Processing file: {filename}...")
        
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
            
        chunks = chunk_text(text)
        logger.info(f"Split {filename} into {len(chunks)} chunks.")
        
        # Get the first line as the context title
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        doc_title = lines[0] if lines else "Business Knowledge"
        
        for i, chunk in enumerate(chunks):
            logger.info(f"Generating embedding for chunk {i+1}/{len(chunks)}...")
            # Prepend context to the text
            contextualized_text = f"Document: {doc_title}\n\n{chunk}"
            try:
                embedding = get_openai_embedding(contextualized_text)
                
                # Create Qdrant Point
                points.append(
                    models.PointStruct(
                        id=point_id,
                        vector=embedding,
                        payload={
                            "content": contextualized_text,
                            "source": filename
                        }
                    )
                )
                point_id += 1
            except Exception as e:
                logger.error(f"Failed to process chunk {i+1} of {filename}: {e}")
                continue

    # Upsert to Qdrant in batches
    if points:
        logger.info(f"Upserting {len(points)} points into Qdrant '{COLLECTION_NAME}'...")
        try:
            qdrant_client.upsert(
                collection_name=COLLECTION_NAME,
                wait=True,
                points=points
            )
            logger.info("Ingestion completed successfully!")
        except Exception as e:
            logger.error(f"Failed to upsert points into Qdrant: {e}")
    else:
        logger.warning("No points to upsert.")

if __name__ == "__main__":
    main()
