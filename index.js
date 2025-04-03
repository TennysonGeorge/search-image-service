import { readFileSync, writeFileSync, readdirSync } from 'fs';
import weaviate from 'weaviate-ts-client';

const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
});

const schemaConfig = {
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
}

/* await client.schema
    .classCreator()
    .withClass(schemaConfig)
    .do();
 */
// Fetch the updated schema after adding the new class
/* const updatedSchemaRes = await client.schema.getter().do();
console.log(updatedSchemaRes);
 */

// Upload multiple images from the img directory
const imgDir = './img';
const imageFiles = readdirSync(imgDir)
    .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png)$/));

// Upload each image to Weaviate
for (const imageFile of imageFiles) {
    const img = readFileSync(`${imgDir}/${imageFile}`);
    const b64 = Buffer.from(img).toString('base64');
    
    await client.data.creator()
        .withClassName('Meme')
        .withProperties({
            image: b64,
            text: `Image: ${imageFile}`
        })
        .do();
    console.log(`Uploaded ${imageFile}`);
}

// When searching, get multiple results
const testDir = './test';
const testImages = readdirSync(testDir)
    .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png)$/));

if (testImages.length === 0) {
    console.error('No test images found in test directory');
    process.exit(1);
}

// Process each test image
for (let i = 0; i < testImages.length; i++) {
    const testImage = Buffer.from(readFileSync(`${testDir}/${testImages[i]}`)).toString('base64');
    
    const resImage = await client.graphql.get()
        .withClassName('Meme')
        .withFields(['image'])
        .withNearImage({ image: testImage })
        .withLimit(5) // Increased from 1 to 5 to get more results
        .do();

    // Write results to filesystem with numbered outputs
    const results = resImage.data.Get.Meme;
    for (let j = 0; j < results.length; j++) {
        writeFileSync(`./result_${i+1}_${j+1}.jpg`, results[j].image, 'base64');
        console.log(`Processed ${testImages[i]} -> result_${i+1}_${j+1}.jpg`);
    }
}