#!/bin/bash

AGENT_FOLDER="./../agent/"
UI_FOLDER="./../frontend/"
API_FOLDER="./../backend/"

# Function to validate component
validate_component() {
  local component="$1"
  if [[ ! "$component" =~ ^(all|agent|api|ui)$ ]]; then
    echo "Error: Invalid component value. Valid options are 'all', 'agent', 'api', or 'ui'."
    exit 1
  fi
}

# Function to display usage/help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --env <environment>     Specify the environment (default: 'dev'). This defines"
    echo "                          whether .env.dev or .env.staging will be loaded. See"
    echo "                          README on .env details."
    echo "  --tag <tag>             Specify a tag (optional). Default is current git hash."
    echo "  --component <component> Specify the component to deploy (optional, valid: 'all',"
    echo "                          'agent', 'api', 'ui'). Default is 'all'."
    echo "  --help                  Show this message."
    echo ""
    echo "Example usage:"
    echo "  $0 --env staging --tag v1.0 --component backend"
    echo "  $0 --env production --tag latest"
    echo "  $0 --help"
}

az_acr_build() {
  local component="$1"
  local tag="$2"

  local name=""
  local folder=""
  case $component in
      agent)
          name="$AZ_CONTAINER_AGENT_APP_NAME"
          folder=$AGENT_FOLDER
          ;;
      api)
          name="$AZ_CONTAINER_API_APP_NAME"
          folder=$API_FOLDER
          ;;
      ui)
          name="$AZ_CONTAINER_UI_APP_NAME"
          folder=$UI_FOLDER
          ;;
      *)
          echo "Error: Invalid component value. Cannot build containter."
          return
          ;;
  esac

  local full_tag="$AZ_REGISTRY_NAME.azurecr.io/$name:$tag"

  echo ""
  echo "=== BUILDING: $component ==="

  az acr build\
     -t "$full_tag"\
     -r "$AZ_REGISTRY_NAME"\
     "$folder"
  local result=$?

  echo "=== BUILDING: $component DONE ==="

  return $result
}

az_app_update() {
    local component="$1"
    local tag="$2"

    local name=""
    case $component in
        agent)
            name="$AZ_CONTAINER_AGENT_APP_NAME"
            ;;
        api)
            name="$AZ_CONTAINER_API_APP_NAME"
            ;;
        ui)
            name="$AZ_CONTAINER_UI_APP_NAME"
            ;;
        *)
            echo "Error: Invalid component value. Cannot update app."
            return
            ;;
    esac

    local full_tag="$AZ_REGISTRY_NAME.azurecr.io/$name:$tag"

    echo ""
    echo "=== UPDATING: $component ==="

    az containerapp update\
       --name "$name"\
       --resource-group "$AZ_RESOURCE_GROUP"\
       --image "$full_tag"
    local result=$?

  echo "=== UPDATING: $component DONE ==="

  return $result
}

# Default values
ENV_FILE=".env.dev"
TAG=$(git rev-parse --short HEAD)
COMPONENT="all"

# Parse command-line arguments (named args)
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --env)
      ENV_FILE=".env.$2"
      shift 2
      ;;
    --tag)
      TAG="$2"
      shift 2
      ;;
    --component)
      COMPONENT="$2"
      validate_component "$COMPONENT"
      shift 2
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      echo "Error: Unknown option $1"
      exit 1
      ;;
  esac
done

# Check if the environment file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE does not exist."
  exit 1
fi

# Source the selected .env file
source "$ENV_FILE"

if [ "ui" == "$COMPONENT" ] || [ "all" == "$COMPONENT" ]; then

    ui_env_file_default="$UI_FOLDER.env"
    ui_env_file="$UI_FOLDER$ENV_FILE"
    if [ ! -f "$ui_env_file" ]; then
        echo "Error: $ui_env_file does not exist."
        exit 1
    fi

    echo ""
    echo "=== CONFIG: ui ==="

    # backup existing .env
    tmpfile=""
    if [ -f "$ui_env_file" ]; then
        tmpfile=$(mktemp --tmpdir="$UI_FOLDER" tmp.XXXXX)
        cp -v "$ui_env_file_default" "$tmpfile"
    fi

    # override default .env file
    cp -v "$ui_env_file" "$ui_env_file_default"
    echo "=== CONFIG: ui DONE ==="

    az_acr_build "ui" "$TAG"
    build_ok=$?

    # restore backup
    if [ -n "$tmpfile" ]; then
        mv -v "$tmpfile" "$ui_env_file_default"
    fi

    [ $build_ok -eq 0 ] && az_app_update "ui" "$TAG"
fi

if [ "api" == "$COMPONENT" ] || [ "all" == "$COMPONENT" ]; then
    az_acr_build "api" "$TAG"
    build_ok=$?
    [ $build_ok -eq 0 ] && az_app_update "api" "$TAG"
fi

if [ "agent" == "$COMPONENT" ] || [ "all" == "$COMPONENT" ]; then
  az_acr_build "agent" "$TAG"
  build_ok=$?
  [ $build_ok -eq 0 ] && az_app_update "agent" "$TAG"
fi
