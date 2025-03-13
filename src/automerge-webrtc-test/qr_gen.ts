import { AwesomeQR } from "awesome-qr";

export async function makeQrForText(text: string): Promise<string> {
    let dataUrl = await new AwesomeQR({
        text,
        size: 500,
    }).draw();
    return dataUrl;
}
