//Function to check availablity of selected seats for a movie
import Show from "../models/Show"
import Booking from "../models/Booking"
import User from "../models/User"
import { err } from "inngest/types"

const checkSeatsAvailability = async (showId , selectedSeats) => {
    try{
        const showData = await Show.findById(showId)
        if(!showData){
            return res.status(404).json({
                success : false,
                message : "Show not found"
            })
        }

        const occupiedSeats = showData.occupiedSeats
        const isAnySeatOccupied = selectedSeats.some(seat => occupiedSeats[seat])

        return !isAnySeatOccupied
    }catch(error){
        return false
    }
}

export const createBooking = async (req , res) => {
    try{
        const {userId} = req.auth()
        const {showId , selectedSeats} = req.body
        const {origin} = req.headers

        // Check if the seat is available for the selected show
        const isAvailable = await checkSeatsAvailability(showId , selectedSeats)

        if(!isAvailable){
            return res.status(400).json({
                success : false,
                message : "Selected seats are not available"
            })
        }

        //  Get the show details
        const showData = await Show.findById(showId).populate('movie')

        //Create a new booking
        const booking = await Booking.create({
            user : userId,
            shows : showId,
            amount : showData.showPrice * selectedSeats.length,
            bookedSeats : selectedSeats,
        })
        
        selectedSeats.map((seat) => {
            showData.occupiedSeats[seat] = userId
        })
        showData.markModified('occupiedSeats')
        await showData.save()

        //Stripe Gatewaay Initilize


        res.status(200).json({
            success : true,
            message : "Booked successfully"
        })

    }catch(error){
        return res.status(500).json({
            success : false,
            message : error.message
        })
    }
}

export const getOccupiedSeats = async (req, res) => {
    try{
        const {showId} = req.params;
        const showData = await Show.findById(showId)

        const occupiedSeats = Object.keys(showData.occupiedSeats)

        res.status(200).json({
            success : true,
            occupiedSeats
        })
    }catch(error){
        return res.status(500).json({
            success : false,
            message : error.message
        })
    }
}