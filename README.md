# LiveKit Kisee

A conversational agent system built with LiveKit that guides users through a series of preference collection steps using a dynamic state machine approach.

## Architecture

The system uses a single `DynamicAgent` that manages different states of the conversation, each with its own specific purpose:

1. **Greeting**: Welcomes the user and collects their name
2. **Food Preferences**: Collects food preferences using a rating system
3. **Sport Preferences**: Collects sport preferences using a swipe interface
4. **Beverage Preferences**: Collects beverage preferences using a rating system
5. **Final**: Thanks the user and concludes the conversation

### Key Components

- **DynamicAgent**: A single agent class that handles all conversation states
- **UserData**: Stores user preferences and tracks conversation state
- **Agent Configuration**: JSON-based configuration for each state
- **Event System**: Supports rating and swipe events for preference collection

## Configuration

The system is configured through the mongoDB database, which defines:

- State transitions
- User instructions
- End requirements
- Event configurations (rating/swipe)
- Items to be rated/swiped

You can find the Database in voice_assistant/agents.

Example configuration:

```json
{
  "chapter_id": "food_preferences",
  "user_instruction": "Deine Aufgabe ist es die Nutzerin nach ihren Lieblingsspeisen zu fragen.",
  "end_requirement": "Wir wissen welches die Lieblingsspeisen der NutzerIn sind.",
  "event_type": "rating",
  "event_input": {
    "description": "Bitte bewerten Sie die folgenden Speisen:",
    "items": ["Pizza", "Sushi", "Burger", "Salad", "Pasta"]
  }
}
```

## State Management

The system uses a state machine approach where:

1. Each state has a specific purpose and set of instructions
2. States transition automatically when their end requirements are met
3. The agent updates its instructions based on the current state
4. User preferences are stored in a dictionary structure

## Event System

Two types of events are supported:

1. **Rating Events**: Users rate items on a scale
2. **Swipe Events**: Users swipe right (like) or left (dislike)

Events have a configurable timeout (default: 5 minutes) to allow users enough time to complete their preferences.

## Usage

1. Set up environment variables for Azure services

2. Start the backend:

```bash
cd backend
uvicorn main:app --reload
```

3. Start the frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

4. Run the agent:

```bash
cd agent
python azure_agent.py
```

The services will be available at:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Admin Dashboard: http://localhost:3000/admin

## Environment Variables

Required environment variables:

- `
