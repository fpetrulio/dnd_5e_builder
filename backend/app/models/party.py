from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Party(Base):
    __tablename__ = "parties"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    campaign_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    members: Mapped[list["PartyMember"]] = relationship(
        back_populates="party", cascade="all, delete-orphan"
    )


class PartyMember(Base):
    __tablename__ = "party_members"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    party_id: Mapped[str] = mapped_column(String, ForeignKey("parties.id", ondelete="CASCADE"))
    character_id: Mapped[str] = mapped_column(String, nullable=False)
    roles_json: Mapped[str] = mapped_column(Text, default="[]")

    party: Mapped["Party"] = relationship(back_populates="members")
