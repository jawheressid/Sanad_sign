#!/usr/bin/env python3
"""
Script pour tester le modèle ASL (American Sign Language) sur une image
Utilise les modèles dans le dossier models/ et testeles sur ima.jpg
"""

import os
import sys
from pathlib import Path
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow import keras

def load_image(image_path, target_size=(160, 160)):
    """
    Charge et prétraite une image pour le modèle
    """
    print(f"[INFO] Chargement de l'image: {image_path}")
    
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
    
    # Charger l'image
    img = Image.open(image_path).convert('RGB')
    print(f"[INFO] Image originale: {img.size}")
    
    # Redimensionner à la taille attendue
    img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
    
    # Convertir en array numpy
    img_array = np.array(img_resized, dtype=np.float32)
    
    # Normaliser les pixels [0, 1]
    img_array = img_array / 255.0
    
    # Ajouter batch dimension
    img_array = np.expand_dims(img_array, axis=0)
    
    print(f"[INFO] Forme après traitement: {img_array.shape}")
    print(f"[INFO] Plage de valeurs: [{img_array.min():.3f}, {img_array.max():.3f}]")
    
    return img_array

def find_models(models_dir="models"):
    """
    Trouve tous les modèles Keras dans le dossier spécifié
    """
    models = []
    if not os.path.exists(models_dir):
        print(f"[ERREUR] Dossier {models_dir} non trouvé")
        return models
    
    for file in os.listdir(models_dir):
        if file.endswith(('.keras', '.h5', '.pb')):
            models.append(os.path.join(models_dir, file))
    
    return models

def load_model(model_path):
    """
    Charge un modèle Keras
    """
    print(f"\n[INFO] Chargement du modèle: {model_path}")
    try:
        model = keras.models.load_model(model_path, compile=False)
        print(f"[OK] Modèle chargé avec succès")
        print(f"    Architecture: {model.name}")
        print(f"    Couches: {len(model.layers)}")
        print(f"    Input shape: {model.input_shape}")
        print(f"    Output shape: {model.output_shape}")
        return model
    except Exception as e:
        print(f"[ERREUR] Impossible de charger le modèle: {e}")
        return None

def predict(model, img_array):
    """
    Fait une prédiction avec le modèle
    """
    print(f"\n[INFO] Prédiction en cours...")
    
    try:
        predictions = model.predict(img_array, verbose=0)
        
        # Obtenir la classe prédite
        predicted_class = np.argmax(predictions[0])
        confidence = predictions[0][predicted_class]
        
        print(f"[OK] Prédiction réussie!")
        print(f"    Classe prédite: {predicted_class}")
        print(f"    Confiance: {confidence:.4f} ({confidence*100:.2f}%)")
        print(f"\n    Top 5 prédictions:")
        
        top_5_indices = np.argsort(predictions[0])[::-1][:5]
        for i, idx in enumerate(top_5_indices, 1):
            print(f"      {i}. Classe {idx}: {predictions[0][idx]:.4f}")
        
        return predictions, predicted_class, confidence
        
    except Exception as e:
        print(f"[ERREUR] Erreur lors de la prédiction: {e}")
        return None, None, None

def main():
    print("=" * 70)
    print("TEST DU MODELE ASL (American Sign Language)")
    print("=" * 70)
    
    # Configuration
    image_path = "ima.jpg"
    models_dir = "models"
    
    # Vérifier que l'image existe
    if not os.path.exists(image_path):
        print(f"[ERREUR] L'image {image_path} n'existe pas!")
        sys.exit(1)
    
    print(f"[INFO] Image à tester: {image_path}")
    print(f"[INFO] Taille du fichier: {os.path.getsize(image_path) / 1024:.2f} KB")
    
    # Charger l'image
    try:
        img_array = load_image(image_path)
    except Exception as e:
        print(f"[ERREUR] Impossible de charger l'image: {e}")
        sys.exit(1)
    
    # Trouver les modèles
    models = find_models(models_dir)
    if not models:
        print(f"[ERREUR] Aucun modèle trouvé dans {models_dir}")
        sys.exit(1)
    
    print(f"\n[INFO] {len(models)} modèle(s) trouvé(s):")
    for model in models:
        print(f"  - {os.path.basename(model)}")
    
    # Tester chaque modèle
    print("\n" + "=" * 70)
    print("TESTS DES MODELES")
    print("=" * 70)
    
    for model_path in models:
        print(f"\n>>> Test du modèle: {os.path.basename(model_path)}")
        print("-" * 70)
        
        # Charger le modèle
        model = load_model(model_path)
        if model is None:
            print(f"[ERREUR] Impossible de charger le modèle")
            continue
        
        # Faire une prédiction
        predictions, predicted_class, confidence = predict(model, img_array)
        
        if predictions is not None:
            print(f"[OK] Test réussi!")
        else:
            print(f"[ERREUR] Test échoué!")
    
    print("\n" + "=" * 70)
    print("FIN DU TEST")
    print("=" * 70)

if __name__ == "__main__":
    main()
