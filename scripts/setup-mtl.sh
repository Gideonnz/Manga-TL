#!/bin/bash
# Setup script for Ollama (local LLM) and LibreTranslate

set -e

echo "=== Setting up MTL (Machine Translation) ==="

# Detect OS
OS=$(uname -s)
ARCH=$(uname -m)

install_ollama() {
    echo "Installing Ollama..."
    
    if command -v ollama &> /dev/null; then
        echo "Ollama already installed"
    else
        case $OS in
            Linux)
                curl -fsSL https://ollama.com/install.sh | sh
                ;;
            Darwin)
                if command -v brew &> /dev/null; then
                    brew install ollama
                else
                    echo "Please install Homebrew first or download from https://ollama.com"
                    exit 1
                fi
                ;;
            *)
                echo "Unsupported OS: $OS"
                echo "Please install Ollama manually from https://ollama.com"
                exit 1
                ;;
        esac
    fi
    
    # Start Ollama service
    echo "Starting Ollama..."
    ollama serve &
    OLLAMA_PID=$!
    sleep 3
    
    # Pull recommended models
    echo "Pulling translation models..."
    ollama pull qwen2.5:7b    # Good for Japanese->Indonesian
    ollama pull llama3.1:8b   # General purpose
    # ollama pull gemma2:9b    # Alternative
    
    echo "Ollama ready at http://localhost:11434"
}

install_libretranslate() {
    echo "Installing LibreTranslate (Docker)..."
    
    if command -v docker &> /dev/null; then
        docker pull libretranslate/libretranslate
        echo "LibreTranslate image pulled"
        echo "Run with: docker run -d -p 5000:5000 libretranslate/libretranslate"
    else
        echo "Docker not found. Skipping LibreTranslate."
        echo "Install Docker first: https://docs.docker.com/get-docker/"
    fi
}

# Main
case "${1:-all}" in
    ollama)
        install_ollama
        ;;
    libretranslate)
        install_libretranslate
        ;;
    all)
        install_ollama
        install_libretranslate
        ;;
    *)
        echo "Usage: $0 [ollama|libretranslate|all]"
        exit 1
        ;;
esac

echo ""
echo "=== Setup Complete ==="
echo ""
echo "For Ollama:"
echo "  ollama serve        # Start server"
echo "  ollama pull qwen2.5:7b"
echo ""
echo "For LibreTranslate:"
echo "  docker run -d -p 5000:5000 libretranslate/libretranslate"
echo ""
echo "Add to .env:"
echo "  OLLAMA_API_URL=http://localhost:11434"
echo "  OLLAMA_MODEL=qwen2.5:7b"
echo "  MTL_ENABLED=true"
echo "  LIBRETRANSLATE_URL=http://localhost:5000"
