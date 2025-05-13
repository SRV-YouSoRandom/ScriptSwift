# ScriptSwift: AI-Powered Sales Script Generator

ScriptSwift is a Next.js application that leverages AI to help sales professionals generate dynamic and adaptive cold call scripts. Users can input information about their business and target customer (either via a website URL for AI analysis or a text summary), and the application will generate an initial script turn. Subsequent turns are generated based on the prospect's selected responses, creating a conversational flow.

## Features

-   **AI-Powered Script Generation:** Uses Genkit and Google AI models to create relevant and engaging sales scripts.
-   **Customer Analysis:** Can analyze a customer's website (via URL) to extract key information and tailor the script. Alternatively, users can provide a text summary.
-   **Dynamic Script Flow:** The script adapts based on selected prospect responses, offering different paths for positive, neutral, or negative interactions.
-   **User-Friendly Interface:** Simple form for input and clear display of the generated script.
-   **Copy & Download:** Easily copy the generated conversation or download it as a text file.
-   **Built with Next.js & ShadCN UI:** Modern, responsive, and performant web application.

## Prerequisites

Before you begin, ensure you have the following installed:

-   [Node.js](https://nodejs.org/) (version 18.x or later recommended)
-   [npm](https://www.npmjs.com/) (comes with Node.js) or [yarn](https://yarnpkg.com/)
-   [Genkit CLI](https://firebase.google.com/docs/genkit/get-started#install-cli):
    ```bash
    npm install -g genkit-cli
    ```

## Getting Started

Follow these steps to set up and run the project locally:

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Install Dependencies

Install the project dependencies using npm or yarn:

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

The application uses Google AI (Gemini models) through Genkit. You'll need a Google AI API key.

1.  Create a file named `.env` in the root of the project.
2.  Add your Google AI API key to this file:

    ```env
    GOOGLE_API_KEY=YOUR_GOOGLE_AI_API_KEY
    ```

    You can obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 4. Run Genkit Development Server

Genkit flows (the AI logic) need to be running. Open a new terminal window/tab and run:

```bash
npm run genkit:watch
# or
yarn genkit:watch
```

This command starts the Genkit development server and watches for changes in your AI flow files (located in `src/ai/flows/`). You should see output indicating that Genkit has started and your flows are available (e.g., `diagnosePlantFlow`, `generateColdCallScriptFlow`, etc.). By default, it runs on port 3400 and the Genkit Developer UI is available at `http://localhost:4000/`.

### 5. Run the Next.js Development Server

In another terminal window/tab, start the Next.js development server:

```bash
npm run dev
# or
yarn dev
```

This will typically start the application on `http://localhost:9002` (as configured in `package.json`). Open this URL in your browser.

## How to Use ScriptSwift

1.  **Navigate to the Application:** Open your browser and go to `http://localhost:9002` (or the port your Next.js server is running on).
2.  **Fill in Business Information:**
    *   **Your Name:** The name of the salesperson.
    *   **Business Name:** Your company's name.
    *   **Product/Service Description:** A clear description of what you're selling.
    *   **Sales Goals:** The objective of the cold call (e.g., schedule a demo, qualify lead).
3.  **Provide Customer Information:**
    You have two options:
    *   **Website URL:** Enter the URL of the customer's website. The AI will attempt to analyze it to gather context.
    *   **Text Summary:** Provide a manual summary of the customer, their business, needs, or any relevant information. If you know the customer's company name, try to include it, for example: "Company Name: XYZ Corp. They specialize in..."
4.  **Start Script:** Click the "Start Script" button.
    *   The application will process your input. If you provided a URL, it will first analyze the website, then generate the initial turn of the sales script.
5.  **Interact with the Script:**
    *   The first part of the script (salesperson's utterance) will be displayed.
    *   Below it, you'll see several buttons representing potential prospect responses (e.g., "Tell me more", "I'm busy").
    *   Click the button that best matches how you anticipate the prospect might respond.
6.  **Continue the Conversation:**
    *   Based on your selection, the AI will generate the next part of the salesperson's script.
    *   This process continues, allowing you to build a multi-turn conversation.
7.  **Manage the Script:**
    *   **Clear & New Script:** If you want to start over, click this button. It will clear the current script and show the input form again.
    *   **Copy Conversation:** Copies the entire conversation history to your clipboard.
    *   **Download Conversation:** Downloads the conversation as a `.txt` file.

## Project Structure

```
.
├── src/
│   ├── ai/                  # Genkit AI flows and configuration
│   │   ├── flows/           # Individual AI flow definitions
│   │   │   ├── analyze-customer-website.ts
│   │   │   ├── generate-cold-call-script.ts
│   │   │   └── generate-next-script-turn.ts
│   │   ├── schemas/         # Zod schemas for AI flow inputs/outputs
│   │   │   └── script-schemas.ts
│   │   ├── dev.ts           # Genkit development server entry point
│   │   └── genkit.ts        # Genkit global configuration
│   ├── app/                 # Next.js App Router files
│   │   ├── globals.css      # Global styles and ShadCN theme
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main page component for the application
│   ├── components/          # React components
│   │   ├── icons/           # Custom icon components (e.g., Logo)
│   │   ├── ui/              # ShadCN UI components
│   │   ├── script-display.tsx
│   │   └── script-swift-form.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/                 # Utility functions, actions, schemas
│   │   ├── actions.ts       # Server actions for form handling & AI calls
│   │   ├── schemas.ts       # Zod schemas for form validation
│   │   └── utils.ts         # General utility functions (e.g., cn for Tailwind)
│   └── services/            # External service integrations
│       └── web-scrape.ts    # (Placeholder) Web scraping service
├── public/                  # Static assets
├── .env.example             # Example environment file
├── components.json          # ShadCN UI configuration
├── next.config.ts           # Next.js configuration
├── package.json
├── README.md                # This file
└── tsconfig.json            # TypeScript configuration
```

## Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

This will create an optimized build in the `.next` folder. You can then start the production server:

```bash
npm run start
# or
yarn start
```

Ensure your Genkit flows are also deployed and accessible by your production Next.js application. The Genkit documentation provides guidance on deploying flows to various environments (e.g., Google Cloud Functions).

## Key Technologies

-   [Next.js](https://nextjs.org/) (App Router)
-   [React](https://reactjs.org/)
-   [TypeScript](https://www.typescriptlang.org/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [ShadCN UI](https://ui.shadcn.com/)
-   [Genkit](https://firebase.google.com/docs/genkit) (with Google AI plugin)
-   [Zod](https://zod.dev/) (for schema validation)
-   [React Hook Form](https://react-hook-form.com/)

## Troubleshooting

-   **Module not found / Genkit errors:** Ensure the Genkit development server (`npm run genkit:watch`) is running in a separate terminal.
-   **API Key Issues:** Double-check that your `GOOGLE_API_KEY` in the `.env` file is correct and has the necessary permissions.
-   **Hydration Errors:** These can sometimes occur if server-rendered content doesn't match client-rendered content. The application attempts to mitigate these, but if you encounter persistent issues, check for browser extensions or dynamic client-side operations that might interfere.
-   **AI Response Quality:** The quality of AI-generated content can vary. The prompts in `src/ai/flows/` are designed to guide the AI, but may require further tuning for specific needs. The model `gemini-2.0-flash` is used for speed and cost-effectiveness; other models might provide different results.
```