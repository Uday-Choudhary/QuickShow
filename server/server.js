import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const port = 5173;


//Middleware
app.use(express.json())
app.use(cors())

// API Routes
app.get('/' , (req , res) => res.send('Server is live'))

app.listen(port , () => {
    console.log(`Server is listening at http://localhost:${port}`)
})