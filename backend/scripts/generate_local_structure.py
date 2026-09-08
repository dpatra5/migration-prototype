from pathlib import Path
import json
import zipfile

STRUCT = {
    'StudyX': {'US': ['Site1', 'Site2'], 'CA': ['SiteA']},
    'StudyY': {'UK': ['Site1']}
}

ROOT = Path.cwd()

SRC = ROOT / 'local_mbox'
DST = ROOT / 'local_vtmf'

SRC.mkdir(parents=True, exist_ok=True)
DST.mkdir(parents=True, exist_ok=True)

for study, countries in STRUCT.items():
    for country, sites in countries.items():
        for site in sites:
            sdir = SRC / study / country / site
            ddir = DST / study / country / site
            sdir.mkdir(parents=True, exist_ok=True)
            ddir.mkdir(parents=True, exist_ok=True)
            # write two json docs
            for i in range(1,3):
                p = sdir / f'doc_{i}.json'
                payload = {'source_id': f'{study}-{country}-{site}-doc{i}', 'content': f'sample {i}'}
                p.write_text(json.dumps(payload), encoding='utf-8')
            # write a zip bundle
            zp = sdir / 'bundle.zip'
            with zipfile.ZipFile(zp, 'w') as zf:
                zf.writestr('note1.txt', 'note 1')
                zf.writestr('note2.txt', 'note 2')

print('Generated local_mbox and local_vtmf under', ROOT)
