# Riingr Messenger

## Description

Riingr Messenger is a modern, responsive messaging application, similar in feel to platforms like WhatsApp or Telegram. It features a clean, intuitive user interface and is powered by the Google Gemini API to provide an integrated and intelligent AI chat experience.

## Features

-   **Modern Messaging UI**: A beautiful, clean, and intuitive interface for a seamless user experience.
-   **Responsive Design**: Fully functional on both desktop and mobile devices, with a layout that adapts to screen size.
-   **AI-Powered Chat**: Integrated with the Gemini API for a smart assistant that can answer questions and hold conversations.
-   **Real-time Feel**: Simulates real-time replies from other users and provides a "thinking" indicator for the AI.
-   **Component-Based Architecture**: Built with reusable React components for maintainability and scalability.

## Tech Stack

-   **Frontend**: React, TypeScript
-   **Styling**: Tailwind CSS for a utility-first styling approach.
-   **AI**: Google Gemini API (`@google/genai`) for the intelligent chat functionality.

## Project Structure

The project is organized into several key directories and files:

-   `index.html`: The main HTML entry point for the application.
-   `index.tsx`: The root of the React application where the `App` component is mounted.
-   `App.tsx`: The main application component that manages state and orchestrates the different parts of the app.
-   `metadata.json`: Contains application metadata like name and description.
-   `types.ts`: Defines the core TypeScript types used throughout the application (`User`, `Message`, `Conversation`).
-   `assets.ts`: A centralized file for storing static assets like image URLs.
-   `constants.tsx`: Holds initial mock data, SVG icons, and other constants.
-   `services/`: Contains modules for interacting with external APIs.
    -   `geminiService.ts`: Handles all communication with the Google Gemini API.
-   `components/`: Contains all the reusable React components.
    -   `Header.tsx`: The main header of the application.
    -   `ConversationList.tsx`: The sidebar displaying all chat conversations.
    -   `ConversationListItem.tsx`: A single item in the conversation list.
    -   `ChatWindow.tsx`: The main window where messages are displayed and sent.
    -   `MessageBubble.tsx`: The component for an individual chat bubble.
    -   `MessageInput.tsx`: The input field for typing and sending messages.

## Getting Started

This application is designed to run in an environment where the Google Gemini API key is provided as an environment variable (`process.env.API_KEY`). Dependencies are loaded via an `importmap` in `index.html`, so no local installation is required to run the code in a compatible environment.
