# dictionaries.py

resource_ids = {
    "private_vehicles": "053cea08-09bc-40ec-8f7a-156f0677aff3",
    "busses": "91d298ed-a260-4f93-9d50-d5e3c5b82ce1",
    "motorcycles": "bf9df4e2-d90d-4c0a-a400-19e15af8e95f",
    "handicapped": "c8b9f9c8-4612-4068-934f-d4acd2e3c06e",
    "private_import": "03adc637-b6fe-402b-9937-7c3d3afc9140",
    "shinui_mivne": "56063a99-8a3e-4ff4-912e-5966c0279bad",
    "recall": "36bf5fb6-f514-4dea-aa31-6ac338421008",
    "hagbalat_recall": "153a77ea-09ce-4bc9-923f-42a9451a44e5",
    "heavy_truck": "cd3acc5c-03c3-4c89-9c54-d40f93c0d790",
    "vehicles_filters": "7cb2bd95-bf2e-49b6-aea1-fcb5ff6f0473",
    "rechev_inactive_degem": "f6efe89a-fb3d-43a4-bb61-9bf12a9b9099",
    "rechev_inactive_no_degem": "6f6acd03-f351-4a8f-8ecf-df792f4f573a",
    "reshev_bitul_sofi": "851ecab1-0622-4dbe-a6c7-f950cf82abf9",
    "reshev_bitul_sofi_2": "4e6b9724-4c1e-43f0-909a-154d4cc4e046",
    "reshev_bitul_sofi_3": "ec8cbc34-72e1-4b69-9c48-22821ba0bd6c",
    "kli_rechev_ciburiim": "cf29862d-ca25-4691-84f6-1be60dcb4a1e",
    "vehicle_history": "bb2355dc-9ec7-4f06-9c3f-3344672171da"
}

hebrew_resource_ids = {
    "private_vehicles": "כלי רכב פרטיים ומסחריים",
    "busses": "אוטובוסים, מוניות ורכבים ציבוריים",
    "motorcycles": "כלי רכב דו גלגליים",
    "handicapped": "כלי רכב עם תג חניה לנכה",
    "private_import": "כלי רכב ביבוא אישי",
    "shinui_mivne": "מבחן רישוי שינוי מבנה וקילומטראז'",
    "recall": "הודעות יצרני הרכב לריקול",
    "hagbalat_recall": "הגבלת רישוי בגין ריקול",
    "heavy_truck": "כלי רכב כבדים (מעל 3.5 טון)",
    "vehicles_filters": "התקנת מסנן למזהמים",
    "rechev_inactive_degem": "רכבים לא פעילים (עם דגם)",
    "rechev_inactive_no_degem": "רכבים לא פעילים (ללא דגם)",
    "reshev_bitul_sofi": "רכבים מבוטלים / הורדו מהכביש",
    "reshev_bitul_sofi_2": "רכבים מבוטלים (ארכיון 2)",
    "reshev_bitul_sofi_3": "רכבים מבוטלים (ארכיון 3)",
    "kli_rechev_ciburiim": "כלי רכב ציבוריים (פעילים)",
    "vehicle_history": "היסטוריית העברת בעלות"
}

resource_urls = {
    k: f"https://data.gov.il/dataset/search/resource/{v}" for k, v in resource_ids.items()
}

resource_filter_params = {
    "handicapped": "filters=MISPAR%2520RECHEV%253A",
    "recall": "filters=MISPAR_RECHEV%3A",
    "hagbalat_recall": "filters=MISPAR_RECHEV%3A"
}
# auto fill the rest
for _k in resource_ids.keys():
    if _k not in resource_filter_params:
        resource_filter_params[_k] = "filters=mispar_rechev%3A"

license_plate_field = {
    "busses": "bus_license_id",
    "handicapped": "MISPAR RECHEV",
    "recall": "MISPAR_RECHEV",
    "hagbalat_recall": "MISPAR_RECHEV"
}
for _k in resource_ids.keys():
    if _k not in license_plate_field:
        license_plate_field[_k] = "mispar_rechev"

keys_translation = {
    "private_vehicles": {
        "ordered_keys": ['tozeret_nm', 'kinuy_mishari', 'degem_nm', 'ramat_gimur'],
        'degem_nm': "שם דגם",
        'kinuy_mishari': "כינוי מסחרי",
        'ramat_gimur': "רמת גימור",
        'shnat_yitzur': "שנת ייצור",
        'mispar_rechev': "מספר רכב",
        'sug_degem': "סוג דגם (פרטי/מסחרי)",
        'tozeret_nm': "שם יצרן",
        'ramat_eivzur_betihuty': "רמת אבזור בטיחותי",
        'kvutzat_zihum': "קבוצת זיהום",
        'degem_manoa': "דגם מנוע",
        'mivchan_acharon_dt': "תאריך מבחן מעשי לרכב (טסט)",
        'tokef_dt': "תוקף רישיון רכב",
        'baalut': "סוג בעלות",
        'misgeret': "מסגרת",
        'tzeva_rechev': "צבע רכב",
        'zmig_kidmi': "צמיג קדמי",
        'zmig_ahori': "צמיג אחורי",
        'sug_delek_nm': "סוג דלק",
        'moed_aliya_lakvish': "מועד עליה לכביש"
    },
    "handicapped": {
        "MISPAR RECHEV": "מספר רכב",
        "TAARICH HAFAKAT TAG": "תאריך הפקת תו נכה",
        "SUG TAV": "סוג תו נכה"
    },
    "busses": {
        "operator_nm": "חברה מפעילה",
        "bus_license_id": "מספר רכב",
        "stone_proof_nm": "ממוגן אבנים?",
        "bullet_proof_nm": "ממוגן ירי?",
        "production_year": "שנת ייצור",
        "production_country": "ארץ ייצור",
        "total_kilometer": "קילומטרז' סה\"כ"
    },
    "motorcycles": {
        "ordered_keys": ['tozeret_nm', 'degem_nm', 'nefach_manoa'],
        "tozeret_nm": "שם תוצר",
        "tozeret_eretz_nm": "ארץ ייצור",
        "degem_nm": "שם דגם",
        "nefach_manoa": "נפח מנוע",
        "hespek": "הספק מנוע",
        "mispar_rechev": "מספר רכב",
        "shnat_yitzur": "שנת ייצור",
        "sug_delek_nm": "סוג דלק",
        "mishkal_kolel": "משקל כולל",
        "mida_zmig_kidmi": "צמיג קדמי",
        "mida_zmig_ahori": "צמיג אחורי",
        "misgeret": "מספר שילדה"
    },
    "private_import": {
        "ordered_keys": ['tozeret_nm', 'degem_nm', 'sug_yevu'],
        "tozeret_nm": "שם תוצר",
        "degem_nm": "שם דגם",
        "tozeret_eretz_nm": "ארץ ייצור",
        "shnat_yitzur": "שנת יצור",
        "mispar_rechev": "מספר רכב",
        "shilda": "מספר שילדה",
        "tozeret_cd": "קוד תוצר",
        "sug_rechev_cd": "קוד סוג רכב",
        "sug_rechev_nm": "סוג רכב",
        "mishkal_kolel": "משקל כולל",
        "nefach_manoa": "נפח מנוע",
        "degem_manoa": "דגם מנוע",
        "mivchan_acharon_dt": "תאריך טסט אחרון",
        "tokef_dt": "תוקף רישיון רכב",
        "sug_yevu": "סוג יבוא (חדש/משומש)",
        "moed_aliya_lakvish": "מועד עליה לכביש",
        "sug_delek_nm": "סוג דלק"
    },
    "shinui_mivne": {
        "ordered_keys": ["kilometer_test_aharon", "rishum_rishon_dt", "mkoriut_nm", "mispar_manoa", "shinui_mivne_ind", "shnui_zeva_ind", "shinui_zmig_ind", "gapam_ind"],
        "mispar_manoa": "מספר מנוע",
        "kilometer_test_aharon": "קילומטראז' במבחן האחרון",
        "shinui_mivne_ind": "אינדיקטור שינוי מבנה",
        "gapam_ind": "מערכת גפ״מ",
        "shnui_zeva_ind": "שינוי צבע",
        "shinui_zmig_ind": "שינוי צמיג",
        "rishum_rishon_dt": "תאריך רישום ראשון",
        "mkoriut_nm": "מקוריות הרכב"
    },
    "recall": {
        "RECALL_TAKALA": "תקלת ריקול",
        "TEUR_TAKALA": "תיאור תקלה",
        "TAARICH_PTICHA": "תאריך פתיחת הריקול"
    },
    "hagbalat_recall": {
        "HAGBALOA_RECALL": "סיבת הגבלת רישיון",
        "TAARICH_PTICHA": "תאריך פתיחה"
    },
    "heavy_truck": {
        "tozeret_nm": "שם תוצר",
        "degem_nm": "שם דגם",
        "shnat_yitzur": "שנת ייצור",
        "mishkal_kolel": "משקל כולל",
        "mishkal_mitan_harama": "משקל מטען הרמה"
    },
    "vehicles_filters": {
        "taarich_hatkana": "תאריך התקנת מסנן",
        "rishum_rishon_dt": "תאריך רישום ראשון"
    },
    "rechev_inactive_degem": {
        "tozeret_nm": "שם תוצר",
        "degem_nm": "שם דגם",
        "shnat_yitzur": "שנת ייצור",
        "tokef_dt": "תוקף רישיון (פג)"
    },
    "rechev_inactive_no_degem": {
        "tozeret_nm": "שם תוצר",
        "degem_nm": "שם דגם",
        "shnat_yitzur": "שנת ייצור"
    },
    "reshev_bitul_sofi": {
        "tozeret_nm": "שם תוצר",
        "degem_nm": "שם דגם",
        "shnat_yitzur": "שנת ייצור",
        "bitul_dt": "תאריך ביטול רכב"
    },
    "reshev_bitul_sofi_2": {
        "tozeret_nm": "שם תוצר",
        "degem_nm": "שם דגם",
        "shnat_yitzur": "שנת ייצור",
        "bitul_dt": "תאריך ביטול רכב"
    },
    "reshev_bitul_sofi_3": {
        "tozeret_nm": "שם תוצר",
        "degem_nm": "שם דגם",
        "shnat_yitzur": "שנת ייצור",
        "bitul_dt": "תאריך ביטול רכב"
    },
    "kli_rechev_ciburiim": {
        "tozeret_nm": "שם תוצר",
        "degem_nm": "שם דגם",
        "shnat_yitzur": "שנת ייצור",
        "tokef_dt": "תוקף רישיון"
    },
    "vehicle_history": {
        "baalut_dt": "תאריך שינוי בעלות",
        "baalut": "סוג בעלות"
    }
}

type_of_vehicle = {
    "P": "פרטי",
    "M": "מסחרי"
}

sug_tav_mapping = {
    "1": "תו מחומש (רגיל, תו ירוק)",
    "2": "תו כסא גלגלים (מלבן כחול)",
    "3": "תו מחומש נכה צה\"ל (משולש ירוק + כלנית)",
    "4": "תו כסא גלגלים נכה צה\"ל (מלבן כחול + כלנית)"
}
