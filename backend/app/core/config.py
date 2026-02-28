from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Research Assistant API"
    app_env: str = "development"
    frontend_origin: str = "http://localhost:5173"
    github_models_token: str = ""
    github_models_base_url: str = "https://models.github.ai"
    github_embed_model: str = "openai/text-embedding-3-small"
    github_api_version: str = "2022-11-28"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
