import { writeFileSync } from 'fs';
import { createClient, readImageAsBase64 } from './utils.js';

// Search for similar images based on a base64 encoded image
export const searchSimilarImages = async (imageBase64, limit = 5) => {
    try {
        const client = createClient();
        
        const resImage = await client.graphql.get()
            .withClassName('Meme')
            .withFields(['image', 'text'])
            .withNearImage({ image: imageBase64 })
            .withLimit(limit)
            .do();
        
        if (!resImage.data.Get.Meme || resImage.data.Get.Meme.length === 0) {
            return {
                success: false,
                message: 'No similar images found',
                results: []
            };
        }
        
        return {
            success: true,
            message: `Found ${resImage.data.Get.Meme.length} similar images`,
            results: resImage.data.Get.Meme
        };
    } catch (error) {
        console.error('Error searching for similar images:', error);
        return {
            success: false,
            message: error.toString(),
            results: []
        };
    }
};

// Search for similar images based on a file path
export const searchSimilarImagesByFile = async (filePath, limit = 5) => {
    try {
        const imageBase64 = readImageAsBase64(filePath);
        return await searchSimilarImages(imageBase64, limit);
    } catch (error) {
        console.error(`Error processing image file ${filePath}:`, error);
        return {
            success: false,
            message: error.toString(),
            results: []
        };
    }
};

// Save search results to disk
export const saveSearchResults = (results, queryIndex) => {
    try {
        if (!results || !results.length) {
            console.log('No results to save');
            return [];
        }
        
        const savedFiles = [];
        
        for (let i = 0; i < results.length; i++) {
            const filename = `./result_${queryIndex}_${i+1}.jpg`;
            writeFileSync(filename, results[i].image, 'base64');
            console.log(`Saved result to ${filename}`);
            savedFiles.push(filename);
        }
        
        return savedFiles;
    } catch (error) {
        console.error('Error saving search results:', error);
        return [];
    }
}; 