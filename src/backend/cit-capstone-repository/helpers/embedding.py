
# ------------------------------
# AI Model for smart search
# ------------------------------
import json
import numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

def encode_text(text: str):
    return model.encode(text, convert_to_tensor=False).astype(np.float32)

def load_embedding(json_str: str):
    return np.array(json.loads(json_str), dtype=np.float32)
