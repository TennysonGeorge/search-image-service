import { createClient, getSchemaConfig, getImageFiles, readImageAsBase64 } from './utils.js';

// Initialize the schema in Weaviate
export const initializeSchema = async () => {
    const client = createClient();
    const schemaConfig = getSchemaConfig();
    
    try {
        // Check if schema already exists
        const schema = await client.schema.getter().do();
        const classExists = schema.classes?.some(c => c.class === 'Meme');
        
        if (!classExists) {
            await client.schema
                .classCreator()
                .withClass(schemaConfig)
                .do();
            console.log('Schema created successfully');
        } else {
            console.log('Schema already exists, skipping creation');
        }
        
        return true;
    } catch (error) {
        console.error('Error initializing schema:', error);
        return false;
    }
};

// Upload a single image to Weaviate
export const uploadImage = async (imageBuffer, filename) => {
    const client = createClient();
    const b64 = Buffer.from(imageBuffer).toString('base64');
    
    try {
        await client.data.creator()
            .withClassName('Meme')
            .withProperties({
                image: b64,
                text: `Image: ${filename}`
            })
            .do();
        return true;
    } catch (error) {
        console.error(`Error uploading ${filename}:`, error);
        return false;
    }
};

// Upload all images from a directory
export const uploadImagesFromDirectory = async (directory = './img') => {
    try {
        // Ensure schema is initialized
        await initializeSchema();
        
        const imageFiles = getImageFiles(directory);
        
        if (imageFiles.length === 0) {
            console.log('No images found in the directory');
            return {
                success: false,
                message: 'No images found',
                count: 0
            };
        }
        
        let successCount = 0;
        
        // Upload each image to Weaviate
        for (const imageFile of imageFiles) {
            const b64 = readImageAsBase64(`${directory}/${imageFile}`);
            
            try {
                const client = createClient();
                await client.data.creator()
                    .withClassName('Meme')
                    .withProperties({
                        image: b64,
                        text: `Image: ${imageFile}`
                    })
                    .do();
                console.log(`Uploaded ${imageFile}`);
                successCount++;
            } catch (error) {
                console.error(`Error uploading ${imageFile}:`, error);
            }
        }
        
        return {
            success: true,
            message: `Uploaded ${successCount} of ${imageFiles.length} images`,
            count: successCount
        };
    } catch (error) {
        console.error('Error in bulk upload:', error);
        return {
            success: false,
            message: error.toString(),
            count: 0
        };
    }
}; 