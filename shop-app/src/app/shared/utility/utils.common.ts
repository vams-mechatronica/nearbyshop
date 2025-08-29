export function hasToken(): boolean {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        const token = sessionStorage.getItem('access_token');
        return !!token && token !== '';
    }
    return false; // running on server, no token
}
