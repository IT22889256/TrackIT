# TrackIT - Smart Grocery Inventory Management System

## Overview

TrackIT is a smart home grocery inventory management system designed to streamline grocery shopping, reduce food waste, and optimize household budgeting. [cite: 1, 9, 10, 11, 12] This mobile application uses Optical Character Recognition (OCR) technology to digitize grocery receipts, track inventory in real-time, provide expiration date alerts, and generate budget-friendly shopping lists. [cite: 10, 11, 12, 16, 17, 18]

## Features

* **OCR-based Receipt Scanning:** Automatically captures and parses data from grocery receipts using the Veryfi API to create digital inventory. [cite: 10, 60]
* **Inventory Management:** Tracks product names, prices, quantities, and expiration dates to provide real-time updates and reduce food waste. [cite: 10, 61]
* **Budget-Friendly Shopping List:** Generates smart shopping lists based on user-defined budgets, prioritizing essential items, low-stock items, and items nearing expiration using a Greedy Algorithm. [cite: 11, 12, 61]
* **Expiration Date Tracking:** Alerts users to potential food waste by tracking and notifying them of expiring items. [cite: 17, 61]
* **Visual Analytics:** Offers visual representations of buying behaviors and consumption tendencies to help users make informed decisions. [cite: 19, 62]

## Technologies Used

* React Native: For cross-platform mobile application development. [cite: 69]
* Node.js: For server-side operations and API management. [cite: 73]
* Python: For implementing the Greedy Algorithm and other algorithmic processing. [cite: 73]
* Veryfi API: For Optical Character Recognition (OCR) to process grocery receipts. [cite: 10, 88]
* Firebase Firestore: For NoSQL cloud database with real-time syncing. [cite: 75]

## System Architecture

TrackIT employs a modular, three-tier architecture:

1.  **Presentation Layer:** User interface developed with React Native, following Material Design Guidelines. [cite: 68, 69, 70]
2.  **Application Layer:** Business logic and core services developed using Node.js and Python, including OCR integration, inventory management, budget planning, and notification services. [cite: 73, 74]
3.  **Data Layer:** Firebase Firestore for backend storage, managing user profiles, inventory items, receipt data, budget entries, and shopping lists. [cite: 75, 76]

## Greedy Algorithm Implementation

The Greedy Algorithm is used to optimize shopping lists by selecting items with the highest priority-to-cost ratio within the user's budget. [cite: 12, 51, 52] This algorithm helps users maximize value and minimize waste. [cite: 82, 83]

## Testing

A comprehensive testing strategy was used, including:

* Unit Testing
* Integration Testing
* User Acceptance Testing (UAT)
* Performance Testing
* Security Testing
* Accuracy Testing of the Greedy Algorithm
* Usability Testing

## Setup

To set up and run TrackIT, follow these steps:

1.  Clone the repository.
2.  Install the necessary dependencies.
3.  Configure the Firebase and Veryfi API credentials.
4.  Build and run the application on an Android or iOS device.

## Team

* K. H. C. D Wickramasinghe
* N. M. F. Nisfa
* M. N. D. Maththamagoda
* W. A. S. L. Priyantha

## Acknowledgements

* Veryfi for providing the OCR API.
* Firebase for providing the backend services.
