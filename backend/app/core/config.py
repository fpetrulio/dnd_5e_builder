from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "DnD 5e Builder"
    database_url: str = "sqlite+aiosqlite:///./data/dnd_builder.db"
    anthropic_api_key: str = ""
    cors_origins: list[str] = ["http://localhost:5173", "http://0.0.0.0:5173"]
    open5e_base_url: str = "https://api.open5e.com/v2"
    debug: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
