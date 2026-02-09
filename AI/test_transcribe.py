#!/usr/bin/env python3
"""Test script to transcribe bonjour.mp3"""

import warnings
from pathlib import Path

# Suppress warnings
warnings.filterwarnings("ignore")

try:
    import whisper
    
    audio_file = Path(__file__).parent / "bonjour.mp3"
    
    if not audio_file.exists():
        print(f"Fichier not found: {audio_file}")
        exit(1)
    
    print(f"Audio file: {audio_file}")
    print("Loading Whisper model (base)...")
    
    model = whisper.load_model("base")
    
    print("Transcribing audio...")
    result = model.transcribe(str(audio_file), language="fr")
    
    print("\n" + "="*50)
    print("TRANSCRIPTION RESULT:")
    print("="*50)
    print(f"Text: {result['text']}")
    print(f"Language: {result['language']}")
    print(f"Duration: {result.get('duration', 'N/A')}s")
    
except ImportError as e:
    print(f"Error: {e}")
    print("Make sure requirements are installed in .venv311")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
