#!/bin/bash
# Двойной клик на Mac: переписывает assets/manifest.json по картинкам, которые лежат в папке assets.
cd "$(dirname "$0")/.." || exit 1
python3 - <<'PY'
import json,os
fs=sorted(os.path.join(r,f).replace('\\','/') for r,_,n in os.walk('assets') for f in n if f.lower().endswith(('.png','.webp','.jpg','.jpeg')))
json.dump({'v':1,'note':'Список картинок, которые реально лежат в assets/. Игра запрашивает только их. См. ASSETS.md','files':fs},open('assets/manifest.json','w'),ensure_ascii=False,indent=1)
print('Готово, картинок:',len(fs))
PY
read -n 1 -s -r -p "Нажми любую клавишу..."
