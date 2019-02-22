#!/bin/bash

set -e

rm -rf dist
yarn build
cd dist
sed -i 's/src="\//src=".\//g' index.html
git init
git checkout --orphan gh-pages
git add .
git commit -m 'publish'
git remote add origin git@github.com:meriadec/u2f-regression.git
git push -f origin gh-pages
