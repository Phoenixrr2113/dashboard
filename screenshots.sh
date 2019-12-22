if [ ! -d node_modules/puppeteer ]; then
  npm install puppeteer --no-save
fi

for device in "Desktop" "iPad Pro" "iPad Mini" "Pixel 2 XL" "iPhone SE"; do
  echo "device -> $device"
  for file in `find . -type f -name *.test.js | xargs grep -l req.screenshots`; do
    echo "    file -> $file";
    NODE_ENV=testing \
    FAST_START=true \
    DASHBOARD_SERVER="http://localhost:9007" \
    DOMAIN="localhost" \
    PORT=9007 \
    STORAGE_PATH=/tmp/test-data \
    ENCRYPTION_SECRET=12345678901234567890123456789012 \
    ENCRYPTION_SECRET_IV=1234123412341234 \
    GENERATE_SITEMAP_TXT=false \
    GENERATE_API_TXT=false \
    GENERATE_SCREENSHOTS=true \
    DEVICE_NAME="$device" \
    mocha "$file" -grep returns --timeout 240000;
  done
done
