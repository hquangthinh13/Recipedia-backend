# Recipedia Backend API

The backend server for the Recipedia application. This RESTful API handles user authentication, recipe management, image processing, and email notifications.

## Key Features

- **Modern UI/UX:** Built with Shadcn UI (Radix Primitives) and Tailwind CSS v4 for a polished look.
- **Data Visualization:** Interactive charts using Recharts and powerful data tables via TanStack Table.
- **Utilities:** Export recipes to PDF or Image.
- **Robust Forms:** Type-safe form handling with React Hook Form and Zod validation.
- **Responsive:** Fully optimized for mobile, tablet, and desktop devices.

## API Documentation

This project uses Swagger for API documentation. You can access the interactive docs at:
`https://recipedia-backend-6gp7.onrender.com/api-docs`

## System Architecture

![System Architecture](./docs/system-architecture.svg)

## NoSQL Database Design

![Database Design](./docs/database-design.svg)

## Tech Stack

### Core & Runtime

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

### Framework

![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

### Database

![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Upstash](https://img.shields.io/badge/Upstash-00C98D?style=for-the-badge&logo=upstash&logoColor=white)

### Authentication

![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)

### Storage & Media Processing

![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Multer](https://img.shields.io/badge/Multer-333333?style=for-the-badge)
![Sharp](https://img.shields.io/badge/Sharp-99CC00?style=for-the-badge)

### Services & Documentation

![SendGrid](https://img.shields.io/badge/SendGrid-009DD9?style=for-the-badge&logo=sendgrid&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

### Deployment

![Render](https://img.shields.io/badge/Render-000000?style=for-the-badge&logo=render&logoColor=white)

## Email Preview

![Database Design](./docs/email-sample.png)

## Installation

### Clone repo

```bash
git clone https://github.com/hquangthinh13/recipedia-backend.git

cd recipedia-backend
```

### Install dependencies

```bash
npm install
```

## Environment Variables

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

    # Upstash
    UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
    UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

## Run Project

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```
