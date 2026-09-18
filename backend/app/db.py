import os
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

# Anchor DB file to the backend folder so the FastAPI process and the
# zip_extractor scheduler process share the same SQLite file regardless of cwd.
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
_DEFAULT_DB_PATH = _BACKEND_ROOT / "migration.db"
DATABASE_URL = os.getenv("MIGRATION_DB_URL", f"sqlite:///{_DEFAULT_DB_PATH.as_posix()}")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


@event.listens_for(engine, "connect")
def _enable_sqlite_wal(dbapi_connection, _):
    """Enable WAL so extractor + API can write/read concurrently."""
    try:
        cur = dbapi_connection.cursor()
        cur.execute("PRAGMA journal_mode=WAL;")
        cur.execute("PRAGMA synchronous=NORMAL;")
        cur.execute("PRAGMA foreign_keys=ON;")
        cur.close()
    except Exception:
        pass


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Import models so their tables are registered before create_all runs.
    from . import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
