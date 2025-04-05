# Story Crafter AI

A specialized chat application for creating and developing creative stories, fictional worlds, characters and narratives with the help of AI.

## Features

- **Chat-based Interface**: Interact conversationally with an AI to develop your stories
- **Session Management**: Each conversation is stored separately
- **Search Functionality**: Find conversations by title or content
- **Storytelling Focused Prompting**: The AI is instructed to help with worldbuilding, character creation, plot development, and scene descriptions

## Live Demo

The application is automatically deployed to GitHub Pages: [https://yourusername.github.io/story-crafter](https://yourusername.github.io/story-crafter)

## Getting Started

### Prerequisites

- Node.js and npm installed
- An OpenAI API key (get one at [https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys))

### Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd story-crafter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

5. Enter your OpenAI API key when prompted (this is stored locally in your browser)

### Building for Production

To build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be deployed.

## Deploying to GitHub Pages

This project is configured to automatically deploy to GitHub Pages when you push to the `main` branch. The GitHub Action workflow will:

1. Build the application
2. Deploy it to GitHub Pages

To set up GitHub Pages:

1. Go to your repository settings
2. Navigate to "Pages"
3. Select "GitHub Actions" as the source
4. The site will deploy automatically with each push to main

## How to Use

1. **Create a new conversation**: Click the "+" button in the sidebar
2. **Ask for writing help**: Request things like:
   - "Create a bustling marketplace in a port city"
   - "Design a complex villain with believable motivations"
   - "Write a description for an enchanted forest"
   - "Help me develop a plot twist for my story"

3. **Search conversations**: Use the search box at the top of the sidebar to find existing conversations

## Technology Stack

- React with TypeScript for type safety
- Vite for fast development and optimized builds
- Material-UI for the responsive interface
- OpenAI API for AI responses
- localStorage for conversation storage (browser-based)
- GitHub Actions for CI/CD

## Future Enhancements

- Export/import conversations
- Conversation organization with folders/tags
- Character profiles
- Plot outline tools
- World-building templates
- Genre-specific prompts

## License

MIT
