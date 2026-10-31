import pytest
from datetime import datetime, timedelta
import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from api import is_date_expired, lp_search, BoundedSearchCache, fetch_data_for_resource
from unittest.mock import patch, MagicMock

def test_is_date_expired():
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%d/%m/%Y")
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%d/%m/%Y")

    assert is_date_expired(yesterday) is True
    assert is_date_expired(tomorrow) is False

    # ISO format (common in private_import)
    yesterday_iso = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
    tomorrow_iso = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    assert is_date_expired(yesterday_iso) is True
    assert is_date_expired(tomorrow_iso) is False

    # Invalid / empty
    assert is_date_expired("") is False
    assert is_date_expired(None) is False

def test_lp_search_input_validation():
    # Non-numeric or invalid length should return None
    assert lp_search("123") is None  # too short
    assert lp_search("123456789") is None  # too long
    assert lp_search("abcde") is None
    assert lp_search("12345' OR '1'='1") is None

def test_bounded_search_cache():
    cache = BoundedSearchCache(maxsize=5)
    for i in range(10):
        cache[str(i)] = (100.0, {"val": i})
    assert len(cache) == 5
    assert "0" not in cache
    assert "9" in cache

def test_multiple_recalls_not_truncated():
    with patch("api.get_thread_session") as mock_session_fn:
        mock_session = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "result": {
                "total": 2,
                "records": [
                    {"TAARICH_PTICHA": "2023-01-01", "TEUR_TAKALA": "Airbag failure"},
                    {"TAARICH_PTICHA": "2024-05-10", "TEUR_TAKALA": "Brake line inspection"}
                ]
            }
        }
        mock_session.get.return_value = mock_resp
        mock_session_fn.return_value = mock_session

        res = fetch_data_for_resource("recall", "1234567")
        assert res is not None
        assert "Airbag failure" in res["data"]["קריאות שירות פתוחות"]
        assert "Brake line inspection" in res["data"]["קריאות שירות פתוחות"]
