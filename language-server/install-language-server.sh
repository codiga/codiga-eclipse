#!/usr/bin/env bash

GITHUB_REPOSITORY_URL="https://github.com/codiga/vscode-plugin"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPOSITORY_DIR="${SCRIPT_DIR}"
CLONED_REPOSITORY_DIR="${REPOSITORY_DIR}/temp"
SERVER_SOURCES_DIRECTORY="${CLONED_REPOSITORY_DIR}/server/"

# -------- Clean up before updating -------- #

pushd "${REPOSITORY_DIR}" || exit

rm -rf out package-lock.json package.json update-info.log

popd || exit

# ------- Clone the vscode-plugin repository ------- #

pushd "${REPOSITORY_DIR}" || exit

echo 'Enter commit SHA, branch or tag (for example 2.1.0) to build'
read -rp 'SHA, branch or tag (default: main): ' ref

if [ "${ref}" = "" ]; then
    ref="main"
fi

echo "Cloning ${GITHUB_REPOSITORY_URL}"
git clone ${GITHUB_REPOSITORY_URL} --branch ${ref} --single-branch "${CLONED_REPOSITORY_DIR}" || echo "Repository is already cloned. Continuing..."
current_sha=$( git rev-parse HEAD )
printf "ref: %s\n%s\n" "$ref" "$current_sha" > update-info.log

popd || exit

# ------- Install dependencies ------- #

pushd "${CLONED_REPOSITORY_DIR}" || exit

echo 'Installing dependencies...'
npm install

popd || exit

# ------- Compile vscode-plugin sources ------- #

pushd "${SERVER_SOURCES_DIRECTORY}" || exit

echo 'Compiling vscode-plugin...'
npm run compile

popd || exit

## ------- Collect and clean up output files ------- #

pushd "${SERVER_SOURCES_DIRECTORY}" || exit

echo 'Copying and cleaning up files...'
find ./out -name "*.map" -delete
cp -r out node_modules package.json README.md "${REPOSITORY_DIR}"
rm -rf "${CLONED_REPOSITORY_DIR}"
