// Convert base64 to ArrayBuffer
export const b642ab = (base64string: string) => {
    return Uint8Array.from(atob(base64string), c => c.charCodeAt(0));
}

export async function decryptRSA(key: CryptoKey, data: ArrayBuffer) {
    return await window.crypto.subtle.decrypt(
        {
        name: "RSA-OAEP",
        },
        key,
        data
    );
};

export const decryptAES = (key: CryptoKey, ciphertext: ArrayBuffer, iv: ArrayBuffer) => {
    return window.crypto.subtle.decrypt(
        {
        name: "AES-CBC",
        iv: iv
        },
        key,
        ciphertext
    );
};

export const importAESKey = (key: ArrayBuffer) => {
    return window.crypto.subtle.importKey(
        "raw",
        key,
        "AES-CBC",
        true,
        ["encrypt", "decrypt"]
    );
};

export const decodeFile = (data: string) => {
    const byteCharacters = data;
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return byteArray;
};