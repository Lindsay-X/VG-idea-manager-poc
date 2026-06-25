import { SerializableFile } from "./App";

type NotionPage = {
    url?: string;
    properties?: {
        Name?: {
            title?: Array<{
                plain_text?: string;
            }>;
        };
    };
};

export type RandomIdea = {
    url: string;
    title: string;
};

export type CreatePagePayload = {
    title: string;
    description: string;
    links: string;
    localImages: SerializableFile[];
};

export const getPages = async (): Promise<RandomIdea> => {
    const response = await browser.runtime.sendMessage({ type: 'notion:getPages' });
    if (!response?.ok) {
        throw new Error(response?.error ?? 'Failed to fetch Notion pages');
    }

    const pages = (response.data ?? []) as NotionPage[];
    if (!Array.isArray(pages) || pages.length === 0) {
        throw new Error('No pages found in Notion response');
    }

    const randomPage = pages[Math.floor(Math.random() * pages.length)];
    const title = randomPage?.properties?.Name?.title?.[0]?.plain_text ?? '';
    const url = randomPage?.url ?? '';

    if (!url || !title) {
        throw new Error('Random Notion page is missing url or title');
    }

    return { url, title };
};

export const createPage = async (payload: CreatePagePayload): Promise<void> => {
    const response = await browser.runtime.sendMessage({
        type: 'notion:createPage',
        payload
    });

    if (!response?.ok) {
        throw new Error(response?.error ?? 'Failed to create Notion page');
    }
};