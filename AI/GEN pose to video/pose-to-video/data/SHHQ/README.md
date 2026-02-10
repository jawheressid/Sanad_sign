# SHHQ: high-quality full-body human images

This dataset includes various humans, not signing. 
The dataset is available [here](https://github.com/stylegan-human/StyleGAN-Human/blob/main/docs/Dataset.md).

## Data Processing

Then, run the `shhq_to_images` util file to convert the files into a zip file of green screen images:

```bash
python shhq_to_images.py \
    --raw_img_dir=SHHQ-1.0/no_segment \
    --raw_seg_dir=SHHQ-1.0/segments \
    --output_path=frames.zip \
    --resolution=512
```
