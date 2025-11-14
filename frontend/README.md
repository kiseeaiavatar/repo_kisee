# LiveKit Voice Agent Frontend

See [Backend](../backend/README.md) for details on prerequisites, setup and project structure.

## General

The frontend provides two main variants of user interaction:

- Chat: Users interact text-only with the agent
- Avatar: Users interact voice-only with the agent

You can access each variant based on path parameters:

- Chat: `http://localhost:3000/chat`
- Avatar: `http://localhost:3000/avatar`

### Intro

First, users will be guide through multiple introduction steps

- SubjectID: users enter a subject identifier which helps associating their personal preferences with other questionaire data collected during (offline) surveys
- Information: users get step-wise information on the product and the interview process
- Terms and Conditions: users have to access the Ts and Cs to proceed to the agent interface

### Chat

`http://localhost:3000/chat`

A basic chat interface is rendered which consists of

- a classic message area displaying the users' and agent's messages
- a text input allowing users to enter their message

### Avatar

`http://localhost:3000/avatar`

Renders a voice chat like interface displaying

- the interactive avatar video stream
- basic media controls (mic on/off)

For interactive avatar generation HeyGen is used.

### Events

Both, chat and avatar, variants react equally to LiveKit events which are in fact [RPC method calls](https://docs.livekit.io/home/client/data/rpc/).
Once the frontend receives an event it opens the widget area and displays the widget matching the event.

There are three widgets:

1. **Rating**: Users rate multiple items on a scale
2. **Swipe**: The swipe widget has two variants
   - Users like or dislike
   - Users rate one item on a scale (mix of swipe and rating event)
3. **Evaluation**: Users get a personalized evaluation of their preferences (through a 3rd party provider)

Once users finish the widget the user preferences are sent back to the agent (only for rating and swipe widgets).

## Setup

### Environment

Copy the `.env` into a `.env.local` file:

```
# LIVEKIT credentials
LIVEKIT_URL="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="..."
LIVEKIT_API_SECRET="..."

# MyCelia (evaluation provider) credentials
MYCELIA_API_KEY="..."
MYCELIA_URL="https://.../api"

# HeyGen credentials
HEYGEN_API_KEY="..."

APP_ENV="local" # must match PYTHON_ENV from agent

NEXT_PUBLIC_BACKEND_URL="http://127.0.0.1:8000"
NEXT_PUBLIC_HEYGEN_API_BASE_URL="https://api.heygen.com"
```

### Debug

Developers or testers can set a local storage variable to enable additional debugging messages and elements.

Open the developer tools in your browser and add the `kisee:debug` key. Ensure to set it's value to `true`.

This brings up a debug element in the sidebar that shows the current chapter title. And you should see additional debug
message in the console (especially when using the avatar variant).
