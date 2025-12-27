import { Inngest } from "inngest";
import User from "../models/User.js";

export const inngest = new Inngest({
    id: "movie-ticket-booking",
});

/* ===================== USER CREATED ===================== */
const syncUserCreation = inngest.createFunction(
    { id: "sync-user-from-clerk" },
    { event: "clerk/user.created" },
    async ({ event }) => {
        const {
            id,
            first_name,
            last_name,
            email_addresses,
            image_url,
        } = event.data;

        if (!email_addresses?.length) return;

        await User.create({
            _id: id,
            email: email_addresses[0].email_address,
            name: `${first_name || ""} ${last_name || ""}`.trim(),
            image: image_url,
        });
    }
);

/* ===================== USER DELETED ===================== */
const syncUserDeletion = inngest.createFunction(
    { id: "delete-user-from-clerk" },
    { event: "clerk/user.deleted" },
    async ({ event }) => {
        const { id } = event.data;

        await User.findByIdAndDelete(id);
    }
);

/* ===================== USER UPDATED ===================== */
const syncUserUpdate = inngest.createFunction(
    { id: "update-user-from-clerk" },
    { event: "clerk/user.updated" },
    async ({ event }) => {
        const {
            id,
            first_name,
            last_name,
            email_addresses,
            image_url,
        } = event.data;

        if (!email_addresses?.length) return;

        await User.findByIdAndUpdate(
            id,
            {
                email: email_addresses[0].email_address,
                name: `${first_name || ""} ${last_name || ""}`.trim(),
                image: image_url,
            },
            { new: true, upsert: false }
        );
    }
);

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdate,
];
