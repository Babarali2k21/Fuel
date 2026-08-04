import json
from typing import Any

import redis

from app.core.config import settings

_redis_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    return _redis_client


def cache_get(key: str) -> Any | None:
    try:
        client = get_redis()
        value = client.get(key)
        if value is None:
            return None
        return json.loads(value)
    except redis.RedisError:
        return None


def cache_set(key: str, value: Any, ttl_seconds: int) -> None:
    try:
        client = get_redis()
        client.setex(key, ttl_seconds, json.dumps(value))
    except redis.RedisError:
        return None


def cache_delete(key: str) -> None:
    try:
        client = get_redis()
        client.delete(key)
    except redis.RedisError:
        return None
