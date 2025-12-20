import { Request, Response } from "express";

export async function handleEmbedUrl(req: Request, res: Response) {
    try {
        const url = req.query.url;

        if (!url || typeof url !== "string") {
            res.status(400).json({ error: "URL is required" });
            return;
        }

        const apiKey = process.env.IFRAME_API_KEY;
        const endPoint = process.env.IFRAME_END_POINT;

        if (!apiKey || !endPoint) {
            console.error("IFRAME_API_KEY or IFRAME_END_POINT not set");
            res.status(500).json({ error: "Server configuration error" });
            return;
        }

        const apiUrl = new URL(endPoint);
        apiUrl.searchParams.set("url", url);
        apiUrl.searchParams.set("api_key", apiKey);

        const response = await fetch(apiUrl.toString());

        if (!response.ok) {
            // Fallback for unsupported URLs or API errors (e.g. 404 Not Found, 401 Unauthorized)
            console.warn(`Iframely API returned ${response.status} for ${url}`);

            // Return a basic link representation as fallback
            res.json({
                type: "link",
                html: `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline break-all">${url}</a>`,
                provider_name: new URL(url).hostname,
                thumbnail: null,
                title: url
            });
            return;
        }

        const data = await response.json();

        // Normalize keys
        const normalizedData = {
            html: data.html,
            type: data.type || "link", // photo, video, link, rich
            provider_name: data.provider_name,
            thumbnail: data.thumbnail_url || data.thumbnail,
            title: data.title
        };

        res.json(normalizedData);
    } catch (error) {
        console.error("Error in handleEmbedUrl:", error);
        // Even on crash, maybe try to return a fallback? 
        // But if we can't even parse, 500 is appropriate.
        res.status(500).json({ error: "Internal Server Error" });
    }
}
