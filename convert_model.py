#!/usr/bin/env python
"""
Script de conversion du modèle Keras vers TensorFlow.js
"""
import os
import sys
from pathlib import Path

def main():
    # Chemins
    keras_model_path = Path("models/asl_best.keras")
    output_dir = Path("front/public/models/asl_best")
    
    print(f"[INFO] Conversion du modèle Keras vers TensorFlow.js")
    print(f"[INFO] Modèle source: {keras_model_path}")
    print(f"[INFO] Dossier de sortie: {output_dir}")
    
    # Vérifier que le modèle existe
    if not keras_model_path.exists():
        print(f"[ERREUR] Le modèle {keras_model_path} n'existe pas !")
        sys.exit(1)
    
    # Créer le dossier de sortie
    output_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        import tensorflowjs as tfjs
        print("[INFO] TensorFlow.js importé avec succès")
    except Exception as e:
        print(f"[ERREUR] Impossible d'importer tensorflowjs: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    try:
        # Charger et convertir le modèle
        print("[INFO] Chargement du modèle Keras...")
        import tensorflow as tf
        model = tf.keras.models.load_model(str(keras_model_path))
        print(f"[INFO] Modèle chargé: {model.name}")
        print(f"[INFO] Input shape: {model.input_shape}")
        print(f"[INFO] Output shape: {model.output_shape}")
        
        print("[INFO] Conversion en cours...")
        tfjs.converters.save_keras_model(model, str(output_dir))
        
        print(f"[SUCCÈS] Modèle converti avec succès dans {output_dir}/")
        print("[INFO] Fichiers générés:")
        for file in output_dir.iterdir():
            print(f"  - {file.name}")
            
    except Exception as e:
        print(f"[ERREUR] Échec de la conversion: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
