#!/usr/bin/env python3
"""Bounded GeoNames/UNESCO geographic identity intake. No travel claims or media.
GeoNames CC BY 4.0: https://www.geonames.org/export/
UNESCO: https://whc.unesco.org/en/list/ (names/IDs/coordinates only).
"""
import argparse, datetime, json, math, pathlib, re, unicodedata, xml.etree.ElementTree as ET, zipfile
from collections import Counter

def key(value):
    return " ".join("".join(c if c.isalnum() or unicodedata.category(c).startswith("M") else " " for c in unicodedata.normalize("NFKC",value).lower()).split())

def clean(value, maximum=200):
    value = str(value or "").strip()
    if not value or len(value)>maximum or any(ord(c)<32 for c in value):
        return ""
    return value

def coords(lat, lon):
    try:
        a,b=float(lat),float(lon)
        return (a,b) if math.isfinite(a) and math.isfinite(b) and -90<=a<=90 and -180<=b<=180 else (None,None)
    except (ValueError,TypeError):
        return (None,None)

def geo_rows(lines):
    for line in lines:
        p=line.rstrip("\r\n").split("\t")
        if len(p)!=19 or not re.fullmatch(r"\d{1,12}",p[0]) or p[6]!="P" or not re.fullmatch(r"[A-Z]{2}",p[8]):
            continue
        if not clean(p[1]) or not key(p[1]): continue
        lat,lon=coords(p[4],p[5])
        yield dict(source_id="geonames-"+p[0],name=p[1],name_key=key(p[1]),country_iso=p[8],admin_region=clean(p[10],30),latitude=lat,longitude=lon,feature_type=clean(p[7],20) or "P",source_url="https://www.geonames.org/"+p[0]+"/",attribution="GeoNames (CC BY 4.0)",source_date=clean(p[18],20) or "unknown")

def heritage_rows(xml):
    # Reject DTD/entities. Parse bounded official export; no description or HTML.
    if b"<!DOCTYPE" in xml.upper() or b"<!ENTITY" in xml.upper():
        raise ValueError("Unexpected XML declaration")
    root=ET.fromstring(xml)
    for node in root.iter():
        if node.tag.split("}")[-1]!="row": continue
        p={c.tag.split("}")[-1]:(c.text or "").strip() for c in node}
        sid=p.get("id_number","")
        name=clean(p.get("site",""))
        countries=sorted(set(re.findall(r"\b[A-Z]{2}\b",p.get("iso_code","").upper())))
        if not re.fullmatch(r"\d{1,12}",sid) or not name or not key(name) or not countries: continue
        lat,lon=coords(p.get("latitude"),p.get("longitude"))
        for cc in countries:
            yield dict(source_id="unesco-"+sid+"-"+cc.lower(),name=name,name_key=key(name),country_iso=cc,admin_region="",latitude=lat,longitude=lon,feature_type="heritage-reference",source_url="https://whc.unesco.org/en/list/"+sid+"/",attribution="UNESCO World Heritage List (site identity only)",source_date=clean(p.get("date_inscribed"),20) or "unknown")

def sql_value(x):
    if x is None:return "NULL"
    if isinstance(x,(int,float)):return str(x)
    return "'"+str(x).replace("'","''")+"'"

def prepare(rows, country, offset, limit, at):
    if not 1<=limit<=5000 or offset<0 or (country!="ALL" and not re.fullmatch(r"[A-Z]{2}",country)):raise ValueError("Invalid batch scope")
    unique={r["source_id"]:r for r in rows if country=="ALL" or r["country_iso"]==country}
    ordered=sorted(unique.values(),key=lambda r:(r["country_iso"]!="IN",r["source_id"]))
    selected=ordered[offset:offset+limit]
    columns="source_id name name_key country_iso admin_region latitude longitude feature_type source_url attribution source_date imported_at".split()
    statements=[]
    for r in selected:
        r={**r,"imported_at":at}
        statements.append("INSERT INTO public_place_index("+",".join(columns)+") VALUES("+",".join(sql_value(r[c]) for c in columns)+") ON CONFLICT(source_id) DO NOTHING;")
    report={"eligible":len(ordered),"batch":len(selected),"offset":offset,"nextOffset":offset+len(selected),"countries":dict(Counter(r["country_iso"] for r in selected)),"approvedGuides":0,"bookableListings":0}
    return "\n".join(statements)+"\n",report

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--geonames",required=True);p.add_argument("--unesco")
    p.add_argument("--country",default="ALL");p.add_argument("--offset",type=int,default=0);p.add_argument("--limit",type=int,default=5000)
    p.add_argument("--out",required=True);a=p.parse_args()
    with zipfile.ZipFile(a.geonames) as z:
        info=z.getinfo("cities500.txt")
        if info.file_size>350_000_000:raise ValueError("Unexpected source size")
        import io
        with z.open(info) as f: rows=list(geo_rows(io.TextIOWrapper(f,encoding="utf-8")))
    if not rows:raise ValueError("GeoNames export empty")
    if a.unesco:
        source=pathlib.Path(a.unesco)
        if source.stat().st_size>30_000_000:raise ValueError("Unexpected UNESCO export size")
        heritage=list(heritage_rows(source.read_bytes()))
        if not heritage:raise ValueError("UNESCO export schema not recognized; no import")
        rows+=heritage
    sql,report=prepare(rows,a.country,a.offset,a.limit,datetime.datetime.now(datetime.timezone.utc).isoformat())
    if not report["batch"]:raise ValueError("Empty batch")
    out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True)
    (out/"place-index.sql").write_text(sql,encoding="utf-8")
    (out/"place-index-report.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report))

if __name__=="__main__":main()
