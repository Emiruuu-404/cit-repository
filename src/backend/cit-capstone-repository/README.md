# CIT Capstone Repository

A web-based capstone storage repository for CIT, written in Python with FastAPI<br>
This also utilize smart searching with Sentence Transformer using model `all-MiniLM-L6-v2`

## How to use?

1. Clone this repository
2. Go to the working directory:
   ```
   cd cit-capstone-repository
   ```
3. Install required dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Configure spacy
   ```
   python -m spacy download en_core_web_sm
   ```
5. Install ollama

   ```
   curl -fsSL https://ollama.com/install.sh | sh

   ollama pull llama3.2
   ```

6. Migrate database
   ```
   alembic upgrade head
   ```
7. Run seed data
   ```
   python seed.py
   ```
8. Run the FastAPI Uvicorn server:
   ```
   uvicorn main:app --reload
   ```
