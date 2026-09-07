#!/bin/bash
# 一键部署到 GitHub Pages（走系统代理 127.0.0.1:10090）
set -e
PROXY="http://127.0.0.1:10090"
USER="weizx0220"
REPO="life-restart"
cd "$(dirname "$0")/.."

# 取 token（凭据管理器偶发延迟，重试几次）
TOKEN=""
for i in 1 2 3 4 5; do
  TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | timeout 15 git credential fill 2>/dev/null | grep '^password=' | cut -d= -f2-)
  [ ${#TOKEN} -gt 10 ] && break
  sleep 2
done
[ ${#TOKEN} -lt 10 ] && { echo "ERROR: 取不到 GitHub 凭据"; exit 1; }

AUTH="Authorization: Bearer $TOKEN"

# 建仓库（已存在则跳过）
R=$(curl -s --max-time 20 --proxy $PROXY -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"name\":\"$REPO\",\"private\":false}" https://api.github.com/user/repos | node test/parsejson.js)
echo "建仓库: $R"

# 本地 git 打包 _deploy 内容
rm -rf _deploy/.git
cd _deploy
git init -q -b main
git add -A
git -c user.name="$USER" -c user.email="$USER@users.noreply.github.com" commit -qm "deploy: 浮生若梦"
git remote add origin "https://github.com/$USER/$REPO.git" 2>/dev/null || git remote set-url origin "https://github.com/$USER/$REPO.git"
git -c http.proxy=$PROXY push -u origin main --force 2>&1 | tail -2
cd ..

# 启用 Pages（main 分支根目录）
P=$(curl -s --max-time 20 --proxy $PROXY -X POST -H "$AUTH" -H "Accept: application/vnd.github+json" \
  -d '{"source":{"branch":"main","path":"/"}}' "https://api.github.com/repos/$USER/$REPO/pages" | node test/parsejson.js)
echo "启用Pages: $P"
echo "站点地址: https://$USER.github.io/$REPO/"
