## Quick Start Commands

git pull --rebase origin main

### Backend 

cd Backend

python -m venv venv

venv/Scripts/activate  # On Windows

pip install -r requirements.txt

uvicorn main:app --reload

### Frontend

cd chatbot2

npm install

npm run dev

