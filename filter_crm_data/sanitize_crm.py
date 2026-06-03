import csv
import re

raw_path = "/Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/filter_crm_data/raw.csv"
final_path = "/Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/filter_crm_data/final.csv"

def clean_phone(phone_str):
    if not phone_str:
        return ""
    # remove all non-digits
    digits = re.sub(r'\D', '', phone_str)
    # Handle country code prefixes
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    # Keep only the last 10 digits
    if len(digits) >= 10:
        digits = digits[-10:]
    return digits

# Target headers exactly as requested
target_headers = [
    "Full Name", "Phone Number", "Email", "Campaign ID", "Source", "City",
    "Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10",
    "Answer  1", "Answer  2", "Answer  3", "Answer  4", "Answer  5", "Answer  6", "Answer  7", "Answer  8", "Answer  9", "Answer  10",
    "Coloumn 1", "Coloumn 2", "Coloumn 3", "Coloumn 4", "Coloumn 5", "Coloumn 6", "Coloumn 7", "Coloumn 8", "Coloumn 9", "Coloumn 10", "Coloumn 10"
]

with open(raw_path, mode='r', encoding='utf-8-sig') as f_in:
    reader = csv.DictReader(f_in)
    rows_out = []
    for row in reader:
        name = row.get("Name", "").strip()
        raw_phone = row.get("Phone", "").strip()
        cleaned_phone = clean_phone(raw_phone)
        
        email = f"{cleaned_phone}@gmail.com" if cleaned_phone else ""
        source = row.get("Source", "").strip()
        form_name = row.get("Form", "").strip()
        
        out_row = {h: "" for h in target_headers}
        out_row["Full Name"] = name
        out_row["Phone Number"] = cleaned_phone
        out_row["Email"] = email
        out_row["Source"] = source
        out_row["Coloumn 1"] = form_name
        
        rows_out.append(out_row)

# Write output to final.csv
# Since there are duplicate headers ("Coloumn 10"), using DictWriter might be tricky as dict keys must be unique.
# So we will write as lists of values instead.
with open(final_path, mode='w', encoding='utf-8', newline='') as f_out:
    writer = csv.writer(f_out)
    writer.writerow(target_headers)
    for row in rows_out:
        # Construct row values list preserving duplicate Coloumn 10 columns
        row_vals = []
        # Count occurrences of keys to handle duplicate header keys
        header_counts = {}
        for h in target_headers:
            row_vals.append(row[h])
        writer.writerow(row_vals)

print("Done! Generated final.csv with", len(rows_out), "rows.")
