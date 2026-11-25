"""Generate the published Thai pronunciation clips with Google Cloud Text-to-Speech."""

import argparse
import base64
import hashlib
import json
import re
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VOICE = "th-TH-Standard-A"
ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize"


def entries():
    lesson_source = (ROOT / "lessons.js").read_text(encoding="utf-8")
    lessons = json.loads(lesson_source.removeprefix("window.LESSONS = ").strip().removesuffix(";"))
    for lesson in lessons:
        for phrase in lesson["phrases"]:
            phrase_id = phrase["id"]
            if not re.fullmatch(r"[0-9]+-[0-9]+", phrase_id):
                raise ValueError(f"Invalid phrase ID: {phrase_id}")
            text = phrase["th"]
            digest = hashlib.sha256(f"{VOICE}:{text}".encode()).hexdigest()[:12]
            yield phrase_id, {"text": text, "file": f"{phrase_id}-{digest}.mp3"}


def synthesize(text, token, project):
    request = urllib.request.Request(
        ENDPOINT,
        data=json.dumps({
            "input": {"text": text},
            "voice": {"languageCode": "th-TH", "name": VOICE},
            "audioConfig": {"audioEncoding": "MP3"},
        }).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "x-goog-user-project": project,
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        audio = base64.b64decode(json.load(response)["audioContent"], validate=True)
    if not audio or (not audio.startswith(b"ID3") and audio[0] != 0xFF):
        raise ValueError("Google Cloud returned invalid MP3 data")
    return audio


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", help="Google Cloud project ID for Text-to-Speech")
    parser.add_argument("--dry-run", action="store_true", help="List expected usage without calling Google")
    args = parser.parse_args()
    if not args.dry_run and not args.project:
        parser.error("--project is required unless using --dry-run")

    catalog = dict(entries())
    folder = ROOT / "audio"
    missing = [entry for entry in catalog.values() if not (folder / entry["file"]).is_file()]
    print(f"{len(catalog)} total clips, {len(missing)} to generate, {sum(len(entry['text']) for entry in missing)} input characters")
    if args.dry_run:
        return
    if missing:
        token = subprocess.check_output(
            ["gcloud", "auth", "application-default", "print-access-token"], text=True
        ).strip()
        for entry in missing:
            try:
                clip = synthesize(entry["text"], token, args.project)
            except urllib.error.HTTPError as error:
                raise SystemExit(f"Google Cloud Text-to-Speech returned HTTP {error.code}. Check the project, API, billing, and account permissions.") from None
            path = folder / entry["file"]
            temp = path.with_suffix(".tmp")
            temp.write_bytes(clip)
            temp.replace(path)
    output = folder / "catalog.js"
    temp = output.with_suffix(".tmp")
    temp.write_text("window.THAI_AUDIO = " + json.dumps(catalog, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    temp.replace(output)


if __name__ == "__main__":
    main()
