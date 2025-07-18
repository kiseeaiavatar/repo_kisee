# LiveKit Voice Agent

This is the voice agent component of the LiveKit Kisee system. It handles the conversation flow and interacts with users through voice.

## Prerequisites

- Python 3.8 or higher
- Azure Cognitive Services credentials
- LiveKit server credentials

## Setup

1. Create and activate a virtual environment:

```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment variables:
   Create a `.env` file in the agent directory with:

```
AZURE_API_KEY=your_azure_api_key
AZURE_OPENAI_REGION=your_azure_region
AZURE_OPENAI_ENDPOINT=your_azure_endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
AZURE_STT_API_KEY=your_stt_api_key
AZURE_STT_REGION=your_stt_region
AZURE_TTS_API_KEY=your_tts_api_key
AZURE_TTS_REGION=your_tts_region
AZURE_OPENAI_API_VERSION=your_api_version
AZURE_OPENAI_TTS_API_KEY=your_tts_api_key
AZURE_OPENAI_TTS_MODEL=your_tts_model
AZURE_OPENAI_STT_API_KEY=your_stt_api_key
AZURE_OPENAI_STT_MODEL=your_stt_model
PYTHON_ENV=development
```

We add `PYTHON_ENV` as a suffix to the MongoDB database name.
This allows us to use the same MongoDB connection across development, staging and production deployments while still
keeping data seperate.
Additionally, the agent name is suffixed with the `PYTHON_ENV` value.
This prevents that development agents are added to staging rooms.

## Usage

1. Make sure you're in the agent directory:

```bash
cd agent
```

2. Run the agent:

```bash
python azure_agent.py dev
```

The agent will connect to the LiveKit server and start listening for incoming calls.

## Features

- Voice-based conversation with users
- Dynamic state management for conversation flow
- Integration with Azure Cognitive Services for:
  - Speech-to-Text (STT)
  - Text-to-Speech (TTS)
  - OpenAI for conversation handling
- Support for rating and swipe events
- MongoDB integration for agent configuration

## Code Structure and Functionality

### Main Components

1. **AzureAgent Class**

   - Core class that handles the voice agent functionality
   - Manages the connection to LiveKit server
   - Handles incoming and outgoing audio streams
   - Coordinates between STT, TTS, and conversation components

2. **State Management**

   - Uses a state machine pattern to manage conversation flow
   - Each state represents a different phase of the conversation
   - States are configured through MongoDB
   - Transitions between states based on user responses and events

3. **Audio Processing**

   - **Speech-to-Text (STT)**

     - Uses Azure's Speech Service to convert user's voice to text
     - Handles real-time audio streaming
     - Processes audio in chunks for better performance

   - **Text-to-Speech (TTS)**
     - Converts agent's responses to natural-sounding speech
     - Uses Azure's Neural TTS for high-quality voice synthesis
     - Supports different voice models and languages

4. **Event System**

   - **Rating Events**

     - Allows users to rate items on a scale
     - Configurable rating range and items
     - Stores ratings in user's profile

   - **Swipe Events**
     - Implements a swipe interface for binary choices
     - Supports like/dislike functionality
     - Configurable items and responses

5. **Database Integration**
   - Uses MongoDB to store and retrieve agent configurations
   - Each agent state is stored as a document
   - Supports dynamic updates to conversation flow
   - Maintains user preferences and conversation history

### Key Workflows

1. **Call Initialization**

   ```python
   # When a new call starts:
   1. Connect to LiveKit server
   2. Initialize audio streams
   3. Load initial state from MongoDB
   4. Start STT and TTS services
   ```

2. **Conversation Flow**

   ```python
   # For each user interaction:
   1. Receive audio from user
   2. Convert to text using STT
   3. Process text with current state logic
   4. Generate response
   5. Convert response to speech
   6. Update state if needed
   ```

3. **Event Handling**

   ```python
   # For rating events:
   1. Present items to user
   2. Collect rating for each item
   3. Store ratings in user profile
   4. Transition to next state when complete

   # For swipe events:
   1. Present items to user
   2. Process swipe gestures
   3. Store preferences
   4. Move to next item or state
   ```

### Error Handling

- Graceful handling of audio stream interruptions
- Automatic reconnection to LiveKit server
- Fallback responses for unclear user input
- Retry mechanisms for Azure service calls
- Logging of errors and important events

## Troubleshooting

1. If the agent fails to start:

   - Ensure you're in the agent directory
   - Verify all environment variables are set correctly
   - Check if the virtual environment is activated
   - Verify all dependencies are installed

2. If voice recognition is not working:

   - Check Azure STT credentials
   - Verify microphone access
   - Check network connectivity to Azure services

3. If voice synthesis is not working:
   - Check Azure TTS credentials
   - Verify speaker/audio output
   - Check network connectivity to Azure services

## Project Structure

```
agent/
├── azure_agent.py      # Main agent implementation
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
