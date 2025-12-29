# 🎬 QuickShow - Movie Booking Platform

A modern, full-stack movie booking application that allows users to browse movies, book tickets, and manage their reservations with real-time seat selection and secure payment processing.

![React](https://img.shields.io/badge/React-19.1.1-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen?logo=mongodb)
![Stripe](https://img.shields.io/badge/Stripe-Payments-purple?logo=stripe)

## ✨ Features

### User Features
- 🎥 **Browse Movies**: Discover now-playing movies with data from TMDB API
- 🎫 **Book Tickets**: Interactive seat selection with real-time availability
- ⏱️ **Timed Reservations**: Seats are temporarily blocked during booking process
- 💳 **Secure Payments**: Stripe integration for safe payment processing
- 📧 **Email Notifications**: Automated booking confirmations via email
- 📱 **My Bookings**: View and manage all your movie bookings
- ❤️ **Favorites**: Save your favorite movies for quick access
- 🎬 **Trailers**: Watch movie trailers directly in the app
- 🔐 **Authentication**: Secure user authentication with Clerk

### Admin Features
- 🎭 **Show Management**: Add, edit, and delete movie shows
- 📊 **Booking Overview**: Monitor all bookings and seat occupancy
- 🎪 **Theater Management**: Manage theaters and showtimes

### Technical Features
- ⚡ **Real-time Updates**: Instant seat availability updates
- 🔄 **Background Jobs**: Automated seat release using Inngest
- 🎯 **Concurrency Control**: Prevents double bookings
- 📱 **Responsive Design**: Works seamlessly on all devices
- 🚀 **Fast Performance**: Built with Vite for optimal speed

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.2
- **Routing**: React Router DOM 7.8.2
- **Styling**: TailwindCSS 4.1.13
- **Authentication**: Clerk React 5.45.0
- **HTTP Client**: Axios 1.13.2
- **UI Components**: 
  - Lucide React (Icons)
  - React Hot Toast (Notifications)
  - React Player (Video playback)

### Backend
- **Runtime**: Node.js
- **Framework**: Express 5.1.0
- **Database**: MongoDB with Mongoose 8.18.1
- **Authentication**: Clerk Express 1.7.60
- **Payment Processing**: Stripe 20.1.0
- **Email Service**: Nodemailer 7.0.12
- **Background Jobs**: Inngest 3.48.1
- **File Storage**: Cloudinary 2.7.0
- **Webhooks**: Svix 1.82.0

## 📁 Project Structure

```
QuickShow/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   ├── lib/           # Utility functions
│   │   └── assets/        # Static assets
│   ├── package.json
│   └── vite.config.js
│
├── server/                # Backend Express application
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── inngest/          # Background job functions
│   ├── server.js         # Entry point
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn
- Clerk account
- Stripe account
- TMDB API key
- Cloudinary account
- Email service credentials

### Environment Variables

#### Client (.env)
Create a `.env` file in the `client` directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:3000
```

#### Server (.env)
Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Stripe Payment
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# TMDB API
TMDB_API_KEY=your_tmdb_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Service (Nodemailer)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587

# Inngest
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# Frontend URL
CLIENT_URL=http://localhost:5173
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd QuickShow
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**
   - Create `.env` files in both `client` and `server` directories
   - Fill in the required environment variables (see above)

### Running the Application

#### Development Mode

1. **Start the server** (from `server` directory)
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:3000`

2. **Start the client** (from `client` directory)
   ```bash
   npm run dev
   ```
   Client will run on `http://localhost:5173`

#### Production Mode

1. **Build the client**
   ```bash
   cd client
   npm run build
   ```

2. **Start the server**
   ```bash
   cd ../server
   npm start
   ```

## 📚 API Documentation

### Public Endpoints

- `GET /` - Health check
- `GET /api/shows/now-playing` - Get currently playing movies
- `GET /api/shows/:id` - Get specific show details

### Protected Endpoints (Require Authentication)

#### Shows
- `GET /api/shows` - Get all shows
- `GET /api/shows/:id` - Get show by ID

#### Bookings
- `POST /api/booking/create` - Create new booking
- `GET /api/booking/user` - Get user's bookings
- `POST /api/booking/retry-payment` - Retry failed payment
- `POST /api/booking/verify` - Verify booking payment status

#### User
- `GET /api/user/favorites` - Get user's favorite movies
- `POST /api/user/favorites` - Add movie to favorites
- `DELETE /api/user/favorites/:movieId` - Remove from favorites

### Admin Endpoints (Require Admin Role)

- `POST /api/admin/shows` - Add new show
- `PUT /api/admin/shows/:id` - Update show
- `DELETE /api/admin/shows/:id` - Delete show
- `GET /api/admin/bookings` - Get all bookings

### Webhooks

- `POST /api/stripe` - Stripe webhook handler
- `POST /api/inngest` - Inngest event handler

## 🎯 Key Features Explained

### Seat Booking Flow

1. User selects seats on the seat layout page
2. Seats are temporarily blocked for 10 minutes
3. User proceeds to payment via Stripe
4. On successful payment:
   - Booking is confirmed
   - Seats are permanently marked as occupied
   - Confirmation email is sent
5. If payment fails or times out:
   - Seats are automatically released via Inngest background job
   - User can retry payment from "My Bookings" page

### Background Jobs (Inngest)

- **Seat Release**: Automatically releases unpaid seats after timeout
- **User Sync**: Syncs user data with Clerk authentication
- **Email Notifications**: Sends booking confirmations asynchronously

### Payment Processing

- Stripe Checkout integration for secure payments
- Webhook verification for payment confirmation
- Manual payment verification fallback
- Session-based payment tracking

## 🔒 Security Features

- JWT-based authentication via Clerk
- Webhook signature verification (Stripe & Clerk)
- Environment variable protection
- CORS configuration
- Input validation and sanitization
- Secure payment processing

## 🧪 Testing

### Test Email Configuration
Run the email test script to verify email setup:
```bash
cd server
node test-email.js
```

## 📦 Deployment

### Vercel Deployment (Recommended)

The project includes a `vercel.json` configuration for easy deployment.

1. **Deploy the server**
   ```bash
   cd server
   vercel
   ```

2. **Deploy the client**
   ```bash
   cd client
   vercel
   ```

3. **Configure environment variables** in Vercel dashboard

### Environment-Specific Configuration

- Update `VITE_API_URL` in client to point to production server
- Update `CLIENT_URL` in server to point to production client
- Configure webhook URLs in Stripe and Clerk dashboards

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

Uday Kumar Choudhary

## 🙏 Acknowledgments

- [TMDB](https://www.themoviedb.org/) for movie data
- [Clerk](https://clerk.dev/) for authentication
- [Stripe](https://stripe.com/) for payment processing
- [Inngest](https://www.inngest.com/) for background jobs
- [Cloudinary](https://cloudinary.com/) for media management

## 📞 Support

For support, email choudharyuday85@gmail.com or open an issue in the repository.

---

**Built with ❤️ using React, Node.js, and MongoDB**
