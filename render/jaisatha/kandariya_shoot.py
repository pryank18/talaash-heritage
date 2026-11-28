import json
from playwright.sync_api import sync_playwright
import sys
VIEWS=[('hero','Exterior',[],900),('front','Entrance front',[],700),('section','Long section',[],900),('plan','Plan cut at 1.2 m',[],900),('hall','Inside: great hall',[],0),('side','Exterior',[],1600)]
CSS="""
.k-stage{position:fixed!important;left:0;top:0;width:1080px!important;height:1920px!important;z-index:99999;border-radius:0!important;border:0!important}
.k-stage>*:not(canvas){display:none!important}
#consent,.consent,[class*=consent],.assist-fab,[class*=khoji],.wa-fab,[class*=whatsapp]{display:none!important}
"""
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1080,'height':1920})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:8765/3d-kandariya-mahadeva.html'); pg.wait_for_timeout(4000)
    # labels off, scale figure on
    pg.locator('.k-root button',has_text='Labels').first.click()
    pg.add_style_tag(content=CSS); pg.evaluate("window.dispatchEvent(new Event('resize'))"); pg.wait_for_timeout(1500)
    for name,view,tog,zoom in VIEWS:
        pg.evaluate("""(v)=>{const bs=[...document.querySelectorAll('.k-root button')];bs.find(b=>b.textContent.trim()===v).click()}""",view)
        for t in tog: pg.evaluate("""(v)=>{const bs=[...document.querySelectorAll('.k-root button')];bs.find(b=>b.textContent.trim()===v).click()}""",t)
        pg.wait_for_timeout(2500)
        if zoom:
            pg.mouse.click(540,1700); pg.wait_for_timeout(300)
            for k in range(zoom//100): pg.mouse.wheel(0,100); pg.wait_for_timeout(40)
        pg.wait_for_timeout(2500)
        pg.screenshot(path=f'/tmp/claude-0/jt4/frames/{name}.png',clip={'x':0,'y':0,'width':1080,'height':1920},animations='allow')
        for t in tog: pg.evaluate("""(v)=>{const bs=[...document.querySelectorAll('.k-root button')];bs.find(b=>b.textContent.trim()===v).click()}""",t)
    print(errs[:5]); b.close()
