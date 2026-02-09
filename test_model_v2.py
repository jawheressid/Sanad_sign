#!/usr/bin/env python
"""
Script to test ASL model inference with ima.jpg
Handles Keras 3.x + TensorFlow compatibility issues
"""

import os
import sys
import numpy as np
from PIL import Image

def load_image(image_path, target_size=(160, 160)):
    """Load and preprocess image for model inference"""
    try:
        img = Image.open(image_path)
        print(f"✓ Opened image: {img.size} {img.mode}")
        
        # Resize to target size
        img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
        
        # Convert to numpy array and normalize
        img_array = np.array(img_resized, dtype=np.float32) / 255.0
        
        # Add batch dimension  
        img_batch = np.expand_dims(img_array, axis=0)
        
        print(f"✓ Image preprocessed: shape {img_batch.shape}, dtype {img_batch.dtype}")
        print(f"  - Min pixel: {img_batch.min():.4f}, Max pixel: {img_batch.max():.4f}")
        
        return img_batch
        
    except Exception as e:
        print(f"✗ Error loading image: {e}")
        return None


def main():
    """Main test function"""
    print("="*70)
    print("ASL MODEL INFERENCE TEST")
    print("="*70)
    
    # Paths
    model_dir = "models"
    image_path = os.path.abspath("ima.jpg")
    
    print(f"\nSearching for models in: {model_dir}")
    print(f"Test image: {image_path}")
    
    # Check image exists
    if not os.path.exists(image_path):
        print(f"✗ Image not found: {image_path}")
        return False
    
    print(f"✓ Image found: {os.path.getsize(image_path)} bytes")
    
    # Find .keras models
    if not os.path.isdir(model_dir):
        print(f"✗ Model directory not found: {model_dir}")
        return False
    
    keras_models = [f for f in os.listdir(model_dir) if f.endswith('.keras')]
    if not keras_models:
        print(f"✗ No .keras models found in {model_dir}")
        return False
    
    print(f"\nFound {len(keras_models)} Keras model(s):")
    for model_file in keras_models:
        print(f"  - {model_file}")
    
    # Try to import TensorFlow
    try:
        import tensorflow as tf
        print(f"\n✓ TensorFlow version: {tf.__version__}")
    except ImportError as e:
        print(f"\n✗ TensorFlow import failed: {e}")
        return False
    
    # Test first model
    model_file = keras_models[0]
    model_path = os.path.join(model_dir, model_file)
    
    print(f"\n{'='*70}")
    print(f"Testing model: {model_file}")
    print(f"{'='*70}")
    
    # Try multiple loading strategies
    model = None
    loading_strategies = [
        ("Standard tf.keras.models.load_model", 
         lambda: tf.keras.models.load_model(model_path)),
        ("With safe_mode=True", 
         lambda: tf.keras.models.load_model(model_path, safe_mode=True)),
        ("keras.saving.load_model",
         lambda: tf.keras.saving.load_model(model_path, safe_mode=True)),
    ]
    
    for strategy_name, load_func in loading_strategies:
        print(f"\nAttempt: {strategy_name}...")
        try:
            model = load_func()
            print(f"✓ Model loaded successfully with {strategy_name}")
            break
        except Exception as e:
            print(f"✗ Failed: {type(e).__name__}: {str(e)[:100]}")
    
    if model is None:
        print("\n" + "="*70)
        print("✗ FAILED: Could not load model with any strategy")
        print("="*70)
        print("\nThis is likely due to Keras version incompatibility.")
        print("The model was saved with Keras 3.x but TensorFlow 2.15 uses Keras 2.15")
        print("\nSolutions:")
        print("1. Reinstall Keras 2.15: pip install 'keras==2.15'")
        print("2. Use Keras 3.x with standalone installation")
        print("3. Convert model to SavedModel format first")
        return False
    
    # Get model info
    print(f"\n{'-'*70}")
    print("MODEL INFORMATION")
    print(f"{'-'*70}")
    
    try:
        print("\nModel Summary:")
        model.summary()
    except Exception as e:
        print(f"(Could not display summary: {e})")
    
    try:
        print(f"\nInput shape: {model.input_shape}")
        print(f"Output shape: {model.output_shape}")
        print(f"Trainable parameters: {model.count_params():,}")
    except Exception as e:
        print(f"(Could not get model details: {e})")
    
    # Load test image
    print(f"\n{'-'*70}")
    print("IMAGE LOADING")
    print(f"{'-'*70}")
    
    img_array = load_image(image_path, target_size=(160, 160))
    if img_array is None:
        return False
    
    # Run inference
    print(f"\n{'-'*70}")
    print("INFERENCE")
    print(f"{'-'*70}\n")
    
    try:
        print("Running model.predict()...")
        predictions = model.predict(img_array, verbose=1)
        
        print(f"\n✓ Inference completed successfully!")
        print(f"  - Output shape: {predictions.shape}")
        print(f"  - Output dtype: {predictions.dtype}")
        print(f"  - Min value: {predictions.min():.6f}")
        print(f"  - Max value: {predictions.max():.6f}")
        
    except Exception as e:
        print(f"\n✗ Inference failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Display predictions
    print(f"\n{'-'*70}")
    print("PREDICTION RESULTS")
    print(f"{'-'*70}\n")
    
    pred_flat = predictions[0]
    n_classes = len(pred_flat)
    
    print(f"Number of output classes: {n_classes}")
    print(f"Prediction type: {'Softmax Probabilities' if abs(pred_flat.sum() - 1.0) < 0.01 else 'Raw scores'}")
    print(f"Sum of all predictions: {pred_flat.sum():.6f}")
    
    # Top 5 predictions
    top_k = min(5, n_classes)
    top_indices = np.argsort(pred_flat)[-top_k:][::-1]
    
    print(f"\n✓ Top {top_k} predictions:")
    for rank, idx in enumerate(top_indices, 1):
        score = pred_flat[idx]
        percentage = score * 100 if pred_flat.sum() == 1.0 else score
        symbol = "⭐" if rank == 1 else "  "
        print(f"  {symbol} {rank}. Class {idx:2d}: {percentage:7.3f}{'%' if pred_flat.sum() == 1.0 else ''} (score: {score:.6f})")
    
    # Overall result
    best_class = np.argmax(pred_flat)
    best_score = pred_flat[best_class]
    print(f"\n✓ **HIGHEST CONFIDENCE**: Class {best_class} with score {best_score:.6f}")
    
    print(f"\n{'='*70}")
    print("✓ TEST COMPLETED SUCCESSFULLY")
    print(f"{'='*70}\n")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
