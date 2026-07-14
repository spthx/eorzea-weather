"""気象庁が公開する観測所一覧・都道府県フィールドから地点表示用データを生成する。"""
import csv
import io
import json
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

MASTER_SOURCE_URL = "https://www.jma.go.jp/jma/kishou/know/amedas/ame_master.zip"
PREFECTURE_QUERY_URL = (
    "https://trigger-info02.bosai.go.jp/webgis/rest/services/Trigger_Info/"
    "AmeDAS/MapServer/0/query"
)
OUTPUT_PATH = Path(__file__).parents[1] / "js" / "locations.js"

def fetch_published_prefectures():
    """WebGISが公開する「都道府県」フィールドを観測所番号ごとにそのまま取得する。"""
    published = {}
    offset = 0
    while True:
        query = urllib.parse.urlencode({
            "where": "1=1",
            "outFields": "観測所番号,都道府県",
            "returnGeometry": "false",
            "f": "json",
            "resultOffset": offset,
            "resultRecordCount": 1000
        })
        with urllib.request.urlopen(f"{PREFECTURE_QUERY_URL}?{query}") as response:
            payload = json.load(response)
        features = payload.get("features", [])
        for feature in features:
            attributes = feature["attributes"]
            station_id = str(attributes["観測所番号"])
            published[station_id] = attributes["都道府県"]
        if not payload.get("exceededTransferLimit"):
            return published
        offset += len(features)

prefectures = fetch_published_prefectures()
archive = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(MASTER_SOURCE_URL).read()))
csv_name = next(name for name in archive.namelist() if name.endswith(".csv"))
rows = csv.reader(io.TextIOWrapper(archive.open(csv_name), encoding="cp932"))
next(rows)
metadata = {}
for row in rows:
    station_id = row[1]
    metadata[station_id] = {
        "prefecture": prefectures.get(station_id, ""),
        "location": row[6],
        "point": row[3]
    }

OUTPUT_PATH.write_text(
    "// 気象庁が公開する『地域気象観測所一覧』とWebGISの都道府県フィールドを加工して作成。\n"
    "// 未公開の行政区域を推定・補完しない。更新は scripts/build-amedas-location-metadata.py を実行。\n"
    f"const AMEDAS_LOCATION_METADATA = {json.dumps(metadata, ensure_ascii=False, separators=(',', ':'))};\n",
    encoding="utf-8"
)
