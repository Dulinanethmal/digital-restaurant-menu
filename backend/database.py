from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Database Connection String
# Replace this exact string with your actual Supabase connection URI.
# Make sure to remove the brackets when you insert your password.
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:6VpZqiELJKcMzt2n@db.nbpdnshlcoicqwdbdkyj.supabase.co:5432/postgres"

# 2. Create the SQLAlchemy Engine
# This is the 'engine' variable that main.py is looking for.
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. Create a Session Local Class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Create a Base Class for models
Base = declarative_base()

# 5. Database Dependency Generator
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()