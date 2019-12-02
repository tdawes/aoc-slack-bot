SHELL := bash -e -u -o pipefail

GOOGLE_CLOUD_PROJECT ?= $(shell gcloud config get-value project)
export GOOGLE_CLOUD_PROJECT
$(info GOOGLE_CLOUD_PROJECT = $(GOOGLE_CLOUD_PROJECT))

OS := $(shell uname -s)
ifeq ($(OS),Darwin)
XARGS := xargs
else
XARGS := xargs --no-run-if-empty
endif

ROOT := $(realpath .)
FIREBASE := $(ROOT)/node_modules/.bin/firebase
FUNCTIONS_CONFIG_FILE := '$(ROOT)/config/functions.json'

.PHONY: all
all: firebase

.PHONY: firebase
firebase: connect config
	$(FIREBASE) deploy

.PHONY: config
config: connect
	@ echo ''
	@ echo 'Setting configuration...'
	@ < '$(FUNCTIONS_CONFIG_FILE)' \
		jq --raw-output 'paths(scalars) as $$path | ($$path | join(".")) + "=" + (getpath($$path) | tojson)' \
		| $(XARGS) $(FIREBASE) functions:config:set
	@ jq --null-input --raw-output --argjson expected "$$(< '$(FUNCTIONS_CONFIG_FILE)')" --argjson actual "$$($(FIREBASE) functions:config:get)" \
		'[$$actual | paths(scalars)] as $$actual_paths | [$$expected | paths(scalars)] as $$expected_paths | $$actual_paths - $$expected_paths | .[] | join(".")' \
		| $(XARGS) $(FIREBASE) functions:config:unset
	@ echo ''
	@ echo 'Configuration:'
	@ $(FIREBASE) functions:config:get

.PHONY: connect
connect:
	$(FIREBASE) use '$(GOOGLE_CLOUD_PROJECT)'
