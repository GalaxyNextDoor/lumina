# LuminaLog

LuminaLog is a high-performance, user-friendly log analysis platform built with React, TypeScript, Vite, and Tailwind CSS. It features a cybersecurity-themed dark mode interface and a dual-mode Gemini AI assistant for conversational analysis and natural language-to-query translation.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A Google Gemini API Key. You can get yours from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Install Dependencies

Open your terminal, navigate to the project root directory, and run the following command to install the required dependencies:

```bash
npm install
```

### 2. Configure Environment Variables

1. Create a `.env` file in the root of the project. You can copy the structure from the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Open the `.env` file in your editor and add your Gemini API Key:
   ```env
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```
   *Optional: You can also strictly define the Gemini model version by uncommenting the relevant line in the `.env` file.*

### 3. Start the Development Server

Start the application in development mode with Hot Module Replacement (HMR):

```bash
npm run dev
```

Your application should now be accessible in your browser (typically at `http://localhost:5173`).

## Build for Production

To create a production-ready build, run:

```bash
npm run build
```
This will compile the TypeScript code and bundle the application into the `dist` directory. You can preview the production build locally using:

```bash
npm run preview
```

## Core Technologies

- [React 19](https://react.dev/)
- [Vite 6](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Google Gemini API](https://ai.google.dev/) (`@google/generative-ai`) for AI integrations
- [Radix UI](https://www.radix-ui.com/) for accessible UI primitives
- [Lucide React](https://lucide.dev/) for icons
