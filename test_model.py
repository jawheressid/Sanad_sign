/usr/bin/env python
"""
Test du modèle AI avec une image
"""
import os
import sys
import numpy as np
from pathlib import Path

# Activer systématiquement .venv311
venv_path = Path(__file__).parent / "AI" / ".venv311"
if venv_path.exists():
    print(f"[INFO] Utilisation de l'environnement: {venv_path}")

def load_image(image_path, target_size=(224, 224)):
    """Charge et prétraite une image"""
    try:
        from PIL import Image
    except ImportError:
        print("[ERREUR] PIL/Pillow n'est pas installé. Installez-le avec: pip install pillow")
        return None
    
    if not os.path.exists(image_path):
        print(f"[ERREUR] Image non trouvée: {image_path}")
        return None
    
    try:
        img = Image.open(image_path)
        print(f"[INFO] Format d'image original: {img.format}, Mode: {img.mode}, Taille: {img.size}")
        
        # Redimensionner l'image
        img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
        print(f"[INFO] Image redimensionnée à: {target_size}")
        
        # Convertir en array numpy
        img_array = np.array(img_resized, dtype=np.float32)
        
        # Normaliser les valeurs de pixel (0-255 -> 0-1)
        img_array = img_array / 255.0
        
        # Ajouter une dimension batch si nécessaire
        if len(img_array.shape) == 3:
            img_array = np.expand_dims(img_array, axis=0)
            print(f"[INFO] Forme finale de l'image: {img_array.shape}")
        
        return img_array
    except Exception as e:
        print(f"[ERREUR] Erreur lors du traitement de l'image: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_model(model_path, image_path):
    """Test le modèle avec une image"""
    print("\n" + "="*60)
    print("TEST DU MODELE AI")
    print("="*60 + "\n")
    
    # Charger le modèle
    try:
        import tensorflow as tf
    except ImportError:
        print("[ERREUR] TensorFlow n'est pas installé")
        return False
    
    if not os.path.exists(model_path):
        print(f"[ERREUR] Modèle non trouvé: {model_path}")
        return False
    
    print(f"[INFO] Chargement du modèle: {model_path}")
    try:
        model = tf.keras.models.load_model(model_path)
        print(f"[SUCCES] Modèle chargé")
        print(f"[INFO] Architecture du modèle:")
        print(f"  - Entrée: {model.input_shape}")
        print(f"  - Sortie: {model.output_shape}")
        print(f"  - Nombre de paramètres: {model.count_params():,}")
    except Exception as e:
        print(f"[ERREUR] Erreur lors du chargement du modèle: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Charger et prétraiter l'image
    print(f"\n[INFO] Chargement de l'image: {image_path}")
    img_array = load_image(image_path)
    if img_array is None:
        return False
    
    # Prédiction
    print("\n[INFO] Exécution de la prédiction...")
    try:
        predictions = model.predict(img_array, verbose=0)
        print(f"[SUCCES] Prédiction complétée")
        print(f"[INFO] Forme des prédictions: {predictions.shape}")
        print(f"[INFO] Type de sortie: {predictions.dtype}")
        
        # Afficher les résultats
        print("\n[RESULTATS]")
        if predictions.shape[-1] > 1:
            # Classification multi-classe
            print(f"Prédictions brutes (premiers 10 éléments):\n{predictions[0][:10]}")
            top_indices = np.argsort(predictions[0])[-5:][::-1]
            print(f"\nTop 5 classes (indices): {top_indices}")
            print(f"Top 5 scores: {predictions[0][top_indices]}")
            max_idx = np.argmax(predictions[0])
            print(f"\nClasse prédite (index): {max_idx}")
            print(f"Confiance: {predictions[0][max_idx]:.4f} ({predictions[0][max_idx]*100:.2f}%)")
        else:
            # Classification binaire ou régression
            print(f"Prédiction: {predictions[0][0]:.4f}")
        
        return True
    except Exception as e:
        print(f"[ERREUR] Erreur lors de la prédiction: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    root_dir = Path(__file__).parent
    
    # Chercher le modèle
    models_dir = root_dir / "models"
    available_models = list(models_dir.glob("*.keras"))
    
    if not available_models:
        print("[ERREUR] Aucun modèle .keras trouvé dans models/")
        return
    
    # Utiliser le premier modèle trouvé (ou le plus récent)
    model_path = available_models[0]
    print(f"[INFO] Modèles disponibles: {[m.name for m in available_models]}")
    print(f"[INFO] Utilisation du modèle: {model_path.name}")
    
    # Image de test
    image_path = root_dir / "ima.jpg"
    
    # Tester le modèle
    success = test_model(str(model_path), str(image_path))
    
    if success:
        print("\n" + "="*60)
        print("[SUCCES] Test du modèle terminé avec succès!")
        print("="*60)
    else:
        print("\n" + "="*60)
        print("[ECHEC] Le test du modèle a échoué")
        print("="*60)
        sys.exit(1)

if __name__ == "__main__":
    main()
