export interface EmbedData {
    html: string | null;
    type: string;
    provider_name: string | null;
    thumbnail: string | null;
    title: string | null;
}

export async function getEmbedData(url: string): Promise<EmbedData> {
    const response = await fetch(`/api/embed?url=${encodeURIComponent(url)}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch embed data: ${response.statusText}`);
    }

    return response.json();
}
