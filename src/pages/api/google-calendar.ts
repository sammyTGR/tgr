import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { corsHeaders } from '@/utils/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'OPTIONS') {
        res.status(200).json({ message: 'CORS preflight request success' });
        return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

    const calendar = google.calendar({
        version: 'v3',
        auth: process.env.GOOGLE_CALENDAR_API_KEY,
    });

    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    try {
        const response = await calendar.events.list({
            calendarId,
            singleEvents: true,
            orderBy: 'startTime',
        });
    
        console.log('Fetched events:', response.data.items);
        res.status(200).json({ events: response.data.items });
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching calendar events:', error.message, error.stack);
        } else {
            console.error('Unexpected error fetching calendar events:', error);
        }
        res.status(500).json({ error: 'Failed to fetch events' });
    }
    
}
