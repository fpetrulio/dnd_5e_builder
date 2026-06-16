from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class HomebrewResource(Base):
    __tablename__ = "homebrew_resources"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    source_label: Mapped[str] = mapped_column(String(100), default="Homebrew")
    data_json: Mapped[str] = mapped_column(Text, nullable=False)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ResourceCache(Base):
    __tablename__ = "resource_cache"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_key: Mapped[str] = mapped_column(String(200), nullable=False)
    data_json: Mapped[str] = mapped_column(Text, nullable=False)
    cached_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
