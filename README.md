# Image Search Engine with Weaviate

This project implements a visual similarity search engine using Weaviate vector database and neural network-based image embeddings. It allows you to upload images and find visually similar ones using AI.

## Prerequisites

- Docker and Docker Compose
- Node.js v16 or higher
- npm

## Setup

1. Clone the repository:
```bash
git clone https://github.com/TennysonGeorge/search-image-service.git
cd search-image-service
```

2. Install dependencies:
```bash
npm install
```

3. Start the Weaviate services:
```bash
docker-compose up -d
```

This will start:
- Weaviate vector database
- ResNet50 image inference API

4. Start the application:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Features

### Web Interface
- Drag and drop interface for image uploads
- Visual results display
- Similarity scoring

### REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Check API status |
| `/api/images` | GET | List all indexed images |
| `/api/upload` | POST | Upload a single image |
| `/api/upload/bulk` | POST | Batch upload from img directory |
| `/api/search` | POST | Find similar images |

## API Usage Examples

### Upload an Image
```bash
curl -X POST -F "image=@/path/to/your/image.jpg" http://localhost:3000/api/upload
```

### Search for Similar Images
```bash
curl -X POST -F "image=@/path/to/your/query.jpg" http://localhost:3000/api/search
```

### Batch Upload from Directory
```bash
curl -X POST http://localhost:3000/api/upload/bulk
```

## Project Structure

- `server.js`: Express API server
- `utils.js`: Shared utility functions
- `upload.js`: Image upload functionality
- `search.js`: Image search functionality
- `public/`: Web interface files
- `docker-compose.yml`: Defines required services
- `img/`: Directory for source images to be indexed
- `uploads/`: Temporary directory for uploaded files
- `results/`: Directory for search result images

## How It Works

1. **Image Vectorization**: Uses ResNet50 neural network to convert images into high-dimensional vectors
2. **Vector Storage**: Weaviate stores these vectors in an efficient searchable format
3. **Similarity Search**: When searching, new images are converted to vectors and compared to find the most similar matches

## Troubleshooting

- If you get connection errors, ensure Docker containers are running:
```bash
docker-compose ps
```

- To reset the database, stop and remove containers:
```bash
docker-compose down -v
```

## Technologies Used

- [Weaviate](https://weaviate.io/): Vector database
- [Express.js](https://expressjs.com/): Web framework
- [ResNet50](https://en.wikipedia.org/wiki/Residual_neural_network): Neural network for image feature extraction
- [Node.js](https://nodejs.org/): Runtime environment
- [Docker](https://www.docker.com/): Containerization

## License

ISC
