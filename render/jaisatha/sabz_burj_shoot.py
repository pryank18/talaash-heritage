import json, sys
from playwright.sync_api import sync_playwright
scenes = sys.argv[1:] or ['hero','aerial','section','tiles','police','asi','reveal','palette','plan']
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width':1080,'height':1920}, device_scale_factor=1)
    errs=[]; pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    labels={}
    for s in scenes:
        pg.goto(f'file:///tmp/claude-0/jt2/scene.html?s={s}'); pg.wait_for_function('window.DONE===true', timeout=60000)
        pg.locator('canvas').screenshot(path=f'frames/{s}.png'); labels[s]=pg.evaluate('window.LABELS')
    json.dump(labels, open('frames/labels.json','w'), indent=1)
    print('errors', errs); b.close()
