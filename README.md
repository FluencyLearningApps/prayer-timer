# Prayer Timer <img src="assets/favicons/apple-touch-icon.png" width="48" alt="Prayer Timer Icon" align="absmiddle">

A responsive, browser-based prayer timer web app designed to help users structure and time their prayer sessions. Based on the concept of the 12-step prayer structure from "The Hour That Changes the World" by Dick Eastman.

## Features

*   **Customizable Duration**: Select a prayer session duration from 1 to 120 minutes using a slider or by manually inputting hours and minutes.
*   **Prayer Structures**:
    *   **Preset Mode**: Utilizes the classic 12-step prayer structure from "The Hour That Changes the World."
    *   **Custom Mode**: Create, name, edit, reorder, save, and delete your own custom prayer sets.
*   **Visual Timer**: A circular pie-chart timer provides a clear visual representation of the current prayer segment and overall progress.
*   **Real-time Information**: Displays the current segment's title, the time remaining for that segment, and the total time left in the session.
*   **Audio Notifications**: A gentle chime plays between segments to guide you without requiring you to look at the screen. A mute option is available.
*   **Data Persistence**: Your custom prayer sets are automatically saved to your browser's local storage.
*   **Responsive Design**: A clean, mobile-first interface that works beautifully on any device.
*   **Cross-platform Favicon**: Includes a favicon that displays correctly across all modern browsers and devices.

## How to Use

To run this application locally, you will need to have Node.js and npm installed.

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd prayer-timer
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the server:**
    ```bash
    npm start
    ```

4.  Open your web browser and navigate to `http://localhost:3000`.
