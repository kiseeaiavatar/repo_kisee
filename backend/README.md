# LiveKit Voice Agent Backend

This is the backend for the LiveKit Voice Agent, built with FastAPI and MongoDB.

## Prerequisites

- Python 3.8 or higher
- MongoDB
- Node.js and npm/pnpm (for frontend)

## Setup

### 1. MongoDB Setup

#### macOS

```bash
# Install MongoDB
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community
```

#### Linux

```bash
# Install MongoDB
sudo apt-get install mongodb

# Start MongoDB service
sudo systemctl start mongodb
```

### 2. Backend Setup

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
   Create a `.env` file in the backend directory with:

```
MONGODB_CONNECTION_STRING=mongodb://localhost:27017
```

4. Initialize the database with agent configurations:

```bash
# The admin dashboard will be used to configure agents
# Access it at http://localhost:3000/admin after starting the frontend
```

5. Start the backend server:

```bash
# Make sure you're in the backend directory
cd backend

# Start the server with hot reload
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

1. Navigate to the frontend directory:

```bash
cd ../frontend
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

The frontend will be available at `http://localhost:3000`

## Usage

### API Endpoints

The backend provides the following API endpoints:

- `GET /api/admin/agents` - Get all agents
- `POST /api/admin/agents` - Create a new agent
- `PUT /api/admin/agents/{chapter_id}` - Update an agent
- `DELETE /api/admin/agents/{chapter_id}` - Delete an agent
- `POST /api/admin/agents/reorder` - Reorder agents

### Admin Dashboard

Access the admin dashboard at `http://localhost:3000/admin` to:

- View all agents
- Add new agents
- Edit existing agents
- Delete agents
- Reorder agents using drag and drop
- Configure agent properties:
  - Chapter ID
  - User Instruction
  - End Requirement
  - Next Agent
  - Event Type (swipe or rating)
  - Event Description and Items

### API Documentation

Interactive API documentation is available at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Development

### Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── routes/             # API route handlers
│   └── admin.py        # Admin routes
├── models/             # Data models
│   └── agent.py        # Agent model
├── requirements.txt    # Python dependencies
└── README.md          # This file

agent/
├── azure_agent.py      # Azure agent implementation
└── requirements.txt    # Agent dependencies

frontend/
├── src/
│   └── components/
│       └── AdminDashboard.tsx  # Admin dashboard component
├── app/
│   └── admin/
│       └── page.tsx    # Admin page route
└── package.json       # Frontend dependencies
```

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
MONGODB_CONNECTION_STRING=mongodb://localhost:27017
PYTHON_ENV=development
```

The `MONGODB_CONNECTION_STRING` is used to connect to your MongoDB instance. If you're using MongoDB Atlas or a different MongoDB host, replace the connection string with your specific connection string.

We add `PYTHON_ENV` as a suffix to the MongoDB database name.
This allows us to use the same MongoDB connection across development, staging and production deployments while still
keeping data seperate.

## Troubleshooting

1. If MongoDB fails to start:

   - Check if MongoDB is installed correctly
   - Verify MongoDB service is running
   - Check MongoDB logs for errors

2. If backend fails to start:

   - Ensure you're in the backend directory
   - Ensure virtual environment is activated
   - Verify all dependencies are installed
   - Check if MongoDB is running
   - Verify port 8000 is available

3. If frontend fails to start:
   - Ensure all dependencies are installed
   - Verify port 3000 is available
   - Check if backend is running

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
