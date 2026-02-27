from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Research Assistant API"
    app_env: str = "development"
    frontend_origin: str = "http://localhost:5173"

    github_token: str = ""
    github_models_endpoint: str = "https://models.github.ai/inference"
    github_embedding_model: str = "openai/text-embedding-3-small"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
