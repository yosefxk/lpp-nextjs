import requests
import concurrent.futures
import logging
import time
import re
import json
import threading
from collections import OrderedDict
from requests.adapters import HTTPAdapter
from datetime import datetime
from dictionaries import (
    resource_ids,
    hebrew_resource_ids,
    license_plate_field,
    keys_translation,
    type_of_vehicle,
    sug_tav_mapping
)
from utils import format_date

logging.basicConfig(level=logging.INFO)

# Thread-local storage for requests.Session to guarantee thread-safety across concurrent workers
_thread_local = threading.local()

def get_thread_session() -> requests.Session:
    if not hasattr(_thread_local, "session"):
        s = requests.Session()
        s.headers.update({'user-agent': 'datagov-external-client'})
        adapter = HTTPAdapter(pool_connections=10, pool_maxsize=10)
        s.mount('https://', adapter)
        _thread_local.session = s
    return _thread_local.session

# Bounded in-memory TTL cache for recent license-plate searches
class BoundedSearchCache(OrderedDict):
    def __init__(self, maxsize=1000):
        super().__init__()
        self.maxsize = maxsize

    def __setitem__(self, key, value):
        if len(self) >= self.maxsize and key not in self:
            self.popitem(last=False)
        super().__setitem__(key, value)

_SEARCH_CACHE = BoundedSearchCache(maxsize=1000)
_CACHE_TTL = 30  # seconds

def parse_gov_date(ts):
    ts = str(ts).replace("-", "").replace(" ", "").replace("T", "").split(".")[0]
    if len(ts) >= 8 and ts[:8].isdigit():
        return f"{ts[6:8]}/{ts[4:6]}/{ts[0:4]}"
    return ts

def is_date_expired(date_str):
    if not date_str:
        return False
    # Try standard DD/MM/YYYY
    try:
        dt = datetime.strptime(str(date_str).strip(), "%d/%m/%Y")
        return dt.date() < datetime.now().date()
    except Exception:
        pass
    # Try ISO YYYY-MM-DD
    try:
        dt = datetime.fromisoformat(str(date_str).strip().replace("Z", "+00:00"))
        return dt.date() < datetime.now().date()
    except Exception:
        pass
    # Try YYYYMMDD
    try:
        cleaned = str(date_str).replace("-", "").replace("/", "").strip()[:8]
        if len(cleaned) == 8 and cleaned.isdigit():
            dt = datetime.strptime(cleaned, "%Y%m%d")
            return dt.date() < datetime.now().date()
    except Exception:
        pass
    return False

def fetch_data_for_resource(resource_key: str, lp_to_find: str):
    field_name = license_plate_field.get(resource_key)
    resource_id = resource_ids.get(resource_key)
    
    if not field_name or not resource_id: return None
    
    # Sanitize lp_to_find to digits only
    clean_lp = re.sub(r"\D", "", str(lp_to_find)).strip()
    if not clean_lp:
        return None

    # Use thread-safe session and query parameters instead of raw URL formatting
    session = get_thread_session()
    params = {
        "resource_id": resource_id,
        "filters": json.dumps({field_name: clean_lp})
    }
    
    try:
        response = session.get("https://data.gov.il/api/action/datastore_search", params=params, timeout=10)
        if response.status_code != 200: return None
        data = response.json()
        
        if data.get("result", {}).get("total", 0) > 0:
            records = data["result"]["records"]
            
            # Special check for arrays of records like vehicle_history
            if resource_key == "vehicle_history":
                history_list = []
                for rec in records:
                    dt = parse_gov_date(rec.get("baalut_dt", ""))
                    btype = str(rec.get("baalut", "לא ידוע"))
                    if dt and btype:
                        history_list.append(f"{dt}: {btype}")
                
                return {
                    "source_key": resource_key,
                    "source_name": hebrew_resource_ids[resource_key],
                    "data": {"היסטוריית העברת בעלויות": " ⬅️ ".join(history_list) if history_list else "אין נתונים"},
                    "ordered_keys": ["היסטוריית העברת בעלויות"]
                }
            
            # For recall and hagbalat_recall: do not truncate multiple open recall notices
            if resource_key in ["recall", "hagbalat_recall"]:
                combined_record = {}
                translation_dict = keys_translation.get(resource_key, {})
                recall_descriptions = []
                for idx, rec in enumerate(records, 1):
                    t_pticha = parse_gov_date(rec.get("TAARICH_PTICHA", ""))
                    desc = rec.get("TEUR_TAKALA", "") or rec.get("SUG_TAKALA", "") or "קריאת שירות"
                    recall_descriptions.append(f"{idx}. {t_pticha}: {desc}" if t_pticha else f"{idx}. {desc}")

                combined_record["קריאות שירות פתוחות"] = " | ".join(recall_descriptions)
                for k, v in records[0].items():
                    if k in translation_dict and translation_dict[k] not in combined_record and v is not None:
                        combined_record[translation_dict[k]] = str(v)
                
                ordered_keys = ["קריאות שירות פתוחות"] + [translation_dict[k] for k in translation_dict.get("ordered_keys", []) if k in translation_dict and translation_dict[k] in combined_record and translation_dict[k] != "קריאות שירות פתוחות"]
                return {
                    "source_key": resource_key,
                    "source_name": hebrew_resource_ids[resource_key],
                    "data": combined_record,
                    "ordered_keys": ordered_keys
                }
                
            record = records[0]
            processed_record = {}
            
            # Format dates, including private_import
            if resource_key in ["private_vehicles", "private_import"]:
                if "sug_degem" in record: record["sug_degem"] = type_of_vehicle.get(record["sug_degem"], record["sug_degem"])
                if "mivchan_acharon_dt" in record: record["mivchan_acharon_dt"] = format_date(record["mivchan_acharon_dt"])
                if "tokef_dt" in record: record["tokef_dt"] = format_date(record["tokef_dt"])
            elif resource_key == "handicapped":
                if "SUG TAV" in record: record["SUG TAV"] = sug_tav_mapping.get(str(record["SUG TAV"]), record["SUG TAV"])
                if "TAARICH HAFAKAT TAG" in record: record["TAARICH HAFAKAT TAG"] = parse_gov_date(record["TAARICH HAFAKAT TAG"])
            elif resource_key == "shinui_mivne":
                for ind in ["shinui_mivne_ind", "gapam_ind", "shnui_zeva_ind", "shinui_zmig_ind"]:
                    if ind in record:
                        record[ind] = "כן" if str(record[ind]) == "1" else "לא"
                if "rishum_rishon_dt" in record: record["rishum_rishon_dt"] = parse_gov_date(record["rishum_rishon_dt"])
            elif resource_key in ["vehicles_filters", "rechev_inactive_degem", "reshev_bitul_sofi", "reshev_bitul_sofi_2", "reshev_bitul_sofi_3", "kli_rechev_ciburiim"]:
                for dt_field in ["taarich_hatkana", "rishum_rishon_dt", "tokef_dt", "bitul_dt"]:
                    if dt_field in record: record[dt_field] = parse_gov_date(record[dt_field])
            
            translation_dict = keys_translation.get(resource_key, {})
            for key, value in record.items():
                if value is None: continue
                if key in translation_dict and key != "ordered_keys":
                    processed_record[translation_dict[key]] = str(value)
                    
            ordered_keys = [translation_dict[k] for k in translation_dict.get("ordered_keys", []) if k in translation_dict and translation_dict[k] in processed_record]
                    
            return {
                "source_key": resource_key,
                "source_name": hebrew_resource_ids[resource_key],
                "data": processed_record,
                "ordered_keys": ordered_keys
            }
            
    except Exception as e:
        logging.error(f"Error querying {resource_key}: {e}")
        
    return None

def lp_search(lp_to_find: str):
    raw = str(lp_to_find).strip()
    # Reject strings with SQL injection, quotes, letters or special chars
    if not re.fullmatch(r"[\d\s\-]{5,12}", raw):
        return None
    clean_lp = re.sub(r"\D", "", raw)
    if not re.fullmatch(r"\d{5,8}", clean_lp):
        return None

    # Check short-term cache first
    cached = _SEARCH_CACHE.get(clean_lp)
    if cached:
        ts, result = cached
        if time.time() - ts < _CACHE_TTL:
            return result.copy()
        else:
            del _SEARCH_CACHE[clean_lp]
        
    unified_profile = {
        "license_plate": clean_lp,
        "is_handicapped": False,
        "red_flags": [],
        "datasets": {}
    }
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=17) as executor:
        future_to_resource = {
            executor.submit(fetch_data_for_resource, r_key, clean_lp): r_key 
            for r_key in resource_ids.keys()
        }
        
        for future in concurrent.futures.as_completed(future_to_resource):
            result = future.result()
            if result:
                source_key = result["source_key"]
                
                if source_key == "handicapped":
                    unified_profile["is_handicapped"] = True
                    
                unified_profile["datasets"][source_key] = result
                
                # Flag processing
                if source_key == "recall":
                    unified_profile["red_flags"].append("⚠️ קריאת שירות (ריקול) פתוחה רשומה על רכב זה")
                if source_key == "hagbalat_recall":
                    unified_profile["red_flags"].append("🚨 רישיון הרכב מוגבל עקב אי-ביצוע ריקול בזמן")
                if source_key in ["reshev_bitul_sofi", "reshev_bitul_sofi_2", "reshev_bitul_sofi_3"]:
                    unified_profile["red_flags"].append("❌ רכב זה הורד מהכביש או בוטל סופית")
                if source_key in ["rechev_inactive_degem", "rechev_inactive_no_degem"]:
                    unified_profile["red_flags"].append("❗ רכב זה רשום במשרד הרישוי כלא פעיל")
                    
                # Check expiration 
                expiry_keys = ["תוקף רישיון רכב", "תוקף רישיון", "תוקף רישיון (פג)"]
                for ek in expiry_keys:
                    if ek in result["data"]:
                        if is_date_expired(result["data"][ek]):
                            msg = "⚠️ תוקף רישיון הרכב (טסט) פג"
                            if msg not in unified_profile["red_flags"]:
                                unified_profile["red_flags"].append(msg)
                                
    # Only return if found in at least one dataset (even just a historic one)
    if not unified_profile["datasets"]:
         return None

    # Cache the unified profile briefly
    try:
        _SEARCH_CACHE[clean_lp] = (time.time(), unified_profile.copy())
    except Exception:
        pass

    return unified_profile
