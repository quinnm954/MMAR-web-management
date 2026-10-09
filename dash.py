import asyncio, json, os
from playwright.async_api import async_playwright
async def main():
    m=json.load(open(os.path.expanduser("~/.cache/lovable-auth/session.json")))
    async with async_playwright() as p:
        b=await p.chromium.launch(headless=True)
        for w,h,n in [(1280,1800,"d"),(390,1800,"m")]:
            c=await b.new_context(viewport={"width":w,"height":h}); pg=await c.new_page()
            pg.on("pageerror", lambda e: print("ERR", e))
            await pg.goto("http://localhost:8080")
            await pg.evaluate(f"localStorage.setItem({json.dumps(m['storage_key'])}, {json.dumps(json.dumps(m['session']))})")
            await pg.goto("http://localhost:8080/admin?tab=dashboard"); await pg.wait_for_timeout(6000)
            await pg.screenshot(path=f"/tmp/browser/inv/dash_{n}.png")
        await b.close()
asyncio.run(main())
