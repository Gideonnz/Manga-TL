#!/usr/bin/env python3
"""
Setup script for Manga-OCR
Installs manga-ocr and runs it as a FastAPI service on port 8001
"""

import subprocess
import sys
import os
from pathlib import Path

def run_cmd(cmd, cwd=None):
    print(f'$ {cmd}')
    result = subprocess.run(cmd, shell=True, cwd=cwd)
    if result.returncode != 0:
        print(f'Error: Command failed with exit code {result.returncode}')
        sys.exit(1)

def main():
    print('=== Setting up Manga-OCR ===')
    
    # Check Python version
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print('Error: Python 3.8+ required')
        sys.exit(1)
    
    # Create virtual environment
    venv_path = Path('venv-ocr')
    if not venv_path.exists():
        print('Creating virtual environment...')
        run_cmd(f'{sys.executable} -m venv {venv_path}')
    
    # Determine pip path
    if os.name == 'nt':  # Windows
        pip_path = venv_path / 'Scripts' / 'pip'
        python_path = venv_path / 'Scripts' / 'python'
    else:
        pip_path = venv_path / 'bin' / 'pip'
        python_path = venv_path / 'bin' / 'python'
    
    # Upgrade pip
    run_cmd(f'{pip_path} install --upgrade pip')
    
    # Install manga-ocr and dependencies
    print('Installing manga-ocr...')
    run_cmd(f'{pip_path} install manga-ocr fastapi uvicorn python-multipart pillow')
    
    # Create FastAPI server
    server_code = '''
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from manga_ocr import MangaOcr
from PIL import Image
import io
import uvicorn

app = FastAPI(title="Manga-OCR API")
mcr = MangaOcr()

@app.post("/ocr")
async def ocr_image(image_path: str = Form(...)):
    try:
        # Load image
        img = Image.open(image_path).convert("RGB")
        
        # Run OCR
        result = mcr(img)
        
        # Format result for our frontend
        # manga-ocr returns list of dicts with text, bbox, confidence
        bubbles = []
        for i, item in enumerate(result):
            x, y, w, h = item['bbox']
            bubbles.append({
                'x': x,
                'y': y,
                'width': w,
                'height': h,
                'text': item['text'],
                'confidence': item.get('confidence', 0.9)
            })
        
        return {'bubbles': bubbles}
    except Exception as e:
        return JSONResponse(status_code=500, content={'error': str(e)})

@app.get("/health")
async def health():
    return {'status': 'ok'}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
'''
    
    server_file = Path('ocr_server.py')
    server_file.write_text(server_code.strip())
    print(f'Created {server_file}')
    
    # Create systemd service (optional)
    service_content = f'''[Unit]
Description=Manga-OCR API Server
After=network.target

[Service]
Type=simple
User={os.getenv('USER', 'ubuntu')}
WorkingDirectory={Path.cwd()}
ExecStart={python_path} ocr_server.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
'''
    
    service_file = Path('manga-ocr.service')
    service_file.write_text(service_content)
    print(f'Created {service_file}')
    
    print('\n=== Setup Complete ===')
    print('To start the OCR server:')
    print(f'  cd {Path.cwd()}')
    print(f'  {python_path} ocr_server.py')
    print('')
    print('Or run as systemd service (Linux):')
    print(f'  sudo cp {service_file} /etc/systemd/system/')
    print('  sudo systemctl daemon-reload')
    print('  sudo systemctl enable --now manga-ocr')
    print('')
    print('API will be available at http://localhost:8001')
    print('Test with: curl http://localhost:8001/health')
