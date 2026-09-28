"""
Downloads every piece of religious and reference data the app ships with, from established sources.
Nothing here is typed by hand, so the app never shows Quran, dua or name text that wasn't sourced.

  python scripts/data/fetch_data.py            # everything
  python scripts/data/fetch_data.py quran duas # selected parts

Sources
  Quran text     api.alquran.cloud — quran-uthmani (Tanzil Uthmani), en.sahih (Sahih International),
                 bn.bengali (Muhiuddin Khan), en.transliteration
  Duas           hisnmuslim.com API — Hisnul Muslim (Fortress of the Muslim), Sa'id al-Qahtani
  99 Names       api.aladhan.com /v1/asmaAlHusna
  Cities         nominatim.openstreetmap.org (coordinates) — time zones assigned per city below
  Hadith         fawazahmed0/hadith-api (jsDelivr) — Sahih Muslim: Arabic, English (Abdul Hamid Siddiqui),
                 Bangla (Islamic Foundation). Short excerpts cut at fixed anchors, never retyped.
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ASSETS = os.path.join(ROOT, "assets", "data")
SRC_DATA = os.path.join(ROOT, "src", "data")
UA = "NoorApp-data-build/1.0"


def get_json(url, tolerant=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        raw = r.read().decode("utf-8-sig")
    if tolerant:  # hisnmuslim.com serves hand-written JSON
        raw = re.sub(r",\s*([\]}])", r"\1", raw)  # trailing commas
        raw = re.sub(r'^(\s*)"([^"\n]*?):\s*$', r'\1"\2":', raw, flags=re.M)  # a key missing its closing quote (chapter 126)
        return json.loads(raw, strict=False)
    return json.loads(raw)


def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))


def write_ts(path, header, name, type_name, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(header)
        f.write(f"export const {name}: {type_name} = ")
        f.write(json.dumps(data, ensure_ascii=False, indent=1))
        f.write(";\n")


# ---------------------------------------------------------------- Quran
def no_bom(text):
    # Some ayahs in the feed (e.g. 1:1) start with an invisible byte-order mark.
    return text.replace("﻿", "").strip()


def quran():
    base = "https://api.alquran.cloud/v1"
    editions = {"ar": "quran-uthmani", "en": "en.sahih", "bn": "bn.bengali", "tr": "en.transliteration"}
    data = {}
    for key, ed in editions.items():
        print("quran:", ed)
        data[key] = get_json(f"{base}/quran/{ed}")["data"]
        print("   ", data[key]["edition"]["englishName"], "-", data[key]["edition"]["name"])

    # Take the basmala exactly as the source encodes it (Al-Fatiha 1:1), never a retyped copy.
    basmala = no_bom(data["ar"]["surahs"][0]["ayahs"][0]["text"])
    surahs_meta = []
    total = 0
    stripped = 0
    for i, s_ar in enumerate(data["ar"]["surahs"]):
        n = s_ar["number"]
        ayahs = []
        for j, a in enumerate(s_ar["ayahs"]):
            ar = no_bom(a["text"])
            # The Tanzil feed prefixes the basmala to ayah 1 of every surah except 1 and 9.
            # It isn't part of that ayah (in Hafs it is only ayah 1 of al-Fatiha), so show it as a header instead.
            if n not in (1, 9) and a["numberInSurah"] == 1:
                # Tanzil writes surahs 95 and 97 with an extra shadda on the first letter (بِّسْمِ).
                variant = basmala[0] + "ّ" + basmala[1:]
                for prefix in (basmala, variant):
                    if ar.startswith(prefix):
                        ar = ar[len(prefix):].strip()
                        stripped += 1
                        break
            sajda = a.get("sajda")
            ayahs.append(
                {
                    "n": a["numberInSurah"],
                    "ar": ar,
                    "en": no_bom(data["en"]["surahs"][i]["ayahs"][j]["text"]),
                    "bn": no_bom(data["bn"]["surahs"][i]["ayahs"][j]["text"]),
                    "tr": no_bom(data["tr"]["surahs"][i]["ayahs"][j]["text"]),
                    "juz": a["juz"],
                    "page": a["page"],
                    **({"sajda": True} if sajda else {}),
                }
            )
        total += len(ayahs)
        write_json(os.path.join(ASSETS, "quran", f"{n}.qdata"), {"n": n, "ayahs": ayahs})
        surahs_meta.append(
            {
                "n": n,
                "ar": s_ar["name"],
                "name": s_ar["englishName"],
                "meaning": s_ar["englishNameTranslation"],
                "type": s_ar["revelationType"],
                "ayahs": len(ayahs),
                "juz": ayahs[0]["juz"],
            }
        )

    assert len(surahs_meta) == 114, len(surahs_meta)
    assert total == 6236, total
    assert stripped == 112, stripped
    print(f"quran: 114 surahs, {total} ayahs, basmala headers split from {stripped} surahs")

    write_ts(
        os.path.join(SRC_DATA, "basmala.ts"),
        "// Generated by scripts/data/fetch_data.py — exact text of Al-Fatiha 1:1 from the source.\n\n",
        "BASMALA",
        "string",
        basmala,
    )
    header = (
        "// Generated by scripts/data/fetch_data.py — do not edit by hand.\n"
        "// Source: api.alquran.cloud (Tanzil Uthmani text).\n\n"
        "export type SurahMeta = { n: number; ar: string; name: string; meaning: string; type: 'Meccan' | 'Medinan'; ayahs: number; juz: number };\n\n"
    )
    write_ts(os.path.join(SRC_DATA, "surahs.ts"), header, "SURAHS", "SurahMeta[]", surahs_meta)

    # Where each juz starts (surah:ayah), from the same source.
    meta = get_json(f"{base}/meta")["data"]
    juzs = [{"juz": i + 1, "surah": r["surah"], "ayah": r["ayah"]} for i, r in enumerate(meta["juzs"]["references"])]
    assert len(juzs) == 30
    header = "// Generated by scripts/data/fetch_data.py — do not edit by hand.\n\nexport type JuzStart = { juz: number; surah: number; ayah: number };\n\n"
    write_ts(os.path.join(SRC_DATA, "juz.ts"), header, "JUZ_STARTS", "JuzStart[]", juzs)


# ---------------------------------------------------------------- Duas
def _wraps_whole(text):
    """True when the first "(" closes at the very last character, i.e. one pair wraps everything."""
    depth = 0
    for i, ch in enumerate(text):
        depth += ch == "("
        depth -= ch == ")"
        if depth == 0 and i < len(text) - 1:
            return False
    return depth == 0


def clean(text):
    text = (text or "").strip()
    # The source wraps many entries in one or two pairs of parentheses, sometimes followed by ".".
    while True:
        before = text
        if text.endswith(".") and text[:-1].rstrip().endswith(")"):
            text = text[:-1].rstrip()
        if text.startswith("(") and text.endswith(")") and _wraps_whole(text):
            text = text[1:-1].strip()
        if text.startswith("."):
            text = text[1:].strip()
        if text == before:
            break
    return re.sub(r"\s{2,}", " ", text)


def translit(text):
    # Tanzil-style "AA" marks the letter ʿayn; show it as ‘ (the UI font has no ʿ glyph).
    return re.sub(r"AA", "‘", clean(text))


def duas():
    index = get_json("https://www.hisnmuslim.com/api/en/husn_en.json", tolerant=True)["English"]
    chapters = []
    count = 0
    for ch in index:
        cid = ch["ID"]
        body = get_json(f"https://www.hisnmuslim.com/api/en/{cid}.json", tolerant=True)
        (title, items), = body.items()
        entries = []
        for x in items:
            ar = clean(x.get("ARABIC_TEXT"))
            if not ar:
                continue
            entries.append(
                {
                    "id": x["ID"],
                    "ar": ar,
                    "tr": translit(x.get("LANGUAGE_ARABIC_TRANSLATED_TEXT")),
                    "en": clean(x.get("TRANSLATED_TEXT")),
                    "repeat": int(x.get("REPEAT") or 1),
                }
            )
        if not entries:  # the source lists a few chapters with no text yet
            continue
        count += len(entries)
        # Drop stray leading marks (one title starts with an Arabic vowel sign), then capitalise.
        clean_title = re.sub(r"^[^A-Za-z0-9(]+", "", title.strip())
        chapters.append({"id": cid, "title": clean_title[:1].upper() + clean_title[1:], "duas": entries})
        time.sleep(0.15)
    chapters.sort(key=lambda c: c["id"])
    write_json(os.path.join(ASSETS, "duas.qdata"), chapters)
    toc = [{"id": c["id"], "title": c["title"], "count": len(c["duas"])} for c in chapters]
    header = (
        "// Generated by scripts/data/fetch_data.py — do not edit by hand.\n"
        "// Source: hisnmuslim.com — Hisnul Muslim (Fortress of the Muslim) by Sa'id ibn Ali ibn Wahf al-Qahtani.\n\n"
        "export type DuaChapterInfo = { id: number; title: string; count: number };\n\n"
    )
    write_ts(os.path.join(SRC_DATA, "duaChapters.ts"), header, "DUA_CHAPTERS", "DuaChapterInfo[]", toc)
    print(f"duas: {len(chapters)} chapters, {count} duas")


# ---------------------------------------------------------------- 99 Names
def names():
    d = get_json("https://api.aladhan.com/v1/asmaAlHusna")["data"]
    out = [{"n": x["number"], "ar": x["name"], "tr": x["transliteration"], "en": x["en"]["meaning"]} for x in d]
    assert len(out) == 99, len(out)
    header = (
        "// Generated by scripts/data/fetch_data.py — do not edit by hand.\n"
        "// Source: api.aladhan.com/v1/asmaAlHusna\n\n"
        "export type DivineName = { n: number; ar: string; tr: string; en: string };\n\n"
    )
    write_ts(os.path.join(SRC_DATA, "names.ts"), header, "NAMES_99", "DivineName[]", out)
    print("names: 99")


# ---------------------------------------------------------------- Cities
BD_DISTRICTS = [
    "Dhaka", "Chattogram", "Khulna", "Rajshahi", "Sylhet", "Barishal", "Rangpur", "Mymensingh",
    "Cumilla", "Narayanganj", "Gazipur", "Bogura", "Cox's Bazar", "Jashore", "Dinajpur", "Tangail",
    "Noakhali", "Feni", "Brahmanbaria", "Kushtia", "Pabna", "Faridpur", "Jamalpur", "Sirajganj",
    "Satkhira", "Patuakhali", "Bhola", "Habiganj", "Moulvibazar", "Sunamganj", "Kishoreganj", "Chandpur",
    "Lakshmipur", "Madaripur", "Gopalganj", "Natore", "Naogaon", "Chapai Nawabganj", "Thakurgaon",
    "Panchagarh", "Nilphamari", "Lalmonirhat", "Kurigram", "Gaibandha", "Joypurhat", "Rangamati",
    "Bandarban", "Khagrachari", "Magura", "Jhenaidah", "Narail", "Meherpur", "Chuadanga", "Bagerhat",
    "Pirojpur", "Jhalokati", "Barguna", "Shariatpur", "Rajbari", "Manikganj", "Munshiganj", "Narsingdi",
    "Netrokona", "Sherpur",
]

# (query, display name, country, ISO code, IANA time zone)
WORLD = [
    ("Mecca, Saudi Arabia", "Makkah", "Saudi Arabia", "SA", "Asia/Riyadh"),
    ("Medina, Saudi Arabia", "Madinah", "Saudi Arabia", "SA", "Asia/Riyadh"),
    ("Riyadh, Saudi Arabia", "Riyadh", "Saudi Arabia", "SA", "Asia/Riyadh"),
    ("Jeddah, Saudi Arabia", "Jeddah", "Saudi Arabia", "SA", "Asia/Riyadh"),
    ("Dubai, United Arab Emirates", "Dubai", "United Arab Emirates", "AE", "Asia/Dubai"),
    ("Abu Dhabi, United Arab Emirates", "Abu Dhabi", "United Arab Emirates", "AE", "Asia/Dubai"),
    ("Doha, Qatar", "Doha", "Qatar", "QA", "Asia/Qatar"),
    ("Kuwait City, Kuwait", "Kuwait City", "Kuwait", "KW", "Asia/Kuwait"),
    ("Muscat, Oman", "Muscat", "Oman", "OM", "Asia/Muscat"),
    ("Manama, Bahrain", "Manama", "Bahrain", "BH", "Asia/Bahrain"),
    ("Cairo, Egypt", "Cairo", "Egypt", "EG", "Africa/Cairo"),
    ("Istanbul, Turkey", "Istanbul", "Türkiye", "TR", "Europe/Istanbul"),
    ("Karachi, Pakistan", "Karachi", "Pakistan", "PK", "Asia/Karachi"),
    ("Lahore, Pakistan", "Lahore", "Pakistan", "PK", "Asia/Karachi"),
    ("Islamabad, Pakistan", "Islamabad", "Pakistan", "PK", "Asia/Karachi"),
    ("New Delhi, India", "New Delhi", "India", "IN", "Asia/Kolkata"),
    ("Mumbai, India", "Mumbai", "India", "IN", "Asia/Kolkata"),
    ("Kolkata, India", "Kolkata", "India", "IN", "Asia/Kolkata"),
    ("Hyderabad, Telangana, India", "Hyderabad", "India", "IN", "Asia/Kolkata"),
    ("Kathmandu, Nepal", "Kathmandu", "Nepal", "NP", "Asia/Kathmandu"),
    ("Colombo, Sri Lanka", "Colombo", "Sri Lanka", "LK", "Asia/Colombo"),
    ("Male, Maldives", "Malé", "Maldives", "MV", "Indian/Maldives"),
    ("Kabul, Afghanistan", "Kabul", "Afghanistan", "AF", "Asia/Kabul"),
    ("Tehran, Iran", "Tehran", "Iran", "IR", "Asia/Tehran"),
    ("Baghdad, Iraq", "Baghdad", "Iraq", "IQ", "Asia/Baghdad"),
    ("Amman, Jordan", "Amman", "Jordan", "JO", "Asia/Amman"),
    ("Jerusalem", "Al-Quds (Jerusalem)", "Palestine", "PS", "Asia/Jerusalem"),
    ("Casablanca, Morocco", "Casablanca", "Morocco", "MA", "Africa/Casablanca"),
    ("Tashkent, Uzbekistan", "Tashkent", "Uzbekistan", "UZ", "Asia/Tashkent"),
    ("Kuala Lumpur, Malaysia", "Kuala Lumpur", "Malaysia", "MY", "Asia/Kuala_Lumpur"),
    ("Singapore", "Singapore", "Singapore", "SG", "Asia/Singapore"),
    ("Jakarta, Indonesia", "Jakarta", "Indonesia", "ID", "Asia/Jakarta"),
    ("Lagos, Nigeria", "Lagos", "Nigeria", "NG", "Africa/Lagos"),
    ("Nairobi, Kenya", "Nairobi", "Kenya", "KE", "Africa/Nairobi"),
    ("Johannesburg, South Africa", "Johannesburg", "South Africa", "ZA", "Africa/Johannesburg"),
    ("London, United Kingdom", "London", "United Kingdom", "GB", "Europe/London"),
    ("Birmingham, United Kingdom", "Birmingham", "United Kingdom", "GB", "Europe/London"),
    ("Manchester, United Kingdom", "Manchester", "United Kingdom", "GB", "Europe/London"),
    ("Paris, France", "Paris", "France", "FR", "Europe/Paris"),
    ("Berlin, Germany", "Berlin", "Germany", "DE", "Europe/Berlin"),
    ("Amsterdam, Netherlands", "Amsterdam", "Netherlands", "NL", "Europe/Amsterdam"),
    ("Madrid, Spain", "Madrid", "Spain", "ES", "Europe/Madrid"),
    ("Rome, Italy", "Rome", "Italy", "IT", "Europe/Rome"),
    ("Stockholm, Sweden", "Stockholm", "Sweden", "SE", "Europe/Stockholm"),
    ("Moscow, Russia", "Moscow", "Russia", "RU", "Europe/Moscow"),
    ("Toronto, Canada", "Toronto", "Canada", "CA", "America/Toronto"),
    ("New York City, USA", "New York", "United States", "US", "America/New_York"),
    ("Chicago, USA", "Chicago", "United States", "US", "America/Chicago"),
    ("Houston, USA", "Houston", "United States", "US", "America/Chicago"),
    ("Los Angeles, USA", "Los Angeles", "United States", "US", "America/Los_Angeles"),
    ("Sydney, Australia", "Sydney", "Australia", "AU", "Australia/Sydney"),
    ("Melbourne, Australia", "Melbourne", "Australia", "AU", "Australia/Melbourne"),
    ("Tokyo, Japan", "Tokyo", "Japan", "JP", "Asia/Tokyo"),
    ("Seoul, South Korea", "Seoul", "South Korea", "KR", "Asia/Seoul"),
]


def _search(params):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({"format": "json", "limit": 1, **params})
    res = get_json(url)
    time.sleep(1.1)  # Nominatim usage policy: max 1 request per second
    return res[0] if res else None


def geocode(query):
    # A structured city search returns the town itself; free text can return the district's centre
    # (e.g. "Sylhet" → Sylhet District, ~20 km from the city). Fall back to free text only if needed.
    if ", " in query:
        city, country = query.rsplit(", ", 1)
        hit = _search({"city": city, "country": country})
        if hit:
            return round(float(hit["lat"]), 4), round(float(hit["lon"]), 4)
    hit = _search({"q": query})
    if not hit:
        raise RuntimeError(f"no geocode result for {query}")
    print("     (free-text match)", query)
    return round(float(hit["lat"]), 4), round(float(hit["lon"]), 4)


def cities():
    out = []
    for name in BD_DISTRICTS:
        lat, lon = geocode(f"{name}, Bangladesh")
        out.append({"name": name, "country": "Bangladesh", "cc": "BD", "tz": "Asia/Dhaka", "lat": lat, "lng": lon})
        print("  ", name, lat, lon)
    for query, name, country, cc, tz in WORLD:
        lat, lon = geocode(query)
        out.append({"name": name, "country": country, "cc": cc, "tz": tz, "lat": lat, "lng": lon})
        print("  ", name, lat, lon)
    # Sanity: every Bangladeshi result must fall inside Bangladesh's bounding box.
    for c in out:
        if c["cc"] == "BD":
            assert 20.5 < c["lat"] < 26.7 and 88.0 < c["lng"] < 92.7, c
    header = (
        "// Generated by scripts/data/fetch_data.py — do not edit by hand.\n"
        "// Coordinates: OpenStreetMap Nominatim (© OpenStreetMap contributors, ODbL).\n\n"
        "export type City = { name: string; country: string; cc: string; tz: string; lat: number; lng: number };\n\n"
    )
    write_ts(os.path.join(SRC_DATA, "cities.ts"), header, "CITIES", "City[]", out)
    print(f"cities: {len(out)}")


# Hadith quoted in the app. Each excerpt is cut from the source text between two anchors that must
# appear exactly as given, so the words shown are the source's own. `n` is the edition's running
# number; `ref` is the standard (Abdul Baqi) number people look up.
HADITH = [
    {
        "id": "consistency", "n": 1830, "ref": "Sahih Muslim 783",
        "ar": ("أَحَبُّ الأَعْمَالِ", "وَإِنْ قَلَّ"),
        "en": ("The acts most pleasing", "even if they are small."),
        "bn": ("আল্লাহর কাছে এমন", "করা হয়।"),
    },
    {
        "id": "shawwal", "n": 2758, "ref": "Sahih Muslim 1164",
        "ar": ("مَنْ صَامَ رَمَضَانَ", "كَصِيَامِ الدَّهْرِ"),
        "en": ("He who observed", "fasted perpetually"),
        "bn": ("রমযান মাসের সিয়াম", "মত।"),
    },
    {
        "id": "arafah", "n": 2747, "ref": "Sahih Muslim 1162",
        "en": ("He was asked about fasting on the day of 'Arafa", "the coming year."),
        "bn": ("অতঃপর আরাফাহ দিবসের", "হয়ে যাবে।"),
    },
    {
        "id": "ashura", "n": 2747, "ref": "Sahih Muslim 1162",
        "en": ("He was asked about fasting on the day of 'Ashura", "the preceding year."),
        "bn": ("অতঃপর আশুরার", "হয়ে যাবে।"),
    },
]
# Typing slips in the English edition, corrected openly rather than silently.
HADITH_EN_FIXES = {"whereupon be said": "whereupon he said"}


_MARKS = re.compile("[ً-ْٰـ]")


def _between(text, start, end):
    """The source's own text from `start` to `end`. Arabic anchors match on letters alone, since
    sources differ in the order they store stacked marks (shadda + damma)."""
    keep = [i for i, ch in enumerate(text) if not _MARKS.match(ch)]
    skeleton = "".join(text[i] for i in keep)
    a, b = _MARKS.sub("", start), _MARKS.sub("", end)
    i = skeleton.index(a)
    j = skeleton.index(b, i) + len(b)
    stop = keep[j] if j < len(keep) else len(text)
    return text[keep[i]:stop].rstrip()


def hadith():
    base = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions"
    books = {lang: {h["hadithnumber"]: h for h in get_json(f"{base}/{ed}-muslim.json")["hadiths"]} for lang, ed in [("ar", "ara"), ("en", "eng"), ("bn", "ben")]}
    out = []
    for h in HADITH:
        std = h["ref"].split()[-1]
        assert str(books["en"][h["n"]]["arabicnumber"]).split(".")[0] == std, (h["id"], "numbering")
        item = {"id": h["id"], "ref": h["ref"]}
        for lang in ("ar", "en", "bn"):
            if lang not in h:
                continue
            text = _between(books[lang][h["n"]]["text"], *h[lang])
            if lang == "en":
                for bad, good in HADITH_EN_FIXES.items():
                    text = text.replace(bad, good)
                text = re.sub(r"\s*\((?:9th|10th) of [^)]*\)", "", text)  # date glosses, e.g. "(9th of Dhu'I-Hijja)"
                text = re.sub(r"(?<![A-Za-z])'(?=[A-Za-z])", "‘", text).replace("'", "’")  # ʿayn, then apostrophes
            item[lang] = re.sub(r"\s+", " ", text).strip()
        out.append(item)
        print("  ", h["id"], "|", item["en"])
    header = (
        "// Generated by scripts/data/fetch_data.py — do not edit by hand.\n"
        "// Source: Sahih Muslim via github.com/fawazahmed0/hadith-api — Arabic; English, Abdul Hamid Siddiqui;\n"
        "// Bangla, Islamic Foundation Bangladesh. Excerpts are cut from the source text at fixed anchors.\n\n"
        "export type HadithId = 'consistency' | 'shawwal' | 'arafah' | 'ashura';\n"
        "export type Hadith = { id: HadithId; ref: string; ar?: string; en: string; bn: string };\n\n"
    )
    write_ts(os.path.join(SRC_DATA, "hadith.ts"), header, "HADITH", "Hadith[]", out)


def asset_index():
    lines = ["// Generated — one asset per surah so a surah loads on its own. See scripts/data/fetch_data.py.", "", "export const QURAN_ASSETS: number[] = ["]
    lines += [f"  require('../../assets/data/quran/{n}.qdata')," for n in range(1, 115)]
    lines += ["];", "", "export const DUAS_ASSET: number = require('../../assets/data/duas.qdata');", ""]
    with open(os.path.join(SRC_DATA, "assets.ts"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


if __name__ == "__main__":
    parts = sys.argv[1:] or ["quran", "duas", "names", "cities", "asset_index"]
    for p in parts:
        globals()[p]()
