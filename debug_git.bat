@echo off
git remote -v > git_debug.txt 2>&1
git branch >> git_debug.txt 2>&1
git status >> git_debug.txt 2>&1
git log -n 5 --oneline >> git_debug.txt 2>&1
echo DONE >> git_debug.txt
