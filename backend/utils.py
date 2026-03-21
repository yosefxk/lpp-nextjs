import re

def format_date(date_str):
    if not date_str:
        return date_str
    # Dates sometimes come as YYYY-MM-DD
    if re.match(r'^\d{4}-\d{2}-\d{2}', date_str):
        return f"{date_str[8:10]}/{date_str[5:7]}/{date_str[0:4]}"
    return date_str
