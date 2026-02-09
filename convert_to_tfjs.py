#!/usr/bin/env python3
"""
Script pour convertir les modèles Keras (.keras) en TensorFlow.js
Pour utilisation dans le navigateur web
"""

import os
import sys
import argparse
from pathlib import Path

def check_tensorflowjs():
    """
    Vérifie si tensorflowjs est installé
    """
    try:
        import tensorflowjs as tfjs
        print(f"[OK] TensorFlow.js converter version {tfjs.__version__}")
        return True
    except ImportError:
        print("[ERREUR] tensorflowjs n'est pas installé!")
        print("\nPour installer, exécutez:")
        print("  pip install tensorflowjs")
        return False

def convert_model(model_path, output_dir, quantization=None):
    """
    Convertit un modèle Keras en TensorFlow.js
    
    Args:
        model_path: Chemin vers le modèle .keras
        output_dir: Dossier de sortie pour le modèle tfjs
        quantization: Type de quantization ('uint8', 'uint16', ou None)
    """
    import tensorflowjs as tfjs
    
    print(f"\n{'='*70}")
    print(f"Conversion: {os.path.basename(model_path)}")
    print(f"{'='*70}")
    
    # Vérifier que le modèle existe
    if not os.path.exists(model_path):
        print(f"[ERREUR] Le modèle {model_path} n'existe pas!")
        return False
    
    # Créer le dossier de sortie
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"[INFO] Modèle source: {model_path}")
    print(f"[INFO] Dossier de sortie: {output_dir}")
    print(f"[INFO] Quantization: {quantization if quantization else 'Aucune'}")
    
    try:
        # Options de conversion
        kwargs = {}
        if quantization:
            if quantization == 'uint8':
                kwargs['quantization_dtype_map'] = {
                    'uint8': '*'
                }
                print("[INFO] Quantization uint8: réduction de ~75% de la taille")
            elif quantization == 'uint16':
                kwargs['quantization_dtype_map'] = {
                    'uint16': '*'
                }
                print("[INFO] Quantization uint16: réduction de ~50% de la taille")
        
        # Conversion
        print("\n[INFO] Conversion en cours...")
        tfjs.converters.convert_tf_keras_model(
            model_path,
            output_dir,
            **kwargs
        )
        
        print("[OK] Conversion réussie!")
        
        # Afficher les fichiers créés
        print("\n[INFO] Fichiers créés:")
        output_files = sorted(os.listdir(output_dir))
        total_size = 0
        for file in output_files:
            file_path = os.path.join(output_dir, file)
            size = os.path.getsize(file_path)
            total_size += size
            print(f"  - {file} ({size / 1024:.2f} KB)")
        
        print(f"\n[INFO] Taille totale: {total_size / (1024*1024):.2f} MB")
        
        return True
        
    except Exception as e:
        print(f"[ERREUR] Échec de la conversion: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    parser = argparse.ArgumentParser(
        description="Convertir des modèles Keras en TensorFlow.js"
    )
    parser.add_argument(
        '--model',
        type=str,
        help='Chemin vers le modèle .keras (défaut: tous les modèles dans models/)'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='tfjs_models',
        help='Dossier de sortie (défaut: tfjs_models/)'
    )
    parser.add_argument(
        '--quantize',
        type=str,
        choices=['uint8', 'uint16'],
        help='Quantization pour réduire la taille (uint8 ou uint16)'
    )
    
    args = parser.parse_args()
    
    print("="*70)
    print("CONVERSION DE MODELES KERAS VERS TENSORFLOW.JS")
    print("="*70)
    
    # Vérifier tensorflowjs
    if not check_tensorflowjs():
        sys.exit(1)
    
    # Déterminer les modèles à convertir
    models_to_convert = []
    
    if args.model:
        # Modèle spécifique
        models_to_convert.append(args.model)
    else:
        # Tous les modèles dans models/
        models_dir = "models"
        if not os.path.exists(models_dir):
            print(f"[ERREUR] Dossier {models_dir} non trouvé!")
            sys.exit(1)
        
        for file in os.listdir(models_dir):
            if file.endswith('.keras'):
                models_to_convert.append(os.path.join(models_dir, file))
    
    if not models_to_convert:
        print("[ERREUR] Aucun modèle à convertir!")
        sys.exit(1)
    
    print(f"\n[INFO] {len(models_to_convert)} modèle(s) à convertir:")
    for model in models_to_convert:
        print(f"  - {model}")
    
    # Convertir chaque modèle
    success_count = 0
    for model_path in models_to_convert:
        model_name = Path(model_path).stem
        output_dir = os.path.join(args.output, model_name)
        
        if convert_model(model_path, output_dir, args.quantize):
            success_count += 1
    
    # Résumé
    print("\n" + "="*70)
    print("RÉSUMÉ")
    print("="*70)
    print(f"[INFO] Conversions réussies: {success_count}/{len(models_to_convert)}")
    
    if success_count > 0:
        print(f"\n[INFO] Modèles TensorFlow.js disponibles dans: {args.output}/")
        print("\n[INFO] Pour utiliser dans le navigateur:")
        print("  1. Copiez le dossier de sortie dans votre projet web")
        print("  2. Chargez le modèle avec:")
        print("     const model = await tf.loadGraphModel('chemin/vers/model.json');")
        print("  3. Utilisez pour la prédiction:")
        print("     const prediction = await model.predict(tensor);")

if __name__ == "__main__":
    main()
