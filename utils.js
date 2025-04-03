import weaviate from 'weaviate-ts-client';
import { readFileSync, readdirSync } from 'fs';

// Create Weaviate client
export const createClient = () => {
    return weaviate.client({
        scheme: 'http',
        host: 'localhost:8080',
    });
};

// Schema configuration for the Meme class
export const getSchemaConfig = () => {
    return {
        'class': 'Meme',
        'vectorizer': 'img2vec-neural',
        'vectorIndexType': 'hnsw',
        'moduleConfig': {
            'img2vec-neural': {
                'imageFields': [
                    'image'
                ]
            }
        },
        'properties': [
            {
                'name': 'image',
                'dataType': ['blob']
            },
            {
                'name': 'text',
                'dataType': ['string']
            }
        ]
    };
};

// Get array of image files from a directory
export const getImageFiles = (directory) => {
    return readdirSync(directory)
        .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png)$/));
};

// Read image file and convert to base64
export const readImageAsBase64 = (filepath) => {
    const img = readFileSync(filepath);
    return Buffer.from(img).toString('base64');
}; 