import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { initializeSchema, uploadImage, uploadImagesFromDirectory } from './upload.js';
import { searchSimilarImages, saveSearchResults } from './search.js';
import { getImageFiles } from './utils.js';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
});

// Ensure upload directory exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// Serve static files
app.use(express.static('public'));
app.use('/results', express.static('results'));
app.use(express.json());

// Initialize Weaviate schema on startup
initializeSchema().catch(err => {
    console.error('Failed to initialize schema:', err);
});

// API routes
app.get('/api/status', (req, res) => {
    res.json({ status: 'online' });
});

// Get all images in the database
app.get('/api/images', (req, res) => {
    try {
        const imgFiles = getImageFiles('./img');
        res.json({
            success: true, 
            count: imgFiles.length,
            images: imgFiles
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.toString() 
        });
    }
});

// Upload single image
app.post('/api/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ 
            success: false, 
            message: 'No image file provided' 
        });
    }
    
    try {
        const result = await uploadImage(
            fs.readFileSync(req.file.path),
            req.file.originalname
        );
        
        res.json({
            success: result,
            filename: req.file.originalname,
            message: result ? 'Image uploaded successfully' : 'Failed to upload image'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.toString() 
        });
    } finally {
        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);
    }
});

// Bulk upload from directory
app.post('/api/upload/bulk', async (req, res) => {
    try {
        const result = await uploadImagesFromDirectory();
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.toString() 
        });
    }
});

// Search for similar images
app.post('/api/search', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ 
            success: false, 
            message: 'No image file provided' 
        });
    }
    
    try {
        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        
        const limit = req.body.limit ? parseInt(req.body.limit) : 5;
        const searchResult = await searchSimilarImages(base64Image, limit);
        
        if (!searchResult.success) {
            return res.status(404).json(searchResult);
        }
        
        // Create results directory if it doesn't exist
        if (!fs.existsSync('./results')) {
            fs.mkdirSync('./results');
        }
        
        // Save result images to disk
        const savedFiles = [];
        const timestamp = Date.now();
        
        for (let i = 0; i < searchResult.results.length; i++) {
            const filename = `results/result_${timestamp}_${i+1}.jpg`;
            fs.writeFileSync(filename, searchResult.results[i].image, 'base64');
            savedFiles.push({
                url: `/${filename}`,
                similarity: (1 - (i * 0.1)).toFixed(2) // Mock similarity score
            });
        }
        
        res.json({
            success: true,
            message: `Found ${searchResult.results.length} similar images`,
            results: savedFiles
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.toString() 
        });
    } finally {
        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 