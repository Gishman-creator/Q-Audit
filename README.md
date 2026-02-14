# Q-Audit

Q-Audit is a powerful analytics and auditing tool designed for traders to deeply analyze their strategy backtest reports. It provides a modern, interactive interface to verify performance metrics, visualize trade data, and simulate alternative position sizing scenarios.

## Features

- **Dashboard Overview**: 
  - Visualizes balance growth over time with interactive charts.
  - Displays monthly and yearly performance breakdowns.
  - toggle between percentage-based and monetary returns.

- **Advanced Analytics**: 
  - detailed breakdown of "Core Performance" metrics (Net Profit, Profit Factor, Sharpe Ratio).
  - Risk analysis including drawdown metrics (Absolute, Relative, Maximal).
  - Streak and Consistency analysis, including calculated **Average Monthly Gain**.

- **Strategy Simulation**: 
  - **Fixed Lot Simulation**: Re-calculates the entire backtest performance assuming a user-defined fixed lot size.
  - Allows traders to see how their strategy would have performed with consistent sizing, removing the effect of compounding or dynamic sizing logic.
  - **Note**: The simulation feature is specifically designed to work with backtests that have a consistent lot size.

- **Report Parsing**: 
  - Robust HTML report parser capable of handling various broker report formats.
  - Dynamic column detection for Profit, Swap, Commission, and more.
  - verification of reported "Total Net Profit" against calculated trade data to ensure accuracy.

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Gishman-creator/Q-Audit.git
    cd Q-Audit
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

4.  **Open the application:**
    The terminal will show the local URL (usually `http://localhost:5173`). Open this link in your browser.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: TailwindCSS
- **State Management**: Redux Toolkit
- **Visualization**: Recharts

## Usage

1.  Click **"Upload Report"** to load your HTML Strategy Tester Report.
2.  Explore the **Dashboard** for visual performance insights.
3.  Check the **Analytics** tab for detailed statistical breakdowns.
4.  Use the **Simulation** tab to test different fixed lot sizes (only available for fixed-lot reports).
