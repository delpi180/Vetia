from pydantic_settings import BaseSettings, SettingsConfigDict


class Configuracion(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # APIs
    deepgram_api_key: str
    openai_api_key: str

    # Modelos
    deepgram_model: str = "nova-3"
    deepgram_language: str = "multi"
    llm_model: str = "gpt-4o-mini"

    # Servidor
    host: str = "127.0.0.1"
    port: int = 8000
    debug: bool = False

    # Base de datos
    database_url: str = "sqlite:///./vetia.db"

    # Procesamiento de audio
    max_audio_duration_seconds: int = 900
    max_audio_size_mb: int = 50
    allowed_audio_formats: str = "webm,mp3,wav,m4a,ogg"

    @property
    def formatos_permitidos(self) -> list[str]:
        return [f.strip() for f in self.allowed_audio_formats.split(",")]


settings = Configuracion()
