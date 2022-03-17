export function isCommand(message: string) {
    return message.startsWith("!");
}

export function parseCommand(message: string) {
    const parts = message.split(" ");
    // Remove leading "!"
    parts[0] = parts[0].slice(1);
    return parts;
}
