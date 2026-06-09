set shell := ["cmd.exe", "/d", "/c"]

skill_command := "%USERPROFILE%\\.claude\\skills\\obsidian-plugin-dev\\scripts\\obsidian-plugin-dev.cmd"

default:
    @echo Run: just setup, just check, just deploy, or just dev

setup:
    call %APPDATA%\npm\pnpm.cmd install

build:
    call %APPDATA%\npm\pnpm.cmd run build

check:
    call %APPDATA%\npm\pnpm.cmd run build

deploy:
    call {{skill_command}} build-sync --repo {{justfile_directory()}}

dev:
    call {{skill_command}} watch --repo {{justfile_directory()}}
