import numpy as np
import spacy
from sentence_transformers import SentenceTransformer
from config import EmbeddingConfig

_nlp = None
_embedder = None

def nlp():
    global _nlp
    if _nlp is None:
        try:
            _nlp = spacy.load("en_core_web_sm")
        except OSError:
            import subprocess, sys
            subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], check=True)
            _nlp = spacy.load("en_core_web_sm")
    return _nlp

def embedder():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(EmbeddingConfig.EMBEDDING_MODEL)
    return _embedder

def embed_texts(texts):
    vecs = embedder().encode(texts, show_progress_bar=False, normalize_embeddings=True)
    return np.asarray(vecs, dtype=np.float32)

def pack_vector(vec):
    return vec.astype(np.float32).tobytes()

def unpack_vector(blob):
    return np.frombuffer(blob, dtype=np.float32)
