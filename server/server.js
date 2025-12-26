import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/db.js'
import { clerkMiddleware } from '@clerk/express';
import { serve } from "inngest/express";
import { inngest, functions  } from './inngest/index.js';

const app = express();
const port = 5173;


//Middleware
app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())

await connectDB()

// API Routes
app.get('/', (req, res) => res.send('Server is live'))
app.use('/api/inngest', serve({client: inngest, functions}));

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`)
})