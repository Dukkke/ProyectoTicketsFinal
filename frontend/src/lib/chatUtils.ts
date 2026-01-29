export interface ChatMessage {
    author: 'Estudiante' | 'Coordinador';
    text: string;
    date?: string;
    original?: boolean;
}

export function parseTicketDescription(description: string): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // Split by our known delimiters
    // Delimiters: 
    // 1. --- 💬 Respuesta Anterior de (Name) ---
    // 2. --- ↩️ Reabierto por estudiante el (Date) ---

    // We will use a regex to identify split points but keep delimiters to know WHO
    // Regex: split by (\n\n--- .*? ---\n)

    const parts = description.split(/\n\n(--- .*? ---)\n/);

    // 1st part is always original student message
    if (parts.length > 0) {
        messages.push({
            author: 'Estudiante',
            text: parts[0].trim(),
            original: true
        });
    }

    // Process pairs of (Delimiter + Content)
    for (let i = 1; i < parts.length; i += 2) {
        const delimiter = parts[i];
        const content = parts[i + 1] || ""; // Handle safety

        if (delimiter.includes("Respuesta Anterior")) {
            // Extract Name? "Respuesta Anterior de Cynthia Herrera"
            // const match = delimiter.match(/de (.*?) ---/);
            messages.push({
                author: 'Coordinador',
                text: content.trim()
            });
        } else if (delimiter.includes("Reabierto por estudiante")) {
            // Extract Date? "Reabierto por estudiante el 13/01/2026..."
            const dateMatch = delimiter.match(/el (.*?) ---/);
            messages.push({
                author: 'Estudiante',
                text: content.trim(),
                date: dateMatch ? dateMatch[1] : undefined
            });
        }
    }

    return messages;
}
