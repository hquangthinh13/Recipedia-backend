# Recipedia Backend API

The backend server for the Recipedia application. This RESTful API handles user authentication, recipe management, image processing, and email notifications.

## Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (via Mongoose)
* **Authentication:** JWT (JSON Web Tokens) & Cookies
* **File Storage:** Cloudinary (with Multer & Streamifier)
* **Image Processing:** Sharp
* **Email Service:** SendGrid
* **Documentation:** Swagger UI

## Prerequisites

Before you begin, ensure you have met the following requirements:
* Node.js (v16 or higher)
* MongoDB connection string (Local or Atlas)
* Cloudinary account (for image upload)
* SendGrid API Key (for sending emails)

## Installation

1.  **Install dependencies**
    ```bash
    npm install
    ```

2.  **Environment Configuration**
    Create a `.env` file in the root directory and add the following variables:

    ```env
    # Server Configuration
    PORT=5000
    NODE_ENV=development

    # Database
    MONGO_URI=mongodb+srv://<your_connection_string>

    # Authentication
    JWT_SECRET=your_super_secret_key
    JWT_EXPIRE=30d

    # Cloudinary (Image Upload)
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret

    # SendGrid (Email Service)
    SENDGRID_API_KEY=your_sendgrid_api_key
    EMAIL_FROM=noreply@recipedia.com
    ```

3.  **Run the Server**
    * **Development (Auto-reload):**
        ```bash
        npm run dev
        ```
    * **Production:**
        ```bash
        npm start
        ```

## API Documentation

This project uses Swagger for API documentation. Once the server is running, you can access the interactive docs at:
`http://localhost:5001/api-docs`
