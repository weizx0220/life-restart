# 生成单文件版：把 css/js 全部内联进一个 html
# 用法：python test/build_single.py
import re, os, io

root = os.path.join(os.path.dirname(__file__), '..')
os.chdir(root)

with io.open('index.html', encoding='utf-8') as f:
    html = f.read()

# 内联 CSS
with io.open('css/style.css', encoding='utf-8') as f:
    css = f.read()
html = html.replace('<link rel="stylesheet" href="css/style.css">',
                    '<style>\n' + css.replace('url("../', 'url("') + '\n</style>')

# 内联 JS（按 script src 顺序）
def inline_js(m):
    src = m.group(1)
    with io.open(src, encoding='utf-8') as f:
        code = f.read()
    if '</script' in code:
        raise SystemExit('脚本含 </script>，不能内联: ' + src)
    return '<script>\n' + code + '\n</script>'

html, n = re.subn(r'<script src="([^"]+)"></script>', inline_js, html)
print('内联脚本数:', n)

out = '浮生若梦-单文件版.html'
with io.open(out, 'w', encoding='utf-8') as f:
    f.write(html)
print('生成:', out, f'{os.path.getsize(out)/1024:.0f}KB')
