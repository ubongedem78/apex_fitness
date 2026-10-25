#!/bin/sh
set -e

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
chmod +x .githooks/pre-push

echo "Git hooks installed (.githooks/)"
echo "  pre-commit: lints client before every commit"
echo "  pre-push:   runs server tests before every push"
