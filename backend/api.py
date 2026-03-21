import requests
import concurrent.futures
import logging
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

def parse_gov_date(ts):
    ts = str(ts).replace("-", "").replace(" ", "").replace("T", "").split(".")[0]
    if len(ts) >= 8 and ts[:8].isdigit():
        return f"{ts[6:8]}/{ts[4:6]}/{ts[0:4]}"
    return ts

def fetch_data_for_resource(resource_key: str, lp_to_find: str):
    field_name = license_plate_field.get(resource_key)
    resource_id = resource_ids.get(resource_key)
    
    if not field_name or not resource_id: return None
        
    url = f"https://data.gov.il/api/action/datastore_search?resource_id={resource_id}&filters={{\"{field_name}\":\"{lp_to_find}\"}}"
    
    try:
        response = requests.get(url, headers={'user-agent': 'datagov-external-client'}, timeout=10)
        if response.status_code != 200: return None
        data = response.json()
        
        if data.get("result", {}).get("total", 0) > 0:
            
            # Special check for arrays of records like vehicle_history
            if resource_key == "vehicle_history":
                records = data["result"]["records"]
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
                
            record = data["result"]["records"][0]
            processed_record = {}
            
            if resource_key == "private_vehicles":
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
            elif resource_key in ["recall", "hagbalat_recall"]:
                if "TAARICH_PTICHA" in record: record["TAARICH_PTICHA"] = parse_gov_date(record["TAARICH_PTICHA"])
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

def is_date_expired(date_str):
    try:
        dt = datetime.strptime(date_str, "%d/%m/%Y")
        return dt < datetime.now()
    except Exception:
        return False

def lp_search(lp_to_find: str):
    lp_to_find = str(lp_to_find).strip()
    if not lp_to_find: return None
        
    unified_profile = {
        "license_plate": lp_to_find,
        "is_handicapped": False,
        "red_flags": [],
        "datasets": {}
    }
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=17) as executor:
        future_to_resource = {
            executor.submit(fetch_data_for_resource, r_key, lp_to_find): r_key 
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
                # Known possible Hebrew keys for expiry:
                expiry_keys = ["תוקף רישיון רכב", "תוקף רישיון", "תוקף רישיון (פג)"]
                for ek in expiry_keys:
                    if ek in result["data"]:
                        if is_date_expired(result["data"][ek]):
                            # avoid duplicate flags if multiple DBs report expired
                            msg = "⚠️ תוקף רישיון הרכב (טסט) פג"
                            if msg not in unified_profile["red_flags"]:
                                unified_profile["red_flags"].append(msg)
                                
    # Only return if found in at least one dataset (even just a historic one)
    if not unified_profile["datasets"]:
         return None
         
    return unified_profile
