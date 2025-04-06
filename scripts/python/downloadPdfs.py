#!/usr/bin/env python3
import requests
import zipfile
import io
import os
import fitz  # PyMuPDF
from pathlib import Path

# URL of the zip file
zip_url = "https://openchargealliance.org/download/7b06ab293c68fb6b4f4ae0960e502579c1c5516aa2b7acf0fdcedba585b9ea7f"

# Output directory
output_dir = Path("extracted_data")
pdfs_dir = output_dir / "pdfs"
text_dir = output_dir / "text"

# Create directories if they don't exist
output_dir.mkdir(exist_ok=True)
pdfs_dir.mkdir(exist_ok=True)
text_dir.mkdir(exist_ok=True)

def download_and_extract_zip(url):
    print(f"Downloading zip file from {url}...")
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Failed to download the file: {response.status_code}")
        return False
    
    print("Download complete. Extracting...")
    with zipfile.ZipFile(io.BytesIO(response.content)) as zip_ref:
        zip_ref.extractall(pdfs_dir)
    
    print(f"Files extracted to {pdfs_dir}")
    return True

def extract_text_from_pdfs():
    pdf_files = list(pdfs_dir.glob('**/*.pdf'))
    print(f"Found {len(pdf_files)} PDF files")
    
    for pdf_path in pdf_files:
        output_file = text_dir / f"{pdf_path.stem}.txt"
        print(f"Processing {pdf_path.name}...")
        
        try:
            doc = fitz.open(pdf_path)
            text = ""
            for page in doc:
                text += page.get_text()
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(text)
            
            print(f"Text extracted to {output_file}")
        except Exception as e:
            print(f"Error processing {pdf_path.name}: {e}")

if __name__ == "__main__":
    print("Starting PDF download and extraction process...")
    if download_and_extract_zip(zip_url):
        extract_text_from_pdfs()
    print("Process completed!")
