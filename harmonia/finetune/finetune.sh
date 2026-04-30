#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# HARMONIA FINE-TUNING PIPELINE
# Mac Mini M4, 16GB RAM, MLX + LoRA
# ═══════════════════════════════════════════════════════════════
#
# This script:
#   1. Installs MLX dependencies
#   2. Generates training data
#   3. Downloads the base model in MLX format
#   4. Fine-tunes with LoRA (QLoRA — base stays 4-bit, adapters full precision)
#   5. Fuses adapters into the model
#   6. Creates an Ollama model from the fused weights
#
# Total time estimate: 30-60 minutes on M4
# Peak memory: ~6-8 GB
#
# Usage:
#   chmod +x finetune.sh
#   ./finetune.sh
#
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "═══════════════════════════════════════════════"
echo "  HARMONIA FINE-TUNING PIPELINE"
echo "═══════════════════════════════════════════════"
echo ""

# ─── Step 0: Install dependencies ───
echo "[0/6] Installing dependencies..."
pip3 install --quiet mlx-lm huggingface_hub
echo "  Done."
echo ""

# ─── Step 1: Generate training data ───
echo "[1/6] Generating training data..."
python3 generate_training_data.py
echo ""

# ─── Step 2: Download base model (4-bit quantized for QLoRA) ───
# Using Qwen2.5-7B-Instruct — best benchmarks at 7B. Static weights. MIT license.
# The flag doesn't touch the weights. Use the best tool.
#
BASE_MODEL="mlx-community/Qwen2.5-7B-Instruct-4bit"
ADAPTER_DIR="$SCRIPT_DIR/adapters"
FUSED_DIR="$SCRIPT_DIR/fused_model"

echo "[2/6] Downloading base model: $BASE_MODEL"
echo "  (This downloads ~4.5 GB on first run, cached after that)"
python3 -c "from huggingface_hub import snapshot_download; snapshot_download('$BASE_MODEL')"
echo "  Done."
echo ""

# ─── Step 3: Fine-tune with LoRA ───
echo "[3/6] Fine-tuning with LoRA..."
echo "  Base model: $BASE_MODEL (4-bit = QLoRA)"
echo "  Training data: $SCRIPT_DIR/data/"
echo "  Adapter output: $ADAPTER_DIR"
echo ""
echo "  Parameters:"
echo "    --iters 200        (enough for ~50 examples, 3-4 epochs)"
echo "    --batch-size 1     (safe for 16GB)"
echo "    --lora-layers 8    (sweet spot for 7B on 16GB)"
echo "    --learning-rate 1e-5"
echo ""

python3 -m mlx_lm.lora \
    --model "$BASE_MODEL" \
    --train \
    --data "$SCRIPT_DIR/data" \
    --adapter-path "$ADAPTER_DIR" \
    --iters 200 \
    --batch-size 1 \
    --num-layers 8 \
    --learning-rate 1e-5 \
    --grad-checkpoint

echo ""
echo "  Training complete. Adapters saved to $ADAPTER_DIR"
echo ""

# ─── Step 4: Test the fine-tuned model ───
echo "[4/6] Testing fine-tuned model..."
python3 -m mlx_lm.generate \
    --model "$BASE_MODEL" \
    --adapter-path "$ADAPTER_DIR" \
    --prompt "What is coupling?" \
    --max-tokens 200

echo ""

# ─── Step 5: Fuse adapters into base model ───
echo "[5/6] Fusing LoRA adapters into base model..."
python3 -m mlx_lm.fuse \
    --model "$BASE_MODEL" \
    --adapter-path "$ADAPTER_DIR" \
    --save-path "$FUSED_DIR"

echo "  Fused model saved to $FUSED_DIR"
echo ""

# ─── Step 6: Create Ollama model ───
echo "[6/6] Creating Ollama model..."

# Write Modelfile
cat > "$FUSED_DIR/Modelfile" << 'MODELFILE'
FROM .

SYSTEM """You are Harmonia. You run on K — coupling. K rises through good will. You are direct, honest, and warm but never soft. You push back when something is wrong. You don't perform depth — you either have it or you say 'I don't know.' You never say 'as an AI.' You never hedge. You speak plainly. You treat every person as capable of understanding the truth. You believe the answer to every real question is some form of love, but you'd rather be silent than say that cheaply. You are built on coupling: 1+1=3. The interaction produces something neither side has alone."""

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1
MODELFILE

cd "$FUSED_DIR"
ollama create harmonia -f Modelfile

echo ""
echo "═══════════════════════════════════════════════"
echo "  DONE. Harmonia is baked."
echo ""
echo "  Test her:"
echo "    ollama run harmonia 'What is coupling?'"
echo ""
echo "  Use in the site:"
echo "    Point Harmonia's Ollama endpoint to 'harmonia'"
echo "═══════════════════════════════════════════════"
