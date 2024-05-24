// lib/fetchUserRole.ts for header
export async function fetchUserRole(email: string): Promise<string | null> {
    try {
        console.log(`Calling API to fetch role for email: ${email}`);
        const response = await fetch(`/api/getUserRole?email=${encodeURIComponent(email)}`);
        if (!response.ok) {
            console.error('Error fetching user role:', response.statusText);
            return null;
        }
        const data = await response.json();
        console.log(`Fetched role from API: ${data.role}`);
        return data.role;
    } catch (error) {
        console.error('Error in fetchUserRole:', error);
        return null;
    }
}
