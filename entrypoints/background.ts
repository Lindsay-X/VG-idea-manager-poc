
import { BlockObjectRequest, Client } from "@notionhq/client"
export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  browser.runtime.onMessage.addListener(async (message) => {
    const apiKey = import.meta.env.NOTION_API_KEY;
    const dataSourceID = import.meta.env.NOTION_DATA_TABLE_SOURCE_ID;
    const databaseID = import.meta.env.NOTION_DATA_TABLE_ID;

    if (!apiKey) {
      return { ok: false, error: 'Missing NOTION_API_KEY in .env' };
    }
    const notion = new Client({ auth: apiKey })

    if (!dataSourceID) {
      return { ok: false, error: 'Missing NOTION_DATA_TABLE_SOURCE_ID in .env' };
    }
    if (!databaseID) {
      return { ok: false, error: 'Missing NOTION_DATA_TABLE_ID in .env' };
    }

    if (message?.type === 'notion:getPages') {
      try {
        const response = await notion.dataSources.query({
          data_source_id: dataSourceID,
          sorts: [
            {
              property: "Created",
              direction: "descending"
            }
          ]
        })

        if (!response) {
          return { ok: false, error: `Notion API error` };
        }

        const data = await response.results;
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error calling Notion API',
        };
      }
    } else if (message?.type === 'notion:createPage') {
      try {
        const { title, description, links, localImages } = message.payload;

        if (!title) {
          return { ok: false, error: 'Title is required' };
        }

        let markdownBody = '';
        if (description) {
          markdownBody += `${description}\n\n`;
        }
        if (links) {
          markdownBody += `Link: [${links}](${links})`;
        }

        const response = await notion.pages.create({
          parent: {
            database_id: databaseID 
          },
          properties: {
            Name: {
              title: [
                {
                  text: {
                    content: title
                  }
                }
              ]
            }
          },
          markdown: markdownBody.trim()
        });

        const pageId = response?.id;

        if (pageId && Array.isArray(localImages) && localImages.length > 0) {
            const childrenBlocks: BlockObjectRequest[] = [];

            for (const img of localImages) {
              try {
                // set container
                const uploadSession = await notion.fileUploads.create({
                  mode: "single_part",
                  filename: img.filename,
                  content_type: img.contentType
                });

                if (!uploadSession?.upload_url) {
                  console.error('Failed to provision upload session via SDK');
                  continue;
                }

                const rawBinaryString = atob(img.base64Data);
                const bytesArray = new Uint8Array(rawBinaryString.length);
                for (let i = 0; i < rawBinaryString.length; i++) {
                  bytesArray[i] = rawBinaryString.charCodeAt(i);
                }
                const imageBlob = new Blob([bytesArray], { type: img.contentType });

                const uploadResult = await notion.fileUploads.send({
                  file_upload_id: uploadSession.id,
                  file: {
                    filename: img.filename,
                    data: imageBlob
                  }
                });

                if (uploadResult.status !== 'uploaded') {
                  console.error(`Binary upload was not marked as successful for ${img.filename}`);
                  continue;
                }

                childrenBlocks.push({
                  object: 'block',
                  type: 'image',
                  image: {
                    type: 'file_upload',
                    file_upload: { id: uploadSession.id }
                  }
                });
              } catch (err) {
                console.error('Failed processing individual image asset:', err);
              }
            }

            if (childrenBlocks.length > 0) {
              await notion.blocks.children.append({
                block_id: pageId,
                children: childrenBlocks
              });
            }
          }

          return { ok: true, data: response };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error calling Notion API',
        };
      }
    }
  });
});
