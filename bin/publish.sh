npm prepublish &&
cp -rf package.json dist/lib &&
cd dist/lib &&
npm publish &&
cd ../.. &&
rm dist/lib/package.json

