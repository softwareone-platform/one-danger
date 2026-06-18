# Entry point. Automatically includes every module in make/.
# Run `make help` to list available commands.
#
# This repository is a Node.js project, so the targets are thin wrappers around
# the npm scripts defined in package.json.

.DEFAULT_GOAL := help

include $(wildcard make/*.mk)
