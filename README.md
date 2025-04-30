# TrackIT - Smart Grocery Inventory Management System

## Overview

TrackIT is a smart home grocery inventory management system designed to streamline grocery shopping, reduce food waste, and optimize household budgeting. This mobile application uses Optical Character Recognition (OCR) technology to digitize grocery receipts, track inventory in real-time, provide expiration date alerts, and generate budget-friendly shopping lists.

## Features

* **OCR-based Receipt Scanning:** Automatically captures and parses data from grocery receipts using the Veryfi API to create digital inventory. 
* **Inventory Management:** Tracks product names, prices, quantities, and expiration dates to provide real-time updates and reduce food waste.
* **Budget-Friendly Shopping List:** Generates smart shopping lists based on user-defined budgets, prioritizing essential items, low-stock items, and items nearing expiration using a Greedy Algorithm.
* **Expiration Date Tracking:** Alerts users to potential food waste by tracking and notifying them of expiring items.
* **Visual Analytics:** Offers visual representations of buying behaviors and consumption tendencies to help users make informed decisions.

## Technologies Used

* React Native: For cross-platform mobile application development.
* Node.js: For server-side operations and API management.
* Python: For implementing the Greedy Algorithm and other algorithmic processing.
* Veryfi API: For Optical Character Recognition (OCR) to process grocery receipts.
* Firebase Firestore: For NoSQL cloud database with real-time syncing.

## System Architecture

TrackIT employs a modular, three-tier architecture:

1.  **Presentation Layer:** User interface developed with React Native, following Material Design Guidelines.
2.  **Application Layer:** Business logic and core services developed using Node.js and Python, including OCR integration, inventory management, budget planning, and notification services.
3.  **Data Layer:** Firebase Firestore for backend storage, managing user profiles, inventory items, receipt data, budget entries, and shopping lists.

## Greedy Algorithm Implementation

The Greedy Algorithm is used to optimize shopping lists by selecting items with the highest priority-to-cost ratio within the user's budget. This algorithm helps users maximize value and minimize waste.

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
