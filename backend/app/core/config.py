from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://spritcheck:spritcheck@localhost:5432/spritcheck"
    redis_url: str = "redis://localhost:6379/0"
    clerk_secret_key: str = ""
    clerk_jwt_issuer: str = ""
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_monthly: str = ""
    stripe_price_yearly: str = ""
    stripe_trial_days: int = 7
    google_maps_api_key: str = ""
    resend_api_key: str = ""
    frontend_url: str = "http://localhost:3000"
    cors_origins: str = "http://localhost:3000,http://localhost:3001"
    bypass_premium: bool = True
    bypass_auth: bool = True
    free_cache_ttl_seconds: int = 300
    econtrol_base_url: str = "https://api.e-control.at/sprit/1.0"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
