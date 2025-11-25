# Infrastructure


## Setup

See [Azure docs](https://learn.microsoft.com/en-us/azure/container-apps/tutorial-deploy-from-code?tabs=python).

Set environment variables

```.env
AZ_LOCATION="westeurope"
AZ_RESOURCE_GROUP="kisee-sm"
AZ_IDENTITY_NAME="${AZ_RESOURCE_GROUP}-identity"
AZ_ENVIRONMENT="${AZ_RESOURCE_GROUP}-env-dev"
AZ_REGISTRY_NAME="kiseesm1d45d965"
AZ_CONTAINER_API_APP_NAME="${AZ_RESOURCE_GROUP}-apiv2-dev"
AZ_CONTAINER_UI_APP_NAME="${AZ_RESOURCE_GROUP}-uiv2-dev"
AZ_CONTAINER_AGENT_APP_NAME="${AZ_RESOURCE_GROUP}-agentv2-dev"
```

and make sure to sign in to Azure

```shell
az login
```


### General resources

We expect a resource group already exists under the given name `$AZ_RESOURCE_GROUP`.

1. Create a user-assigned managed identity and get its ID with the following commands.

First, create the managed identity.

```shell
az identity create \
    --name $AZ_IDENTITY_NAME \
    --resource-group $AZ_RESOURCE_GROUP
```

Now set the identity identifier into a variable for later use.

```shell
AZ_IDENTITY_ID=$(az identity show \
    --name $AZ_IDENTITY_NAME \
    --resource-group $AZ_RESOURCE_GROUP \
    --query id \
    --output tsv)
```

2. Create an Azure Container Registry (ACR) instance in your resource group. The registry stores your container image.

```shell
az acr create \
    --resource-group $AZ_RESOURCE_GROUP \
    --name $AZ_REGISTRY_NAME \
    --sku Basic
```

3. Assign your user-assigned managed identity to your container registry instance with the following command.

```shell
az acr identity assign \
    --identities $AZ_IDENTITY_ID \
    --name $AZ_REGISTRY_NAME \
    --resource-group $AZ_RESOURCE_GROUP
```


### Development resources

Create a Container Apps environment to host your app using the following command.

```shell
az containerapp env create \
    --name $AZ_ENVIRONMENT \
    --resource-group $AZ_RESOURCE_GROUP \
    --location $AZ_LOCATION
```



#### API container

1. Build and push your **API container image** to your container registry instance with the following command.

```shell
az acr build\
    -t $AZ_REGISTRY_NAME".azurecr.io/"$AZ_CONTAINER_API_APP_NAME":helloworld"\
    -r $AZ_REGISTRY_NAME\
    ./backend
```

The image is annotated with a `helloworld` tag.

2. Securely read the COSMOS URI into a variable.

```shell
read -s cosmos_uri
```

3. Create your container app with the following command.

```shell
az containerapp create\
    --name $AZ_CONTAINER_API_APP_NAME\
    --resource-group $AZ_RESOURCE_GROUP\
    --environment $AZ_ENVIRONMENT\
    --image $AZ_REGISTRY_NAME".azurecr.io/"$AZ_CONTAINER_API_APP_NAME":helloworld"\
    --target-port 8000\
    --ingress external\
    --user-assigned $AZ_IDENTITY_ID\
    --registry-identity $AZ_IDENTITY_ID\
    --registry-server $AZ_REGISTRY_NAME.azurecr.io\
    --secrets kisee-sm-secret-cosmos-uri=$cosmos_uri\
    --env-vars PYTHON_ENV="development" MONGODB_CONNECTION_STRING="secretref:kisee-sm-secret-cosmos-uri"\
    --query properties.configuration.ingress.fqdn
```

This creates an API container from the previously build image and adds necessary environment variables and secrets.

4. Update the `frontend/.env.dev` file with the FQDN from the previous command.



#### UI container

Also see these [Azure docs on Next.js apps](https://learn.microsoft.com/en-us/azure/static-web-apps/deploy-nextjs-hybrid).

0. Prepare the `frontend/.env` file.
For development builds we use `frontend/.env.dev` which uses the API URL from the previously deployed API container.

```shell
cp frontend/.env frontend.env.bkp
cp frontend/.env.dev frontend/.env
```

1. Build and push your **UI container image** to your container registry instance with the following command.

```shell
az acr build \
    -t $AZ_REGISTRY_NAME".azurecr.io/"$AZ_CONTAINER_UI_APP_NAME":helloworld" \
    -r $AZ_REGISTRY_NAME \
    ./frontend
```

2. Securely read the LIVEKIT credentials into variables.

```shell
read -s livekit_key
read -s livekit_secret
read -s heygen_key
```

3. Create your container app with the following command.

```shell
az containerapp create \
    --name $AZ_CONTAINER_UI_APP_NAME \
    --resource-group $AZ_RESOURCE_GROUP \
    --environment $AZ_ENVIRONMENT \
    --image $AZ_REGISTRY_NAME".azurecr.io/"$AZ_CONTAINER_UI_APP_NAME":helloworld" \
    --target-port 3000 \
    --ingress external \
    --user-assigned $AZ_IDENTITY_ID \
    --registry-identity $AZ_IDENTITY_ID \
    --registry-server $AZ_REGISTRY_NAME.azurecr.io \
    --secrets kisee-sm-secret-livekit-api-key=$livekit_key kisee-sm-secret-livekit-api-secret=$livekit_secret kisee-sm-secret-heygen-api-key=$heygen_key \
    --env-vars LIVEKIT_URL="wss://kisee-pqr2w30e.livekit.cloud" LIVEKIT_API_KEY="secretref:kisee-sm-secret-livekit-api-key" LIVEKIT_API_SECRET="secretref:kisee-sm-secret-livekit-api-secret" HEYGEN_API_KEY="secretref:kisee-sm-secret-heygen-api-key" \
    --query properties.configuration.ingress.fqdn
```

This creates an UI container from the previously build image and adds necessary environment variables and secrets.

**NOTE:** Update the environment variables with your values. ⚠️

4. Now update the API deployment with the URL of the UI service to prevent CORS issues.

```shell
az containerapp update \
    --name $AZ_CONTAINER_API_APP_NAME \
    --resource-group $AZ_RESOURCE_GROUP \
    --set-env-vars ALLOWED_ORIGINS="https://<fqdn_from_previous_command>"
```


#### Agent container

1. Build and push your **Agent container image** to your container registry instance with the following command.

```shell
az acr build \
    -t $AZ_REGISTRY_NAME".azurecr.io/"$AZ_CONTAINER_AGENT_APP_NAME":helloworld" \
    -r $AZ_REGISTRY_NAME \
    ./agent
```

The image is annotated with a `helloworld` tag.

2. Securely read the OpenAI api key

```shell
read -s openai_key
```

and provide these environment variables (double check with `agent/.env.example`)

```.env
AZURE_OPENAI_DEPLOYMENT="gpt-4o-realtime-preview"
AZURE_OPENAI_ENDPOINT="wss://kisee-sm-ai-foundry.cognitiveservices.azure.com/openai/realtime"
OPENAI_API_VERSION="2024-10-01-preview"
```

3. Create your container app with the following command.

```shell
az containerapp create \
    --name $AZ_CONTAINER_AGENT_APP_NAME \
    --resource-group $AZ_RESOURCE_GROUP \
    --environment $AZ_ENVIRONMENT \
    --image $AZ_REGISTRY_NAME".azurecr.io/"$AZ_CONTAINER_AGENT_APP_NAME":helloworld" \
    --user-assigned $AZ_IDENTITY_ID \
    --registry-identity $AZ_IDENTITY_ID \
    --registry-server $AZ_REGISTRY_NAME.azurecr.io \
    --secrets kisee-sm-secret-livekit-api-key=$livekit_key kisee-sm-secret-livekit-api-secret=$livekit_secret kisee-sm-secret-openai-api-key=$openai_key kisee-sm-secret-cosmos-uri=$cosmos_uri \
    --env-vars AZURE_OPENAI_DEYPLOYMENT=$AZURE_OPENAI_DEPLOYMENT AZURE_OPENAI_ENDPOINT=$AZURE_OPENAI_ENDPOINT OPENAI_API_VERSION=$OPENAI_API_VERSION AZURE_OPENAI_API_KEY="secretref:kisee-sm-secret-openai-api-key" MONGODB_CONNECTION_STRING="secretref:kisee-sm-secret-cosmos-uri" LIVEKIT_URL="wss://kisee-pqr2w30e.livekit.cloud" LIVEKIT_API_KEY="secretref:kisee-sm-secret-livekit-api-key" LIVEKIT_API_SECRET="secretref:kisee-sm-secret-livekit-api-secret" PYTHON_ENV="development"
```

This creates an Agent container from the previously build image and adds necessary environment variables and secrets.

**NOTE:** Update the environment variables with your values. ⚠️


## Update


### API

1. Build and push your **API container image** to your container registry instance with the following command.

```shell
az acr build \
    -t $AZ_REGISTRY_NAME".azurecr.io/"$AZ_CONTAINER_API_APP_NAME":helloworld123" \
    -r $AZ_REGISTRY_NAME \
    ./backend
```

2. Create a new revision from the new image

```shell
az containerapp update \
    --name $AZ_CONTAINER_API_APP_NAME \
    --resource-group $AZ_RESOURCE_GROUP \
    --image $AZ_REGISTRY_NAME".azurecr.io/"$AZ_CONTAINER_API_APP_NAME":helloworld123"
```


### UI


NOTE: remember to init the `frontend/.env` file correctly.

```shell
cp frontend/.env.staging frontend/.env
```

1. Build and push your **UI container image** to your container registry instance with the following command.

```shell
az acr build \
    -t $AZ_REGISTRY_NAME".azurecr.io/"$AZ_CONTAINER_UI_APP_NAME":helloworld123" \
    -r $AZ_REGISTRY_NAME \
    ./frontend
```

2. Create a new revision from the new image

```shell
az containerapp update \
    --name $AZ_CONTAINER_UI_APP_NAME \
    --resource-group $AZ_RESOURCE_GROUP \
    --image $AZ_REGISTRY_NAME".azurecr.io/"$AZ_CONTAINER_UI_APP_NAME":helloworld123"
```


### Agent

1. Build and push your **Agent container image** to your container registry instance with the following command.

```shell
az acr build \
    -t $AZ_REGISTRY_NAME".azurecr.io/"$AZ_CONTAINER_AGENT_APP_NAME":helloworld123" \
    -r $AZ_REGISTRY_NAME \
    ./agent
```

2. Create a new revision from the new image

```shell
az containerapp update \
    --name $AZ_CONTAINER_AGENT_APP_NAME \
    --resource-group $AZ_RESOURCE_GROUP \
    --image $AZ_REGISTRY_NAME".azurecr.io/"$AZ_CONTAINER_AGENT_APP_NAME":helloworld123"
```

## Database Backup

You can use `mongoexport` to export the agent configurations, e.g. to CSV:

```shell
mongoexport\
  --db=voice_assistant_staging\
  --collection=agents\
  --type=csv\
  --out=`date +%Y%m%d%H%M%S`agents.csv\
  --fields=_id,order,chapter_id,id,agent_instructions,user_instruction,user_instruction_type,end_requirement,event_type,event_input,updated_at,created_at\
  <MONGO_URI>
```

Use `mongodump` to backup the agent configurations:

```shell
mongodump \
  -d=voice_assistant_staging \
  -c=agents \
  <MONGO_URI>
```

And then `mongoimport` to import the backup, e.g. into a local database:

```shell
mongorestore \
  -d voice_assistant_local \
  mongodb://localhost:27017 \
  dump/voice_assistant_staging/agents.bson
```
