
import csv
from pathlib import Path

with Path("data.csv").open("r") as data_file:
    rows = list(csv.DictReader(data_file))

for row in rows:
    if row["spoken_language"] == "en":
        for spoken_language, signed_language in [("fr", "fsl")]:
            new_row = row.copy()
            new_row["spoken_language"] = spoken_language
            new_row["signed_language"] = signed_language
            rows.append(new_row)

with Path("index.csv").open("w", newline="") as index_file:
    writer = csv.DictWriter(index_file, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
