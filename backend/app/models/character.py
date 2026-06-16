import json
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Character(Base):
    __tablename__ = "characters"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    campaign_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Full character state as JSON (denormalized for simplicity at this stage)
    state_json: Mapped[str] = mapped_column(Text, default="{}")

    snapshots: Mapped[list["CharacterSnapshot"]] = relationship(
        back_populates="character", cascade="all, delete-orphan"
    )

    @property
    def state(self) -> dict[str, Any]:
        return json.loads(self.state_json)

    @state.setter
    def state(self, value: dict[str, Any]):
        self.state_json = json.dumps(value)


class CharacterSnapshot(Base):
    __tablename__ = "character_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    character_id: Mapped[str] = mapped_column(
        String, ForeignKey("characters.id", ondelete="CASCADE")
    )
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    state_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    character: Mapped["Character"] = relationship(back_populates="snapshots")

    @property
    def state(self) -> dict[str, Any]:
        return json.loads(self.state_json)
