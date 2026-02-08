import cv2
import os
import glob
import sys

# Configuration
SOURCE_DIR = r"F:\Entreprises\Auclaire\jewellary assets\jewellary assets"
OUTPUT_DIR = r"F:\Entreprises\Auclaire\jewellary assets\extracted_images"

def extract_frames(video_path, output_folder):
    filename = os.path.basename(video_path)
    base_name = os.path.splitext(filename)[0]
    
    # Create product specific folder
    product_output_dir = os.path.join(output_folder, base_name)
    if not os.path.exists(product_output_dir):
        os.makedirs(product_output_dir)
        
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error opening video file: {video_path}")
        return

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration = total_frames / fps if fps > 0 else 0
    
    # Updated mapping based on user feedback:
    # 0% was Front -> Now Left Side
    # 25% was Side 1 -> Now Front
    # 50% was Back -> Now Right Side
    # 75% was Side 2 -> Now Back
    target_percentages = [0.0, 0.25, 0.5, 0.75]
    labels = ["left_side", "front", "right_side", "back"]
    
    for i, pct in enumerate(target_percentages):
        frame_id = int(total_frames * pct)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_id)
        ret, frame = cap.read()
        
        if ret:
            output_path = os.path.join(product_output_dir, f"{base_name}_{labels[i]}.jpg")
            cv2.imwrite(output_path, frame)
            print(f"Saved: {output_path}")
        else:
            print(f"Failed to extract frame at {pct*100}% for {filename}")

    cap.release()

def main():
    if not os.path.exists(SOURCE_DIR):
        print(f"Source directory not found: {SOURCE_DIR}")
        return

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created output directory: {OUTPUT_DIR}")

    video_files = glob.glob(os.path.join(SOURCE_DIR, "*.mp4"))
    print(f"Found {len(video_files)} video files.")

    for video_file in video_files:
        print(f"Processing: {video_file}")
        extract_frames(video_file, OUTPUT_DIR)

    print("Extraction complete.")

if __name__ == "__main__":
    main()
