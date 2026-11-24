import importlib.util, pathlib, sqlite3, unittest
spec=importlib.util.spec_from_file_location("index",pathlib.Path(__file__).with_name("prepare-geographic-index.py"))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class IndexTest(unittest.TestCase):
    def test_geo_identity_and_sql(self):
        row=["123","O'Brien","O'Brien","","12.1","77.1","P","PPL","IN","","01","","","","5000","","","Asia/Kolkata","2026-11-24"]
        rows=list(m.geo_rows(["\t".join(row)]))
        self.assertEqual(rows[0]["name_key"],"o brien")
        self.assertEqual(rows[0]["source_id"],"geonames-123")
        sql,report=m.prepare(rows,"IN",0,5000,"2026-11-24")
        db=sqlite3.connect(":memory:")
        db.executescript((pathlib.Path(__file__).parents[1]/"schema/004_public_place_index.sql").read_text())
        db.executescript(sql);db.executescript(sql)
        self.assertEqual(db.execute("select name from public_place_index").fetchone()[0],"O'Brien")
        self.assertEqual(db.execute("select count(*) from public_place_index").fetchone()[0],1)
        self.assertEqual(report["approvedGuides"],0)
        with self.assertRaises(ValueError):m.prepare(rows,"ALL",0,5001,"2026")
    def test_heritage_identity_no_description(self):
        rows=list(m.heritage_rows(b"<query><row><id_number>123</id_number><site>Example</site><iso_code>IN, NP</iso_code><latitude>26</latitude><longitude>80</longitude><short_description>Not copied</short_description></row></query>"))
        self.assertEqual(len(rows),2)
        self.assertNotIn("short_description",rows[0])
        with self.assertRaises(ValueError):list(m.heritage_rows(b"<!DOCTYPE x><x/>"))
if __name__=="__main__":unittest.main()
