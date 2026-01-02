# OpenAI Agent SDK

A Node.js project demonstrating OpenAI Agents with custom tools including weather reporting and email sending capabilities.

## Features

- **Hello Agent**: A simple agent that greets users
- **Weather Agent**: An agent with custom tools that can:
  - Get weather information for any city
  - Send emails via Resend API

## Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn
- OpenAI API key
- Resend API key (optional, required only for email functionality)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd openai-agent-sdk
```

2. Install dependencies:
```bash
npm install
```

## Environment Setup

1. Create a `.env` file in the root directory:
```bash
touch .env
```

2. Add your environment variables to the `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=your_verified_email@domain.com
```

**Note**: 
- `OPENAI_API_KEY` is required for the agents to work
- `RESEND_API_KEY` is required only if you want to use the email sending functionality
- `FROM_EMAIL` is optional (defaults to `onboarding@resend.dev` if not provided)

## How to Run

### Run the Hello Agent (index.js)

```bash
npm run dev
```

This will run the simple hello agent that greets users. The `--watch` flag enables automatic reloading when files change.

### Run the Weather Agent (agent_tools.js)

To run the weather agent with tools:

```bash
node agent_tools.js
```

The agent will execute the default query: "What is the weather in Asansol and send an email to sayan@codingsphere.co with the weather report."

To run with a custom query, modify the query in the `main()` function call at the bottom of `agent_tools.js`.

## Project Structure

```
openai-agent-sdk/
├── index.js          # Simple hello agent example
├── agent_tools.js    # Weather agent with custom tools (weather & email)
├── package.json      # Project dependencies and scripts
├── .env              # Environment variables (not tracked in git)
└── README.md         # This file
```

## Tools

### Weather Tool
- Gets weather information for any city using wttr.in
- Parameters: `city` (string)

### Email Tool
- Sends emails using the Resend API
- Parameters: `to_email` (email), `subject` (string), `body` (string)
- Requires RESEND_API_KEY in environment variables

## License

ISC

