export const API_BASE = '/api';

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options);
    if (!res.ok) {
        let errorMsg = 'Error en la petición';
        try {
            const text = await res.text();
            try {
                const error = JSON.parse(text);
                errorMsg = error.detail || errorMsg;
            } catch {
                if (text.length < 100) errorMsg = `Error: ${text}`;
            }
        } catch { }
        throw new Error(errorMsg);
    }
    return res.json();
}
